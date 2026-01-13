import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league')

  if (!league) {
    return NextResponse.json({ error: 'league ist erforderlich' }, { status: 400 })
  }

  try {
    const votes = await prisma.coachVote.findMany({
      where: {
        league,
        userId: { not: null } // Nur finalisierte Votes
      },
      include: {
        coach: true
      }
    })

    // Gruppiere nach Trainer
    const coachMap = new Map<string, {
      coach: typeof votes[0]['coach']
      voteCount: number
    }>()

    for (const vote of votes) {
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

    const results = Array.from(coachMap.values())
      .map((r) => ({
        coach: {
          id: r.coach.id,
          name: r.coach.name,
          team: r.coach.team,
          imageUrl: r.coach.imageUrl
        },
        voteCount: r.voteCount
      }))
      .sort((a, b) => b.voteCount - a.voteCount)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Fehler beim Berechnen der Trainer-Ergebnisse', error)
    return NextResponse.json({ error: 'Fehler beim Berechnen der Ergebnisse' }, { status: 500 })
  }
}

