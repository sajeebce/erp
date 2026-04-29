/**
 * Links User accounts to Employee records for demo/testing.
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
  console.log('=== User–Employee Link Seed ===\n')

  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Found ${users.length} user(s):`)
  users.forEach((u, i) => console.log(`  ${i + 1}. ${u.email} — ${u.fullName ?? '(no name)'} [${u.id}]`))

  const employees = await prisma.employee.findMany({
    where: { deletedAt: null },
    select: { id: true, fullName: true, userId: true },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`\nFound ${employees.length} employee(s):`)
  employees.forEach((e, i) =>
    console.log(`  ${i + 1}. ${e.fullName} — userId: ${e.userId ?? 'NULL'} [${e.id}]`)
  )

  if (users.length === 0 || employees.length === 0) {
    console.log('\nNo users or employees found. Exiting.')
    return
  }

  // Link users to employees in order (first user → first employee, etc.)
  const linkCount = Math.min(users.length, employees.length)
  console.log(`\nLinking ${linkCount} user(s) to employee(s)...`)

  for (let i = 0; i < linkCount; i++) {
    const user = users[i]
    const employee = employees[i]

    if (employee.userId) {
      console.log(`  SKIP: ${employee.fullName} already linked to a user`)
      continue
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: { userId: user.id },
    })

    console.log(`  ✅ ${user.email} → ${employee.fullName}`)
  }

  console.log('\n=== Done ===')
  console.log('\nFinal mapping:')
  const updated = await prisma.employee.findMany({
    where: { deletedAt: null, userId: { not: null } },
    select: { fullName: true, userId: true, user: { select: { email: true } } },
  })
  updated.forEach((e) => console.log(`  ${e.fullName} → ${e.user?.email}`))
}

main()
  .catch(console.error)
  .finally(() => pool.end())
