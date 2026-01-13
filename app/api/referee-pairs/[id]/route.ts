import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    await prisma.refereePair.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen des Schiedsrichter-Paars', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Schiedsrichter-Paars' }, { status: 500 })
  }
}

