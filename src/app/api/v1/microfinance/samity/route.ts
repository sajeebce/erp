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

    const where: Record<string, unknown> = {
      branch: { organizationId: auth.organizationId },
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { samityNo: { contains: search, mode: 'insensitive' } },
      ]
    }

    const branchId = url.searchParams.get('branchId')
    if (branchId) where.branchId = branchId

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const [samities, total] = await Promise.all([
      prisma.samity.findMany({
        where,
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
          createdAt: true,
          updatedAt: true,
          branch: { select: { id: true, code: true, name: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.samity.count({ where }),
    ])

    return apiPaginated(samities, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()
    const { name, branchId, formationDate, meetingDay, meetingTime, fieldOfficerId, location, notes } = body

    if (!name || !branchId || !formationDate || !meetingDay) {
      return apiBadRequest('name, branchId, formationDate, and meetingDay are required')
    }

    // Validate branch belongs to org
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, organizationId: auth.organizationId },
    })

    if (!branch) {
      return apiBadRequest('Branch not found or does not belong to your organization')
    }

    const samityNo = await generateNextNumber(auth.organizationId, 'mfi_samity')

    const samity = await prisma.samity.create({
      data: {
        samityNo,
        name: name.trim(),
        branchId,
        formationDate: new Date(formationDate),
        meetingDay,
        meetingTime: meetingTime || null,
        fieldOfficerId: fieldOfficerId || null,
        location: location || null,
        notes: notes || null,
      },
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
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiCreated(samity)
  } catch (error) {
    return handleRouteError(error)
  }
}
