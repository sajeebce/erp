import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

// ─── Main Handler ───

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId')

    if (projectId) {
      return apiSuccess(await generateProjectDetail(orgId, projectId))
    }

    return apiSuccess(await generatePortfolioSummary(orgId))
  } catch (error) {
    return handleRouteError(error)
  }
}

// ─── Project Detail Report ───

async function generateProjectDetail(organizationId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      projectNo: true,
      name: true,
      description: true,
      totalBudget: true,
      amountSpent: true,
      progress: true,
      status: true,
      startDate: true,
      endDate: true,
      location: true,
      activities: {
        select: {
          id: true,
          activityNo: true,
          name: true,
          status: true,
          progress: true,
          budget: true,
          actualCost: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
      milestones: {
        select: {
          id: true,
          milestoneNo: true,
          description: true,
          status: true,
          targetDate: true,
          actualDate: true,
        },
        orderBy: { targetDate: 'asc' },
      },
      teamMembers: {
        where: { isActive: true },
        select: {
          role: true,
          allocation: true,
          employee: {
            select: {
              employeeNo: true,
              fullName: true,
              designation: {
                select: { title: true },
              },
            },
          },
        },
      },
      grants: {
        where: { deletedAt: null },
        select: {
          id: true,
          grantNo: true,
          title: true,
          awardAmount: true,
          disbursedAmount: true,
          status: true,
          fundReceipts: {
            where: { deletedAt: null },
            select: {
              receiptNo: true,
              date: true,
              amountInBDT: true,
              status: true,
            },
            orderBy: { date: 'desc' },
          },
        },
      },
      enrollments: {
        select: {
          id: true,
          status: true,
        },
      },
      serviceDeliveries: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  })

  if (!project) {
    throw new Error('Not found: Project not found in this organization')
  }

  const activitiesCompleted = project.activities.filter((a) => a.status === 'COMPLETED').length
  const activitiesDelayed = project.activities.filter((a) => a.status === 'DELAYED').length
  const milestonesAchieved = project.milestones.filter((m) => m.status === 'ACHIEVED').length
  const milestonesOverdue = project.milestones.filter((m) => m.status === 'OVERDUE').length
  const activeBeneficiaries = project.enrollments.filter((e) => e.status === 'ACTIVE').length
  const deliveredServices = project.serviceDeliveries.filter((s) => s.status === 'DELIVERED').length

  return {
    reportType: 'project-detail',
    generatedAt: new Date(),
    project: {
      projectId: project.id,
      projectNo: project.projectNo,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      location: project.location,
      progress: project.progress,
    },
    budget: {
      totalBudget: Number(project.totalBudget),
      amountSpent: Number(project.amountSpent),
      remaining: Number(project.totalBudget) - Number(project.amountSpent),
      utilization: Number(project.totalBudget) > 0
        ? (Number(project.amountSpent) / Number(project.totalBudget)) * 100
        : 0,
    },
    activities: {
      items: project.activities.map((a) => ({
        activityNo: a.activityNo,
        name: a.name,
        status: a.status,
        progress: a.progress,
        budget: Number(a.budget),
        actualCost: Number(a.actualCost),
        startDate: a.startDate,
        endDate: a.endDate,
      })),
      summary: {
        total: project.activities.length,
        completed: activitiesCompleted,
        delayed: activitiesDelayed,
        inProgress: project.activities.filter((a) => a.status === 'IN_PROGRESS').length,
        planned: project.activities.filter((a) => a.status === 'PLANNED').length,
      },
    },
    milestones: {
      items: project.milestones.map((m) => ({
        milestoneNo: m.milestoneNo,
        description: m.description,
        status: m.status,
        targetDate: m.targetDate,
        actualDate: m.actualDate,
      })),
      summary: {
        total: project.milestones.length,
        achieved: milestonesAchieved,
        overdue: milestonesOverdue,
        onTrack: project.milestones.filter((m) => m.status === 'ON_TRACK').length,
        atRisk: project.milestones.filter((m) => m.status === 'AT_RISK').length,
      },
    },
    teamMembers: project.teamMembers.map((tm) => ({
      employeeNo: tm.employee.employeeNo,
      name: tm.employee.fullName,
      designation: tm.employee.designation.title,
      role: tm.role,
      allocation: tm.allocation,
    })),
    beneficiaries: {
      totalEnrolled: project.enrollments.length,
      active: activeBeneficiaries,
    },
    serviceDelivery: {
      total: project.serviceDeliveries.length,
      delivered: deliveredServices,
    },
    fundReceipts: project.grants.flatMap((g) =>
      g.fundReceipts.map((r) => ({
        grantNo: g.grantNo,
        receiptNo: r.receiptNo,
        date: r.date,
        amount: Number(r.amountInBDT),
        status: r.status,
      }))
    ),
  }
}

// ─── Portfolio Summary ───

async function generatePortfolioSummary(organizationId: string) {
  const projects = await prisma.project.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      projectNo: true,
      name: true,
      totalBudget: true,
      amountSpent: true,
      progress: true,
      status: true,
      startDate: true,
      endDate: true,
      teamMembers: {
        where: { isActive: true },
        select: { id: true },
      },
      enrollments: {
        where: { status: 'ACTIVE' },
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return {
    reportType: 'project-portfolio',
    generatedAt: new Date(),
    projects: projects.map((p) => ({
      projectId: p.id,
      projectNo: p.projectNo,
      name: p.name,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      progress: p.progress,
      totalBudget: Number(p.totalBudget),
      amountSpent: Number(p.amountSpent),
      budgetUtilization: Number(p.totalBudget) > 0
        ? (Number(p.amountSpent) / Number(p.totalBudget)) * 100
        : 0,
      teamSize: p.teamMembers.length,
      activeBeneficiaries: p.enrollments.length,
    })),
    summary: {
      totalProjects: projects.length,
      byStatus: {
        active: projects.filter((p) => p.status === 'ACTIVE').length,
        pipeline: projects.filter((p) => p.status === 'PIPELINE').length,
        completed: projects.filter((p) => p.status === 'COMPLETED').length,
        onHold: projects.filter((p) => p.status === 'ON_HOLD').length,
        closed: projects.filter((p) => p.status === 'CLOSED').length,
        cancelled: projects.filter((p) => p.status === 'CANCELLED').length,
      },
      totalBudget: projects.reduce((s, p) => s + Number(p.totalBudget), 0),
      totalSpent: projects.reduce((s, p) => s + Number(p.amountSpent), 0),
      totalTeamMembers: projects.reduce((s, p) => s + p.teamMembers.length, 0),
      totalBeneficiaries: projects.reduce((s, p) => s + p.enrollments.length, 0),
    },
  }
}
