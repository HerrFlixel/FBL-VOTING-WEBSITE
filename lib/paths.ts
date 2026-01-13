import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Gibt den persistenten Datenpfad zurück
 * In Production (Render): /mnt/data
 * In Development: Projekt-Root
 */
export function getDataPath(): string {
  // Prüfe ob wir auf Render sind (persistent disk gemountet)
  if (process.env.RENDER && process.env.PERSISTENT_DISK_PATH) {
    return process.env.PERSISTENT_DISK_PATH
  }
  // Fallback: Prüfe ob /mnt/data existiert (für Render ohne env var)
  if (process.env.NODE_ENV === 'production') {
    if (existsSync('/mnt/data')) {
      return '/mnt/data'
    }
  }
  // Development: Verwende Projekt-Root
  return process.cwd()
}

/**
 * Gibt den Pfad zur Datenbank zurück
 */
export function getDatabasePath(): string {
  const dataPath = getDataPath()
  return join(dataPath, 'prisma', 'dev.db')
}

/**
 * Gibt den Pfad für Uploads zurück
 */
export function getUploadsPath(): string {
  const dataPath = getDataPath()
  return join(dataPath, 'public', 'uploads', 'players')
}

/**
 * Gibt den relativen URL-Pfad für Uploads zurück (für Next.js public folder)
 */
export function getUploadsUrlPath(): string {
  return '/uploads/players'
}

