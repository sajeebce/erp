import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

const STANDARD_ROLES = [
  {
    name: 'STORE_MANAGER',
    description: 'Can receive goods, manage inventory, register assets from GRN',
  },
  {
    name: 'REQUESTER',
    description: 'Can create and track purchase requisitions',
  },
]

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, [])

    const results = []

    for (const role of STANDARD_ROLES) {
      const existing = await prisma.role.findFirst({
        where: { organizationId: auth.organizationId, name: role.name },
      })

      if (existing) {
        results.push({ ...existing, created: false })
      } else {
        const created = await prisma.role.create({
          data: {
            organizationId: auth.organizationId,
            name: role.name,
            description: role.description,
            isSystem: false,
          },
        })
        results.push({ ...created, created: true })
      }
    }

    return apiSuccess({
      roles: results,
      message: `${results.filter((r) => r.created).length} role(s) created, ${results.filter((r) => !r.created).length} already existed.`,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, [])

    const roles = await prisma.role.findMany({
      where: { organizationId: auth.organizationId },
      select: { id: true, name: true, description: true, isSystem: true, createdAt: true },
      orderBy: { name: 'asc' },
    })

    return apiSuccess(roles)
  } catch (error) {
    return handleRouteError(error)
  }
}
