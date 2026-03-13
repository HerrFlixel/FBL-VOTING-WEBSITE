'use client'

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
  const pathname = usePathname()
  const { lang, t } = useLanguage()
  const currentStep = getProgressStep(pathname ?? '')
  const stepIndex = Math.max(1, Math.min(STEP_IDS.length, currentStep))
  const progressPercent = (stepIndex / STEP_IDS.length) * 100
  const stepLabels = translations[lang].progress.steps

  return (
    <div className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <p className="text-[10px] sm:text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-2">
          Bei Neuladen bleiben Ihre Eingaben erhalten. Sie werden zum Anfang weitergeleitet. Zum Verwerfen: Startseite aufrufen.
        </p>
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
            const short = stepLabels[i] ?? ''
            return (
              <div
                key={stepNum}
                className={`
                  flex-shrink-0 px-2 py-1 rounded-md text-center transition-colors
                  text-[10px] sm:text-xs font-medium
                  ${isCurrent ? 'bg-primary-600 text-white' : ''}
                  ${isDone && !isCurrent ? 'bg-primary-100 text-primary-800' : ''}
                  ${!isDone && !isCurrent ? 'bg-gray-100 text-gray-500' : ''}
                `}
                title={short}
              >
                {short}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
