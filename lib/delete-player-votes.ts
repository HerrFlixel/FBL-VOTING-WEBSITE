import type { Prisma } from '@prisma/client'

/** Alle Stimmen zu diesen Spieler-IDs löschen (FK zu Player, SQLite ohne Cascade). */
export async function deleteVotesForPlayerIds(
  tx: Prisma.TransactionClient,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return
  await tx.vote.deleteMany({ where: { playerId: { in: ids } } })
  await tx.mVPVote.deleteMany({ where: { playerId: { in: ids } } })
  await tx.fairPlayVote.deleteMany({ where: { playerId: { in: ids } } })
  await tx.allstarVote.deleteMany({ where: { playerId: { in: ids } } })
  await tx.rookieVote.deleteMany({ where: { playerId: { in: ids } } })
}
