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
    const rows: Row[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    // Roh-Daten inkl. Spaltenreihenfolge (für die 3 neuen Spalten nach "MS")
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Excel-Datei enthält keine Daten' }, { status: 400 })
    }

    let created = 0
    let updated = 0

    const headerRow = rawRows?.[0] ?? []
    const headerLower = headerRow.map((c) => String(c ?? '').toLowerCase())
    // Erwartung: "MS = Match Strafen" ist im Header vorhanden, und die 3 relevanten Spalten kommen direkt danach.
    let msColIndex = headerLower.findIndex((h) => h.includes('ms') && (h.includes('match') || h.includes('strafe')))
    if (msColIndex < 0) msColIndex = headerLower.findIndex((h) => h.includes('ms'))

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rawRow = rawRows?.[i + 1] ?? []

      // Spielername: kann "1 Florian Weißkirchen" oder nur "Florian Weißkirchen" sein
      let name = String(
        getCell(row, ['Spieler', 'Spielername', 'Name', 'Player']) ?? ''
      ).trim()
      
      // Entferne führende Nummer falls vorhanden (z.B. "1 Florian Weißkirchen" -> "Florian Weißkirchen")
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
      // MS kann "0-0" Format haben, extrahiere nur die erste Zahl
      const msValue = getCell(row, ['MS', 'Match', 'Matchstrafe'])
      const pimMatch = msValue ? parseNumber(String(msValue).split('-')[0]) : 0
      
      // Neue Spalten: nach MS kommt (1) Trikotnummer, (2) Rookie-X, (3) Rolle O/D/G
      const jerseyNumberFromExcel =
        msColIndex >= 0 ? parseNullableNumber(rawRow?.[msColIndex + 1]) : null
      const rookieFromExcel =
        msColIndex >= 0 ? String(rawRow?.[msColIndex + 2] ?? '').trim().toUpperCase() === 'X' : null
      const roleFromExcelRaw = msColIndex >= 0 ? String(rawRow?.[msColIndex + 3] ?? '').trim().toUpperCase() : ''
      const roleFromExcelChar = roleFromExcelRaw ? roleFromExcelRaw[0] : ''
      const roleFromExcel = ['O', 'D', 'G'].includes(roleFromExcelChar) ? roleFromExcelChar : null

      const position = roleFromExcel

      // Prüfe, ob es den Spieler mit gleichem Namen + Liga + Team schon gibt
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


