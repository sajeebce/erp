/**
 * Migration: Fix gender casing in Employee and Beneficiary tables
 * Converts Title Case ('Male', 'Female', 'Other') → UPPERCASE ('MALE', 'FEMALE', 'OTHER')
 * Run: pnpm tsx prisma/migration-fix-gender-case.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔄 Fixing gender casing...\n')

  // Fix Employee gender
  const empMale = await prisma.$executeRawUnsafe(`UPDATE "Employee" SET gender = 'MALE' WHERE gender = 'Male'`)
  const empFemale = await prisma.$executeRawUnsafe(`UPDATE "Employee" SET gender = 'FEMALE' WHERE gender = 'Female'`)
  const empOther = await prisma.$executeRawUnsafe(`UPDATE "Employee" SET gender = 'OTHER' WHERE gender = 'Other'`)
  console.log(`  Employee: ${empMale} Male→MALE, ${empFemale} Female→FEMALE, ${empOther} Other→OTHER`)

  // Fix Beneficiary gender
  const benMale = await prisma.$executeRawUnsafe(`UPDATE "Beneficiary" SET gender = 'MALE' WHERE gender = 'Male'`)
  const benFemale = await prisma.$executeRawUnsafe(`UPDATE "Beneficiary" SET gender = 'FEMALE' WHERE gender = 'Female'`)
  const benOther = await prisma.$executeRawUnsafe(`UPDATE "Beneficiary" SET gender = 'OTHER' WHERE gender = 'Other'`)
  console.log(`  Beneficiary: ${benMale} Male→MALE, ${benFemale} Female→FEMALE, ${benOther} Other→OTHER`)

  console.log('\n✅ Gender casing fix complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
