import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getVoterInfo } from '../../../lib/voter'
import { withDbRetry } from '../../../lib/db-retry'
import { checkRateLimit } from '../../../lib/rate-limit'

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
    console.log('[RefereeVotes POST] voterId:', voterId)
    const limiter = checkRateLimit({
      key: `vote:referee:${voterId}:${ip}`,
      limit: 50,
      windowMs: 60 * 1000
    })
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte kurz warten und erneut versuchen.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
      )
    }

    // Prüfe, ob bereits ein Vote existiert
    const existing = await prisma.refereePairVote.findFirst({
      where: {
        voterId,
        userId: null
      }
    })

    const vote = await withDbRetry(async () => {
      if (existing) {
        return prisma.refereePairVote.update({
          where: { id: existing.id },
          data: { refereePairId },
          include: { refereePair: true }
        })
      }
      return prisma.refereePairVote.create({
        data: {
          refereePairId,
          voterId,
          voterIp: ip,
          league: null,
          points: 1
        },
        include: { refereePair: true }
      })
    })

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

