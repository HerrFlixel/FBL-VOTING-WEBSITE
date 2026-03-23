import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getVoterInfo } from '../../../lib/voter'
import { withDbRetry } from '../../../lib/db-retry'
import { normalizeTeamLogoUrl } from '../../../lib/upload-urls'
import { normalizeTeamNameForLogoMatch } from '../../../lib/team-name'
import { checkRateLimit } from '../../../lib/rate-limit'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league') || 'herren'
  const { voterId } = getVoterInfo()

  try {
    const vote = await prisma.coachVote.findFirst({
      where: {
        voterId,
        userId: null,
        league
      },
      include: {
        coach: true
      }
    })
    if (!vote) return NextResponse.json(null)

    // Coach-Voting UI soll Team-Logo anzeigen, auch wenn coach.imageUrl leer ist.
    const teams = await prisma.team.findMany({ select: { name: true, logoUrl: true } })
    const teamLogoByName = Object.fromEntries(
      teams
        .filter((t) => t.logoUrl)
        .map((t) => [normalizeTeamNameForLogoMatch(t.name), normalizeTeamLogoUrl(t.logoUrl)!])
    )

    const teamKey = normalizeTeamNameForLogoMatch(vote.coach.team)
    const teamLogoUrl = teamKey ? (teamLogoByName[teamKey] ?? null) : null

    return NextResponse.json({
      ...vote,
      coach: {
        ...vote.coach,
        teamLogoUrl
      }
    })
  } catch (error) {
    console.error('Fehler beim Laden der Coach-Votes', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Votes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { coachId, league } = body as {
      coachId: string
      league: string
    }

    if (!coachId || !league) {
      return NextResponse.json({ error: 'coachId, league sind erforderlich' }, { status: 400 })
    }

    const { voterId, ip } = getVoterInfo()
    const limiter = checkRateLimit({
      key: `vote:coach:${league}:${voterId}:${ip}`,
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
    const existing = await prisma.coachVote.findFirst({
      where: {
        voterId,
        userId: null,
        league
      }
    })

    const vote = await withDbRetry(async () => {
      if (existing) {
        return prisma.coachVote.update({
          where: { id: existing.id },
          data: { coachId },
          include: { coach: true }
        })
      }
      return prisma.coachVote.create({
        data: {
          coachId,
          voterId,
          voterIp: ip,
          league,
          points: 1
        },
        include: { coach: true }
      })
    })

    return NextResponse.json(vote)
  } catch (error: any) {
    console.error('Fehler beim Speichern der Coach-Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Speichern der Votes' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { league } = body as {
      league: string
    }

    if (!league) {
      return NextResponse.json({ error: 'league ist erforderlich' }, { status: 400 })
    }

    const { voterId } = getVoterInfo()

    const existing = await prisma.coachVote.findFirst({
      where: {
        voterId,
        userId: null,
        league
      }
    })

    if (existing) {
      await prisma.coachVote.delete({
        where: { id: existing.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Fehler beim Löschen der Coach-Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Löschen der Votes' },
      { status: 500 }
    )
  }
}

