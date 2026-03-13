'use client'

import { useEffect, useRef, useState } from 'react'

interface Team {
  id: string
  name: string
  isForForm: boolean
  logoUrl?: string | null
}

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [newTeamName, setNewTeamName] = useState('')
  const [isForForm, setIsForForm] = useState(true)
  const [creating, setCreating] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teams')
      if (res.ok) {
        const data = await res.json()
        setTeams(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Teams', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newTeamName.trim()) {
      alert('Bitte geben Sie einen Teamnamen ein')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName.trim(),
          isForForm
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || 'Fehler beim Erstellen')
      }
      setNewTeamName('')
      setIsForForm(true)
      loadTeams()
    } catch (error: any) {
      alert(error.message || 'Fehler beim Erstellen des Teams')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie dieses Team wirklich löschen?')) return
    try {
      const res = await fetch(`/api/teams?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || 'Fehler beim Löschen')
      }
      loadTeams()
    } catch (error: any) {
      alert(error.message || 'Fehler beim Löschen des Teams')
    }
  }

  const handleLogoUpload = async (teamId: string, file: File) => {
    setUploadingId(teamId)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch(`/api/teams/${teamId}/upload`, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload fehlgeschlagen' }))
        throw new Error(err.error || 'Upload fehlgeschlagen')
      }
      loadTeams()
    } catch (error: any) {
      alert(error.message || 'Fehler beim Hochladen des Logos')
    } finally {
      setUploadingId(null)
    }
  }

  const handleRemoveLogo = async (teamId: string) => {
    if (!confirm('Logo wirklich entfernen?')) return
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: null })
      })
      if (!res.ok) throw new Error('Logo konnte nicht entfernt werden')
      loadTeams()
    } catch (error: any) {
      alert(error.message || 'Fehler beim Entfernen des Logos')
    }
  }

  if (loading) {
    return <div className="text-gray-600">Lade Teams...</div>
  }

  const formTeams = teams.filter(t => t.isForForm)
  const otherTeams = teams.filter(t => !t.isForForm)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading text-gray-900 mb-4">Teams verwalten</h2>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-heading text-gray-900 mb-4">Neues Team anlegen</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teamname
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="z.B. UHC Thurgau"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isForForm}
                  onChange={(e) => setIsForForm(e.target.checked)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-gray-700">Für Formular</span>
              </label>
            </div>
            <button
              onClick={handleCreate}
              disabled={!newTeamName.trim() || creating}
              className={`px-6 py-2 rounded-lg font-heading ${
                newTeamName.trim() && !creating
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {creating ? 'Erstellen...' : 'Erstellen'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-heading text-gray-900">Teams für Formular</h3>
          </div>
          {formTeams.length === 0 ? (
            <div className="p-4 text-gray-600">Keine Teams vorhanden</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formTeams.map((team) => (
                  <tr key={team.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-gray-400 text-xs">Kein Logo</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <input
                          ref={(el) => { fileInputRefs.current[team.id] = el }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleLogoUpload(team.id, f)
                            e.target.value = ''
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[team.id]?.click()}
                          disabled={uploadingId === team.id}
                          className="text-xs text-primary-600 hover:text-primary-800 font-heading disabled:opacity-50"
                        >
                          {uploadingId === team.id ? 'Lädt…' : 'Logo hochladen'}
                        </button>
                        {team.logoUrl && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLogo(team.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-heading"
                          >
                            Entfernen
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(team.id)}
                        className="text-red-600 hover:text-red-800 font-heading"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

