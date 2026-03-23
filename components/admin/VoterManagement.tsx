'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string | null
  team: { name: string } | null
  createdAt: string
}

interface UserDetail extends User {
  allstarVotes: Array<{ id: string; player: { name: string }; league: string; line: number; position: string }>
  mvpVotes: Array<{ id: string; player: { name: string }; league: string; rank: number }>
  coachVotes: Array<{ id: string; coach: { name: string }; league: string }>
  fairPlayVotes: Array<{ id: string; player: { name: string }; league: string }>
  rookieVotes: Array<{ id: string; player: { name: string }; league: string }>
  refereePairVotes: Array<{ id: string; refereePair: { name: string }; league: string }>
  specialAwardVotes: Array<{ id: string; name: string; league: string | null }>
}

type SortMode = 'createdAtDesc' | 'nameAsc' | 'nameDesc' | 'teamAsc'

function normalizeName(u: Pick<User, 'firstName' | 'lastName'>) {
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim().toLowerCase()
}

export default function VoterManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [teamFilter, setTeamFilter] = useState<string>('__all__')
  const [sortMode, setSortMode] = useState<SortMode>('createdAtDesc')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der User', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserDetail = async (userId: string) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedUser(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der User-Details', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Möchten Sie diesen Voter und alle seine Votes wirklich löschen?')) return
    setDeleting(userId)
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || 'Fehler beim Löschen')
      }
      if (selectedUser?.id === userId) {
        setSelectedUser(null)
      }
      loadUsers()
    } catch (error: any) {
      alert(error.message || 'Fehler beim Löschen des Voters')
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteVote = async (type: string, voteId: string) => {
    if (!confirm('Möchten Sie diesen Vote wirklich löschen?')) return
    try {
      const res = await fetch(`/api/votes/${type}/${voteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        throw new Error(err.error || 'Fehler beim Löschen')
      }
      if (selectedUser) {
        loadUserDetail(selectedUser.id)
      }
      loadUsers()
    } catch (error: any) {
      alert(error.message || 'Fehler beim Löschen des Votes')
    }
  }

  if (loading) {
    return <div className="text-gray-600">Lade Voter...</div>
  }

  const teamOptions = Array.from(
    new Set(users.map((u) => u.team?.name).filter((n): n is string => Boolean(n && n.trim())))
  ).sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }))

  const duplicateNameCounts = users.reduce<Record<string, number>>((acc, u) => {
    const key = normalizeName(u)
    if (!key) return acc
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const filteredAndSortedUsers = users
    .filter((u) => {
      if (teamFilter === '__all__') return true
      const teamName = u.team?.name ?? ''
      return teamName === teamFilter
    })
    .slice()
    .sort((a, b) => {
      if (sortMode === 'createdAtDesc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortMode === 'teamAsc') {
        const at = (a.team?.name ?? '').toLowerCase()
        const bt = (b.team?.name ?? '').toLowerCase()
        const c = at.localeCompare(bt, 'de', { sensitivity: 'base' })
        if (c !== 0) return c
      }
      const an = `${a.lastName ?? ''} ${a.firstName ?? ''}`.trim().toLowerCase()
      const bn = `${b.lastName ?? ''} ${b.firstName ?? ''}`.trim().toLowerCase()
      const cmp = an.localeCompare(bn, 'de', { sensitivity: 'base' })
      return sortMode === 'nameDesc' ? -cmp : cmp
    })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading text-gray-900 mb-4">Voter-Verwaltung</h2>
        <p className="text-gray-600 mb-4">Gesamt: {users.length} Voter</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voter-Liste */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-heading text-gray-900">Alle Voter</h3>
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  Anzeige: {filteredAndSortedUsers.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-gray-700">
                  <span className="block text-xs font-medium text-gray-500 uppercase mb-1">Team</span>
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="__all__">Alle Teams</option>
                    {teamOptions.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-gray-700">
                  <span className="block text-xs font-medium text-gray-500 uppercase mb-1">Sortierung</span>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="createdAtDesc">Neueste zuerst</option>
                    <option value="nameAsc">Name A–Z</option>
                    <option value="nameDesc">Name Z–A</option>
                    <option value="teamAsc">Team A–Z (dann Name)</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {filteredAndSortedUsers.length === 0 ? (
              <div className="p-4 text-gray-600">Keine Voter vorhanden</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-Mail</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedUsers.map((user) => {
                    const duplicateCount = duplicateNameCounts[normalizeName(user)] ?? 0
                    const isDuplicate = duplicateCount > 1
                    return (
                    <tr
                      key={user.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedUser?.id === user.id ? 'bg-primary-50' : ''
                      } ${isDuplicate ? 'bg-amber-50 hover:bg-amber-100' : ''}`}
                      onClick={() => loadUserDetail(user.id)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{user.firstName} {user.lastName}</span>
                          {isDuplicate && (
                            <span className="inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                              DUPLIKAT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {user.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {user.team?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteUser(user.id)
                          }}
                          disabled={deleting === user.id}
                          className="text-red-600 hover:text-red-800 font-heading"
                        >
                          {deleting === user.id ? 'Löschen...' : 'Löschen'}
                        </button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Voter-Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-heading text-gray-900">Voter-Details</h3>
          </div>
          <div className="p-4 overflow-y-auto max-h-[600px]">
            {loadingDetail ? (
              <div className="text-gray-600">Lade Details...</div>
            ) : !selectedUser ? (
              <div className="text-gray-600">Bitte wählen Sie einen Voter aus</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="font-heading text-gray-900 mb-2">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    E-Mail: {selectedUser.email || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Team: {selectedUser.team?.name || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Abgegeben: {new Date(selectedUser.createdAt).toLocaleString('de-DE')}
                  </p>
                </div>

                {/* Allstar Votes */}
                {selectedUser.allstarVotes.length > 0 && (
                  <div>
                    <h5 className="font-heading text-gray-900 mb-2">Allstar Team Votes</h5>
                    {/* Herren */}
                    {selectedUser.allstarVotes.filter(v => v.league === 'herren').length > 0 && (
                      <div className="mb-3">
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Herren</h6>
                        <div className="space-y-1">
                          {selectedUser.allstarVotes.filter(v => v.league === 'herren').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">
                                {vote.player.name} - Reihe {vote.line} - {vote.position}
                              </span>
                              <button
                                onClick={() => handleDeleteVote('allstar', vote.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Damen */}
                    {selectedUser.allstarVotes.filter(v => v.league === 'damen').length > 0 && (
                      <div>
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Damen</h6>
                        <div className="space-y-1">
                          {selectedUser.allstarVotes.filter(v => v.league === 'damen').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">
                                {vote.player.name} - Reihe {vote.line} - {vote.position}
                              </span>
                              <button
                                onClick={() => handleDeleteVote('allstar', vote.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MVP Votes */}
                {selectedUser.mvpVotes.length > 0 && (
                  <div>
                    <h5 className="font-heading text-gray-900 mb-2">MVP Votes</h5>
                    {/* Herren */}
                    {selectedUser.mvpVotes.filter(v => v.league === 'herren').length > 0 && (
                      <div className="mb-3">
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Herren</h6>
                        <div className="space-y-1">
                          {selectedUser.mvpVotes.filter(v => v.league === 'herren').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">
                                {vote.player.name} - Platz {vote.rank}
                              </span>
                              <button
                                onClick={() => handleDeleteVote('mvp', vote.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Damen */}
                    {selectedUser.mvpVotes.filter(v => v.league === 'damen').length > 0 && (
                      <div>
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Damen</h6>
                        <div className="space-y-1">
                          {selectedUser.mvpVotes.filter(v => v.league === 'damen').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">
                                {vote.player.name} - Platz {vote.rank}
                              </span>
                              <button
                                onClick={() => handleDeleteVote('mvp', vote.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Coach Votes */}
                {selectedUser.coachVotes.length > 0 && (
                  <div>
                    <h5 className="font-heading text-gray-900 mb-2">Trainer Votes</h5>
                    {/* Herren */}
                    {selectedUser.coachVotes.filter(v => v.league === 'herren').length > 0 && (
                      <div className="mb-3">
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Herren</h6>
                        <div className="space-y-1">
                          {selectedUser.coachVotes.filter(v => v.league === 'herren').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">
                                {vote.coach.name}
                              </span>
                              <button
                                onClick={() => handleDeleteVote('coach', vote.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Damen */}
                    {selectedUser.coachVotes.filter(v => v.league === 'damen').length > 0 && (
                      <div>
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Damen</h6>
                        <div className="space-y-1">
                          {selectedUser.coachVotes.filter(v => v.league === 'damen').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">
                                {vote.coach.name}
                              </span>
                              <button
                                onClick={() => handleDeleteVote('coach', vote.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fair Play Votes */}
                {selectedUser.fairPlayVotes.length > 0 && (
                  <div>
                    <h5 className="font-heading text-gray-900 mb-2">Fair Play Votes</h5>
                    {/* Herren */}
                    {selectedUser.fairPlayVotes.filter(v => v.league === 'herren').length > 0 && (
                      <div className="mb-3">
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Herren</h6>
                        <div className="space-y-1">
                          {selectedUser.fairPlayVotes.filter(v => v.league === 'herren').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">
                                {vote.player.name}
                              </span>
                              <button
                                onClick={() => handleDeleteVote('fairplay', vote.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Damen */}
                    {selectedUser.fairPlayVotes.filter(v => v.league === 'damen').length > 0 && (
                      <div>
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Damen</h6>
                        <div className="space-y-1">
                          {selectedUser.fairPlayVotes.filter(v => v.league === 'damen').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">
                                {vote.player.name}
                              </span>
                              <button
                                onClick={() => handleDeleteVote('fairplay', vote.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Rookie of the Season Votes */}
                {selectedUser.rookieVotes && selectedUser.rookieVotes.length > 0 && (
                  <div>
                    <h5 className="font-heading text-gray-900 mb-2">Rookie of the Season Votes</h5>
                    {selectedUser.rookieVotes.filter(v => v.league === 'herren').length > 0 && (
                      <div className="mb-3">
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Herren</h6>
                        <div className="space-y-1">
                          {selectedUser.rookieVotes.filter(v => v.league === 'herren').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">{vote.player.name}</span>
                              <button onClick={() => handleDeleteVote('rookie', vote.id)} className="text-red-600 hover:text-red-800 text-xs">Löschen</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedUser.rookieVotes.filter(v => v.league === 'damen').length > 0 && (
                      <div>
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Damen</h6>
                        <div className="space-y-1">
                          {selectedUser.rookieVotes.filter(v => v.league === 'damen').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">{vote.player.name}</span>
                              <button onClick={() => handleDeleteVote('rookie', vote.id)} className="text-red-600 hover:text-red-800 text-xs">Löschen</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Referee Votes */}
                {selectedUser.refereePairVotes.length > 0 && (
                  <div>
                    <h5 className="font-heading text-gray-900 mb-2">Schiedsrichter-Paar Votes</h5>
                    {/* Herren */}
                    {selectedUser.refereePairVotes.filter(v => v.league === 'herren').length > 0 && (
                      <div className="mb-3">
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Herren</h6>
                        <div className="space-y-1">
                          {selectedUser.refereePairVotes.filter(v => v.league === 'herren').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">
                                {vote.refereePair.name}
                              </span>
                              <button
                                onClick={() => handleDeleteVote('referee', vote.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Damen */}
                    {selectedUser.refereePairVotes.filter(v => v.league === 'damen').length > 0 && (
                      <div className="mb-3">
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Damen</h6>
                        <div className="space-y-1">
                          {selectedUser.refereePairVotes.filter(v => v.league === 'damen').map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">
                                {vote.refereePair.name}
                              </span>
                              <button
                                onClick={() => handleDeleteVote('referee', vote.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Unabhängig (league === null) */}
                    {selectedUser.refereePairVotes.filter(v => v.league === null || v.league === undefined).length > 0 && (
                      <div>
                        <h6 className="font-semibold text-gray-700 mb-1 text-sm">Unabhängig</h6>
                        <div className="space-y-1">
                          {selectedUser.refereePairVotes.filter(v => v.league === null || v.league === undefined).map((vote) => (
                            <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-900">
                                {vote.refereePair.name}
                              </span>
                              <button
                                onClick={() => handleDeleteVote('referee', vote.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Special Award Votes */}
                {selectedUser.specialAwardVotes.length > 0 && (
                  <div>
                    <h5 className="font-heading text-gray-900 mb-2">Sonderpreis Votes</h5>
                    <div className="space-y-1">
                      {selectedUser.specialAwardVotes.map((vote) => (
                        <div key={vote.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-900">
                            {vote.name} {vote.league ? `- ${vote.league}` : ''}
                          </span>
                          <button
                            onClick={() => handleDeleteVote('special-award', vote.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Löschen
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUser.allstarVotes.length === 0 &&
                  selectedUser.mvpVotes.length === 0 &&
                  selectedUser.coachVotes.length === 0 &&
                  selectedUser.fairPlayVotes.length === 0 &&
                  (selectedUser.rookieVotes?.length ?? 0) === 0 &&
                  selectedUser.refereePairVotes.length === 0 &&
                  selectedUser.specialAwardVotes.length === 0 && (
                    <div className="text-gray-600">Keine Votes vorhanden</div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

