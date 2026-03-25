import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
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

    const where: Record<string, unknown> = {}

    const beneficiaryId = url.searchParams.get('beneficiaryId')
    if (beneficiaryId) {
      where.beneficiaryId = beneficiaryId
    }

    const projectId = url.searchParams.get('projectId')
    if (projectId) {
      where.projectId = projectId
    }

    const serviceType = url.searchParams.get('serviceType')
    if (serviceType) {
      where.serviceType = serviceType
    }

    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.date = dateFilter
    }

    // Scope to org through beneficiary
    where.beneficiary = {
      organizationId: auth.organizationId,
      deletedAt: null,
    }

    const [deliveries, total] = await Promise.all([
      prisma.serviceDelivery.findMany({
        where,
        select: {
          id: true,
          serviceNo: true,
          serviceType: true,
          date: true,
          location: true,
          deliveredById: true,
          quantity: true,
          value: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          beneficiary: {
            select: {
              id: true,
              name: true,
              beneficiaryNo: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.serviceDelivery.count({ where }),
    ])

    return apiPaginated(deliveries, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      beneficiaryId,
      projectId,
      serviceType,
      date,
      location,
      deliveredById,
      quantity,
      value,
      notes,
    } = body

    if (!beneficiaryId || !projectId || !serviceType || !date) {
      return apiBadRequest('beneficiaryId, projectId, serviceType, and date are required')
    }

    // Validate beneficiary belongs to org
    const beneficiary = await prisma.beneficiary.findFirst({
      where: {
        id: beneficiaryId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
    })
    if (!beneficiary) {
      return apiBadRequest('Beneficiary not found in this organization')
    }

    // Validate project belongs to org
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
    })
    if (!project) {
      return apiBadRequest('Project not found in this organization')
    }

    // Generate serviceNo without number sequence
    const serviceNo = `SVC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    const delivery = await prisma.serviceDelivery.create({
      data: {
        serviceNo,
        beneficiaryId,
        projectId,
        serviceType: serviceType.trim(),
        date: new Date(date),
        location: location || null,
        deliveredById: deliveredById || null,
        quantity: quantity ?? null,
        value: value ?? null,
        notes: notes || null,
        status: 'DELIVERED',
      },
      select: {
        id: true,
        serviceNo: true,
        serviceType: true,
        date: true,
        location: true,
        deliveredById: true,
        quantity: true,
        value: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        beneficiary: {
          select: {
            id: true,
            name: true,
            beneficiaryNo: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return apiCreated(delivery)
  } catch (error) {
    return handleRouteError(error)
  }
}
