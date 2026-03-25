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

    const where = {
      organizationId: auth.organizationId,
      deletedAt: null,
    }

    // Aggregate project stats
    const [totalProjects, activeProjects, projectAggregates] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.project.aggregate({
        where,
        _avg: { progress: true },
        _sum: { totalBudget: true, amountSpent: true },
      }),
    ])

    // Get per-project performance data
    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        projectNo: true,
        name: true,
        status: true,
        totalBudget: true,
        amountSpent: true,
        progress: true,
        startDate: true,
        endDate: true,
        _count: {
          select: {
            activities: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate performance metrics for each project
    const projectPerformance = await Promise.all(
      projects.map(async (project) => {
        const totalBudget = Number(project.totalBudget)
        const amountSpent = Number(project.amountSpent)

        // Calculate burn rate (spent / budget * 100)
        const burnRate = totalBudget > 0
          ? Math.round((amountSpent / totalBudget) * 10000) / 100
          : 0

        // Calculate activity completion
        const completedActivities = await prisma.activity.count({
          where: {
            projectId: project.id,
            status: 'COMPLETED',
          },
        })

        const totalActivities = project._count.activities
        const activityCompletion = totalActivities > 0
          ? Math.round((completedActivities / totalActivities) * 10000) / 100
          : 0

        return {
          id: project.id,
          projectNo: project.projectNo,
          name: project.name,
          status: project.status,
          totalBudget,
          amountSpent,
          progress: project.progress,
          burnRate,
          totalActivities,
          completedActivities,
          activityCompletion,
          startDate: project.startDate,
          endDate: project.endDate,
        }
      })
    )

    return apiSuccess({
      totalProjects,
      activeProjects,
      averageProgress: Math.round(projectAggregates._avg.progress ?? 0),
      totalBudget: Number(projectAggregates._sum.totalBudget ?? 0),
      totalSpent: Number(projectAggregates._sum.amountSpent ?? 0),
      projectPerformance,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
