import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiCreated,
  apiSuccess,
  apiBadRequest,
  apiConflict,
  handleRouteError,
} from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['STORE_MANAGER'])

    const warehouses = await prisma.warehouse.findMany({
      where: { organizationId: auth.organizationId },
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        capacity: true,
        managerId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { inventoryItems: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return apiSuccess(warehouses)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['STORE_MANAGER'])
    const body = await request.json()

    const { code, name, location, capacity, managerId, phone } = body

    if (!code || !name || !location) {
      return apiBadRequest('code, name, and location are required')
    }

    // Validate code unique in org
    const existing = await prisma.warehouse.findFirst({
      where: {
        organizationId: auth.organizationId,
        code: code.trim().toUpperCase(),
      },
    })

    if (existing) {
      return apiConflict(`Warehouse code "${code}" already exists in your organization`)
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId: auth.organizationId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        location: location.trim(),
        capacity: capacity || null,
        managerId: managerId || null,
        phone: phone || null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        location: true,
        capacity: true,
        managerId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const audit = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'PROCUREMENT',
      resource: 'Warehouse',
      resourceId: warehouse.id,
      description: `Created warehouse ${code}`,
      ...audit,
    })

    return apiCreated(warehouse)
  } catch (error) {
    return handleRouteError(error)
  }
}
