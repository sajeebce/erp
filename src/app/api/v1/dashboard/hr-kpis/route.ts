import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const orgFilter = { organizationId: orgId }

    // ── Parallel KPI queries ──
    const [
      totalHeadcount,
      lastMonthHeadcount,
      newJoinersThisMonth,
      separationsThisMonth,
      separationsLast12Months,
      avgHeadcountEmployees,
      openPositionsAgg,
      expiringContracts,
      genderDistribution,
      departmentStats,
      employmentTypeDistribution,
      separationReasons,
    ] = await Promise.all([
      // 1. Total active headcount
      prisma.employee.count({
        where: { ...orgFilter, status: 'ACTIVE', deletedAt: null },
      }),

      // 2. Last month headcount (active employees at end of last month)
      prisma.employee.count({
        where: {
          ...orgFilter,
          deletedAt: null,
          joiningDate: { lte: endOfLastMonth },
          OR: [
            { endDate: null },
            { endDate: { gt: endOfLastMonth } },
          ],
          status: { in: ['ACTIVE', 'ON_LEAVE', 'PROBATION'] },
        },
      }),

      // 3. New joiners this month
      prisma.employee.count({
        where: {
          ...orgFilter,
          deletedAt: null,
          joiningDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // 4. Separations this month (completed offboardings)
      prisma.offboarding.count({
        where: {
          ...orgFilter,
          status: 'COMPLETED',
          completedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // 5. Separations in last 12 months (for turnover rate)
      prisma.offboarding.count({
        where: {
          ...orgFilter,
          status: 'COMPLETED',
          completedAt: { gte: twelveMonthsAgo },
        },
      }),

      // 6. Employees for average headcount over last 12 months
      prisma.employee.findMany({
        where: {
          ...orgFilter,
          deletedAt: null,
          joiningDate: { lte: endOfMonth },
        },
        select: { joiningDate: true, endDate: true },
      }),

      // 7. Open positions from PUBLISHED job postings
      prisma.jobPosting.aggregate({
        where: {
          ...orgFilter,
          status: 'PUBLISHED',
        },
        _sum: { vacancies: true },
      }),

      // 8. Expiring contracts (ACTIVE, ending within 30 days)
      prisma.employeeContract.count({
        where: {
          ...orgFilter,
          status: 'ACTIVE',
          endDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),

      // 9. Gender ratio
      prisma.employee.groupBy({
        by: ['gender'],
        where: { ...orgFilter, status: 'ACTIVE', deletedAt: null },
        _count: { id: true },
      }),

      // 10. Department stats — employees with joining/leaving info
      prisma.employee.findMany({
        where: { ...orgFilter, deletedAt: null, status: 'ACTIVE' },
        select: {
          departmentId: true,
          department: { select: { name: true } },
          joiningDate: true,
        },
      }),

      // 11. Employment type breakdown
      prisma.employee.groupBy({
        by: ['employmentType'],
        where: { ...orgFilter, status: 'ACTIVE', deletedAt: null },
        _count: { id: true },
      }),

      // 12. Separation reasons from completed offboardings
      prisma.offboarding.groupBy({
        by: ['separationType'],
        where: {
          ...orgFilter,
          status: 'COMPLETED',
          completedAt: { gte: twelveMonthsAgo },
        },
        _count: { id: true },
      }),
    ])

    // ── Compute turnover rate ──
    // Average headcount: for each of the last 12 months, count employees active at month end
    let totalMonthlyHeadcount = 0
    for (let i = 0; i < 12; i++) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      const count = avgHeadcountEmployees.filter((emp) => {
        const joined = new Date(emp.joiningDate)
        const ended = emp.endDate ? new Date(emp.endDate) : null
        return joined <= monthEnd && (!ended || ended > monthEnd)
      }).length
      totalMonthlyHeadcount += count
    }
    const avgHeadcount = totalMonthlyHeadcount / 12
    const turnoverRate =
      avgHeadcount > 0
        ? Math.round((separationsLast12Months / avgHeadcount) * 10000) / 100
        : 0

    // ── Headcount delta ──
    const headcountDelta = totalHeadcount - lastMonthHeadcount

    // ── Open positions ──
    const openPositions = Number(openPositionsAgg._sum.vacancies ?? 0)

    // ── Gender ratio ──
    const genderRatio: Record<string, number> = { male: 0, female: 0, other: 0 }
    for (const g of genderDistribution) {
      const key = (g.gender || '').toLowerCase()
      if (key === 'male') genderRatio.male = g._count.id
      else if (key === 'female') genderRatio.female = g._count.id
      else genderRatio.other += g._count.id
    }

    // ── Department breakdown ──
    // Also fetch offboarding data per department for leavers
    const deptOffboardings = await prisma.offboarding.findMany({
      where: {
        ...orgFilter,
        status: 'COMPLETED',
        completedAt: { gte: startOfMonth, lte: endOfMonth },
      },
      select: {
        employee: { select: { departmentId: true } },
      },
    })

    const deptMap = new Map<
      string,
      { department: string; count: number; joiners: number; leavers: number }
    >()

    for (const emp of departmentStats) {
      const entry = deptMap.get(emp.departmentId) || {
        department: emp.department.name,
        count: 0,
        joiners: 0,
        leavers: 0,
      }
      entry.count++
      if (
        new Date(emp.joiningDate) >= startOfMonth &&
        new Date(emp.joiningDate) <= endOfMonth
      ) {
        entry.joiners++
      }
      deptMap.set(emp.departmentId, entry)
    }

    for (const ob of deptOffboardings) {
      const deptId = ob.employee.departmentId
      const entry = deptMap.get(deptId)
      if (entry) {
        entry.leavers++
      }
    }

    const departmentBreakdown = Array.from(deptMap.values())

    // ── Employment type breakdown ──
    const employmentTypeBreakdown = employmentTypeDistribution.map((e) => ({
      type: e.employmentType,
      count: e._count.id,
    }))

    // ── Separation reasons ──
    const separationReasonsResult = separationReasons.map((s) => ({
      reason: s.separationType,
      count: s._count.id,
    }))

    return apiSuccess({
      totalHeadcount,
      headcountDelta,
      newJoinersThisMonth,
      separationsThisMonth,
      turnoverRate,
      openPositions,
      expiringContracts,
      genderRatio,
      departmentBreakdown,
      employmentTypeBreakdown,
      separationReasons: separationReasonsResult,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
