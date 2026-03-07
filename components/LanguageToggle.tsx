'use client'

import { useLanguage } from './LanguageProvider'
import { Lang } from '../lib/translations'

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage()

  return (
    <div className={`flex rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setLang('de')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'de' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        title="Deutsch"
      >
        DE
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'en' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        title="English"
      >
        EN
      </button>
    </div>
  )
}
