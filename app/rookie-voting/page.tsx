'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchWithVoterId } from '../../components/client-voter'
import VotingProgress from '../../components/VotingProgress'

type Player = {
  id: string
  name: string
  team?: string | null
  position?: string | null
  imageUrl?: string | null
  teamLogoUrl?: string | null
  jerseyNumber?: number | null
  points?: number
  goals?: number
  assists?: number
  games?: number
}

function RookieVotingContent() {
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
        const res = await fetch(`/api/players?league=${league}&rookieCandidates=${league}`)
        if (res.ok) {
          const data = await res.json()
          setAllPlayers(data)
        } else {
          setAllPlayers([])
        }
      } catch (e) {
        console.error('Fehler beim Laden der Rookie-Kandidaten', e)
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
        const res = await fetchWithVoterId(`/api/rookie-votes?league=${league}`, {
          method: 'GET',
          cache: 'no-store'
        })
        if (!res.ok) {
          setSelectedPlayer(null)
          return
        }
        const data = await res.json()
        if (data && data.player) {
          setSelectedPlayer(data.player)
        } else {
          setSelectedPlayer(null)
        }
      } catch (e) {
        console.error('Fehler beim Laden des Rookie-Votes', e)
        setSelectedPlayer(null)
      }
    }
    loadVote()
  }, [league])

  useEffect(() => {
    const checkOtherLeague = async () => {
      try {
        const otherLeague = league === 'herren' ? 'damen' : 'herren'
        const fromCrossLeague = sessionStorage.getItem('fromCrossLeague') === 'true'
        if (fromCrossLeague) {
          setHasVotedBothLeagues(true)
          return
        }
        const { fetchWithVoterId } = await import('../../components/client-voter')
        const [otherFairPlay, otherRookie] = await Promise.all([
          fetchWithVoterId(`/api/fairplay-votes?league=${otherLeague}`),
          fetchWithVoterId(`/api/rookie-votes?league=${otherLeague}`)
        ])
        const otherFairPlayData = otherFairPlay.ok ? await otherFairPlay.json() : null
        const otherRookieData = otherRookie.ok ? await otherRookie.json() : null
        const hasVotedOther = (otherFairPlayData && otherFairPlayData.player) ||
                              (otherRookieData && otherRookieData.player)
        setHasVotedBothLeagues(!!hasVotedOther)
      } catch (e) {
        console.error('Fehler beim Prüfen der anderen Liga', e)
      }
    }
    checkOtherLeague()
  }, [league])

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

    const playerIdToSave = selectedPlayerId
    setSaving(true)
    setModalOpen(false)
    setSelectedPlayerId(null)
    try {
      const res = await fetchWithVoterId('/api/rookie-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: playerIdToSave, league })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || `Fehler beim Speichern (Status: ${res.status})`)
      }
      setSelectedPlayer(player)
    } catch (error: any) {
      console.error('Fehler beim Speichern', error)
      alert(error.message || 'Fehler beim Speichern des Votes')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    try {
      const res = await fetchWithVoterId('/api/rookie-votes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ league })
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
    allPlayers.forEach((p) => { if (p.team) teams.add(p.team) })
    return Array.from(teams).sort()
  }, [allPlayers])

  const filteredPlayers = useMemo(() => {
    let filtered = allPlayers
    if (selectedTeam) filtered = filtered.filter((p) => p.team === selectedTeam)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((p) =>
        [p.name, p.team, p.position].filter(Boolean).some((f) => String(f).toLowerCase().includes(term))
      )
    }
    const unique = Array.from(new Map(filtered.map((p) => [p.id, p])).values())
    if (sortBy === 'team') return [...unique].sort((a, b) => (a.team || '').localeCompare(b.team || ''))
    if (sortBy === 'name') return [...unique].sort((a, b) => a.name.localeCompare(b.name))
    return unique
  }, [allPlayers, searchTerm, selectedTeam, sortBy])

  const leagueName = league === 'damen' ? '1. Damen Bundesliga' : '1. Herren Bundesliga'
  const backgroundImage = league === 'damen' ? '/Hintergrund Damen.png' : '/Hintergrund Herren.png'

  return (
    <div className="min-h-screen relative">
      <VotingProgress />
      <div className="fixed inset-0 z-0">
        <img src={backgroundImage} alt={`${leagueName} Hintergrund`} className="w-full h-full object-cover blur-sm" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="text-center mb-4 sm:mb-8">
          <div className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-primary-600 text-white rounded-lg font-heading uppercase text-xs sm:text-sm mb-2 sm:mb-3 shadow-lg">
            {leagueName}
          </div>
          <h1 className="text-xl sm:text-3xl md:text-5xl font-heading uppercase mb-2 text-white drop-shadow-lg px-2">
            Rookie of the Season
          </h1>
          <p className="text-xs sm:text-sm text-white drop-shadow-md mt-2 px-2">
            Wähle deinen Rookie of the Season
          </p>
        </div>

        <div className="max-w-md mx-auto mb-4 sm:mb-8">
          {selectedPlayer ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary-500 relative group">
              {(selectedPlayer.imageUrl || selectedPlayer.teamLogoUrl) ? (
                <div className="relative w-full aspect-[3/4] max-h-40 sm:max-h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                  <img src={selectedPlayer.imageUrl || selectedPlayer.teamLogoUrl || ''} alt={selectedPlayer.name} className={selectedPlayer.imageUrl ? 'w-full h-full object-cover' : 'w-full h-full object-contain'} />
                </div>
              ) : (
                <div className="w-full aspect-[3/4] max-h-40 sm:max-h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-16 h-16 sm:w-24 sm:h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div className="p-3 sm:p-4 text-center space-y-1 sm:space-y-2 min-w-0">
                <div className="font-heading text-base sm:text-lg font-bold text-gray-900 break-words">{selectedPlayer.name}</div>
                {selectedPlayer.team && <div className="text-xs sm:text-sm text-gray-600 break-words">{selectedPlayer.team}</div>}
                {selectedPlayer.jerseyNumber && <div className="text-xs sm:text-sm text-gray-500">#{selectedPlayer.jerseyNumber}</div>}
              </div>
              <button onClick={openSelect} className="absolute top-2 right-2 px-3 py-1 bg-primary-600 text-white rounded-lg text-xs hover:bg-primary-700 opacity-0 group-hover:opacity-100 transition-opacity">Ändern</button>
              <button onClick={handleRemove} className="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
            </div>
          ) : (
            <div onClick={openSelect} className="bg-white/90 border-2 border-dashed border-gray-400 rounded-lg shadow-lg flex flex-col items-center justify-center hover:border-primary-500 hover:bg-white transition-all min-h-[300px] cursor-pointer">
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

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0 mt-6 sm:mt-8 px-2">
          <button
            className="text-xs sm:text-sm text-white hover:text-gray-200 font-heading drop-shadow-md flex items-center gap-1 justify-center sm:justify-start"
            onClick={async () => {
              if (saving) return
              await new Promise((r) => setTimeout(r, 100))
              router.push(`/fair-play-voting?league=${league}`)
            }}
          >
            ← Zurück
          </button>
          <button
            disabled={!canProceed || saving}
            onClick={async () => {
              if (!canProceed || saving) return
              await new Promise((r) => setTimeout(r, 100))
              if (hasVotedBothLeagues) {
                router.push('/referee-voting')
              } else {
                router.push(`/cross-league-voting?league=${league}`)
              }
            }}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-heading text-sm sm:text-lg uppercase ${
              canProceed && !saving ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            } shadow-lg transition-colors`}
          >
            {saving ? 'Speichere...' : 'Weiter'}
          </button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-2 sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base sm:text-xl font-heading text-gray-900">Rookie-Kandidat auswählen</h2>
              <button onClick={() => { setModalOpen(false); setSelectedPlayerId(null) }} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-3 sm:p-4 border-b border-gray-200 space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input type="text" placeholder="Spieler suchen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="w-full sm:w-48 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                  <option value="">Alle Teams</option>
                  {availableTeams.map((team) => <option key={team} value={team}>{team}</option>)}
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'default' | 'team' | 'name')} className="w-full sm:w-48 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                  <option value="default">Standard</option>
                  <option value="team">Nach Team</option>
                  <option value="name">Nach Name</option>
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              {loadingPlayers ? <div className="text-center py-8 text-gray-500">Lade Kandidaten...</div> : filteredPlayers.length === 0 ? <div className="text-center py-8 text-gray-500">Keine Rookie-Kandidaten für diese Liga. Bitte im Admin unter Spieler welche markieren.</div> : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                  {filteredPlayers.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => setSelectedPlayerId(player.id)}
                      className={`bg-white rounded-lg shadow-md overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${selectedPlayerId === player.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-primary-300'}`}
                    >
                      {(player.imageUrl || player.teamLogoUrl) ? (
                        <div className="relative w-full h-24 sm:h-28 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
                          <img src={player.imageUrl || player.teamLogoUrl || ''} alt={player.name} className={player.imageUrl ? 'w-full h-full object-cover' : 'w-full h-full object-contain'} />
                        </div>
                      ) : (
                        <div className="w-full h-24 sm:h-28 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                      )}
                      <div className="p-2 text-center space-y-1 min-w-0">
                        <div className="font-heading text-xs font-bold text-gray-900 break-words">{player.name}</div>
                        {player.team && <div className="text-[10px] text-gray-600 break-words">{player.team}</div>}
                        {player.jerseyNumber && <div className="text-[10px] text-gray-500">#{player.jerseyNumber}</div>}
                      </div>
                      {selectedPlayerId === player.id && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2 [touch-action:manipulation]">
              <button type="button" onClick={() => { setModalOpen(false); setSelectedPlayerId(null) }} className="min-h-[44px] px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-heading text-xs sm:text-sm [touch-action:manipulation]">Abbrechen</button>
              <button type="button" onClick={handleSave} disabled={!selectedPlayerId || saving} className={`min-h-[44px] px-4 py-2 rounded-lg font-heading text-xs sm:text-sm [touch-action:manipulation] ${selectedPlayerId && !saving ? 'bg-primary-600 hover:bg-primary-700 text-white active:opacity-90' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}>
                {saving ? 'Speichern...' : 'Auswählen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RookieVotingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-white">Lade...</div></div>}>
      <RookieVotingContent />
    </Suspense>
  )
}
