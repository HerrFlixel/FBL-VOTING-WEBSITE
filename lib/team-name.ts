/**
 * Normalisiert Teamnamen für den Logo-Abgleich: "(damen)" und "(herren)" entfernen,
 * damit z.B. "ETV Piranhas (herren)" und "ETV Piranhas (damen)" dem gleichen Team-Logo zugeordnet werden.
 */
export function normalizeTeamNameForLogoMatch(name: string | null | undefined): string {
  if (name == null || typeof name !== 'string') return ''
  return name
    .replace(/\s*\(damen\)\s*/gi, '')
    .replace(/\s*\(herren\)\s*/gi, '')
    .trim()
    .toLowerCase()
}
