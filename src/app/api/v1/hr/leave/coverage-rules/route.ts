import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const rules = await prisma.teamCoverageRule.findMany({
      where: { organizationId: auth.organizationId },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return apiSuccess(rules)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { departmentId, minimumPresencePercent } = body

    if (minimumPresencePercent === undefined || minimumPresencePercent === null) {
      return apiBadRequest('minimumPresencePercent is required')
    }

    const percent = Number(minimumPresencePercent)
    if (isNaN(percent) || percent < 0 || percent > 100) {
      return apiBadRequest('minimumPresencePercent must be between 0 and 100')
    }

    // Validate department belongs to org (if provided)
    if (departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: departmentId, organizationId: auth.organizationId },
        select: { id: true },
      })
      if (!dept) {
        return apiBadRequest('Department not found in this organization')
      }
    }

    // Upsert: create or update rule for org + department combo
    const rule = await prisma.teamCoverageRule.upsert({
      where: {
        organizationId_departmentId: {
          organizationId: auth.organizationId,
          departmentId: departmentId || null,
        },
      },
      update: {
        minimumPresencePercent: percent,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
      create: {
        organizationId: auth.organizationId,
        departmentId: departmentId || null,
        minimumPresencePercent: percent,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    })

    return apiCreated(rule)
  } catch (error) {
    return handleRouteError(error)
  }
}
