import { NextRequest } from 'next/server'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

// ─── Pre-defined donor budget templates (in-memory, read-only) ───

export interface BudgetTemplateCategory {
  name: string
  subCategories?: string[]
}

export interface BudgetTemplate {
  id: string
  name: string
  donor: string
  description: string
  isGlobal: boolean
  categories: BudgetTemplateCategory[]
  indirectCostRate: number | null
  indirectCostBase: string | null
  notes: string | null
}

export const DONOR_TEMPLATES: BudgetTemplate[] = [
  {
    id: 'tpl-usaid',
    name: 'USAID Standard',
    donor: 'USAID',
    description: 'Standard USAID budget format with NICRA-compliant indirect cost categories',
    isGlobal: true,
    categories: [
      { name: 'Personnel & Fringe', subCategories: ['International Staff', 'Local Staff', 'Fringe Benefits', 'Consultants'] },
      { name: 'Travel', subCategories: ['International Travel', 'Domestic Travel', 'Per Diem'] },
      { name: 'Equipment', subCategories: ['IT Equipment', 'Field Equipment', 'Vehicles'] },
      { name: 'Supplies', subCategories: ['Office Supplies', 'Program Supplies', 'Medical Supplies'] },
      { name: 'Contractual', subCategories: ['Sub-awards', 'Contracts', 'Professional Services'] },
      { name: 'Other Direct', subCategories: ['Communications', 'Printing', 'Insurance', 'Audit'] },
      { name: 'Indirect Costs', subCategories: ['NICRA Applied'] },
    ],
    indirectCostRate: 12.5,
    indirectCostBase: 'MTDC',
    notes: 'Follows USAID ADS 303 / 2 CFR 200 cost principles. NICRA rate negotiated with cognizant agency.',
  },
  {
    id: 'tpl-eu',
    name: 'EU Annex III',
    donor: 'European Union',
    description: 'EU external actions budget format per Annex III guidelines',
    isGlobal: true,
    categories: [
      { name: 'Human Resources', subCategories: ['Salaries', 'Per Diems', 'Consultants'] },
      { name: 'Travel', subCategories: ['International', 'Local Transport'] },
      { name: 'Equipment & Supplies', subCategories: ['Vehicles', 'Furniture', 'IT Equipment', 'Supplies'] },
      { name: 'Local Office', subCategories: ['Vehicle Costs', 'Office Rent', 'Consumables', 'Communications'] },
      { name: 'Other Costs', subCategories: ['Publications', 'Studies', 'Translation', 'Financial Services'] },
      { name: 'Other Services', subCategories: ['Sub-granting', 'Audits', 'Evaluation'] },
      { name: 'Indirect Costs', subCategories: ['Flat Rate 7%'] },
    ],
    indirectCostRate: 7,
    indirectCostBase: 'TOTAL_DIRECT',
    notes: 'Maximum 7% indirect cost rate on eligible direct costs per EU regulations.',
  },
  {
    id: 'tpl-dfid',
    name: 'DFID/FCDO',
    donor: 'DFID/FCDO',
    description: 'UK FCDO (formerly DFID) budget format for development projects',
    isGlobal: true,
    categories: [
      { name: 'Staff Costs', subCategories: ['UK Staff', 'In-country Staff', 'Short-term Experts'] },
      { name: 'Activity Costs', subCategories: ['Programme Activities', 'Community Engagement', 'Capacity Building'] },
      { name: 'Travel', subCategories: ['International Flights', 'In-country Travel', 'Subsistence'] },
      { name: 'Equipment', subCategories: ['IT Equipment', 'Programme Equipment'] },
      { name: 'Monitoring & Evaluation', subCategories: ['Baseline', 'Mid-term Review', 'Endline', 'Data Collection'] },
      { name: 'Management & Administration', subCategories: ['Office Costs', 'Finance & HR', 'Governance'] },
      { name: 'Contingency', subCategories: ['General Contingency'] },
    ],
    indirectCostRate: 10,
    indirectCostBase: 'TOTAL_DIRECT',
    notes: 'FCDO allows up to 10% overhead. Value for Money (VfM) framework: economy, efficiency, effectiveness, equity.',
  },
  {
    id: 'tpl-generic',
    name: 'Generic NGO',
    donor: 'Generic',
    description: 'Versatile NGO budget template suitable for most donors and internal budgets',
    isGlobal: true,
    categories: [
      { name: 'Personnel', subCategories: ['International Staff', 'National Staff', 'Consultants', 'Volunteers', 'Fringe Benefits'] },
      { name: 'Operations', subCategories: ['Office Supplies', 'Communications', 'Utilities', 'Insurance', 'Bank Charges'] },
      { name: 'Equipment', subCategories: ['IT Equipment', 'Field Equipment', 'Vehicles', 'Furniture'] },
      { name: 'Travel', subCategories: ['International Travel', 'Domestic Travel', 'Per Diem', 'Ground Transport'] },
      { name: 'Training', subCategories: ['Workshops', 'Materials', 'Venue & Catering', 'Facilitators'] },
      { name: 'Admin', subCategories: ['Office Rent', 'Audit Fees', 'Legal Services', 'Publications'] },
      { name: 'M&E', subCategories: ['Surveys', 'Evaluations', 'Data Collection', 'Reporting'] },
      { name: 'Contingency', subCategories: ['General Contingency'] },
    ],
    indirectCostRate: null,
    indirectCostBase: null,
    notes: 'Flexible template matching standard NGO budget categories. Customize ICR per donor requirements.',
  },
]

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    // Return all global templates (in-memory, no DB model needed)
    return apiSuccess(DONOR_TEMPLATES)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    const body = await request.json()
    const { name, categories } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return apiBadRequest('Template name is required')
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return apiBadRequest('Categories must be a non-empty JSON array')
    }

    // Validate each category has a name
    for (let i = 0; i < categories.length; i++) {
      if (!categories[i].name || typeof categories[i].name !== 'string') {
        return apiBadRequest(`Category ${i + 1}: name is required`)
      }
    }

    // Since there is no BudgetTemplate model, return the validated template
    // as a transient object. Custom templates would require a DB model.
    const template: BudgetTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: name.trim(),
      donor: body.donor || 'Custom',
      description: body.description || '',
      isGlobal: false,
      categories,
      indirectCostRate: body.indirectCostRate ?? null,
      indirectCostBase: body.indirectCostBase ?? null,
      notes: body.notes ?? null,
    }

    return apiSuccess(template)
  } catch (error) {
    return handleRouteError(error)
  }
}
