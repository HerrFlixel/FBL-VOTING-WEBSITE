'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Session beim ersten Laden der Website leeren
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
    <main className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading uppercase text-white mb-6 sm:mb-8 drop-shadow-lg">
          FBL Allstar Voting
        </h1>

        <div className="bg-white/95 rounded-xl shadow-xl p-6 sm:p-8 md:p-10 text-left space-y-4 text-gray-800 mb-8 sm:mb-10">
          <p className="text-base sm:text-lg leading-relaxed">
            Hier können Sie Ihre Stimmen für das Allstar-Voting der 1. Damen- und Herren-Bundesliga abgeben.
          </p>
          <p className="text-base sm:text-lg leading-relaxed">
            Nach dem Start wählen Sie zuerst Ihre Liga (Damen oder Herren). Anschließend durchlaufen Sie die einzelnen Kategorien: Allstar-Auswahl, MVP, Trainer, Fair-Play, Schiedsrichter-Paar und Sonderpreis. Am Ende füllen Sie noch ein kurzes Abschlussformular aus und geben Ihre Stimmen verbindlich ab.
          </p>
          <p className="text-base sm:text-lg leading-relaxed">
            Sie können jederzeit zwischen den Schritten zurückgehen und Ihre Angaben anpassen, bis Sie die Abstimmung final abschließen.
          </p>
        </div>

        <button
          onClick={() => router.push('/wahl')}
          className="px-8 sm:px-10 py-3 sm:py-4 rounded-xl bg-white hover:bg-gray-100 text-primary-700 font-heading text-lg sm:text-xl uppercase shadow-xl transition-colors"
        >
          Start
        </button>
      </div>
    </main>
  )
}
