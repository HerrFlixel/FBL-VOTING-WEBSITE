'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  firstName: string
  lastName: string
  team: { name: string } | null
  createdAt: string
}

interface UserDetail extends User {
  allstarVotes: Array<{ id: string; player: { name: string }; league: string; line: number; position: string }>
  mvpVotes: Array<{ id: string; player: { name: string }; league: string; rank: number }>
  coachVotes: Array<{ id: string; coach: { name: string }; league: string }>
  fairPlayVotes: Array<{ id: string; player: { name: string }; league: string }>
  refereePairVotes: Array<{ id: string; refereePair: { name: string }; league: string }>
  specialAwardVotes: Array<{ id: string; name: string; league: string | null }>
}

export default function VoterManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

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
            <h3 className="text-lg font-heading text-gray-900">Alle Voter</h3>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {users.length === 0 ? (
              <div className="p-4 text-gray-600">Keine Voter vorhanden</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedUser?.id === user.id ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => loadUserDetail(user.id)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.firstName} {user.lastName}
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
                  ))}
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
                      <div>
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

