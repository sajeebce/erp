/**
 * Assigns default permissions to CSS demo roles.
 * Run after prisma/seed.ts because that file creates the Permission catalog.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

type PermissionRule = {
  module: string
  resources?: string[]
  actions?: string[]
}

const ROLE_PERMISSION_RULES: Record<string, PermissionRule[] | 'ALL'> = {
  ADMIN: 'ALL',
  STAFF: [
    { module: 'procurement', resources: ['requisitions'], actions: ['read', 'create', 'update'] },
    { module: 'reports', resources: ['procurement'], actions: ['read', 'export'] },
  ],
  STORE_MANAGER: [
    {
      module: 'procurement',
      resources: ['orders', 'inventory', 'warehouses', 'goods-receipt', 'vendors'],
      actions: ['read', 'create', 'update', 'export'],
    },
    { module: 'assets', resources: ['assets', 'categories', 'transfers', 'maintenance'], actions: ['read', 'create', 'update', 'export'] },
    { module: 'reports', resources: ['procurement', 'audit-trail'], actions: ['read', 'export'] },
  ],
  PROGRAM_COORDINATOR: [
    { module: 'procurement', resources: ['requisitions'], actions: ['read', 'approve', 'export'] },
    { module: 'projects', actions: ['read', 'export'] },
    { module: 'reports', resources: ['project', 'procurement'], actions: ['read', 'export'] },
  ],
  FINANCE_MANAGER: [
    { module: 'finance', actions: ['read', 'create', 'update', 'approve', 'export'] },
    { module: 'budget', actions: ['read', 'create', 'update', 'approve', 'export'] },
    { module: 'donors', resources: ['fund-receipts', 'fund-requisitions', 'reports'], actions: ['read', 'approve', 'export'] },
    { module: 'procurement', resources: ['requisitions'], actions: ['read', 'approve', 'export'] },
    { module: 'reports', resources: ['financial', 'donor', 'audit-trail'], actions: ['read', 'export'] },
  ],
  EXECUTIVE_DIRECTOR: [
    { module: 'finance', resources: ['vouchers', 'reports'], actions: ['read', 'approve', 'export'] },
    { module: 'budget', resources: ['budgets', 'revisions'], actions: ['read', 'approve', 'export'] },
    { module: 'donors', actions: ['read', 'approve', 'export'] },
    { module: 'procurement', resources: ['requisitions', 'orders'], actions: ['read', 'approve', 'export'] },
    { module: 'reports', actions: ['read', 'export'] },
  ],
  PROJECT_MANAGER: [
    { module: 'projects', actions: ['read', 'create', 'update', 'export'] },
    { module: 'budget', resources: ['budgets'], actions: ['read', 'export'] },
    { module: 'donors', resources: ['donors', 'grants'], actions: ['read'] },
    { module: 'reports', resources: ['project'], actions: ['read', 'export'] },
  ],
  HR: [
    { module: 'hr', actions: ['read', 'create', 'update', 'approve', 'export'] },
    { module: 'reports', resources: ['hr', 'audit-trail'], actions: ['read', 'export'] },
  ],
}

function matchesRule(
  permission: { module: string; resource: string; action: string },
  rule: PermissionRule
) {
  if (permission.module !== rule.module) return false
  if (rule.resources && !rule.resources.includes(permission.resource)) return false
  if (rule.actions && !rule.actions.includes(permission.action)) return false
  return true
}

async function main() {
  console.log('=== CSS role permission seed ===')

  const org = await prisma.organization.findUnique({
    where: { slug: 'cssbd' },
    select: { id: true },
  })

  if (!org) {
    console.log('CSS organization not found. Exiting.')
    return
  }

  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({ where: { organizationId: org.id }, select: { id: true, name: true } }),
    prisma.permission.findMany({ select: { id: true, module: true, resource: true, action: true } }),
  ])

  for (const role of roles) {
    const rules = ROLE_PERMISSION_RULES[role.name]
    if (!rules) continue

    const selectedPermissions =
      rules === 'ALL'
        ? permissions
        : permissions.filter((permission) => rules.some((rule) => matchesRule(permission, rule)))

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })

    if (selectedPermissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: selectedPermissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      })
    }

    console.log(`${role.name}: ${selectedPermissions.length} permissions`)
  }

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error('Role permission seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
