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

    // Run all analytics queries in parallel
    const [
      openPositions,
      applicationsThisMonth,
      pipelineCounts,
      statusBreakdown,
      hiredApplications,
      departmentHiring,
    ] = await Promise.all([
      // Total open positions (PUBLISHED jobs)
      prisma.jobPosting.count({
        where: {
          organizationId: auth.organizationId,
          status: 'PUBLISHED',
        },
      }),

      // Total applications this month
      prisma.jobApplication.count({
        where: {
          organizationId: auth.organizationId,
          appliedAt: { gte: startOfMonth },
        },
      }),

      // Pipeline funnel: count per stage
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: {
          organizationId: auth.organizationId,
          status: {
            in: ['APPLIED', 'SCREENED', 'SHORTLISTED', 'TECHNICAL_TEST', 'INTERVIEW', 'REFERENCE_CHECK', 'OFFER', 'HIRED'],
          },
        },
        _count: { id: true },
      }),

      // Applications by status breakdown (all statuses)
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: { organizationId: auth.organizationId },
        _count: { id: true },
      }),

      // Hired applications for time-to-hire calculation
      prisma.jobApplication.findMany({
        where: {
          organizationId: auth.organizationId,
          status: 'HIRED',
        },
        select: {
          appliedAt: true,
          updatedAt: true,
        },
      }),

      // Top departments hiring (by open positions)
      prisma.jobPosting.groupBy({
        by: ['departmentId'],
        where: {
          organizationId: auth.organizationId,
          status: 'PUBLISHED',
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ])

    // Calculate average time-to-hire in days
    let averageTimeToHire: number | null = null
    if (hiredApplications.length > 0) {
      const totalDays = hiredApplications.reduce((sum, app) => {
        const days = (app.updatedAt.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24)
        return sum + days
      }, 0)
      averageTimeToHire = Math.round((totalDays / hiredApplications.length) * 10) / 10
    }

    // Build pipeline funnel in order
    const pipelineOrder = ['APPLIED', 'SCREENED', 'SHORTLISTED', 'TECHNICAL_TEST', 'INTERVIEW', 'REFERENCE_CHECK', 'OFFER', 'HIRED'] as const
    const pipelineMap = new Map(pipelineCounts.map(p => [p.status as string, p._count.id]))
    const pipelineFunnel = pipelineOrder.map(stage => ({
      stage,
      count: pipelineMap.get(stage) || 0,
    }))

    // Status breakdown
    const applicationsByStatus = statusBreakdown.map(s => ({
      status: s.status,
      count: s._count.id,
    }))

    // Resolve department names for top hiring
    const departmentIds = departmentHiring.map(d => d.departmentId)
    const departments = departmentIds.length > 0
      ? await prisma.department.findMany({
          where: { id: { in: departmentIds } },
          select: { id: true, name: true },
        })
      : []
    const deptMap = new Map(departments.map(d => [d.id, d.name]))

    const topDepartmentsHiring = departmentHiring.map(d => ({
      departmentId: d.departmentId,
      departmentName: deptMap.get(d.departmentId) || 'Unknown',
      openPositions: d._count.id,
    }))

    return apiSuccess({
      openPositions,
      applicationsThisMonth,
      averageTimeToHire,
      pipelineFunnel,
      applicationsByStatus,
      topDepartmentsHiring,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
