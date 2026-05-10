import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { logAudit, getAuditContext } from '@/lib/audit'
import { queueEmail } from '@/lib/email-queue'
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

const SEPARATION_TO_STATUS: Record<string, string> = {
  RESIGNATION: 'RESIGNED',
  TERMINATION: 'TERMINATED',
  END_OF_CONTRACT: 'RESIGNED',
  RETIREMENT: 'RETIRED',
  REDUNDANCY: 'TERMINATED',
  MUTUAL_SEPARATION: 'RESIGNED',
  DEATH_IN_SERVICE: 'TERMINATED',
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

async function closeEmployeeActiveAssignments(input: {
  employeeId: string
  lastWorkingDay: Date
  separationType: string
}) {
  await prisma.$transaction([
    prisma.employeeProjectAllocation.updateMany({
      where: {
        employeeId: input.employeeId,
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gt: input.lastWorkingDay } },
        ],
      },
      data: {
        endDate: input.lastWorkingDay,
        isActive: false,
      },
    }),
    prisma.employeeProjectAllocation.updateMany({
      where: {
        employeeId: input.employeeId,
        isActive: true,
        endDate: { lte: input.lastWorkingDay },
      },
      data: {
        isActive: false,
      },
    }),
    prisma.employeeContract.updateMany({
      where: {
        employeeId: input.employeeId,
        status: 'ACTIVE',
      },
      data: {
        status: 'TERMINATED',
        terminatedAt: input.lastWorkingDay,
        terminationReason: `Offboarding ${input.separationType}`,
      },
    }),
  ])
}

