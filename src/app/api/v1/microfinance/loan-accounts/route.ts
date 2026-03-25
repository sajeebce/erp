import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiPaginated,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    // Get org member IDs for tenant isolation
    const orgMembers = await prisma.mFIMember.findMany({
      where: { samity: { branch: { organizationId: auth.organizationId } } },
      select: { id: true },
    })
    const orgMemberIds = orgMembers.map((m) => m.id)

    const where: Record<string, unknown> = {
      memberId: { in: orgMemberIds },
    }

    const memberId = url.searchParams.get('memberId')
    if (memberId) {
      where.memberId = orgMemberIds.includes(memberId) ? memberId : '__none__'
    }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const classification = url.searchParams.get('classification')
    if (classification) where.classification = classification

    if (search) {
      where.accountNo = { contains: search, mode: 'insensitive' }
    }

    const [accounts, total] = await Promise.all([
      prisma.loanAccount.findMany({
        where,
        select: {
          id: true,
          accountNo: true,
          memberId: true,
          productId: true,
          principalAmount: true,
          interestRate: true,
          interestMethod: true,
          durationMonths: true,
          installmentAmount: true,
          totalRepayable: true,
          totalPaid: true,
          outstandingBalance: true,
          overdueAmount: true,
          daysOverdue: true,
          classification: true,
          disbursedAt: true,
          maturityDate: true,
          lastPaymentDate: true,
          status: true,
          createdAt: true,
          member: {
            select: {
              id: true,
              memberNo: true,
              beneficiary: { select: { name: true } },
            },
          },
          product: { select: { id: true, productCode: true, name: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.loanAccount.count({ where }),
    ])

    return apiPaginated(accounts, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
