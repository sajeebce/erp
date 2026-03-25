import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const url = new URL(request.url)
    const month = url.searchParams.get('month')
    const year = url.searchParams.get('year')

    if (!month || !year) {
      return apiBadRequest('month and year are required')
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1)
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59)

    // Get all active employees for this org
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: auth.organizationId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true, employeeNo: true, fullName: true },
    })

    // Get all attendance records for the month
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: { in: employees.map((e) => e.id) },
        date: { gte: startDate, lte: endDate },
      },
    })

    // Build summary per employee
    const summary = employees.map((emp) => {
      const records = attendanceRecords.filter((a) => a.employeeId === emp.id)

      let present = 0
      let absent = 0
      let late = 0
      let onLeave = 0
      let halfDay = 0
      let totalOtHours = 0

      for (const r of records) {
        switch (r.status) {
          case 'PRESENT': present++; break
          case 'ABSENT': absent++; break
          case 'LATE': late++; break
          case 'ON_LEAVE': onLeave++; break
          case 'HALF_DAY': halfDay++; break
        }
        totalOtHours += Number(r.otHours)
      }

      return {
        employeeId: emp.id,
        employeeNo: emp.employeeNo,
        fullName: emp.fullName,
        present,
        absent,
        late,
        onLeave,
        halfDay,
        totalOtHours,
        totalRecords: records.length,
      }
    })

    return apiSuccess({ month: Number(month), year: Number(year), summary })
  } catch (error) {
    return handleRouteError(error)
  }
}
