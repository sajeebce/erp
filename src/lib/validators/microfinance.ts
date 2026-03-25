import { z } from 'zod'

export const loanProductSchema = z.object({
  productCode: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['INCOME_GENERATING', 'AGRICULTURE', 'EDUCATION', 'HOUSING', 'EMERGENCY', 'SEASONAL', 'ENTERPRISE']),
  minAmount: z.number().positive(),
  maxAmount: z.number().positive(),
  interestRate: z.number().min(0).max(24, 'Interest rate cannot exceed MRA limit of 24%'),
  interestMethod: z.enum(['FLAT', 'DECLINING_BALANCE']).optional(),
  maxDurationMonths: z.number().int().positive(),
  repaymentFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  gracePeriodDays: z.number().int().min(0).optional(),
  serviceCharge: z.number().min(0).optional(),
})

export const loanApplicationSchema = z.object({
  memberId: z.string().uuid(),
  productId: z.string().uuid(),
  amountRequested: z.number().positive(),
  purpose: z.string().min(1),
  durationMonths: z.number().int().positive(),
})

export const savingsTransactionSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  amount: z.number().positive(),
  notes: z.string().optional(),
})

export const repaymentSchema = z.object({
  loanAccountId: z.string().uuid(),
  principalAmount: z.number().min(0),
  interestAmount: z.number().min(0),
  totalAmount: z.number().positive(),
  penaltyAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
})
