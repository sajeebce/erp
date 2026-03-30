import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const advances = await prisma.employeeAdvance.findMany({
      where: {
        organizationId: auth.organizationId,
        status: { in: ['DISBURSED', 'PARTIALLY_SETTLED', 'OVERDUE'] },
      },
      orderBy: { disbursedAt: 'asc' },
    })

    // Enrich with employee names and aging
    const employeeIds = [...new Set(advances.map((a) => a.employeeId))]
    const employees =
      employeeIds.length > 0
        ? await prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            select: { id: true, fullName: true, employeeNo: true },
          })
        : []

    const employeeMap = new Map(employees.map((e) => [e.id, e]))
    const now = new Date()

    const enriched = advances.map((a) => {
      const emp = employeeMap.get(a.employeeId)
      const disbursedDate = a.disbursedAt ? new Date(a.disbursedAt) : new Date(a.requestDate)
      const agingDays = Math.floor(
        (now.getTime() - disbursedDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      return {
        ...a,
        employeeName: emp ? emp.fullName : null,
        employeeCode: emp?.employeeNo || null,
        agingDays,
        outstandingAmount:
          Number(a.disbursedAmount || 0) - Number(a.settledAmount || 0),
      }
    })

    return apiSuccess(enriched)
  } catch (error) {
    return handleRouteError(error)
  }
}
