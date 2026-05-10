import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const org = await prisma.organization.findUnique({ where: { slug: 'cssbd' } })
  if (!org) throw new Error('Organization "cssbd" not found. Run bootstrap seed first.')

  const departments = [
    { name: 'Finance & Accounts', code: 'FIN' },
    { name: 'Programs', code: 'PRG' },
    { name: 'Human Resources', code: 'HRD' },
    { name: 'Field Operations', code: 'FLD' },
    { name: 'IT & Systems', code: 'ITS' },
    { name: 'Administration', code: 'ADM' },
    { name: 'Monitoring & Evaluation', code: 'MNE' },
    { name: 'Procurement & Logistics', code: 'PRL' },
  ]

  for (const department of departments) {
    await prisma.department.upsert({
      where: {
        organizationId_code: {
          organizationId: org.id,
          code: department.code,
        },
      },
      update: {
        name: department.name,
        isActive: true,
      },
      create: {
        organizationId: org.id,
        ...department,
      },
    })
  }

  console.log(`Seeded ${departments.length} HR update departments for ${org.slug}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
