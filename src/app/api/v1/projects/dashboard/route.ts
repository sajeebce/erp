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

    const [totalProjects, activeProjects, pipelineProjects, completedProjects, projectAggregates, teamMemberCount] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.project.count({ where: { ...where, status: 'PIPELINE' } }),
      prisma.project.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.project.aggregate({
        where,
        _avg: { progress: true },
        _sum: { totalBudget: true, amountSpent: true },
      }),
      prisma.projectTeamMember.count({
        where: { isActive: true, project: { organizationId: auth.organizationId, deletedAt: null } },
      }),
    ])

    // Activity stats across all projects
    const [totalActivities, completedActivitiesTotal, delayedActivitiesTotal] = await Promise.all([
      prisma.activity.count({ where: { project: { organizationId: auth.organizationId, deletedAt: null } } }),
      prisma.activity.count({ where: { status: 'COMPLETED', project: { organizationId: auth.organizationId, deletedAt: null } } }),
      prisma.activity.count({ where: { status: 'DELAYED', project: { organizationId: auth.organizationId, deletedAt: null } } }),
    ])

    // Per-project performance
    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        projectNo: true,
        name: true,
        projectType: true,
        sector: true,
        status: true,
        totalBudget: true,
        amountSpent: true,
        currency: true,
        country: true,
        progress: true,
        startDate: true,
        endDate: true,
        _count: {
          select: {
            activities: true,
            milestones: true,
            teamMembers: { where: { isActive: true } },
            indicators: true,
            risks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const projectPerformance = await Promise.all(
      projects.map(async (project) => {
        const totalBudget = Number(project.totalBudget)
        const amountSpent = Number(project.amountSpent)
        const burnRate = totalBudget > 0 ? Math.round((amountSpent / totalBudget) * 10000) / 100 : 0

        const completedActivities = await prisma.activity.count({
          where: { projectId: project.id, status: 'COMPLETED' },
        })
        const totalActs = project._count.activities
        const activityCompletion = totalActs > 0 ? Math.round((completedActivities / totalActs) * 10000) / 100 : 0

        const achievedMilestones = await prisma.milestone.count({
          where: { projectId: project.id, status: 'ACHIEVED' },
        })

        return {
          id: project.id,
          projectNo: project.projectNo,
          name: project.name,
          projectType: project.projectType,
          sector: project.sector,
          status: project.status,
          totalBudget,
          amountSpent,
          currency: project.currency,
          country: project.country,
          progress: project.progress,
          burnRate,
          totalActivities: totalActs,
          completedActivities,
          activityCompletion,
          totalMilestones: project._count.milestones,
          achievedMilestones,
          teamMembers: project._count.teamMembers,
          indicators: project._count.indicators,
          risks: project._count.risks,
          startDate: project.startDate,
          endDate: project.endDate,
        }
      })
    )

    return apiSuccess({
      totalProjects,
      activeProjects,
      pipelineProjects,
      completedProjects,
      averageProgress: Math.round(projectAggregates._avg.progress ?? 0),
      totalBudget: Number(projectAggregates._sum.totalBudget ?? 0),
      totalSpent: Number(projectAggregates._sum.amountSpent ?? 0),
      teamMembers: teamMemberCount,
      totalActivities,
      completedActivities: completedActivitiesTotal,
      delayedActivities: delayedActivitiesTotal,
      projectPerformance,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
