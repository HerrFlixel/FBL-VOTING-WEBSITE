'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = searchParams.get('userId')

  const handleGoHome = async () => {
    // Session zurücksetzen - warte auf Abschluss bevor Navigation
    try {
      await fetch('/api/votes/clear-session', { method: 'POST' })
    } catch (e) {
      console.error('Fehler beim Zurücksetzen der Session', e)
    }
    sessionStorage.clear()
    // Kurze Verzögerung, um sicherzustellen, dass die Löschung abgeschlossen ist
    await new Promise(resolve => setTimeout(resolve, 100))
    router.push('/')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-5xl font-heading uppercase mb-4 text-gray-900">
            Vielen Dank!
          </h1>
          <p className="text-lg text-gray-700 mb-2">
            Sie haben Ihre Stimmen erfolgreich abgegeben.
          </p>
          <p className="text-lg text-gray-700 mb-8">
            Ihre Stimmen sind eingegangen und werden nun ausgewertet.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Sie können diese Seite jetzt schließen.
          </p>
          <button
            onClick={handleGoHome}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-heading text-lg uppercase shadow-lg transition-colors"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Lade...</div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  )
}

