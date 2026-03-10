/**
 * Retry bei SQLite-Locks (z. B. bei vielen gleichzeitigen Votern).
 * Nutzbar für alle Schreibzugriffe (Vote-POST, Finalize, etc.).
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 50
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      const isLockError =
        error?.code === 'SQLITE_BUSY' ||
        error?.message?.includes('database is locked') ||
        error?.message?.includes('SQLITE_BUSY')
      if (isLockError && attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        console.warn(`[db-retry] Lock, retry in ${delay}ms (${attempt + 1}/${maxRetries})`)
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      throw error
    }
  }
  throw lastError
}
