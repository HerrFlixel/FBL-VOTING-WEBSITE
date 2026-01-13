'use client'

import { useState, useEffect } from 'react'

interface MVPResultsProps {
  league: 'herren' | 'damen'
}

interface PlayerResult {
  player: {
    id: string
    name: string
    team: string | null
    imageUrl: string | null
  }
  totalPoints: number
  voteCount: number
}

export default function MVPResults({ league }: MVPResultsProps) {
  const [results, setResults] = useState<PlayerResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [league])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/mvp-votes/results?league=${league}`)
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Fehler beim Laden der Ergebnisse', error)
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
        <h2 className="text-2xl font-heading text-gray-900">
          MVP Ergebnisse - {league === 'herren' ? 'Herren' : 'Damen'}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gesamtpunkte</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result, index) => (
              <tr key={result.player.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result.player.imageUrl ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      <img
                        src={result.player.imageUrl}
                        alt={result.player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {result.player.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {result.player.team || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {result.voteCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                  {result.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

