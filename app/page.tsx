'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Session beim Laden der Startseite leeren
    const clearSession = async () => {
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
        // Lösche alle nicht-finalisierten Votes vom Server
        try {
          await fetch('/api/votes/clear-session', { method: 'POST' })
        } catch (e) {
          console.error('Fehler beim Zurücksetzen der Session', e)
        }
      }
    }
    clearSession()
  }, [])

  const handleStart = (league: 'herren' | 'damen') => {
    router.push(`/allstar-voting?league=${league}`)
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row items-stretch relative">
      {/* Weißer Trennstreifen - nur auf Desktop */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-white z-20 transform -translate-x-1/2"></div>
      
      <div
        className="flex-1 min-h-[50vh] md:min-h-screen relative cursor-pointer group overflow-hidden"
        onClick={() => handleStart('damen')}
      >
        <img
          src="/Hintergrund Damen.png"
          alt="1. Damen Bundesliga"
          className="absolute inset-0 w-full h-full object-cover blur-sm transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-8 md:justify-center">
          <h1 className="text-3xl md:text-5xl font-heading mb-3 sm:mb-4 text-white drop-shadow-lg text-center uppercase px-2">
            1. Damen Bundesliga
          </h1>
          <button className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white hover:bg-gray-100 text-black font-heading text-base sm:text-lg shadow-lg uppercase">
            Voting starten
          </button>
        </div>
      </div>

      <div
        className="flex-1 min-h-[50vh] md:min-h-screen relative cursor-pointer group overflow-hidden"
        onClick={() => handleStart('herren')}
      >
        <img
          src="/Hintergrund Herren.png"
          alt="1. Herren Bundesliga"
          className="absolute inset-0 w-full h-full object-cover blur-sm transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-8 md:justify-center">
          <h1 className="text-3xl md:text-5xl font-heading mb-3 sm:mb-4 text-white drop-shadow-lg text-center uppercase px-2">
            1. Herren Bundesliga
          </h1>
          <button className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white hover:bg-gray-100 text-black font-heading text-base sm:text-lg shadow-lg uppercase">
            Voting starten
          </button>
        </div>
      </div>
    </main>
  )
}


