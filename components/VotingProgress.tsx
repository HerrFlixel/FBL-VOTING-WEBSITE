'use client'

import { usePathname } from 'next/navigation'

const STEPS = [
  { id: 1, label: 'Allstar', short: 'Allstar' },
  { id: 2, label: 'MVP', short: 'MVP' },
  { id: 3, label: 'Trainer', short: 'Trainer' },
  { id: 4, label: 'Fair Play', short: 'Fair Play' },
  { id: 5, label: 'Schiri', short: 'Schiri' },
  { id: 6, label: 'Sonderpreis', short: 'Sonder' },
  { id: 7, label: 'Abschluss', short: 'Fertig' }
] as const

function getProgressStep(pathname: string): number {
  if (pathname.startsWith('/allstar-voting')) return 1
  if (pathname.startsWith('/mvp-voting')) return 2
  if (pathname.startsWith('/coach-voting')) return 3
  if (pathname.startsWith('/fair-play-voting')) return 4
  if (pathname.startsWith('/referee-voting')) return 5
  if (pathname.startsWith('/special-award')) return 6
  if (pathname.startsWith('/user-form')) return 7
  return 1
}

export default function VotingProgress() {
  const pathname = usePathname()
  const currentStep = getProgressStep(pathname ?? '')
  const stepIndex = Math.max(1, Math.min(7, currentStep))
  const progressPercent = (stepIndex / STEPS.length) * 100

  return (
    <div className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        {/* Fortschrittsbalken */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
            Schritt {stepIndex} von 7
          </span>
        </div>
        {/* Schritt-Labels: auf Desktop alle, auf Mobile nur kompakt oder scrollbar */}
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {STEPS.map((step) => {
            const isDone = step.id < stepIndex
            const isCurrent = step.id === stepIndex
            return (
              <div
                key={step.id}
                className={`
                  flex-shrink-0 px-2 py-1 rounded-md text-center transition-colors
                  text-[10px] sm:text-xs font-medium
                  ${isCurrent ? 'bg-primary-600 text-white' : ''}
                  ${isDone && !isCurrent ? 'bg-primary-100 text-primary-800' : ''}
                  ${!isDone && !isCurrent ? 'bg-gray-100 text-gray-500' : ''}
                `}
                title={step.label}
              >
                {step.short}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
