'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Pfade, auf denen nicht-finalisierte Votes verloren gehen können */
const VOTING_PATHS = [
  '/wahl',
  '/allstar-voting',
  '/mvp-voting',
  '/coach-voting',
  '/fair-play-voting',
  '/rookie-voting',
  '/referee-voting',
  '/special-award',
  '/user-form'
]

function isVotingPath(pathname: string | null): boolean {
  if (!pathname) return false
  return VOTING_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

/**
 * Komponente, die beim Reload alle nicht-finalisierten Votes löscht
 * und auf Voting-Seiten eine Warnung anzeigt, bevor die Seite verlassen wird.
 */
export default function PageReloadHandler() {
  const pathname = usePathname()

  useEffect(() => {
    // Prüfe ob es ein Reload war
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const isReload = navigationEntries.length > 0 && navigationEntries[0].type === 'reload'

    if (isReload) {
      // Lösche alle nicht-finalisierten Votes sofort
      fetch('/api/votes/clear-session', { method: 'POST' }).catch(console.error)
      sessionStorage.clear()
      // Setze Flag, dass es ein Reload war
      sessionStorage.setItem('wasReload', 'true')
    } else {
      // Entferne Flag wenn es kein Reload war
      sessionStorage.removeItem('wasReload')
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Auf Voting-Seiten: Browser-Warnung anzeigen (nicht gespeicherte Votes gehen verloren)
      if (isVotingPath(pathname)) {
        e.preventDefault()
        e.returnValue = ''
      }
      // Setze Flag für bevorstehenden Reload
      sessionStorage.setItem('pendingReload', 'true')
      try {
        navigator.sendBeacon('/api/votes/clear-session', JSON.stringify({}))
      } catch (err) {
        // Ignoriere Fehler
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname])

  return null
}

