import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        id,
        deletedAt: null,
        fiscalYear: { organizationId: auth.organizationId },
      },
      include: {
        lines: {
          include: {
            account: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        fiscalYear: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
        project: {
          select: { id: true, name: true },
        },
        grant: {
          select: { id: true, title: true },
        },
      },
    })

    if (!journalEntry) {
      return apiNotFound('Journal entry not found')
    }

    return apiSuccess(journalEntry)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    // Find and verify ownership
    const existing = await prisma.journalEntry.findFirst({
      where: {
        id,
        deletedAt: null,
        fiscalYear: { organizationId: auth.organizationId },
      },
    })

    if (!existing) {
      return apiNotFound('Journal entry not found')
    }

    if (existing.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT journal entries can be updated')
    }

    const body = await request.json()
    const {
      date,
      description,
      reference,
      projectId,
      grantId,
      notes,
      lines,
    } = body

    // Validate lines if provided
    if (lines !== undefined) {
      if (!Array.isArray(lines) || lines.length < 2) {
        return apiBadRequest('At least 2 journal entry lines are required')
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const debit = Number(line.debit || 0)
        const credit = Number(line.credit || 0)

        if (!line.accountId) {
          return apiBadRequest(`Line ${i + 1}: accountId is required`)
        }

        if (debit > 0 && credit > 0) {
          return apiBadRequest(`Line ${i + 1}: a line cannot have both debit and credit`)
        }

        if (debit <= 0 && credit <= 0) {
          return apiBadRequest(`Line ${i + 1}: a line must have either debit > 0 or credit > 0`)
        }
      }

      const totalDebit = lines.reduce((sum: number, l: { debit?: number }) => sum + Number(l.debit || 0), 0)
      const totalCredit = lines.reduce((sum: number, l: { credit?: number }) => sum + Number(l.credit || 0), 0)

      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        return apiBadRequest(
          `Total debit (${totalDebit}) must equal total credit (${totalCredit})`
        )
      }

      // Validate all accountIds exist in same org and are not group accounts
      const accountIds = lines.map((l: { accountId: string }) => l.accountId)
      const accounts = await prisma.account.findMany({
        where: {
          id: { in: accountIds },
          organizationId: auth.organizationId,
          deletedAt: null,
        },
        select: { id: true, isGroup: true },
      })

      if (accounts.length !== new Set(accountIds).size) {
        return apiBadRequest('One or more account IDs are invalid or not found in this organization')
      }

      const groupAccounts = accounts.filter((a) => a.isGroup)
      if (groupAccounts.length > 0) {
        return apiBadRequest('Cannot post to group accounts. All accounts must be detail (non-group) accounts')
      }
    }

    // Validate projectId if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: auth.organizationId },
      })
      if (!project) {
        return apiBadRequest('Invalid project ID')
      }
    }

    // Validate grantId if provided (Grant links to org through donor)
    if (grantId) {
      const grant = await prisma.grant.findFirst({
        where: { id: grantId, donor: { organizationId: auth.organizationId } },
      })
      if (!grant) {
        return apiBadRequest('Invalid grant ID')
      }
    }

    // Update in transaction (replace lines entirely if provided)
    const updated = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {}

      if (date !== undefined) updateData.date = new Date(date)
      if (description !== undefined) updateData.description = description.trim()
      if (reference !== undefined) updateData.reference = reference || null
      if (projectId !== undefined) updateData.projectId = projectId || null
      if (grantId !== undefined) updateData.grantId = grantId || null
      if (notes !== undefined) updateData.notes = notes || null

      if (lines !== undefined) {
        const totalDebit = lines.reduce((sum: number, l: { debit?: number }) => sum + Number(l.debit || 0), 0)
        const totalCredit = lines.reduce((sum: number, l: { credit?: number }) => sum + Number(l.credit || 0), 0)

        updateData.totalDebit = new Prisma.Decimal(totalDebit)
        updateData.totalCredit = new Prisma.Decimal(totalCredit)

        // Delete existing lines and recreate
        await tx.journalEntryLine.deleteMany({
          where: { journalEntryId: id },
        })

        await tx.journalEntryLine.createMany({
          data: lines.map((line: {
            accountId: string
            description?: string
            debit?: number
            credit?: number
            projectId?: string
          }) => ({
            journalEntryId: id,
            accountId: line.accountId,
            description: line.description || null,
            debit: new Prisma.Decimal(Number(line.debit || 0)),
            credit: new Prisma.Decimal(Number(line.credit || 0)),
            projectId: line.projectId || null,
          })),
        })
      }

      return tx.journalEntry.update({
        where: { id },
        data: updateData,
        include: {
          lines: {
            include: {
              account: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      })
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'finance',
      resource: 'journal_entry',
      resourceId: id,
      description: `Updated journal entry ${existing.entryNo}`,
      oldValues: { description: existing.description, date: existing.date },
      newValues: { description: description || existing.description, date: date || existing.date },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.journalEntry.findFirst({
      where: {
        id,
        deletedAt: null,
        fiscalYear: { organizationId: auth.organizationId },
      },
    })

    if (!existing) {
      return apiNotFound('Journal entry not found')
    }

    if (existing.status !== 'DRAFT') {
      return apiBadRequest('Only DRAFT journal entries can be deleted')
    }

    // Soft delete with cascade line deletion
    await prisma.$transaction(async (tx) => {
      await tx.journalEntryLine.deleteMany({
        where: { journalEntryId: id },
      })
      await tx.journalEntry.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'DELETE',
      module: 'finance',
      resource: 'journal_entry',
      resourceId: id,
      description: `Deleted journal entry ${existing.entryNo}`,
      oldValues: { entryNo: existing.entryNo, description: existing.description },
      ...auditCtx,
    })

    return apiSuccess({ message: 'Journal entry deleted successfully' })
  } catch (error) {
    return handleRouteError(error)
  }
}
