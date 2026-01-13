import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league') || undefined

  try {
    const players = await prisma.player.findMany({
      where: league ? { league } : undefined,
      orderBy: [
        { scorerRank: 'asc' },
        { name: 'asc' }
      ]
    })
    return NextResponse.json(players)
  } catch (error) {
    console.error('Fehler beim Laden der Spieler', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Spieler' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, team, league, position, imageUrl, jerseyNumber, goals, assists, points, games, scorerRank, pim2, pim2x2, pim10, pimMatch } = data

    if (!name || !league) {
      return NextResponse.json({ error: 'Name und Liga sind erforderlich' }, { status: 400 })
    }

    const player = await prisma.player.create({
      data: {
        name,
        team,
        league,
        position,
        imageUrl,
        jerseyNumber,
        goals: goals ?? 0,
        assists: assists ?? 0,
        points: points ?? 0,
        games: games ?? 0,
        scorerRank: scorerRank ?? null,
        pim2: pim2 ?? 0,
        pim2x2: pim2x2 ?? 0,
        pim10: pim10 ?? 0,
        pimMatch: pimMatch ?? 0
      }
    })

    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Anlegen des Spielers', error)
    return NextResponse.json({ error: 'Fehler beim Anlegen des Spielers' }, { status: 500 })
  }
}


