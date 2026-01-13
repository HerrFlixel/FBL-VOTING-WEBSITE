import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, symlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getUploadsPath, getUploadsUrlPath } from '@/lib/paths'

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

    // Erstelle Upload-Pfad (persistent disk)
    const uploadsDir = getUploadsPath()
    
    // Erstelle Verzeichnis falls es nicht existiert
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    // Erstelle Symlink im public-Ordner für Next.js (falls nicht existiert)
    const publicUploadsDir = join(process.cwd(), 'public', 'uploads', 'players')
    if (!existsSync(publicUploadsDir)) {
      try {
        await mkdir(join(process.cwd(), 'public', 'uploads'), { recursive: true })
        // Versuche Symlink zu erstellen (nur wenn nicht existiert)
        if (!existsSync(publicUploadsDir)) {
          await symlink(uploadsDir, publicUploadsDir, 'dir')
        }
      } catch (symlinkError: any) {
        // Symlink existiert bereits oder Fehler (z.B. Windows) - ignoriere
        if (symlinkError.code !== 'EEXIST') {
          console.warn('Konnte Symlink nicht erstellen:', symlinkError.message)
        }
      }
    }
    
    const filename = `player-${id}-${Date.now()}.${file.name.split('.').pop()}`
    const filepath = join(uploadsDir, filename)

    // Speichere Datei
    await writeFile(filepath, buffer)

    // Aktualisiere Spieler mit Bild-URL
    const imageUrl = `${getUploadsUrlPath()}/${filename}`
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

