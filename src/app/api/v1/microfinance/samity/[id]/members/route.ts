import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    // Verify samity belongs to org
    const samity = await prisma.samity.findFirst({
      where: { id, branch: { organizationId: auth.organizationId } },
      select: { id: true },
    })

    if (!samity) {
      return apiNotFound('Samity not found')
    }

    const where: Record<string, unknown> = { samityId: id }

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const [members, total] = await Promise.all([
      prisma.mFIMember.findMany({
        where,
        select: {
          id: true,
          memberNo: true,
          beneficiaryId: true,
          samityId: true,
          admissionDate: true,
          status: true,
          createdAt: true,
          beneficiary: {
            select: { id: true, name: true, phone: true, nidNumber: true },
          },
        },
        orderBy: { memberNo: 'asc' },
        skip,
        take: limit,
      }),
      prisma.mFIMember.count({ where }),
    ])

    return apiPaginated(members, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: samityId } = await params
    const body = await request.json()
    const { beneficiaryId, admissionDate } = body

    if (!beneficiaryId) {
      return apiBadRequest('beneficiaryId is required')
    }

    // Verify samity belongs to org
    const samity = await prisma.samity.findFirst({
      where: { id: samityId, branch: { organizationId: auth.organizationId } },
      select: { id: true },
    })

    if (!samity) {
      return apiNotFound('Samity not found')
    }

    // Verify beneficiary belongs to org
    const beneficiary = await prisma.beneficiary.findFirst({
      where: { id: beneficiaryId, organizationId: auth.organizationId },
      select: { id: true },
    })

    if (!beneficiary) {
      return apiBadRequest('Beneficiary not found or does not belong to your organization')
    }

    const memberNo = await generateNextNumber(auth.organizationId, 'mfi_member')

    const [member] = await prisma.$transaction([
      prisma.mFIMember.create({
        data: {
          memberNo,
          beneficiaryId,
          samityId,
          admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        },
        select: {
          id: true,
          memberNo: true,
          beneficiaryId: true,
          samityId: true,
          admissionDate: true,
          status: true,
          createdAt: true,
          beneficiary: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      prisma.samity.update({
        where: { id: samityId },
        data: { totalMembers: { increment: 1 } },
      }),
    ])

    return apiCreated(member)
  } catch (error) {
    return handleRouteError(error)
  }
}
