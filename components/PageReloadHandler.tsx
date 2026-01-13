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
      // Lösche alle nicht-finalisierten Votes
      fetch('/api/votes/clear-session', { method: 'POST' }).catch(console.error)
      sessionStorage.clear()
    }

    // Handler für beforeunload - löscht Votes bevor die Seite verlassen wird
    const handleBeforeUnload = () => {
      // Lösche alle nicht-finalisierten Votes synchron (falls möglich)
      // Da fetch asynchron ist, verwenden wir navigator.sendBeacon für zuverlässigere Löschung
      const data = JSON.stringify({})
      navigator.sendBeacon('/api/votes/clear-session', data)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return null
}

