import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { writeFile, mkdir, symlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getUploadsPath, getUploadsUrlPath } from '../../../../../lib/paths'
import sharp from 'sharp'

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
    
    // Erstelle auch lokalen public-Ordner für Next.js (für Development)
    const publicUploadsDir = join(process.cwd(), 'public', 'uploads', 'players')
    if (!existsSync(publicUploadsDir)) {
      await mkdir(join(process.cwd(), 'public', 'uploads'), { recursive: true })
      await mkdir(publicUploadsDir, { recursive: true })
    }
    
    // Komprimiere und optimiere das Bild
    // Maximale Größe: 800x800px, JPEG Qualität: 60 (starke Kompression)
    const compressedBuffer = await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 60,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer()
    
    const filename = `player-${id}-${Date.now()}.jpg`
    
    // Prüfe ob wir auf persistent disk sind (Production auf Render)
    const isProduction = process.env.NODE_ENV === 'production'
    const isPersistentDisk = uploadsDir !== publicUploadsDir
    
    // WICHTIG: Speichere IMMER im lokalen public-Ordner, damit Next.js die Bilder servieren kann
    // Next.js kann nur Dateien aus dem public-Ordner servieren
    const localFilePath = join(publicUploadsDir, filename)
    await writeFile(localFilePath, compressedBuffer)
    console.log(`[Upload] Bild gespeichert in: ${localFilePath}`)
    
    // Zusätzlich: Speichere auch im persistent disk Verzeichnis (falls vorhanden und unterschiedlich)
    // Dies stellt sicher, dass die Bilder auch nach Neustarts erhalten bleiben
    if (isPersistentDisk) {
      const persistentFilePath = join(uploadsDir, filename)
      try {
        await writeFile(persistentFilePath, compressedBuffer)
        console.log(`[Upload] Bild auch im persistent disk gespeichert: ${persistentFilePath}`)
      } catch (persistentError) {
        console.warn('[Upload] Konnte Bild nicht im persistent disk speichern:', persistentError)
        // Nicht kritisch, da wir es bereits lokal haben
      }
    }

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

