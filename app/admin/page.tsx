'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ExcelImport from '../../components/admin/ExcelImport'
import PlayerManagement from '../../components/admin/PlayerManagement'
import CoachManagement from '../../components/admin/CoachManagement'
import RefereePairManagement from '../../components/admin/RefereePairManagement'
import TeamManagement from '../../components/admin/TeamManagement'
import AllstarResults from '../../components/admin/AllstarResults'
import MVPResults from '../../components/admin/MVPResults'
import CoachResults from '../../components/admin/CoachResults'
import FairPlayResults from '../../components/admin/FairPlayResults'
import RookieResults from '../../components/admin/RookieResults'
import RefereeResults from '../../components/admin/RefereeResults'
import SpecialAwardResults from '../../components/admin/SpecialAwardResults'
import VoterManagement from '../../components/admin/VoterManagement'

type Tab = 
  | 'import-herren' | 'import-damen' 
  | 'players' | 'coaches' | 'referee-pairs' | 'teams'
  | 'results-allstar-herren' | 'results-allstar-damen'
  | 'results-mvp-herren' | 'results-mvp-damen'
  | 'results-coach-herren' | 'results-coach-damen'
  | 'results-fairplay-herren' | 'results-fairplay-damen'
  | 'results-rookie-herren' | 'results-rookie-damen'
  | 'results-referee'
  | 'results-special-award'
  | 'voters'

function AdminContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(tabParam || 'import-herren')
  const [exporting, setExporting] = useState(false)
  const [exportingHtml, setExportingHtml] = useState(false)

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const tabs = [
    { id: 'import-herren' as Tab, label: 'Import Herren' },
    { id: 'import-damen' as Tab, label: 'Import Damen' },
    { id: 'players' as Tab, label: 'Spieler' },
    { id: 'coaches' as Tab, label: 'Trainer' },
    { id: 'referee-pairs' as Tab, label: 'Schiedsrichter-Paare' },
    { id: 'teams' as Tab, label: 'Teams' },
    { id: 'results-allstar-herren' as Tab, label: 'Allstar Herren' },
    { id: 'results-allstar-damen' as Tab, label: 'Allstar Damen' },
    { id: 'results-mvp-herren' as Tab, label: 'MVP Herren' },
    { id: 'results-mvp-damen' as Tab, label: 'MVP Damen' },
    { id: 'results-coach-herren' as Tab, label: 'Trainer Herren' },
    { id: 'results-coach-damen' as Tab, label: 'Trainer Damen' },
    { id: 'results-fairplay-herren' as Tab, label: 'Fair Play Herren' },
    { id: 'results-fairplay-damen' as Tab, label: 'Fair Play Damen' },
    { id: 'results-rookie-herren' as Tab, label: 'Rookie Herren' },
    { id: 'results-rookie-damen' as Tab, label: 'Rookie Damen' },
    { id: 'results-referee' as Tab, label: 'Schiedsrichter' },
    { id: 'results-special-award' as Tab, label: 'Sonderpreis' },
    { id: 'voters' as Tab, label: 'Voter-Verwaltung' }
  ]

  const managementTabs = tabs.filter((tab) => !tab.id.startsWith('results-'))
  const resultTabs = tabs.filter((tab) => tab.id.startsWith('results-'))

  const handleDownloadAll = async () => {
    try {
      setExporting(true)
      const res = await fetch('/api/admin/export', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Export fehlgeschlagen')
      }

      const pretty = JSON.stringify(data, null, 2)
      const blob = new Blob([pretty], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      a.href = url
      a.download = `admin-export-${ts}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error?.message || 'Export fehlgeschlagen')
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadAllHtml = async () => {
    try {
      setExportingHtml(true)
      const res = await fetch('/api/admin/export?format=html', { cache: 'no-store' })
      const text = await res.text()

      if (!res.ok) {
        // Backend gibt im Fehlerfall meist JSON zurück.
        try {
          const data = JSON.parse(text)
          throw new Error(data?.error || 'HTML Export fehlgeschlagen')
        } catch {
          throw new Error('HTML Export fehlgeschlagen')
        }
      }

      const blob = new Blob([text], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      a.href = url
      a.download = `admin-export-${ts}.html`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error?.message || 'HTML Export fehlgeschlagen')
    } finally {
      setExportingHtml(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-3xl md:text-4xl font-heading text-gray-900">
            Admin-Bereich
          </h1>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={exporting}
              className={`px-4 py-2 rounded-lg font-heading text-sm sm:text-base ${
                exporting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {exporting ? 'Export JSON läuft...' : 'Alle Daten herunterladen (JSON)'}
            </button>

            <button
              type="button"
              onClick={handleDownloadAllHtml}
              disabled={exportingHtml}
              className={`px-4 py-2 rounded-lg font-heading text-sm sm:text-base ${
                exportingHtml
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {exportingHtml ? 'Export HTML läuft...' : 'Alle Daten herunterladen (HTML)'}
            </button>

            <button
              type="button"
              onClick={async () => {
                await fetch('/api/admin-auth/logout', { method: 'POST' })
                router.replace('/admin-login')
                router.refresh()
              }}
              className="px-4 py-2 rounded-lg font-heading text-sm sm:text-base bg-gray-700 hover:bg-gray-800 text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex flex-wrap gap-2">
            <span className="w-full px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2 pb-1">
              Verwaltung
            </span>
            {managementTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 bg-primary-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
            <div className="w-full h-px bg-gray-200 my-1" />
            <span className="w-full px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2 pb-1">
              Ergebnisse
            </span>
            {resultTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 bg-primary-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'import-herren' && <ExcelImport league="herren" />}
          {activeTab === 'import-damen' && <ExcelImport league="damen" />}
          {activeTab === 'players' && <PlayerManagement />}
          {activeTab === 'coaches' && <CoachManagement />}
          {activeTab === 'referee-pairs' && <RefereePairManagement />}
          {activeTab === 'teams' && <TeamManagement />}
          {activeTab === 'results-allstar-herren' && <AllstarResults league="herren" />}
          {activeTab === 'results-allstar-damen' && <AllstarResults league="damen" />}
          {activeTab === 'results-mvp-herren' && <MVPResults league="herren" />}
          {activeTab === 'results-mvp-damen' && <MVPResults league="damen" />}
          {activeTab === 'results-coach-herren' && <CoachResults league="herren" />}
          {activeTab === 'results-coach-damen' && <CoachResults league="damen" />}
          {activeTab === 'results-fairplay-herren' && <FairPlayResults league="herren" />}
          {activeTab === 'results-fairplay-damen' && <FairPlayResults league="damen" />}
          {activeTab === 'results-rookie-herren' && <RookieResults league="herren" />}
          {activeTab === 'results-rookie-damen' && <RookieResults league="damen" />}
          {activeTab === 'results-referee' && <RefereeResults />}
          {activeTab === 'results-special-award' && <SpecialAwardResults />}
          {activeTab === 'voters' && <VoterManagement />}
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Lade...</div>
      </div>
    }>
      <AdminContent />
    </Suspense>
  )
}