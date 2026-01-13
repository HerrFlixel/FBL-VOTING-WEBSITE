import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(req: Request) {
  try {
    const users = await prisma.user.findMany({
      include: {
        team: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Fehler beim Laden der User', error)
    return NextResponse.json({ error: 'Fehler beim Laden der User' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 })
    }

    // Lösche alle Votes des Users
    await Promise.all([
      prisma.allstarVote.deleteMany({ where: { userId: id } }),
      prisma.mVPVote.deleteMany({ where: { userId: id } }),
      prisma.coachVote.deleteMany({ where: { userId: id } }),
      prisma.fairPlayVote.deleteMany({ where: { userId: id } }),
      prisma.refereePairVote.deleteMany({ where: { userId: id } }),
      prisma.specialAwardVote.deleteMany({ where: { userId: id } })
    ])

    // Lösche den User
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen des Users', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Users' }, { status: 500 })
  }
}

