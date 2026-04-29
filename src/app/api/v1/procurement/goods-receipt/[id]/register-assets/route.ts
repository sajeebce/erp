import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRoleFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import { generateNextNumber } from '@/lib/number-sequence'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiForbidden,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface AssetLineInput {
  grnLineId: string
  categoryId: string
  name: string
  quantity: number
  unitPrice: number
  purchaseDate: string
  warehouseId?: string
  serialNumbers?: string[]
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRoleFromRequest(request, ['STORE_MANAGER'])
    const { id } = await params

    // Verify GRN belongs to org and has accepted fixed-asset quantities.
    const grn = await prisma.goodsReceipt.findFirst({
      where: {
        id,
        vendor: { organizationId: auth.organizationId },
      },
      include: {
        lines: true,
        purchaseOrder: { select: { poNo: true } },
      },
    })

    if (!grn) {
      return apiNotFound('Goods receipt not found')
    }

    if (grn.status !== 'ACCEPTED' && grn.status !== 'PARTIAL') {
      return apiForbidden('Assets can only be registered from ACCEPTED or PARTIAL goods receipts')
    }

    const body = await request.json()
    const { lines } = body as { lines: AssetLineInput[] }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return apiBadRequest('At least one asset line is required')
    }

    // Validate all GRN line IDs belong to this GRN and are fixed asset lines.
    const grnLineById = new Map(grn.lines.map((l) => [l.id, l]))
    for (const line of lines) {
      const grnLine = grnLineById.get(line.grnLineId)
      if (!grnLine) {
        return apiBadRequest(`GRN line ${line.grnLineId} does not belong to this receipt`)
      }
      if (grnLine.itemType !== 'FIXED_ASSET') {
        return apiBadRequest(`GRN line ${line.grnLineId} is not a fixed asset line`)
      }
      if (!line.categoryId) return apiBadRequest('categoryId is required for each line')
      if (!line.name) return apiBadRequest('name is required for each line')
      if (!Number.isInteger(Number(line.quantity)) || Number(line.quantity) < 1) {
        return apiBadRequest('quantity must be a whole number of at least 1')
      }
      if (line.unitPrice === undefined || line.unitPrice < 0) return apiBadRequest('unitPrice is required')
      if (!line.purchaseDate) return apiBadRequest('purchaseDate is required')
      if ((line.serialNumbers?.length ?? 0) > Number(line.quantity)) {
        return apiBadRequest('serialNumbers cannot exceed quantity')
      }
    }

    const requestedLineIds = [...new Set(lines.map((l) => l.grnLineId))]

    const existingAssets = await prisma.asset.findMany({
      where: {
        sourceModule: 'PROCUREMENT_GRN',
        sourceId: id,
        sourceLineId: { in: requestedLineIds },
        deletedAt: null,
      },
      select: {
        sourceLineId: true,
        sourceUnitIndex: true,
      },
    })

    const usedIndexesByLine = new Map<string, Set<number>>()
    for (const asset of existingAssets) {
      if (!asset.sourceLineId || asset.sourceUnitIndex === null) continue
      const usedIndexes = usedIndexesByLine.get(asset.sourceLineId) ?? new Set<number>()
      usedIndexes.add(asset.sourceUnitIndex)
      usedIndexesByLine.set(asset.sourceLineId, usedIndexes)
    }

    for (const line of lines) {
      const grnLine = grnLineById.get(line.grnLineId)!
      const acceptedQty = Number(grnLine.quantityAccepted)
      if (!Number.isInteger(acceptedQty)) {
        return apiBadRequest(`Accepted quantity for GRN line ${line.grnLineId} must be a whole number before asset registration`)
      }

      const usedCount = usedIndexesByLine.get(line.grnLineId)?.size ?? 0
      const remainingQty = acceptedQty - usedCount
      if (Number(line.quantity) > remainingQty) {
        return apiBadRequest(
          `GRN line ${line.grnLineId} has ${remainingQty} unregistered accepted asset unit(s) remaining`
        )
      }
    }

    // Validate all categories belong to org.
    const categoryIds = [...new Set(lines.map((l) => l.categoryId))]
    const categories = await prisma.assetCategory.findMany({
      where: { id: { in: categoryIds }, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (categories.length !== categoryIds.length) {
      return apiBadRequest('One or more asset categories not found in this organization')
    }

    const warehouseIds = [
      ...new Set(lines.map((l) => l.warehouseId).filter((warehouseId): warehouseId is string => Boolean(warehouseId))),
    ]
    if (warehouseIds.length > 0) {
      const warehouses = await prisma.warehouse.findMany({
        where: { id: { in: warehouseIds }, organizationId: auth.organizationId },
        select: { id: true },
      })
      if (warehouses.length !== warehouseIds.length) {
        return apiBadRequest('One or more warehouses not found in this organization')
      }
    }

    const plannedAssets: Array<{
      assetNo: string
      name: string
      categoryId: string
      purchaseDate: Date
      purchasePrice: Prisma.Decimal
      netBookValue: Prisma.Decimal
      serialNumber: string | null
      warehouseId: string | null
      condition: 'NEW'
      notes: string
      sourceModule: string
      sourceId: string
      sourceLineId: string
      sourceUnitIndex: number
    }> = []
    const auditCtx = getAuditContext(request)

    for (const line of lines) {
      const qty = Number(line.quantity)
      const serialNumbers: string[] = line.serialNumbers ?? []
      const usedIndexes = usedIndexesByLine.get(line.grnLineId) ?? new Set<number>()

      for (let i = 0; i < qty; i++) {
        const assetNo = await generateNextNumber(auth.organizationId, 'asset')
        const serial = serialNumbers[i] ?? null
        let sourceUnitIndex = 1
        while (usedIndexes.has(sourceUnitIndex)) sourceUnitIndex += 1

        plannedAssets.push({
          assetNo,
          name: line.name.trim(),
          categoryId: line.categoryId,
          purchaseDate: new Date(line.purchaseDate),
          purchasePrice: new Prisma.Decimal(line.unitPrice),
          netBookValue: new Prisma.Decimal(line.unitPrice),
          serialNumber: serial,
          warehouseId: line.warehouseId ?? null,
          condition: 'NEW',
          notes: `Registered from GRN ${grn.grnNo}`,
          sourceModule: 'PROCUREMENT_GRN',
          sourceId: id,
          sourceLineId: line.grnLineId,
          sourceUnitIndex,
        })

        usedIndexes.add(sourceUnitIndex)
        usedIndexesByLine.set(line.grnLineId, usedIndexes)
      }
    }

    const assets = await prisma.$transaction(
      plannedAssets.map((asset) =>
        prisma.asset.create({
          data: asset,
        })
      )
    )

    const createdAssets = assets.map((asset) => ({
      assetNo: asset.assetNo,
      id: asset.id,
      name: asset.name,
      sourceLineId: asset.sourceLineId as string,
      sourceUnitIndex: asset.sourceUnitIndex as number,
    }))

    for (const asset of assets) {
      await logAudit({
        organizationId: auth.organizationId,
        userId: auth.userId,
        action: 'CREATE',
        module: 'ASSETS',
        resource: 'Asset',
        resourceId: asset.id,
        description: `Asset ${asset.assetNo} registered from GRN ${grn.grnNo}`,
        newValues: {
          assetNo: asset.assetNo,
          name: asset.name,
          categoryId: asset.categoryId,
          grnId: id,
          grnLineId: asset.sourceLineId,
          sourceUnitIndex: asset.sourceUnitIndex,
        },
        ...auditCtx,
      })
    }

    return apiSuccess({
      grnNo: grn.grnNo,
      assetsCreated: createdAssets.length,
      assets: createdAssets,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
