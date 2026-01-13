import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league')

  if (!league) {
    return NextResponse.json({ error: 'league ist erforderlich' }, { status: 400 })
  }

  try {
    const votes = await prisma.fairPlayVote.findMany({
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

    const results = Array.from(playerMap.values())
      .map((r) => ({
        player: {
          id: r.player.id,
          name: r.player.name,
          team: r.player.team,
          imageUrl: r.player.imageUrl
        },
        voteCount: r.voteCount
      }))
      .sort((a, b) => b.voteCount - a.voteCount)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Fehler beim Berechnen der Fair Play Ergebnisse', error)
    return NextResponse.json({ error: 'Fehler beim Berechnen der Ergebnisse' }, { status: 500 })
  }
}

