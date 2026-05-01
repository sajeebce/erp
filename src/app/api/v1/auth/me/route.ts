import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        status: true,
        lastLoginAt: true,
        mustChangePassword: true,
        role: { select: { id: true, name: true, description: true } },
        department: { select: { id: true, name: true, code: true } },
        employee: { select: { id: true, employeeNo: true, fullName: true } },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            baseCurrency: true,
            timezone: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('Unauthorized: User not found')
    }

    return apiSuccess(user)
  } catch (error) {
    return handleRouteError(error)
  }
}
