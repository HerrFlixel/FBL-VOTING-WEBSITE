import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(req: Request) {
  try {
    const pairs = await prisma.refereePair.findMany({
      orderBy: [{ name: 'asc' }]
    })
    return NextResponse.json(pairs)
  } catch (error) {
    console.error('Fehler beim Laden der Schiedsrichter-Paare', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Schiedsrichter-Paare' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, imageUrl } = data
    if (!name) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }
    const pair = await prisma.refereePair.create({
      data: {
        name,
        imageUrl: imageUrl || null,
        league: undefined // Liga-unspezifisch
      }
    })
    return NextResponse.json(pair, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Anlegen des Schiedsrichter-Paares', error)
    return NextResponse.json({ error: 'Fehler beim Anlegen des Schiedsrichter-Paares' }, { status: 500 })
  }
}

