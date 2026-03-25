import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSuperAdminFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdminFromRequest(request)

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: auth.superAdminId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        lastLoginAt: true,
      },
    })

    if (!superAdmin) {
      throw new Error('Unauthorized: Super Admin not found')
    }

    // Get platform stats
    const [orgCount, activeOrgCount, totalUsers] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.user.count({ where: { deletedAt: null } }),
    ])

    return apiSuccess({
      ...superAdmin,
      platformStats: {
        totalOrganizations: orgCount,
        activeOrganizations: activeOrgCount,
        totalUsers,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
