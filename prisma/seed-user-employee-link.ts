/**
 * Links CSS demo User accounts to Employee records for attendance testing.
 * Run: npx tsx prisma/seed-user-employee-link.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('=== CSS demo user-employee link seed ===\n')

  const org = await prisma.organization.findFirst({
    where: { slug: 'cssbd' },
    select: { id: true, name: true },
  })

  if (!org) {
    console.log('CSS BD organization not found. Exiting.')
    return
  }

  const demoLinks = [
    { email: 'rahim@cssbd.org', employeeNo: 'EMP-006', fullName: 'Abdur Rahim' },
    { email: 'kamal@cssbd.org', employeeNo: 'EMP-003', fullName: 'Kamal Ahmed' },
    { email: 'shakil@cssbd.org', employeeNo: 'EMP-005', fullName: 'Shakil Ahmed' },
  ]

  for (const link of demoLinks) {
    const user = await prisma.user.findFirst({
      where: { organizationId: org.id, email: link.email },
      select: { id: true, email: true },
    })

    const employee = await prisma.employee.findFirst({
      where: { organizationId: org.id, employeeNo: link.employeeNo, deletedAt: null },
      select: { id: true, employeeNo: true },
    })

    if (!user || !employee) {
      console.log(`SKIP: ${link.email} -> ${link.employeeNo} (missing user or employee)`)
      continue
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        userId: user.id,
        fullName: link.fullName,
      },
    })

    console.log(`Linked ${link.email} -> ${link.employeeNo} (${link.fullName})`)
  }

  console.log('\nFinal mapping:')
  const updated = await prisma.employee.findMany({
    where: { organizationId: org.id, deletedAt: null, userId: { not: null } },
    select: {
      employeeNo: true,
      fullName: true,
      user: { select: { email: true, role: { select: { name: true } } } },
    },
    orderBy: { employeeNo: 'asc' },
  })
  updated.forEach((employee) => {
    console.log(
      `  ${employee.employeeNo} ${employee.fullName} -> ${employee.user?.email} (${employee.user?.role.name})`
    )
  })
}

main()
  .catch(console.error)
  .finally(() => pool.end())
