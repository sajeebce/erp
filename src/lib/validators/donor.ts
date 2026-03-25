import { z } from 'zod'

export const donorSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['BILATERAL', 'MULTILATERAL', 'FOUNDATION', 'CORPORATE', 'INDIVIDUAL', 'GOVERNMENT', 'INGO']),
  country: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export const grantSchema = z.object({
  title: z.string().min(1),
  donorId: z.string().uuid(),
  awardAmount: z.number().positive(),
  currencyCode: z.enum(['BDT', 'USD', 'EUR', 'GBP']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export const fundReceiptSchema = z.object({
  date: z.string(),
  grantId: z.string().uuid(),
  amount: z.number().positive(),
  currencyCode: z.enum(['BDT', 'USD', 'EUR', 'GBP']).optional(),
  exchangeRate: z.number().positive().optional(),
  bankAccountId: z.string().uuid(),
  bankReference: z.string().optional(),
  notes: z.string().optional(),
})

export const fundRequisitionSchema = z.object({
  date: z.string(),
  grantId: z.string().uuid(),
  projectId: z.string().uuid(),
  amount: z.number().positive(),
  purpose: z.string().min(1),
  notes: z.string().optional(),
})
