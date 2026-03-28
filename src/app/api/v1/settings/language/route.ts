import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, apiBadRequest, handleRouteError } from '@/lib/api-response'

const SUPPORTED_LOCALES = ['en', 'bn']

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()
    const { language } = body

    if (!language || !SUPPORTED_LOCALES.includes(language)) {
      return apiBadRequest(`Language must be one of: ${SUPPORTED_LOCALES.join(', ')}`)
    }

    await prisma.user.update({
      where: { id: auth.userId },
      data: { preferredLanguage: language },
    })

    const response = apiSuccess({ language })
    response.cookies.set('NEXT_LOCALE', language, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
