/**
 * Bootstrap Seed: Creates org, admin user, role, fiscal year
 * Must run BEFORE all other seed files.
 * Run: npx tsx prisma/seed-bootstrap.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { hashSync } from 'bcryptjs'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const STANDARD_ROLES = [
  {
    name: 'ADMIN',
    description: 'Organization Administrator - full access',
    isSystem: true,
  },
  {
    name: 'STAFF',
    description: 'Can create and track purchase requisitions (staff member)',
    isSystem: false,
  },
  {
    name: 'STORE_MANAGER',
    description: 'Can receive goods, manage inventory, register assets from GRN',
    isSystem: false,
  },
  {
    name: 'PROGRAM_COORDINATOR',
    description: 'Can review purchase requisitions at program coordination approval step',
    isSystem: false,
  },
  {
    name: 'FINANCE_MANAGER',
    description: 'Can review purchase requisitions at finance approval step',
    isSystem: false,
  },
  {
    name: 'EXECUTIVE_DIRECTOR',
    description: 'Can review high-value purchase requisitions at executive approval step',
    isSystem: false,
  },
  {
    name: 'PROJECT_MANAGER',
    description: 'Can manage assigned projects, create project records, and submit no-cost extension requests without approval authority.',
    isSystem: false,
  },
]

async function main() {
  console.log('🌱 Bootstrap seeding...')

  // Upsert org
  let org = await prisma.organization.findFirst({ where: { slug: 'cssbd' } })
  if (org) {
    console.log('✓ Organization already exists')
  } else {
    org = await prisma.organization.create({
    data: {
      name: 'CSS',
      slug: 'cssbd',
      registrationNo: 'REG-2024-001',
      ngoabLicenseNo: 'NGOAB-2024-001',
      address: '42 Dhanmondi, Dhaka-1205',
      district: 'Dhaka',
      phone: '+880-2-9876543',
      email: 'info@cssbd.org',
      website: 'https://cssbd.org',
      baseCurrency: 'BDT',
      fiscalYearStartMonth: 7,
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'bn'],
    }
  })
    console.log('✓ Organization created:', org.slug)
  }

  // Upsert role
  let role = await prisma.role.findFirst({ where: { organizationId: org.id, name: 'ADMIN' } })
  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Full access administrator',
        organizationId: org.id,
      }
    })
    console.log('✓ Role created:', role.name)
  } else {
    console.log('✓ Role already exists')
  }

  // Upsert all standard roles required by purchase approval tests.
  for (const standardRole of STANDARD_ROLES) {
    const existing = await prisma.role.findFirst({
      where: { organizationId: org.id, name: standardRole.name },
    })

    if (existing) {
      await prisma.role.update({
        where: { id: existing.id },
        data: {
          description: standardRole.description,
          isSystem: standardRole.isSystem,
        },
      })
      console.log('Role already exists:', standardRole.name)
    } else {
      await prisma.role.create({
        data: {
          organizationId: org.id,
          name: standardRole.name,
          description: standardRole.description,
          isSystem: standardRole.isSystem,
        },
      })
      console.log('Role created:', standardRole.name)
    }
  }

  // Upsert user
  let user = await prisma.user.findFirst({ where: { email: 'rahim@cssbd.org' } })
  if (!user) {
    user = await prisma.user.create({
    data: {
      email: 'rahim@cssbd.org',
      passwordHash: hashSync('SecurePass@2026!', 10),
      fullName: 'Abdur Rahim',
      phone: '+8801712345678',
      organizationId: org.id,
      roleId: role.id,
      status: 'ACTIVE',
    }
  })
    console.log('✓ Admin user created:', user.email)
  } else {
    console.log('✓ Admin user already exists')
  }

  // Upsert fiscal year
  let fy = await prisma.fiscalYear.findFirst({ where: { organizationId: org.id, isCurrent: true } })
  if (!fy) {
    fy = await prisma.fiscalYear.create({
    data: {
      organizationId: org.id,
      name: '2025-2026',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: true,
    }
  })
    console.log('✓ Fiscal year created:', fy.name)
  } else {
    console.log('✓ Fiscal year already exists')
  }

  console.log('✅ Bootstrap complete!')
}

main()
  .catch((e) => {
    console.error('❌ Bootstrap failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
