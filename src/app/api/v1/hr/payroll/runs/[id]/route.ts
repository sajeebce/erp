import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
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

    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            employee: {
              select: { id: true, employeeNo: true, fullName: true, departmentId: true },
            },
          },
          orderBy: { employee: { fullName: 'asc' } },
        },
      },
    })

    if (!run) {
      return apiNotFound('Payroll run not found')
    }

    return apiSuccess(run)
  } catch (error) {
    return handleRouteError(error)
  }
}
