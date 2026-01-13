import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="de">
      <body className="min-h-screen bg-gray-900 text-white">
        {children}
      </body>
    </html>
  )
}



