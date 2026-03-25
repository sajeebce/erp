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

    const where: Record<string, unknown> = {}

    const beneficiaryId = url.searchParams.get('beneficiaryId')
    if (beneficiaryId) {
      where.beneficiaryId = beneficiaryId
    }

    const category = url.searchParams.get('category')
    if (category) {
      where.category = category
    }

    const severity = url.searchParams.get('severity')
    if (severity) {
      where.severity = severity
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    // Scope to org: grievances linked to beneficiaries in this org,
    // or grievances without a beneficiary but filed through this org.
    // Since Grievance doesn't have organizationId, scope via beneficiary.
    where.OR = [
      {
        beneficiary: {
          organizationId: auth.organizationId,
          deletedAt: null,
        },
      },
      {
        beneficiaryId: null,
      },
    ]

    const [grievances, total] = await Promise.all([
      prisma.grievance.findMany({
        where,
        select: {
          id: true,
          grievanceNo: true,
          date: true,
          complainantName: true,
          category: true,
          description: true,
          severity: true,
          assignedToId: true,
          resolutionDate: true,
          resolutionNotes: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          beneficiary: {
            select: {
              id: true,
              name: true,
              beneficiaryNo: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.grievance.count({ where }),
    ])

    return apiPaginated(grievances, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const body = await request.json()
    const {
      date,
      beneficiaryId,
      complainantName,
      category,
      description,
      severity,
    } = body

    if (!date || !complainantName || !category || !description) {
      return apiBadRequest('date, complainantName, category, and description are required')
    }

    const validCategories = [
      'SERVICE_QUALITY',
      'STAFF_BEHAVIOR',
      'ELIGIBILITY',
      'DELAY',
      'CORRUPTION',
      'OTHER',
    ]
    if (!validCategories.includes(category)) {
      return apiBadRequest(`category must be one of: ${validCategories.join(', ')}`)
    }

    const validSeverities = ['HIGH', 'MEDIUM', 'LOW']
    if (severity && !validSeverities.includes(severity)) {
      return apiBadRequest(`severity must be one of: ${validSeverities.join(', ')}`)
    }

    // Validate beneficiary belongs to org if provided
    if (beneficiaryId) {
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
    }

    const grievanceNo = await generateNextNumber(auth.organizationId, 'grievance')

    const grievance = await prisma.grievance.create({
      data: {
        grievanceNo,
        date: new Date(date),
        beneficiaryId: beneficiaryId || null,
        complainantName: complainantName.trim(),
        category,
        description: description.trim(),
        severity: severity || 'MEDIUM',
        status: 'OPEN',
      },
      select: {
        id: true,
        grievanceNo: true,
        date: true,
        complainantName: true,
        category: true,
        description: true,
        severity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        beneficiary: {
          select: {
            id: true,
            name: true,
            beneficiaryNo: true,
          },
        },
      },
    })

    return apiCreated(grievance)
  } catch (error) {
    return handleRouteError(error)
  }
}
