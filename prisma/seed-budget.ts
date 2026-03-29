/**
 * Budget Module Seed: International-grade budget demo data
 * Run: npx tsx prisma/seed-budget.ts
 * Requires: existing org, projects, grants, fiscal year, and expense accounts
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
  console.log('🌱 Seeding Budget module (International-Grade)...')

  // Clean old budget data
  await prisma.budgetRevisionLine.deleteMany({})
  await prisma.budgetRevision.deleteMany({})
  await prisma.budgetLine.deleteMany({})
  await prisma.budget.deleteMany({})
  console.log('✓ Old budget data cleaned')

  const org = await prisma.organization.findFirst()
  if (!org) throw new Error('No organization found — run main seed first')

  const projects = await prisma.project.findMany({ where: { organizationId: org.id }, take: 4, orderBy: { createdAt: 'asc' } })
  const grants = await prisma.grant.findMany({ where: { donor: { organizationId: org.id } }, take: 4, orderBy: { createdAt: 'asc' } })
  const fy = await prisma.fiscalYear.findFirst({ where: { organizationId: org.id }, orderBy: { startDate: 'desc' } })

  if (!projects.length) throw new Error('No projects found — run seed-phase3 first')
  if (!fy) throw new Error('No fiscal year found — run seed-finance first')

  console.log(`  Org: ${org.name}`)
  console.log(`  Projects: ${projects.map(p => p.name).join(', ')}`)
  console.log(`  Grants: ${grants.map(g => g.title).join(', ')}`)
  console.log(`  Fiscal Year: ${fy.name}`)

  // Get expense accounts
  // Get expense accounts by name pattern (codes vary between setups)
  const expenseAccounts = await prisma.account.findMany({
    where: { organizationId: org.id, isGroup: false, deletedAt: null, type: 'EXPENSE' },
    select: { id: true, code: true, name: true },
  })

  const findAccount = (keyword: string) =>
    expenseAccounts.find(a => a.name.toLowerCase().includes(keyword.toLowerCase()))

  const salaryExp = findAccount('salary') || expenseAccounts[0]
  const travelExp = findAccount('travel') || expenseAccounts[1] || expenseAccounts[0]
  const trainingExp = findAccount('training') || expenseAccounts[2] || expenseAccounts[0]
  const equipmentExp = findAccount('equipment') || expenseAccounts[3] || expenseAccounts[0]
  const adminExp = findAccount('admin') || findAccount('overhead') || expenseAccounts[4] || expenseAccounts[0]

  if (!salaryExp) {
    throw new Error('No expense accounts found — run seed-finance first')
  }

  console.log(`  Accounts: ${salaryExp.code}-${salaryExp.name}, ${travelExp.code}, ${trainingExp.code}, ${equipmentExp.code}, ${adminExp.code}`)

  // Ensure budget number sequence
  await prisma.numberSequence.upsert({
    where: { organizationId_entity: { organizationId: org.id, entity: 'budget' } },
    update: { currentValue: 0 },
    create: {
      organizationId: org.id,
      entity: 'budget',
      prefix: 'BUD',
      separator: '-',
      padLength: 4,
      currentValue: 0,
      includeYear: true,
    },
  })

  // ──── Budget 1: WASH Project (ACTIVE, with ICR + Cost Share) ────
  await prisma.budget.create({
    data: {
      budgetCode: 'BUD-2026-0001',
      name: 'WASH Phase-3 Annual Budget FY2025-26',
      budgetType: 'PROJECT',
      projectId: projects[0].id,
      grantId: grants[0]?.id || null,
      fiscalYearId: fy.id,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-06-30'),
      periodType: 'QUARTERLY',
      totalAmount: 8400000,
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
      approvedAt: new Date('2025-06-20'),
      lines: {
        create: [
          {
            accountId: salaryExp.id, category: 'Personnel', subCategory: 'National Staff',
            description: 'Project staff salaries (PM, Engineers, Community Mobilizers)',
            unit: 'Month', quantity: 12, unitCost: 250000, totalAmount: 3000000,
            levelOfEffort: 100, duration: 12, donorShare: 2400000, costShare: 600000,
            narrative: '1 Project Manager (Grade-7, BDT 80,000/mo), 2 WASH Engineers (Grade-6, BDT 55,000/mo each), 3 Community Mobilizers (Grade-5, BDT 20,000/mo each). All 100% LoE.',
            sortOrder: 0,
          },
          {
            accountId: travelExp.id, category: 'Travel', subCategory: 'Domestic Travel',
            description: 'Field monitoring visits to Sylhet project sites',
            unit: 'Trip', quantity: 24, unitCost: 25000, totalAmount: 600000,
            donorShare: 480000, costShare: 120000,
            narrative: 'Bi-monthly monitoring by project team (2 trips/month × 12 months). Transport, accommodation, and per diem per NGOAB rates.',
            sortOrder: 1,
          },
          {
            accountId: trainingExp.id, category: 'Training', subCategory: 'Workshops',
            description: 'Community WASH awareness and hygiene training',
            unit: 'Unit', quantity: 20, unitCost: 50000, totalAmount: 1000000,
            donorShare: 800000, costShare: 200000,
            narrative: '20 community-level training sessions across 5 upazilas (4 per upazila). 50 participants each. Includes materials, refreshments, facilitator fees.',
            sortOrder: 2,
          },
          {
            accountId: equipmentExp.id, category: 'Equipment',
            description: 'Water testing kits, tubewells, and sanitary latrines',
            unit: 'Unit', quantity: 50, unitCost: 40000, totalAmount: 2000000,
            donorShare: 1600000, costShare: 400000,
            narrative: '10 water testing kits (BDT 15,000 each), 20 shallow tubewells (BDT 50,000 each), 20 hygienic latrine sets (BDT 27,500 each). 3-vendor quotation.',
            sortOrder: 3,
          },
          {
            accountId: adminExp.id, category: 'Admin', subCategory: 'Office Rent',
            description: 'Office overhead allocation (rent, utilities, admin support)',
            unit: 'Month', quantity: 12, unitCost: 75000, totalAmount: 900000,
            donorShare: 720000, costShare: 180000,
            narrative: 'Dhaka HQ and Sylhet field office: rent (BDT 40,000), utilities (BDT 15,000), internet/phone (BDT 10,000), admin support (BDT 10,000).',
            sortOrder: 4,
          },
        ],
      },
    },
  })
  console.log('✓ Budget 1: WASH Phase-3 (BUD-2026-0001) — ACTIVE, 12% ICR, 20% cost share')

  // ──── Budget 2: Education Program (DRAFT, EU 7% ICR) ────
  await prisma.budget.create({
    data: {
      budgetCode: 'BUD-2026-0002',
      name: 'Primary Education Quality Improvement FY2025-26',
      budgetType: 'PROGRAM',
      projectId: projects.length > 1 ? projects[1].id : projects[0].id,
      grantId: grants.length > 1 ? grants[1].id : null,
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
      narrative: 'EU-funded primary education quality improvement covering 50 schools in Rangpur Division. Budget follows EU Annex III format with 7% flat indirect cost rate.',
      lines: {
        create: [
          {
            accountId: salaryExp.id, category: 'Personnel', subCategory: 'National Staff',
            description: 'Education specialists and field coordinators',
            unit: 'Month', quantity: 12, unitCost: 180000, totalAmount: 2160000,
            levelOfEffort: 100, duration: 12,
            narrative: '1 Education Specialist (BDT 70,000/mo), 2 Field Coordinators (BDT 45,000/mo each), 1 Data Entry Officer (BDT 20,000/mo).',
            sortOrder: 0,
          },
          {
            accountId: trainingExp.id, category: 'Training', subCategory: 'Materials',
            description: 'Teacher training and educational materials',
            unit: 'Lot', quantity: 1, unitCost: 1500000, totalAmount: 1500000,
            narrative: '200 teachers, 50 schools, 3-day residential training. Printed guides, learning kits, assessment tools.',
            sortOrder: 1,
          },
          {
            accountId: equipmentExp.id, category: 'Equipment',
            description: 'Classroom furniture and learning aids',
            unit: 'Unit', quantity: 50, unitCost: 14000, totalAmount: 700000,
            narrative: 'Desks, chairs, whiteboards for 50 schools. Standard LGED specifications.',
            sortOrder: 2,
          },
          {
            accountId: adminExp.id, category: 'M&E', subCategory: 'Evaluations',
            description: 'Baseline, midline, and endline learning assessments',
            unit: 'Lump Sum', quantity: 1, unitCost: 640000, totalAmount: 640000,
            narrative: '3 rounds of learning outcome assessments: literacy and numeracy for 2,500 students. External evaluator.',
            sortOrder: 3,
          },
        ],
      },
    },
  })
  console.log('✓ Budget 2: Education Program (BUD-2026-0002) — DRAFT, 7% ICR')

  // ──── Budget 3: HQ Operations (APPROVED, no ICR) ────
  // Use the last project or a non-WASH project for HQ budget
  const hqProjectId = projects.length > 2 ? projects[2].id : projects.length > 1 ? projects[1].id : projects[0].id
  await prisma.budget.create({
    data: {
      budgetCode: 'BUD-2026-0003',
      name: 'HQ Administrative & Operational Budget FY2025-26',
      budgetType: 'OPERATIONAL',
      projectId: hqProjectId,
      fiscalYearId: fy.id,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-06-30'),
      periodType: 'MONTHLY',
      totalAmount: 3600000,
      currencyCode: 'BDT',
      status: 'APPROVED',
      version: 1,
      varianceThreshold: 5.00,
      approvedAt: new Date('2025-06-15'),
      narrative: 'Core organizational overhead funded from unrestricted reserves. Covers HQ rent, utilities, core staff, governance costs, and statutory audit.',
      lines: {
        create: [
          {
            accountId: salaryExp.id, category: 'Personnel', subCategory: 'National Staff',
            description: 'Core admin staff (HR, Finance, IT)',
            unit: 'Month', quantity: 12, unitCost: 200000, totalAmount: 2400000,
            levelOfEffort: 100, duration: 12,
            narrative: 'Finance Manager (BDT 75,000), HR Officer (BDT 50,000), IT Support (BDT 40,000), Office Assistant (BDT 35,000).',
            sortOrder: 0,
          },
          {
            accountId: adminExp.id, category: 'Admin', subCategory: 'Office Rent',
            description: 'HQ office rent and maintenance',
            unit: 'Month', quantity: 12, unitCost: 60000, totalAmount: 720000,
            narrative: 'Dhaka HQ 2,000 sq ft @ BDT 30/sqft plus maintenance.',
            sortOrder: 1,
          },
          {
            accountId: adminExp.id, category: 'Admin', subCategory: 'Audit Fees',
            description: 'Statutory audit and NGOAB compliance reporting',
            unit: 'Lump Sum', quantity: 1, unitCost: 480000, totalAmount: 480000,
            narrative: 'Annual statutory audit (BDT 300,000) + NGOAB compliance reporting (BDT 180,000).',
            sortOrder: 2,
          },
        ],
      },
    },
  })
  console.log('✓ Budget 3: HQ Operations (BUD-2026-0003) — APPROVED, monthly')

  // Update number sequence
  await prisma.numberSequence.update({
    where: { organizationId_entity: { organizationId: org.id, entity: 'budget' } },
    data: { currentValue: 3 },
  })

  console.log('\n✅ Budget seed complete!')
  console.log('   3 budgets: WASH (ACTIVE), Education (DRAFT), HQ Operations (APPROVED)')
  console.log('   12 budget lines with narratives, cost sharing, ICR, and subcategories')

  await pool.end()
}

main().catch((e) => {
  console.error('❌ Budget seed failed:', e.message)
  process.exit(1)
})
