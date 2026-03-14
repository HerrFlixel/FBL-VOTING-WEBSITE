'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchWithVoterId } from '../../components/client-voter'
import VotingProgress from '../../components/VotingProgress'
import { useLanguage } from '../../components/LanguageProvider'

function SpecialAwardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()
  const leagueParam = searchParams.get('league')
  const league = leagueParam === 'damen' ? 'damen' : 'herren'

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadVote = async () => {
      setLoading(true)
      try {
        const res = await fetchWithVoterId(`/api/special-award-votes?league=${league}`)
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
      alert(t('special.enterName'))
      return
    }

    setSaving(true)
    try {
      const res = await fetchWithVoterId('/api/special-award-votes', {
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
      alert(error.message || t('common.errorSave'))
      setSaving(false)
      return
    } finally {
      setSaving(false)
    }
  }

  const canProceed = name.trim().length > 0

  const leagueName =
    league === 'damen' ? t('wahl.leagueWomen') : t('wahl.leagueMen')
  
  const backgroundImage = league === 'damen' ? '/Hintergrund Damen.png' : '/Hintergrund Herren.png'

  return (
    <div className="min-h-screen relative">
      <VotingProgress />
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
      <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 flex items-center justify-center min-h-screen">
        <div className="bg-white/95 rounded-lg shadow-xl p-4 sm:p-8 md:p-12 w-full max-w-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-primary-600 text-white rounded-lg font-heading uppercase text-xs sm:text-sm mb-2 sm:mb-3 shadow-lg">
              {leagueName}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading uppercase mb-2 text-gray-900">
              {t('special.title')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 px-2">
              {t('special.subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                {t('special.fullName')}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('special.placeholder')}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading || saving}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4">
              <button
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-heading text-sm sm:text-lg uppercase bg-gray-500 hover:bg-gray-600 text-white shadow-lg transition-colors"
                onClick={async () => {
                  if (saving) return
                  await new Promise(resolve => setTimeout(resolve, 100))
                  router.push(`/referee-voting?league=${league}`)
                }}
                disabled={saving}
              >
                {t('common.back')}
              </button>
              <button
                onClick={async () => {
                  if (!name.trim()) {
                    alert(t('special.enterName'))
                    return
                  }
                  if (saving) return
                  // Speichere vor dem Weiterleiten
                  setSaving(true)
                  try {
                    const res = await fetchWithVoterId('/api/special-award-votes', {
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
                    // Warte kurz, um sicherzustellen, dass der API-Call vollständig abgeschlossen ist
                    await new Promise(resolve => setTimeout(resolve, 200))
                    router.push(`/user-form?league=${league}`)
                  } catch (error: any) {
                    console.error('Fehler beim Speichern', error)
                    alert(error.message || t('common.errorSave'))
                    setSaving(false)
                  }
                }}
                disabled={!canProceed || saving || loading}
                className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-heading text-sm sm:text-lg uppercase ${
                  canProceed && !saving && !loading
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                } shadow-lg transition-colors`}
              >
                {saving ? t('common.savingShort') : t('common.next')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SpecialAwardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Lade...</div>
      </div>
    }>
      <SpecialAwardContent />
    </Suspense>
  )
}