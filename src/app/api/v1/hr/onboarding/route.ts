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

    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status') // in_progress | completed | overdue

    // Get all employees who have onboarding progress records
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: auth.organizationId,
        deletedAt: null,
        onboarding: { some: {} },
      },
      select: {
        id: true,
        employeeNo: true,
        fullName: true,
        joiningDate: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        onboarding: {
          select: {
            id: true,
            isCompleted: true,
          },
        },
      },
      orderBy: { joiningDate: 'desc' },
    })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = employees.map((emp) => {
      const total = emp.onboarding.length
      const completed = emp.onboarding.filter((t) => t.isCompleted).length
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

      let status: 'in_progress' | 'completed' | 'overdue'
      if (percentage === 100) {
        status = 'completed'
      } else if (emp.joiningDate < thirtyDaysAgo) {
        status = 'overdue'
      } else {
        status = 'in_progress'
      }

      return {
        id: emp.id,
        employeeNo: emp.employeeNo,
        fullName: emp.fullName,
        joiningDate: emp.joiningDate,
        department: emp.department,
        designation: emp.designation,
        totalTasks: total,
        completedTasks: completed,
        percentage,
        status,
      }
    })

    const filtered = statusFilter
      ? result.filter((r) => r.status === statusFilter)
      : result

    return apiSuccess(filtered)
  } catch (error) {
    return handleRouteError(error)
  }
}
