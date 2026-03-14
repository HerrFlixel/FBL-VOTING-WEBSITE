import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { getTeamUploadsPath, getTeamUploadsPublicPath } from '../../../../../lib/paths'

/**
 * Liefert Team-Logos aus. Liest zuerst vom persistenten Speicher (Render),
 * sonst aus dem Projekt-public-Ordner. So funktionieren Logos lokal und auf Render.
 */
export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Ungültiger Dateiname' }, { status: 400 })
  }

  try {
    const persistentPath = join(getTeamUploadsPath(), filename)
    const publicPath = join(getTeamUploadsPublicPath(), filename)

    let path: string | null = null
    if (existsSync(persistentPath)) {
      path = persistentPath
    } else if (existsSync(publicPath)) {
      path = publicPath
    }

    if (!path) {
      return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 })
    }

    const buffer = await readFile(path)
    const isPng = filename.toLowerCase().endsWith('.png')
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': isPng ? 'image/png' : 'image/jpeg',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (error) {
    console.error('Fehler beim Ausliefern des Team-Logos', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}
