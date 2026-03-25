import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { hashSync } from 'bcryptjs'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ─── 1. Super Admin ───
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'admin@ngoerp.com' },
    update: {},
    create: {
      email: 'admin@ngoerp.com',
      passwordHash: hashSync('SuperAdmin@2026', 10),
      fullName: 'System Administrator',
    },
  })
  console.log('✓ Super Admin created:', superAdmin.email)

  // ─── 2. Currencies ───
  const currencies = [
    { code: 'BDT' as const, name: 'Bangladeshi Taka', symbol: '৳', isBase: true },
    { code: 'USD' as const, name: 'US Dollar', symbol: '$', isBase: false },
    { code: 'EUR' as const, name: 'Euro', symbol: '€', isBase: false },
    { code: 'GBP' as const, name: 'British Pound', symbol: '£', isBase: false },
  ]

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    })
  }
  console.log('✓ Currencies seeded')

  // ─── 3. Subscription Plans ───
  const plans = [
    {
      name: 'Free',
      description: 'For small NGOs getting started',
      priceMonthly: 0,
      priceQuarterly: 0,
      priceYearly: 0,
      maxUsers: 3,
      maxProjects: 2,
      maxBeneficiaries: 500,
      storageGb: 1,
      bandwidthGb: 10,
      trialDays: 0,
      sortOrder: 0,
    },
    {
      name: 'Starter',
      description: 'For growing NGOs with basic needs',
      priceMonthly: 2999,
      priceQuarterly: 8549,
      priceYearly: 29870,
      maxUsers: 10,
      maxProjects: 5,
      maxBeneficiaries: 5000,
      storageGb: 5,
      bandwidthGb: 50,
      trialDays: 14,
      sortOrder: 1,
    },
    {
      name: 'Professional',
      description: 'For established NGOs with full operations',
      priceMonthly: 7999,
      priceQuarterly: 22797,
      priceYearly: 79670,
      maxUsers: 50,
      maxProjects: 25,
      maxBeneficiaries: 50000,
      storageGb: 25,
      bandwidthGb: 200,
      trialDays: 14,
      sortOrder: 2,
    },
    {
      name: 'Enterprise',
      description: 'For large NGOs with unlimited needs',
      priceMonthly: 19999,
      priceQuarterly: 56997,
      priceYearly: 199190,
      maxUsers: -1,
      maxProjects: -1,
      maxBeneficiaries: -1,
      storageGb: 100,
      bandwidthGb: 1000,
      trialDays: 30,
      sortOrder: 3,
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    })
  }
  console.log('✓ Subscription Plans seeded')

  // ─── 4. Platform Features ───
  const features = [
    { code: 'FINANCE', name: 'Finance & Accounting', module: 'finance' },
    { code: 'BUDGET', name: 'Budget Management', module: 'budget' },
    { code: 'DONOR_MANAGEMENT', name: 'Donor & Grant Management', module: 'donors' },
    { code: 'PROJECT_MANAGEMENT', name: 'Project Management', module: 'projects' },
    { code: 'BENEFICIARY', name: 'Beneficiary Management', module: 'beneficiaries' },
    { code: 'PROCUREMENT', name: 'Procurement & Supply Chain', module: 'procurement' },
    { code: 'FIXED_ASSETS', name: 'Fixed Asset Management', module: 'assets' },
    { code: 'HR', name: 'Human Resources', module: 'hr' },
    { code: 'MICROFINANCE', name: 'Microfinance (MFI)', module: 'microfinance' },
    { code: 'CUSTOM_REPORTS', name: 'Custom Report Builder', module: 'reports' },
    { code: 'API_ACCESS', name: 'REST API Access', module: 'system' },
    { code: 'MULTI_CURRENCY', name: 'Multi-Currency Support', module: 'finance' },
    { code: 'ETENDERING', name: 'eTendering', module: 'procurement' },
    { code: 'ADVANCED_HR', name: 'Advanced HR (Performance, Training)', module: 'hr' },
    { code: 'MRA_REPORTS', name: 'MRA Regulatory Reports', module: 'microfinance' },
    { code: 'NGOAB_REPORTS', name: 'NGOAB Compliance Reports', module: 'reports' },
    { code: 'WEBHOOKS', name: 'Webhook Integrations', module: 'system' },
    { code: 'DATA_EXPORT', name: 'Data Export & Retention', module: 'system' },
  ]

  for (const feature of features) {
    await prisma.platformFeature.upsert({
      where: { code: feature.code },
      update: {},
      create: feature,
    })
  }
  console.log('✓ Platform Features seeded')

  // ─── 5. System Permissions ───
  const modules = [
    'finance', 'budget', 'donors', 'projects', 'beneficiaries',
    'procurement', 'assets', 'hr', 'microfinance', 'reports', 'settings',
  ]

  const actions = ['read', 'create', 'update', 'delete', 'approve', 'export']

  const resources: Record<string, string[]> = {
    finance: ['accounts', 'journal-entries', 'vouchers', 'bank-accounts', 'bank-reconciliation', 'reports'],
    budget: ['budgets', 'revisions', 'cost-allocation'],
    donors: ['donors', 'grants', 'fund-receipts', 'fund-requisitions', 'reports'],
    projects: ['projects', 'activities', 'milestones', 'logframe', 'closeout'],
    beneficiaries: ['beneficiaries', 'enrollment', 'service-delivery', 'impact', 'grievances'],
    procurement: ['requisitions', 'orders', 'tenders', 'vendors', 'contracts', 'inventory', 'warehouses', 'goods-receipt'],
    assets: ['assets', 'categories', 'depreciation', 'transfers', 'maintenance', 'disposal'],
    hr: ['employees', 'departments', 'onboarding', 'attendance', 'leave', 'payroll', 'performance', 'training'],
    microfinance: ['branches', 'samity', 'loan-products', 'loan-applications', 'loan-accounts', 'disbursement', 'collection', 'repayments', 'savings', 'overdue', 'mra-reports'],
    reports: ['financial', 'ngoab', 'donor', 'project', 'hr', 'procurement', 'custom', 'audit-trail'],
    settings: ['organization', 'users', 'roles', 'workflows', 'notifications', 'system', 'backup', 'webhooks', 'data-export', 'data-retention', 'domain'],
  }

  let permCount = 0
  for (const mod of modules) {
    const modResources = resources[mod] || []
    for (const resource of modResources) {
      for (const action of actions) {
        await prisma.permission.upsert({
          where: {
            module_action_resource: { module: mod, action, resource },
          },
          update: {},
          create: {
            module: mod,
            action,
            resource,
            description: `${action} ${mod}/${resource}`,
          },
        })
        permCount++
      }
    }
  }
  console.log(`✓ ${permCount} Permissions seeded`)

  console.log('\n✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
