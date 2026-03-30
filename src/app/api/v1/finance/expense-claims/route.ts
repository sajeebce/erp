import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
    }

    if (search) {
      where.OR = [
        { claimNo: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
      ]
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const employeeId = url.searchParams.get('employeeId')
    if (employeeId) {
      where.employeeId = employeeId
    }

    const projectId = url.searchParams.get('projectId')
    if (projectId) {
      where.projectId = projectId
    }

    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.claimDate = dateFilter
    }

    const [claims, total] = await Promise.all([
      prisma.expenseClaim.findMany({
        where,
        select: {
          id: true,
          claimNo: true,
          employeeId: true,
          claimDate: true,
          totalAmount: true,
          approvedAmount: true,
          purpose: true,
          projectId: true,
          status: true,
          netPayable: true,
          paidAt: true,
          journalEntryId: true,
          voucherId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { items: true },
          },
        },
        orderBy: { claimDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expenseClaim.count({ where }),
    ])

    // Enrich with employee names and project names
    const employeeIds = [...new Set(claims.map((c) => c.employeeId))]
    const projectIds = [...new Set(claims.map((c) => c.projectId).filter(Boolean))] as string[]

    const [employees, projects] = await Promise.all([
      employeeIds.length > 0
        ? prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            select: { id: true, fullName: true, employeeNo: true },
          })
        : [],
      projectIds.length > 0
        ? prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true },
          })
        : [],
    ])

    const employeeMap = new Map(employees.map((e) => [e.id, e.fullName]))
    const projectMap = new Map(projects.map((p) => [p.id, p.name]))

    const enriched = claims.map((c) => ({
      ...c,
      itemCount: c._count.items,
      _count: undefined,
      employeeName: employeeMap.get(c.employeeId) || null,
      projectName: c.projectId ? projectMap.get(c.projectId) || null : null,
    }))

    return apiPaginated(enriched, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      purpose,
      items,
      projectId,
      grantId,
      travelStartDate,
      travelEndDate,
      advanceId,
      notes,
    } = body

    // Validate required fields
    if (!purpose || !items || !Array.isArray(items) || items.length === 0) {
      return apiBadRequest('purpose and at least one item are required')
    }

    // Find employee from auth user
    const employee = await prisma.employee.findFirst({
      where: { userId: auth.userId, organizationId: auth.organizationId },
    })
    if (!employee) {
      return apiBadRequest('No employee record found for the current user')
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.date || !item.category || !item.description || !item.amount) {
        return apiBadRequest(`Item ${i + 1}: date, category, description, and amount are required`)
      }
      const amt = Number(item.amount)
      if (isNaN(amt) || amt <= 0) {
        return apiBadRequest(`Item ${i + 1}: amount must be greater than 0`)
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

    // Validate grantId if provided
    if (grantId) {
      const grant = await prisma.grant.findFirst({
        where: { id: grantId, donor: { organizationId: auth.organizationId } },
      })
      if (!grant) {
        return apiBadRequest('Invalid grant ID')
      }
    }

    // Validate advanceId if provided
    if (advanceId) {
      const advance = await prisma.employeeAdvance.findFirst({
        where: {
          id: advanceId,
          organizationId: auth.organizationId,
          employeeId: employee.id,
          status: { in: ['DISBURSED', 'PARTIALLY_SETTLED'] },
        },
      })
      if (!advance) {
        return apiBadRequest('Invalid advance ID or advance is not in a disbursed state')
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: { amount: number | string }) => {
      return sum + Number(item.amount)
    }, 0)

    // Generate claim number
    const claimNo = await generateNextNumber(auth.organizationId, 'expense_claim')

    const claim = await prisma.expenseClaim.create({
      data: {
        organizationId: auth.organizationId,
        claimNo,
        employeeId: employee.id,
        claimDate: new Date(),
        totalAmount: new Prisma.Decimal(totalAmount),
        purpose: purpose.trim(),
        projectId: projectId || null,
        grantId: grantId || null,
        travelStartDate: travelStartDate ? new Date(travelStartDate) : null,
        travelEndDate: travelEndDate ? new Date(travelEndDate) : null,
        advanceId: advanceId || null,
        notes: notes || null,
        status: 'DRAFT',
        items: {
          create: items.map(
            (
              item: {
                date: string
                category: string
                description: string
                amount: number | string
                accountId?: string
                receiptPath?: string
                hasReceipt?: boolean
                noReceiptReason?: string
                tdsRate?: number | string
                vdsRate?: number | string
                location?: string
                notes?: string
                projectId?: string
                budgetLineId?: string
              },
              index: number,
            ) => {
              const amt = Number(item.amount)
              const tdsRate = item.tdsRate ? Number(item.tdsRate) : null
              const vdsRate = item.vdsRate ? Number(item.vdsRate) : null
              const tdsAmount = tdsRate ? (amt * tdsRate) / 100 : null
              const vdsAmount = vdsRate ? (amt * vdsRate) / 100 : null

              return {
                date: new Date(item.date),
                category: item.category,
                description: item.description.trim(),
                amount: new Prisma.Decimal(amt),
                accountId: item.accountId || null,
                receiptPath: item.receiptPath || null,
                hasReceipt: item.hasReceipt ?? false,
                noReceiptReason: item.noReceiptReason || null,
                tdsRate: tdsRate !== null ? new Prisma.Decimal(tdsRate) : null,
                tdsAmount: tdsAmount !== null ? new Prisma.Decimal(tdsAmount) : null,
                vdsRate: vdsRate !== null ? new Prisma.Decimal(vdsRate) : null,
                vdsAmount: vdsAmount !== null ? new Prisma.Decimal(vdsAmount) : null,
                location: item.location || null,
                notes: item.notes || null,
                projectId: item.projectId || null,
                budgetLineId: item.budgetLineId || null,
                sortOrder: index,
              }
            },
          ),
        },
      },
      include: {
        items: true,
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'finance',
      resource: 'expense_claim',
      resourceId: claim.id,
      description: `Created expense claim ${claimNo} for ${purpose}`,
      newValues: { claimNo, purpose, totalAmount, itemCount: items.length },
      ...auditCtx,
    })

    return apiCreated(claim)
  } catch (error) {
    return handleRouteError(error)
  }
}
