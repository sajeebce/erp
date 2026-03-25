import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const account = await prisma.account.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        nameInBangla: true,
        type: true,
        nature: true,
        parentId: true,
        level: true,
        isGroup: true,
        description: true,
        isActive: true,
        isBankAccount: true,
        fundCode: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        children: {
          where: { deletedAt: null },
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            nature: true,
            level: true,
            isGroup: true,
            isActive: true,
          },
          orderBy: { code: 'asc' },
        },
      },
    })

    if (!account) {
      return apiNotFound('Account not found')
    }

    // Compute balance summary from journal entry lines
    const balanceSummary = await prisma.journalEntryLine.aggregate({
      where: {
        accountId: id,
        journalEntry: {
          status: 'APPROVED',
          deletedAt: null,
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    })

    const totalDebit = Number(balanceSummary._sum.debit ?? 0)
    const totalCredit = Number(balanceSummary._sum.credit ?? 0)
    const balance = account.nature === 'DEBIT'
      ? totalDebit - totalCredit
      : totalCredit - totalDebit

    return apiSuccess({
      ...account,
      balanceSummary: {
        totalDebit,
        totalCredit,
        balance,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.account.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
    })

    if (!existing) {
      return apiNotFound('Account not found')
    }

    const body = await request.json()

    // Only allow updating specific fields — code, type, nature cannot be changed
    const allowedFields = ['name', 'description', 'isActive', 'fundCode', 'projectId'] as const
    const data: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        return apiBadRequest('Name must be a non-empty string')
      }
      data.name = (data.name as string).trim()
    }

    // Validate projectId belongs to this org if provided
    if (data.projectId !== undefined && data.projectId !== null) {
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId as string,
          organizationId: auth.organizationId,
        },
      })

      if (!project) {
        return apiBadRequest('Invalid project ID')
      }
    }

    const updated = await prisma.account.update({
      where: { id },
      data,
      select: {
        id: true,
        code: true,
        name: true,
        nameInBangla: true,
        type: true,
        nature: true,
        parentId: true,
        level: true,
        isGroup: true,
        description: true,
        isActive: true,
        isBankAccount: true,
        fundCode: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.account.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
    })

    if (!existing) {
      return apiNotFound('Account not found')
    }

    // Check if the account has any journal entry lines
    const journalLineCount = await prisma.journalEntryLine.count({
      where: { accountId: id },
    })

    if (journalLineCount > 0) {
      return apiBadRequest(
        `Cannot deactivate account: it has ${journalLineCount} journal entry line(s). Remove or reassign them first.`
      )
    }

    // Soft deactivate
    const updated = await prisma.account.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
