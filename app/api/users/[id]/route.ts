import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        team: true,
        allstarVotes: {
          include: { player: true }
        },
        mvpVotes: {
          include: { player: true }
        },
        coachVotes: {
          include: { coach: true }
        },
        fairPlayVotes: {
          include: { player: true }
        },
        refereePairVotes: {
          include: { refereePair: true }
        },
        specialAwardVotes: true
      }
    })
    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json(user)
  } catch (error) {
    console.error('Fehler beim Laden des Users', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Users' }, { status: 500 })
  }
}

