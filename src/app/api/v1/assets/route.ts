import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiCreated,
  apiPaginated,
  apiBadRequest,
  handleRouteError,
  parsePaginationParams,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['STORE_MANAGER'])

    const url = new URL(request.url)
    const { page, limit, skip, search, sort, order } = parsePaginationParams(url)

    const where: Record<string, unknown> = {
      deletedAt: null,
      category: { organizationId: auth.organizationId },
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetNo: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const categoryId = url.searchParams.get('categoryId')
    if (categoryId) where.categoryId = categoryId

    const condition = url.searchParams.get('condition')
    if (condition) where.condition = condition

    const warehouseId = url.searchParams.get('warehouseId')
    if (warehouseId) where.warehouseId = warehouseId

    const projectId = url.searchParams.get('projectId')
    if (projectId) where.projectId = projectId

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        select: {
          id: true,
          assetNo: true,
          name: true,
          categoryId: true,
          purchaseDate: true,
          purchasePrice: true,
          serialNumber: true,
          condition: true,
          accumulatedDepreciation: true,
          netBookValue: true,
          warehouseId: true,
          projectId: true,
          isActive: true,
          createdAt: true,
          category: { select: { id: true, code: true, name: true } },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ])

    return apiPaginated(assets, total, page, limit)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleFromRequest(request, ['STORE_MANAGER'])
    const body = await request.json()

    const { name, categoryId, purchaseDate, purchasePrice, warehouseId, projectId } = body

    if (!name || !categoryId || !purchaseDate || purchasePrice === undefined) {
      return apiBadRequest('name, categoryId, purchaseDate, and purchasePrice are required')
    }

    // Validate category belongs to org
    const category = await prisma.assetCategory.findFirst({
      where: { id: categoryId, organizationId: auth.organizationId },
    })
    if (!category) {
      return apiBadRequest('Asset category not found in this organization')
    }

    // Validate warehouse belongs to org if provided
    if (warehouseId) {
      const wh = await prisma.warehouse.findFirst({
        where: { id: warehouseId, organizationId: auth.organizationId },
        select: { id: true },
      })
      if (!wh) return apiBadRequest('Warehouse not found in this organization')
    }

    // Validate project belongs to org if provided
    if (projectId) {
      const proj = await prisma.project.findFirst({
        where: { id: projectId, organizationId: auth.organizationId, deletedAt: null },
        select: { id: true },
      })
      if (!proj) return apiBadRequest('Project not found in this organization')
    }

    const assetNo = await generateNextNumber(auth.organizationId, 'asset')

    const asset = await prisma.asset.create({
      data: {
        assetNo,
        name: name.trim(),
        description: body.description || null,
        categoryId,
        purchaseDate: new Date(purchaseDate),
        purchasePrice: new Prisma.Decimal(purchasePrice),
        serialNumber: body.serialNumber || null,
        barcode: body.barcode || null,
        warehouseId: warehouseId || null,
        custodianId: body.custodianId || null,
        projectId: projectId || null,
        donorId: body.donorId || null,
        condition: body.condition || 'NEW',
        netBookValue: new Prisma.Decimal(purchasePrice),
        insuranceInfo: body.insuranceInfo || null,
        warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
        notes: body.notes || null,
      },
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'CREATE',
      module: 'asset',
      resource: 'asset',
      resourceId: asset.id,
      description: `Created asset "${name}" (${assetNo})`,
      newValues: { assetNo, name, purchasePrice, categoryId },
      ...auditCtx,
    })

    return apiCreated(asset)
  } catch (error) {
    return handleRouteError(error)
  }
}
