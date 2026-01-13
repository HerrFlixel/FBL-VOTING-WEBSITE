'use client'

import { useEffect, useState } from 'react'

interface SpecialAwardResultsProps {
  league?: 'herren' | 'damen'
}

interface SpecialAwardVote {
  id: string
  name: string
  league: string | null
  createdAt: string
  userId: string | null
}

export default function SpecialAwardResults({ league }: SpecialAwardResultsProps) {
  const [votes, setVotes] = useState<SpecialAwardVote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVotes = async () => {
      setLoading(true)
      try {
        const url = league 
          ? `/api/special-award-votes/results?league=${league}`
          : '/api/special-award-votes/results'
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setVotes(data)
        } else {
          setVotes([])
        }
      } catch (error) {
        console.error('Fehler beim Laden der Special Award Votes', error)
        setVotes([])
      } finally {
        setLoading(false)
      }
    }
    loadVotes()
  }, [league])

  if (loading) {
    return <div className="text-gray-600">Lade Ergebnisse...</div>
  }

  // Gruppiere nach Namen und zähle
  const grouped = votes.reduce((acc, vote) => {
    const key = vote.name.toLowerCase().trim()
    if (!acc[key]) {
      acc[key] = {
        name: vote.name,
        count: 0,
        votes: []
      }
    }
    acc[key].count++
    acc[key].votes.push(vote)
    return acc
  }, {} as Record<string, { name: string; count: number; votes: SpecialAwardVote[] }>)

  const sorted = Object.values(grouped).sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading text-gray-900 mb-4">
          Sonderpreis Ergebnisse {league ? `(${league === 'herren' ? 'Herren' : 'Damen'})` : '(Alle)'}
        </h2>
        <p className="text-gray-600 mb-4">
          Gesamt: {votes.length} {votes.length === 1 ? 'Stimme' : 'Stimmen'}
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="text-gray-600">Noch keine Stimmen abgegeben.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stimmen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sorted.map((item, index) => (
                <tr key={item.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.votes.filter(v => v.userId).length} finalisiert
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Alle Namen auflisten */}
      <div className="mt-8">
        <h3 className="text-xl font-heading text-gray-900 mb-4">Alle Namen</h3>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="space-y-2">
            {votes.map((vote, index) => (
              <div key={vote.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-900">{vote.name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(vote.createdAt).toLocaleDateString('de-DE')}
                  {vote.league && ` • ${vote.league === 'herren' ? 'Herren' : 'Damen'}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

