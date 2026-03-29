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

const LIKELIHOOD_MAP: Record<string, number> = { VERY_LOW: 1, LOW: 2, MEDIUM: 3, HIGH: 4, VERY_HIGH: 5 }
const IMPACT_MAP: Record<string, number> = { NEGLIGIBLE: 1, MINOR: 2, MODERATE: 3, MAJOR: 4, CRITICAL: 5 }

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const url = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(url)

    const projectId = url.searchParams.get('projectId')
    if (!projectId) return apiBadRequest('projectId is required')

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!project) return apiBadRequest('Project not found')

    const status = url.searchParams.get('status')
    const where: Record<string, unknown> = { projectId }
    if (status) where.status = status

    const [risks, total] = await Promise.all([
      prisma.projectRisk.findMany({
        where,
        orderBy: { riskScore: 'desc' },
        skip,
        take: limit,
      }),
      prisma.projectRisk.count({ where }),
    ])

    return apiPaginated(risks, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const body = await request.json()

    const { title, projectId, description, category, likelihood, impact, mitigation, owner, status, reviewDate } = body

    if (!title || !projectId) return apiBadRequest('title and projectId are required')

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!project) return apiBadRequest('Project not found')

    const lh = likelihood || 'MEDIUM'
    const imp = impact || 'MODERATE'
    const riskScore = (LIKELIHOOD_MAP[lh] || 3) * (IMPACT_MAP[imp] || 3)

    const risk = await prisma.projectRisk.create({
      data: {
        projectId,
        title: title.trim(),
        description: description || null,
        category: category || 'OPERATIONAL',
        likelihood: lh,
        impact: imp,
        riskScore,
        mitigation: mitigation || null,
        owner: owner || null,
        status: status || 'OPEN',
        reviewDate: reviewDate ? new Date(reviewDate) : null,
      },
    })

    return apiCreated(risk)
  } catch (error) {
    return handleRouteError(error)
  }
}
