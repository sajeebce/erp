import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  donorId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.number().min(0).optional(),
  location: z.string().optional(),
  status: z.enum(['PIPELINE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED']).optional(),
})

export const activitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().uuid(),
  responsibleId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().min(0).optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional(),
})

export const milestoneSchema = z.object({
  description: z.string().min(1),
  projectId: z.string().uuid(),
  targetDate: z.string(),
  deliverable: z.string().optional(),
})
