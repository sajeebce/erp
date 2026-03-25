import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const { page, limit, skip, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {}

    // Scope to org via beneficiary
    const beneficiaryId = url.searchParams.get('beneficiaryId')
    if (beneficiaryId) {
      where.beneficiaryId = beneficiaryId
    }

    const projectId = url.searchParams.get('projectId')
    if (projectId) {
      where.projectId = projectId
    }

    const status = url.searchParams.get('status')
    if (status) {
      where.status = status
    }

    // Scope enrollments to the org through beneficiary relation
    where.beneficiary = {
      organizationId: auth.organizationId,
      deletedAt: null,
    }

    const [enrollments, total] = await Promise.all([
      prisma.beneficiaryEnrollment.findMany({
        where,
        select: {
          id: true,
          enrollmentNo: true,
          programName: true,
          enrollmentDate: true,
          graduationDate: true,
          servicesAssigned: true,
          status: true,
          dropoutReason: true,
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
      prisma.beneficiaryEnrollment.count({ where }),
    ])

    return apiPaginated(enrollments, total, page, limit)
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
      programName,
      enrollmentDate,
      servicesAssigned,
    } = body

    if (!beneficiaryId || !projectId || !programName || !enrollmentDate) {
      return apiBadRequest('beneficiaryId, projectId, programName, and enrollmentDate are required')
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

    // Check no duplicate active enrollment for same beneficiary+project
    const existingEnrollment = await prisma.beneficiaryEnrollment.findFirst({
      where: {
        beneficiaryId,
        projectId,
        status: 'ACTIVE',
      },
    })
    if (existingEnrollment) {
      return apiConflict('An active enrollment already exists for this beneficiary in this project')
    }

    const enrollmentNo = await generateNextNumber(auth.organizationId, 'enrollment')

    const enrollment = await prisma.beneficiaryEnrollment.create({
      data: {
        enrollmentNo,
        beneficiaryId,
        projectId,
        programName: programName.trim(),
        enrollmentDate: new Date(enrollmentDate),
        servicesAssigned: servicesAssigned || null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        enrollmentNo: true,
        programName: true,
        enrollmentDate: true,
        servicesAssigned: true,
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return apiCreated(enrollment)
  } catch (error) {
    return handleRouteError(error)
  }
}
