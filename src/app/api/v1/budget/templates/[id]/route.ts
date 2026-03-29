import { NextRequest } from 'next/server'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { DONOR_TEMPLATES } from '../route'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const template = DONOR_TEMPLATES.find((t) => t.id === id)
    if (!template) {
      return apiNotFound('Template not found')
    }

    return apiSuccess(template)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const template = DONOR_TEMPLATES.find((t) => t.id === id)
    if (!template) {
      return apiNotFound('Template not found')
    }

    if (template.isGlobal) {
      return apiBadRequest('Global templates cannot be modified')
    }

    // Since there is no DB model for templates, custom template updates
    // are not persisted. Return updated shape for API consistency.
    const body = await request.json()
    const updated = {
      ...template,
      ...(body.name && { name: body.name.trim() }),
      ...(body.categories && { categories: body.categories }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.indirectCostRate !== undefined && { indirectCostRate: body.indirectCostRate }),
      ...(body.indirectCostBase !== undefined && { indirectCostBase: body.indirectCostBase }),
      ...(body.notes !== undefined && { notes: body.notes }),
    }

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthFromRequest(request)
    const { id } = await params

    const template = DONOR_TEMPLATES.find((t) => t.id === id)
    if (!template) {
      return apiNotFound('Template not found')
    }

    if (template.isGlobal) {
      return apiBadRequest('Global templates cannot be deleted')
    }

    // No DB to delete from; return acknowledgement
    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
