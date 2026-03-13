import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getTeamUploadsPath, getTeamUploadsUrlPath } from '../../../../../lib/paths'
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

    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      return NextResponse.json({ error: 'Team nicht gefunden' }, { status: 404 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = getTeamUploadsPath()
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const publicUploadsDir = join(process.cwd(), 'public', 'uploads', 'teams')
    if (!existsSync(publicUploadsDir)) {
      await mkdir(join(process.cwd(), 'public', 'uploads'), { recursive: true })
      await mkdir(publicUploadsDir, { recursive: true })
    }

    const compressedBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toBuffer()

    const filename = `team-${id}-${Date.now()}.jpg`
    const localFilePath = join(publicUploadsDir, filename)
    await writeFile(localFilePath, compressedBuffer)

    const isPersistentDisk = uploadsDir !== publicUploadsDir
    if (isPersistentDisk) {
      const persistentFilePath = join(uploadsDir, filename)
      try {
        await writeFile(persistentFilePath, compressedBuffer)
      } catch {
        // optional
      }
    }

    const logoUrl = `${getTeamUploadsUrlPath()}/${filename}`
    await prisma.team.update({
      where: { id },
      data: { logoUrl }
    })

    return NextResponse.json({ logoUrl })
  } catch (error) {
    console.error('Fehler beim Hochladen des Team-Logos', error)
    return NextResponse.json({ error: 'Fehler beim Hochladen des Logos' }, { status: 500 })
  }
}
