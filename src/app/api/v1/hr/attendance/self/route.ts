import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiNotFound, apiSuccess, handleRouteError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const employee = await prisma.employee.findFirst({
      where: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        employeeNo: true,
        fullName: true,
        department: { select: { id: true, name: true } },
      },
    })

    if (!employee) {
      return apiNotFound('Employee profile not found for current user')
    }

    const now = new Date()
    const todayKey = now.toISOString().slice(0, 10)
    const dayStart = new Date(`${todayKey}T00:00:00.000Z`)
    const dayEnd = new Date(`${todayKey}T23:59:59.999Z`)

    const [attendance, openMovement] = await Promise.all([
      prisma.attendance.findFirst({
        where: {
          employeeId: employee.id,
          date: { gte: dayStart, lte: dayEnd },
        },
        include: { operatingLocation: { select: { id: true, code: true, name: true } } },
      }),
      prisma.attendanceMovement.findFirst({
        where: {
          organizationId: auth.organizationId,
          employeeId: employee.id,
          status: 'OPEN',
        },
        include: { operatingLocation: { select: { id: true, code: true, name: true } } },
      }),
    ])

    return apiSuccess({
      employee,
      attendance,
      openMovement,
      today: dayStart.toISOString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
