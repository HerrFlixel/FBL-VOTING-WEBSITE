'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import Image from 'next/image'
import { fetchWithVoterId } from '../../components/client-voter'
import VotingProgress from '../../components/VotingProgress'
import { useLanguage } from '../../components/LanguageProvider'

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

type PositionKey = 'gk' | 'ld' | 'rd' | 'c' | 'lw' | 'rw'

type Selection = Record<PositionKey, Player | null>

const positions: { key: PositionKey; x: number; y: number }[] = [
  { key: 'gk', x: 50, y: 80 },
  { key: 'ld', x: 25, y: 60 },
  { key: 'rd', x: 75, y: 60 },
  { key: 'c', x: 50, y: 40 },
  { key: 'lw', x: 25, y: 20 },
  { key: 'rw', x: 75, y: 20 }
]

function AllstarVotingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()
  const leagueParam = searchParams.get('league')
  const league: 'herren' | 'damen' = leagueParam === 'damen' ? 'damen' : 'herren'
  const fromCrossLeague = searchParams.get('fromCrossLeague') === 'true'

  const getPositionLabel = (key: PositionKey) => {
    if (key === 'gk') return t('positions.gk')
    if (key === 'ld' || key === 'rd') return t('positions.defender')
    return t('positions.forward')
  }

  // Excel liefert künftig nur O/D/G (Angreifer/Verteidiger/Torwart).
  // Ältere Imports können ggf. bereits GK/LD/RD/C/LW/RW enthalten.
  const positionBucket = (pos?: string | null) => {
    if (!pos) return null
    const p = String(pos).trim().toUpperCase()
    if (p === 'G' || p === 'GK') return 'G'
    if (p === 'D' || p === 'LD' || p === 'RD') return 'D'
    if (p === 'O' || p === 'C' || p === 'LW' || p === 'RW') return 'O'
    return null
  }

  const isPlayerAllowedForActivePosition = (player: Player, active: PositionKey) => {
    const bucket = positionBucket(player.position)
    if (!bucket) return false
    if (active === 'gk') return bucket === 'G'
    if (active === 'ld' || active === 'rd') return bucket === 'D'
    // c/lw/rw
    return bucket === 'O'
  }
  
  // Setze Flag in sessionStorage wenn von Cross-League kommend und speichere Liga
  useEffect(() => {
    if (fromCrossLeague) {
      sessionStorage.setItem('fromCrossLeague', 'true')
    }
    // Speichere die aktuelle Liga für Navigation zurück
    sessionStorage.setItem('lastLeague', league)
  }, [fromCrossLeague, league])

  const [players, setPlayers] = useState<Player[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [currentLine, setCurrentLine] = useState<1 | 2 | 3>(1)
  const [selections, setSelections] = useState<Record<1 | 2 | 3, Selection>>({
    1: { gk: null, ld: null, rd: null, c: null, lw: null, rw: null },
    2: { gk: null, ld: null, rd: null, c: null, lw: null, rw: null },
    3: { gk: null, ld: null, rd: null, c: null, lw: null, rw: null }
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [activePosition, setActivePosition] = useState<PositionKey | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [sortBy, setSortBy] = useState<'default' | 'team' | 'name'>('default')

  useEffect(() => {
    const load = async () => {
      setLoadingPlayers(true)
      try {
        const res = await fetch(`/api/players?league=${league}`)
        const data = res.ok ? await res.json() : []
        setPlayers(data)
      } catch (e) {
        console.error('Fehler beim Laden der Spieler', e)
        setPlayers([])
      } finally {
        setLoadingPlayers(false)
      }
    }
    load()
  }, [league])

  useEffect(() => {
    const loadVotes = async () => {
      try {
        const res = await fetchWithVoterId(`/api/allstar-votes?league=${league}`, {
          method: 'GET',
          cache: 'no-store' // Stelle sicher, dass wir immer die neuesten Votes bekommen
        })
        if (!res.ok) {
          console.warn('Fehler beim Laden der Votes:', res.status)
          return
        }
        const data = await res.json()
        
        // Initialisiere alle Reihen korrekt, um sicherzustellen, dass alle Votes geladen werden
        const next: Record<1 | 2 | 3, Selection> = {
          1: { gk: null, ld: null, rd: null, c: null, lw: null, rw: null },
          2: { gk: null, ld: null, rd: null, c: null, lw: null, rw: null },
          3: { gk: null, ld: null, rd: null, c: null, lw: null, rw: null }
        }
        
        // Lade alle Votes für alle Reihen - wichtig: prüfe ob vote.player existiert
        if (Array.isArray(data)) {
          for (const vote of data) {
            if (vote && vote.line && vote.position && vote.player) {
              const line = vote.line as 1 | 2 | 3
              const pos = vote.position as PositionKey
              // Prüfe ob die Position gültig ist und ob next[line] existiert
              // Wichtig: explizite Prüfung für alle Positionen inklusive 'gk'
              if (next[line] && pos && ['gk', 'ld', 'rd', 'c', 'lw', 'rw'].includes(pos) && next[line][pos] !== undefined) {
                next[line][pos] = vote.player
              }
            }
          }
        }
        
        // Setze Selections - wichtig: setze immer, auch wenn leer
        setSelections(next)
      } catch (e) {
        console.error('Fehler beim Laden der Votes', e)
      }
    }
    loadVotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league])

  const openSelect = (pos: PositionKey) => {
    setActivePosition(pos)
    const current = selections[currentLine][pos]
    if (current && !isPlayerAllowedForActivePosition(current, pos)) {
      setSelectedPlayerId(null)
    } else {
      setSelectedPlayerId(current?.id ?? null)
    }
    setModalOpen(true)
  }

  const usedPlayerIds = useMemo(() => {
    const ids = new Set<string>()
    Object.values(selections).forEach((line) =>
      Object.values(line).forEach((plr) => {
        if (plr) ids.add(plr.id)
      })
    )
    return ids
  }, [selections])

  const availableTeams = useMemo(() => {
    const teams = new Set<string>()
    players.forEach((p) => {
      if (p.team) teams.add(p.team)
    })
    return Array.from(teams).sort()
  }, [players])

  const filteredPlayers = useMemo(() => {
    let filtered = players

    // Team-Filter
    if (selectedTeam) {
      filtered = filtered.filter((p) => p.team === selectedTeam)
    }

    // Positions-Filter: Im Modal darf nur gewählt werden, wenn die Position passt.
    if (activePosition) {
      filtered = filtered.filter((p) => isPlayerAllowedForActivePosition(p, activePosition))
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
    // 'default' behält die ursprüngliche Reihenfolge bei

    return uniquePlayers
  }, [players, searchTerm, selectedTeam, sortBy, activePosition])

  const saveSelection = async () => {
    if (!activePosition || !selectedPlayerId) {
      setModalOpen(false)
      setActivePosition(null)
      setSelectedPlayerId(null)
      return
    }
    // Doppel vermeiden
    if (usedPlayerIds.has(selectedPlayerId) && selections[currentLine][activePosition]?.id !== selectedPlayerId) {
      alert(t('allstar.playerAlreadyChosen'))
      return
    }
    setSaving(true)
    try {
      const selectedPlayer = players.find((p) => p.id === selectedPlayerId)
      if (!selectedPlayer || !isPlayerAllowedForActivePosition(selectedPlayer, activePosition)) {
        // Sicherheitscheck (sollte durch Filter bereits verhindert sein)
        setSaving(false)
        return
      }

      const res = await fetchWithVoterId('/api/allstar-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line: currentLine,
          position: activePosition,
          playerId: selectedPlayerId,
          league
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || `Fehler beim Speichern (Status: ${res.status})`)
      }
      const player = players.find((p) => p.id === selectedPlayerId)
      if (player) {
        setSelections((prev) => ({
          ...prev,
          [currentLine]: {
            ...prev[currentLine],
            [activePosition]: player
          }
        }))
      }
    } catch (e: any) {
      alert(e?.message || 'Fehler beim Speichern')
    } finally {
      setSaving(false)
      setModalOpen(false)
      setActivePosition(null)
      setSelectedPlayerId(null)
    }
  }

  const clearPosition = async (pos: PositionKey) => {
    // Entferne auch aus der Datenbank
    try {
      const res = await fetchWithVoterId('/api/allstar-votes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line: currentLine,
          position: pos,
          league
        })
      })
      if (!res.ok) {
        console.error('Fehler beim Löschen des Votes')
      }
    } catch (e) {
      console.error('Fehler beim Löschen', e)
    }
    
    setSelections((prev) => ({
      ...prev,
      [currentLine]: {
        ...prev[currentLine],
        [pos]: null
      }
    }))
  }

  const lineComplete = (line: 1 | 2 | 3) =>
    Object.values(selections[line]).every((p) => p !== null)

  const canGoNext = currentLine === 1 ? lineComplete(1) : true

  const leagueTitle = league === 'damen' ? t('wahl.leagueWomen') : t('wahl.leagueMen')

  const PlayerCard = ({ player, position, onClick }: { player: Player | null; position: PositionKey; onClick: () => void }) => {
    const pos = positions.find((p) => p.key === position)
    if (!player) {
      return (
        <div
          onClick={onClick}
          className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
          style={{ left: `${pos?.x}%`, top: `${pos?.y}%` }}
        >
          <div className="w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-32 lg:w-28 lg:h-36 bg-white/90 border-2 border-dashed border-gray-400 rounded-lg shadow-lg flex flex-col items-center justify-center hover:border-primary-500 hover:bg-white transition-all">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-gray-400 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[8px] sm:text-[10px] md:text-xs text-gray-500 mt-1 sm:mt-2 text-center px-1 sm:px-2">{getPositionLabel(position)}</span>
          </div>
        </div>
      )
    }

    return (
      <div
        onClick={onClick}
        className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
        style={{ left: `${pos?.x}%`, top: `${pos?.y}%` }}
      >
        <div className="w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-32 lg:w-28 lg:h-36 bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary-500 relative flex flex-col">
          {(player.imageUrl || player.teamLogoUrl) ? (
            <div className="relative w-full h-8 sm:h-9 md:h-11 lg:h-14 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
              <img
                src={player.imageUrl || player.teamLogoUrl || ''}
                alt={player.name}
                className={player.imageUrl ? 'w-full h-full object-cover' : 'w-full h-full object-contain'}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center">
                        <svg class="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    `
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-full h-8 sm:h-9 md:h-11 lg:h-14 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <div className="p-1 sm:p-2 text-center space-y-0.5 sm:space-y-1 flex-1 flex flex-col justify-center min-h-0">
            <div className="font-heading text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900 leading-tight break-words px-0.5 sm:px-1" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>{player.name}</div>
            {player.team && (
              <div className="text-[8px] sm:text-[8px] md:text-[10px] text-gray-600 leading-tight break-words px-0.5 sm:px-1" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>{player.team}</div>
            )}
            {player.jerseyNumber && (
              <div className="text-[7px] sm:text-[8px] md:text-[10px] text-gray-500 flex-shrink-0">#{player.jerseyNumber}</div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              clearPosition(position)
            }}
            className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  const backgroundImage = league === 'damen' ? '/Hintergrund Damen.png' : '/Hintergrund Herren.png'

  return (
    <div className="min-h-screen relative">
      <VotingProgress />
      {/* Hintergrundbild */}
      <div className="fixed inset-0 z-0">
        <img
          src={backgroundImage}
          alt={`${leagueTitle} Hintergrund`}
          className="w-full h-full object-cover blur-sm"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="text-center space-y-1 sm:space-y-2">
          <div className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-primary-600 text-white rounded-lg font-heading uppercase text-xs sm:text-sm mb-1 sm:mb-2 shadow-lg">
            {leagueTitle}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-heading uppercase text-white drop-shadow-lg px-2">
            {t('allstar.title')}
          </h1>
          <p className="text-xs sm:text-sm text-white drop-shadow-md px-2">
            {t('allstar.lineOptional')}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap px-2">
          {[1, 2, 3].map((ln) => {
            const isRow1Complete = lineComplete(1)
            const isDisabled = ln > 1 && !isRow1Complete
            return (
              <button
                key={ln}
                onClick={() => {
                  if (!isDisabled) {
                    setCurrentLine(ln as 1 | 2 | 3)
                  }
                }}
                disabled={isDisabled}
                className={clsx(
                  'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-heading uppercase border-2 transition-all text-xs sm:text-sm',
                  isDisabled
                    ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                    : currentLine === ln
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-primary-400 bg-white hover:bg-gray-50'
                )}
              >
                {t('allstar.line')} {ln}
              </button>
            )
          })}
        </div>

        {/* Floorball Field */}
        <div className={`relative w-full max-w-3xl mx-auto aspect-[5/6] sm:aspect-[4/3] rounded-lg overflow-hidden shadow-2xl ${league === 'damen' ? 'bg-red-200' : 'bg-blue-300'}`}>
          {/* Field Background Image */}
          <div className="absolute inset-0">
            <img
              src="/Feld.png"
              alt="Floorball Feld"
              className="w-full h-full object-cover opacity-30"
            />
          </div>
          
          {/* Field Lines */}
          <div className="absolute inset-0 border-4 border-white/50">
            {/* Center Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/50"></div>
            {/* Goal Areas */}
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1/4 border-t-2 border-white/50"></div>
          </div>

          {/* Player Cards positioned on field */}
          {positions.map((pos) => (
            <PlayerCard
              key={pos.key}
              player={selections[currentLine][pos.key]}
              position={pos.key}
              onClick={() => openSelect(pos.key)}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0 pt-2 px-2">
          <button
            className="text-xs sm:text-sm text-white hover:text-gray-200 font-heading drop-shadow-md flex items-center gap-1 justify-center sm:justify-start"
            onClick={() => {
              if (fromCrossLeague) {
                // Wenn man von Cross-League kommt, zurück zur Cross-League-Abfrage
                const otherLeague = league === 'damen' ? 'herren' : 'damen'
                router.push(`/cross-league-voting?league=${otherLeague}`)
              } else {
                // Sonst zurück zur Liga-Auswahl (Splitscreen)
                router.push('/wahl')
              }
            }}
          >
            {t('common.back')}
          </button>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0">
            {currentLine > 1 && (
              <button
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-primary-400 bg-white font-heading text-xs sm:text-sm"
                onClick={() => setCurrentLine((prev) => (prev - 1) as 1 | 2 | 3)}
              >
                {t('common.backShort')}
              </button>
            )}
            {currentLine < 3 ? (
              <button
                disabled={!canGoNext}
                className={clsx(
                  'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-heading text-xs sm:text-sm',
                  canGoNext
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
                onClick={() => {
                  if (canGoNext) {
                    setCurrentLine((prev) => (prev + 1) as 1 | 2 | 3)
                  }
                }}
              >
                {currentLine === 1 && !canGoNext
                  ? t('allstar.lineFull')
                  : `${t('allstar.nextToLine')} ${currentLine + 1}`
                }
              </button>
            ) : (
              <button
                disabled={saving}
                className={clsx(
                  'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-heading text-xs sm:text-sm',
                  saving
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                )}
                onClick={async () => {
                  if (saving) return
                  await new Promise(resolve => setTimeout(resolve, 100))
                  router.push(`/mvp-voting?league=${league}`)
                }}
              >
                {saving ? t('common.saving') : t('common.next') + ' →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Player Selection Modal */}
      {modalOpen && activePosition && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-2 sm:p-2 sm:p-4">
          <div className="bg-white border border-gray-300 rounded-t-xl sm:rounded-xl sm:rounded-2xl max-w-6xl w-full max-h-[92vh] sm:max-h-[92vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <div className="font-heading text-base sm:text-xl text-gray-900 truncate">{getPositionLabel(activePosition)}</div>
                <div className="text-xs sm:text-sm text-gray-600">{t('allstar.line')} {currentLine}</div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl ml-2 flex-shrink-0"
                onClick={() => {
                  setModalOpen(false)
                  setActivePosition(null)
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
                  placeholder={t('common.searchPlayer')}
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
                  <span className="text-xs text-gray-500">{t('common.loadPlayers')}</span>
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
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                            {players.map((p) => {
                              const taken = usedPlayerIds.has(p.id) && selections[currentLine][activePosition]?.id !== p.id
                              const isSelected = selectedPlayerId === p.id
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    if (!taken) {
                                      setSelectedPlayerId(isSelected ? null : p.id)
                                    }
                                  }}
                                  className={clsx(
                                    'relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all',
                                    taken
                                      ? 'opacity-50 cursor-not-allowed border-gray-200'
                                      : isSelected
                                      ? 'border-primary-600 shadow-lg scale-105'
                                      : 'border-gray-300 hover:border-primary-400 hover:shadow-md'
                                  )}
                                >
                                  <div className="bg-white flex flex-col min-h-0">
                                    {(p.imageUrl || p.teamLogoUrl) ? (
                                      <div className="relative w-full h-24 sm:h-28 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
                                        <img
                                          src={p.imageUrl || p.teamLogoUrl || ''}
                                          alt={p.name}
                                          className={p.imageUrl ? 'w-full h-full object-cover' : 'w-full h-full object-contain'}
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-full h-24 sm:h-28 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                      </div>
                                    )}
                                    <div className="p-2 text-center space-y-1 min-w-0 flex-1">
                                      <div className="font-heading text-[11px] sm:text-xs font-bold text-gray-900 break-words leading-tight" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>{p.name}</div>
                                      {p.team && (
                                        <div className="text-[9px] sm:text-[10px] text-gray-600 break-words leading-tight" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>{p.team}</div>
                                      )}
                                      {p.jerseyNumber && (
                                        <div className="text-[9px] sm:text-[10px] text-gray-500">#{p.jerseyNumber}</div>
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
                                        <span className="text-xs text-white font-heading bg-red-500 px-2 py-1 rounded">{t('common.alreadyChosen')}</span>
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
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                      {filteredPlayers.map((p) => {
                        const taken = usedPlayerIds.has(p.id) && selections[currentLine][activePosition]?.id !== p.id
                        const isSelected = selectedPlayerId === p.id
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (!taken) {
                                setSelectedPlayerId(isSelected ? null : p.id)
                              }
                            }}
                            className={clsx(
                              'relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all',
                              taken
                                ? 'opacity-50 cursor-not-allowed border-gray-200'
                                : isSelected
                                ? 'border-primary-600 shadow-lg scale-105'
                                : 'border-gray-300 hover:border-primary-400 hover:shadow-md'
                            )}
                          >
                            <div className="bg-white flex flex-col min-h-0">
                              {(p.imageUrl || p.teamLogoUrl) ? (
                                <div className="relative w-full h-24 sm:h-28 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
                                  <img
                                    src={p.imageUrl || p.teamLogoUrl || ''}
                                    alt={p.name}
                                    className={p.imageUrl ? 'w-full h-full object-cover' : 'w-full h-full object-contain'}
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-24 sm:h-28 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                              <div className="p-2 text-center space-y-1 min-w-0 flex-1">
                                <div className="font-heading text-[11px] sm:text-xs font-bold text-gray-900 break-words leading-tight" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>{p.name}</div>
                                {p.team && (
                                  <div className="text-[9px] sm:text-[10px] text-gray-600 break-words leading-tight" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>{p.team}</div>
                                )}
                                {p.jerseyNumber && (
                                  <div className="text-[9px] sm:text-[10px] text-gray-500">#{p.jerseyNumber}</div>
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
                                  <span className="text-xs text-white font-heading bg-red-500 px-2 py-1 rounded">{t('common.alreadyChosen')}</span>
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
                          {t('common.noPlayers')}
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
                    setActivePosition(null)
                    setSelectedPlayerId(null)
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={saveSelection}
                  disabled={!selectedPlayerId || saving}
                  className={clsx(
                    'px-4 sm:px-5 py-2 rounded-lg font-heading text-xs sm:text-sm',
                    selectedPlayerId && !saving
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  )}
                >
                  {saving ? t('common.saving') : t('common.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AllstarVotingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AllstarVotingContent />
    </Suspense>
  )
}
