'use client'

const VOTER_ID_KEY = 'fbl-voting-voterId'

export function getClientVoterId(): string {
  if (typeof window === 'undefined') {
    return 'unknown'
  }
  let voterId = localStorage.getItem(VOTER_ID_KEY) || sessionStorage.getItem('voterId')
  if (!voterId) {
    const screenInfo = `${screen.width}x${screen.height}`
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const language = navigator.language
    const platform = navigator.platform
    const userAgent = navigator.userAgent.substring(0, 50)
    voterId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${screenInfo}-${timezone}-${language}-${platform}-${userAgent}`
    localStorage.setItem(VOTER_ID_KEY, voterId)
    sessionStorage.setItem('voterId', voterId)
  }
  return voterId
}

export function clearClientVoterId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(VOTER_ID_KEY)
  sessionStorage.removeItem('voterId')
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
