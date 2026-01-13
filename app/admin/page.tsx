'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ExcelImport from '../../components/admin/ExcelImport'
import PlayerManagement from '../../components/admin/PlayerManagement'
import CoachManagement from '../../components/admin/CoachManagement'
import TeamManagement from '../../components/admin/TeamManagement'
import AllstarResults from '../../components/admin/AllstarResults'
import MVPResults from '../../components/admin/MVPResults'
import CoachResults from '../../components/admin/CoachResults'
import FairPlayResults from '../../components/admin/FairPlayResults'
import RefereeResults from '../../components/admin/RefereeResults'
import SpecialAwardResults from '../../components/admin/SpecialAwardResults'
import VoterManagement from '../../components/admin/VoterManagement'

type Tab = 
  | 'import-herren' | 'import-damen' 
  | 'players' | 'coaches' | 'teams'
  | 'results-allstar-herren' | 'results-allstar-damen'
  | 'results-mvp-herren' | 'results-mvp-damen'
  | 'results-coach-herren' | 'results-coach-damen'
  | 'results-fairplay-herren' | 'results-fairplay-damen'
  | 'results-referee-herren' | 'results-referee-damen'
  | 'results-special-award'
  | 'voters'

export default function AdminPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(tabParam || 'import-herren')

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
    { id: 'teams' as Tab, label: 'Teams' },
    { id: 'results-allstar-herren' as Tab, label: 'Allstar Herren' },
    { id: 'results-allstar-damen' as Tab, label: 'Allstar Damen' },
    { id: 'results-mvp-herren' as Tab, label: 'MVP Herren' },
    { id: 'results-mvp-damen' as Tab, label: 'MVP Damen' },
    { id: 'results-coach-herren' as Tab, label: 'Trainer Herren' },
    { id: 'results-coach-damen' as Tab, label: 'Trainer Damen' },
    { id: 'results-fairplay-herren' as Tab, label: 'Fair Play Herren' },
    { id: 'results-fairplay-damen' as Tab, label: 'Fair Play Damen' },
    { id: 'results-referee-herren' as Tab, label: 'Schiedsrichter Herren' },
    { id: 'results-referee-damen' as Tab, label: 'Schiedsrichter Damen' },
    { id: 'results-special-award' as Tab, label: 'Sonderpreis' },
    { id: 'voters' as Tab, label: 'Voter-Verwaltung' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-heading text-gray-900 mb-6">
          Admin-Bereich
        </h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex flex-wrap gap-2">
            {tabs.map((tab) => (
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
          {activeTab === 'teams' && <TeamManagement />}
          {activeTab === 'results-allstar-herren' && <AllstarResults league="herren" />}
          {activeTab === 'results-allstar-damen' && <AllstarResults league="damen" />}
          {activeTab === 'results-mvp-herren' && <MVPResults league="herren" />}
          {activeTab === 'results-mvp-damen' && <MVPResults league="damen" />}
          {activeTab === 'results-coach-herren' && <CoachResults league="herren" />}
          {activeTab === 'results-coach-damen' && <CoachResults league="damen" />}
          {activeTab === 'results-fairplay-herren' && <FairPlayResults league="herren" />}
          {activeTab === 'results-fairplay-damen' && <FairPlayResults league="damen" />}
          {activeTab === 'results-referee-herren' && <RefereeResults league="herren" />}
          {activeTab === 'results-referee-damen' && <RefereeResults league="damen" />}
          {activeTab === 'results-special-award' && <SpecialAwardResults />}
          {activeTab === 'voters' && <VoterManagement />}
        </div>
      </div>
    </div>
  )
}

