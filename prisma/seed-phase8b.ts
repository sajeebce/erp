/**
 * Phase 8b Seed: Pension Management — Onboarding Checklists, Gratuity & Provident Fund
 * Run after Phase 8 HR seed: npx tsx prisma/seed-phase8b.ts
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
  console.log('🌱 Seeding Phase 8b: Pension Management & Onboarding Checklists...')

  const org = await prisma.organization.findUnique({ where: { slug: 'shapla-foundation' } })
  if (!org) throw new Error('Organization "shapla-foundation" not found. Run base seed first.')

  // ─── 1. Onboarding Checklists (17 default items) ───────────────────────────
  console.log('  → Seeding onboarding checklist items...')

  const existingChecklists = await prisma.onboardingChecklist.count({
    where: { organizationId: org.id },
  })

  if (existingChecklists === 0) {
    const checklistItems = [
      { name: 'NID/Birth Certificate copy', category: 'DOCUMENT', isRequired: true, requiresDocument: true, documentType: 'NID_COPY', sortOrder: 1 },
      { name: 'Passport-size photos', category: 'DOCUMENT', isRequired: true, requiresDocument: true, documentType: 'PHOTO', sortOrder: 2 },
      { name: 'Educational certificates', category: 'DOCUMENT', isRequired: true, requiresDocument: true, documentType: 'EDUCATIONAL_CERT', sortOrder: 3 },
      { name: 'TIN certificate', category: 'DOCUMENT', isRequired: true, requiresDocument: true, documentType: 'TIN_CERTIFICATE', sortOrder: 4 },
      { name: 'Medical fitness certificate', category: 'DOCUMENT', isRequired: false, requiresDocument: true, documentType: 'MEDICAL_FITNESS', sortOrder: 5 },
      { name: 'Nominee declaration form', category: 'DOCUMENT', isRequired: true, requiresDocument: true, documentType: 'NOMINEE_FORM', sortOrder: 6 },
      { name: 'Bank account setup', category: 'FINANCE', isRequired: true, requiresDocument: false, sortOrder: 7 },
      { name: 'Employment contract signing', category: 'LEGAL', isRequired: true, requiresDocument: true, documentType: 'SIGNED_CONTRACT', sortOrder: 8 },
      { name: 'Policy handbook acknowledgment', category: 'COMPLIANCE', isRequired: true, requiresDocument: true, documentType: 'POLICY_ACKNOWLEDGMENT', sortOrder: 9 },
      { name: 'Safeguarding & PSEA training', category: 'COMPLIANCE', isRequired: true, requiresDocument: false, sortOrder: 10 },
      { name: 'IT access setup', category: 'IT', isRequired: true, requiresDocument: false, sortOrder: 11 },
      { name: 'ID card issuance', category: 'ADMIN', isRequired: true, requiresDocument: false, sortOrder: 12 },
      { name: 'Orientation/induction', category: 'HR', isRequired: true, requiresDocument: false, sortOrder: 13 },
      { name: 'Supervisor introduction', category: 'HR', isRequired: true, requiresDocument: false, sortOrder: 14 },
      { name: 'Probation goals setting', category: 'HR', isRequired: false, requiresDocument: false, sortOrder: 15 },
      { name: 'NGOAB FD-4 notification', category: 'COMPLIANCE', isRequired: true, requiresDocument: true, documentType: 'NGOAB_FD4_NOTIFICATION', sortOrder: 16 },
      { name: 'Security briefing', category: 'SECURITY', isRequired: false, requiresDocument: false, sortOrder: 17 },
    ]

    for (const item of checklistItems) {
      await prisma.onboardingChecklist.create({
        data: {
          organizationId: org.id,
          ...item,
        },
      })
    }
    console.log(`  ✓ ${checklistItems.length} Onboarding checklist items created`)
  } else {
    console.log(`  ⏭ Onboarding checklist items already exist (${existingChecklists} found)`)
  }

  // ─── 2. Find employees for enrollment ──────────────────────────────────────
  const employees = await prisma.employee.findMany({
    where: {
      organizationId: org.id,
      status: 'ACTIVE',
      deletedAt: null,
    },
    orderBy: { joiningDate: 'asc' },
  })

  // Filter employees with 2+ years of service
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const eligibleEmployees = employees.filter(e => e.joiningDate <= twoYearsAgo)
  const targetEmployees = eligibleEmployees.slice(0, 4)

  if (targetEmployees.length === 0) {
    console.log('  ⚠ No employees with 2+ years service found. Skipping gratuity/PF enrollment.')
    await prisma.$disconnect()
    await pool.end()
    return
  }

  console.log(`  → Found ${targetEmployees.length} eligible employees: ${targetEmployees.map(e => e.fullName).join(', ')}`)

  // ─── 3. Gratuity Policy ────────────────────────────────────────────────────
  console.log('  → Seeding gratuity policy...')

  const existingGratuityPolicy = await prisma.gratuityPolicy.findFirst({
    where: { organizationId: org.id, isDefault: true },
  })

  let gratuityPolicy = existingGratuityPolicy
  if (!gratuityPolicy) {
    gratuityPolicy = await prisma.gratuityPolicy.create({
      data: {
        organizationId: org.id,
        name: 'Standard Gratuity Policy (BLA 2006)',
        vestingPeriodMonths: 60,
        minServiceMonths: 12,
        ratePerYear: 1.00,
        formulaType: 'MONTHS_PER_YEAR',
        calculationBase: 'LAST_BASIC',
        accrualFrequency: 'MONTHLY',
        maintainFund: false,
        isDefault: true,
        isActive: true,
      },
    })
    console.log('  ✓ Gratuity policy created')
  } else {
    console.log('  ⏭ Default gratuity policy already exists')
  }

  // ─── 4. Gratuity Ledgers ───────────────────────────────────────────────────
  console.log('  → Seeding gratuity ledgers...')

  const now = new Date()
  for (const emp of targetEmployees) {
    const existing = await prisma.gratuityLedger.findFirst({
      where: { employeeId: emp.id, policyId: gratuityPolicy.id },
    })
    if (existing) {
      console.log(`  ⏭ Gratuity ledger already exists for ${emp.fullName}`)
      continue
    }

    const serviceMonths = Math.floor(
      (now.getTime() - emp.joiningDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    )
    const serviceYears = serviceMonths / 12
    const basicSalary = Number(emp.basicSalary) || 0
    // Monthly accrual = (basicSalary * ratePerYear) / 12
    const monthlyAccrual = (basicSalary * 1.0) / 12
    const totalAccrued = monthlyAccrual * serviceMonths
    const isVested = serviceMonths >= 60

    await prisma.gratuityLedger.create({
      data: {
        organizationId: org.id,
        employeeId: emp.id,
        policyId: gratuityPolicy.id,
        serviceStartDate: emp.joiningDate,
        totalAccrued: Math.round(totalAccrued),
        totalPaid: 0,
        currentBalance: Math.round(totalAccrued),
        isVested,
      },
    })
    console.log(`  ✓ Gratuity ledger for ${emp.fullName}: ৳${Math.round(totalAccrued).toLocaleString()} (${serviceYears.toFixed(1)} yrs, ${isVested ? 'VESTED' : 'NOT VESTED'})`)
  }

  // ─── 5. Provident Fund Policy ──────────────────────────────────────────────
  console.log('  → Seeding PF policy...')

  const existingPfPolicy = await prisma.pFPolicy.findFirst({
    where: { organizationId: org.id, isDefault: true },
  })

  let pfPolicy = existingPfPolicy
  if (!pfPolicy) {
    pfPolicy = await prisma.pFPolicy.create({
      data: {
        organizationId: org.id,
        name: 'Standard PF Policy',
        employeeContribRate: 10.00,
        employerContribRate: 10.00,
        contributionBase: 'BASIC',
        interestRate: 9.00,
        interestCalcMethod: 'MONTHLY_BALANCE',
        interestPostingFreq: 'ANNUAL',
        vestingSchedule: [
          { months: 12, percentage: 25 },
          { months: 24, percentage: 50 },
          { months: 36, percentage: 75 },
          { months: 48, percentage: 100 },
        ],
        eligibilityMonths: 0,
        allowLoan: true,
        maxLoanPercent: 80.00,
        loanInterestRate: 5.00,
        maxLoanRepayMonths: 36,
        isDefault: true,
        isActive: true,
      },
    })
    console.log('  ✓ PF policy created')
  } else {
    console.log('  ⏭ Default PF policy already exists')
  }

  // ─── 6. PF Trust ───────────────────────────────────────────────────────────
  console.log('  → Seeding PF trust...')

  const existingTrust = await prisma.pFTrust.findFirst({
    where: { organizationId: org.id },
  })

  let pfTrust = existingTrust
  if (!pfTrust) {
    pfTrust = await prisma.pFTrust.create({
      data: {
        organizationId: org.id,
        name: 'Shapla Foundation PF Trust',
        currentBalance: 850000,
        isActive: true,
      },
    })
    console.log('  ✓ PF Trust created (balance: ৳850,000)')
  } else {
    console.log('  ⏭ PF Trust already exists')
  }

  // ─── 7. PF Enrollments ─────────────────────────────────────────────────────
  console.log('  → Seeding PF enrollments...')

  for (const emp of targetEmployees) {
    const existing = await prisma.pFEnrollment.findFirst({
      where: { employeeId: emp.id, policyId: pfPolicy.id },
    })
    if (existing) {
      console.log(`  ⏭ PF enrollment already exists for ${emp.fullName}`)
      continue
    }

    const serviceMonths = Math.floor(
      (now.getTime() - emp.joiningDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    )
    const basicSalary = Number(emp.basicSalary) || 0
    const monthlyEmployeeContrib = basicSalary * 0.10
    const monthlyEmployerContrib = basicSalary * 0.10
    const totalEmployeeContrib = monthlyEmployeeContrib * serviceMonths
    const totalEmployerContrib = monthlyEmployerContrib * serviceMonths
    // Approximate interest (simple estimate)
    const avgBalance = (totalEmployeeContrib + totalEmployerContrib) / 2
    const totalInterest = Math.round(avgBalance * 0.09 * (serviceMonths / 12))

    await prisma.pFEnrollment.create({
      data: {
        organizationId: org.id,
        employeeId: emp.id,
        policyId: pfPolicy.id,
        enrollmentDate: emp.joiningDate,
        effectiveDate: emp.joiningDate,
        employeeRate: 10.00,
        employerRate: 10.00,
        totalEmployeeContrib: Math.round(totalEmployeeContrib),
        totalEmployerContrib: Math.round(totalEmployerContrib),
        totalInterest,
        totalWithdrawals: 0,
        totalLoanOutstanding: 0,
        currentBalance: Math.round(totalEmployeeContrib + totalEmployerContrib + totalInterest),
        status: 'ACTIVE',
      },
    })
    const total = Math.round(totalEmployeeContrib + totalEmployerContrib + totalInterest)
    console.log(`  ✓ PF enrollment for ${emp.fullName}: ৳${total.toLocaleString()} (emp: ৳${Math.round(totalEmployeeContrib).toLocaleString()}, er: ৳${Math.round(totalEmployerContrib).toLocaleString()}, int: ৳${totalInterest.toLocaleString()})`)
  }

  console.log('\n✅ Phase 8b seed completed successfully!')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
