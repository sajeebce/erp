import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
      include: {
        fiscalPeriods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    })

    if (!fiscalYear) {
      return apiNotFound('Fiscal year not found')
    }

    return apiSuccess(fiscalYear)
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

    const existing = await prisma.fiscalYear.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
      include: {
        fiscalPeriods: true,
      },
    })

    if (!existing) {
      return apiNotFound('Fiscal year not found')
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    // Update name
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return apiBadRequest('Name must be a non-empty string')
      }
      data.name = body.name.trim()
    }

    // Set as current fiscal year
    if (body.isCurrent === true) {
      // Unset all other fiscal years as current within this org
      await prisma.fiscalYear.updateMany({
        where: {
          organizationId: auth.organizationId,
          isCurrent: true,
        },
        data: { isCurrent: false },
      })
      data.isCurrent = true
    }

    // Close the fiscal year
    if (body.isClosed === true) {
      if (existing.isClosed) {
        return apiBadRequest('Fiscal year is already closed')
      }

      // Check that all periods are closed
      const openPeriods = existing.fiscalPeriods.filter((p) => !p.isClosed)
      if (openPeriods.length > 0) {
        return apiBadRequest(
          `Cannot close fiscal year: ${openPeriods.length} period(s) are still open. Close all periods first.`
        )
      }

      data.isClosed = true
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const updated = await prisma.fiscalYear.update({
      where: { id },
      data,
      include: {
        fiscalPeriods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
