import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league')

  if (!league) {
    return NextResponse.json({ error: 'league ist erforderlich' }, { status: 400 })
  }

  try {
    // Hole alle Votes für die Liga
    const votes = await prisma.allstarVote.findMany({
      where: {
        league,
        userId: { not: null } // Nur finalisierte Votes
      },
      include: {
        player: true
      }
    })

    // Gruppiere nach Spieler
    const playerMap = new Map<string, {
      player: typeof votes[0]['player']
      totalPoints: number
      line1Count: number
      line2Count: number
      line3Count: number
    }>()

    for (const vote of votes) {
      const existing = playerMap.get(vote.playerId)
      if (existing) {
        existing.totalPoints += vote.points
        if (vote.line === 1) existing.line1Count++
        else if (vote.line === 2) existing.line2Count++
        else if (vote.line === 3) existing.line3Count++
      } else {
        playerMap.set(vote.playerId, {
          player: vote.player,
          totalPoints: vote.points,
          line1Count: vote.line === 1 ? 1 : 0,
          line2Count: vote.line === 2 ? 1 : 0,
          line3Count: vote.line === 3 ? 1 : 0
        })
      }
    }

    const teams = await prisma.team.findMany({ select: { name: true, logoUrl: true } })
    const teamLogoByNorm = Object.fromEntries(
      teams.filter((t) => t.logoUrl).map((t) => [t.name.trim().toLowerCase(), t.logoUrl!])
    )
    const results = Array.from(playerMap.values())
      .map((r) => {
        const teamKey = (r.player.team || '').trim().toLowerCase()
        const teamLogoUrl = teamKey ? (teamLogoByNorm[teamKey] ?? null) : null
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
        line3Count: r.line3Count
      }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Fehler beim Berechnen der Allstar-Ergebnisse', error)
    return NextResponse.json({ error: 'Fehler beim Berechnen der Ergebnisse' }, { status: 500 })
  }
}


