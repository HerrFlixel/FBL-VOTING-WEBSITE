'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Player = {
  id: string
  name: string
  team?: string | null
  position?: string | null
  imageUrl?: string | null
  jerseyNumber?: number | null
  points?: number
  goals?: number
  assists?: number
  games?: number
}

export default function FairPlayVotingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const leagueParam = searchParams.get('league')
  const league = leagueParam === 'damen' ? 'damen' : 'herren'

  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasVotedBothLeagues, setHasVotedBothLeagues] = useState(false)
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
    const loadVote = async () => {
      try {
        const res = await fetch(`/api/fairplay-votes?league=${league}`)
        if (!res.ok) return
        const data = await res.json()
        if (data && data.player) {
          setSelectedPlayer(data.player)
        }
      } catch (e) {
        console.error('Fehler beim Laden des Votes', e)
      }
    }
    loadVote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league])

  useEffect(() => {
    const checkBothLeagues = async () => {
      try {
        const [herrenRes, damenRes] = await Promise.all([
          fetch('/api/fairplay-votes?league=herren'),
          fetch('/api/fairplay-votes?league=damen')
        ])
        const herrenData = herrenRes.ok ? await herrenRes.json() : null
        const damenData = damenRes.ok ? await damenRes.json() : null
        setHasVotedBothLeagues(!!herrenData && !!damenData)
      } catch (e) {
        console.error('Fehler beim Prüfen beider Ligen', e)
      }
    }
    checkBothLeagues()
  }, [])

  const openSelect = () => {
    setSelectedPlayerId(selectedPlayer?.id ?? null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!selectedPlayerId) {
      setModalOpen(false)
      return
    }
    const player = allPlayers.find((p) => p.id === selectedPlayerId)
    if (!player) return

    setSaving(true)
    try {
      const res = await fetch('/api/fairplay-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayerId,
          league
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || `Fehler beim Speichern (Status: ${res.status})`)
      }
      setSelectedPlayer(player)
      setModalOpen(false)
      setSelectedPlayerId(null)
    } catch (error: any) {
      console.error('Fehler beim Speichern', error)
      alert(error.message || 'Fehler beim Speichern des Votes')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    try {
      const res = await fetch('/api/fairplay-votes', {
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
      setSelectedPlayer(null)
    } catch (error: any) {
      console.error('Fehler beim Löschen', error)
      alert(error.message || 'Fehler beim Löschen des Votes')
    }
  }

  const canProceed = selectedPlayer !== null

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
            Fair Play Award
          </h1>
          <p className="text-sm text-white drop-shadow-md mt-2">
            Wähle deinen Fair Play Award Gewinner
          </p>
        </div>

        {/* Selected Player Card */}
        <div className="max-w-md mx-auto mb-8">
          {selectedPlayer ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary-500 relative group">
              {selectedPlayer.imageUrl ? (
                <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={selectedPlayer.imageUrl}
                    alt={selectedPlayer.name}
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
                <div className="font-heading text-lg font-bold text-gray-900">{selectedPlayer.name}</div>
                {selectedPlayer.team && (
                  <div className="text-sm text-gray-600">{selectedPlayer.team}</div>
                )}
                {selectedPlayer.jerseyNumber && (
                  <div className="text-sm text-gray-500">#{selectedPlayer.jerseyNumber}</div>
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
                <div className="text-lg font-heading text-gray-700 mb-2">Spieler auswählen</div>
                <div className="text-sm text-gray-500">Klicken zum Auswählen</div>
              </div>
            </div>
          )}
        </div>

        {/* Weiter Button */}
        <div className="text-center mt-8">
          <button
            disabled={!canProceed}
            onClick={() => {
              if (hasVotedBothLeagues) {
                // Wenn bereits für beide Ligen gevotet wurde, direkt zum Schiedsrichter-Paar-Voting
                router.push(`/referee-voting?league=${league}`)
              } else {
                // Sonst zur Cross-League-Abfrage
                router.push(`/cross-league-voting?league=${league}`)
              }
            }}
            className={`px-6 py-3 rounded-lg font-heading text-lg uppercase ${
              canProceed
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            } shadow-lg transition-colors`}
          >
            Weiter
          </button>
        </div>
      </div>

      {/* Player Selection Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-heading text-gray-900">Spieler auswählen</h2>
              <button
                onClick={() => {
                  setModalOpen(false)
                  setSelectedPlayerId(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Spieler suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
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
                  className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="default">Standard</option>
                  <option value="team">Nach Team</option>
                  <option value="name">Nach Name</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingPlayers ? (
                <div className="text-center py-8 text-gray-500">Lade Spieler...</div>
              ) : filteredPlayers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Keine Spieler gefunden</div>
              ) : sortBy === 'team' ? (
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {players.map((player) => (
                          <div
                            key={player.id}
                            onClick={() => setSelectedPlayerId(player.id)}
                            className={`bg-white rounded-lg shadow-md overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${
                              selectedPlayerId === player.id
                                ? 'border-primary-500 ring-2 ring-primary-200'
                                : 'border-gray-200 hover:border-primary-300'
                            }`}
                          >
                            {player.imageUrl ? (
                              <div className="relative w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200">
                                <img
                                  src={player.imageUrl}
                                  alt={player.name}
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
                              <div className="font-heading text-xs font-bold text-gray-900 truncate">{player.name}</div>
                              {player.team && (
                                <div className="text-[10px] text-gray-600 truncate">{player.team}</div>
                              )}
                              {player.jerseyNumber && (
                                <div className="text-[10px] text-gray-500">#{player.jerseyNumber}</div>
                              )}
                              {(player.points !== undefined || player.goals !== undefined || player.assists !== undefined) && (
                                <div className="pt-1 border-t border-gray-200 flex items-center justify-center gap-2 flex-wrap">
                                  {player.points !== undefined && (
                                    <div className="text-[9px] text-green-600 font-semibold">
                                      P: {player.points}
                                    </div>
                                  )}
                                  {player.goals !== undefined && (
                                    <div className="text-[9px] text-gray-700">
                                      T: {player.goals}
                                    </div>
                                  )}
                                  {player.assists !== undefined && (
                                    <div className="text-[9px] text-gray-700">
                                      V: {player.assists}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {selectedPlayerId === player.id && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()
              ) : (
                // Standard-Grid ohne Gruppierung
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredPlayers.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => setSelectedPlayerId(player.id)}
                      className={`bg-white rounded-lg shadow-md overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${
                        selectedPlayerId === player.id
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {player.imageUrl ? (
                        <div className="relative w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200">
                          <img
                            src={player.imageUrl}
                            alt={player.name}
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
                        <div className="font-heading text-xs font-bold text-gray-900 truncate">{player.name}</div>
                        {player.team && (
                          <div className="text-[10px] text-gray-600 truncate">{player.team}</div>
                        )}
                        {player.jerseyNumber && (
                          <div className="text-[10px] text-gray-500">#{player.jerseyNumber}</div>
                        )}
                        {(player.points !== undefined || player.goals !== undefined || player.assists !== undefined) && (
                          <div className="pt-1 border-t border-gray-200 flex items-center justify-center gap-2 flex-wrap">
                            {player.points !== undefined && (
                              <div className="text-[9px] text-green-600 font-semibold">
                                P: {player.points}
                              </div>
                            )}
                            {player.goals !== undefined && (
                              <div className="text-[9px] text-gray-700">
                                T: {player.goals}
                              </div>
                            )}
                            {player.assists !== undefined && (
                              <div className="text-[9px] text-gray-700">
                                V: {player.assists}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedPlayerId === player.id && (
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
                  setSelectedPlayerId(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-heading"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedPlayerId || saving}
                className={`px-4 py-2 rounded-lg font-heading ${
                  selectedPlayerId && !saving
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

