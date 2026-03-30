import { prisma } from './prisma'

const KEY = 'votingClosed'

export async function isVotingClosed(): Promise<boolean> {
  const row = await prisma.appConfig.findUnique({ where: { key: KEY } })
  return row?.value === '1'
}

export async function setVotingClosed(closed: boolean): Promise<void> {
  await prisma.appConfig.upsert({
    where: { key: KEY },
    create: { key: KEY, value: closed ? '1' : '0' },
    update: { value: closed ? '1' : '0' }
  })
}

