import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import {
  PROJECT_EXTENSION_SELECT,
  assertExtensionAllowed,
  ensureFutureExtensionDate,
  generateProjectExtensionNo,
  normalizeOptionalString,
  parseRequiredDate,
} from '@/lib/project-extensions'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const project = await prisma.project.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!project) return apiNotFound('Project not found')

    const extensions = await prisma.projectExtensionRequest.findMany({
      where: { projectId: id, organizationId: auth.organizationId, deletedAt: null },
      select: PROJECT_EXTENSION_SELECT,
      orderBy: { requestedAt: 'desc' },
    })

    return apiSuccess(extensions)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const project = await prisma.project.findFirst({
      where: { id, organizationId: auth.organizationId, deletedAt: null },
      select: {
        id: true,
        projectNo: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        totalBudget: true,
      },
    })
    if (!project) return apiNotFound('Project not found')

    assertExtensionAllowed(project)

    const proposedEndDate = parseRequiredDate(body.proposedEndDate, 'proposedEndDate')
    ensureFutureExtensionDate(project.endDate!, proposedEndDate)

    const reason = normalizeOptionalString(body.reason)
    if (!reason) return apiBadRequest('reason is required')

    if (body.totalBudget !== undefined || body.proposedBudget !== undefined || body.currentBudget !== undefined) {
      const submittedBudget = new Prisma.Decimal(
        body.totalBudget ?? body.proposedBudget ?? body.currentBudget
      )
      if (!submittedBudget.equals(project.totalBudget)) {
        return apiBadRequest('No-cost extension cannot modify project budget')
      }
    }

    const pending = await prisma.projectExtensionRequest.findFirst({
      where: {
        organizationId: auth.organizationId,
        projectId: id,
        status: 'PENDING_APPROVAL',
        deletedAt: null,
      },
      select: { requestNo: true },
    })
    if (pending) {
      return apiBadRequest(`Project already has pending extension request ${pending.requestNo}`)
    }

    const requestNo = await generateProjectExtensionNo(auth.organizationId)

    const extension = await prisma.projectExtensionRequest.create({
      data: {
        organizationId: auth.organizationId,
        projectId: id,
        requestNo,
        currentStartDate: project.startDate,
        currentEndDate: project.endDate!,
        proposedEndDate,
        currentBudget: project.totalBudget,
        reason,
        impactNotes: normalizeOptionalString(body.impactNotes),
        approvalReference: normalizeOptionalString(body.approvalReference),
        attachmentUrl: normalizeOptionalString(body.attachmentUrl),
        requestedById: auth.userId,
      },
      select: PROJECT_EXTENSION_SELECT,
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'project',
      resource: 'project_extension_request',
      resourceId: extension.id,
      description: `Created no-cost extension request ${requestNo} for project ${project.projectNo}`,
      newValues: {
        projectId: id,
        requestNo,
        currentEndDate: project.endDate,
        proposedEndDate,
        currentBudget: project.totalBudget.toString(),
        reason,
      },
      ...auditCtx,
    })

    return apiCreated(extension)
  } catch (error) {
    return handleRouteError(error)
  }
}
