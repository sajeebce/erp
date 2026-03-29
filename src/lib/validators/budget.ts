import { z } from 'zod'

export const budgetLineSchema = z.object({
  accountId: z.string().uuid(),
  category: z.string().min(1),
  subCategory: z.string().optional(),
  description: z.string().min(1),
  unit: z.string().optional(),
  quantity: z.number().positive(),
  unitCost: z.number().min(0),
  totalAmount: z.number().positive(),
  levelOfEffort: z.number().min(0).max(100).optional(),
  duration: z.number().int().positive().optional(),
  donorShare: z.number().min(0).optional(),
  costShare: z.number().min(0).optional(),
  narrative: z.string().optional(),
  notes: z.string().optional(),
})

export const budgetSchema = z.object({
  name: z.string().min(1),
  budgetType: z.enum(['PROJECT', 'CORE', 'PROGRAM', 'OPERATIONAL', 'PROPOSAL']).optional(),
  projectId: z.string().uuid(),
  grantId: z.string().uuid().optional(),
  fiscalYearId: z.string().uuid(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  periodType: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'CUSTOM']).optional(),
  totalAmount: z.number().positive(),
  currencyCode: z.enum(['BDT', 'USD', 'EUR', 'GBP']).optional(),
  exchangeRate: z.number().positive().optional(),

  // Indirect Cost Rate
  indirectCostRate: z.number().min(0).max(100).optional(),
  indirectCostBase: z.enum(['TOTAL_DIRECT', 'MTDC', 'PERSONNEL']).optional(),

  // Cost Sharing
  costShareRequired: z.boolean().optional(),
  costSharePercent: z.number().min(0).max(100).optional(),

  // Controls
  budgetCeiling: z.number().positive().optional(),
  varianceThreshold: z.number().min(0).max(100).optional(),

  // Narratives
  narrative: z.string().optional(),
  assumptions: z.string().optional(),

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
