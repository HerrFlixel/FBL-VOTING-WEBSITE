import type { Metadata } from 'next'
import './globals.css'
import PageReloadHandler from '../components/PageReloadHandler'
import { LanguageProvider } from '../components/LanguageProvider'

export const metadata: Metadata = {
  title: 'FBL Allstar Voting',
  description: 'Allstar Voting 1. Floorball Bundesliga'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-900 text-white">
        <LanguageProvider>
          <PageReloadHandler />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}



