/**
 * Budget Extras Seed: Budget Revisions + Cost Allocation Rules
 * Requires: seed-bootstrap, seed-accounts, seed-phase3, seed-budget to run first.
 * Run: npx tsx prisma/seed-budget-extras.ts
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
  console.log('🌱 Seeding Budget Extras (Revisions + Cost Allocation)...')

  const org = await prisma.organization.findUnique({ where: { slug: 'shapla-foundation' } })
  if (!org) throw new Error('Organization not found. Run seed-bootstrap first.')

  const adminUser = await prisma.user.findFirst({ where: { organizationId: org.id, email: 'rahim@shapla.org' } })
  if (!adminUser) throw new Error('Admin user not found. Run seed-bootstrap first.')

  const washBudget = await prisma.budget.findFirst({ where: { name: { contains: 'WASH Phase-3' } } })
  const hqBudget = await prisma.budget.findFirst({ where: { name: { contains: 'HQ Administrative' } } })

  if (!washBudget || !hqBudget) throw new Error('Budgets not found. Run seed-budget first.')

  const projects = await prisma.project.findMany({
    where: { organizationId: org.id },
    orderBy: { projectNo: 'asc' },
    take: 3,
  })
  if (projects.length < 2) throw new Error('Projects not found. Run seed-phase3 first.')

  // ── Budget Revisions ──────────────────────────────────────────────────────

  const existingRevisions = await prisma.budgetRevision.count({ where: { budgetId: washBudget.id } })
  if (existingRevisions > 0) {
    console.log('✓ Budget revisions already seeded, skipping')
  } else {
    await prisma.budgetRevision.createMany({
      data: [
        {
          revisionNo: 'BRV-2026-001',
          budgetId: washBudget.id,
          date: new Date('2025-10-15'),
          originalTotal: 7500000,
          revisedTotal: 8200000,
          changeAmount: 700000,
          changePercent: 9.33,
          reason: 'Additional community outreach activities added per donor request in Q2 review.',
          status: 'APPROVED',
          approvedById: adminUser.id,
          approvedAt: new Date('2025-10-20'),
        },
        {
          revisionNo: 'BRV-2026-002',
          budgetId: washBudget.id,
          date: new Date('2026-01-10'),
          originalTotal: 8200000,
          revisedTotal: 7950000,
          changeAmount: -250000,
          changePercent: -3.05,
          reason: 'Reallocation from travel to program supplies following field assessment findings.',
          status: 'APPROVED',
          approvedById: adminUser.id,
          approvedAt: new Date('2026-01-15'),
        },
        {
          revisionNo: 'BRV-2026-003',
          budgetId: washBudget.id,
          date: new Date('2026-03-01'),
          originalTotal: 7950000,
          revisedTotal: 8450000,
          changeAmount: 500000,
          changePercent: 6.29,
          reason: 'Scale-up of sanitation component based on positive community feedback.',
          status: 'SUBMITTED',
        },
        {
          revisionNo: 'BRV-2026-004',
          budgetId: hqBudget.id,
          date: new Date('2026-02-01'),
          originalTotal: 3600000,
          revisedTotal: 3750000,
          changeAmount: 150000,
          changePercent: 4.17,
          reason: 'Utility and internet costs increased due to office expansion in Sylhet.',
          status: 'APPROVED',
          approvedById: adminUser.id,
          approvedAt: new Date('2026-02-05'),
        },
        {
          revisionNo: 'BRV-2026-005',
          budgetId: hqBudget.id,
          date: new Date('2026-03-15'),
          originalTotal: 3750000,
          revisedTotal: 3750000,
          changeAmount: 0,
          changePercent: 0,
          reason: 'Line item reallocation within approved total — no net change.',
          status: 'DRAFT',
        },
      ],
    })
    console.log('✓ 5 budget revisions created (WASH × 3, HQ × 2)')
  }

  // ── Cost Allocation Rules ─────────────────────────────────────────────────

  const existingRules = await prisma.costAllocationRule.count({
    where: { entries: { some: { project: { organizationId: org.id } } } },
  })

  if (existingRules > 0) {
    console.log('✓ Cost allocation rules already seeded, skipping')
  } else {
    const rules = [
      {
        name: 'Office Rent Allocation',
        description: 'Monthly head office rent split across active projects by staff headcount',
        totalAmount: 120000,
        isActive: true,
        frequency: 'MONTHLY',
        splits: [
          { idx: 0, pct: 40, amt: 48000 },
          { idx: 1, pct: 35, amt: 42000 },
          { idx: 2, pct: 25, amt: 30000 },
        ],
      },
      {
        name: 'Internet & Utilities',
        description: 'Shared IT and utility costs distributed across programs',
        totalAmount: 35000,
        isActive: true,
        frequency: 'MONTHLY',
        splits: [
          { idx: 0, pct: 60, amt: 21000 },
          { idx: 1, pct: 40, amt: 14000 },
        ],
      },
      {
        name: 'Vehicle Running Costs',
        description: 'Field vehicle fuel and maintenance shared across field projects',
        totalAmount: 85000,
        isActive: false,
        frequency: 'MONTHLY',
        splits: [
          { idx: 0, pct: 55, amt: 46750 },
          { idx: 2, pct: 45, amt: 38250 },
        ],
      },
    ]

    for (const rule of rules) {
      const created = await prisma.costAllocationRule.create({
        data: { name: rule.name, description: rule.description, totalAmount: rule.totalAmount, isActive: rule.isActive, frequency: rule.frequency },
      })
      for (const split of rule.splits) {
        const project = projects[split.idx]
        if (!project) continue
        await prisma.costAllocationEntry.create({
          data: {
            ruleId: created.id,
            projectId: project.id,
            percentage: split.pct,
            allocatedAmount: split.amt,
            periodStart: new Date('2026-01-01'),
            periodEnd: new Date('2026-01-31'),
          },
        })
      }
    }
    console.log('✓ 3 cost allocation rules + entries created')
  }

  console.log('✅ Budget extras seed completed!')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
