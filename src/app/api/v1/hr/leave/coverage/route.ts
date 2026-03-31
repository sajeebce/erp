import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    const url = new URL(request.url)
    const departmentId = url.searchParams.get('departmentId')
    const startDateParam = url.searchParams.get('startDate')
    const endDateParam = url.searchParams.get('endDate')

    if (!departmentId || !startDateParam || !endDateParam) {
      return apiBadRequest('departmentId, startDate, and endDate are required')
    }

    const startDate = new Date(startDateParam)
    const endDate = new Date(endDateParam)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return apiBadRequest('Invalid startDate or endDate format')
    }

    if (endDate < startDate) {
      return apiBadRequest('endDate must be on or after startDate')
    }

    // ── Parallel queries ──
    const [totalEmployees, approvedLeaves, coverageRules] = await Promise.all([
      // Count active employees in department
      prisma.employee.count({
        where: {
          organizationId: orgId,
          departmentId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),

      // Approved leaves overlapping the date range
      prisma.leaveApplication.findMany({
        where: {
          employee: {
            organizationId: orgId,
            departmentId,
            status: 'ACTIVE',
            deletedAt: null,
          },
          status: 'APPROVED',
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
        select: {
          startDate: true,
          endDate: true,
          isHalfDay: true,
        },
      }),

      // Coverage rules for threshold (department-specific or org-wide)
      prisma.teamCoverageRule.findMany({
        where: {
          organizationId: orgId,
          isActive: true,
          OR: [
            { departmentId },
            { departmentId: null },
          ],
        },
      }),
    ])

    // ── Determine coverage threshold ──
    const deptRule = coverageRules.find((r) => r.departmentId === departmentId)
    const orgRule = coverageRules.find((r) => r.departmentId === null)
    const minimumPresencePercent = Number(
      deptRule?.minimumPresencePercent ?? orgRule?.minimumPresencePercent ?? 80
    )

    // ── Build daily coverage ──
    const days = []
    const current = new Date(startDate)
    current.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)

    while (current <= end) {
      let onLeave = 0
      for (const la of approvedLeaves) {
        const laStart = new Date(la.startDate)
        laStart.setHours(0, 0, 0, 0)
        const laEnd = new Date(la.endDate)
        laEnd.setHours(0, 0, 0, 0)

        if (current >= laStart && current <= laEnd) {
          onLeave += la.isHalfDay ? 0.5 : 1
        }
      }

      const present = totalEmployees - onLeave
      const presencePercent =
        totalEmployees > 0
          ? Math.round((present / totalEmployees) * 10000) / 100
          : 100

      let status: 'GOOD' | 'WARNING' | 'CRITICAL'
      if (presencePercent >= minimumPresencePercent) {
        status = 'GOOD'
      } else if (presencePercent >= 50) {
        status = 'WARNING'
      } else {
        status = 'CRITICAL'
      }

      days.push({
        date: new Date(current),
        totalEmployees,
        onLeave,
        present,
        presencePercent,
        status,
      })

      current.setDate(current.getDate() + 1)
    }

    return apiSuccess({
      departmentId,
      startDate,
      endDate,
      minimumPresencePercent,
      days,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
