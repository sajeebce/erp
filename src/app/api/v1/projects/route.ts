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

const VALID_STATUSES = ['PIPELINE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED']
const VALID_TYPES = ['HUMANITARIAN', 'DEVELOPMENT', 'ADVOCACY', 'CAPACITY_BUILDING', 'RESEARCH', 'EMERGENCY_RESPONSE', 'CORE_OPERATIONS', 'MULTI_COUNTRY']
const VALID_SECTORS = ['WASH', 'EDUCATION', 'HEALTH', 'LIVELIHOODS', 'FOOD_SECURITY', 'PROTECTION', 'SHELTER', 'NUTRITION', 'AGRICULTURE', 'CLIMATE_ADAPTATION', 'GOVERNANCE', 'GENDER_EQUALITY', 'DISASTER_RISK_REDUCTION', 'MULTI_SECTOR', 'OTHER']

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
    if (status) where.status = status

    const projectType = url.searchParams.get('projectType')
    if (projectType) where.projectType = projectType

    const sector = url.searchParams.get('sector')
    if (sector) where.sector = sector

    const donorId = url.searchParams.get('donorId')
    if (donorId) where.donorId = donorId

    const country = url.searchParams.get('country')
    if (country) where.country = { contains: country, mode: 'insensitive' }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          projectNo: true,
          name: true,
          description: true,
          projectType: true,
          sector: true,
          donorId: true,
          startDate: true,
          endDate: true,
          totalBudget: true,
          amountSpent: true,
          currency: true,
          country: true,
          region: true,
          location: true,
          implementingPartner: true,
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
          extensionRequests: {
            where: { deletedAt: null },
            select: {
              id: true,
              requestNo: true,
              currentEndDate: true,
              proposedEndDate: true,
              status: true,
              requestedAt: true,
              approvedAt: true,
            },
            orderBy: { requestedAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              teamMembers: { where: { isActive: true } },
              activities: true,
              milestones: true,
              indicators: true,
              risks: true,
              extensionRequests: { where: { status: 'APPROVED', deletedAt: null } },
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
      projectType,
      sector,
      donorId,
      startDate,
      endDate,
      totalBudget,
      currency,
      country,
      region,
      location,
      implementingPartner,
      status,
      managerId,
    } = body

    if (!name) {
      return apiBadRequest('name is required')
    }

    const projectStatus = status || 'PIPELINE'
    if (!VALID_STATUSES.includes(projectStatus)) {
      return apiBadRequest(`status must be one of: ${VALID_STATUSES.join(', ')}`)
    }

    if (projectType && !VALID_TYPES.includes(projectType)) {
      return apiBadRequest(`projectType must be one of: ${VALID_TYPES.join(', ')}`)
    }

    if (sector && !VALID_SECTORS.includes(sector)) {
      return apiBadRequest(`sector must be one of: ${VALID_SECTORS.join(', ')}`)
    }

    if (donorId) {
      const donor = await prisma.donor.findFirst({
        where: { id: donorId, organizationId: auth.organizationId, deletedAt: null },
        select: { id: true },
      })
      if (!donor) return apiBadRequest('Donor not found in this organization')
    }

    const projectNo = await generateNextNumber(auth.organizationId, 'project')

    const project = await prisma.project.create({
      data: {
        organizationId: auth.organizationId,
        projectNo,
        name: name.trim(),
        description: description || null,
        projectType: projectType || 'DEVELOPMENT',
        sector: sector || 'OTHER',
        donorId: donorId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalBudget: totalBudget ? new Prisma.Decimal(totalBudget) : new Prisma.Decimal(0),
        currency: currency || 'USD',
        country: country || null,
        region: region || null,
        location: location || null,
        implementingPartner: implementingPartner || null,
        status: projectStatus,
        managerId: managerId || null,
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
      newValues: { name, projectNo, status: projectStatus, totalBudget, projectType, sector },
      ...auditCtx,
    })

    return apiCreated(project)
  } catch (error) {
    return handleRouteError(error)
  }
}
