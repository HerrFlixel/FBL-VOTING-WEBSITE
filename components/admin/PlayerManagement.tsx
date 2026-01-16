'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Player {
  id: string
  name: string
  team: string | null
  position: string | null
  imageUrl: string | null
  jerseyNumber: number | null
  goals: number
  assists: number
  points: number
  games: number
  league: string
}

export default function PlayerManagement() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeague, setSelectedLeague] = useState<'herren' | 'damen' | 'all'>('all')

  useEffect(() => {
    fetchPlayers()
  }, [selectedLeague])

  const fetchPlayers = async () => {
    setLoading(true)
    try {
      const url = selectedLeague === 'all' 
        ? '/api/players'
        : `/api/players?league=${selectedLeague}`
      const response = await fetch(url)
      const data = await response.json()
      setPlayers(data)
    } catch (error) {
      console.error('Fehler beim Laden der Spieler', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchtest du diesen Spieler wirklich löschen?')) return

    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchPlayers()
      }
    } catch (error) {
      console.error('Fehler beim Löschen', error)
    }
  }

  const handleEdit = (playerId: string) => {
    router.push(`/admin/players/${playerId}`)
  }

  const handleDeleteAllByLeague = async (league: 'herren' | 'damen') => {
    const leagueName = league === 'herren' ? 'Herren' : 'Damen'
    const count = players.filter(p => p.league === league).length
    
    if (count === 0) {
      alert(`Es gibt keine Spieler in der ${leagueName}-Liga zum Löschen.`)
      return
    }

    if (!confirm(`Möchten Sie wirklich ALLE ${count} Spieler der ${leagueName}-Liga löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
      return
    }

    try {
      const response = await fetch(`/api/players?league=${league}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        const data = await response.json()
        alert(`${data.deletedCount} Spieler der ${leagueName}-Liga wurden erfolgreich gelöscht.`)
        fetchPlayers()
      } else {
        const error = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        alert(`Fehler beim Löschen: ${error.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Fehler beim Löschen', error)
      alert('Fehler beim Löschen der Spieler')
    }
  }

  const PlayerAvatar = ({ player }: { player: Player }) => {
    if (player.imageUrl) {
      return (
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
          <img
            src={player.imageUrl}
            alt={player.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Wenn Bild nicht geladen werden kann, zeige Platzhalter
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `
                  <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                `
              }
            }}
          />
        </div>
      )
    }
    return (
      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-900">Lade Spieler...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-heading text-gray-900">Spieler-Verwaltung</h2>
          <div className="flex gap-2">
            {selectedLeague === 'herren' && (
              <button
                onClick={() => handleDeleteAllByLeague('herren')}
                className="px-4 py-2 rounded-lg font-heading bg-red-600 hover:bg-red-700 text-white"
              >
                Alle Herren löschen
              </button>
            )}
            {selectedLeague === 'damen' && (
              <button
                onClick={() => handleDeleteAllByLeague('damen')}
                className="px-4 py-2 rounded-lg font-heading bg-red-600 hover:bg-red-700 text-white"
              >
                Alle Damen löschen
              </button>
            )}
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedLeague('all')}
            className={`px-4 py-2 rounded-lg font-heading ${
              selectedLeague === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setSelectedLeague('herren')}
            className={`px-4 py-2 rounded-lg font-heading ${
              selectedLeague === 'herren'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Herren
          </button>
          <button
            onClick={() => setSelectedLeague('damen')}
            className={`px-4 py-2 rounded-lg font-heading ${
              selectedLeague === 'damen'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Damen
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bild
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Liga
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tore
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vorlagen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Punkte
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.map((player) => (
              <tr key={player.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PlayerAvatar player={player} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {player.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.team || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.league === 'herren' ? 'Herren' : 'Damen'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.position || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.goals}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.assists}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.points}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(player.id)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Löschen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

