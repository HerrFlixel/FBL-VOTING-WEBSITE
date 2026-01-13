const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Setup-Script für Render Persistent Disk
 * Erstellt notwendige Verzeichnisse und Symlinks
 */

function getDataPath() {
  // Prüfe ob /mnt/data existiert (Render persistent disk)
  if (fs.existsSync('/mnt/data')) {
    return '/mnt/data'
  }
  // Development: Verwende Projekt-Root
  return process.cwd()
}

function setupPersistentDisk() {
  const dataPath = getDataPath()
  const isProduction = process.env.NODE_ENV === 'production'
  
  console.log(`Setting up persistent disk at: ${dataPath}`)
  
  // Erstelle Verzeichnisse auf persistent disk
  const prismaDir = path.join(dataPath, 'prisma')
  const uploadsDir = path.join(dataPath, 'public', 'uploads', 'players')
  
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true })
    console.log(`Created directory: ${prismaDir}`)
  }
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
    console.log(`Created directory: ${uploadsDir}`)
  }
  
  // Erstelle Symlinks im Projektverzeichnis (nur wenn auf persistent disk)
  if (isProduction && dataPath !== process.cwd()) {
    try {
      // Prisma Verzeichnis Symlink
      const projectPrismaDir = path.join(process.cwd(), 'prisma')
      if (!fs.existsSync(projectPrismaDir)) {
        fs.mkdirSync(projectPrismaDir, { recursive: true })
      }
      
      // Prisma DB Symlink
      const dbPath = path.join(prismaDir, 'dev.db')
      const projectDbPath = path.join(projectPrismaDir, 'dev.db')
      if (!fs.existsSync(projectDbPath) && fs.existsSync(dbPath)) {
        fs.symlinkSync(dbPath, projectDbPath, 'file')
        console.log(`Created symlink: ${projectDbPath} -> ${dbPath}`)
      }
      
      // Public Uploads Symlink
      const projectPublicDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(projectPublicDir)) {
        fs.mkdirSync(projectPublicDir, { recursive: true })
      }
      
      const projectUploadsDir = path.join(projectPublicDir, 'players')
      if (!fs.existsSync(projectUploadsDir)) {
        try {
          fs.symlinkSync(uploadsDir, projectUploadsDir, 'dir')
          console.log(`Created symlink: ${projectUploadsDir} -> ${uploadsDir}`)
        } catch (err) {
          // Symlink existiert bereits oder Fehler - ignoriere
          if (err.code !== 'EEXIST') {
            console.warn(`Could not create symlink: ${err.message}`)
          }
        }
      }
    } catch (error) {
      console.warn('Error creating symlinks:', error.message)
      // Nicht kritisch, die App kann auch ohne Symlinks funktionieren
    }
  }
  
  console.log('Persistent disk setup complete')
}

setupPersistentDisk()

