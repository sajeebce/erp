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

const VALID_TYPES = ['QUANTITATIVE', 'QUALITATIVE']
const VALID_FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY', 'END_OF_PROJECT']

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const projectId = url.searchParams.get('projectId')
    if (!projectId) return apiBadRequest('projectId is required')

    // Verify project belongs to org
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!project) return apiBadRequest('Project not found')

    const where = { projectId }

    const [indicators, total] = await Promise.all([
      prisma.projectIndicator.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.projectIndicator.count({ where }),
    ])

    return apiPaginated(indicators, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { name, projectId, description, type, unit, baselineValue, baselineDate, targetValue, currentValue, frequency, dataSource, responsible, disaggregation, sortOrder } = body

    if (!name || !projectId) return apiBadRequest('name and projectId are required')

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!project) return apiBadRequest('Project not found')

    if (type && !VALID_TYPES.includes(type)) return apiBadRequest(`type must be one of: ${VALID_TYPES.join(', ')}`)
    if (frequency && !VALID_FREQUENCIES.includes(frequency)) return apiBadRequest(`frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`)

    const indicator = await prisma.projectIndicator.create({
      data: {
        projectId,
        name: name.trim(),
        description: description || null,
        type: type || 'QUANTITATIVE',
        unit: unit || null,
        baselineValue: baselineValue != null ? baselineValue : null,
        baselineDate: baselineDate ? new Date(baselineDate) : null,
        targetValue: targetValue != null ? targetValue : null,
        currentValue: currentValue != null ? currentValue : null,
        frequency: frequency || 'QUARTERLY',
        dataSource: dataSource || null,
        responsible: responsible || null,
        disaggregation: disaggregation || null,
        sortOrder: sortOrder || 0,
      },
    })

    return apiCreated(indicator)
  } catch (error) {
    return handleRouteError(error)
  }
}
