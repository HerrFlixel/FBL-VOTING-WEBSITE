'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Team = {
  id: string
  name: string
}

export default function UserFormPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const leagueParam = searchParams.get('league')
  const league = leagueParam === 'damen' ? 'damen' : 'herren'

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [teamId, setTeamId] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/teams?forForm=true')
        if (res.ok) {
          const data = await res.json()
          setTeams(data)
        }
      } catch (e) {
        console.error('Fehler beim Laden der Teams', e)
      } finally {
        setLoading(false)
      }
    }
    loadTeams()
  }, [])

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0 && teamId.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/users/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          teamId,
          league
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || `Fehler beim Absenden (Status: ${res.status})`)
      }
      router.push(`/thank-you?userId=${(await res.json()).userId}`)
    } catch (error: any) {
      console.error('Fehler beim Absenden', error)
      alert(error.message || 'Fehler beim Absenden des Formulars')
      setSubmitting(false)
    }
  }

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
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="bg-white/95 rounded-lg shadow-xl p-8 md:p-12 w-full">
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 bg-primary-600 text-white rounded-lg font-heading uppercase text-sm mb-3 shadow-lg">
              {leagueName}
            </div>
            <h1 className="text-3xl md:text-5xl font-heading uppercase mb-2 text-gray-900">
              Abschluss
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Bitte füllen Sie alle Felder aus, um Ihre Stimmen abzugeben
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Vorname *
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Nachname *
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
                Team *
              </label>
              <select
                id="team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">Bitte wählen...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="mt-2 text-sm text-gray-500">Lade Teams...</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit || submitting || loading}
              className={`w-full px-6 py-3 rounded-lg font-heading text-lg uppercase ${
                canSubmit && !submitting && !loading
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              } shadow-lg transition-colors`}
            >
              {submitting ? 'Wird abgesendet...' : 'Stimmen abgeben'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

