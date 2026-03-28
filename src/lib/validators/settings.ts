import { z } from 'zod'

export const organizationUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  localizedName: z.record(z.string(), z.string()).optional(),
  registrationNo: z.string().optional(),
  ngoabLicenseNo: z.string().optional(),
  mraLicenseNo: z.string().optional(),
  vatRegistrationNo: z.string().optional(),
  tin: z.string().optional(),
  address: z.string().optional(),
  district: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  baseCurrency: z.enum(['BDT', 'USD', 'EUR', 'GBP']).optional(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
  timezone: z.string().optional(),
})

export const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  roleId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
})

export const roleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export const domainSchema = z.object({
  customDomain: z.string().regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/, 'Invalid domain format'),
})

export const fiscalYearSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
})

export const mediaSettingSchema = z.object({
  provider: z.string().min(1),
  bucketName: z.string().min(1),
  endpoint: z.string().min(1),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  region: z.string().optional(),
  publicUrl: z.string().optional(),
  maxFileSizeMb: z.number().int().positive().optional(),
  allowedMimeTypes: z.string().optional(),
})
