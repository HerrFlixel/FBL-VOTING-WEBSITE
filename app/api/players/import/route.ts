import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import * as XLSX from 'xlsx'

type Row = Record<string, any>

function parseNumber(value: any): number {
  const n = Number(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function parseNullableNumber(value: any): number | null {
  const s = String(value ?? '').trim()
  if (!s) return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function getCell(row: Row, keys: string[]): any {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key]
  }
  return undefined
}

/** Zeilenobjekt aus Header + Rohzeile (gleiche Logik wie sheet_to_json, ohne Zeilenversatz). */
function rowFromRaw(headerRow: any[], rawRow: any[]): Row {
  const row: Row = {}
  headerRow.forEach((h, i) => {
    const key = String(h ?? '').trim()
    if (!key) return
    row[key] = rawRow[i]
  })
  return row
}

/** Erste Spalte, deren Header eines der Muster enthält (lowercase). */
function findColIndex(headerLower: string[], patterns: string[]): number {
  return headerLower.findIndex((h) => patterns.some((p) => h.includes(p)))
}

/** Rookie: X, x, Ja, 1, J → true; leer → false; Spalte fehlt → null (Import nicht gesetzt). */
function parseRookieFlag(value: any, columnPresent: boolean): boolean | null {
  if (!columnPresent) return null
  const s = String(value ?? '').trim()
  if (!s) return false
  const u = s.toUpperCase()
  if (u === 'X' || u === 'JA' || u === 'J' || u === '1' || u === 'YES' || u === 'Y') return true
  return false
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { fileBase64, league } = body as { fileBase64: string; league: string }

    if (!fileBase64 || !league) {
      return NextResponse.json({ error: 'fileBase64 und league sind erforderlich' }, { status: 400 })
    }

    if (league !== 'herren' && league !== 'damen') {
      return NextResponse.json({ error: 'league muss "herren" oder "damen" sein' }, { status: 400 })
    }

    let buffer: Buffer
    try {
      buffer = Buffer.from(fileBase64, 'base64')
    } catch (error) {
      return NextResponse.json({ error: 'Ungültige Base64-Datei' }, { status: 400 })
    }

    if (buffer.length === 0) {
      return NextResponse.json({ error: 'Datei ist leer' }, { status: 400 })
    }

    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' })
    } catch (error: any) {
      return NextResponse.json({ error: `Fehler beim Lesen der Excel-Datei: ${error.message}` }, { status: 400 })
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json({ error: 'Excel-Datei enthält keine Arbeitsblätter' }, { status: 400 })
    }

    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    /** Nur mit header:1 iterieren – vermeidet Zeilenversatz zu sheet_to_json (leere Zeilen). */
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (!rawRows.length || rawRows.length < 2) {
      return NextResponse.json({ error: 'Excel-Datei enthält keine Daten' }, { status: 400 })
    }

    let created = 0
    let updated = 0

    const headerRow = rawRows[0] ?? []
    const headerLower = headerRow.map((c) => String(c ?? '').toLowerCase().trim())

    // MS-Spalte (Match-Strafen)
    let msColIndex = headerLower.findIndex(
      (h) => h.includes('ms') && (h.includes('match') || h.includes('strafe'))
    )
    if (msColIndex < 0) {
      msColIndex = headerLower.findIndex((h) => h === 'ms' || h.startsWith('ms'))
    }
    if (msColIndex < 0) {
      msColIndex = headerLower.findIndex((h) => h.includes('ms'))
    }

    // Benannte Spalten (Fallback, falls nicht direkt rechts von MS)
    const trikotColIndex = findColIndex(headerLower, [
      'trikotnummer',
      'trikot',
      'trikotnr',
      'nr spieler',
      'spieler nr',
      'rückennummer'
    ])
    const rookieColIndex = findColIndex(headerLower, ['rookie'])
    const rolleColIndex = findColIndex(headerLower, ['rolle', 'o/d/g', 'o/d', 'position o', 'angriff'])

    for (let r = 1; r < rawRows.length; r++) {
      const rawRow = rawRows[r] ?? []
      // Komplett leere Zeile überspringen (wie sheet_to_json ohne header:1)
      const rowNonEmpty = rawRow.some((c) => String(c ?? '').trim() !== '')
      if (!rowNonEmpty) continue

      const row = rowFromRaw(headerRow, rawRow)

      let name = String(
        getCell(row, ['Spieler', 'Spielername', 'Name', 'Player']) ?? ''
      ).trim()

      name = name.replace(/^\d+\s+/, '').trim()

      if (!name) continue

      const team = String(getCell(row, ['Verein', 'Team', 'Club']) ?? '').trim() || null
      const scorerRank = parseNumber(getCell(row, ['Position', 'Position in der scorerliste', 'Rank', 'Pos']))
      const games = parseNumber(getCell(row, ['S', 'Spiele', 'Games']))
      const goals = parseNumber(getCell(row, ['T', 'Tore', 'Goals', 'G']))
      const assists = parseNumber(getCell(row, ['V', 'Vorlagen', 'Assists', 'A']))
      const points = parseNumber(getCell(row, ['P', 'Punkte', 'Points']))
      const pim2 = parseNumber(getCell(row, ["2'", "2min", '2', '2 min']))
      const pim2x2 = parseNumber(getCell(row, ["2'+2'", "2'+2'", '2+2', '2x2', '2+2 min']))
      const pim10 = parseNumber(getCell(row, ["10'", '10min', '10', '10 min']))
      const msValue = getCell(row, ['MS', 'Match', 'Matchstrafe'])
      const pimMatch = msValue ? parseNumber(String(msValue).split('-')[0]) : 0

      // Trikot: benannte Spalte > Zelle direkt nach MS
      let jerseyNumberFromExcel: number | null = null
      if (trikotColIndex >= 0) {
        jerseyNumberFromExcel = parseNullableNumber(rawRow[trikotColIndex])
      } else if (msColIndex >= 0) {
        jerseyNumberFromExcel = parseNullableNumber(rawRow[msColIndex + 1])
      } else {
        jerseyNumberFromExcel = parseNullableNumber(
          getCell(row, ['Trikot', 'Trikotnummer', 'Nr', 'Nr.', '#'])
        )
      }

      // Rookie
      let rookieFromExcel: boolean | null = null
      if (rookieColIndex >= 0) {
        rookieFromExcel = parseRookieFlag(rawRow[rookieColIndex], true)
      } else if (msColIndex >= 0) {
        rookieFromExcel = parseRookieFlag(rawRow[msColIndex + 2], true)
      } else {
        const v = getCell(row, ['Rookie'])
        if (v !== undefined) rookieFromExcel = parseRookieFlag(v, true)
      }

      // Rolle O/D/G
      let roleFromExcel: string | null = null
      if (rolleColIndex >= 0) {
        const roleFromExcelRaw = String(rawRow[rolleColIndex] ?? '').trim().toUpperCase()
        const ch = roleFromExcelRaw ? roleFromExcelRaw[0] : ''
        roleFromExcel = ['O', 'D', 'G'].includes(ch) ? ch : null
      } else if (msColIndex >= 0) {
        const roleFromExcelRaw = String(rawRow[msColIndex + 3] ?? '').trim().toUpperCase()
        const ch = roleFromExcelRaw ? roleFromExcelRaw[0] : ''
        roleFromExcel = ['O', 'D', 'G'].includes(ch) ? ch : null
      } else {
        const v = getCell(row, ['Rolle', 'O/D/G', 'Position Rolle'])
        if (v !== undefined && v !== '') {
          const ch = String(v).trim().toUpperCase()[0] || ''
          roleFromExcel = ['O', 'D', 'G'].includes(ch) ? ch : null
        }
      }

      const position = roleFromExcel

      const existing = await prisma.player.findFirst({
        where: {
          name,
          league,
          team: team ?? undefined
        }
      })

      if (existing) {
        const rookieCandidateDamen =
          rookieFromExcel === null ? existing.rookieCandidateDamen : league === 'damen' ? rookieFromExcel : false
        const rookieCandidateHerren =
          rookieFromExcel === null ? existing.rookieCandidateHerren : league === 'herren' ? rookieFromExcel : false

        await prisma.player.update({
          where: { id: existing.id },
          data: {
            team,
            league,
            position: position ?? existing.position,
            scorerRank: scorerRank || existing.scorerRank,
            games,
            goals,
            assists,
            points,
            pim2,
            pim2x2,
            pim10,
            pimMatch,
            jerseyNumber: jerseyNumberFromExcel ?? existing.jerseyNumber,
            rookieCandidateDamen,
            rookieCandidateHerren
          }
        })
        updated++
      } else {
        const rookieCandidateDamen = rookieFromExcel === null ? false : league === 'damen' ? rookieFromExcel : false
        const rookieCandidateHerren = rookieFromExcel === null ? false : league === 'herren' ? rookieFromExcel : false

        await prisma.player.create({
          data: {
            name,
            team,
            league,
            position,
            scorerRank: scorerRank || null,
            games,
            goals,
            assists,
            points,
            pim2,
            pim2x2,
            pim10,
            pimMatch,
            jerseyNumber: jerseyNumberFromExcel,
            rookieCandidateDamen,
            rookieCandidateHerren
          }
        })
        created++
      }
    }

    return NextResponse.json({ created, updated })
  } catch (error: any) {
    console.error('Fehler beim Importieren der Spieler', error)
    const errorMessage = error?.message || 'Unbekannter Fehler'
    return NextResponse.json(
      { error: `Fehler beim Importieren der Spieler: ${errorMessage}` },
      { status: 500 }
    )
  }
}
