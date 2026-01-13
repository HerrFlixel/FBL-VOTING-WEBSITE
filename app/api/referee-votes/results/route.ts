import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league')

  if (!league) {
    return NextResponse.json({ error: 'league ist erforderlich' }, { status: 400 })
  }

  try {
    const votes = await prisma.refereePairVote.findMany({
      where: {
        league,
        userId: { not: null } // Nur finalisierte Votes
      },
      include: {
        refereePair: true
      }
    })

    // Gruppiere nach Schiedsrichter-Paar
    const pairMap = new Map<string, {
      pair: typeof votes[0]['refereePair']
      voteCount: number
    }>()

    for (const vote of votes) {
      const existing = pairMap.get(vote.refereePairId)
      if (existing) {
        existing.voteCount++
      } else {
        pairMap.set(vote.refereePairId, {
          pair: vote.refereePair,
          voteCount: 1
        })
      }
    }

    const results = Array.from(pairMap.values())
      .map((r) => ({
        pair: {
          id: r.pair.id,
          name: r.pair.name,
          imageUrl: r.pair.imageUrl
        },
        voteCount: r.voteCount
      }))
      .sort((a, b) => b.voteCount - a.voteCount)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Fehler beim Berechnen der Schiedsrichter-Ergebnisse', error)
    return NextResponse.json({ error: 'Fehler beim Berechnen der Ergebnisse' }, { status: 500 })
  }
}

