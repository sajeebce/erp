import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated, apiBadRequest, handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { employeeId, offboardingId } = body

    if (!employeeId) {
      return apiBadRequest('employeeId is required')
    }

    const enrollment = await prisma.pFEnrollment.findFirst({
      where: { organizationId: auth.organizationId, employeeId },
      include: {
        employee: { select: { id: true, fullName: true, joiningDate: true } },
      },
    })
    if (!enrollment) {
      return apiBadRequest('No PF enrollment found for this employee')
    }

    // Get policy for vesting schedule
    const policy = await prisma.pFPolicy.findFirst({
      where: { id: enrollment.policyId },
    })

    // Calculate service months
    const now = new Date()
    const serviceMs = now.getTime() - new Date(enrollment.effectiveDate).getTime()
    const serviceMonths = Math.floor(serviceMs / (30.44 * 24 * 60 * 60 * 1000))

    // Determine vested percentage from schedule
    let vestedPercent = 0
    if (policy?.vestingSchedule) {
      const schedule = policy.vestingSchedule as Array<{ months: number; percentage: number }>
      for (const tier of schedule.sort((a, b) => b.months - a.months)) {
        if (serviceMonths >= tier.months) {
          vestedPercent = tier.percentage
          break
        }
      }
    } else {
      vestedPercent = 100
    }

    const employeeContrib = enrollment.totalEmployeeContrib
    const employerContrib = enrollment.totalEmployerContrib
    const interestEarned = enrollment.totalInterest
    const vestedEmployer = new Prisma.Decimal(employerContrib.toString())
      .mul(vestedPercent)
      .div(100)
    const forfeited = employerContrib.sub(vestedEmployer)

    // Outstanding loans
    const activeLoans = await prisma.pFLoan.findMany({
      where: { enrollmentId: enrollment.id, status: 'ACTIVE' },
    })
    const loanDeduction = activeLoans.reduce(
      (sum, l) => sum.add(l.outstandingBalance),
      new Prisma.Decimal(0),
    )

    const netPayable = employeeContrib
      .add(vestedEmployer)
      .add(interestEarned)
      .sub(enrollment.totalWithdrawals)
      .sub(loanDeduction)

    const settlementNo = await generateNextNumber(auth.organizationId, 'pf_settlement')

    const settlement = await prisma.pFSettlement.create({
      data: {
        organizationId: auth.organizationId,
        settlementNo,
        enrollmentId: enrollment.id,
        employeeId,
        employeeContrib,
        employerContrib,
        interestEarned,
        vestedPercent,
        vestedEmployer,
        forfeited,
        loanDeduction,
        netPayable: netPayable.lt(0) ? new Prisma.Decimal(0) : netPayable,
        offboardingId: offboardingId || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'hr',
      resource: 'pf_settlement',
      resourceId: settlement.id,
      description: `Calculated PF settlement ${settlementNo} for employee ${enrollment.employee.fullName}`,
      newValues: { settlementNo, netPayable: netPayable.toString(), vestedPercent },
      ...auditCtx,
    })

    return apiCreated(settlement)
  } catch (error) {
    return handleRouteError(error)
  }
}
