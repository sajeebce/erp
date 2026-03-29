import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projectType: z.enum(['HUMANITARIAN', 'DEVELOPMENT', 'ADVOCACY', 'CAPACITY_BUILDING', 'RESEARCH', 'EMERGENCY_RESPONSE', 'CORE_OPERATIONS', 'MULTI_COUNTRY']).optional(),
  sector: z.enum(['WASH', 'EDUCATION', 'HEALTH', 'LIVELIHOODS', 'FOOD_SECURITY', 'PROTECTION', 'SHELTER', 'NUTRITION', 'AGRICULTURE', 'CLIMATE_ADAPTATION', 'GOVERNANCE', 'GENDER_EQUALITY', 'DISASTER_RISK_REDUCTION', 'MULTI_SECTOR', 'OTHER']).optional(),
  donorId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.number().min(0).optional(),
  currency: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  location: z.string().optional(),
  implementingPartner: z.string().optional(),
  status: z.enum(['PIPELINE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED']).optional(),
  managerId: z.string().uuid().optional(),
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

export const indicatorSchema = z.object({
  name: z.string().min(1),
  projectId: z.string().uuid(),
  description: z.string().optional(),
  type: z.enum(['QUANTITATIVE', 'QUALITATIVE']).optional(),
  unit: z.string().optional(),
  baselineValue: z.number().optional(),
  baselineDate: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY', 'END_OF_PROJECT']).optional(),
  dataSource: z.string().optional(),
  responsible: z.string().optional(),
  disaggregation: z.string().optional(),
})

export const riskSchema = z.object({
  title: z.string().min(1),
  projectId: z.string().uuid(),
  description: z.string().optional(),
  category: z.enum(['FINANCIAL', 'OPERATIONAL', 'SECURITY', 'POLITICAL', 'ENVIRONMENTAL', 'REPUTATIONAL', 'COMPLIANCE', 'TECHNICAL']).optional(),
  likelihood: z.enum(['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']).optional(),
  impact: z.enum(['NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'CRITICAL']).optional(),
  mitigation: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(['OPEN', 'MITIGATED', 'CLOSED', 'MATERIALIZED']).optional(),
  reviewDate: z.string().optional(),
})
