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
    <main className="h-screen flex flex-col md:flex-row items-stretch relative overflow-hidden">
      {/* Weißer Trennstreifen - nur auf Desktop */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-white z-20 transform -translate-x-1/2"></div>
      
      <div
        className="flex-1 h-1/2 md:h-full relative cursor-pointer group overflow-hidden"
        onClick={() => handleStart('damen')}
      >
        <img
          src="/Hintergrund Damen.png"
          alt="1. Damen Bundesliga"
          className="absolute inset-0 w-full h-full object-cover blur-sm transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading mb-2 sm:mb-3 md:mb-4 text-white drop-shadow-lg text-center uppercase px-2 w-full" style={{ fontFamily: 'Futura Extra Bold Oblique, Futura, system-ui, sans-serif' }}>
            1. Damen Bundesliga
          </h1>
          <button className="mt-2 sm:mt-3 md:mt-4 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg bg-white hover:bg-gray-100 text-black font-heading text-sm sm:text-base md:text-lg shadow-lg uppercase">
            Voting starten
          </button>
        </div>
      </div>

      <div
        className="flex-1 h-1/2 md:h-full relative cursor-pointer group overflow-hidden"
        onClick={() => handleStart('herren')}
      >
        <img
          src="/Hintergrund Herren.png"
          alt="1. Herren Bundesliga"
          className="absolute inset-0 w-full h-full object-cover blur-sm transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading mb-2 sm:mb-3 md:mb-4 text-white drop-shadow-lg text-center uppercase px-2 w-full" style={{ fontFamily: 'Futura Extra Bold Oblique, Futura, system-ui, sans-serif' }}>
            1. Herren Bundesliga
          </h1>
          <button className="mt-2 sm:mt-3 md:mt-4 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg bg-white hover:bg-gray-100 text-black font-heading text-sm sm:text-base md:text-lg shadow-lg uppercase">
            Voting starten
          </button>
        </div>
      </div>
    </main>
  )
}


