import { prisma } from '@/lib/db'

export const PROCUREMENT_ITEM_TYPES = ['INVENTORY', 'FIXED_ASSET', 'SERVICE_OR_EXPENSE'] as const

export type ProcurementItemTypeValue = (typeof PROCUREMENT_ITEM_TYPES)[number]

export interface ProcurementLineClassificationInput {
  itemType?: string | null
  inventoryItemId?: string | null
  warehouseId?: string | null
  assetCategoryId?: string | null
  accountId?: string | null
}

export interface ResolvedProcurementLineClassification {
  itemType: ProcurementItemTypeValue
  inventoryItemId: string | null
  warehouseId: string | null
  assetCategoryId: string | null
  accountId: string | null
}

export function normalizeProcurementItemType(value: unknown): ProcurementItemTypeValue {
  return PROCUREMENT_ITEM_TYPES.includes(value as ProcurementItemTypeValue)
    ? (value as ProcurementItemTypeValue)
    : 'SERVICE_OR_EXPENSE'
}

export async function resolveProcurementLineClassifications(
  organizationId: string,
  lines: ProcurementLineClassificationInput[]
): Promise<ResolvedProcurementLineClassification[]> {
  const normalized = lines.map((line) => ({
    itemType: normalizeProcurementItemType(line.itemType),
    inventoryItemId: line.inventoryItemId || null,
    warehouseId: line.warehouseId || null,
    assetCategoryId: line.assetCategoryId || null,
    accountId: line.accountId || null,
  }))

  const inventoryIds = [...new Set(normalized.map((line) => line.inventoryItemId).filter(Boolean) as string[])]
  const warehouseIds = [...new Set(normalized.map((line) => line.warehouseId).filter(Boolean) as string[])]
  const assetCategoryIds = [...new Set(normalized.map((line) => line.assetCategoryId).filter(Boolean) as string[])]
  const accountIds = [...new Set(normalized.map((line) => line.accountId).filter(Boolean) as string[])]

  const [inventoryItems, warehouses, assetCategories, accounts] = await Promise.all([
    inventoryIds.length
      ? prisma.inventoryItem.findMany({
          where: { id: { in: inventoryIds }, warehouse: { organizationId }, isActive: true },
          select: { id: true, warehouseId: true },
        })
      : Promise.resolve([]),
    warehouseIds.length
      ? prisma.warehouse.findMany({
          where: { id: { in: warehouseIds }, organizationId, isActive: true },
          select: { id: true },
        })
      : Promise.resolve([]),
    assetCategoryIds.length
      ? prisma.assetCategory.findMany({
          where: { id: { in: assetCategoryIds }, organizationId, isActive: true },
          select: { id: true },
        })
      : Promise.resolve([]),
    accountIds.length
      ? prisma.account.findMany({
          where: { id: { in: accountIds }, organizationId, isActive: true, deletedAt: null },
          select: { id: true },
        })
      : Promise.resolve([]),
  ])

  const inventoryById = new Map(inventoryItems.map((item) => [item.id, item]))
  const warehouseIdsFound = new Set(warehouses.map((warehouse) => warehouse.id))
  const assetCategoryIdsFound = new Set(assetCategories.map((category) => category.id))
  const accountIdsFound = new Set(accounts.map((account) => account.id))

  return normalized.map((line, index) => {
    const lineNo = index + 1

    if (line.inventoryItemId && !inventoryById.has(line.inventoryItemId)) {
      throw new Error(`Line ${lineNo}: inventory item not found or inactive`)
    }
    if (line.warehouseId && !warehouseIdsFound.has(line.warehouseId)) {
      throw new Error(`Line ${lineNo}: warehouse not found or inactive`)
    }
    if (line.assetCategoryId && !assetCategoryIdsFound.has(line.assetCategoryId)) {
      throw new Error(`Line ${lineNo}: asset category not found or inactive`)
    }
    if (line.accountId && !accountIdsFound.has(line.accountId)) {
      throw new Error(`Line ${lineNo}: account not found or inactive`)
    }

    if (line.itemType === 'INVENTORY' && !line.inventoryItemId) {
      throw new Error(`Line ${lineNo}: inventory item is required for inventory lines`)
    }
    if (line.itemType === 'FIXED_ASSET' && !line.assetCategoryId) {
      throw new Error(`Line ${lineNo}: asset category is required for fixed asset lines`)
    }

    const inventoryItem = line.inventoryItemId ? inventoryById.get(line.inventoryItemId) : null
    if (
      line.itemType === 'INVENTORY' &&
      line.warehouseId &&
      inventoryItem &&
      line.warehouseId !== inventoryItem.warehouseId
    ) {
      throw new Error(`Line ${lineNo}: warehouse does not match the selected inventory item`)
    }

    return {
      itemType: line.itemType,
      inventoryItemId: line.itemType === 'INVENTORY' ? line.inventoryItemId : null,
      warehouseId: line.itemType === 'INVENTORY'
        ? line.warehouseId || inventoryItem?.warehouseId || null
        : line.warehouseId,
      assetCategoryId: line.itemType === 'FIXED_ASSET' ? line.assetCategoryId : null,
      accountId: line.accountId,
    }
  })
}
