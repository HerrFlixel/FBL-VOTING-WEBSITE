import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getVoterInfo } from '../../../lib/voter'

export async function GET(req: Request) {
  const { voterId } = getVoterInfo()

  try {
    const vote = await prisma.refereePairVote.findFirst({
      where: {
        voterId,
        userId: null
      },
      include: {
        refereePair: true
      }
    })
    return NextResponse.json(vote)
  } catch (error) {
    console.error('Fehler beim Laden der Schiedsrichter-Votes', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Votes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { refereePairId } = body as {
      refereePairId: string
    }

    if (!refereePairId) {
      return NextResponse.json({ error: 'refereePairId ist erforderlich' }, { status: 400 })
    }

    const { voterId, ip } = getVoterInfo()

    // Prüfe, ob bereits ein Vote existiert
    const existing = await prisma.refereePairVote.findFirst({
      where: {
        voterId,
        userId: null
      }
    })

    let vote
    if (existing) {
      // Update existing vote
      vote = await prisma.refereePairVote.update({
        where: { id: existing.id },
        data: {
          refereePairId
        },
        include: { refereePair: true }
      })
    } else {
      // Create new vote
      vote = await prisma.refereePairVote.create({
        data: {
          refereePairId,
          voterId,
          voterIp: ip,
          league: null,
          points: 1
        },
        include: { refereePair: true }
      })
    }

    return NextResponse.json(vote)
  } catch (error: any) {
    console.error('Fehler beim Speichern der Schiedsrichter-Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Speichern der Votes' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { voterId } = getVoterInfo()

    const existing = await prisma.refereePairVote.findFirst({
      where: {
        voterId,
        userId: null
      }
    })

    if (existing) {
      await prisma.refereePairVote.delete({
        where: { id: existing.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Fehler beim Löschen der Schiedsrichter-Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Löschen der Votes' },
      { status: 500 }
    )
  }
}

