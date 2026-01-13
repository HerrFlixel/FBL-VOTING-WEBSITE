'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Coach = {
  id: string
  name: string
  team?: string | null
  imageUrl?: string | null
  league: string
}

export default function CoachVotingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const leagueParam = searchParams.get('league')
  const league = leagueParam === 'damen' ? 'damen' : 'herren'

  const [allCoaches, setAllCoaches] = useState<Coach[]>([])
  const [loadingCoaches, setLoadingCoaches] = useState(false)
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadCoaches = async () => {
      setLoadingCoaches(true)
      try {
        const res = await fetch(`/api/coaches?league=${league}`)
        if (res.ok) {
          const data = await res.json()
          setAllCoaches(data)
        } else {
          setAllCoaches([])
        }
      } catch (e) {
        console.error('Fehler beim Laden der Trainer', e)
        setAllCoaches([])
      } finally {
        setLoadingCoaches(false)
      }
    }
    loadCoaches()
  }, [league])

  useEffect(() => {
    const loadVote = async () => {
      try {
        const res = await fetch(`/api/coach-votes?league=${league}`)
        if (!res.ok) return
        const data = await res.json()
        if (data && data.coach) {
          setSelectedCoach(data.coach)
        }
      } catch (e) {
        console.error('Fehler beim Laden des Votes', e)
      }
    }
    loadVote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league])

  const openSelect = () => {
    setSelectedCoachId(selectedCoach?.id ?? null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!selectedCoachId) {
      setModalOpen(false)
      return
    }
    const coach = allCoaches.find((c) => c.id === selectedCoachId)
    if (!coach) return

    setSaving(true)
    try {
      const res = await fetch('/api/coach-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: selectedCoachId,
          league
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || `Fehler beim Speichern (Status: ${res.status})`)
      }
      setSelectedCoach(coach)
      setModalOpen(false)
      setSelectedCoachId(null)
    } catch (error: any) {
      console.error('Fehler beim Speichern', error)
      alert(error.message || 'Fehler beim Speichern des Votes')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    try {
      const res = await fetch('/api/coach-votes', {
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
      setSelectedCoach(null)
    } catch (error: any) {
      console.error('Fehler beim Löschen', error)
      alert(error.message || 'Fehler beim Löschen des Votes')
    }
  }

  const canProceed = selectedCoach !== null

  const filteredCoaches = useMemo(() => {
    if (!searchTerm) return allCoaches
    const term = searchTerm.toLowerCase()
    return allCoaches.filter((c) =>
      [c.name, c.team]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term))
    )
  }, [allCoaches, searchTerm])

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
            Trainer des Jahres
          </h1>
          <p className="text-sm text-white drop-shadow-md mt-2">
            Wähle deinen Trainer des Jahres
          </p>
        </div>

        {/* Selected Coach Card */}
        <div className="max-w-md mx-auto mb-8">
          {selectedCoach ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary-500 relative group">
              {selectedCoach.imageUrl ? (
                <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={selectedCoach.imageUrl}
                    alt={selectedCoach.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div className="p-4 text-center space-y-2">
                <div className="font-heading text-lg font-bold text-gray-900">{selectedCoach.name}</div>
                {selectedCoach.team && (
                  <div className="text-sm text-gray-600">{selectedCoach.team}</div>
                )}
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
                <div className="text-lg font-heading text-gray-700 mb-2">Trainer auswählen</div>
                <div className="text-sm text-gray-500">Klicken zum Auswählen</div>
              </div>
            </div>
          )}
        </div>

        {/* Weiter Button */}
        <div className="text-center mt-8">
          <button
            disabled={!canProceed}
            onClick={() => router.push(`/fair-play-voting?league=${league}`)}
            className={`px-6 py-3 rounded-lg font-heading text-lg uppercase ${
              canProceed
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            } shadow-lg transition-colors`}
          >
            Weiter zum Fair Play Award
          </button>
        </div>
      </div>

      {/* Coach Selection Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-heading text-gray-900">Trainer auswählen</h2>
              <button
                onClick={() => {
                  setModalOpen(false)
                  setSelectedCoachId(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Trainer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingCoaches ? (
                <div className="text-center py-8 text-gray-500">Lade Trainer...</div>
              ) : filteredCoaches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Keine Trainer gefunden</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredCoaches.map((coach) => (
                    <div
                      key={coach.id}
                      onClick={() => setSelectedCoachId(coach.id)}
                      className={`bg-white rounded-lg shadow-md overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${
                        selectedCoachId === coach.id
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {coach.imageUrl ? (
                        <div className="relative w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200">
                          <img
                            src={coach.imageUrl}
                            alt={coach.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="p-2 text-center space-y-1">
                        <div className="font-heading text-xs font-bold text-gray-900 truncate">{coach.name}</div>
                        {coach.team && (
                          <div className="text-[10px] text-gray-600 truncate">{coach.team}</div>
                        )}
                      </div>
                      {selectedCoachId === coach.id && (
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

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setModalOpen(false)
                  setSelectedCoachId(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-heading"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedCoachId || saving}
                className={`px-4 py-2 rounded-lg font-heading ${
                  selectedCoachId && !saving
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

