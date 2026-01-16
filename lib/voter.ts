import { headers } from 'next/headers'

export function getVoterInfo() {
  const h = headers()
  let ip =
    h.get('x-forwarded-for') ||
    h.get('x-real-ip') ||
    // Fallback – in Dev meist 127.0.0.1
    'unknown'
  
  // x-forwarded-for kann mehrere IPs enthalten (z.B. "90.187.246.37, 162.158.87.37")
  // Nimm immer die erste IP für Konsistenz
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim()
  }
  
  const userAgent = h.get('user-agent') || 'unknown'

  // Prüfe ob client-seitige voterId im Request-Header mitgesendet wurde
  const clientVoterId = h.get('x-voter-id')
  
  // Verwende client-seitige voterId wenn vorhanden, sonst generiere serverseitig
  const voterId = clientVoterId || `${ip}-${userAgent.substring(0, 50)}`

  return {
    ip,
    voterId
  }
}

// Client-seitige Funktion zur Generierung einer stabilen voterId
// Diese wird in sessionStorage gespeichert, damit sie während der Session konsistent bleibt
export function getClientVoterId(): string {
  if (typeof window === 'undefined') {
    return 'unknown'
  }
  
  // Prüfe ob bereits eine voterId in sessionStorage existiert
  let voterId = sessionStorage.getItem('voterId')
  
  if (!voterId) {
    // Generiere eine neue voterId basierend auf verfügbaren Informationen
    // Verwende eine Kombination aus verschiedenen Browser-Fingerprints
    const screenInfo = `${screen.width}x${screen.height}`
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const language = navigator.language
    const platform = navigator.platform
    
    // Erstelle eine eindeutige ID für diese Session
    voterId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${screenInfo}-${timezone}-${language}-${platform}`
    
    // Speichere in sessionStorage für diese Session
    sessionStorage.setItem('voterId', voterId)
  }
  
  return voterId
}



