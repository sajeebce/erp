/**
 * Phase 3 Seed: Donors, Grants, Projects, Budgets, Fund Receipts
 * Run after main seed: npx tsx prisma/seed-phase3.ts
 * Requires an existing org (shapla-foundation)
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding Phase 3 data...')

  // Get existing org
  const org = await prisma.organization.findUnique({ where: { slug: 'shapla-foundation' } })
  if (!org) throw new Error('Organization "shapla-foundation" not found. Run main seed first.')

  const adminUser = await prisma.user.findFirst({ where: { organizationId: org.id, role: { name: 'ADMIN' } } })
  if (!adminUser) throw new Error('Admin user not found')

  const fy = await prisma.fiscalYear.findFirst({ where: { organizationId: org.id, isCurrent: true } })
  if (!fy) throw new Error('Fiscal year not found. Create one first via API.')

  // ─── 1. Donors ───
  const donors = await Promise.all([
    prisma.donor.create({
      data: {
        organizationId: org.id,
        name: 'USAID',
        type: 'BILATERAL',
        country: 'United States',
        email: 'dhaka@usaid.gov',
        relationshipStatus: 'Active',
        contacts: {
          create: { name: 'John Smith', designation: 'Program Officer', email: 'jsmith@usaid.gov', isPrimary: true },
        },
      },
    }),
    prisma.donor.create({
      data: {
        organizationId: org.id,
        name: 'World Bank',
        type: 'MULTILATERAL',
        country: 'International',
        email: 'dhaka@worldbank.org',
        relationshipStatus: 'Active',
        contacts: {
          create: { name: 'Sarah Ahmed', designation: 'Task Team Leader', email: 'sahmed@worldbank.org', isPrimary: true },
        },
      },
    }),
    prisma.donor.create({
      data: {
        organizationId: org.id,
        name: 'UNICEF Bangladesh',
        type: 'MULTILATERAL',
        country: 'International',
        email: 'dhaka@unicef.org',
        relationshipStatus: 'Active',
      },
    }),
    prisma.donor.create({
      data: {
        organizationId: org.id,
        name: 'DFID/FCDO',
        type: 'BILATERAL',
        country: 'United Kingdom',
        email: 'bangladesh@fcdo.gov.uk',
        relationshipStatus: 'Active',
      },
    }),
    prisma.donor.create({
      data: {
        organizationId: org.id,
        name: 'European Union',
        type: 'MULTILATERAL',
        country: 'Belgium',
        email: 'delegation-bangladesh@eeas.europa.eu',
        relationshipStatus: 'Prospect',
      },
    }),
  ])
  console.log(`✓ ${donors.length} Donors created`)

  // ─── 2. Get/Create Accounts for budget lines ───
  // Get existing accounts
  const bankAccount = await prisma.account.findFirst({ where: { organizationId: org.id, code: '1101' } })
  const grantIncome = await prisma.account.findFirst({ where: { organizationId: org.id, code: '4100' } })
  const salaryExp = await prisma.account.findFirst({ where: { organizationId: org.id, code: '5100' } })

  // Create more expense accounts (idempotent)
  const expGroup = await prisma.account.findFirst({ where: { organizationId: org.id, code: '5000' } })
  const travelExp = await prisma.account.upsert({
    where: { organizationId_code: { organizationId: org.id, code: '5200' } },
    update: {},
    create: { organizationId: org.id, code: '5200', name: 'Travel Expense', type: 'EXPENSE', nature: 'DEBIT', parentId: expGroup!.id, level: 2 },
  })
  const trainingExp = await prisma.account.upsert({
    where: { organizationId_code: { organizationId: org.id, code: '5300' } },
    update: {},
    create: { organizationId: org.id, code: '5300', name: 'Training Expense', type: 'EXPENSE', nature: 'DEBIT', parentId: expGroup!.id, level: 2 },
  })
  const equipmentExp = await prisma.account.upsert({
    where: { organizationId_code: { organizationId: org.id, code: '5400' } },
    update: {},
    create: { organizationId: org.id, code: '5400', name: 'Equipment Expense', type: 'EXPENSE', nature: 'DEBIT', parentId: expGroup!.id, level: 2 },
  })
  const adminExp = await prisma.account.upsert({
    where: { organizationId_code: { organizationId: org.id, code: '5500' } },
    update: {},
    create: { organizationId: org.id, code: '5500', name: 'Admin & Overhead', type: 'EXPENSE', nature: 'DEBIT', parentId: expGroup!.id, level: 2 },
  })
  console.log('✓ Additional expense accounts created')

  // ─── 3. Projects ───
  // Get/create number sequences
  const projectSeq = await prisma.numberSequence.findUnique({
    where: { organizationId_entity: { organizationId: org.id, entity: 'project' } },
  })

  const projects = await Promise.all([
    prisma.project.create({
      data: {
        organizationId: org.id,
        projectNo: 'PRJ-2026-001',
        name: 'WASH Phase-3 Sylhet',
        description: 'Water, Sanitation & Hygiene program in Sylhet division',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2027-06-30'),
        totalBudget: 15000000,
        location: 'Sylhet',
        status: 'ACTIVE',
        progress: 35,
      },
    }),
    prisma.project.create({
      data: {
        organizationId: org.id,
        projectNo: 'PRJ-2026-002',
        name: 'Education Enhancement Dhaka',
        description: 'Primary education quality improvement in Dhaka slums',
        startDate: new Date('2025-10-01'),
        endDate: new Date('2027-09-30'),
        totalBudget: 8500000,
        location: 'Dhaka',
        status: 'ACTIVE',
        progress: 20,
      },
    }),
    prisma.project.create({
      data: {
        organizationId: org.id,
        projectNo: 'PRJ-2026-003',
        name: 'Climate Adaptation Barishal',
        description: 'Community resilience building in flood-prone Barishal',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2028-12-31'),
        totalBudget: 12000000,
        location: 'Barishal',
        status: 'ACTIVE',
        progress: 10,
      },
    }),
    prisma.project.create({
      data: {
        organizationId: org.id,
        projectNo: 'PRJ-2026-004',
        name: 'Food Security EU',
        description: 'Sustainable agriculture and food security program',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2029-06-30'),
        totalBudget: 20000000,
        location: 'Rangpur',
        status: 'PIPELINE',
        progress: 0,
      },
    }),
  ])
  console.log(`✓ ${projects.length} Projects created`)

  // Update project number sequence
  await prisma.numberSequence.update({
    where: { organizationId_entity: { organizationId: org.id, entity: 'project' } },
    data: { currentValue: 4 },
  })

  // ─── 4. Grants (linking donors → projects) ───
  const grants = await Promise.all([
    prisma.grant.create({
      data: {
        grantNo: 'GR-2026-001',
        title: 'USAID WASH Bangladesh Phase-3',
        donorId: donors[0].id, // USAID
        projectId: projects[0].id, // WASH
        awardAmount: 15000000,
        disbursedAmount: 5000000,
        currencyCode: 'BDT',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2027-06-30'),
        status: 'ACTIVE',
        lifecycleStage: 'IMPLEMENTATION',
        ngoabFdNo: 'FD-1/2025/WASH-3',
      },
    }),
    prisma.grant.create({
      data: {
        grantNo: 'GR-2026-002',
        title: 'World Bank Education Quality',
        donorId: donors[1].id, // World Bank
        projectId: projects[1].id, // Education
        awardAmount: 8500000,
        disbursedAmount: 2000000,
        currencyCode: 'BDT',
        startDate: new Date('2025-10-01'),
        endDate: new Date('2027-09-30'),
        status: 'ACTIVE',
        lifecycleStage: 'IMPLEMENTATION',
      },
    }),
    prisma.grant.create({
      data: {
        grantNo: 'GR-2026-003',
        title: 'UNICEF Climate Resilience',
        donorId: donors[2].id, // UNICEF
        projectId: projects[2].id, // Climate
        awardAmount: 12000000,
        currencyCode: 'BDT',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2028-12-31'),
        status: 'ACTIVE',
        lifecycleStage: 'AGREEMENT',
      },
    }),
    prisma.grant.create({
      data: {
        grantNo: 'GR-2026-004',
        title: 'EU Food Security Programme',
        donorId: donors[4].id, // EU
        projectId: projects[3].id, // Food Security
        awardAmount: 20000000,
        currencyCode: 'EUR',
        status: 'PIPELINE',
        lifecycleStage: 'PROPOSAL',
      },
    }),
  ])
  console.log(`✓ ${grants.length} Grants created`)

  // Update grant sequence
  await prisma.numberSequence.update({
    where: { organizationId_entity: { organizationId: org.id, entity: 'grant' } },
    data: { currentValue: 4 },
  })

  // ─── 5. Budgets for WASH project ───
  const washBudget = await prisma.budget.create({
    data: {
      name: 'WASH Phase-3 Annual Budget FY2025-26',
      projectId: projects[0].id,
      grantId: grants[0].id,
      fiscalYearId: fy.id,
      totalAmount: 7500000,
      status: 'ACTIVE',
      lines: {
        create: [
          { accountId: salaryExp!.id, category: 'Personnel', description: 'Project staff salaries', unit: 'month', quantity: 12, unitCost: 250000, totalAmount: 3000000 },
          { accountId: travelExp.id, category: 'Travel', description: 'Field visit travel', unit: 'trip', quantity: 24, unitCost: 25000, totalAmount: 600000 },
          { accountId: trainingExp.id, category: 'Training', description: 'Community WASH training', unit: 'session', quantity: 20, unitCost: 50000, totalAmount: 1000000 },
          { accountId: equipmentExp.id, category: 'Equipment', description: 'Water testing kits & tubewells', unit: 'unit', quantity: 50, unitCost: 40000, totalAmount: 2000000 },
          { accountId: adminExp.id, category: 'Admin', description: 'Office overhead allocation', unit: 'month', quantity: 12, unitCost: 75000, totalAmount: 900000 },
        ],
      },
    },
  })
  console.log('✓ WASH Budget created with 5 line items (BDT 75,00,000)')

  // ─── 6. Bank Account ───
  const sonaliBank = await prisma.bankAccount.upsert({
    where: { organizationId_accountCode: { organizationId: org.id, accountCode: 'SB-MOTHER' } },
    update: {},
    create: {
      organizationId: org.id,
      accountCode: 'SB-MOTHER',
      accountName: 'Sonali Bank - NGOAB Mother Account',
      type: 'CURRENT',
      bankName: 'Sonali Bank Ltd.',
      branchName: 'Motijheel Branch',
      accountNumber: '****4567',
      isMotherAccount: true,
      currentBalance: 5000000,
    },
  })
  console.log('✓ Sonali Bank Mother Account created')

  // ─── 7. Fund Receipts ───
  await prisma.fundReceipt.create({
    data: {
      organizationId: org.id,
      receiptNo: 'FR-2026-001',
      date: new Date('2025-08-15'),
      donorId: donors[0].id, // USAID
      grantId: grants[0].id,
      amount: 5000000,
      currencyCode: 'BDT',
      exchangeRate: 1,
      amountInBDT: 5000000,
      bankAccountId: sonaliBank.id,
      bankReference: 'USAID-TT-2025-0815',
      status: 'CONFIRMED',
    },
  })
  await prisma.fundReceipt.create({
    data: {
      organizationId: org.id,
      receiptNo: 'FR-2026-002',
      date: new Date('2025-11-01'),
      donorId: donors[1].id, // World Bank
      grantId: grants[1].id,
      amount: 2000000,
      currencyCode: 'BDT',
      exchangeRate: 1,
      amountInBDT: 2000000,
      bankAccountId: sonaliBank.id,
      bankReference: 'WB-TT-2025-1101',
      status: 'CONFIRMED',
    },
  })
  console.log('✓ 2 Fund Receipts created (BDT 70,00,000 total)')

  // Update sequences
  await prisma.numberSequence.update({
    where: { organizationId_entity: { organizationId: org.id, entity: 'fund_receipt' } },
    data: { currentValue: 2 },
  })

  // Update donor totalFunded
  await prisma.donor.update({ where: { id: donors[0].id }, data: { totalFunded: 15000000 } })
  await prisma.donor.update({ where: { id: donors[1].id }, data: { totalFunded: 8500000 } })
  await prisma.donor.update({ where: { id: donors[2].id }, data: { totalFunded: 12000000 } })

  console.log('\n✅ Phase 3 seeding complete!')
  console.log('   5 Donors, 4 Grants, 4 Projects, 1 Budget (5 lines), 1 Bank Account, 2 Fund Receipts')
}

main()
  .catch((e) => {
    console.error('❌ Phase 3 seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
