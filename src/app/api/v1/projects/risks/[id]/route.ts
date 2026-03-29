import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

const LIKELIHOOD_MAP: Record<string, number> = { VERY_LOW: 1, LOW: 2, MEDIUM: 3, HIGH: 4, VERY_HIGH: 5 }
const IMPACT_MAP: Record<string, number> = { NEGLIGIBLE: 1, MINOR: 2, MODERATE: 3, MAJOR: 4, CRITICAL: 5 }

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const risk = await prisma.projectRisk.findUnique({ where: { id } })
    if (!risk) return apiNotFound('Risk not found')

    return apiSuccess(risk)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.projectRisk.findUnique({ where: { id } })
    if (!existing) return apiNotFound('Risk not found')

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description || null
    if (body.category !== undefined) data.category = body.category
    if (body.mitigation !== undefined) data.mitigation = body.mitigation || null
    if (body.owner !== undefined) data.owner = body.owner || null
    if (body.status !== undefined) data.status = body.status
    if (body.reviewDate !== undefined) data.reviewDate = body.reviewDate ? new Date(body.reviewDate) : null

    const lh = body.likelihood || existing.likelihood
    const imp = body.impact || existing.impact
    if (body.likelihood !== undefined) data.likelihood = body.likelihood
    if (body.impact !== undefined) data.impact = body.impact
    if (body.likelihood !== undefined || body.impact !== undefined) {
      data.riskScore = (LIKELIHOOD_MAP[lh as string] || 3) * (IMPACT_MAP[imp as string] || 3)
    }

    if (Object.keys(data).length === 0) return apiBadRequest('No valid fields provided')

    const updated = await prisma.projectRisk.update({ where: { id }, data })
    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.projectRisk.findUnique({ where: { id } })
    if (!existing) return apiNotFound('Risk not found')

    await prisma.projectRisk.delete({ where: { id } })
    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
