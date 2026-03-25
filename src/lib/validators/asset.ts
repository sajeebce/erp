import { z } from 'zod'

export const assetCategorySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  usefulLifeYears: z.number().int().positive(),
  depreciationMethod: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE']).optional(),
  depreciationRate: z.number().min(0).max(100),
})

export const assetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  purchaseDate: z.string(),
  purchasePrice: z.number().positive(),
  serialNumber: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  custodianId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  donorId: z.string().uuid().optional(),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']).optional(),
})

export const assetTransferSchema = z.object({
  assetId: z.string().uuid(),
  fromLocation: z.string().min(1),
  toLocation: z.string().min(1),
  reason: z.string().optional(),
})

export const assetDisposalSchema = z.object({
  assetId: z.string().uuid(),
  method: z.enum(['SALE', 'AUCTION', 'SCRAP', 'DONATION', 'WRITE_OFF']),
  recoveryAmount: z.number().min(0).optional(),
  buyerInfo: z.string().optional(),
  reason: z.string().optional(),
})
