import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { logAudit, getAuditContext } from '@/lib/audit'
import { Prisma } from '@prisma/client'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      grant: { donor: { organizationId: auth.organizationId } },
    }

    const grantId = url.searchParams.get('grantId')
    if (grantId) {
      where.grantId = grantId
    }

    const projectId = url.searchParams.get('projectId')
    if (projectId) {
      where.projectId = projectId
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const [requisitions, total] = await Promise.all([
      prisma.fundRequisition.findMany({
        where,
        select: {
          id: true,
          requisitionNo: true,
          date: true,
          grantId: true,
          projectId: true,
          amount: true,
          purpose: true,
          requestedById: true,
          status: true,
          approvedById: true,
          approvedAt: true,
          disbursedAt: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          grant: {
            select: {
              id: true,
              grantNo: true,
              title: true,
              donor: {
                select: { id: true, name: true },
              },
            },
          },
          project: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.fundRequisition.count({ where }),
    ])

    return apiPaginated(requisitions, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      date,
      grantId,
      projectId,
      amount,
      purpose,
      notes,
    } = body

    if (!date || !grantId || !projectId || amount === undefined || !purpose) {
      return apiBadRequest('date, grantId, projectId, amount, and purpose are required')
    }

    if (Number(amount) <= 0) {
      return apiBadRequest('amount must be greater than 0')
    }

    // Validate grant belongs to org
    const grant = await prisma.grant.findFirst({
      where: {
        id: grantId,
        donor: { organizationId: auth.organizationId },
        deletedAt: null,
      },
      select: { id: true, grantNo: true },
    })

    if (!grant) {
      return apiBadRequest('Grant not found in this organization')
    }

    // Validate project belongs to org
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: auth.organizationId,
      },
      select: { id: true },
    })

    if (!project) {
      return apiBadRequest('Project not found in this organization')
    }

    // Auto-generate requisition number
    const requisitionNo = await generateNextNumber(auth.organizationId, 'fund_requisition')

    const requisition = await prisma.fundRequisition.create({
      data: {
        requisitionNo,
        date: new Date(date),
        grantId,
        projectId,
        amount: new Prisma.Decimal(amount),
        purpose: purpose.trim(),
        requestedById: auth.userId,
        status: 'DRAFT',
        notes: notes || null,
      },
      select: {
        id: true,
        requisitionNo: true,
        date: true,
        grantId: true,
        projectId: true,
        amount: true,
        purpose: true,
        requestedById: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        grant: {
          select: {
            id: true,
            grantNo: true,
            title: true,
            donor: {
              select: { id: true, name: true },
            },
          },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'donor',
      resource: 'fund_requisition',
      resourceId: requisition.id,
      description: `Created fund requisition ${requisitionNo} for grant ${grant.grantNo}`,
      newValues: { requisitionNo, grantId, projectId, amount, purpose },
      ...auditCtx,
    })

    return apiCreated(requisition)
  } catch (error) {
    return handleRouteError(error)
  }
}
