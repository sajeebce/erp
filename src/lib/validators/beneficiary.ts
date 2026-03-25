import { z } from 'zod'

export const beneficiarySchema = z.object({
  name: z.string().min(1),
  fatherSpouseName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  age: z.number().int().positive().optional(),
  gender: z.string().optional(),
  nidNumber: z.string().optional(),
  phone: z.string().optional(),
  division: z.string().optional(),
  district: z.string().optional(),
  upazila: z.string().optional(),
  union: z.string().optional(),
  village: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const enrollmentSchema = z.object({
  beneficiaryId: z.string().uuid(),
  projectId: z.string().uuid(),
  programName: z.string().min(1),
  enrollmentDate: z.string(),
  servicesAssigned: z.string().optional(),
})

export const serviceDeliverySchema = z.object({
  beneficiaryId: z.string().uuid(),
  projectId: z.string().uuid(),
  serviceType: z.string().min(1),
  date: z.string(),
  location: z.string().optional(),
  deliveredById: z.string().uuid().optional(),
  quantity: z.number().optional(),
  value: z.number().optional(),
  notes: z.string().optional(),
})

export const grievanceSchema = z.object({
  date: z.string(),
  beneficiaryId: z.string().uuid().optional(),
  complainantName: z.string().min(1),
  category: z.enum(['SERVICE_QUALITY', 'STAFF_BEHAVIOR', 'ELIGIBILITY', 'DELAY', 'CORRUPTION', 'OTHER']),
  description: z.string().min(1),
  severity: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
})
