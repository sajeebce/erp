import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

const STANDARD_ROLES = [
  {
    name: 'ADMIN',
    description: 'Organization Administrator - full access',
    isSystem: true,
  },
  {
    name: 'STORE_MANAGER',
    description: 'Can receive goods, manage inventory, register assets from GRN',
    isSystem: false,
  },
  {
    name: 'STAFF',
    description: 'Can create and track purchase requisitions (staff member)',
    isSystem: false,
  },
  {
    name: 'PROGRAM_COORDINATOR',
    description: 'Can review purchase requisitions at program coordination approval step',
    isSystem: false,
  },
  {
    name: 'FINANCE_MANAGER',
    description: 'Can review purchase requisitions at finance approval step',
    isSystem: false,
  },
  {
    name: 'EXECUTIVE_DIRECTOR',
    description: 'Can review high-value purchase requisitions at executive approval step',
    isSystem: false,
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
            isSystem: role.isSystem,
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
