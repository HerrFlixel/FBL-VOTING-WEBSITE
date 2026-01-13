import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

type Row = Record<string, any>

function parseNumber(value: any): number {
  const n = Number(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
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
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Excel-Datei enthält keine Daten' }, { status: 400 })
    }

    let created = 0
    let updated = 0

    for (const row of rows) {
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
      
      // Position (GK, LD, etc.) ist nicht in der Excel-Datei, bleibt null
      const position = null

      // Prüfe, ob es den Spieler mit gleichem Namen + Liga + Team schon gibt
      const existing = await prisma.player.findFirst({
        where: {
          name,
          league,
          team: team ?? undefined
        }
      })

      if (existing) {
        await prisma.player.update({
          where: { id: existing.id },
          data: {
            team,
            league,
            position: position || existing.position,
            scorerRank: scorerRank || existing.scorerRank,
            games,
            goals,
            assists,
            points,
            pim2,
            pim2x2,
            pim10,
            pimMatch
          }
        })
        updated++
      } else {
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
            pimMatch
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


