import { NextResponse } from 'next/server'
import { getVoterInfo } from '../../../../lib/voter'
import { prisma } from '../../../../lib/prisma'

export async function POST(req: Request) {
  try {
    const { voterId } = getVoterInfo()

    // Nur löschen, wenn eine eindeutige voterId vorhanden ist.
    // Ohne voterId (z. B. nur ip+userAgent-Fallback) nie alle unfinalisierten Votes löschen –
    // verhindert versehentliches Massenlöschen bei fehlendem Header.
    if (!voterId || typeof voterId !== 'string' || voterId.trim() === '') {
      return NextResponse.json({ success: true })
    }

    const deleteConditions = { voterId, userId: null }

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
      prisma.rookieVote.deleteMany({
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

