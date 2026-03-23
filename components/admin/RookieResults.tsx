'use client'

import { useState, useEffect } from 'react'

interface RookieResultsProps {
  league: 'herren' | 'damen'
}

interface PlayerResult {
  player: {
    id: string
    name: string
    team: string | null
    imageUrl: string | null
    teamLogoUrl?: string | null
  }
  voteCount: number
}

export default function RookieResults({ league }: RookieResultsProps) {
  const [results, setResults] = useState<PlayerResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [league])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/rookie-votes/results?league=${league}`, { cache: 'no-store' })
      const data = await response.json()
      setResults(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Fehler beim Laden der Rookie-Ergebnisse', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-900">Lade Ergebnisse...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <p className="text-sm text-gray-500 mb-2">Nur verbindlich abgegebene Stimmen werden gezählt.</p>
        <h2 className="text-2xl font-heading text-gray-900">
          Rookie of the Season - {league === 'herren' ? 'Herren' : 'Damen'}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bild</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stimmen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Noch keine Stimmen abgegeben.</td></tr>
            ) : (
              results.map((result, index) => (
                <tr key={result.player.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(result.player.imageUrl || result.player.teamLogoUrl) ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        <img src={result.player.imageUrl || result.player.teamLogoUrl || ''} alt={result.player.name} className={result.player.imageUrl ? 'w-full h-full object-cover' : 'w-full h-full object-contain'} />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.player.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.player.team || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">{result.voteCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
