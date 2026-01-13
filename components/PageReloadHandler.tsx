'use client'

import { useEffect } from 'react'

/**
 * Komponente, die beim Reload alle nicht-finalisierten Votes löscht
 */
export default function PageReloadHandler() {
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

    // Handler für beforeunload - markiert dass ein Reload kommt
    const handleBeforeUnload = () => {
      // Setze Flag für bevorstehenden Reload
      sessionStorage.setItem('pendingReload', 'true')
      // Versuche Votes zu löschen (kann fehlschlagen, aber wir versuchen es)
      try {
        const data = JSON.stringify({})
        navigator.sendBeacon('/api/votes/clear-session', data)
      } catch (e) {
        // Ignoriere Fehler
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return null
}

