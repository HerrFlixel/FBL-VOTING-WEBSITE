import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league') || undefined

  try {
    const votes = await prisma.specialAwardVote.findMany({
      where: league ? { league } : undefined,
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(votes)
  } catch (error) {
    console.error('Fehler beim Laden der Special Award Votes', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Votes' }, { status: 500 })
  }
}

