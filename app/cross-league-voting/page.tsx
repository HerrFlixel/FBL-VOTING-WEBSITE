'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CrossLeagueVotingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const leagueParam = searchParams.get('league')
  const currentLeague = leagueParam === 'damen' ? 'damen' : 'herren'
  const otherLeague = currentLeague === 'damen' ? 'herren' : 'damen'

  const otherLeagueName = otherLeague === 'damen' ? '1. Damen Bundesliga' : '1. Herren Bundesliga'
  const backgroundImage = currentLeague === 'damen' ? '/Hintergrund Damen.png' : '/Hintergrund Herren.png'

  const handleYes = () => {
    // Navigiere zum Voting der anderen Liga mit Flag, dass man von Cross-League kommt
    router.push(`/allstar-voting?league=${otherLeague}&fromCrossLeague=true`)
  }

  const handleNo = () => {
    // Navigiere direkt zum Schiedsrichter-Paar-Voting
    router.push('/referee-voting')
  }

  return (
    <div className="min-h-screen relative">
      {/* Hintergrundbild */}
      <div className="fixed inset-0 z-0">
        <img
          src={backgroundImage}
          alt="Hintergrund"
          className="w-full h-full object-cover blur-sm"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 flex items-center justify-center min-h-screen">
        <div className="bg-white/95 rounded-lg shadow-xl p-4 sm:p-8 md:p-12 text-center space-y-4 sm:space-y-6 w-full">
          <div className="flex justify-start mb-2 sm:mb-4">
            <button
              className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 font-heading flex items-center gap-1"
              onClick={() => router.push(`/fair-play-voting?league=${currentLeague}`)}
            >
              ← Zurück
            </button>
          </div>
          <div className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-primary-600 text-white rounded-lg font-heading uppercase text-xs sm:text-sm mb-3 sm:mb-4 shadow-lg">
            {currentLeague === 'damen' ? '1. Damen Bundesliga' : '1. Herren Bundesliga'}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-heading uppercase text-gray-900 mb-6 sm:mb-8 px-2">
            Möchten Sie auch für die <span className="font-heading">{otherLeagueName}</span> abstimmen?
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={handleYes}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-heading text-base sm:text-lg uppercase shadow-lg transition-colors"
            >
              Ja
            </button>
            <button
              onClick={handleNo}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-heading text-base sm:text-lg uppercase shadow-lg transition-colors"
            >
              Nein
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CrossLeagueVotingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Lade...</div>
      </div>
    }>
      <CrossLeagueVotingContent />
    </Suspense>
  )
}
