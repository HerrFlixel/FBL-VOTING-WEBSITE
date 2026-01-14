import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Lösche zuerst alle Votes, die auf dieses Schiedsrichter-Paar verweisen
    await prisma.refereePairVote.deleteMany({
      where: { refereePairId: id }
    })
    
    // Dann lösche das Schiedsrichter-Paar selbst
    await prisma.refereePair.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Fehler beim Löschen des Schiedsrichter-Paars', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Löschen des Schiedsrichter-Paars' },
      { status: 500 }
    )
  }
}

