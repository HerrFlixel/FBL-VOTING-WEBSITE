/**
 * Alte Team-Logo-URLs (/uploads/teams/...) auf die API-Route umleiten,
 * damit Logos auch vom persistenten Speicher (z.B. Render) geliefert werden.
 */
export function normalizeTeamLogoUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('/uploads/teams/')) {
    return '/api/upload/teams/' + url.slice('/uploads/teams/'.length)
  }
  return url
}
