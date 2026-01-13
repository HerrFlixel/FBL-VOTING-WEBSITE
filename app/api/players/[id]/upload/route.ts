import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const formData = await req.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Erstelle Upload-Pfad
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'players')
    
    // Erstelle Verzeichnis falls es nicht existiert
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    const filename = `player-${id}-${Date.now()}.${file.name.split('.').pop()}`
    const filepath = join(uploadsDir, filename)

    // Speichere Datei
    await writeFile(filepath, buffer)

    // Aktualisiere Spieler mit Bild-URL
    const imageUrl = `/uploads/players/${filename}`
    const player = await prisma.player.update({
      where: { id },
      data: { imageUrl }
    })

    return NextResponse.json({ imageUrl: player.imageUrl })
  } catch (error) {
    console.error('Fehler beim Hochladen des Bildes', error)
    return NextResponse.json({ error: 'Fehler beim Hochladen des Bildes' }, { status: 500 })
  }
}

