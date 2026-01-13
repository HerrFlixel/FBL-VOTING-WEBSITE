import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const player = await prisma.player.findUnique({
      where: { id }
    })
    if (!player) {
      return NextResponse.json({ error: 'Spieler nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json(player)
  } catch (error) {
    console.error('Fehler beim Laden des Spielers', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Spielers' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const data = await req.json()
    const {
      name,
      team,
      league,
      position,
      imageUrl,
      jerseyNumber,
      goals,
      assists,
      points,
      games,
      scorerRank,
      pim2,
      pim2x2,
      pim10,
      pimMatch
    } = data

    const player = await prisma.player.update({
      where: { id },
      data: {
        name,
        team,
        league,
        position,
        imageUrl,
        jerseyNumber,
        goals,
        assists,
        points,
        games,
        scorerRank,
        pim2,
        pim2x2,
        pim10,
        pimMatch
      }
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Spielers', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Spielers' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    await prisma.player.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen des Spielers', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Spielers' }, { status: 500 })
  }
}
