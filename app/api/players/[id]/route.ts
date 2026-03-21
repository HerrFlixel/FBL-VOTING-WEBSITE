import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { deleteVotesForPlayerIds } from '../../../../lib/delete-player-votes'
import { normalizeTeamLogoUrl } from '../../../../lib/upload-urls'
import { normalizeTeamNameForLogoMatch } from '../../../../lib/team-name'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const player = await prisma.player.findUnique({
      where: { id }
    })
    if (!player) {
      return NextResponse.json({ error: 'Spieler nicht gefunden' }, { status: 404 })
    }
    let teamLogoUrl: string | null = null
    if (player.team) {
      const teams = await prisma.team.findMany({ where: { logoUrl: { not: null } }, select: { name: true, logoUrl: true } })
      const teamKey = normalizeTeamNameForLogoMatch(player.team)
      const found = teams.find((t) => normalizeTeamNameForLogoMatch(t.name) === teamKey)
      teamLogoUrl = normalizeTeamLogoUrl(found?.logoUrl ?? null)
    }
    return NextResponse.json({ ...player, teamLogoUrl })
  } catch (error) {
    console.error('Fehler beim Laden des Spielers', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Spielers' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const data = await req.json()
    const {
      name,
      team,
      league,
      position,
      imageUrl,
      jerseyNumber,
      goals,
      assists,
      points,
      games,
      scorerRank,
      pim2,
      pim2x2,
      pim10,
      pimMatch,
      rookieCandidateDamen,
      rookieCandidateHerren
    } = data

    const player = await prisma.player.update({
      where: { id },
      data: {
        name,
        team,
        league,
        position,
        imageUrl,
        jerseyNumber,
        goals,
        assists,
        points,
        games,
        scorerRank,
        pim2,
        pim2x2,
        pim10,
        pimMatch,
        ...(typeof rookieCandidateDamen === 'boolean' && { rookieCandidateDamen }),
        ...(typeof rookieCandidateHerren === 'boolean' && { rookieCandidateHerren })
      }
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Spielers', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Spielers' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    await prisma.$transaction(async (tx) => {
      await deleteVotesForPlayerIds(tx, [id])
      await tx.player.delete({ where: { id } })
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen des Spielers', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Spielers' }, { status: 500 })
  }
}
