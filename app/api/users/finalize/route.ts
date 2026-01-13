import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVoterInfo } from '@/lib/voter'

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

    await Promise.all([
      prisma.vote.updateMany({
        where: whereVoter,
        data: { userId: user.id }
      }),
      prisma.teamVote.updateMany({
        where: whereVoter,
        data: { userId: user.id }
      }),
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

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error('Fehler beim Finalisieren des Users:', error)
    return NextResponse.json(
      { error: 'Fehler beim Finalisieren des Users' },
      { status: 500 }
    )
  }
}



