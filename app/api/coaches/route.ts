import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league') || undefined
  try {
    const coaches = await prisma.coach.findMany({
      where: league ? { league } : undefined,
      orderBy: [{ name: 'asc' }]
    })
    return NextResponse.json(coaches)
  } catch (error) {
    console.error('Fehler beim Laden der Coaches', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Coaches' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, team, league, imageUrl } = data
    if (!name || !league) {
      return NextResponse.json({ error: 'Name und Liga sind erforderlich' }, { status: 400 })
    }
    const coach = await prisma.coach.create({
      data: {
        name,
        team,
        league,
        imageUrl
      }
    })
    return NextResponse.json(coach, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Anlegen des Coaches', error)
    return NextResponse.json({ error: 'Fehler beim Anlegen des Coaches' }, { status: 500 })
  }
}


