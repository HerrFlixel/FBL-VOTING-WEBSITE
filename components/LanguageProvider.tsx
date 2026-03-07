'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Lang, translations } from '../lib/translations'

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const STORAGE_KEY = 'fbl-voting-lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('de')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (stored === 'de' || stored === 'en') setLangState(stored)
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, newLang)
  }, [])

  const t = useCallback((key: string): string => {
    const parts = key.split('.')
    let value: unknown = translations[lang]
    for (const p of parts) {
      if (value && typeof value === 'object' && p in value) {
        value = (value as Record<string, unknown>)[p]
      } else {
        return key
      }
    }
    return typeof value === 'string' ? value : key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    return {
      lang: 'de' as Lang,
      setLang: () => {},
      t: (key: string) => key,
    }
  }
  return ctx
}
