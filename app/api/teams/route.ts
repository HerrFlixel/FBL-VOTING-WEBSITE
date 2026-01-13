import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const forForm = searchParams.get('forForm') === 'true'

  try {
    const teams = await prisma.team.findMany({
      where: forForm ? { isForForm: true } : undefined,
      orderBy: [{ name: 'asc' }]
    })
    return NextResponse.json(teams)
  } catch (error) {
    console.error('Fehler beim Laden der Teams', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Teams' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, isForForm } = data
    if (!name) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }
    const team = await prisma.team.create({
      data: {
        name,
        isForForm: isForForm || false
      }
    })
    return NextResponse.json(team, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Team existiert bereits' }, { status: 400 })
    }
    console.error('Fehler beim Anlegen des Teams', error)
    return NextResponse.json({ error: 'Fehler beim Anlegen des Teams' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 })
    }
    await prisma.team.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen des Teams', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Teams' }, { status: 500 })
  }
}

