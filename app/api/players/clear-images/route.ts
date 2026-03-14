import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

/**
 * Setzt bei allen Spielern imageUrl auf null.
 * Einmalig aufrufen, damit nur noch Team-Logos angezeigt werden.
 * GET oder POST, z.B. einmal im Browser: /api/players/clear-images
 */
export async function POST() {
  try {
    const result = await prisma.player.updateMany({
      data: { imageUrl: null }
    })
    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error('Fehler beim Zurücksetzen der Spielerbilder', error)
    return NextResponse.json({ error: 'Fehler beim Zurücksetzen' }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
