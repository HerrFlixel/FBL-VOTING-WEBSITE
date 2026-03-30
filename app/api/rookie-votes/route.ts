import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getVoterInfo } from '../../../lib/voter'
import { withDbRetry } from '../../../lib/db-retry'
import { normalizeTeamLogoUrl } from '../../../lib/upload-urls'
import { normalizeTeamNameForLogoMatch } from '../../../lib/team-name'
import { checkRateLimit } from '../../../lib/rate-limit'
import { isVotingClosed } from '../../../lib/voting-status'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league') || 'herren'
  const { voterId } = getVoterInfo()

  try {
    const [vote, teams] = await Promise.all([
      prisma.rookieVote.findFirst({
        where: { voterId, userId: null, league },
        include: { player: true }
      }),
      prisma.team.findMany({ select: { name: true, logoUrl: true } })
    ])
    if (!vote) return NextResponse.json(vote)
    const teamLogoByName = Object.fromEntries(
      teams.filter((t) => t.logoUrl).map((t) => [normalizeTeamNameForLogoMatch(t.name), normalizeTeamLogoUrl(t.logoUrl)!])
    )
    const teamKey = normalizeTeamNameForLogoMatch(vote.player?.team)
    const teamLogoUrl = teamKey ? (teamLogoByName[teamKey] ?? null) : null
    const voteWithTeamLogo = { ...vote, player: vote.player ? { ...vote.player, teamLogoUrl } : vote.player }
    return NextResponse.json(voteWithTeamLogo)
  } catch (error) {
    console.error('Fehler beim Laden der Rookie Votes', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Votes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (await isVotingClosed()) {
      return NextResponse.json({ error: 'Voting ist geschlossen.' }, { status: 403 })
    }
    const body = await req.json()
    const { playerId, league } = body as {
      playerId: string
      league: string
    }

    if (!playerId || !league) {
      return NextResponse.json({ error: 'playerId, league sind erforderlich' }, { status: 400 })
    }

    const { voterId, ip } = getVoterInfo()
    const limiter = checkRateLimit({
      key: `vote:rookie:${league}:${voterId}:${ip}`,
      limit: 50,
      windowMs: 60 * 1000
    })
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte kurz warten und erneut versuchen.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
      )
    }

    const existing = await prisma.rookieVote.findFirst({
      where: {
        voterId,
        userId: null,
        league
      }
    })

    const vote = await withDbRetry(async () => {
      if (existing) {
        return prisma.rookieVote.update({
          where: { id: existing.id },
          data: { playerId },
          include: { player: true }
        })
      }
      return prisma.rookieVote.create({
        data: {
          playerId,
          voterId,
          voterIp: ip,
          league,
          points: 1
        },
        include: { player: true }
      })
    })

    return NextResponse.json(vote)
  } catch (error: any) {
    console.error('Fehler beim Speichern der Rookie Votes', error)
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
    const body = await req.json()
    const { league } = body as { league: string }

    if (!league) {
      return NextResponse.json({ error: 'league ist erforderlich' }, { status: 400 })
    }

    const { voterId } = getVoterInfo()

    const existing = await prisma.rookieVote.findFirst({
      where: { voterId, userId: null, league }
    })

    if (existing) {
      await prisma.rookieVote.delete({ where: { id: existing.id } })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Fehler beim Löschen der Rookie Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Löschen der Votes' },
      { status: 500 }
    )
  }
}
