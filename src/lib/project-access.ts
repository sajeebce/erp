import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { type AccessTokenPayload } from '@/lib/auth'

export async function getProjectManagerEmployeeId(auth: AccessTokenPayload) {
  const employee = await prisma.employee.findFirst({
    where: {
      organizationId: auth.organizationId,
      userId: auth.userId,
      deletedAt: null,
    },
    select: { id: true },
  })

  if (!employee) {
    throw new Error('Forbidden: Project Manager user is not linked to an employee record')
  }

  return employee.id
}

export async function getProjectAccessWhere(auth: AccessTokenPayload): Promise<Prisma.ProjectWhereInput> {
  if (auth.roleName !== 'PROJECT_MANAGER') return {}

  return {
    managerId: await getProjectManagerEmployeeId(auth),
  }
}

export async function enforceProjectManagerId(auth: AccessTokenPayload, requestedManagerId?: string | null) {
  if (auth.roleName !== 'PROJECT_MANAGER') return requestedManagerId || null

  const employeeId = await getProjectManagerEmployeeId(auth)
  if (requestedManagerId && requestedManagerId !== employeeId) {
    throw new Error('Forbidden: Project managers can only create or manage their own assigned projects')
  }

  return employeeId
}
