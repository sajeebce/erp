import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiCreated,
  apiBadRequest,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)

    const roles = await prisma.role.findMany({
      where: {
        organizationId: auth.organizationId,
      },
      include: {
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const data = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      permissionCount: role._count.permissions,
    }))

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return apiBadRequest('Role name is required')
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return apiBadRequest('Role name must be at least 2 characters')
    }

    // Check name uniqueness within org
    const existingRole = await prisma.role.findUnique({
      where: {
        organizationId_name: {
          organizationId: auth.organizationId,
          name: name.trim(),
        },
      },
    })

    if (existingRole) {
      return apiConflict('A role with this name already exists in this organization')
    }

    const role = await prisma.role.create({
      data: {
        organizationId: auth.organizationId,
        name: name.trim(),
        description: description || null,
      },
      include: {
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    })

    return apiCreated({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      permissionCount: role._count.permissions,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
