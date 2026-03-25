import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import { logAudit, getAuditContext } from '@/lib/audit'
import { Prisma } from '@prisma/client'
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
    const { page, limit, skip, search } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      donor: { organizationId: auth.organizationId },
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { grantNo: { contains: search, mode: 'insensitive' } },
      ]
    }

    const donorId = url.searchParams.get('donorId')
    if (donorId) {
      where.donorId = donorId
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const [grants, total] = await Promise.all([
      prisma.grant.findMany({
        where,
        select: {
          id: true,
          grantNo: true,
          title: true,
          donorId: true,
          projectId: true,
          awardAmount: true,
          disbursedAmount: true,
          currencyCode: true,
          startDate: true,
          endDate: true,
          status: true,
          lifecycleStage: true,
          createdAt: true,
          updatedAt: true,
          donor: {
            select: { id: true, name: true, type: true },
          },
          _count: {
            select: {
              fundReceipts: true,
              fundRequisitions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.grant.count({ where }),
    ])

    return apiPaginated(grants, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      title,
      donorId,
      awardAmount,
      currencyCode,
      startDate,
      endDate,
      description,
      notes,
    } = body

    if (!title || !donorId || awardAmount === undefined) {
      return apiBadRequest('title, donorId, and awardAmount are required')
    }

    if (Number(awardAmount) <= 0) {
      return apiBadRequest('awardAmount must be greater than 0')
    }

    // Validate donor belongs to org
    const donor = await prisma.donor.findFirst({
      where: {
        id: donorId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!donor) {
      return apiBadRequest('Donor not found in this organization')
    }

    // Auto-generate grant number
    const grantNo = await generateNextNumber(auth.organizationId, 'grant')

    const grant = await prisma.grant.create({
      data: {
        grantNo,
        title: title.trim(),
        donorId,
        awardAmount: new Prisma.Decimal(awardAmount),
        currencyCode: currencyCode || 'BDT',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'PIPELINE',
        lifecycleStage: 'IDENTIFICATION',
        description: description || null,
        notes: notes || null,
      },
      select: {
        id: true,
        grantNo: true,
        title: true,
        donorId: true,
        awardAmount: true,
        disbursedAmount: true,
        currencyCode: true,
        startDate: true,
        endDate: true,
        status: true,
        lifecycleStage: true,
        description: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        donor: {
          select: { id: true, name: true },
        },
      },
    })

    // Log audit
    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'donor',
      resource: 'grant',
      resourceId: grant.id,
      description: `Created grant "${title}" (${grantNo})`,
      newValues: { title, donorId, awardAmount, grantNo },
      ...auditCtx,
    })

    return apiCreated(grant)
  } catch (error) {
    return handleRouteError(error)
  }
}
