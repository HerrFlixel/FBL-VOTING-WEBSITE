'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

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

export default function PageReloadHandler() {
  const pathname = usePathname()

  useEffect(() => {
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const isReload = navigationEntries.length > 0 && navigationEntries[0].type === 'reload'

    if (isReload && isVotingPath(pathname)) {
      // Fallback für mobile Browser: beforeunload-Dialoge werden dort oft nicht angezeigt.
      alert('Die Seite wurde neu geladen. Aus Sicherheitsgründen startet die Abstimmung wieder auf der Startseite.')
      window.location.replace('/')
      return
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isVotingPath(pathname)) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pathname])

  return null
}

