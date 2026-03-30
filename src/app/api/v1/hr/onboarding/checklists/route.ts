import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const checklists = await prisma.onboardingChecklist.findMany({
      where: {
        OR: [
          { organizationId: auth.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    })

    return apiSuccess(checklists)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { name, category } = body

    if (!name || !category) {
      return apiBadRequest('name and category are required')
    }

    const checklist = await prisma.onboardingChecklist.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        description: body.description || null,
        category,
        isRequired: body.isRequired ?? true,
        requiresDocument: body.requiresDocument ?? false,
        documentType: body.documentType || null,
        sortOrder: body.sortOrder ?? 0,
        isActive: true,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'onboarding-checklist',
      resourceId: checklist.id,
      description: `Created onboarding checklist item "${name}" (${category})`,
      newValues: { name, category, isRequired: checklist.isRequired },
      ...auditCtx,
    })

    return apiCreated(checklist)
  } catch (error) {
    return handleRouteError(error)
  }
}
