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

function r2(value: number): number {
  return Math.round(value * 100) / 100
}

function daysBetweenInclusive(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.max(0, Math.floor((endUtc - startUtc) / 86400000) + 1)
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const offboarding = await prisma.offboarding.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            basicSalary: true,
            grossSalary: true,
            houseRentAllowance: true,
            medicalAllowance: true,
            transportAllowance: true,
            joiningDate: true,
            pfEnrollment: {
              select: {
                status: true,
                effectiveDate: true,
                employeeRate: true,
              },
            },
            leaveBalances: {
              select: { remaining: true },
            },
          },
        },
      },
    })
    if (!offboarding) {
      return apiNotFound('Offboarding not found')
    }

    const basicSalary = offboarding.employee.basicSalary
      ? Number(offboarding.employee.basicSalary)
      : 0

    // Calculate unused leave days from all leave balances
    const unusedLeaveDays = offboarding.employee.leaveBalances.reduce(
      (sum, lb) => sum + lb.remaining,
      0
    )

    // Calculate leave encashment: unusedLeaveDays * (basicSalary / 30)
    const dailyRate = basicSalary / 30
    const leaveEncashment = r2(unusedLeaveDays * dailyRate)

    const lastWorkingDay = offboarding.lastWorkingDay
    const payYear = lastWorkingDay.getFullYear()
    const payMonth = lastWorkingDay.getMonth() + 1
    const periodStart = new Date(payYear, payMonth - 1, 1)
    const periodEnd = new Date(payYear, payMonth, 0)
    const daysInMonth = periodEnd.getDate()

    const existingFinalMonthPayroll = await prisma.payrollEntry.findFirst({
      where: {
        employeeId: offboarding.employeeId,
        payrollRun: {
          month: payMonth,
          year: payYear,
          status: { in: ['PROCESSED', 'APPROVED'] },
        },
      },
      select: { id: true },
    })

    const grossSalary = Number(offboarding.employee.grossSalary ?? 0) > 0
      ? Number(offboarding.employee.grossSalary)
      : r2(
          basicSalary +
          Number(offboarding.employee.houseRentAllowance ?? 0) +
          Number(offboarding.employee.medicalAllowance ?? 0) +
          Number(offboarding.employee.transportAllowance ?? 0)
        )

    const workedFrom = offboarding.employee.joiningDate > periodStart
      ? offboarding.employee.joiningDate
      : periodStart
    const workedUntil = lastWorkingDay < periodEnd ? lastWorkingDay : periodEnd
    const payableDays = daysBetweenInclusive(workedFrom, workedUntil)

    const finalMonthGrossPay = existingFinalMonthPayroll
      ? 0
      : r2(grossSalary * payableDays / daysInMonth)
    const finalMonthBasicPay = existingFinalMonthPayroll
      ? 0
      : r2(basicSalary * payableDays / daysInMonth)

    const hasActivePFEnrollment =
      offboarding.employee.pfEnrollment?.status === 'ACTIVE' &&
      offboarding.employee.pfEnrollment.effectiveDate <= lastWorkingDay
    const pfRate = Number(offboarding.employee.pfEnrollment?.employeeRate ?? 10)
    const pfDeduction = hasActivePFEnrollment ? r2(finalMonthBasicPay * pfRate / 100) : 0
    const tdsDeduction = finalMonthBasicPay > 0 ? r2(finalMonthBasicPay * 0.05) : 0

    const gratuity = body.gratuity ? Number(body.gratuity) : 0
    const otherPayments = r2((body.otherPayments ? Number(body.otherPayments) : 0) + finalMonthGrossPay)
    const deductions = r2((body.deductions ? Number(body.deductions) : 0) + pfDeduction + tdsDeduction)

    const finalSettlement = r2(leaveEncashment + gratuity + otherPayments - deductions)

    const updated = await prisma.offboarding.update({
      where: { id },
      data: {
        unusedLeaveDays: new Prisma.Decimal(unusedLeaveDays),
        leaveEncashment: new Prisma.Decimal(leaveEncashment),
        gratuity: new Prisma.Decimal(gratuity),
        otherPayments: new Prisma.Decimal(otherPayments),
        deductions: new Prisma.Decimal(deductions),
        finalSettlement: new Prisma.Decimal(finalSettlement),
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'offboarding',
      resourceId: id,
      description: `Calculated final settlement for offboarding "${offboarding.offboardingNo}"`,
      newValues: { unusedLeaveDays, leaveEncashment, gratuity, otherPayments, deductions, finalSettlement },
      ...auditCtx,
    })

    return apiSuccess({
      ...updated,
      netSettlement: finalSettlement,
      settlement: {
        leaveEncashment,
        gratuity,
        otherPayments,
        deductions,
        netSettlement: finalSettlement,
      },
      breakdown: {
        basicSalary,
        grossSalary,
        period: `${payYear}-${String(payMonth).padStart(2, '0')}`,
        payableDays,
        finalMonthGrossPay,
        finalMonthBasicPay,
        finalMonthAlreadyInPayroll: Boolean(existingFinalMonthPayroll),
        pfDeduction,
        tdsDeduction,
        unusedLeaveDays,
        dailyRate,
        leaveEncashment,
        gratuity,
        otherPayments,
        deductions,
        finalSettlement,
        netSettlement: finalSettlement,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
