import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { normalizeTeamLogoUrl } from '../../../lib/upload-urls'
import { normalizeTeamNameForLogoMatch } from '../../../lib/team-name'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league') || undefined
  try {
    const [coaches, teams] = await Promise.all([
      prisma.coach.findMany({
        where: league ? { league } : undefined,
        orderBy: [{ name: 'asc' }]
      }),
      prisma.team.findMany({ select: { name: true, logoUrl: true } })
    ])

    const teamLogoByName = Object.fromEntries(
      teams
        .filter((t) => t.logoUrl)
        .map((t) => [
          normalizeTeamNameForLogoMatch(t.name),
          normalizeTeamLogoUrl(t.logoUrl)!,
        ])
    )

    const coachesWithTeamLogoUrl = coaches.map((coach) => {
      const teamKey = normalizeTeamNameForLogoMatch(coach.team)
      const teamLogoUrl = teamKey ? (teamLogoByName[teamKey] ?? null) : null
      return {
        ...coach,
        teamLogoUrl,
      }
    })

    return NextResponse.json(coachesWithTeamLogoUrl)
  } catch (error) {
    console.error('Fehler beim Laden der Coaches', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Coaches' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, team, league, imageUrl } = data
    if (!name || !league) {
      return NextResponse.json({ error: 'Name und Liga sind erforderlich' }, { status: 400 })
    }
    const coach = await prisma.coach.create({
      data: {
        name,
        team,
        league,
        imageUrl
      }
    })
    return NextResponse.json(coach, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Anlegen des Coaches', error)
    return NextResponse.json({ error: 'Fehler beim Anlegen des Coaches' }, { status: 500 })
  }
}


