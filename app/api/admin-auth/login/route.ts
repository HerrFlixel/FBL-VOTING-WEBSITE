import { NextResponse } from 'next/server'

const ADMIN_PASSWORD = 'fblvoting123'

export async function POST(req: Request) {
  try {
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

