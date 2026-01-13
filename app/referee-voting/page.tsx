'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type RefereePair = {
  id: string
  name: string
  imageUrl?: string | null
}

function RefereeVotingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const leagueParam = searchParams.get('league')
  const league = leagueParam === 'damen' ? 'damen' : 'herren'

  const [allPairs, setAllPairs] = useState<RefereePair[]>([])
  const [loadingPairs, setLoadingPairs] = useState(false)
  const [selectedPair, setSelectedPair] = useState<RefereePair | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadPairs = async () => {
      setLoadingPairs(true)
      try {
        const res = await fetch('/api/referee-pairs')
        if (res.ok) {
          const data = await res.json()
          setAllPairs(data)
        } else {
          setAllPairs([])
        }
      } catch (e) {
        console.error('Fehler beim Laden der Schiedsrichter-Paare', e)
        setAllPairs([])
      } finally {
        setLoadingPairs(false)
      }
    }
    loadPairs()
  }, [])

  useEffect(() => {
    const loadVote = async () => {
      // Prüfe ob es ein Reload war - wenn ja, lösche zuerst alle Votes
      const wasReload = sessionStorage.getItem('wasReload')
      if (wasReload === 'true') {
        // Lösche alle Votes vom Server
        try {
          await fetch('/api/votes/clear-session', { method: 'POST' })
        } catch (e) {
          console.error('Fehler beim Löschen der Votes nach Reload', e)
        }
        sessionStorage.removeItem('wasReload')
        // Setze selectedPair zurück
        setSelectedPair(null)
        return
      }

      try {
        const res = await fetch(`/api/referee-votes?league=${league}`)
        if (!res.ok) return
        const data = await res.json()
        if (data && data.refereePair) {
          setSelectedPair(data.refereePair)
        }
      } catch (e) {
        console.error('Fehler beim Laden des Votes', e)
      }
    }
    loadVote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league])

  const openSelect = () => {
    setSelectedPairId(selectedPair?.id ?? null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!selectedPairId) {
      setModalOpen(false)
      return
    }
    const pair = allPairs.find((p) => p.id === selectedPairId)
    if (!pair) return

    setSaving(true)
    try {
      const res = await fetch('/api/referee-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refereePairId: selectedPairId,
          league
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || `Fehler beim Speichern (Status: ${res.status})`)
      }
      setSelectedPair(pair)
      setModalOpen(false)
      setSelectedPairId(null)
    } catch (error: any) {
      console.error('Fehler beim Speichern', error)
      alert(error.message || 'Fehler beim Speichern des Votes')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    try {
      const res = await fetch('/api/referee-votes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          league
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || `Fehler beim Löschen (Status: ${res.status})`)
      }
      setSelectedPair(null)
    } catch (error: any) {
      console.error('Fehler beim Löschen', error)
      alert(error.message || 'Fehler beim Löschen des Votes')
    }
  }

  const canProceed = selectedPair !== null

  const filteredPairs = useMemo(() => {
    if (!searchTerm) return allPairs
    const term = searchTerm.toLowerCase()
    return allPairs.filter((p) =>
      p.name.toLowerCase().includes(term)
    )
  }, [allPairs, searchTerm])

  const leagueName =
    league === 'damen' ? '1. Damen Bundesliga' : '1. Herren Bundesliga'
  
  const backgroundImage = league === 'damen' ? '/Hintergrund Damen.png' : '/Hintergrund Herren.png'

  return (
    <div className="min-h-screen relative">
      {/* Hintergrundbild */}
      <div className="fixed inset-0 z-0">
        <img
          src={backgroundImage}
          alt={`${leagueName} Hintergrund`}
          className="w-full h-full object-cover blur-sm"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-primary-600 text-white rounded-lg font-heading uppercase text-sm mb-3 shadow-lg">
            {leagueName}
          </div>
          <h1 className="text-3xl md:text-5xl font-heading uppercase mb-2 text-white drop-shadow-lg">
            Schiedsrichter-Paar Voting
          </h1>
          <p className="text-sm text-white drop-shadow-md mt-2">
            Wähle dein Schiedsrichter-Paar des Jahres
          </p>
        </div>

        {/* Selected Pair Card */}
        <div className="max-w-md mx-auto mb-8">
          {selectedPair ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary-500 relative group">
              {selectedPair.imageUrl ? (
                <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={selectedPair.imageUrl}
                    alt={selectedPair.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              )}
              <div className="p-4 text-center space-y-2">
                <div className="font-heading text-lg font-bold text-gray-900">{selectedPair.name}</div>
              </div>
              <button
                onClick={openSelect}
                className="absolute top-2 right-2 px-3 py-1 bg-primary-600 text-white rounded-lg text-xs hover:bg-primary-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Ändern
              </button>
              <button
                onClick={handleRemove}
                className="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ) : (
            <div
              onClick={openSelect}
              className="bg-white/90 border-2 border-dashed border-gray-400 rounded-lg shadow-lg flex flex-col items-center justify-center hover:border-primary-500 hover:bg-white transition-all min-h-[300px] cursor-pointer"
            >
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <div className="text-center px-4">
                <div className="text-lg font-heading text-gray-700 mb-2">Schiedsrichter-Paar auswählen</div>
                <div className="text-sm text-gray-500">Klicken zum Auswählen</div>
              </div>
            </div>
          )}
        </div>

        {/* Weiter Button */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0 mt-6 sm:mt-8 px-2">
          <button
            className="text-xs sm:text-sm text-white hover:text-gray-200 font-heading drop-shadow-md flex items-center gap-1 justify-center sm:justify-start"
            onClick={() => {
              // Zurück zu Cross League oder Fair Play, je nachdem ob man cross league gemacht hat
              // Für jetzt einfach zu Fair Play zurück
              router.push(`/fair-play-voting?league=${league}`)
            }}
          >
            ← Zurück
          </button>
          <button
            disabled={!canProceed}
            onClick={() => router.push(`/special-award?league=${league}`)}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-heading text-sm sm:text-lg uppercase ${
              canProceed
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            } shadow-lg transition-colors`}
          >
            Weiter zum Sonderpreis
          </button>
        </div>
      </div>

      {/* Pair Selection Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-2 sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base sm:text-xl font-heading text-gray-900">Schiedsrichter-Paar auswählen</h2>
              <button
                onClick={() => {
                  setModalOpen(false)
                  setSelectedPairId(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 sm:p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Schiedsrichter-Paar suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              {loadingPairs ? (
                <div className="text-center py-8 text-gray-500">Lade Schiedsrichter-Paare...</div>
              ) : filteredPairs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Keine Schiedsrichter-Paare gefunden</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                  {filteredPairs.map((pair) => (
                    <div
                      key={pair.id}
                      onClick={() => setSelectedPairId(pair.id)}
                      className={`bg-white rounded-lg shadow-md overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${
                        selectedPairId === pair.id
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {pair.imageUrl ? (
                        <div className="relative w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200">
                          <img
                            src={pair.imageUrl}
                            alt={pair.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      )}
                      <div className="p-2 text-center space-y-1">
                        <div className="font-heading text-xs font-bold text-gray-900 truncate">{pair.name}</div>
                      </div>
                      {selectedPairId === pair.id && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => {
                  setModalOpen(false)
                  setSelectedPairId(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-heading text-xs sm:text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedPairId || saving}
                className={`px-4 py-2 rounded-lg font-heading text-xs sm:text-sm ${
                  selectedPairId && !saving
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {saving ? 'Speichern...' : 'Auswählen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RefereeVotingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Lade...</div>
      </div>
    }>
      <RefereeVotingContent />
    </Suspense>
  )
}

