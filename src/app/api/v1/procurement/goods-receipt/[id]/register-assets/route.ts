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

    // Verify GRN belongs to org and is ACCEPTED
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

    if (grn.status !== 'ACCEPTED') {
      return apiForbidden('Assets can only be registered from ACCEPTED goods receipts')
    }

    const body = await request.json()
    const { lines } = body as { lines: AssetLineInput[] }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return apiBadRequest('At least one asset line is required')
    }

    // Validate all GRN line IDs belong to this GRN
    const grnLineIds = new Set(grn.lines.map((l) => l.id))
    for (const line of lines) {
      if (!grnLineIds.has(line.grnLineId)) {
        return apiBadRequest(`GRN line ${line.grnLineId} does not belong to this receipt`)
      }
      if (!line.categoryId) return apiBadRequest('categoryId is required for each line')
      if (!line.name) return apiBadRequest('name is required for each line')
      if (!line.quantity || line.quantity < 1) return apiBadRequest('quantity must be at least 1')
      if (line.unitPrice === undefined || line.unitPrice < 0) return apiBadRequest('unitPrice is required')
      if (!line.purchaseDate) return apiBadRequest('purchaseDate is required')
    }

    // Validate all categories belong to org
    const categoryIds = [...new Set(lines.map((l) => l.categoryId))]
    const categories = await prisma.assetCategory.findMany({
      where: { id: { in: categoryIds }, organizationId: auth.organizationId },
      select: { id: true },
    })
    if (categories.length !== categoryIds.length) {
      return apiBadRequest('One or more asset categories not found in this organization')
    }

    const createdAssets: { assetNo: string; id: string; name: string }[] = []
    const auditCtx = getAuditContext(request)

    for (const line of lines) {
      const qty = Number(line.quantity)
      const serialNumbers: string[] = line.serialNumbers ?? []

      for (let i = 0; i < qty; i++) {
        const assetNo = await generateNextNumber(auth.organizationId, 'asset')
        const serial = serialNumbers[i] ?? null

        const asset = await prisma.asset.create({
          data: {
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
          },
        })

        createdAssets.push({ assetNo: asset.assetNo, id: asset.id, name: asset.name })

        await logAudit({
          organizationId: auth.organizationId,
          userId: auth.userId,
          action: 'CREATE',
          module: 'ASSETS',
          resource: 'Asset',
          resourceId: asset.id,
          description: `Asset ${assetNo} registered from GRN ${grn.grnNo}`,
          newValues: { assetNo, name: line.name, categoryId: line.categoryId, grnId: id },
          ...auditCtx,
        })
      }
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
