'use client'

import { useState, useEffect } from 'react'

interface Coach {
  id: string
  name: string
  team: string | null
  imageUrl: string | null
  league: string
}

export default function CoachManagement() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    team: '',
    league: 'herren' as 'herren' | 'damen'
  })

  useEffect(() => {
    fetchCoaches()
  }, [])

  const fetchCoaches = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/coaches')
      const data = await response.json()
      setCoaches(data)
    } catch (error) {
      console.error('Fehler beim Laden der Trainer', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          team: formData.team || null,
          league: formData.league
        })
      })
      if (response.ok) {
        fetchCoaches()
        setFormData({ name: '', team: '', league: 'herren' })
        setShowForm(false)
      }
    } catch (error) {
      console.error('Fehler beim Erstellen', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchtest du diesen Trainer wirklich löschen?')) return

    try {
      const response = await fetch(`/api/coaches/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchCoaches()
      }
    } catch (error) {
      console.error('Fehler beim Löschen', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-900">Lade Trainer...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-gray-900">Trainer-Verwaltung</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-heading hover:bg-primary-700"
          >
            {showForm ? 'Abbrechen' : 'Neuer Trainer'}
          </button>
        </div>

        {showForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
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
                Liga
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
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-heading hover:bg-primary-700"
            >
              Erstellen
            </button>
          </div>
        )}
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
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coaches.map((coach) => (
              <tr key={coach.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {coach.imageUrl ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                      <img
                        src={coach.imageUrl}
                        alt={coach.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
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
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {coach.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {coach.team || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {coach.league === 'herren' ? 'Herren' : 'Damen'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDelete(coach.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

