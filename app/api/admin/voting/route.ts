import { NextResponse } from 'next/server'
import { isVotingClosed, setVotingClosed } from '../../../../lib/voting-status'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isAdmin(req: Request): boolean {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)admin_auth=1(?:;|$)/.test(cookie)
}

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const closed = await isVotingClosed()
  return NextResponse.json({ closed })
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const closed = Boolean(body?.closed)
  await setVotingClosed(closed)
  return NextResponse.json({ closed })
}

