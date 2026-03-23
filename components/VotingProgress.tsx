'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useLanguage } from './LanguageProvider'
import LanguageToggle from './LanguageToggle'
import { translations } from '../lib/translations'

const STEP_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const

function getProgressStep(pathname: string): number {
  if (pathname.startsWith('/allstar-voting')) return 1
  if (pathname.startsWith('/mvp-voting')) return 2
  if (pathname.startsWith('/coach-voting')) return 3
  if (pathname.startsWith('/fair-play-voting')) return 4
  if (pathname.startsWith('/rookie-voting')) return 5
  if (pathname.startsWith('/referee-voting')) return 6
  if (pathname.startsWith('/special-award')) return 7
  if (pathname.startsWith('/user-form')) return 8
  return 1
}

export default function VotingProgress() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { lang, t } = useLanguage()
  const currentStep = getProgressStep(pathname ?? '')
  const stepIndex = Math.max(1, Math.min(STEP_IDS.length, currentStep))
  const progressPercent = (stepIndex / STEP_IDS.length) * 100
  const stepLabels = translations[lang].progress.steps
  const [unlockedStep, setUnlockedStep] = useState(stepIndex)

  useEffect(() => {
    const leagueParam = searchParams.get('league')
    const savedLeague = sessionStorage.getItem('lastLeague')
    const league =
      leagueParam === 'herren' || leagueParam === 'damen'
        ? leagueParam
        : savedLeague === 'herren' || savedLeague === 'damen'
          ? savedLeague
          : 'herren'

    const loadUnlockState = async () => {
      try {
        const [
          allstarRes,
          mvpRes,
          coachRes,
          fairRes,
          rookieRes,
          refereeRes,
          specialRes
        ] = await Promise.all([
          fetch(`/api/allstar-votes?league=${league}`, { cache: 'no-store' }),
          fetch(`/api/mvp-votes?league=${league}`, { cache: 'no-store' }),
          fetch(`/api/coach-votes?league=${league}`, { cache: 'no-store' }),
          fetch(`/api/fairplay-votes?league=${league}`, { cache: 'no-store' }),
          fetch(`/api/rookie-votes?league=${league}`, { cache: 'no-store' }),
          fetch('/api/referee-votes', { cache: 'no-store' }),
          fetch('/api/special-award-votes', { cache: 'no-store' })
        ])

        const [
          allstarVotes,
          mvpVotes,
          coachVote,
          fairVote,
          rookieVote,
          refereeVote,
          specialVote
        ] = await Promise.all([
          allstarRes.ok ? allstarRes.json() : [],
          mvpRes.ok ? mvpRes.json() : [],
          coachRes.ok ? coachRes.json() : null,
          fairRes.ok ? fairRes.json() : null,
          rookieRes.ok ? rookieRes.json() : null,
          refereeRes.ok ? refereeRes.json() : null,
          specialRes.ok ? specialRes.json() : null
        ])

        const line1Positions = new Set(
          Array.isArray(allstarVotes)
            ? allstarVotes
                .filter((v: any) => v?.line === 1 && typeof v?.position === 'string')
                .map((v: any) => String(v.position).toLowerCase())
            : []
        )
        const line1Complete = ['gk', 'ld', 'rd', 'c', 'lw', 'rw'].every((p) => line1Positions.has(p))
        const mvpComplete = Array.isArray(mvpVotes) && mvpVotes.length >= 5
        const coachComplete = Boolean(coachVote?.coach)
        const fairComplete = Boolean(fairVote?.player)
        const rookieComplete = Boolean(rookieVote?.player)
        const refereeComplete = Boolean(refereeVote?.refereePair)
        const specialComplete = Boolean(String(specialVote?.name ?? '').trim())

        let maxUnlocked = 1
        if (line1Complete) maxUnlocked = 2
        if (mvpComplete) maxUnlocked = 3
        if (coachComplete) maxUnlocked = 4
        if (fairComplete) maxUnlocked = 5
        if (rookieComplete) maxUnlocked = 6
        if (refereeComplete) maxUnlocked = 7
        if (specialComplete) maxUnlocked = 8

        setUnlockedStep(Math.max(stepIndex, maxUnlocked))
      } catch {
        setUnlockedStep(stepIndex)
      }
    }

    loadUnlockState()
  }, [searchParams, stepIndex])

  const getStepPath = (stepNum: number) => {
    const leagueParam = searchParams.get('league')
    const savedLeague =
      typeof window !== 'undefined' ? sessionStorage.getItem('lastLeague') : null
    const league = leagueParam === 'herren' || leagueParam === 'damen'
      ? leagueParam
      : savedLeague === 'herren' || savedLeague === 'damen'
        ? savedLeague
        : 'herren'

    if (stepNum === 1) return `/allstar-voting?league=${league}`
    if (stepNum === 2) return `/mvp-voting?league=${league}`
    if (stepNum === 3) return `/coach-voting?league=${league}`
    if (stepNum === 4) return `/fair-play-voting?league=${league}`
    if (stepNum === 5) return `/rookie-voting?league=${league}`
    if (stepNum === 6) return '/referee-voting'
    if (stepNum === 7) return '/special-award'
    return `/user-form?league=${league}`
  }

  return (
    <div className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
            {t('progress.stepOf')} {stepIndex} {t('progress.of')} {STEP_IDS.length}
          </span>
          <LanguageToggle className="flex-shrink-0" />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {STEP_IDS.map((_, i) => {
            const stepNum = i + 1
            const isDone = stepNum < stepIndex
            const isCurrent = stepNum === stepIndex
            const isAccessible = stepNum <= unlockedStep
            const short = stepLabels[i] ?? ''
            return (
              <button
                key={stepNum}
                type="button"
                disabled={!isAccessible}
                onClick={() => {
                  if (!isAccessible) return
                  router.push(getStepPath(stepNum))
                }}
                className={`
                  flex-shrink-0 px-2 py-1 rounded-md text-center transition-colors
                  text-[10px] sm:text-xs font-medium
                  ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'}
                  ${isCurrent ? 'bg-primary-600 text-white' : ''}
                  ${isDone && !isCurrent ? 'bg-primary-100 text-primary-800' : ''}
                  ${!isDone && !isCurrent ? 'bg-gray-100 text-gray-500' : ''}
                `}
                title={short}
              >
                {short}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
