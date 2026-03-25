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
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      samity: { branch: { organizationId: auth.organizationId } },
    }

    const samityId = url.searchParams.get('samityId')
    if (samityId) where.samityId = samityId

    const status = url.searchParams.get('status')
    if (status) where.status = status

    const date = url.searchParams.get('date')
    if (date) {
      const d = new Date(date)
      const nextDay = new Date(d)
      nextDay.setDate(nextDay.getDate() + 1)
      where.date = { gte: d, lt: nextDay }
    }

    const [collections, total] = await Promise.all([
      prisma.collectionSheet.findMany({
        where,
        select: {
          id: true,
          collectionNo: true,
          samityId: true,
          date: true,
          membersPresent: true,
          totalCollectible: true,
          amountCollected: true,
          shortfall: true,
          onTimePercent: true,
          status: true,
          createdAt: true,
          samity: { select: { samityNo: true, name: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.collectionSheet.count({ where }),
    ])

    return apiPaginated(collections, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()
    const {
      samityId, date, membersPresent, totalCollectible,
      amountCollected, shortfall, onTimePercent, status, notes,
    } = body

    if (!samityId || !date || membersPresent == null || totalCollectible == null || amountCollected == null) {
      return apiBadRequest('samityId, date, membersPresent, totalCollectible, and amountCollected are required')
    }

    // Validate samity → branch → org
    const samity = await prisma.samity.findFirst({
      where: { id: samityId, branch: { organizationId: auth.organizationId } },
      select: { id: true },
    })

    if (!samity) {
      return apiBadRequest('Samity not found or does not belong to your organization')
    }

    const collectionNo = await generateNextNumber(auth.organizationId, 'mfi_collection')

    const collection = await prisma.collectionSheet.create({
      data: {
        collectionNo,
        samityId,
        date: new Date(date),
        membersPresent,
        totalCollectible,
        amountCollected,
        shortfall: shortfall ?? Number(totalCollectible) - Number(amountCollected),
        onTimePercent: onTimePercent ?? 0,
        collectedById: auth.userId,
        status: status || 'COMPLETED',
        notes: notes || null,
      },
      select: {
        id: true,
        collectionNo: true,
        samityId: true,
        date: true,
        membersPresent: true,
        totalCollectible: true,
        amountCollected: true,
        shortfall: true,
        onTimePercent: true,
        status: true,
        createdAt: true,
      },
    })

    return apiCreated(collection)
  } catch (error) {
    return handleRouteError(error)
  }
}
