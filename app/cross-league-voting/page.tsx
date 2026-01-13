'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function CrossLeagueVotingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const leagueParam = searchParams.get('league')
  const currentLeague = leagueParam === 'damen' ? 'damen' : 'herren'
  const otherLeague = currentLeague === 'damen' ? 'herren' : 'damen'

  const otherLeagueName = otherLeague === 'damen' ? '1. Damen Bundesliga' : '1. Herren Bundesliga'
  const backgroundImage = currentLeague === 'damen' ? '/Hintergrund Damen.png' : '/Hintergrund Herren.png'

  const handleYes = () => {
    // Navigiere zum Voting der anderen Liga
    router.push(`/allstar-voting?league=${otherLeague}`)
  }

  const handleNo = () => {
    // Navigiere direkt zum Schiedsrichter-Paar-Voting
    router.push(`/referee-voting?league=${currentLeague}`)
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
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="bg-white/95 rounded-lg shadow-xl p-8 md:p-12 text-center space-y-6">
          <div className="inline-block px-3 py-1 bg-primary-600 text-white rounded-lg font-heading uppercase text-sm mb-4 shadow-lg">
            {currentLeague === 'damen' ? '1. Damen Bundesliga' : '1. Herren Bundesliga'}
          </div>
          <h1 className="text-3xl md:text-5xl font-heading uppercase text-gray-900 mb-8">
            Möchten Sie auch für die <span className="font-heading">{otherLeagueName}</span> abstimmen?
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleYes}
              className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-heading text-lg uppercase shadow-lg transition-colors"
            >
              Ja
            </button>
            <button
              onClick={handleNo}
              className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-heading text-lg uppercase shadow-lg transition-colors"
            >
              Nein
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

