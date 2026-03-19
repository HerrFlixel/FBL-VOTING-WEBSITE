import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { normalizeTeamLogoUrl } from '../../../../lib/upload-urls'
import { normalizeTeamNameForLogoMatch } from '../../../../lib/team-name'

const leagues = ['herren', 'damen'] as const

function normalizeNameToKey(name: string | null | undefined) {
  return normalizeTeamNameForLogoMatch(name)
}

export async function GET() {
  try {
    const teams = await prisma.team.findMany({ select: { id: true, name: true, logoUrl: true } })
    const teamLogoByName = Object.fromEntries(
      teams
        .filter((t) => t.logoUrl)
        .map((t) => [normalizeTeamNameForLogoMatch(t.name), normalizeTeamLogoUrl(t.logoUrl)!])
    ) as Record<string, string | null>

    const [players, coaches, refereePairs, users] = await Promise.all([
      prisma.player.findMany({
        select: {
          id: true,
          name: true,
          team: true,
          league: true,
          position: true,
          imageUrl: true,
          jerseyNumber: true,
          goals: true,
          assists: true,
          points: true,
          games: true,
        }
      }),
      prisma.coach.findMany({
        select: {
          id: true,
          name: true,
          team: true,
          league: true,
          imageUrl: true,
        }
      }),
      prisma.refereePair.findMany({
        select: {
          id: true,
          name: true,
          league: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          voterId: true,
          voterIp: true,
          league: true,
          createdAt: true,
          team: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    const baseData = {
      teams,
      players,
      coaches: coaches.map((c) => {
        const teamKey = normalizeNameToKey(c.team)
        return {
          ...c,
          teamLogoUrl: teamKey ? (teamLogoByName[teamKey] ?? null) : null,
        }
      }),
      refereePairs,
      users
    }

    const categoryResults = {
      allstar: {},
      mvp: {},
      coach: {},
      fairplay: {},
      rookie: {},
      referee: {},
      specialAward: {},
    } as any

    for (const league of leagues) {
      const [allstarVotes, mvpVotes, coachVotes, fairplayVotes, rookieVotes] = await Promise.all([
        prisma.allstarVote.findMany({
          where: { league, userId: { not: null } },
          include: { player: true }
        }),
        prisma.mVPVote.findMany({
          where: { league, userId: { not: null } },
          include: { player: true }
        }),
        prisma.coachVote.findMany({
          where: { league, userId: { not: null } },
          include: { coach: true }
        }),
        prisma.fairPlayVote.findMany({
          where: { league, userId: { not: null } },
          include: { player: true }
        }),
        prisma.rookieVote.findMany({
          where: { league, userId: { not: null } },
          include: { player: true }
        }),
      ])

      const allstarPlayerMap = new Map<
        string,
        {
          player: (typeof allstarVotes)[number]['player']
          totalPoints: number
          line1Count: number
          line2Count: number
          line3Count: number
        }
      >()

      for (const vote of allstarVotes) {
        const existing = allstarPlayerMap.get(vote.playerId)
        if (existing) {
          existing.totalPoints += vote.points
          if (vote.line === 1) existing.line1Count++
          else if (vote.line === 2) existing.line2Count++
          else if (vote.line === 3) existing.line3Count++
        } else {
          allstarPlayerMap.set(vote.playerId, {
            player: vote.player,
            totalPoints: vote.points,
            line1Count: vote.line === 1 ? 1 : 0,
            line2Count: vote.line === 2 ? 1 : 0,
            line3Count: vote.line === 3 ? 1 : 0
          })
        }
      }

      const allstarBestList = Array.from(allstarPlayerMap.values())
        .map((r) => {
          const teamKey = normalizeNameToKey(r.player.team)
          const teamLogoUrl = teamKey ? (teamLogoByName[teamKey] ?? null) : null
          return {
            player: {
              id: r.player.id,
              name: r.player.name,
              team: r.player.team,
              imageUrl: r.player.imageUrl,
              teamLogoUrl
            },
            totalPoints: r.totalPoints,
            line1Count: r.line1Count,
            line2Count: r.line2Count,
            line3Count: r.line3Count,
          }
        })
        .sort((a, b) => b.totalPoints - a.totalPoints)

      categoryResults.allstar[league] = {
        totals: {
          totalFinalizedVotes: allstarVotes.length,
          totalPoints: allstarVotes.reduce((sum, v) => sum + v.points, 0),
        },
        bestList: allstarBestList,
        votesRaw: allstarVotes.map((v) => ({
          id: v.id,
          playerId: v.playerId,
          userId: v.userId,
          league: v.league,
          line: v.line,
          position: v.position,
          points: v.points,
          createdAt: v.createdAt
        }))
      }

      const mvpPlayerMap = new Map<
        string,
        {
          player: (typeof mvpVotes)[number]['player']
          totalPoints: number
          voteCount: number
        }
      >()

      for (const vote of mvpVotes) {
        const existing = mvpPlayerMap.get(vote.playerId)
        if (existing) {
          existing.totalPoints += vote.points
          existing.voteCount++
        } else {
          mvpPlayerMap.set(vote.playerId, {
            player: vote.player,
            totalPoints: vote.points,
            voteCount: 1
          })
        }
      }

      const mvpBestList = Array.from(mvpPlayerMap.values())
        .map((r) => {
          const teamKey = normalizeNameToKey(r.player.team)
          const teamLogoUrl = teamKey ? (teamLogoByName[teamKey] ?? null) : null
          return {
            player: {
              id: r.player.id,
              name: r.player.name,
              team: r.player.team,
              imageUrl: r.player.imageUrl,
              teamLogoUrl,
            },
            totalPoints: r.totalPoints,
            voteCount: r.voteCount,
          }
        })
        .sort((a, b) => b.totalPoints - a.totalPoints)

      categoryResults.mvp[league] = {
        totals: {
          totalFinalizedVotes: mvpVotes.length,
          totalPoints: mvpVotes.reduce((sum, v) => sum + v.points, 0),
        },
        bestList: mvpBestList,
        votesRaw: mvpVotes.map((v) => ({
          id: v.id,
          playerId: v.playerId,
          userId: v.userId,
          league: v.league,
          rank: v.rank,
          points: v.points,
          createdAt: v.createdAt
        }))
      }

      const coachMap = new Map<
        string,
        {
          coach: (typeof coachVotes)[number]['coach']
          voteCount: number
        }
      >()

      for (const vote of coachVotes) {
        const existing = coachMap.get(vote.coachId)
        if (existing) {
          existing.voteCount++
        } else {
          coachMap.set(vote.coachId, {
            coach: vote.coach,
            voteCount: 1
          })
        }
      }

      const coachBestList = Array.from(coachMap.values())
        .map((r) => {
          const teamKey = normalizeNameToKey(r.coach.team)
          const teamLogoUrl = teamKey ? (teamLogoByName[teamKey] ?? null) : null
          return {
            coach: {
              id: r.coach.id,
              name: r.coach.name,
              team: r.coach.team,
              imageUrl: r.coach.imageUrl,
              teamLogoUrl
            },
            voteCount: r.voteCount,
          }
        })
        .sort((a, b) => b.voteCount - a.voteCount)

      categoryResults.coach[league] = {
        totals: {
          totalFinalizedVotes: coachVotes.length
        },
        bestList: coachBestList,
        votesRaw: coachVotes.map((v) => ({
          id: v.id,
          coachId: v.coachId,
          userId: v.userId,
          league: v.league,
          points: v.points,
          createdAt: v.createdAt
        }))
      }

      const fpPlayerMap = new Map<
        string,
        {
          player: (typeof fairplayVotes)[number]['player']
          voteCount: number
        }
      >()

      for (const vote of fairplayVotes) {
        const existing = fpPlayerMap.get(vote.playerId)
        if (existing) existing.voteCount++
        else fpPlayerMap.set(vote.playerId, { player: vote.player, voteCount: 1 })
      }

      const fairplayBestList = Array.from(fpPlayerMap.values())
        .map((r) => {
          const teamKey = normalizeNameToKey(r.player.team)
          const teamLogoUrl = teamKey ? (teamLogoByName[teamKey] ?? null) : null
          return {
            player: {
              id: r.player.id,
              name: r.player.name,
              team: r.player.team,
              imageUrl: r.player.imageUrl,
              teamLogoUrl
            },
            voteCount: r.voteCount,
          }
        })
        .sort((a, b) => b.voteCount - a.voteCount)

      categoryResults.fairplay[league] = {
        totals: {
          totalFinalizedVotes: fairplayVotes.length
        },
        bestList: fairplayBestList,
        votesRaw: fairplayVotes.map((v) => ({
          id: v.id,
          playerId: v.playerId,
          userId: v.userId,
          league: v.league,
          points: v.points,
          createdAt: v.createdAt
        }))
      }

      const rookieMap = new Map<
        string,
        {
          player: (typeof rookieVotes)[number]['player']
          voteCount: number
        }
      >()

      for (const vote of rookieVotes) {
        const existing = rookieMap.get(vote.playerId)
        if (existing) existing.voteCount++
        else rookieMap.set(vote.playerId, { player: vote.player, voteCount: 1 })
      }

      const rookieBestList = Array.from(rookieMap.values())
        .map((r) => {
          const teamKey = normalizeNameToKey(r.player.team)
          const teamLogoUrl = teamKey ? (teamLogoByName[teamKey] ?? null) : null
          return {
            player: {
              id: r.player.id,
              name: r.player.name,
              team: r.player.team,
              imageUrl: r.player.imageUrl,
              teamLogoUrl
            },
            voteCount: r.voteCount
          }
        })
        .sort((a, b) => b.voteCount - a.voteCount)

      categoryResults.rookie[league] = {
        totals: {
          totalFinalizedVotes: rookieVotes.length
        },
        bestList: rookieBestList,
        votesRaw: rookieVotes.map((v) => ({
          id: v.id,
          playerId: v.playerId,
          userId: v.userId,
          league: v.league,
          points: v.points,
          createdAt: v.createdAt
        }))
      }
    }

    const refereeVotes = await prisma.refereePairVote.findMany({
      where: { userId: { not: null } },
      include: { refereePair: true }
    })

    const refereePairMap = new Map<
      string,
      {
        pair: (typeof refereeVotes)[number]['refereePair']
        voteCount: number
      }
    >()

    for (const vote of refereeVotes) {
      const existing = refereePairMap.get(vote.refereePairId)
      if (existing) existing.voteCount++
      else {
        refereePairMap.set(vote.refereePairId, { pair: vote.refereePair, voteCount: 1 })
      }
    }

    const refereeBestList = Array.from(refereePairMap.values())
      .map((r) => ({
        pair: {
          id: r.pair.id,
          name: r.pair.name,
          imageUrl: r.pair.imageUrl
        },
        voteCount: r.voteCount
      }))
      .sort((a, b) => b.voteCount - a.voteCount)

    categoryResults.referee = {
      totals: { totalFinalizedVotes: refereeVotes.length },
      bestList: refereeBestList,
      votesRaw: refereeVotes.map((v) => ({
        id: v.id,
        refereePairId: v.refereePairId,
        userId: v.userId,
        league: v.league,
        points: v.points,
        createdAt: v.createdAt
      }))
    }

    const specialVotes = await prisma.specialAwardVote.findMany({
      where: { userId: { not: null } },
      orderBy: { createdAt: 'desc' }
    })

    const specialGrouped = new Map<
      string,
      { name: string; count: number; votes: typeof specialVotes }
    >()

    for (const vote of specialVotes) {
      const key = vote.name.toLowerCase().trim()
      const existing = specialGrouped.get(key)
      if (existing) existing.count++
      else {
        specialGrouped.set(key, {
          name: vote.name,
          count: 1,
          // only to keep TS happy; we don't use votes field in the export bestList
          votes: [] as any
        })
      }
    }

    const specialBestList = Array.from(specialGrouped.values())
      .sort((a, b) => b.count - a.count)
      .map((r) => ({ name: r.name, voteCount: r.count }))

    categoryResults.specialAward = {
      totals: { totalFinalizedVotes: specialVotes.length },
      bestList: specialBestList,
      votesRaw: specialVotes.map((v) => ({
        id: v.id,
        name: v.name,
        league: v.league,
        userId: v.userId,
        points: 1,
        createdAt: v.createdAt
      }))
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      baseData,
      categories: categoryResults,
    })
  } catch (error) {
    console.error('Admin export failed', error)
    return NextResponse.json({ error: 'Admin export failed' }, { status: 500 })
  }
}

