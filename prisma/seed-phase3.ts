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

  // ─── 5. Budgets for WASH project (International-Grade) ───

  // Ensure budget number sequence exists
  await prisma.numberSequence.upsert({
    where: { organizationId_entity: { organizationId: org.id, entity: 'budget' } },
    update: {},
    create: {
      organizationId: org.id,
      entity: 'budget',
      prefix: 'BUD',
      separator: '-',
      padLength: 4,
      currentValue: 1,
      includeYear: true,
    },
  })

  const washBudget = await prisma.budget.create({
    data: {
      budgetCode: 'BUD-2026-0001',
      name: 'WASH Phase-3 Annual Budget FY2025-26',
      budgetType: 'PROJECT',
      projectId: projects[0].id,
      grantId: grants[0].id,
      fiscalYearId: fy.id,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-06-30'),
      periodType: 'QUARTERLY',
      totalAmount: 8400000, // 7,500,000 direct + 900,000 ICR (12%)
      currencyCode: 'BDT',
      status: 'ACTIVE',
      version: 1,
      indirectCostRate: 12.00,
      indirectCostBase: 'TOTAL_DIRECT',
      indirectCostAmount: 900000,
      costShareRequired: true,
      costSharePercent: 20.00,
      costShareAmount: 1680000,
      donorAmount: 6720000,
      budgetCeiling: 10000000,
      varianceThreshold: 10.00,
      narrative: 'This budget supports the WASH Phase-3 project in Sylhet Division, targeting 5,000 households with safe water and sanitation. Costs are estimated based on FY2024-25 actuals adjusted for 5% inflation. Personnel costs reflect approved salary scales per NGOAB guidelines. USAID WASH Bangladesh grant covers 80% of project cost with 20% organizational cost share from unrestricted funds.',
      assumptions: 'Salary scale: NGOAB-approved Grade-5 to Grade-9. Per diem: BDT 2,500/day (field) per NGOAB circular 2024. Travel: Average 600km round-trip to Sylhet @ BDT 25,000/trip. Training venue: Community centers (no rental). Equipment: Based on 3 vendor quotations (lowest responsive). Inflation: 5% applied to FY2024-25 baseline.',
      lines: {
        create: [
          {
            accountId: salaryExp!.id,
            category: 'Personnel',
            subCategory: 'National Staff',
            description: 'Project staff salaries (Project Manager, Engineers, Community Mobilizers)',
            unit: 'Month',
            quantity: 12,
            unitCost: 250000,
            totalAmount: 3000000,
            levelOfEffort: 100,
            duration: 12,
            donorShare: 2400000,
            costShare: 600000,
            narrative: 'Includes 1 Project Manager (Grade-7, BDT 80,000/mo), 2 WASH Engineers (Grade-6, BDT 55,000/mo each), 3 Community Mobilizers (Grade-5, BDT 20,000/mo each). All positions are full-time (100% LoE) dedicated to WASH Phase-3.',
            sortOrder: 0,
          },
          {
            accountId: travelExp.id,
            category: 'Travel',
            subCategory: 'Domestic Travel',
            description: 'Field monitoring visits to Sylhet project sites',
            unit: 'Trip',
            quantity: 24,
            unitCost: 25000,
            totalAmount: 600000,
            donorShare: 480000,
            costShare: 120000,
            narrative: 'Bi-monthly monitoring visits by project team (2 trips/month x 12 months). Includes transport, accommodation, and per diem per NGOAB rates.',
            sortOrder: 1,
          },
          {
            accountId: trainingExp.id,
            category: 'Training',
            subCategory: 'Workshops',
            description: 'Community WASH awareness and hygiene training sessions',
            unit: 'Unit',
            quantity: 20,
            unitCost: 50000,
            totalAmount: 1000000,
            donorShare: 800000,
            costShare: 200000,
            narrative: '20 community-level training sessions across 5 upazilas (4 per upazila). Each session for 50 participants. Costs include materials, refreshments, and facilitator fees.',
            sortOrder: 2,
          },
          {
            accountId: equipmentExp.id,
            category: 'Equipment',
            description: 'Water testing kits, tubewells, and sanitary latrines',
            unit: 'Unit',
            quantity: 50,
            unitCost: 40000,
            totalAmount: 2000000,
            donorShare: 1600000,
            costShare: 400000,
            narrative: 'Includes 10 water testing kits (BDT 15,000 each), 20 shallow tubewells (BDT 50,000 each), and 20 hygienic latrine sets (BDT 27,500 each). Prices based on 3-vendor quotation process.',
            sortOrder: 3,
          },
          {
            accountId: adminExp.id,
            category: 'Admin',
            subCategory: 'Office Rent',
            description: 'Office overhead allocation (rent, utilities, admin support)',
            unit: 'Month',
            quantity: 12,
            unitCost: 75000,
            totalAmount: 900000,
            donorShare: 720000,
            costShare: 180000,
            narrative: 'Proportional allocation of Dhaka HQ and Sylhet field office costs. Includes rent (BDT 40,000), utilities (BDT 15,000), internet/phone (BDT 10,000), and admin support staff (BDT 10,000).',
            sortOrder: 4,
          },
        ],
      },
    },
  })
  console.log('✓ WASH Budget created (BUD-2026-0001) with 5 lines, 12% ICR, 20% cost share')

  // ─── 5b. Education Program Budget (second budget) ───
  const eduBudget = await prisma.budget.create({
    data: {
      budgetCode: 'BUD-2026-0002',
      name: 'Primary Education Program Budget FY2025-26',
      budgetType: 'PROGRAM',
      projectId: projects.length > 1 ? projects[1].id : projects[0].id,
      grantId: grants.length > 1 ? grants[1].id : grants[0].id,
      fiscalYearId: fy.id,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-06-30'),
      periodType: 'QUARTERLY',
      totalAmount: 5350000,
      currencyCode: 'BDT',
      status: 'DRAFT',
      version: 1,
      indirectCostRate: 7.00,
      indirectCostBase: 'TOTAL_DIRECT',
      indirectCostAmount: 350000,
      costShareRequired: false,
      varianceThreshold: 15.00,
      narrative: 'EU-funded primary education quality improvement program covering 50 schools in Rangpur Division. Budget follows EU Annex III format with 7% flat indirect cost rate.',
      lines: {
        create: [
          {
            accountId: salaryExp!.id,
            category: 'Personnel',
            subCategory: 'National Staff',
            description: 'Education specialists and field coordinators',
            unit: 'Month',
            quantity: 12,
            unitCost: 180000,
            totalAmount: 2160000,
            levelOfEffort: 100,
            duration: 12,
            narrative: '1 Education Specialist (BDT 70,000/mo), 2 Field Coordinators (BDT 45,000/mo each), 1 Data Entry Officer (BDT 20,000/mo).',
            sortOrder: 0,
          },
          {
            accountId: trainingExp.id,
            category: 'Training',
            subCategory: 'Materials',
            description: 'Teacher training and educational materials',
            unit: 'Lot',
            quantity: 1,
            unitCost: 1500000,
            totalAmount: 1500000,
            narrative: 'Training of 200 teachers across 50 schools (3-day residential). Includes printed teaching guides, learning kits, and assessment tools.',
            sortOrder: 1,
          },
          {
            accountId: equipmentExp.id,
            category: 'Equipment',
            description: 'Classroom furniture and learning aids',
            unit: 'Unit',
            quantity: 50,
            unitCost: 14000,
            totalAmount: 700000,
            narrative: 'Supply of desks, chairs, and whiteboards for 50 schools. Standard LGED specifications.',
            sortOrder: 2,
          },
          {
            accountId: adminExp.id,
            category: 'M&E',
            subCategory: 'Evaluations',
            description: 'Baseline, midline, and endline assessments',
            unit: 'Lump Sum',
            quantity: 1,
            unitCost: 640000,
            totalAmount: 640000,
            narrative: 'Three rounds of learning outcome assessments covering literacy and numeracy for 2,500 students. Includes external evaluator fees.',
            sortOrder: 3,
          },
        ],
      },
    },
  })
  console.log('✓ Education Budget created (BUD-2026-0002) with 4 lines, 7% ICR')

  // Update number sequence
  await prisma.numberSequence.update({
    where: { organizationId_entity: { organizationId: org.id, entity: 'budget' } },
    data: { currentValue: 2 },
  })

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
