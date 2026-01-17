'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchWithVoterId } from '../../components/client-voter'

type Team = {
  id: string
  name: string
}

function UserFormContent() {
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
      const res = await fetchWithVoterId('/api/users/finalize', {
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


  return (
    <div className="min-h-screen relative">
      {/* Splitscreen Hintergrund */}
      <div className="fixed inset-0 z-0 flex flex-col md:flex-row">
        {/* Weißer Trennstreifen - nur auf Desktop */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-white z-20 transform -translate-x-1/2"></div>
        
        {/* Damen Seite (links) */}
        <div className="flex-1 h-1/2 md:h-full relative overflow-hidden">
          <img
            src="/Hintergrund Damen.png"
            alt="1. Damen Bundesliga"
            className="absolute inset-0 w-full h-full object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

            className="absolute inset-0 w-full h-full object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
      </div>
      
              className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 font-heading flex items-center gap-1"
              onClick={() => router.push('/special-award')}
            >
              ← Zurück
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Vorname *
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Nachname *
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="team" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Team *
              </label>
              <select
                id="team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">Bitte wählen...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="mt-2 text-xs sm:text-sm text-gray-500">Lade Teams...</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit || submitting || loading}
              className={`w-full px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-heading text-sm sm:text-lg uppercase ${
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

export default function UserFormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Lade...</div>
      </div>
    }>
      <UserFormContent />
    </Suspense>
  )
}
