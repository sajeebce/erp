import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      organizationId: auth.organizationId,
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { projectNo: { contains: search, mode: 'insensitive' } },
      ]
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    const donorId = url.searchParams.get('donorId')
    if (donorId) {
      where.donorId = donorId
    }

    const location = url.searchParams.get('location')
    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          projectNo: true,
          name: true,
          description: true,
          donorId: true,
          startDate: true,
          endDate: true,
          totalBudget: true,
          amountSpent: true,
          location: true,
          status: true,
          progress: true,
          managerId: true,
          createdAt: true,
          updatedAt: true,
          grants: {
            where: { deletedAt: null },
            select: {
              id: true,
              grantNo: true,
              title: true,
              awardAmount: true,
              status: true,
            },
          },
          _count: {
            select: {
              teamMembers: { where: { isActive: true } },
              activities: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    return apiPaginated(projects, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      name,
      description,
      donorId,
      startDate,
      endDate,
      totalBudget,
      location,
      status,
    } = body

    if (!name) {
      return apiBadRequest('name is required')
    }

    const validStatuses = ['PIPELINE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED']
    const projectStatus = status || 'PIPELINE'
    if (!validStatuses.includes(projectStatus)) {
      return apiBadRequest(`status must be one of: ${validStatuses.join(', ')}`)
    }

    // Validate donor belongs to org if provided
    if (donorId) {
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
    }

    // Auto-generate project number
    const projectNo = await generateNextNumber(auth.organizationId, 'project')

    const project = await prisma.project.create({
      data: {
        organizationId: auth.organizationId,
        projectNo,
        name: name.trim(),
        description: description || null,
        donorId: donorId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalBudget: totalBudget ? new Prisma.Decimal(totalBudget) : new Prisma.Decimal(0),
        location: location || null,
        status: projectStatus,
      },
      select: {
        id: true,
        projectNo: true,
        name: true,
        description: true,
        donorId: true,
        startDate: true,
        endDate: true,
        totalBudget: true,
        amountSpent: true,
        location: true,
        status: true,
        progress: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'project',
      resource: 'project',
      resourceId: project.id,
      description: `Created project "${name}" (${projectNo})`,
      newValues: { name, projectNo, status: projectStatus, totalBudget },
      ...auditCtx,
    })

    return apiCreated(project)
  } catch (error) {
    return handleRouteError(error)
  }
}
