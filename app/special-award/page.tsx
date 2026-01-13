'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SpecialAwardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const leagueParam = searchParams.get('league')
  const league = leagueParam === 'damen' ? 'damen' : 'herren'

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadVote = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/special-award-votes?league=${league}`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.name) {
            setName(data.name)
          }
        }
      } catch (e) {
        console.error('Fehler beim Laden des Votes', e)
      } finally {
        setLoading(false)
      }
    }
    loadVote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league])

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Bitte geben Sie einen Namen ein')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/special-award-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          league
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || `Fehler beim Speichern (Status: ${res.status})`)
      }
    } catch (error: any) {
      console.error('Fehler beim Speichern', error)
      alert(error.message || 'Fehler beim Speichern des Votes')
      setSaving(false)
      return
    } finally {
      setSaving(false)
    }
  }

  const canProceed = name.trim().length > 0

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
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="bg-white/95 rounded-lg shadow-xl p-8 md:p-12 w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 bg-primary-600 text-white rounded-lg font-heading uppercase text-sm mb-3 shadow-lg">
              {leagueName}
            </div>
            <h1 className="text-3xl md:text-5xl font-heading uppercase mb-2 text-gray-900">
              Sonderpreis
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Geben Sie den vollständigen Namen für den Sonderpreis ein
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Vollständiger Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Max Mustermann"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading || saving}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                disabled={!canProceed || saving || loading}
                className={`flex-1 px-6 py-3 rounded-lg font-heading text-lg uppercase ${
                  canProceed && !saving && !loading
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                } shadow-lg transition-colors`}
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                onClick={async () => {
                  if (!name.trim()) {
                    alert('Bitte geben Sie einen Namen ein')
                    return
                  }
                  // Speichere vor dem Weiterleiten
                  setSaving(true)
                  try {
                    const res = await fetch('/api/special-award-votes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: name.trim(),
                        league
                      })
                    })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
                      throw new Error(err.error || `Fehler beim Speichern (Status: ${res.status})`)
                    }
                    router.push(`/user-form?league=${league}`)
                  } catch (error: any) {
                    console.error('Fehler beim Speichern', error)
                    alert(error.message || 'Fehler beim Speichern des Votes')
                    setSaving(false)
                  }
                }}
                disabled={!canProceed || saving || loading}
                className={`flex-1 px-6 py-3 rounded-lg font-heading text-lg uppercase ${
                  canProceed && !saving && !loading
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                } shadow-lg transition-colors`}
              >
                {saving ? 'Speichern...' : 'Weiter'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

