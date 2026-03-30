import { NextResponse } from 'next/server'
import { isVotingClosed } from '../../../lib/voting-status'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const closed = await isVotingClosed()
    return NextResponse.json({ closed })
  } catch (e) {
    // Fail-open would allow voting during DB outage; fail-closed would block everything.
    // Here we fail-open to avoid locking out users due to transient DB errors.
    return NextResponse.json({ closed: false })
  }
}

