import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, apiNotFound, handleRouteError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    const url = new URL(request.url)
    const days = Math.max(1, parseInt(url.searchParams.get('days') || '30', 10))

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })
    if (!employee) {
      return apiNotFound('Employee not found')
    }

    const now = new Date()
    const cutoffDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const documents = await prisma.employeeDocument.findMany({
      where: {
        employeeId,
        expiryDate: {
          not: null,
          lte: cutoffDate,
        },
      },
      orderBy: { expiryDate: 'asc' },
    })

    // Add computed daysUntilExpiry for convenience
    const enriched = documents.map((doc) => ({
      ...doc,
      daysUntilExpiry: doc.expiryDate
        ? Math.ceil((new Date(doc.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null,
      isExpired: doc.expiryDate ? new Date(doc.expiryDate).getTime() < now.getTime() : false,
    }))

    return apiSuccess(enriched)
  } catch (error) {
    return handleRouteError(error)
  }
}
