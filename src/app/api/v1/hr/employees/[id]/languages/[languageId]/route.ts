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
  params: Promise<{ id: string; languageId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, languageId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeLanguage.findFirst({
      where: { id: languageId, employeeId },
    })
    if (!existing) return apiNotFound('Language not found')

    const body = await request.json()

    if (body.language !== undefined && body.language.trim() !== existing.language) {
      const duplicate = await prisma.employeeLanguage.findFirst({
        where: { employeeId, language: body.language.trim(), id: { not: languageId } },
      })
      if (duplicate) return apiBadRequest('This language already exists for the employee')
    }

    const updated = await prisma.employeeLanguage.update({
      where: { id: languageId },
      data: {
        ...(body.language !== undefined && { language: body.language.trim() }),
        ...(body.readLevel !== undefined && { readLevel: body.readLevel || null }),
        ...(body.writeLevel !== undefined && { writeLevel: body.writeLevel || null }),
        ...(body.speakLevel !== undefined && { speakLevel: body.speakLevel || null }),
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId, languageId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
    })
    if (!employee) return apiNotFound('Employee not found')

    const existing = await prisma.employeeLanguage.findFirst({
      where: { id: languageId, employeeId },
    })
    if (!existing) return apiNotFound('Language not found')

    await prisma.employeeLanguage.delete({ where: { id: languageId } })

    return apiSuccess({ message: 'Language deleted successfully' })
  } catch (error) {
    return handleRouteError(error)
  }
}

export { PATCH as PUT }
