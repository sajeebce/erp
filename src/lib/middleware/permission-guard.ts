import { prisma } from '@/lib/db'

interface PermissionCheck {
  module: string
  action: string
  resource: string
}

export async function hasPermission(roleId: string, check: PermissionCheck): Promise<boolean> {
  const count = await prisma.rolePermission.count({
    where: {
      roleId,
      permission: {
        module: check.module,
        action: check.action,
        resource: check.resource,
      },
    },
  })
  return count > 0
}

export async function requirePermission(roleId: string, roleName: string, check: PermissionCheck): Promise<void> {
  // ADMIN role bypasses permission checks within their org
  if (roleName === 'ADMIN') return

  const allowed = await hasPermission(roleId, check)
  if (!allowed) {
    throw new Error(
      `Forbidden: Missing permission ${check.module}.${check.action}.${check.resource}`
    )
  }
}

export async function getRolePermissions(roleId: string): Promise<PermissionCheck[]> {
  const rolePerms = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  })

  return rolePerms.map((rp) => ({
    module: rp.permission.module,
    action: rp.permission.action,
    resource: rp.permission.resource,
  }))
}
