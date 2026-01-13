import { NextResponse } from 'next/server'
import { getVoterInfo } from '@/lib/voter'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { voterId } = getVoterInfo()

    // Lösche alle nicht-finalisierten Votes (userId = null) dieses Voters
    await Promise.all([
      prisma.allstarVote.deleteMany({
        where: { voterId, userId: null }
      }),
      prisma.mVPVote.deleteMany({
        where: { voterId, userId: null }
      }),
      prisma.coachVote.deleteMany({
        where: { voterId, userId: null }
      }),
      prisma.fairPlayVote.deleteMany({
        where: { voterId, userId: null }
      }),
      prisma.refereePairVote.deleteMany({
        where: { voterId, userId: null }
      }),
      prisma.specialAwardVote.deleteMany({
        where: { voterId, userId: null }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Zurücksetzen der Session', error)
    return NextResponse.json(
      { error: 'Fehler beim Zurücksetzen der Session' },
      { status: 500 }
    )
  }
}

