import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    const now = new Date()
    const orgFilter = { organizationId: orgId }

    // Fetch all employees (with joining/end dates) and offboardings for the last 12 months
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const [allEmployees, offboardings] = await Promise.all([
      // All employees who were potentially active in the last 12 months
      prisma.employee.findMany({
        where: {
          ...orgFilter,
          deletedAt: null,
          joiningDate: { lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) },
        },
        select: {
          joiningDate: true,
          endDate: true,
        },
      }),

      // Completed offboardings in the last 12 months
      prisma.offboarding.findMany({
        where: {
          ...orgFilter,
          status: 'COMPLETED',
          completedAt: { gte: twelveMonthsAgo },
        },
        select: {
          completedAt: true,
        },
      }),
    ])

    // ── Build monthly trend ──
    const months = []

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
        23, 59, 59, 999
      )
      const monthStart = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1
      )

      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`

      // Active count at end of month: joined on or before monthEnd AND (no endDate OR endDate > monthEnd)
      const activeCount = allEmployees.filter((emp) => {
        const joined = new Date(emp.joiningDate)
        const ended = emp.endDate ? new Date(emp.endDate) : null
        return joined <= monthEnd && (!ended || ended > monthEnd)
      }).length

      // Joined during this month
      const joinedCount = allEmployees.filter((emp) => {
        const joined = new Date(emp.joiningDate)
        return joined >= monthStart && joined <= monthEnd
      }).length

      // Left during this month (completed offboardings)
      const leftCount = offboardings.filter((ob) => {
        if (!ob.completedAt) return false
        const completed = new Date(ob.completedAt)
        return completed >= monthStart && completed <= monthEnd
      }).length

      months.push({
        month: monthKey,
        activeCount,
        joinedCount,
        leftCount,
        netChange: joinedCount - leftCount,
      })
    }

    return apiSuccess({ months })
  } catch (error) {
    return handleRouteError(error)
  }
}
