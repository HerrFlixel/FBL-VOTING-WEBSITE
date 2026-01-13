'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Player {
  id: string
  name: string
  team: string | null
  league: string
  position: string | null
  imageUrl: string | null
  jerseyNumber: number | null
  goals: number
  assists: number
  points: number
  games: number
  scorerRank: number | null
  pim2: number
  pim2x2: number
  pim10: number
  pimMatch: number
}

export default function EditPlayerPage() {
  const router = useRouter()
  const params = useParams()
  const playerId = params.id as string

  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    team: '',
    league: 'herren' as 'herren' | 'damen',
    position: '',
    jerseyNumber: '',
    goals: 0,
    assists: 0,
    points: 0,
    games: 0,
    scorerRank: '',
    pim2: 0,
    pim2x2: 0,
    pim10: 0,
    pimMatch: 0
  })

  useEffect(() => {
    fetchPlayer()
  }, [playerId])

  const fetchPlayer = async () => {
    try {
      const response = await fetch(`/api/players/${playerId}`)
      if (response.ok) {
        const data = await response.json()
        setPlayer(data)
        setFormData({
          name: data.name ?? '',
          team: data.team ?? '',
          league: data.league ?? 'herren',
          position: data.position ?? '',
          jerseyNumber: data.jerseyNumber != null ? data.jerseyNumber.toString() : '',
          goals: data.goals ?? 0,
          assists: data.assists ?? 0,
          points: data.points ?? 0,
          games: data.games ?? 0,
          scorerRank: data.scorerRank != null ? data.scorerRank.toString() : '',
          pim2: data.pim2 ?? 0,
          pim2x2: data.pim2x2 ?? 0,
          pim10: data.pim10 ?? 0,
          pimMatch: data.pimMatch ?? 0
        })
      } else {
        alert('Spieler konnte nicht geladen werden')
      }
    } catch (error) {
      console.error('Fehler beim Laden des Spielers', error)
      alert('Fehler beim Laden des Spielers')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          team: formData.team || null,
          league: formData.league,
          position: formData.position || null,
          jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : null,
          goals: formData.goals,
          assists: formData.assists,
          points: formData.points,
          games: formData.games,
          scorerRank: formData.scorerRank ? parseInt(formData.scorerRank) : null,
          pim2: formData.pim2,
          pim2x2: formData.pim2x2,
          pim10: formData.pim10,
          pimMatch: formData.pimMatch
        })
      })

      if (response.ok) {
        router.push('/admin?tab=players')
      } else {
        alert('Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Fehler beim Speichern', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`/api/players/${playerId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (player) {
          setPlayer({ ...player, imageUrl: data.imageUrl })
        }
      } else {
        alert('Fehler beim Hochladen des Bildes')
      }
    } catch (error) {
      console.error('Fehler beim Hochladen', error)
      alert('Fehler beim Hochladen des Bildes')
    } finally {
      setUploadingImage(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-900">Lade Spieler...</div>
  }

  if (!player) {
    return <div className="text-center py-8 text-gray-900">Spieler nicht gefunden</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-heading text-gray-900">Spieler bearbeiten</h1>
            <button
              onClick={() => router.push('/admin?tab=players')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-heading"
            >
              ← Zurück
            </button>
          </div>

          {/* Bild-Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spielerbild
            </label>
            <div className="flex items-center gap-4">
              {player.imageUrl ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={player.imageUrl}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-400"
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
              )}
              <div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                    disabled={uploadingImage}
                  />
                  <span className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-heading">
                    {uploadingImage ? 'Upload...' : 'Bild hochladen'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Formular */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team
              </label>
              <input
                type="text"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Liga *
              </label>
              <select
                value={formData.league}
                onChange={(e) => setFormData({ ...formData, league: e.target.value as 'herren' | 'damen' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="herren">Herren</option>
                <option value="damen">Damen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="">Keine</option>
                <option value="GK">Torwart (GK)</option>
                <option value="LD">Verteidiger Links (LD)</option>
                <option value="RD">Verteidiger Rechts (RD)</option>
                <option value="C">Mitte (C)</option>
                <option value="LW">Links Außen (LW)</option>
                <option value="RW">Rechts Außen (RW)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trikotnummer
              </label>
              <input
                type="number"
                value={formData.jerseyNumber}
                onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position in Scorerliste
              </label>
              <input
                type="number"
                value={formData.scorerRank}
                onChange={(e) => setFormData({ ...formData, scorerRank: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spiele
              </label>
              <input
                type="number"
                value={formData.games}
                onChange={(e) => setFormData({ ...formData, games: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tore
              </label>
              <input
                type="number"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vorlagen
              </label>
              <input
                type="number"
                value={formData.assists}
                onChange={(e) => setFormData({ ...formData, assists: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Punkte
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2' Strafen
              </label>
              <input
                type="number"
                value={formData.pim2}
                onChange={(e) => setFormData({ ...formData, pim2: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2'+2' Strafen
              </label>
              <input
                type="number"
                value={formData.pim2x2}
                onChange={(e) => setFormData({ ...formData, pim2x2: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                10' Strafen
              </label>
              <input
                type="number"
                value={formData.pim10}
                onChange={(e) => setFormData({ ...formData, pim10: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Match Strafen
              </label>
              <input
                type="number"
                value={formData.pimMatch}
                onChange={(e) => setFormData({ ...formData, pimMatch: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving || !formData.name}
              className={`
                px-6 py-2 rounded-lg font-heading text-white
                ${saving || !formData.name
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
                }
              `}
            >
              {saving ? 'Speichere...' : 'Speichern'}
            </button>
            <button
              onClick={() => router.push('/admin?tab=players')}
              className="px-6 py-2 rounded-lg font-heading bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

