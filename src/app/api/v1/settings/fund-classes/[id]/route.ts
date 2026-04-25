import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

const VALID_RESTRICTIONS = ['UNRESTRICTED', 'RESTRICTED', 'TEMPORARILY_RESTRICTED', 'ENDOWMENT']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const fc = await prisma.fundClass.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!fc) return apiNotFound('Fund class not found')

    return apiSuccess(fc)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

    const existing = await prisma.fundClass.findFirst({
      where: { id, organizationId: auth.organizationId },
    })
    if (!existing) return apiNotFound('Fund class not found')

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (!body.name.trim()) return apiBadRequest('name cannot be empty')
      data.name = body.name.trim()
    }
    if (body.code !== undefined) {
      const trimmed = body.code.trim()
      if (trimmed !== existing.code) {
        const conflict = await prisma.fundClass.findUnique({
          where: { organizationId_code: { organizationId: auth.organizationId, code: trimmed } },
        })
        if (conflict) return apiConflict(`Fund class code "${trimmed}" already exists`)
      }
      data.code = trimmed
    }
    if (body.restriction !== undefined) {
      if (!VALID_RESTRICTIONS.includes(body.restriction)) {
        return apiBadRequest(`restriction must be one of: ${VALID_RESTRICTIONS.join(', ')}`)
      }
      data.restriction = body.restriction
    }
    if (body.localizedName !== undefined) data.localizedName = body.localizedName
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)

    if (Object.keys(data).length === 0) return apiBadRequest('No valid fields to update')

    const updated = await prisma.fundClass.update({ where: { id }, data })
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
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

    const fc = await prisma.fundClass.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: { _count: { select: { journalLines: true } } },
    })
    if (!fc) return apiNotFound('Fund class not found')

    if (fc._count.journalLines > 0) {
      return apiConflict(
        `Cannot delete fund class: it has ${fc._count.journalLines} journal line reference(s). Deactivate instead.`
      )
    }

    await prisma.fundClass.delete({ where: { id } })
    return apiSuccess({ message: 'Fund class deleted' })
  } catch (error) {
    return handleRouteError(error)
  }
}
