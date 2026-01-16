import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getVoterInfo } from '../../../../lib/voter'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstName, lastName, teamId, league } = body as {
      firstName: string
      lastName: string
      teamId?: string
      league?: string
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Vorname und Nachname sind erforderlich.' },
        { status: 400 }
      )
    }

    const { ip, voterId } = getVoterInfo()

    // Neuen User-Eintrag für diese Formular-Abgabe anlegen
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        voterId,
        voterIp: ip,
        league,
        teamId: teamId || null
      }
    })

    // Alle nicht-finalisierten Votes (userId = null) dieses Voters mit diesem User verknüpfen
    const whereVoter = { voterId, userId: null as string | null }

    // Zähle die Votes vor dem Update für Debugging
    const countsBefore = {
      allstar: await prisma.allstarVote.count({ where: whereVoter }),
      mvp: await prisma.mVPVote.count({ where: whereVoter }),
      coach: await prisma.coachVote.count({ where: whereVoter }),
      fairPlay: await prisma.fairPlayVote.count({ where: whereVoter }),
      referee: await prisma.refereePairVote.count({ where: whereVoter }),
      special: await prisma.specialAwardVote.count({ where: whereVoter })
    }
    
    console.log(`Finalizing votes for voterId: ${voterId}, counts:`, countsBefore)

    const results = await Promise.all([
      prisma.allstarVote.updateMany({
        where: whereVoter,
        data: { userId: user.id }
      }),
      prisma.mVPVote.updateMany({
        where: whereVoter,
        data: { userId: user.id }
      }),
      prisma.coachVote.updateMany({
        where: whereVoter,
        data: { userId: user.id }
      }),
      prisma.fairPlayVote.updateMany({
        where: whereVoter,
        data: { userId: user.id }
      }),
      prisma.refereePairVote.updateMany({
        where: whereVoter,
        data: { userId: user.id }
      }),
      prisma.specialAwardVote.updateMany({
        where: whereVoter,
        data: { userId: user.id }
      })
    ])
    
    console.log(`Finalized votes:`, results.map((r, i) => ({
      type: ['allstar', 'mvp', 'coach', 'fairPlay', 'referee', 'special'][i],
      count: r.count
    })))

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error('Fehler beim Finalisieren des Users:', error)
    return NextResponse.json(
      { error: 'Fehler beim Finalisieren des Users' },
      { status: 500 }
    )
  }
}



