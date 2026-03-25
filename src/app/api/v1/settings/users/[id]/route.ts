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

    const user = await prisma.user.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        status: true,
        lastLoginAt: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!user) {
      return apiNotFound('User not found')
    }

    return apiSuccess(user)
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

    // Verify user belongs to this org
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
    })

    if (!existingUser) {
      return apiNotFound('User not found')
    }

    const body = await request.json()

    const allowedFields = ['fullName', 'phone', 'roleId', 'departmentId', 'status'] as const
    const data: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    // Validate fullName if provided
    if (data.fullName !== undefined) {
      if (typeof data.fullName !== 'string' || data.fullName.trim().length < 2) {
        return apiBadRequest('Full name must be at least 2 characters')
      }
      data.fullName = (data.fullName as string).trim()
    }

    // Validate roleId belongs to this org
    if (data.roleId !== undefined) {
      const role = await prisma.role.findFirst({
        where: {
          id: data.roleId as string,
          organizationId: auth.organizationId,
        },
      })

      if (!role) {
        return apiBadRequest('Invalid role ID')
      }
    }

    // Validate departmentId belongs to this org
    if (data.departmentId !== undefined && data.departmentId !== null) {
      const department = await prisma.department.findFirst({
        where: {
          id: data.departmentId as string,
          organizationId: auth.organizationId,
        },
      })

      if (!department) {
        return apiBadRequest('Invalid department ID')
      }
    }

    // Validate status if provided
    if (data.status !== undefined) {
      const validStatuses = ['ACTIVE', 'INACTIVE', 'LOCKED', 'PENDING']
      if (!validStatuses.includes(data.status as string)) {
        return apiBadRequest(`Status must be one of: ${validStatuses.join(', ')}`)
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return apiSuccess(user)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

    // Can't delete yourself
    if (id === auth.userId) {
      return apiBadRequest('You cannot delete your own account')
    }

    // Verify user belongs to this org
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
    })

    if (!existingUser) {
      return apiNotFound('User not found')
    }

    // Soft delete: set deletedAt and status=INACTIVE
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
