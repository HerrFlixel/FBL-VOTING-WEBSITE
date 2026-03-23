import { NextResponse } from 'next/server'
import { checkRateLimit } from '../../../../lib/rate-limit'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    const limiter = checkRateLimit({
      key: `admin-login:${ip}`,
      limit: 10,
      windowMs: 5 * 60 * 1000
    })
    if (!limiter.ok) {
      return NextResponse.json(
        { error: 'Zu viele Login-Versuche. Bitte später erneut versuchen.' },
        { status: 429, headers: { 'Retry-After': String(limiter.retryAfterSeconds) } }
      )
    }

    if (!ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'ADMIN_PASSWORD ist nicht gesetzt.' }, { status: 500 })
    }

    const body = await req.json()
    const password = String(body?.password ?? '')

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Ungültiges Passwort' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set('admin_auth', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }
}

