'use client'

import { useRouter } from 'next/navigation'
import { useLanguage } from '../../components/LanguageProvider'
import { useEffect } from 'react'

export default function WahlPage() {
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    const checkClosed = async () => {
      try {
        const res = await fetch('/api/voting-status', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (data?.closed) router.replace('/closed')
      } catch {
        // ignore
      }
    }
    checkClosed()
  }, [router])

  const handleStart = (league: 'herren' | 'damen') => {
    router.push(`/allstar-voting?league=${league}`)
  }

  return (
    <main className="h-screen flex flex-col md:flex-row items-stretch relative overflow-hidden">
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-white z-20 transform -translate-x-1/2"></div>

      <div
        className="flex-1 h-1/2 md:h-full relative cursor-pointer group overflow-hidden"
        onClick={() => handleStart('damen')}
      >
        <img
          src="/Hintergrund Damen.png"
          alt={t('wahl.leagueWomen')}
          className="absolute inset-0 w-full h-full object-cover blur-sm transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading mb-2 sm:mb-3 md:mb-4 text-white drop-shadow-lg text-center uppercase px-2 w-full" style={{ fontFamily: 'Futura Extra Bold Oblique, Futura, system-ui, sans-serif' }}>
            {t('wahl.leagueWomen')}
          </h1>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStart('damen') }}
            className="mt-2 sm:mt-3 md:mt-4 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg bg-white hover:bg-gray-100 text-black font-heading text-sm sm:text-base md:text-lg shadow-lg uppercase"
          >
            {t('wahl.startVoting')}
          </button>
        </div>
      </div>

      <div
        className="flex-1 h-1/2 md:h-full relative cursor-pointer group overflow-hidden"
        onClick={() => handleStart('herren')}
      >
        <img
          src="/Hintergrund Herren.png"
          alt={t('wahl.leagueMen')}
          className="absolute inset-0 w-full h-full object-cover blur-sm transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading mb-2 sm:mb-3 md:mb-4 text-white drop-shadow-lg text-center uppercase px-2 w-full" style={{ fontFamily: 'Futura Extra Bold Oblique, Futura, system-ui, sans-serif' }}>
            {t('wahl.leagueMen')}
          </h1>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStart('herren') }}
            className="mt-2 sm:mt-3 md:mt-4 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg bg-white hover:bg-gray-100 text-black font-heading text-sm sm:text-base md:text-lg shadow-lg uppercase"
          >
            {t('wahl.startVoting')}
          </button>
        </div>
      </div>
    </main>
  )
}
