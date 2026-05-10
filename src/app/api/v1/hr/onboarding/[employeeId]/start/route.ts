import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { queueEmail } from '@/lib/email-queue'
import {
  apiCreated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ employeeId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { employeeId } = await params

    // Validate employee belongs to org
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true, fullName: true, employeeNo: true, email: true },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    // Check if onboarding already started
    const existingCount = await prisma.onboardingProgress.count({
      where: { employeeId },
    })

    if (existingCount > 0) {
      return apiBadRequest('Onboarding already started for this employee')
    }

    // Get all active checklist items (org-specific + global defaults)
    const checklists = await prisma.onboardingChecklist.findMany({
      where: {
        isActive: true,
        OR: [
          { organizationId: auth.organizationId },
          { organizationId: null },
        ],
      },
    })

    if (checklists.length === 0) {
      return apiBadRequest('No onboarding checklist items found. Create checklist items first.')
    }

    // Create progress records for each checklist item
    await prisma.onboardingProgress.createMany({
      data: checklists.map((c) => ({
        employeeId,
        checklistId: c.id,
      })),
    })

    await queueEmail({
      organizationId: auth.organizationId,
      recipientEmail: employee.email,
      eventKey: `onboarding:${employeeId}:started`,
      templateKey: 'ONBOARDING_STARTED',
      fallbackSubject: 'Onboarding started',
      fallbackBody: 'Dear {{employeeName}}, your onboarding process has started.',
      variables: {
        employeeName: employee.fullName,
        employeeNo: employee.employeeNo,
      },
      relatedModule: 'onboarding',
      relatedEntityId: employeeId,
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'onboarding',
      resourceId: employeeId,
      description: `Started onboarding for "${employee.fullName}" (${employee.employeeNo}) with ${checklists.length} tasks`,
      newValues: { employeeId, taskCount: checklists.length },
      ...auditCtx,
    })

    return apiCreated({
      employeeId,
      tasksCreated: checklists.length,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
