'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Session beim Laden der Startseite leeren
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
    }
  }, [])

  const handleStart = (league: 'herren' | 'damen') => {
    router.push(`/allstar-voting?league=${league}`)
  }

  return (
    <main className="min-h-screen flex items-stretch relative">
      {/* Weißer Trennstreifen */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white z-20 transform -translate-x-1/2"></div>
      
      <div
        className="flex-1 relative cursor-pointer group overflow-hidden"
        onClick={() => handleStart('damen')}
      >
        <img
          src="/Hintergrund Damen.png"
          alt="1. Damen Bundesliga"
          className="absolute inset-0 w-full h-full object-cover blur-sm transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
          <h1 className="text-3xl md:text-5xl font-heading mb-4 text-white drop-shadow-lg text-center uppercase">
            1. Damen Bundesliga
          </h1>
          <button className="mt-4 px-6 py-3 rounded-lg bg-white hover:bg-gray-100 text-black font-heading text-lg shadow-lg uppercase">
            Voting starten
          </button>
        </div>
      </div>

      <div
        className="flex-1 relative cursor-pointer group overflow-hidden"
        onClick={() => handleStart('herren')}
      >
        <img
          src="/Hintergrund Herren.png"
          alt="1. Herren Bundesliga"
          className="absolute inset-0 w-full h-full object-cover blur-sm transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
          <h1 className="text-3xl md:text-5xl font-heading mb-4 text-white drop-shadow-lg text-center uppercase">
            1. Herren Bundesliga
          </h1>
          <button className="mt-4 px-6 py-3 rounded-lg bg-white hover:bg-gray-100 text-black font-heading text-lg shadow-lg uppercase">
            Voting starten
          </button>
        </div>
      </div>
    </main>
  )
}


