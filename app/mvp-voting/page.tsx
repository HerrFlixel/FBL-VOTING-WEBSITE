'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Player = {
  id: string
  name: string
  team?: string | null
  position?: string | null
  imageUrl?: string | null
  jerseyNumber?: number | null
  goals?: number
  assists?: number
  points?: number
}

type Selected = {
  rank: number
  player: Player
}

function MVPVotingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const leagueParam = searchParams.get('league')
  const league = leagueParam === 'damen' ? 'damen' : 'herren'

  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [selectedRank, setSelectedRank] = useState<number | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<Selected[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [sortBy, setSortBy] = useState<'default' | 'team' | 'name'>('default')

  useEffect(() => {
    const loadPlayers = async () => {
      setLoadingPlayers(true)
      try {
        const res = await fetch(`/api/players?league=${league}`)
        if (res.ok) {
          const data = await res.json()
          setAllPlayers(data)
        } else {
          setAllPlayers([])
        }
      } catch (e) {
        console.error('Fehler beim Laden der Spieler', e)
        setAllPlayers([])
      } finally {
        setLoadingPlayers(false)
      }
    }
    loadPlayers()
  }, [league])

  useEffect(() => {
    const loadVotes = async () => {
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
        // Setze selectedPlayers zurück
        setSelectedPlayers([])
        return
      }

      try {
        // Lade alle Votes für diese Liga - wichtig: warte auf Antwort
        const res = await fetch(`/api/mvp-votes?league=${league}`, {
          method: 'GET',
          cache: 'no-store' // Stelle sicher, dass wir immer die neuesten Votes bekommen
        })
        if (!res.ok) {
          console.warn('Fehler beim Laden der Votes:', res.status)
          return
        }
        const data = await res.json()
        
        // Lade alle Votes - wichtig: prüfe ob vote.player existiert
        if (Array.isArray(data)) {
          const loaded = data
            .filter((vote: any) => vote && vote.rank && vote.player)
            .map((vote: any) => ({
              rank: vote.rank,
              player: vote.player
            }))
          setSelectedPlayers(loaded)
        } else {
          setSelectedPlayers([])
        }
      } catch (e) {
        console.error('Fehler beim Laden der Votes', e)
        setSelectedPlayers([]) // Stelle sicher, dass State gesetzt wird
      }
    }
    loadVotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league])

  const openRank = (rank: number) => {
    setSelectedRank(rank)
    const existing = selectedPlayers.find((p) => p.rank === rank)
    setSelectedPlayerId(existing?.player.id ?? null)
    setModalOpen(true)
  }

  const handleSaveRank = async () => {
    if (!selectedRank || !selectedPlayerId) {
      setModalOpen(false)
      setSelectedRank(null)
      setSelectedPlayerId(null)
      return
    }
    const player = allPlayers.find((p) => p.id === selectedPlayerId)
    if (!player) return

    // keine Doppelbelegung
    const already = selectedPlayers.find(
      (p) => p.player.id === player.id && p.rank !== selectedRank
    )
    if (already) {
      alert(`Dieser Spieler ist bereits auf Platz ${already.rank} gewählt.`)
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/mvp-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rank: selectedRank,
          playerId: selectedPlayerId,
          league
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || `Fehler beim Speichern (Status: ${res.status})`)
      }
      setSelectedPlayers((prev) => {
        const filtered = prev.filter((p) => p.rank !== selectedRank)
        return [...filtered, { rank: selectedRank, player }].sort(
          (a, b) => a.rank - b.rank
        )
      })
      setModalOpen(false)
      setSelectedRank(null)
      setSelectedPlayerId(null)
    } catch (error: any) {
      console.error('Fehler beim Speichern', error)
      alert(error.message || 'Fehler beim Speichern des Votes')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveRank = async (rank: number) => {
    try {
      const res = await fetch('/api/mvp-votes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rank,
          league
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || `Fehler beim Löschen (Status: ${res.status})`)
      }
      setSelectedPlayers((prev) => prev.filter((p) => p.rank !== rank))
    } catch (error: any) {
      console.error('Fehler beim Löschen', error)
      alert(error.message || 'Fehler beim Löschen des Votes')
    }
  }

  const canProceed = selectedPlayers.length >= 5

  const availableTeams = useMemo(() => {
    const teams = new Set<string>()
    allPlayers.forEach((p) => {
      if (p.team) teams.add(p.team)
    })
    return Array.from(teams).sort()
  }, [allPlayers])

  const filteredPlayers = useMemo(() => {
    let filtered = allPlayers

    // Team-Filter
    if (selectedTeam) {
      filtered = filtered.filter((p) => p.team === selectedTeam)
    }

    // Such-Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((p) =>
        [p.name, p.team, p.position]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(term))
      )
    }

    // Entferne Duplikate basierend auf ID
    const uniquePlayers = Array.from(
      new Map(filtered.map((p) => [p.id, p])).values()
    )

    // Sortierung
    if (sortBy === 'team') {
      return [...uniquePlayers].sort((a, b) => {
        const teamA = a.team || ''
        const teamB = b.team || ''
        return teamA.localeCompare(teamB)
      })
    } else if (sortBy === 'name') {
      return [...uniquePlayers].sort((a, b) => {
        return a.name.localeCompare(b.name)
      })
    }

    return uniquePlayers
  }, [allPlayers, searchTerm, selectedTeam, sortBy])

  const isTaken = (playerId: string) =>
    selectedPlayers.some((p) => p.player.id === playerId)

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
            MVP Voting
          </h1>
          <p className="text-sm text-white drop-shadow-md mt-2">
            Wähle deine Top 10 MVP-Kandidaten (mindestens 5 erforderlich)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rank) => {
            const sel = selectedPlayers.find((p) => p.rank === rank)
            return (
              <div
                key={rank}
                className="relative cursor-pointer group"
                onClick={() => openRank(rank)}
              >
                {sel ? (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary-500 hover:border-primary-600 transition-all">
                    {sel.player.imageUrl ? (
                      <div className="relative w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200">
                        <img
                          src={sel.player.imageUrl}
                          alt={sel.player.name}
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
                      <div className="inline-block px-2 py-1 rounded-full bg-primary-600 text-white font-heading text-xs mb-1">
                        Platz {rank}
                      </div>
                      <div className="font-heading text-xs font-bold text-gray-900 truncate">{sel.player.name}</div>
                      {sel.player.team && (
                        <div className="text-[10px] text-gray-600 truncate">{sel.player.team}</div>
                      )}
                      {sel.player.jerseyNumber && (
                        <div className="text-[10px] text-gray-500">#{sel.player.jerseyNumber}</div>
                      )}
                    </div>
                    <button
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveRank(rank)
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/90 border-2 border-dashed border-gray-400 rounded-lg shadow-lg flex flex-col items-center justify-center hover:border-primary-500 hover:bg-white transition-all min-h-[200px]">
                    <svg className="w-10 h-10 text-gray-400 group-hover:text-primary-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <div className="text-center px-2">
                      <div className="inline-block px-2 py-1 rounded-full bg-gray-200 text-gray-700 font-heading text-xs mb-2">
                        Platz {rank}
                      </div>
                      <div className="text-xs text-gray-500">Klicken zum Auswählen</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0 mt-6 sm:mt-8 px-2">
          <button
            className="text-xs sm:text-sm text-white hover:text-gray-200 font-heading drop-shadow-md flex items-center gap-1 justify-center sm:justify-start"
            onClick={async () => {
              // Warte bis alle Speicher-Operationen abgeschlossen sind
              if (saving) return
              await new Promise(resolve => setTimeout(resolve, 100))
              router.push(`/allstar-voting?league=${league}`)
            }}
          >
            ← Zurück
          </button>
          <button
            disabled={!canProceed || saving}
            onClick={async () => {
              if (!canProceed || saving) return
              // Warte bis alle Speicher-Operationen abgeschlossen sind
              await new Promise(resolve => setTimeout(resolve, 100))
              router.push(`/coach-voting?league=${league}`)
            }}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-heading text-sm sm:text-lg uppercase ${
              canProceed && !saving
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }`}
          >
            {saving ? 'Speichere...' : 'Weiter zum Trainer →'}
          </button>
        </div>
      </div>

      {modalOpen && selectedRank && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-2 sm:p-2 sm:p-4">
          <div className="bg-white border border-gray-300 rounded-t-xl sm:rounded-xl sm:rounded-2xl max-w-6xl w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <div className="font-heading text-base sm:text-xl text-gray-900 truncate">Platz {selectedRank} ({11 - selectedRank} Punkte)</div>
                <div className="text-xs sm:text-sm text-gray-600">Spieler auswählen</div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl ml-2 flex-shrink-0"
                onClick={() => {
                  setModalOpen(false)
                  setSelectedRank(null)
                  setSelectedPlayerId(null)
                }}
              >
                ×
              </button>
            </div>

            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Spieler suchen..."
                  className="w-full sm:flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full sm:w-48 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Alle Teams</option>
                  {availableTeams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'default' | 'team' | 'name')}
                  className="w-full sm:w-48 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="default">Standard</option>
                  <option value="team">Nach Team</option>
                  <option value="name">Nach Name</option>
                </select>
                {loadingPlayers && (
                  <span className="text-xs text-gray-500">Lade Spieler...</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl min-h-0">
                <div className="p-2 sm:p-4">
                  {sortBy === 'team' ? (
                    // Gruppiert nach Teams
                    (() => {
                      const grouped = filteredPlayers.reduce((acc, p) => {
                        const team = p.team || 'Kein Team'
                        if (!acc[team]) acc[team] = []
                        acc[team].push(p)
                        return acc
                      }, {} as Record<string, typeof filteredPlayers>)
                      
                      return Object.entries(grouped).map(([team, players]) => (
                        <div key={team} className="mb-6 last:mb-0">
                          <div className="mb-3 pb-2 border-b-2 border-primary-500">
                            <h3 className="font-heading text-sm text-gray-900">{team}</h3>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                            {players.map((p) => {
                              const taken = isTaken(p.id) && selectedPlayerId !== p.id
                              const isSelected = selectedPlayerId === p.id
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    if (!taken) {
                                      setSelectedPlayerId(isSelected ? null : p.id)
                                    }
                                  }}
                                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                    taken
                                      ? 'opacity-50 cursor-not-allowed border-gray-200'
                                      : isSelected
                                      ? 'border-primary-600 shadow-lg scale-105'
                                      : 'border-gray-300 hover:border-primary-400 hover:shadow-md'
                                  }`}
                                >
                                  <div className="bg-white">
                                    {p.imageUrl ? (
                                      <div className="relative w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200">
                                        <img
                                          src={p.imageUrl}
                                          alt={p.name}
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
                                      <div className="font-heading text-xs font-bold text-gray-900 truncate">{p.name}</div>
                                      {p.team && (
                                        <div className="text-[10px] text-gray-600 truncate">{p.team}</div>
                                      )}
                                      {p.jerseyNumber && (
                                        <div className="text-[10px] text-gray-500">#{p.jerseyNumber}</div>
                                      )}
                                      {(p.points !== undefined || p.goals !== undefined || p.assists !== undefined) && (
                                        <div className="pt-1 border-t border-gray-200 flex items-center justify-center gap-2 flex-wrap">
                                          {p.points !== undefined && (
                                            <div className="text-[9px] text-green-600 font-semibold">
                                              P: {p.points}
                                            </div>
                                          )}
                                          {p.goals !== undefined && (
                                            <div className="text-[9px] text-gray-700">
                                              T: {p.goals}
                                            </div>
                                          )}
                                          {p.assists !== undefined && (
                                            <div className="text-[9px] text-gray-700">
                                              V: {p.assists}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {taken && (
                                      <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                                        <span className="text-xs text-white font-heading bg-red-500 px-2 py-1 rounded">Bereits gewählt</span>
                                      </div>
                                    )}
                                    {isSelected && !taken && (
                                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    })()
                  ) : (
                    // Standard-Grid ohne Gruppierung
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                      {filteredPlayers.map((p) => {
                        const taken = isTaken(p.id) && selectedPlayerId !== p.id
                        const isSelected = selectedPlayerId === p.id
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (!taken) {
                                setSelectedPlayerId(isSelected ? null : p.id)
                              }
                            }}
                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                              taken
                                ? 'opacity-50 cursor-not-allowed border-gray-200'
                                : isSelected
                                ? 'border-primary-600 shadow-lg scale-105'
                                : 'border-gray-300 hover:border-primary-400 hover:shadow-md'
                            }`}
                          >
                        <div className="bg-white">
                          {p.imageUrl ? (
                            <div className="relative w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
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
                            <div className="font-heading text-xs font-bold text-gray-900 truncate">{p.name}</div>
                            {p.team && (
                              <div className="text-[10px] text-gray-600 truncate">{p.team}</div>
                            )}
                            {p.jerseyNumber && (
                              <div className="text-[10px] text-gray-500">#{p.jerseyNumber}</div>
                            )}
                            {(p.points !== undefined || p.goals !== undefined || p.assists !== undefined) && (
                              <div className="pt-1 border-t border-gray-200 flex items-center justify-center gap-2 flex-wrap">
                                {p.points !== undefined && (
                                  <div className="text-[9px] text-green-600 font-semibold">
                                    P: {p.points}
                                  </div>
                                )}
                                {p.goals !== undefined && (
                                  <div className="text-[9px] text-gray-700">
                                    T: {p.goals}
                                  </div>
                                )}
                                {p.assists !== undefined && (
                                  <div className="text-[9px] text-gray-700">
                                    V: {p.assists}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {taken && (
                            <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                              <span className="text-xs text-white font-heading bg-red-500 px-2 py-1 rounded">Bereits gewählt</span>
                            </div>
                          )}
                          {isSelected && !taken && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                            </div>
                          </div>
                        )
                      })}
                      {filteredPlayers.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                          Keine Spieler gefunden.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-2 border-t border-gray-200 px-3 sm:px-0">
                <button
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-heading px-3 sm:px-0 py-2 sm:py-0"
                  onClick={() => {
                    setModalOpen(false)
                    setSelectedRank(null)
                    setSelectedPlayerId(null)
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveRank}
                  disabled={!selectedPlayerId || saving}
                  className={`px-4 sm:px-5 py-2 rounded-lg font-heading uppercase text-xs sm:text-sm ${
                    selectedPlayerId && !saving
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Bestätigen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MVPVotingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Lade...</div>
      </div>
    }>
      <MVPVotingContent />
    </Suspense>
  )
}


