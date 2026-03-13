'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useLanguage } from '../components/LanguageProvider'
import LanguageToggle from '../components/LanguageToggle'

export default function HomePage() {
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    const clearSession = async () => {
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
        try {
          await fetch('/api/votes/clear-session', { method: 'POST' })
        } catch (e) {
          console.error('Fehler beim Zurücksetzen der Session', e)
        }
      }
    }
    clearSession()
  }, [])

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center">
      {/* Splitscreen-Hintergrund wie Schiri/User-Form (ohne weißen Trennstrich) */}
      <div className="fixed inset-0 z-0 flex flex-col md:flex-row">
        <div className="flex-1 h-1/2 md:h-full relative overflow-hidden">
          <img
            src="/Hintergrund Damen.png"
            alt="1. Damen Bundesliga"
            className="absolute inset-0 w-full h-full object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="flex-1 h-1/2 md:h-full relative overflow-hidden">
          <img
            src="/Hintergrund Herren.png"
            alt="1. Herren Bundesliga"
            className="absolute inset-0 w-full h-full object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-2xl px-4 py-8 sm:py-12 flex flex-col items-center">
        <div className="w-full flex justify-end mb-4 sm:mb-6">
          <LanguageToggle />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading uppercase text-white mb-6 sm:mb-8 drop-shadow-lg text-center">
          {t('intro.title')}
        </h1>

        <div className="bg-white/95 rounded-xl shadow-xl p-6 sm:p-8 md:p-10 text-left space-y-4 text-gray-800 mb-8 sm:mb-10 w-full">
          <p className="text-base sm:text-lg leading-relaxed">{t('intro.p1')}</p>
          <p className="text-base sm:text-lg leading-relaxed">{t('intro.p2')}</p>
          <p className="text-base sm:text-lg leading-relaxed font-semibold">{t('intro.p3')}</p>
          <p className="text-base sm:text-lg leading-relaxed">{t('intro.p4')}</p>
          <p className="text-base sm:text-lg leading-relaxed">{t('intro.p5')}</p>
        </div>

        <button
          onClick={() => router.push('/wahl')}
          className="px-8 sm:px-10 py-3 sm:py-4 rounded-xl bg-white hover:bg-gray-100 text-primary-700 font-heading text-lg sm:text-xl uppercase shadow-xl transition-colors"
        >
          {t('intro.start')}
        </button>
      </div>
    </main>
  )
}
