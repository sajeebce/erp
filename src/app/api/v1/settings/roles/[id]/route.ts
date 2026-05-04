import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest, requireRoleFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const role = await prisma.role.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    if (!role) {
      return apiNotFound('Role not found')
    }

    return apiSuccess({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        resource: rp.permission.resource,
        description: rp.permission.description,
      })),
    })
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

    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    })

    if (!existingRole) {
      return apiNotFound('Role not found')
    }

    const body = await request.json()
    const { name, description } = body

    const data: Record<string, unknown> = {}

    if (name !== undefined) {
      // Can't rename system roles
      if (existingRole.isSystem) {
        return apiBadRequest('Cannot rename system roles')
      }

      if (typeof name !== 'string' || name.trim().length < 2) {
        return apiBadRequest('Role name must be at least 2 characters')
      }

      // Check name uniqueness within org (excluding current role)
      const duplicateRole = await prisma.role.findFirst({
        where: {
          organizationId: auth.organizationId,
          name: name.trim(),
          id: { not: id },
        },
      })

      if (duplicateRole) {
        return apiConflict('A role with this name already exists in this organization')
      }

      data.name = name.trim()
    }

    if (description !== undefined) {
      data.description = description || null
    }

    if (Object.keys(data).length === 0) {
      return apiBadRequest('No valid fields provided for update')
    }

    const role = await prisma.role.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    })

    return apiSuccess({
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleFromRequest(request, 'ADMIN')
    const { id } = await params

    const role = await prisma.role.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    if (!role) {
      return apiNotFound('Role not found')
    }

    if (role.name === 'ADMIN') {
      return apiBadRequest('Cannot delete the ADMIN role')
    }

    if (role._count.users > 0) {
      return apiBadRequest(
        `Cannot delete role "${role.name}" because it has ${role._count.users} user(s) assigned. Reassign them first.`
      )
    }

    await prisma.role.delete({
      where: { id },
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
