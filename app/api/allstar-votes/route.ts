import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVoterInfo } from '@/lib/voter'

const allowedPositions = ['gk', 'ld', 'rd', 'c', 'lw', 'rw']

function pointsForLine(line: number) {
  if (line === 1) return 3
  if (line === 2) return 2
  return 1
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league') || 'herren'
  const { voterId } = getVoterInfo()

  try {
    const votes = await prisma.allstarVote.findMany({
      where: {
        voterId,
        userId: null,
        league
      },
      include: {
        player: true
      },
      orderBy: [{ line: 'asc' }, { position: 'asc' }]
    })
    return NextResponse.json(votes)
  } catch (error) {
    console.error('Fehler beim Laden der Allstar-Votes', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Votes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { line, position, playerId, league } = body as {
      line: number
      position: string
      playerId: string
      league: string
    }

    if (!line || !position || !playerId || !league) {
      return NextResponse.json({ error: 'line, position, playerId, league sind erforderlich' }, { status: 400 })
    }
    if (![1, 2, 3].includes(line)) {
      return NextResponse.json({ error: 'line muss 1, 2 oder 3 sein' }, { status: 400 })
    }
    if (!allowedPositions.includes(position)) {
      return NextResponse.json({ error: 'Ungültige Position' }, { status: 400 })
    }

    const { voterId, ip } = getVoterInfo()

    // Prüfe, ob Spieler bereits in anderer Position/Zeile gewählt wurde
    const duplicate = await prisma.allstarVote.findFirst({
      where: {
        voterId,
        userId: null,
        league,
        playerId
      }
    })
    if (duplicate && (duplicate.line !== line || duplicate.position !== position)) {
      return NextResponse.json(
        { error: `Spieler bereits gewählt (Reihe ${duplicate.line}, Position ${duplicate.position})` },
        { status: 400 }
      )
    }

    // Prüfe, ob bereits ein Vote für diese Position existiert
    const existing = await prisma.allstarVote.findFirst({
      where: {
        voterId,
        userId: null,
        league,
        line,
        position
      }
    })

    let vote
    if (existing) {
      // Update existing vote
      vote = await prisma.allstarVote.update({
        where: { id: existing.id },
        data: {
          playerId,
          points: pointsForLine(line)
        },
        include: { player: true }
      })
    } else {
      // Create new vote
      vote = await prisma.allstarVote.create({
        data: {
          playerId,
          voterId,
          voterIp: ip,
          league,
          line,
          position,
          points: pointsForLine(line)
        },
        include: { player: true }
      })
    }

    return NextResponse.json(vote)
  } catch (error: any) {
    console.error('Fehler beim Speichern der Allstar-Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Speichern der Votes' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { line, position, league } = body as {
      line: number
      position: string
      league: string
    }

    if (!line || !position || !league) {
      return NextResponse.json({ error: 'line, position, league sind erforderlich' }, { status: 400 })
    }

    const { voterId } = getVoterInfo()

    const existing = await prisma.allstarVote.findFirst({
      where: {
        voterId,
        userId: null,
        league,
        line,
        position
      }
    })

    if (existing) {
      await prisma.allstarVote.delete({
        where: { id: existing.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Fehler beim Löschen der Allstar-Votes', error)
    return NextResponse.json(
      { error: error?.message || 'Fehler beim Löschen der Votes' },
      { status: 500 }
    )
  }
}


