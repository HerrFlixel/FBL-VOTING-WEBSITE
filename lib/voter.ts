import { headers } from 'next/headers'

export function getVoterInfo() {
  const h = headers()
  const ip =
    h.get('x-forwarded-for') ||
    h.get('x-real-ip') ||
    // Fallback – in Dev meist 127.0.0.1
    'unknown'
  const userAgent = h.get('user-agent') || 'unknown'

  // Gleiche Logik wie vorher: voterId aus IP + User-Agent
  const voterId = `${ip}-${userAgent.substring(0, 50)}`

  return {
    ip,
    voterId
  }
}



