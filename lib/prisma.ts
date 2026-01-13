import { PrismaClient } from '@prisma/client'
import { getDatabasePath } from './paths'
import { existsSync } from 'fs'
import { mkdirSync } from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

// Stelle sicher, dass DATABASE_URL gesetzt ist
if (!process.env.DATABASE_URL) {
  const dbPath = getDatabasePath()
  const dbDir = dbPath.substring(0, dbPath.lastIndexOf('/'))
  
  // Erstelle Verzeichnis falls es nicht existiert
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
  
  // Setze DATABASE_URL für Prisma
  process.env.DATABASE_URL = `file:${dbPath}`
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn']
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}



