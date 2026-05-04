import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const shapla = await prisma.organization.findFirst({ where: { slug: 'shapla-foundation' } })
  if (!shapla) {
    console.log('NO_SHAPLA — already deleted')
    return
  }
  console.log('Found shapla org:', shapla.id, shapla.name)

  const orgId = shapla.id

  // Resolve dependent IDs scoped to shapla
  const fiscalYears = await prisma.fiscalYear.findMany({ where: { organizationId: orgId }, select: { id: true } })
  const fiscalYearIds = fiscalYears.map((f) => f.id)
  const budgets = await prisma.budget.findMany({ where: { fiscalYearId: { in: fiscalYearIds } }, select: { id: true } })
  const budgetIds = budgets.map((b) => b.id)
  const revisions = await prisma.budgetRevision.findMany({ where: { budgetId: { in: budgetIds } }, select: { id: true } })
  const revisionIds = revisions.map((r) => r.id)
  const donors = await prisma.donor.findMany({ where: { organizationId: orgId }, select: { id: true } })
  const donorIds = donors.map((d) => d.id)

  console.log(
    `To clean: ${fiscalYearIds.length} FYs, ${budgetIds.length} budgets, ${revisionIds.length} revisions, ${donorIds.length} donors`
  )

  await prisma.$transaction([
    prisma.budgetRevisionLine.deleteMany({ where: { revisionId: { in: revisionIds } } }),
    prisma.budgetRevision.deleteMany({ where: { id: { in: revisionIds } } }),
    prisma.budgetLine.deleteMany({ where: { budgetId: { in: budgetIds } } }),
    prisma.budget.deleteMany({ where: { id: { in: budgetIds } } }),
    prisma.beneficiary.deleteMany({ where: { organizationId: orgId } }),
    prisma.grant.deleteMany({ where: { donorId: { in: donorIds } } }),
    prisma.donor.deleteMany({ where: { organizationId: orgId } }),
    prisma.employee.deleteMany({ where: { organizationId: orgId } }),
    prisma.project.deleteMany({ where: { organizationId: orgId } }),
    prisma.numberSequence.deleteMany({ where: { organizationId: orgId } }),
    prisma.fiscalYear.deleteMany({ where: { organizationId: orgId } }),
    prisma.role.deleteMany({ where: { organizationId: orgId } }),
    prisma.user.deleteMany({ where: { organizationId: orgId } }),
    prisma.organization.delete({ where: { id: orgId } }),
  ])

  console.log('shapla-foundation deleted (cascade)')

  const remaining = await prisma.organization.findMany({ select: { slug: true, name: true } })
  console.log('Remaining orgs:', remaining)
}

main()
  .catch((e) => {
    console.error('FAILED:', e.message, e.code || '')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
