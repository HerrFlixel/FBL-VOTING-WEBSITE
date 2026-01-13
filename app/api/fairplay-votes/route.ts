import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getVoterInfo } from '../../../../lib/voter'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league') || 'herren'
  const { voterId } = getVoterInfo()

  try {
    const vote = await prisma.fairPlayVote.findFirst({
      where: {
        voterId,
        userId: null,
        league
      },
      include: {
        player: true
      }
    })
    return NextResponse.json(vote)
  } catch (error) {
    console.error('Fehler beim Laden der Fair Play Votes', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Votes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { playerId, league } = body as {
      playerId: string
      league: string
    }

    if (!playerId || !league) {
      return NextResponse.json({ error: 'playerId, league sind erforderlich' }, { status: 400 })
    }

    const { voterId, ip } = getVoterInfo()

    // Prüfe, ob bereits ein Vote existiert
    const existing = await prisma.fairPlayVote.findFirst({
      where: {
        voterId,
        userId: null,
        league
      }
    })

    let vote
    if (existing) {
      // Update existing vote
      vote = await prisma.fairPlayVote.update({
        where: { id: existing.id },
        data: {
          playerId
        },
        include: { player: true }
      })
    } else {
      // Create new vote
      vote = await prisma.fairPlayVote.create({
        data: {
          playerId,
          voterId,
          voterIp: ip,
          league,
          points: 1
        },
        include: { player: true }
      })
    }

    return NextResponse.json(vote)
  } catch (error: any) {
    console.error('Fehler beim Speichern der Fair Play Votes', error)
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

    const existing = await prisma.fairPlayVote.findFirst({
      where: {
        voterId,
        userId: null,
        league
      }
    })

    if (existing) {
      await prisma.fairPlayVote.delete({
        where: { id: existing.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Fehler beim Löschen der Fair Play Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Löschen der Votes' },
      { status: 500 }
    )
  }
}

