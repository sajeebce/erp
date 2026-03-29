import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const indicator = await prisma.projectIndicator.findUnique({ where: { id } })
    if (!indicator) return apiNotFound('Indicator not found')

    return apiSuccess(indicator)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.projectIndicator.findUnique({ where: { id } })
    if (!existing) return apiNotFound('Indicator not found')

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description || null
    if (body.type !== undefined) data.type = body.type
    if (body.unit !== undefined) data.unit = body.unit || null
    if (body.baselineValue !== undefined) data.baselineValue = body.baselineValue
    if (body.baselineDate !== undefined) data.baselineDate = body.baselineDate ? new Date(body.baselineDate) : null
    if (body.targetValue !== undefined) data.targetValue = body.targetValue
    if (body.currentValue !== undefined) data.currentValue = body.currentValue
    if (body.frequency !== undefined) data.frequency = body.frequency
    if (body.dataSource !== undefined) data.dataSource = body.dataSource || null
    if (body.responsible !== undefined) data.responsible = body.responsible || null
    if (body.disaggregation !== undefined) data.disaggregation = body.disaggregation || null
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder

    if (Object.keys(data).length === 0) return apiBadRequest('No valid fields provided')

    const updated = await prisma.projectIndicator.update({ where: { id }, data })
    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const existing = await prisma.projectIndicator.findUnique({ where: { id } })
    if (!existing) return apiNotFound('Indicator not found')

    await prisma.projectIndicator.delete({ where: { id } })
    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
