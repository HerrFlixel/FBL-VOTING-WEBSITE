'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || loading) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Login fehlgeschlagen' }))
        throw new Error(data.error || 'Login fehlgeschlagen')
      }

      const redirectTo = searchParams.get('redirect') || '/admin'
      router.replace(redirectTo)
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Login fehlgeschlagen')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white text-gray-900 rounded-xl shadow-xl p-6">
        <h1 className="text-2xl font-heading mb-2">Admin Login</h1>
        <p className="text-sm text-gray-600 mb-5">Bitte Passwort eingeben, um den Admin-Bereich zu öffnen.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className={`w-full rounded-lg py-2 font-heading text-sm ${
              loading || !password.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {loading ? 'Prüfe Passwort...' : 'Einloggen'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <AdminLoginContent />
    </Suspense>
  )
}

