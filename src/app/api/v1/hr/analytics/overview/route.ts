import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const orgFilter = { organizationId: auth.organizationId }

    const [
      totalActiveEmployees,
      newHiresThisMonth,
      exitsThisMonth,
      expiringContracts,
      pendingGrievances,
      genderDistribution,
      departmentDistribution,
      employmentTypeDistribution,
      allEmployeesForTenure,
    ] = await Promise.all([
      // Total active employees
      prisma.employee.count({
        where: { ...orgFilter, status: 'ACTIVE', deletedAt: null },
      }),

      // New hires this month
      prisma.employee.count({
        where: {
          ...orgFilter,
          deletedAt: null,
          joiningDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // Exits this month (completed offboardings)
      prisma.offboarding.count({
        where: {
          ...orgFilter,
          status: 'COMPLETED',
          completedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // Active contracts expiring in 30 days
      prisma.employeeContract.count({
        where: {
          ...orgFilter,
          status: 'ACTIVE',
          endDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),

      // Pending grievances
      prisma.employeeGrievance.count({
        where: {
          ...orgFilter,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING'] },
        },
      }),

      // Gender distribution
      prisma.employee.groupBy({
        by: ['gender'],
        where: { ...orgFilter, status: 'ACTIVE', deletedAt: null },
        _count: { id: true },
      }),

      // Department distribution
      prisma.employee.groupBy({
        by: ['departmentId'],
        where: { ...orgFilter, status: 'ACTIVE', deletedAt: null },
        _count: { id: true },
      }),

      // Employment type distribution
      prisma.employee.groupBy({
        by: ['employmentType'],
        where: { ...orgFilter, status: 'ACTIVE', deletedAt: null },
        _count: { id: true },
      }),

      // All active employees for average tenure calculation
      prisma.employee.findMany({
        where: { ...orgFilter, status: 'ACTIVE', deletedAt: null },
        select: { joiningDate: true },
      }),
    ])

    // Resolve department names
    const deptIds = departmentDistribution.map((d) => d.departmentId)
    const departments = deptIds.length > 0
      ? await prisma.department.findMany({
          where: { id: { in: deptIds } },
          select: { id: true, name: true },
        })
      : []
    const deptMap = new Map(departments.map((d) => [d.id, d.name]))

    // Calculate average tenure in years
    const totalTenureMs = allEmployeesForTenure.reduce((sum, emp) => {
      return sum + (now.getTime() - new Date(emp.joiningDate).getTime())
    }, 0)
    const avgTenureYears = allEmployeesForTenure.length > 0
      ? Math.round((totalTenureMs / allEmployeesForTenure.length / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10
      : 0

    return apiSuccess({
      totalActiveEmployees,
      newHiresThisMonth,
      exitsThisMonth,
      expiringContracts,
      pendingGrievances,
      averageTenureYears: avgTenureYears,
      genderDistribution: genderDistribution.map((g) => ({
        gender: g.gender || 'Not specified',
        count: g._count.id,
      })),
      departmentDistribution: departmentDistribution.map((d) => ({
        departmentId: d.departmentId,
        departmentName: deptMap.get(d.departmentId) || 'Unknown',
        count: d._count.id,
      })),
      employmentTypeDistribution: employmentTypeDistribution.map((e) => ({
        type: e.employmentType,
        count: e._count.id,
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
