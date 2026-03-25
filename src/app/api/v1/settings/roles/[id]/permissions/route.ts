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

    // Verify role belongs to this org
    const role = await prisma.role.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    })

    if (!role) {
      return apiNotFound('Role not found')
    }

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: id },
      include: {
        permission: true,
      },
    })

    const permissions = rolePermissions.map((rp) => ({
      id: rp.permission.id,
      module: rp.permission.module,
      action: rp.permission.action,
      resource: rp.permission.resource,
      description: rp.permission.description,
    }))

    return apiSuccess(permissions)
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

    // Verify role belongs to this org
    const role = await prisma.role.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    })

    if (!role) {
      return apiNotFound('Role not found')
    }

    const body = await request.json()
    const { permissionIds } = body

    if (!Array.isArray(permissionIds)) {
      return apiBadRequest('permissionIds must be an array')
    }

    // Validate all permission IDs exist
    if (permissionIds.length > 0) {
      const validPermissions = await prisma.permission.findMany({
        where: {
          id: { in: permissionIds },
        },
        select: { id: true },
      })

      const validIds = new Set(validPermissions.map((p) => p.id))
      const invalidIds = permissionIds.filter((pid: string) => !validIds.has(pid))

      if (invalidIds.length > 0) {
        return apiBadRequest(`Invalid permission IDs: ${invalidIds.join(', ')}`)
      }
    }

    // Transaction: delete all existing, then create new ones
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      })

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId: id,
            permissionId,
          })),
        })
      }
    })

    // Fetch updated permissions
    const updatedPermissions = await prisma.rolePermission.findMany({
      where: { roleId: id },
      include: {
        permission: true,
      },
    })

    const permissions = updatedPermissions.map((rp) => ({
      id: rp.permission.id,
      module: rp.permission.module,
      action: rp.permission.action,
      resource: rp.permission.resource,
      description: rp.permission.description,
    }))

    return apiSuccess(permissions)
  } catch (error) {
    return handleRouteError(error)
  }
}
