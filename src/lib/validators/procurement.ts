import { z } from 'zod'

export const vendorSchema = z.object({
  companyName: z.string().min(1),
  category: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  tin: z.string().optional(),
  notes: z.string().optional(),
})

export const purchaseRequisitionLineSchema = z.object({
  description: z.string().min(1),
  specification: z.string().optional(),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  estimatedPrice: z.number().positive(),
})

export const purchaseRequisitionSchema = z.object({
  projectId: z.string().uuid().optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).optional(),
  justification: z.string().optional(),
  lines: z.array(purchaseRequisitionLineSchema).min(1),
})

export const purchaseOrderLineSchema = z.object({
  description: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  prLineId: z.string().uuid().optional(),
})

export const purchaseOrderSchema = z.object({
  vendorId: z.string().uuid(),
  deliveryDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(purchaseOrderLineSchema).min(1),
})
