import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess, apiNotFound, handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ employeeId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { employeeId } = await params

    const enrollment = await prisma.pFEnrollment.findFirst({
      where: { organizationId: auth.organizationId, employeeId },
      include: {
        employee: {
          select: {
            id: true,
            employeeNo: true,
            fullName: true,
            joiningDate: true,
            basicSalary: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
          },
        },
        nominees: true,
      },
    })

    if (!enrollment) {
      return apiNotFound('No PF enrollment found for this employee')
    }

    // Get contributions
    const contributions = await prisma.pFContribution.findMany({
      where: { enrollmentId: enrollment.id },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    })

    // Get interest postings
    const interestPostings = await prisma.pFInterestPosting.findMany({
      where: { enrollmentId: enrollment.id },
      orderBy: { periodEnd: 'asc' },
    })

    // Get withdrawals
    const withdrawals = await prisma.pFWithdrawal.findMany({
      where: { enrollmentId: enrollment.id },
      orderBy: { createdAt: 'asc' },
    })

    // Get loans
    const loans = await prisma.pFLoan.findMany({
      where: { enrollmentId: enrollment.id },
      include: { repayments: { orderBy: { installmentNo: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })

    return apiSuccess({
      employee: enrollment.employee,
      enrollment: {
        id: enrollment.id,
        enrollmentDate: enrollment.enrollmentDate,
        effectiveDate: enrollment.effectiveDate,
        employeeRate: enrollment.employeeRate.toString(),
        employerRate: enrollment.employerRate.toString(),
        status: enrollment.status,
      },
      balances: {
        totalEmployeeContrib: enrollment.totalEmployeeContrib.toString(),
        totalEmployerContrib: enrollment.totalEmployerContrib.toString(),
        totalInterest: enrollment.totalInterest.toString(),
        totalWithdrawals: enrollment.totalWithdrawals.toString(),
        totalLoanOutstanding: enrollment.totalLoanOutstanding.toString(),
        currentBalance: enrollment.currentBalance.toString(),
      },
      nominees: enrollment.nominees,
      contributions,
      interestPostings,
      withdrawals,
      loans,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
