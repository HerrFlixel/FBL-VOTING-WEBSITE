import { NextResponse } from 'next/server'
import { getVoterInfo } from '../../../../lib/voter'
import { prisma } from '../../../../lib/prisma'

export async function POST(req: Request) {
  try {
    const { voterId } = getVoterInfo()

    // Lösche alle nicht-finalisierten Votes (userId = null) dieses Voters
    // Verwende deleteMany mit where-Klausel, die auch ohne voterId funktioniert
    // (für den Fall, dass voterId nicht verfügbar ist beim Reload)
    const deleteConditions = voterId 
      ? { voterId, userId: null }
      : { userId: null }

    await Promise.all([
      prisma.allstarVote.deleteMany({
        where: deleteConditions
      }),
      prisma.mVPVote.deleteMany({
        where: deleteConditions
      }),
      prisma.coachVote.deleteMany({
        where: deleteConditions
      }),
      prisma.fairPlayVote.deleteMany({
        where: deleteConditions
      }),
      prisma.refereePairVote.deleteMany({
        where: deleteConditions
      }),
      prisma.specialAwardVote.deleteMany({
        where: deleteConditions
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

