import { NextRequest, NextResponse } from 'next/server'

const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // CORS headers
  const origin = request.headers.get('origin') || '*'
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers })
  }

  // Rate limiting on login
  if (pathname === '/api/v1/auth/login' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const key = `login:${ip}`
    const now = Date.now()
    const entry = loginAttempts.get(key)

    if (entry && entry.resetAt > now && entry.count >= 10) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' } },
        { status: 429 }
      )
    }

    if (!entry || entry.resetAt <= now) {
      loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    } else {
      entry.count++
    }
  }

  // Rate limiting on register
  if (pathname === '/api/v1/auth/register' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const key = `register:${ip}`
    const now = Date.now()
    const entry = loginAttempts.get(key)

    if (entry && entry.resetAt > now && entry.count >= 5) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Try again later.' } },
        { status: 429 }
      )
    }

    if (!entry || entry.resetAt <= now) {
      loginAttempts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 })
    } else {
      entry.count++
    }
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
