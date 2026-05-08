import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { logAudit, getAuditContext } from '@/lib/audit'
import { Prisma } from '@prisma/client'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, ['ADMIN', 'FINANCE_MANAGER'])
    const { id } = await params

    const run = await prisma.payrollRun.findFirst({
      where: {
        id,
        OR: [
          { organizationId: auth.organizationId },
          { organizationId: null },
        ],
      },
      include: {
        entries: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                primaryBusinessUnitId: true,
                projectAllocations: {
                  where: { isActive: true },
                  orderBy: { startDate: 'asc' },
                },
              },
            },
          },
        },
      },
    })
    if (!run) return apiNotFound('Payroll run not found')

    if (run.status !== 'PROCESSED' && !(run.status === 'APPROVED' && !run.journalEntryId)) {
      return apiBadRequest('Payroll run must be processed before approval')
    }

    const totalGross = r2(run.entries.reduce((sum, entry) => sum + Number(entry.grossSalary), 0))
    const totalNet = r2(run.entries.reduce((sum, entry) => sum + Number(entry.netSalary), 0))
    const totalWithheldDeductions = r2(totalGross - totalNet)
    const periodStart = new Date(run.year, run.month - 1, 1)
    const periodEnd = new Date(run.year, run.month, 0, 23, 59, 59)
    const period = `${run.year}-${String(run.month).padStart(2, '0')}`

    let journalEntryId: string | null = null

    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: { organizationId: auth.organizationId, isCurrent: true },
      select: { id: true },
    })

    if (fiscalYear && totalGross > 0) {
      let salaryAccount = await prisma.account.findFirst({
        where: {
          organizationId: auth.organizationId,
          isGroup: false,
          deletedAt: null,
          type: 'EXPENSE',
          code: '601001',
        },
        select: { id: true },
      })

      if (!salaryAccount) {
        salaryAccount = await prisma.account.findFirst({
          where: {
            organizationId: auth.organizationId,
            isGroup: false,
            deletedAt: null,
            type: 'EXPENSE',
            name: { contains: 'Salary & Other Benefits', mode: 'insensitive' },
          },
          select: { id: true },
        })
      }

      if (!salaryAccount) {
        salaryAccount = await prisma.account.findFirst({
          where: {
            organizationId: auth.organizationId,
            isGroup: false,
            deletedAt: null,
            type: 'EXPENSE',
            name: { contains: 'Salary', mode: 'insensitive' },
          },
          orderBy: [{ code: 'asc' }],
          select: { id: true },
        })
      }

      if (!salaryAccount) {
        salaryAccount = await prisma.account.findFirst({
          where: {
            organizationId: auth.organizationId,
            isGroup: false,
            deletedAt: null,
            type: 'EXPENSE',
            code: '5100',
          },
          select: { id: true },
        })
      }

      const bankAccount = await prisma.account.findFirst({
        where: {
          organizationId: auth.organizationId,
          isGroup: false,
          deletedAt: null,
          type: 'ASSET',
          OR: [
            { code: '304000' },
            { code: '304001' },
            { code: '1101' },
            { name: { contains: 'Cash at Bank', mode: 'insensitive' } },
            { name: { contains: 'Bank', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ code: 'asc' }],
        select: { id: true },
      })

      const deductionAccount = totalWithheldDeductions > 0
        ? await prisma.account.findFirst({
            where: {
              organizationId: auth.organizationId,
              isGroup: false,
              deletedAt: null,
              type: 'LIABILITY',
              OR: [
                { code: '201003' },
                { name: { contains: 'Salary Deduction', mode: 'insensitive' } },
                { name: { contains: 'Deduction', mode: 'insensitive' } },
              ],
            },
            orderBy: [{ code: 'asc' }],
            select: { id: true },
          })
        : null

      if (!salaryAccount) return apiBadRequest('Salary expense account not found')
      if (!bankAccount) return apiBadRequest('Bank/cash account not found')
      if (totalWithheldDeductions > 0 && !deductionAccount) {
        return apiBadRequest('Salary deduction liability account not found')
      }

      if (salaryAccount && bankAccount) {
        const activeAllocationByEntry = new Map<string, typeof run.entries[number]['employee']['projectAllocations']>()
        const projectIds = new Set<string>()

        for (const entry of run.entries) {
          const activeAllocations = entry.employee.projectAllocations.filter((allocation) =>
            allocation.startDate <= periodEnd &&
            (!allocation.endDate || allocation.endDate >= periodStart)
          )

          activeAllocationByEntry.set(entry.id, activeAllocations)
          for (const allocation of activeAllocations) projectIds.add(allocation.projectId)
        }

        const budgets = projectIds.size > 0
          ? await prisma.budget.findMany({
              where: {
                projectId: { in: [...projectIds] },
                fiscalYearId: fiscalYear.id,
                status: { in: ['APPROVED', 'ACTIVE'] },
                deletedAt: null,
              },
              include: { lines: true },
              orderBy: [{ status: 'desc' }, { updatedAt: 'desc' }],
            })
          : []

        const budgetByProject = new Map<
          string,
          {
            budgetId: string
            budgetLineId: string | null
            businessUnitId: string | null
            costCenterId: string | null
            fundClassId: string | null
          }
        >()

        for (const budget of budgets) {
          if (!budget.projectId || budgetByProject.has(budget.projectId)) continue

          const personnelLine =
            budget.lines.find((line) => line.category.toLowerCase() === 'personnel') ?? null

          budgetByProject.set(budget.projectId, {
            budgetId: budget.id,
            budgetLineId: personnelLine?.id ?? null,
            businessUnitId: personnelLine?.businessUnitId ?? budget.businessUnitId ?? null,
            costCenterId: personnelLine?.costCenterId ?? budget.costCenterId ?? null,
            fundClassId: personnelLine?.fundClassId ?? budget.fundClassId ?? null,
          })
        }

        const salaryDebitMap = new Map<
          string,
          {
            amount: number
            projectId: string | null
            budgetLineId: string | null
            businessUnitId: string | null
            costCenterId: string | null
            fundClassId: string | null
          }
        >()

        const budgetAllocationRows: Prisma.PayrollBudgetAllocationCreateManyInput[] = []

        function addSalaryDebitLine(input: {
          amount: number
          projectId?: string | null
          budgetLineId?: string | null
          businessUnitId?: string | null
          costCenterId?: string | null
          fundClassId?: string | null
        }) {
          if (input.amount <= 0) return

          const key = [
            input.projectId ?? '',
            input.budgetLineId ?? '',
            input.businessUnitId ?? '',
            input.costCenterId ?? '',
            input.fundClassId ?? '',
          ].join('|')

          const existing = salaryDebitMap.get(key)
          if (existing) {
            existing.amount = r2(existing.amount + input.amount)
            return
          }

          salaryDebitMap.set(key, {
            amount: r2(input.amount),
            projectId: input.projectId ?? null,
            budgetLineId: input.budgetLineId ?? null,
            businessUnitId: input.businessUnitId ?? null,
            costCenterId: input.costCenterId ?? null,
            fundClassId: input.fundClassId ?? null,
          })
        }

        for (const entry of run.entries) {
          const activeAllocations = activeAllocationByEntry.get(entry.id) ?? []
          let remainingPct = 100
          let allocatedGross = 0

          for (const allocation of activeAllocations) {
            if (remainingPct <= 0) break

            const allocationPct = Math.min(Number(allocation.percentage), remainingPct)
            if (allocationPct <= 0) continue

            const grossAmount = r2(Number(entry.grossSalary) * allocationPct / 100)
            const netAmount = r2(Number(entry.netSalary) * allocationPct / 100)
            const budgetInfo = budgetByProject.get(allocation.projectId)

            budgetAllocationRows.push({
              organizationId: auth.organizationId,
              payrollRunId: run.id,
              payrollEntryId: entry.id,
              employeeId: entry.employeeId,
              projectId: allocation.projectId,
              budgetId: budgetInfo?.budgetId ?? null,
              budgetLineId: budgetInfo?.budgetLineId ?? null,
              allocationPct: new Prisma.Decimal(allocationPct),
              grossAmount: new Prisma.Decimal(grossAmount),
              netAmount: new Prisma.Decimal(netAmount),
              fringeAmount: new Prisma.Decimal(0),
              totalCharge: new Prisma.Decimal(grossAmount),
              period,
            })

            addSalaryDebitLine({
              amount: grossAmount,
              projectId: allocation.projectId,
              budgetLineId: budgetInfo?.budgetLineId ?? null,
              businessUnitId: budgetInfo?.businessUnitId ?? entry.employee.primaryBusinessUnitId,
              costCenterId: budgetInfo?.costCenterId ?? null,
              fundClassId: budgetInfo?.fundClassId ?? null,
            })

            allocatedGross = r2(allocatedGross + grossAmount)
            remainingPct = r2(remainingPct - allocationPct)
          }

          const unallocatedGross = r2(Number(entry.grossSalary) - allocatedGross)
          if (unallocatedGross > 0) {
            addSalaryDebitLine({
              amount: unallocatedGross,
              businessUnitId: entry.employee.primaryBusinessUnitId,
            })
          }
        }

        const salaryDebitLines = Array.from(salaryDebitMap.values())
        const debitTotal = r2(salaryDebitLines.reduce((sum, line) => sum + line.amount, 0))
        const entryNo = await generateNextNumber(auth.organizationId, 'journal_entry')
        const now = new Date()

        const je = await prisma.$transaction(async (tx) => {
          if (budgetAllocationRows.length > 0) {
            await tx.payrollBudgetAllocation.createMany({
              data: budgetAllocationRows,
              skipDuplicates: true,
            })
          }

          return tx.journalEntry.create({
            data: {
              entryNo,
              date: now,
              description: `Payroll ${run.runNo} - ${run.month}/${run.year} (${run.entries.length} employees)`,
              fiscalYearId: fiscalYear.id,
              totalDebit: new Prisma.Decimal(debitTotal),
              totalCredit: new Prisma.Decimal(debitTotal),
              status: 'APPROVED',
              isAutoGenerated: true,
              sourceModule: 'payroll',
              sourceId: run.id,
              createdById: auth.userId,
              approvedById: auth.userId,
              approvedAt: now,
              postedAt: now,
              lines: {
                create: [
                  ...salaryDebitLines.map((line) => ({
                    accountId: salaryAccount.id,
                    description: `Salary expense - ${period}`,
                    debit: new Prisma.Decimal(line.amount),
                    credit: new Prisma.Decimal(0),
                    projectId: line.projectId,
                    budgetLineId: line.budgetLineId,
                    businessUnitId: line.businessUnitId,
                    costCenterId: line.costCenterId,
                    fundClassId: line.fundClassId,
                  })),
                  {
                    accountId: bankAccount.id,
                    description: `Salary payment - ${period}`,
                    debit: new Prisma.Decimal(0),
                    credit: new Prisma.Decimal(totalNet),
                  },
                  ...(deductionAccount && totalWithheldDeductions > 0
                    ? [{
                        accountId: deductionAccount.id,
                        description: `Payroll deductions payable - ${period}`,
                        debit: new Prisma.Decimal(0),
                        credit: new Prisma.Decimal(totalWithheldDeductions),
                      }]
                    : []),
                ],
              },
            },
          })
        })

        journalEntryId = je.id
      }
    }

    const updated = await prisma.payrollRun.update({
      where: { id },
      data: {
        organizationId: auth.organizationId,
        status: 'APPROVED',
        approvedById: auth.userId,
        approvedAt: new Date(),
        ...(journalEntryId && { journalEntryId }),
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'payroll_run',
      resourceId: id,
      description: `Approved payroll run ${run.runNo}${journalEntryId ? ' with auto-created journal entry' : ''}`,
      oldValues: { status: 'PROCESSED' },
      newValues: { status: 'APPROVED', journalEntryId, totalNet },
      ...auditCtx,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
