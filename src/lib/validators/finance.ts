import { z } from 'zod'

export const accountSchema = z.object({
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  nature: z.enum(['DEBIT', 'CREDIT']),
  parentId: z.string().uuid().optional().nullable(),
  level: z.number().int().min(1).max(5).optional(),
  isGroup: z.boolean().optional(),
  description: z.string().optional(),
  fundCode: z.string().optional(),
  projectId: z.string().uuid().optional().nullable(),
})

export const journalEntryLineSchema = z.object({
  accountId: z.string().uuid(),
  description: z.string().optional(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  projectId: z.string().uuid().optional(),
})

export const journalEntrySchema = z.object({
  date: z.string().or(z.date()),
  description: z.string().min(1),
  reference: z.string().optional(),
  fiscalYearId: z.string().uuid(),
  projectId: z.string().uuid().optional().nullable(),
  grantId: z.string().uuid().optional().nullable(),
  currencyCode: z.enum(['BDT', 'USD', 'EUR', 'GBP']).optional(),
  exchangeRate: z.number().positive().optional(),
  notes: z.string().optional(),
  lines: z.array(journalEntryLineSchema).min(2, 'At least 2 lines required'),
})

export const voucherSchema = z.object({
  type: z.enum(['DEBIT', 'RECEIPT', 'CASH', 'BANK', 'JOURNAL', 'CONTRA']),
  date: z.string().or(z.date()),
  description: z.string().min(1),
  amount: z.number().positive('Amount must be greater than 0'),
  payee: z.string().optional(),
  projectId: z.string().uuid().optional().nullable(),
  grantId: z.string().uuid().optional().nullable(),
  bankAccountId: z.string().uuid().optional().nullable(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional().nullable(),
  journalEntryId: z.string().uuid().optional().nullable(),
})

export const bankAccountSchema = z.object({
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  type: z.enum(['CURRENT', 'SAVINGS', 'FIXED_DEPOSIT', 'MOBILE_BANKING', 'CASH']),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  accountNumber: z.string().optional(),
  currencyCode: z.enum(['BDT', 'USD', 'EUR', 'GBP']).optional(),
  isMotherAccount: z.boolean().optional(),
  currentBalance: z.number().optional(),
  description: z.string().optional(),
})
