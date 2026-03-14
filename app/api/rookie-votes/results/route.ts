import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { normalizeTeamLogoUrl } from '../../../../lib/upload-urls'
import { normalizeTeamNameForLogoMatch } from '../../../../lib/team-name'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league')

  if (!league) {
    return NextResponse.json({ error: 'league ist erforderlich' }, { status: 400 })
  }

  try {
    const votes = await prisma.rookieVote.findMany({
      where: {
        league,
        userId: { not: null }
      },
      include: { player: true }
    })

    const playerMap = new Map<string, {
      player: typeof votes[0]['player']
      voteCount: number
    }>()

    for (const vote of votes) {
      const existing = playerMap.get(vote.playerId)
      if (existing) {
        existing.voteCount++
      } else {
        playerMap.set(vote.playerId, {
          player: vote.player,
          voteCount: 1
        })
      }
    }

    const teams = await prisma.team.findMany({ select: { name: true, logoUrl: true } })
    const teamLogoByName = Object.fromEntries(
      teams.filter((t) => t.logoUrl).map((t) => [normalizeTeamNameForLogoMatch(t.name), normalizeTeamLogoUrl(t.logoUrl)!])
    )
    const results = Array.from(playerMap.values())
      .map((r) => {
        const teamKey = normalizeTeamNameForLogoMatch(r.player.team)
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

    return NextResponse.json(results)
  } catch (error) {
    console.error('Fehler beim Berechnen der Rookie-Ergebnisse', error)
    return NextResponse.json({ error: 'Fehler beim Berechnen der Ergebnisse' }, { status: 500 })
  }
}
