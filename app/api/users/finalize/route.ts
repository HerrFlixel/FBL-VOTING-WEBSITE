import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getVoterInfo } from '../../../../lib/voter'
import { checkRateLimit } from '../../../../lib/rate-limit'

/**
 * Retry-Logik für SQLite-Locks
 * SQLite unterstützt nur einen Writer gleichzeitig, daher können bei hoher Last Locks auftreten
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 100
): Promise<T> {
  let lastError: any
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Prüfe ob es ein SQLite-Lock-Error ist
      const isTransientSqliteError =
        error?.code === 'SQLITE_BUSY' ||
        error?.code === 'P1008' || // operation timeout under contention
        error?.code === 'P2028' || // transaction API timeout/failure
        error?.code === 'P2034' || // transaction conflict
        error?.message?.includes('database is locked') ||
        error?.message?.includes('SQLITE_BUSY') ||
        error?.message?.includes('Transaction API error') ||
        error?.message?.includes('timed out')
      
      if (isTransientSqliteError && attempt < maxRetries - 1) {
        // Exponentielles Backoff: 100ms, 200ms, 400ms, 800ms, ...
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`[Finalize] Transient DB error detected, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Wenn es kein Lock-Error ist oder wir keine Retries mehr haben, werfe den Fehler
      throw error
    }
  }
  
  throw lastError
}

async function hasAnyFinalizedVotes(db: any, voterId: string): Promise<boolean> {
  const checks = await Promise.all([
    db.allstarVote.count({ where: { voterId, userId: { not: null } } }),
    db.mVPVote.count({ where: { voterId, userId: { not: null } } }),
    db.coachVote.count({ where: { voterId, userId: { not: null } } }),
    db.fairPlayVote.count({ where: { voterId, userId: { not: null } } }),
    db.rookieVote.count({ where: { voterId, userId: { not: null } } }),
    db.refereePairVote.count({ where: { voterId, userId: { not: null } } }),
    db.specialAwardVote.count({ where: { voterId, userId: { not: null } } })
  ])
  return checks.some((c) => c > 0)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, teamId, league } = body as {
      firstName: string
      lastName: string
      email: string
      teamId?: string
      league?: string
    }

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Vorname, Nachname und E-Mail sind erforderlich.' },
        { status: 400 }
      )
    }
    const normalizedEmail = String(email).trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
        { status: 400 }
      )
    }

    const { ip, voterId } = getVoterInfo()
    console.log('[Finalize] voterId:', voterId)
    const limiter = checkRateLimit({
      key: `finalize:${voterId}:${ip}`,
      limit: 15,
      windowMs: 5 * 60 * 1000
    })
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Zu viele Finalisierungsversuche. Bitte später erneut versuchen.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
      )
    }

    // Prüfe ob bereits finalisierte Votes für diese voterId existieren (über alle Kategorien)
    const existingFinalized = await hasAnyFinalizedVotes(prisma, voterId)
    
    if (existingFinalized) {
      console.log(`[Finalize] Votes für voterId ${voterId} wurden bereits finalisiert`)
      // Finde den zugehörigen User
      const existingUser = await prisma.user.findFirst({
        where: { voterId },
        orderBy: { createdAt: 'desc' }
      })
      
      if (existingUser) {
        return NextResponse.json({ 
          success: true, 
          userId: existingUser.id,
          message: 'Votes wurden bereits finalisiert'
        })
      }
    }

    // Führe die Finalisierung mit Retry-Logik aus
    const result = await withRetry(async () => {
      // Verwende eine Transaktion für Atomarität
      // Wenn ein Fehler auftritt, werden alle Änderungen zurückgerollt
      return await prisma.$transaction(async (tx) => {
        // Prüfe nochmal innerhalb der Transaktion (Double-Check)
        const doubleCheck = await hasAnyFinalizedVotes(tx, voterId)
        
        if (doubleCheck) {
          const existingUser = await tx.user.findFirst({
            where: { voterId },
            orderBy: { createdAt: 'desc' }
          })
          if (existingUser) {
            return { user: existingUser, alreadyFinalized: true }
          }
        }

        // Neuen User-Eintrag für diese Formular-Abgabe anlegen
        const user = await tx.user.create({
          data: {
            firstName,
            lastName,
            email: normalizedEmail,
            voterId,
            voterIp: ip,
            league,
            teamId: teamId || null
          }
        })

        // Alle nicht-finalisierten Votes (userId = null) dieses Voters mit diesem User verknüpfen
        const whereVoter = { voterId, userId: null as string | null }

        // Zähle die Votes vor dem Update für Debugging
        const countsBefore = {
          allstar: await tx.allstarVote.count({ where: whereVoter }),
          mvp: await tx.mVPVote.count({ where: whereVoter }),
          coach: await tx.coachVote.count({ where: whereVoter }),
          fairPlay: await tx.fairPlayVote.count({ where: whereVoter }),
          rookie: await tx.rookieVote.count({ where: whereVoter }),
          referee: await tx.refereePairVote.count({ where: whereVoter }),
          special: await tx.specialAwardVote.count({ where: whereVoter })
        }
        
        const totalPending = Object.values(countsBefore).reduce((sum, n) => sum + n, 0)
        if (totalPending === 0) {
          throw new Error('Keine offenen Votes zum Finalisieren gefunden.')
        }

        console.log(`[Finalize] Finalizing votes for voterId: ${voterId}, counts:`, countsBefore)

        // Alle Updates in der Transaktion ausführen
        const results = await Promise.all([
          tx.allstarVote.updateMany({
            where: whereVoter,
            data: { userId: user.id }
          }),
          tx.mVPVote.updateMany({
            where: whereVoter,
            data: { userId: user.id }
          }),
          tx.coachVote.updateMany({
            where: whereVoter,
            data: { userId: user.id }
          }),
          tx.fairPlayVote.updateMany({
            where: whereVoter,
            data: { userId: user.id }
          }),
          tx.rookieVote.updateMany({
            where: whereVoter,
            data: { userId: user.id }
          }),
          tx.refereePairVote.updateMany({
            where: whereVoter,
            data: { userId: user.id }
          }),
          tx.specialAwardVote.updateMany({
            where: whereVoter,
            data: { userId: user.id }
          })
        ])
        
        const finalizedCounts = results.map((r, i) => ({
          type: ['allstar', 'mvp', 'coach', 'fairPlay', 'rookie', 'referee', 'special'][i],
          count: r.count
        }))
        console.log(`[Finalize] Finalized votes:`, finalizedCounts)
        
        // Debug: Prüfe ob Referee-Votes finalisiert wurden
        if (finalizedCounts.find(r => r.type === 'referee')?.count === 0 && countsBefore.referee > 0) {
          console.error(`[Finalize] WARNING: Referee votes not finalized! Before: ${countsBefore.referee}, After: 0`)
          // Prüfe ob es Votes mit dieser voterId gibt
          const allRefereeVotes = await tx.refereePairVote.findMany({
            where: { voterId }
          })
          console.log(`[Finalize] All referee votes for voterId ${voterId}:`, allRefereeVotes.map(v => ({ id: v.id, voterId: v.voterId, userId: v.userId })))
        }

        return { user, finalizedCounts, alreadyFinalized: false }
      }, {
        // Bei hoher Last mehr Puffer gegen Timeout
        timeout: 20000,
        // Isolation Level: Read Committed (Standard für SQLite)
      })
    })

    // Wenn bereits finalisiert, gebe die bestehende User-ID zurück
    if (result.alreadyFinalized && result.user) {
      return NextResponse.json({ 
        success: true, 
        userId: result.user.id,
        message: 'Votes wurden bereits finalisiert'
      })
    }

    return NextResponse.json({ 
      success: true, 
      userId: result.user.id,
      finalizedCounts: result.finalizedCounts
    })
  } catch (error: any) {
    console.error('[Finalize] Fehler beim Finalisieren des Users:', error)
    
    // Spezifische Fehlerbehandlung
    if (error?.code === 'P2002') {
      // Unique constraint violation - könnte bedeuten, dass bereits finalisiert wurde
      return NextResponse.json(
        { error: 'Votes wurden möglicherweise bereits finalisiert. Bitte prüfen Sie die Admin-Ansicht.' },
        { status: 409 } // Conflict
      )
    }
    
    if (error?.code === 'P2034') {
      // Transaction timeout
      return NextResponse.json(
        { error: 'Die Finalisierung hat zu lange gedauert. Bitte versuchen Sie es erneut.' },
        { status: 408 } // Request Timeout
      )
    }
    
    return NextResponse.json(
      { error: 'Fehler beim Finalisieren des Users. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    )
  }
}



