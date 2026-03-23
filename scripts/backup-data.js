#!/usr/bin/env node
/**
 * Backup von SQLite + Uploads auf dem persistenten Datenträger (Render) oder lokal.
 *
 * Nutzung:
 *   node scripts/backup-data.js
 *   npm run backup
 *
 * Auf Render: Shell öffnen, dann obigen Befehl ausführen (siehe README).
 */

const fs = require('fs')
const path = require('path')
const { execFileSync, execSync, spawnSync } = require('child_process')

function getDataPath() {
  if (process.env.RENDER && process.env.PERSISTENT_DISK_PATH) {
    return process.env.PERSISTENT_DISK_PATH
  }
  if (process.env.NODE_ENV === 'production' && fs.existsSync('/mnt/data')) {
    return '/mnt/data'
  }
  return process.cwd()
}

function hasSqlite3Cli() {
  const r = spawnSync('sqlite3', ['-version'], { encoding: 'utf8' })
  return r.status === 0
}

function escapeSqliteQuotedPath(p) {
  return p.replace(/'/g, "''")
}

function backupDatabaseWithSqlite3(src, dest) {
  // Hot-Backup: konsistente Kopie auch bei laufender App (empfohlen)
  const sql = `.backup '${escapeSqliteQuotedPath(dest)}'`
  execFileSync('sqlite3', [src, sql], { stdio: 'inherit' })
}

function backupDatabaseCopy(src, dest) {
  fs.copyFileSync(src, dest)
  console.warn(
    '[backup] Hinweis: sqlite3 CLI nicht verfügbar – einfache Dateikopie. ' +
      'Bei laufender App idealerweise sqlite3 installieren oder App kurz stoppen.'
  )
}

function dirExists(p) {
  try {
    return fs.statSync(p).isDirectory()
  } catch {
    return false
  }
}

function main() {
  const dataPath = getDataPath()
  const dbSrc = path.join(dataPath, 'prisma', 'dev.db')
  const backupRoot = path.join(dataPath, 'backups')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const runDir = path.join(backupRoot, `backup-${stamp}`)

  if (!fs.existsSync(dbSrc)) {
    console.error('[backup] Datenbank nicht gefunden:', dbSrc)
    console.error('[backup] Prüfe PERSISTENT_DISK_PATH / DATABASE_URL / Mount unter /mnt/data.')
    process.exit(1)
  }

  fs.mkdirSync(runDir, { recursive: true })
  const dbDest = path.join(runDir, 'dev.db')

  console.log('[backup] Datenpfad:', dataPath)
  console.log('[backup] Ziel:', runDir)

  try {
    if (hasSqlite3Cli()) {
      console.log('[backup] SQLite-Backup mit sqlite3 .backup …')
      backupDatabaseWithSqlite3(dbSrc, dbDest)
    } else {
      console.log('[backup] SQLite-Backup per Dateikopie …')
      backupDatabaseCopy(dbSrc, dbDest)
    }
  } catch (e) {
    console.error('[backup] DB-Backup fehlgeschlagen:', e.message)
    process.exit(1)
  }

  const uploadsPlayers = path.join(dataPath, 'public', 'uploads', 'players')
  const uploadsTeams = path.join(dataPath, 'public', 'uploads', 'teams')

  const tarDest = path.join(runDir, 'uploads.tar.gz')
  const parts = []
  if (dirExists(uploadsPlayers)) parts.push('public/uploads/players')
  if (dirExists(uploadsTeams)) parts.push('public/uploads/teams')

  if (parts.length > 0) {
    try {
      execSync(`tar -czf "${tarDest}" -C "${dataPath}" ${parts.join(' ')}`, {
        stdio: 'inherit'
      })
      console.log('[backup] Uploads archiviert:', tarDest)
    } catch (e) {
      console.warn('[backup] tar fehlgeschlagen (Uploads optional):', e.message)
    }
  } else {
    console.log('[backup] Keine Upload-Ordner unter', dataPath, '– übersprungen.')
  }

  const stats = fs.statSync(dbDest)
  console.log('[backup] Fertig. DB-Größe:', Math.round(stats.size / 1024), 'KB')
  console.log('[backup] Ordner behalten oder herunterladen:', runDir)
}

main()
