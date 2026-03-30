'use client'

import { useRouter } from 'next/navigation'

export default function VotingClosedPage() {
  const router = useRouter()
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-10">
      <div className="max-w-xl w-full bg-white/95 rounded-xl shadow-xl p-6 sm:p-8 text-gray-900">
        <h1 className="text-2xl sm:text-3xl font-heading mb-3">Voting geschlossen</h1>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Das Voting ist beendet. Vielen Dank für eure Teilnahme.
        </p>
        <button
          type="button"
          onClick={() => router.replace('/')}
          className="mt-6 px-5 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-heading text-sm sm:text-base"
        >
          Zur Startseite
        </button>
      </div>
    </main>
  )
}

