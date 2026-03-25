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
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    // Get org member IDs for tenant isolation
    const orgMembers = await prisma.mFIMember.findMany({
      where: { samity: { branch: { organizationId: auth.organizationId } } },
      select: { id: true },
    })
    const orgMemberIds = orgMembers.map((m) => m.id)

    const where: Record<string, unknown> = {
      memberId: { in: orgMemberIds },
      status: 'ACTIVE',
      OR: [
        { daysOverdue: { gt: 0 } },
        { classification: { not: 'REGULAR' } },
      ],
    }

    const classification = url.searchParams.get('classification')
    if (classification) {
      where.classification = classification
      delete where.OR
    }

    const branchId = url.searchParams.get('branchId')
    if (branchId) {
      // Re-filter members by branch
      const branchMembers = await prisma.mFIMember.findMany({
        where: { samity: { branchId, branch: { organizationId: auth.organizationId } } },
        select: { id: true },
      })
      where.memberId = { in: branchMembers.map((m) => m.id) }
    }

    const [overdueLoans, total] = await Promise.all([
      prisma.loanAccount.findMany({
        where,
        select: {
          id: true,
          accountNo: true,
          principalAmount: true,
          outstandingBalance: true,
          overdueAmount: true,
          daysOverdue: true,
          classification: true,
          disbursedAt: true,
          maturityDate: true,
          lastPaymentDate: true,
          member: {
            select: {
              memberNo: true,
              beneficiary: { select: { name: true, phone: true } },
              samity: {
                select: {
                  samityNo: true,
                  name: true,
                  branch: { select: { code: true, name: true } },
                },
              },
            },
          },
          product: { select: { productCode: true, name: true } },
        },
        orderBy: { [sort === 'createdAt' ? 'daysOverdue' : sort]: sort === 'createdAt' ? 'desc' : order },
        skip,
        take: limit,
      }),
      prisma.loanAccount.count({ where }),
    ])

    return apiPaginated(overdueLoans, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}
