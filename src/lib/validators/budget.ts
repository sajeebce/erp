import { z } from 'zod'

export const budgetLineSchema = z.object({
  accountId: z.string().uuid(),
  category: z.string().min(1),
  description: z.string().min(1),
  unit: z.string().optional(),
  quantity: z.number().positive(),
  unitCost: z.number().positive(),
  totalAmount: z.number().positive(),
  notes: z.string().optional(),
})

export const budgetSchema = z.object({
  name: z.string().min(1),
  projectId: z.string().uuid(),
  grantId: z.string().uuid().optional(),
  fiscalYearId: z.string().uuid(),
  totalAmount: z.number().positive(),
  currencyCode: z.enum(['BDT', 'USD', 'EUR', 'GBP']).optional(),
  notes: z.string().optional(),
  lines: z.array(budgetLineSchema).min(1, 'At least 1 budget line required'),
})

export const budgetRevisionLineSchema = z.object({
  budgetLineId: z.string().uuid(),
  revisedAmount: z.number().min(0),
})

export const budgetRevisionSchema = z.object({
  budgetId: z.string().uuid(),
  reason: z.string().min(1),
  lines: z.array(budgetRevisionLineSchema).min(1),
})

export const costAllocationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  totalAmount: z.number().positive(),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY']).optional(),
})
