import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const team = await prisma.team.findUnique({
      where: { id }
    })
    if (!team) {
      return NextResponse.json({ error: 'Team nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json(team)
  } catch (error) {
    console.error('Fehler beim Laden des Teams', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Teams' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const data = await req.json()
    const { name, logoUrl, isForForm } = data
    const updateData: { name?: string; logoUrl?: string | null; isForForm?: boolean } = {}
    if (name !== undefined) updateData.name = name
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null
    if (isForForm !== undefined) updateData.isForForm = isForForm
    const team = await prisma.team.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json(team)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Teamname existiert bereits' }, { status: 400 })
    }
    console.error('Fehler beim Aktualisieren des Teams', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Teams' }, { status: 500 })
  }
}
