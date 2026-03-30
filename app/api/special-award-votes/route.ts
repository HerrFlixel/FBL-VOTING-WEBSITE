import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getVoterInfo } from '../../../lib/voter'
import { withDbRetry } from '../../../lib/db-retry'
import { checkRateLimit } from '../../../lib/rate-limit'
import { isVotingClosed } from '../../../lib/voting-status'

export async function GET(req: Request) {
  const { voterId } = getVoterInfo()

  try {
    const vote = await prisma.specialAwardVote.findFirst({
      where: {
        voterId,
        userId: null
      }
    })
    return NextResponse.json(vote)
  } catch (error) {
    console.error('Fehler beim Laden der Special Award Votes', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Votes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (await isVotingClosed()) {
      return NextResponse.json({ error: 'Voting ist geschlossen.' }, { status: 403 })
    }
    const body = await req.json()
    const { name } = body as {
      name: string
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    const { voterId, ip } = getVoterInfo()
    const limiter = checkRateLimit({
      key: `vote:special:${voterId}:${ip}`,
      limit: 30,
      windowMs: 60 * 1000
    })
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte kurz warten und erneut versuchen.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
      )
    }

    // Prüfe, ob bereits ein Vote existiert
    const existing = await prisma.specialAwardVote.findFirst({
      where: {
        voterId,
        userId: null
      }
    })

    const vote = await withDbRetry(async () => {
      if (existing) {
        return prisma.specialAwardVote.update({
          where: { id: existing.id },
          data: { name: name.trim(), league: null }
        })
      }
      return prisma.specialAwardVote.create({
        data: {
          name: name.trim(),
          voterId,
          voterIp: ip,
          league: null
        }
      })
    })

    return NextResponse.json(vote)
  } catch (error: any) {
    console.error('Fehler beim Speichern der Special Award Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Speichern der Votes' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    if (await isVotingClosed()) {
      return NextResponse.json({ error: 'Voting ist geschlossen.' }, { status: 403 })
    }
    const { voterId } = getVoterInfo()

    const existing = await prisma.specialAwardVote.findFirst({
      where: {
        voterId,
        userId: null
      }
    })

    if (existing) {
      await prisma.specialAwardVote.delete({
        where: { id: existing.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Fehler beim Löschen der Special Award Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Löschen der Votes' },
      { status: 500 }
    )
  }
}

