import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: { type: string; id: string } }
) {
  const { type, id } = params

  try {
    switch (type) {
      case 'allstar':
        await prisma.allstarVote.delete({ where: { id } })
        break
      case 'mvp':
        await prisma.mVPVote.delete({ where: { id } })
        break
      case 'coach':
        await prisma.coachVote.delete({ where: { id } })
        break
      case 'fairplay':
        await prisma.fairPlayVote.delete({ where: { id } })
        break
      case 'referee':
        await prisma.refereePairVote.delete({ where: { id } })
        break
      case 'special-award':
        await prisma.specialAwardVote.delete({ where: { id } })
        break
      default:
        return NextResponse.json({ error: 'Ungültiger Vote-Typ' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen des Votes', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Votes' }, { status: 500 })
  }
}

