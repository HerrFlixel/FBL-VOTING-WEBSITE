import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { normalizeTeamLogoUrl } from '../../../lib/upload-urls'
import { normalizeTeamNameForLogoMatch } from '../../../lib/team-name'
import { deleteVotesForPlayerIds } from '../../../lib/delete-player-votes'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const league = searchParams.get('league') || undefined
  const rookieCandidates = searchParams.get('rookieCandidates') || undefined // 'damen' | 'herren'

  try {
    const where: { league?: string; rookieCandidateDamen?: boolean; rookieCandidateHerren?: boolean } = {}
    if (league) where.league = league
    if (rookieCandidates === 'damen') where.rookieCandidateDamen = true
    if (rookieCandidates === 'herren') where.rookieCandidateHerren = true

    const [players, teams] = await Promise.all([
      prisma.player.findMany({
        where: Object.keys(where).length ? where : undefined,
        orderBy: [
          { scorerRank: 'asc' },
          { name: 'asc' }
        ]
      }),
      prisma.team.findMany({ select: { name: true, logoUrl: true } })
    ])

    const teamLogoByName = Object.fromEntries(
      teams.filter((t) => t.logoUrl).map((t) => [normalizeTeamNameForLogoMatch(t.name), normalizeTeamLogoUrl(t.logoUrl)!])
    )
    const playersWithTeamLogo = players.map((p) => {
      const teamKey = normalizeTeamNameForLogoMatch(p.team)
      const logoUrl = teamKey ? (teamLogoByName[teamKey] ?? null) : null
      return { ...p, teamLogoUrl: logoUrl }
    })
    return NextResponse.json(playersWithTeamLogo)
  } catch (error) {
    console.error('Fehler beim Laden der Spieler', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Spieler' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const league = searchParams.get('league')

    if (!league || !['herren', 'damen'].includes(league)) {
      return NextResponse.json({ error: 'Gültige Liga (herren oder damen) ist erforderlich' }, { status: 400 })
    }

    // Zuerst abhängige Stimmen löschen (SQLite: kein ON DELETE CASCADE auf Player)
    const result = await prisma.$transaction(async (tx) => {
      const ids = (await tx.player.findMany({ where: { league }, select: { id: true } })).map(
        (p) => p.id
      )
      await deleteVotesForPlayerIds(tx, ids)
      return tx.player.deleteMany({ where: { league } })
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count,
      message: `${result.count} Spieler der Liga ${league} wurden gelöscht`
    })
  } catch (error) {
    console.error('Fehler beim Löschen der Spieler', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Spieler' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, team, league, position, imageUrl, jerseyNumber, goals, assists, points, games, scorerRank, pim2, pim2x2, pim10, pimMatch } = data

    if (!name || !league) {
      return NextResponse.json({ error: 'Name und Liga sind erforderlich' }, { status: 400 })
    }

    const player = await prisma.player.create({
      data: {
        name,
        team,
        league,
        position,
        imageUrl,
        jerseyNumber,
        goals: goals ?? 0,
        assists: assists ?? 0,
        points: points ?? 0,
        games: games ?? 0,
        scorerRank: scorerRank ?? null,
        pim2: pim2 ?? 0,
        pim2x2: pim2x2 ?? 0,
        pim10: pim10 ?? 0,
        pimMatch: pimMatch ?? 0
      }
    })

    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Anlegen des Spielers', error)
    return NextResponse.json({ error: 'Fehler beim Anlegen des Spielers' }, { status: 500 })
  }
}


