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
    
    // In Production: Versuche Symlink zu erstellen (falls persistent disk verwendet wird)
    // In Development: Kopiere die Datei auch in den lokalen public-Ordner
    const isProduction = process.env.NODE_ENV === 'production'
    const isPersistentDisk = uploadsDir !== publicUploadsDir
    
    if (isProduction && isPersistentDisk) {
      // In Production mit persistent disk: Erstelle Symlink
      try {
        // Entferne existierenden Ordner/Symlink falls vorhanden
        const fs = require('fs')
        if (existsSync(publicUploadsDir)) {
          try {
            const stats = fs.lstatSync(publicUploadsDir)
            if (stats.isSymbolicLink()) {
              fs.unlinkSync(publicUploadsDir)
            } else if (stats.isDirectory()) {
              // Wenn es ein Verzeichnis ist, lösche es nicht - könnte wichtige Dateien enthalten
            }
          } catch (e) {
            // Ignoriere Fehler
          }
        }
        // Erstelle neuen Symlink
        if (!existsSync(publicUploadsDir)) {
          await symlink(uploadsDir, publicUploadsDir, 'dir')
        }
      } catch (symlinkError: any) {
        // Symlink existiert bereits oder Fehler - ignoriere
        if (symlinkError.code !== 'EEXIST') {
          console.warn('Konnte Symlink nicht erstellen:', symlinkError.message)
        }
      }
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
    const filepath = join(uploadsDir, filename)

    // Speichere komprimierte Datei auf persistent disk
    await writeFile(filepath, compressedBuffer)
    
    // In Development: Kopiere auch in lokalen public-Ordner (falls unterschiedlich)
    if (!isProduction || !isPersistentDisk) {
      const localFilePath = join(publicUploadsDir, filename)
      await writeFile(localFilePath, compressedBuffer)
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

