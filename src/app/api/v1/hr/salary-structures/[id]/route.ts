import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const structure = await prisma.salaryStructure.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        grade: { select: { id: true, code: true, name: true } },
        lines: {
          include: { component: { select: { id: true, code: true, name: true, type: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!structure) {
      return apiNotFound('Salary structure not found')
    }

    return apiSuccess(structure)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.salaryStructure.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: { lines: true },
    })

    if (!existing) {
      return apiNotFound('Salary structure not found')
    }

    const { name, gradeId, description, isDefault, isActive, lines } = body

    const structure = await prisma.$transaction(async (tx) => {
      // If lines provided, delete existing and recreate
      if (lines && Array.isArray(lines)) {
        await tx.salaryStructureLine.deleteMany({ where: { structureId: id } })
        if (lines.length > 0) {
          await tx.salaryStructureLine.createMany({
            data: lines.map(
              (l: { componentId: string; calculationType: 'FIXED' | 'PERCENT_OF_BASIC' | 'PERCENT_OF_GROSS'; amount?: number; percentage?: number; sortOrder?: number }) => ({
                structureId: id,
                componentId: l.componentId,
                calculationType: l.calculationType as 'FIXED' | 'PERCENT_OF_BASIC' | 'PERCENT_OF_GROSS',
                amount: l.amount ?? null,
                percentage: l.percentage ?? null,
                sortOrder: l.sortOrder ?? 0,
              })
            ),
          })
        }
      }

      return tx.salaryStructure.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(gradeId !== undefined && { gradeId: gradeId || null }),
          ...(description !== undefined && { description }),
          ...(isDefault !== undefined && { isDefault }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          grade: { select: { id: true, code: true, name: true } },
          lines: {
            include: { component: { select: { id: true, code: true, name: true, type: true } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
      })
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'salary_structure',
      resourceId: id,
      description: `Updated salary structure "${structure.name}"`,
      oldValues: { name: existing.name },
      newValues: { name: structure.name },
      ...auditCtx,
    })

    return apiSuccess(structure)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.salaryStructure.findFirst({
      where: { id, organizationId: auth.organizationId },
    })

    if (!existing) {
      return apiNotFound('Salary structure not found')
    }

    const structure = await prisma.salaryStructure.update({
      where: { id },
      data: { isActive: false },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'salary_structure',
      resourceId: id,
      description: `Deactivated salary structure "${existing.name}"`,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      ...auditCtx,
    })

    return apiSuccess(structure)
  } catch (error) {
    return handleRouteError(error)
  }
}
