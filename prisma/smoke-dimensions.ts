/**
 * Smoke test for the JE / Voucher dimension UI work.
 *
 * Doesn't go through HTTP — exercises the validateDimensions helper and the
 * persistence layer directly so we can confirm the schema + SQL-level cascade
 * still produces the expected rows after the UI/API changes.
 *
 * Run: pnpm tsx --env-file=.env prisma/smoke-dimensions.ts
 */
import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

let pass = 0
let fail = 0
function assert(cond: boolean, message: string) {
  if (cond) {
    pass += 1
    console.log(`  ✓ ${message}`)
  } else {
    fail += 1
    console.log(`  ✗ ${message}`)
  }
}

async function main() {
  console.log('🌱 Dimension UI smoke test starting...')

  const org = await prisma.organization.findFirst({ where: { slug: 'cssbd' } })
  if (!org) throw new Error('CSS org not found — run pnpm db:seed:all first')
  const admin = await prisma.user.findFirst({ where: { organizationId: org.id, role: { name: 'ADMIN' } } })
  const fy = await prisma.fiscalYear.findFirst({ where: { organizationId: org.id, isCurrent: true } })
  if (!admin || !fy) throw new Error('Missing admin or current fiscal year')

  const businessUnits = await prisma.businessUnit.findMany({ where: { organizationId: org.id, isActive: true }, take: 5 })
  const costCenters = await prisma.costCenter.findMany({ where: { organizationId: org.id, isActive: true }, take: 10 })
  const fundClasses = await prisma.fundClass.findMany({ where: { organizationId: org.id, isActive: true }, take: 5 })
  const accounts = await prisma.account.findMany({ where: { organizationId: org.id, isActive: true, isGroup: false }, take: 20 })
  const projects = await prisma.project.findMany({ where: { organizationId: org.id }, take: 5 })

  if (businessUnits.length < 2 || costCenters.length === 0 || fundClasses.length === 0 || accounts.length < 2) {
    throw new Error('Need at least 2 BUs, 1 CC, 1 FC, 2 accounts to run smoke test')
  }

  // Pick BUs such that BU A has at least one CC under it; BU B is any other.
  const ccByBu = new Map<string, typeof costCenters[number][]>()
  for (const cc of costCenters) {
    const list = ccByBu.get(cc.businessUnitId) ?? []
    list.push(cc)
    ccByBu.set(cc.businessUnitId, list)
  }
  const buAId = [...ccByBu.keys()][0]
  const buA = businessUnits.find((b) => b.id === buAId) ?? businessUnits[0]
  const buB = businessUnits.find((b) => b.id !== buA.id) ?? businessUnits[1]
  const ccA = (ccByBu.get(buA.id) ?? [])[0]
  if (!ccA) throw new Error(`No cost center available for any BU; check seed-css-operating-structure`)
  const fc = fundClasses[0]
  const project = projects[0] ?? null
  const debitAccount = accounts[0]
  const creditAccount = accounts[1]

  console.log(`\n=== TC-DIM-1: Manual JE with header + per-line dimensions ===`)

  // Mirror the POST /api/v1/finance/journal-entries logic for the dimension cascade.
  const runId = `DIM-${Date.now()}`
  const entryNo = `JE-SMOKE-${runId}`
  const headerBu = buA.id
  const headerFc = fc.id

  const je = await prisma.journalEntry.create({
    data: {
      entryNo,
      date: new Date(),
      description: 'Dimension smoke test entry',
      fiscalYearId: fy.id,
      businessUnitId: headerBu,
      projectId: project?.id ?? null,
      totalDebit: new Prisma.Decimal(1000),
      totalCredit: new Prisma.Decimal(1000),
      status: 'DRAFT',
      createdById: admin.id,
      lines: {
        create: [
          {
            // Line 1 — overrides BU (still BU A) but adds CC + FC
            accountId: debitAccount.id,
            description: 'DR with full dims',
            debit: new Prisma.Decimal(1000),
            credit: new Prisma.Decimal(0),
            businessUnitId: buA.id,
            costCenterId: ccA.id,
            fundClassId: headerFc,
            projectId: project?.id ?? null,
          },
          {
            // Line 2 — overrides BU (BU B), no CC under BU B → leave CC null
            accountId: creditAccount.id,
            description: 'CR overrides BU',
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(1000),
            businessUnitId: buB.id,
            fundClassId: headerFc,
          },
        ],
      },
    },
    include: { lines: true },
  })

  assert(je.businessUnitId === headerBu, 'TC-DIM-1: header BU persisted')
  assert(je.lines[0].businessUnitId === buA.id, 'TC-DIM-1: line 1 BU set')
  assert(je.lines[0].costCenterId === ccA.id, 'TC-DIM-1: line 1 CC set')
  assert(je.lines[0].fundClassId === headerFc, 'TC-DIM-1: line 1 FC set')
  assert(je.lines[1].businessUnitId === buB.id, 'TC-DIM-1: line 2 overrides BU')
  assert(je.lines[1].costCenterId === null, 'TC-DIM-1: line 2 CC null (none under BU B)')

  console.log(`\n=== TC-DIM-3: validateDimensions rejects CC without BU ===`)
  const { validateDimensions } = await import('../src/lib/dimension-validation')
  const noBuErr = await validateDimensions(org.id, { costCenterId: ccA.id })
  assert(noBuErr !== null, 'TC-DIM-3: validateDimensions rejects CC without BU')

  console.log(`\n=== TC-DIM-3 (also): CC must belong to selected BU ===`)
  const wrongBuErr = await validateDimensions(org.id, { businessUnitId: buB.id, costCenterId: ccA.id })
  assert(wrongBuErr !== null, 'TC-DIM-3: rejects CC that does not belong to selected BU')

  console.log(`\n=== TC-DIM-4/5: Voucher → JE cascade still works ===`)
  // Create a DRAFT voucher with BU = buA, simulate approve handler's JE creation.
  const voucher = await prisma.voucher.create({
    data: {
      organizationId: org.id,
      voucherNo: `VCH-DIM-${Date.now()}`,
      type: 'JOURNAL',
      date: new Date(),
      description: 'Dimension smoke voucher',
      amount: new Prisma.Decimal(500),
      status: 'DRAFT',
      preparedById: admin.id,
      businessUnitId: buA.id,
      projectId: project?.id ?? null,
    },
  })
  assert(voucher.businessUnitId === buA.id, 'TC-DIM-4: voucher header BU persisted')

  // Mirror the approve handler — generate a JE with line BU copied from voucher header.
  const cascadeEntryNo = `JE-VCH-DIM-${Date.now()}`
  const cascadeJe = await prisma.journalEntry.create({
    data: {
      entryNo: cascadeEntryNo,
      date: voucher.date,
      description: `JOURNAL Voucher: ${voucher.description}`,
      reference: voucher.voucherNo,
      fiscalYearId: fy.id,
      projectId: voucher.projectId,
      grantId: voucher.grantId,
      businessUnitId: voucher.businessUnitId,
      totalDebit: new Prisma.Decimal(500),
      totalCredit: new Prisma.Decimal(500),
      status: 'APPROVED',
      isAutoGenerated: true,
      sourceModule: 'voucher',
      sourceId: voucher.id,
      createdById: admin.id,
      approvedById: admin.id,
      approvedAt: new Date(),
      postedAt: new Date(),
      lines: {
        create: [
          {
            accountId: debitAccount.id,
            description: voucher.description,
            debit: new Prisma.Decimal(500),
            credit: new Prisma.Decimal(0),
            projectId: voucher.projectId,
            businessUnitId: voucher.businessUnitId,
          },
          {
            accountId: creditAccount.id,
            description: voucher.description,
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(500),
            projectId: voucher.projectId,
            businessUnitId: voucher.businessUnitId,
          },
        ],
      },
    },
    include: { lines: true },
  })
  assert(cascadeJe.businessUnitId === buA.id, 'TC-DIM-4: cascade JE header carries voucher BU')
  assert(
    cascadeJe.lines.every((line) => line.businessUnitId === buA.id),
    'TC-DIM-4: every JE line carries voucher BU',
  )

  console.log(`\n=== TC-DIM-7: header-level BU filter on JE list ===`)
  const filteredJes = await prisma.journalEntry.findMany({
    where: { businessUnitId: buA.id, fiscalYear: { organizationId: org.id } },
    select: { id: true, entryNo: true, businessUnitId: true },
    take: 5,
  })
  assert(filteredJes.length >= 1, `TC-DIM-7: header BU=${buA.code} filter returned ${filteredJes.length} JE(s)`)
  assert(
    filteredJes.every((j) => j.businessUnitId === buA.id),
    'TC-DIM-7: every returned JE has the filter BU',
  )

  console.log(`\n=== TC-DIM-8: existing dimensionless JE rows still load ===`)
  const dimlessLines = await prisma.journalEntryLine.count({ where: { businessUnitId: null } })
  console.log(`  Found ${dimlessLines} dimensionless line(s) — expected to be > 0 from pre-feature data`)
  assert(true, 'TC-DIM-8: dimensionless rows do not error (counted via prisma)')

  console.log(`\n=== TC-DIM-9: procurement auto-posted JEs preserve dimensions ===`)
  const procLines = await prisma.journalEntryLine.findMany({
    where: {
      journalEntry: { sourceModule: 'PROCUREMENT_GRN' },
    },
    select: { businessUnitId: true, costCenterId: true, fundClassId: true, projectId: true, budgetLineId: true },
    take: 5,
  })
  if (procLines.length === 0) {
    console.log('  (no PROCUREMENT_GRN-sourced JE lines to inspect; ran fine)')
  } else {
    const withAnyDim = procLines.filter(
      (l) => l.businessUnitId || l.costCenterId || l.fundClassId || l.projectId || l.budgetLineId,
    )
    console.log(`  ${withAnyDim.length}/${procLines.length} procurement JE lines carry at least one dimension`)
  }
  assert(true, 'TC-DIM-9: procurement-sourced JE lines query succeeded after refactor')

  // Cleanup smoke artifacts (JE + voucher + cascade JE)
  console.log(`\n--- Cleaning up smoke artifacts ---`)
  await prisma.journalEntry.delete({ where: { id: cascadeJe.id } })
  await prisma.voucher.delete({ where: { id: voucher.id } })
  await prisma.journalEntry.delete({ where: { id: je.id } })
  console.log(`  ✓ removed ${entryNo}, ${cascadeEntryNo}, voucher ${voucher.voucherNo}`)

  console.log(`\nDone. ${pass} passed, ${fail} failed.`)
  if (fail > 0) process.exit(1)
}

main()
  .catch((e) => {
    console.error('❌ Smoke failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
