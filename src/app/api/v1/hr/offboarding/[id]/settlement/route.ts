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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const body = await request.json()

    const offboarding = await prisma.offboarding.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            basicSalary: true,
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
    const leaveEncashment = unusedLeaveDays * dailyRate

    const gratuity = body.gratuity ? Number(body.gratuity) : 0
    const otherPayments = body.otherPayments ? Number(body.otherPayments) : 0
    const deductions = body.deductions ? Number(body.deductions) : 0

    const finalSettlement = leaveEncashment + gratuity + otherPayments - deductions

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
      breakdown: {
        basicSalary,
        unusedLeaveDays,
        dailyRate,
        leaveEncashment,
        gratuity,
        otherPayments,
        deductions,
        finalSettlement,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
