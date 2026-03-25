import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    // Tenant isolation via member → samity → branch → org
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

    const type = url.searchParams.get('type')
    if (type) where.type = type

    if (search) {
      where.accountNo = { contains: search, mode: 'insensitive' }
    }

    const [accounts, total] = await Promise.all([
      prisma.savingsAccount.findMany({
        where,
        select: {
          id: true,
          accountNo: true,
          memberId: true,
          type: true,
          balance: true,
          totalDeposited: true,
          totalWithdrawn: true,
          interestEarned: true,
          interestRate: true,
          monthlyDeposit: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          member: {
            select: {
              memberNo: true,
              beneficiary: { select: { name: true } },
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.savingsAccount.count({ where }),
    ])

    return apiPaginated(accounts, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()
    const { memberId, type, interestRate, monthlyDeposit } = body

    if (!memberId || !type) {
      return apiBadRequest('memberId and type are required')
    }

    const validTypes = ['COMPULSORY', 'VOLUNTARY', 'FIXED_DEPOSIT', 'DPS']
    if (!validTypes.includes(type)) {
      return apiBadRequest(`type must be one of: ${validTypes.join(', ')}`)
    }

    // Validate member belongs to org
    const member = await prisma.mFIMember.findFirst({
      where: {
        id: memberId,
        samity: { branch: { organizationId: auth.organizationId } },
      },
      select: { id: true },
    })

    if (!member) {
      return apiBadRequest('Member not found or does not belong to your organization')
    }

    const accountNo = await generateNextNumber(auth.organizationId, 'mfi_savings_account')

    const account = await prisma.savingsAccount.create({
      data: {
        accountNo,
        memberId,
        type,
        interestRate: interestRate ?? 0,
        monthlyDeposit: monthlyDeposit ?? 0,
      },
      select: {
        id: true,
        accountNo: true,
        memberId: true,
        type: true,
        balance: true,
        totalDeposited: true,
        totalWithdrawn: true,
        interestRate: true,
        monthlyDeposit: true,
        isActive: true,
        createdAt: true,
      },
    })

    return apiCreated(account)
  } catch (error) {
    return handleRouteError(error)
  }
}
