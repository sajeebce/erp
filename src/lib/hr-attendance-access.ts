import { prisma } from '@/lib/db'
import type { AccessTokenPayload } from '@/lib/auth'

const HR_ATTENDANCE_MANAGER_ROLES = new Set(['ADMIN', 'HR_ADMIN', 'HR_MANAGER'])

export function canManageHrAttendance(auth: AccessTokenPayload): boolean {
  return HR_ATTENDANCE_MANAGER_ROLES.has(auth.roleName)
}

export async function getCurrentEmployeeForAttendance(auth: AccessTokenPayload) {
  const employee = await prisma.employee.findFirst({
    where: {
      userId: auth.userId,
      organizationId: auth.organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      userId: true,
      employeeNo: true,
      fullName: true,
      departmentId: true,
    },
  })

  if (!employee) {
    throw new Error('Not found: Employee profile not found for current user')
  }

  return employee
}

export async function getScopedAttendanceEmployeeId(
  auth: AccessTokenPayload,
  requestedEmployeeId?: string | null
): Promise<string | undefined> {
  if (canManageHrAttendance(auth)) {
    return requestedEmployeeId || undefined
  }

  const employee = await getCurrentEmployeeForAttendance(auth)
  if (requestedEmployeeId && requestedEmployeeId !== employee.id) {
    throw new Error('Forbidden: You can only access your own attendance records')
  }

  return employee.id
}

export function assertCanUseEmployeeAttendance(
  auth: AccessTokenPayload,
  employee: { userId: string | null }
): void {
  if (canManageHrAttendance(auth)) return

  if (employee.userId !== auth.userId) {
    throw new Error('Forbidden: You can only record your own attendance')
  }
}
