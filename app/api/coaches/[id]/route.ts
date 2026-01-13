import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const data = await req.json()
    const { name, team, league, imageUrl } = data
    const coach = await prisma.coach.update({
      where: { id },
      data: { name, team, league, imageUrl }
    })
    return NextResponse.json(coach)
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Coaches', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Coaches' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    await prisma.coach.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen des Coaches', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Coaches' }, { status: 500 })
  }
}


