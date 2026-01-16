'use client'

// Client-seitige Utility-Funktionen für voterId

/**
 * Generiert oder holt eine stabile voterId aus sessionStorage
 */
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
    const userAgent = navigator.userAgent.substring(0, 50)
    
    // Erstelle eine eindeutige ID für diese Session
    voterId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${screenInfo}-${timezone}-${language}-${platform}-${userAgent}`
    
    // Speichere in sessionStorage für diese Session
    sessionStorage.setItem('voterId', voterId)
  }
  
  return voterId
}

/**
 * Wrapper für fetch, der automatisch die voterId im Header mitsendet
 */
export async function fetchWithVoterId(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const voterId = getClientVoterId()
  
  const headers = new Headers(options.headers)
  headers.set('x-voter-id', voterId)
  
  return fetch(url, {
    ...options,
    headers
  })
}