async function createFinalSettlementJournal(input: {
  organizationId: string
  userId: string
  offboardingId: string
}): Promise<string | null> {
  const existingJournal = await prisma.journalEntry.findUnique({
    where: {
      sourceModule_sourceId: {
        sourceModule: 'offboarding',
        sourceId: input.offboardingId,
      },
    },
    select: { id: true },
  })
  if (existingJournal) return existingJournal.id

  const offboarding = await prisma.offboarding.findFirst({
    where: { id: input.offboardingId, organizationId: input.organizationId },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          employeeNo: true,
          primaryBusinessUnitId: true,
          projectAllocations: {
            where: { isActive: true },
            orderBy: { startDate: 'asc' },
          },
        },
      },
    },
  })
  if (!offboarding) return null

  const expenseAmount = r2(
    Number(offboarding.leaveEncashment ?? 0) +
    Number(offboarding.gratuity ?? 0) +
    Number(offboarding.otherPayments ?? 0)
  )
  const netPayable = r2(Number(offboarding.finalSettlement ?? 0))
  const withheldDeductions = r2(expenseAmount - Math.max(0, netPayable))

  if (expenseAmount <= 0) return null

  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: { organizationId: input.organizationId, isCurrent: true },
    select: { id: true },
  })
  if (!fiscalYear) return null

  let salaryAccount = await prisma.account.findFirst({
    where: {
      organizationId: input.organizationId,
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
        organizationId: input.organizationId,
        isGroup: false,
        deletedAt: null,
        type: 'EXPENSE',
        name: { contains: 'Salary & Other Benefits', mode: 'insensitive' },
      },
      select: { id: true },
    })
  }

  const bankAccount = await prisma.account.findFirst({
    where: {
      organizationId: input.organizationId,
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

  const deductionAccount = withheldDeductions > 0
    ? await prisma.account.findFirst({
        where: {
          organizationId: input.organizationId,
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

  if (!salaryAccount) throw new Error('Salary expense account not found')
  if (!bankAccount) throw new Error('Bank/cash account not found')
  if (withheldDeductions > 0 && !deductionAccount) {
    throw new Error('Salary deduction liability account not found')
  }

  const activeAllocation = offboarding.employee.projectAllocations.find((allocation) =>
    allocation.startDate <= offboarding.lastWorkingDay &&
    (!allocation.endDate || allocation.endDate >= offboarding.lastWorkingDay)
  )

  let budgetLineId: string | null = null
  let businessUnitId = offboarding.employee.primaryBusinessUnitId
  let costCenterId: string | null = null
  let fundClassId: string | null = null

  if (activeAllocation) {
    const budget = await prisma.budget.findFirst({
      where: {
        projectId: activeAllocation.projectId,
        fiscalYearId: fiscalYear.id,
        status: { in: ['APPROVED', 'ACTIVE'] },
        deletedAt: null,
      },
      include: { lines: true },
      orderBy: [{ status: 'desc' }, { updatedAt: 'desc' }],
    })

    const personnelLine = budget?.lines.find((line) => line.category.toLowerCase() === 'personnel')
    budgetLineId = personnelLine?.id ?? null
    businessUnitId = personnelLine?.businessUnitId ?? budget?.businessUnitId ?? businessUnitId
    costCenterId = personnelLine?.costCenterId ?? budget?.costCenterId ?? null
    fundClassId = personnelLine?.fundClassId ?? budget?.fundClassId ?? null
  }

  const entryNo = await generateNextNumber(input.organizationId, 'journal_entry')
  const now = new Date()

  const journal = await prisma.journalEntry.create({
    data: {
      entryNo,
      date: now,
      description: `Final settlement ${offboarding.offboardingNo} - ${offboarding.employee.fullName}`,
      reference: offboarding.offboardingNo,
      fiscalYearId: fiscalYear.id,
      projectId: activeAllocation?.projectId ?? null,
      businessUnitId,
      totalDebit: new Prisma.Decimal(expenseAmount),
      totalCredit: new Prisma.Decimal(expenseAmount),
      status: 'APPROVED',
      isAutoGenerated: true,
      sourceModule: 'offboarding',
      sourceId: offboarding.id,
      createdById: input.userId,
      approvedById: input.userId,
      approvedAt: now,
      postedAt: now,
      lines: {
        create: [
          {
            accountId: salaryAccount.id,
            description: `Final settlement expense - ${offboarding.offboardingNo}`,
            debit: new Prisma.Decimal(expenseAmount),
            credit: new Prisma.Decimal(0),
            projectId: activeAllocation?.projectId ?? null,
            budgetLineId,
            businessUnitId,
            costCenterId,
            fundClassId,
          },
          {
            accountId: bankAccount.id,
            description: `Final settlement payment - ${offboarding.offboardingNo}`,
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(Math.max(0, netPayable)),
          },
          ...(deductionAccount && withheldDeductions > 0
            ? [{
                accountId: deductionAccount.id,
                description: `Final settlement deductions payable - ${offboarding.offboardingNo}`,
                debit: new Prisma.Decimal(0),
                credit: new Prisma.Decimal(withheldDeductions),
              }]
            : []),
        ],
      },
    },
    select: { id: true },
  })

  return journal.id
}

async function createPFSettlementForOffboarding(input: {
  organizationId: string
  userId: string
  offboardingId: string
  employeeId: string
}): Promise<string | null> {
  const existing = await prisma.pFSettlement.findFirst({
    where: {
      organizationId: input.organizationId,
      offboardingId: input.offboardingId,
    },
    select: { id: true },
  })
  if (existing) return existing.id

  const enrollment = await prisma.pFEnrollment.findFirst({
    where: {
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      status: 'ACTIVE',
    },
    include: {
      employee: { select: { fullName: true } },
      policy: true,
    },
  })
  if (!enrollment || enrollment.currentBalance.lte(0)) return null

  const offboarding = await prisma.offboarding.findFirst({
    where: { id: input.offboardingId, organizationId: input.organizationId },
    select: { lastWorkingDay: true },
  })
  if (!offboarding) return null

  const serviceMs = offboarding.lastWorkingDay.getTime() - new Date(enrollment.effectiveDate).getTime()
  const serviceMonths = Math.max(0, Math.floor(serviceMs / (30.44 * 24 * 60 * 60 * 1000)))

  let vestedPercent = 100
  if (enrollment.policy.vestingSchedule) {
    const schedule = enrollment.policy.vestingSchedule as Array<{ months: number; percentage: number }>
    vestedPercent = 0
    for (const tier of schedule.sort((a, b) => b.months - a.months)) {
      if (serviceMonths >= tier.months) {
        vestedPercent = tier.percentage
        break
      }
    }
  }

  const employeeContrib = enrollment.totalEmployeeContrib
  const employerContrib = enrollment.totalEmployerContrib
  const interestEarned = enrollment.totalInterest
  const vestedEmployer = new Prisma.Decimal(employerContrib.toString()).mul(vestedPercent).div(100)
  const forfeited = employerContrib.sub(vestedEmployer)

  const activeLoans = await prisma.pFLoan.findMany({
    where: { enrollmentId: enrollment.id, status: 'ACTIVE' },
  })
  const loanDeduction = activeLoans.reduce(
    (sum, loan) => sum.add(loan.outstandingBalance),
    new Prisma.Decimal(0)
  )

  const netPayable = employeeContrib
    .add(vestedEmployer)
    .add(interestEarned)
    .sub(enrollment.totalWithdrawals)
    .sub(loanDeduction)

  const settlementNo = await generateNextNumber(input.organizationId, 'pf_settlement')

  const settlement = await prisma.pFSettlement.create({
    data: {
      organizationId: input.organizationId,
      settlementNo,
      enrollmentId: enrollment.id,
      employeeId: input.employeeId,
      employeeContrib,
      employerContrib,
      interestEarned,
      vestedPercent,
      vestedEmployer,
      forfeited,
      loanDeduction,
      netPayable: netPayable.lt(0) ? new Prisma.Decimal(0) : netPayable,
      offboardingId: input.offboardingId,
    },
    select: { id: true },
  })

  return settlement.id
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const offboarding = await prisma.offboarding.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        tasks: true,
        employee: { select: { id: true, fullName: true, employeeNo: true, email: true, status: true } },
      },
    })
    if (!offboarding) {
      return apiNotFound('Offboarding not found')
    }

    if (offboarding.status === 'COMPLETED') {
      await closeEmployeeActiveAssignments({
        employeeId: offboarding.employeeId,
        lastWorkingDay: offboarding.lastWorkingDay,
        separationType: offboarding.separationType,
      })
      const journalEntryId = await createFinalSettlementJournal({
        organizationId: auth.organizationId,
        userId: auth.userId,
        offboardingId: id,
      })
      const pfSettlementId = await createPFSettlementForOffboarding({
        organizationId: auth.organizationId,
        userId: auth.userId,
        offboardingId: id,
        employeeId: offboarding.employeeId,
      })

      return apiSuccess({ ...offboarding, journalEntryId, pfSettlementId })
    }

    // Validate all tasks are completed
    const incompleteTasks = offboarding.tasks.filter((t) => !t.isCompleted)
    if (incompleteTasks.length > 0) {
      const taskNames = incompleteTasks.map((t) => t.taskName).join(', ')
      return apiBadRequest(`Cannot complete offboarding. Incomplete tasks: ${taskNames}`)
    }

    // Determine employee status based on separation type
    const newEmployeeStatus = SEPARATION_TO_STATUS[offboarding.separationType] || 'RESIGNED'

    const [updated] = await prisma.$transaction([
      prisma.offboarding.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      }),
      prisma.employee.update({
        where: { id: offboarding.employeeId },
        data: { status: newEmployeeStatus as 'RESIGNED' | 'TERMINATED' | 'RETIRED' },
      }),
      prisma.employeeProjectAllocation.updateMany({
        where: {
          employeeId: offboarding.employeeId,
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gt: offboarding.lastWorkingDay } },
          ],
        },
        data: {
          endDate: offboarding.lastWorkingDay,
          isActive: false,
        },
      }),
      prisma.employeeProjectAllocation.updateMany({
        where: {
          employeeId: offboarding.employeeId,
          isActive: true,
          endDate: { lte: offboarding.lastWorkingDay },
        },
        data: {
          isActive: false,
        },
      }),
      prisma.employeeContract.updateMany({
        where: {
          employeeId: offboarding.employeeId,
          status: 'ACTIVE',
        },
        data: {
          status: 'TERMINATED',
          terminatedAt: offboarding.lastWorkingDay,
          terminationReason: `Offboarding ${offboarding.separationType}`,
        },
      }),
    ])

    const journalEntryId = await createFinalSettlementJournal({
      organizationId: auth.organizationId,
      userId: auth.userId,
      offboardingId: id,
    })
    const pfSettlementId = await createPFSettlementForOffboarding({
      organizationId: auth.organizationId,
      userId: auth.userId,
      offboardingId: id,
      employeeId: offboarding.employeeId,
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'offboarding',
      resourceId: id,
      description: `Completed offboarding "${offboarding.offboardingNo}" for employee "${offboarding.employee.fullName}"`,
      oldValues: { status: offboarding.status, employeeStatus: offboarding.employee.status },
      newValues: { status: 'COMPLETED', employeeStatus: newEmployeeStatus, journalEntryId, pfSettlementId },
      ...auditCtx,
    })

    await queueEmail({
      organizationId: auth.organizationId,
      recipientEmail: offboarding.employee.email,
      eventKey: `offboarding:${offboarding.id}:completed`,
      templateKey: 'OFFBOARDING_COMPLETED',
      fallbackSubject: 'Offboarding completed',
      fallbackBody: 'Dear {{employeeName}}, your offboarding process has been completed.',
      variables: {
        employeeName: offboarding.employee.fullName,
        employeeNo: offboarding.employee.employeeNo,
        offboardingNo: offboarding.offboardingNo,
      },
      relatedModule: 'offboarding',
      relatedEntityId: offboarding.id,
    })

    return apiSuccess({ ...updated, journalEntryId, pfSettlementId })
  } catch (error) {
    return handleRouteError(error)
  }
}
