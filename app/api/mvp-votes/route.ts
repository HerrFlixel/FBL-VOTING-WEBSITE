import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getVoterInfo } from '../../../../lib/voter'

function pointsForRank(rank: number) {
  return 11 - rank // Platz 1 = 10 Punkte, Platz 10 = 1 Punkt
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league') || 'herren'
  const { voterId } = getVoterInfo()

  try {
    const votes = await prisma.mVPVote.findMany({
      where: {
        voterId,
        userId: null,
        league
      },
      include: {
        player: true
      },
      orderBy: { rank: 'asc' }
    })
    return NextResponse.json(votes)
  } catch (error) {
    console.error('Fehler beim Laden der MVP-Votes', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Votes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { rank, playerId, league } = body as {
      rank: number
      playerId: string
      league: string
    }

    if (!rank || !playerId || !league) {
      return NextResponse.json({ error: 'rank, playerId, league sind erforderlich' }, { status: 400 })
    }
    if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(rank)) {
      return NextResponse.json({ error: 'rank muss zwischen 1 und 10 sein' }, { status: 400 })
    }

    const { voterId, ip } = getVoterInfo()

    // Prüfe, ob Spieler bereits auf anderem Platz gewählt wurde
    const duplicate = await prisma.mVPVote.findFirst({
      where: {
        voterId,
        userId: null,
        league,
        playerId
      }
    })
    if (duplicate && duplicate.rank !== rank) {
      return NextResponse.json(
        { error: `Spieler bereits auf Platz ${duplicate.rank} gewählt` },
        { status: 400 }
      )
    }

    // Prüfe, ob bereits ein Vote für diesen Platz existiert
    const existing = await prisma.mVPVote.findFirst({
      where: {
        voterId,
        userId: null,
        league,
        rank
      }
    })

    let vote
    if (existing) {
      // Update existing vote
      vote = await prisma.mVPVote.update({
        where: { id: existing.id },
        data: {
          playerId,
          points: pointsForRank(rank)
        },
        include: { player: true }
      })
    } else {
      // Create new vote
      vote = await prisma.mVPVote.create({
        data: {
          playerId,
          voterId,
          voterIp: ip,
          league,
          rank,
          points: pointsForRank(rank)
        },
        include: { player: true }
      })
    }

    return NextResponse.json(vote)
  } catch (error: any) {
    console.error('Fehler beim Speichern der MVP-Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Speichern der Votes' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { rank, league } = body as {
      rank: number
      league: string
    }

    if (!rank || !league) {
      return NextResponse.json({ error: 'rank, league sind erforderlich' }, { status: 400 })
    }

    const { voterId } = getVoterInfo()

    const existing = await prisma.mVPVote.findFirst({
      where: {
        voterId,
        userId: null,
        league,
        rank
      }
    })

    if (existing) {
      await prisma.mVPVote.delete({
        where: { id: existing.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Fehler beim Löschen der MVP-Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Löschen der Votes' },
      { status: 500 }
    )
  }
}

