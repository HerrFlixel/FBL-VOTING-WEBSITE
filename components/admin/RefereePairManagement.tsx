'use client'

import { useState, useEffect } from 'react'

interface RefereePair {
  id: string
  name: string
  league: string
}

export default function RefereePairManagement() {
  const [pairs, setPairs] = useState<RefereePair[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    league: 'herren' as 'herren' | 'damen'
  })

  useEffect(() => {
    fetchPairs()
  }, [])

  const fetchPairs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/referee-pairs')
      const data = await response.json()
      setPairs(data)
    } catch (error) {
      console.error('Fehler beim Laden der Schiedsrichter-Paare', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Bitte geben Sie einen Namen ein')
      return
    }

    try {
      const response = await fetch('/api/referee-pairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          league: formData.league
        })
      })
      if (response.ok) {
        fetchPairs()
        setFormData({ name: '', league: 'herren' })
        setShowForm(false)
      } else {
        const err = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        alert(err.error || 'Fehler beim Erstellen')
      }
    } catch (error) {
      console.error('Fehler beim Erstellen', error)
      alert('Fehler beim Erstellen des Schiedsrichter-Paars')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchtest du dieses Schiedsrichter-Paar wirklich löschen?')) return

    try {
      const response = await fetch(`/api/referee-pairs/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchPairs()
      } else {
        const err = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        alert(err.error || 'Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Fehler beim Löschen', error)
      alert('Fehler beim Löschen des Schiedsrichter-Paars')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-900">Lade Schiedsrichter-Paare...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-heading text-gray-900">Schiedsrichter-Paar-Verwaltung</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-heading hover:bg-primary-700"
          >
            {showForm ? 'Abbrechen' : 'Neues Paar'}
          </button>
        </div>

        {showForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (z.B. "Müller / Schmidt")
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Müller / Schmidt"
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
              disabled={!formData.name.trim()}
              className={`px-4 py-2 rounded-lg font-heading ${
                formData.name.trim()
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
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
                Name
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
            {pairs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  Keine Schiedsrichter-Paare vorhanden
                </td>
              </tr>
            ) : (
              pairs.map((pair) => (
                <tr key={pair.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pair.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pair.league === 'herren' ? 'Herren' : 'Damen'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(pair.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

