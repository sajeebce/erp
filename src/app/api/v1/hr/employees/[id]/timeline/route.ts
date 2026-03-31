import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, apiNotFound, handleRouteError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface TimelineEvent {
  date: string
  type: string
  title: string
  description: string
  icon: string
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    const url = new URL(request.url)
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10))

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const events: TimelineEvent[] = []

    // 1. Contracts: created/renewed/terminated
    try {
      const contracts = await prisma.employeeContract.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
      })
      for (const c of contracts) {
        const status = (c.status as string).toLowerCase()
        let title = 'Contract created'
        let icon = 'file-text'
        if (status === 'renewed' || status === 'RENEWED') {
          title = 'Contract renewed'
          icon = 'refresh-cw'
        } else if (status === 'terminated' || status === 'TERMINATED') {
          title = 'Contract terminated'
          icon = 'x-circle'
        }
        events.push({
          date: (c.createdAt ?? new Date()).toISOString(),
          type: 'contract',
          title,
          description: `Contract ${c.contractNo || ''} — ${c.status}`.trim(),
          icon,
        })
      }
    } catch {
      // Model may not exist
    }

    // 2. Leave applications: approved/rejected
    try {
      const leaves = await prisma.leaveApplication.findMany({
        where: {
          employeeId,
          status: { in: ['APPROVED', 'REJECTED'] },
        },
        orderBy: { updatedAt: 'desc' },
      })
      for (const l of leaves) {
        const approved = l.status === 'APPROVED'
        events.push({
          date: (l.updatedAt ?? l.createdAt ?? new Date()).toISOString(),
          type: 'leave',
          title: approved ? 'Leave approved' : 'Leave rejected',
          description: `Leave — ${l.startDate?.toISOString().split('T')[0] || ''} to ${l.endDate?.toISOString().split('T')[0] || ''} (${l.days} days)`,
          icon: approved ? 'check-circle' : 'x-circle',
        })
      }
    } catch {
      // Model may not exist
    }

    // 3. Training: completed
    try {
      const participations = await prisma.trainingParticipant.findMany({
        where: { employeeId, attended: true },
        include: { training: { select: { title: true, startDate: true } } },
      })
      for (const tp of participations) {
        events.push({
          date: (tp.training.startDate ?? new Date()).toISOString(),
          type: 'training',
          title: 'Training completed',
          description: tp.training.title || 'Training program',
          icon: 'award',
        })
      }
    } catch {
      // Model may not exist
    }

    // 4. Performance reviews: completed
    try {
      const reviews = await prisma.performanceReview.findMany({
        where: { employeeId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
      })
      for (const r of reviews) {
        events.push({
          date: (r.completedAt ?? r.createdAt ?? new Date()).toISOString(),
          type: 'performance',
          title: 'Performance review completed',
          description: `${r.reviewPeriod || 'Review'} — Rating: ${r.rating ?? 'N/A'}`,
          icon: 'bar-chart',
        })
      }
    } catch {
      // Model may not exist
    }

    // 5. Onboarding: tasks completed (count only)
    try {
      const completedTasks = await prisma.onboardingProgress.findMany({
        where: { employeeId, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
      })
      if (completedTasks.length > 0) {
        const latestDate = completedTasks[0].completedAt!
        events.push({
          date: latestDate.toISOString(),
          type: 'onboarding',
          title: 'Onboarding tasks completed',
          description: `${completedTasks.length} onboarding task(s) completed`,
          icon: 'clipboard-check',
        })
      }
    } catch {
      // Model may not exist
    }

    // 6. Offboarding: initiated
    try {
      const offboardings = await prisma.offboarding.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
      })
      for (const o of offboardings) {
        events.push({
          date: (o.createdAt ?? new Date()).toISOString(),
          type: 'offboarding',
          title: 'Offboarding initiated',
          description: `${o.separationType || 'Separation'} — Last day: ${o.lastWorkingDay?.toISOString().split('T')[0] || 'TBD'}`,
          icon: 'log-out',
        })
      }
    } catch {
      // Model may not exist
    }

    // Sort by date descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Apply offset and limit
    const paginated = events.slice(offset, offset + limit)

    return apiSuccess({
      events: paginated,
      total: events.length,
      limit,
      offset,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
