import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const samity = await prisma.samity.findFirst({
      where: { id, branch: { organizationId: auth.organizationId } },
      select: {
        id: true,
        samityNo: true,
        name: true,
        branchId: true,
        formationDate: true,
        meetingDay: true,
        meetingTime: true,
        fieldOfficerId: true,
        totalMembers: true,
        status: true,
        location: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        branch: { select: { id: true, code: true, name: true } },
        members: {
          select: {
            id: true,
            memberNo: true,
            beneficiaryId: true,
            status: true,
            admissionDate: true,
            beneficiary: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { memberNo: 'asc' },
        },
      },
    })

    if (!samity) {
      return apiNotFound('Samity not found')
    }

    // Portfolio summary: active loans and total savings for members in this samity
    const memberIds = samity.members.map((m) => m.id)

    const [loanAgg, savingsAgg] = await Promise.all([
      prisma.loanAccount.aggregate({
        where: { memberId: { in: memberIds }, status: 'ACTIVE' },
        _count: true,
        _sum: { outstandingBalance: true },
      }),
      prisma.savingsAccount.aggregate({
        where: { memberId: { in: memberIds }, isActive: true },
        _sum: { balance: true },
      }),
    ])

    return apiSuccess({
      ...samity,
      portfolioSummary: {
        activeLoans: loanAgg._count,
        totalOutstanding: loanAgg._sum.outstandingBalance || 0,
        totalSavings: savingsAgg._sum.balance || 0,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.samity.findFirst({
      where: { id, branch: { organizationId: auth.organizationId } },
    })

    if (!existing) {
      return apiNotFound('Samity not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    const allowedFields = ['name', 'meetingDay', 'meetingTime', 'fieldOfficerId', 'status', 'location', 'notes'] as const
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.samity.update({
      where: { id },
      data,
      select: {
        id: true,
        samityNo: true,
        name: true,
        branchId: true,
        formationDate: true,
        meetingDay: true,
        meetingTime: true,
        fieldOfficerId: true,
        totalMembers: true,
        status: true,
        location: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
