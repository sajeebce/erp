/**
 * Seed Leave Balances for all active employees
 * Run: npx tsx prisma/seed-leave-balances.ts
 * Requires: seed-bootstrap, seed-phase5 (employees + leave types)
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
  console.log('🌱 Seeding Leave Balances...')

  const org = await prisma.organization.findUnique({ where: { slug: 'cssbd' } })
  if (!org) throw new Error('Organization not found. Run seed-bootstrap first.')

  const employees = await prisma.employee.findMany({
    where: { organizationId: org.id, status: 'ACTIVE', deletedAt: null },
    select: { id: true, employeeNo: true, fullName: true, gender: true },
    orderBy: { employeeNo: 'asc' },
  })

  const leaveTypes = await prisma.leaveType.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, daysPerYear: true },
  })

  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: { organizationId: org.id, isCurrent: true },
    select: { id: true },
  })

  if (employees.length === 0) throw new Error('No employees found. Run seed-phase5 first.')
  if (leaveTypes.length === 0) throw new Error('No leave types found. Run seed-phase5 first.')

  // Realistic taken days per employee (varies by seniority/randomness)
  const takenMap: Record<string, Record<string, number>> = {
    'EMP-001': { AL: 8, CL: 4, SL: 3, WP: 0, ML: 0 },
    'EMP-002': { AL: 5, CL: 2, SL: 1, WP: 0, ML: 0 },
    'EMP-003': { AL: 10, CL: 6, SL: 2, WP: 0, ML: 0 },
    'EMP-004': { AL: 3, CL: 3, SL: 5, WP: 0, ML: 0 },
    'EMP-005': { AL: 6, CL: 1, SL: 0, WP: 0, ML: 0 },
    'EMP-006': { AL: 4, CL: 2, SL: 2, WP: 0, ML: 0 },
    'EMP-007': { AL: 2, CL: 1, SL: 0, WP: 0, ML: 0 },
  }

  // Carried forward from previous year
  const cfMap: Record<string, Record<string, number>> = {
    'EMP-001': { AL: 5 },
    'EMP-003': { AL: 3 },
    'EMP-004': { AL: 7 },
  }

  let created = 0

  for (const emp of employees) {
    for (const lt of leaveTypes) {
      // Skip Maternity Leave for male employees
      if (lt.code === 'ML' && emp.gender === 'MALE') continue
      // Skip Without Pay (only used when other leaves exhausted)
      if (lt.code === 'WP') continue

      const taken = takenMap[emp.employeeNo]?.[lt.code] ?? 0
      const cf = cfMap[emp.employeeNo]?.[lt.code] ?? 0
      const entitled = lt.daysPerYear + cf
      const remaining = entitled - taken

      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_fiscalYearId: {
            employeeId: emp.id,
            leaveTypeId: lt.id,
            fiscalYearId: fiscalYear?.id ?? null as unknown as string,
          },
        },
        update: { entitled, taken, remaining, carriedForward: cf },
        create: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          fiscalYearId: fiscalYear?.id ?? null,
          entitled,
          taken,
          remaining,
          carriedForward: cf,
        },
      })
      created++
    }
  }

  console.log(`✓ ${created} leave balance records created for ${employees.length} employees`)

  // Also seed a few more leave applications to make it richer
  // Check existing apps first
  const existingApps = await prisma.leaveApplication.count()
  if (existingApps < 10) {
    const adminUser = await prisma.user.findFirst({ where: { organizationId: org.id } })
    const alType = leaveTypes.find(lt => lt.code === 'AL')!
    const clType = leaveTypes.find(lt => lt.code === 'CL')!
    const slType = leaveTypes.find(lt => lt.code === 'SL')!

    const extraApps = [
      // Taslima (EMP-006) — the employee we're viewing
      { emp: employees.find(e => e.employeeNo === 'EMP-006')!, type: alType, start: '2025-12-20', end: '2025-12-24', days: 3, status: 'APPROVED' as const, no: 'LA-2526-006' },
      { emp: employees.find(e => e.employeeNo === 'EMP-006')!, type: clType, start: '2026-01-15', end: '2026-01-15', days: 1, status: 'APPROVED' as const, no: 'LA-2526-007' },
      { emp: employees.find(e => e.employeeNo === 'EMP-006')!, type: slType, start: '2026-02-10', end: '2026-02-11', days: 2, status: 'APPROVED' as const, no: 'LA-2526-008' },
      { emp: employees.find(e => e.employeeNo === 'EMP-006')!, type: alType, start: '2026-04-10', end: '2026-04-11', days: 2, status: 'PENDING' as const, no: 'LA-2526-009' },
      // Karim (EMP-001)
      { emp: employees.find(e => e.employeeNo === 'EMP-001')!, type: alType, start: '2026-01-05', end: '2026-01-09', days: 5, status: 'APPROVED' as const, no: 'LA-2526-010' },
      { emp: employees.find(e => e.employeeNo === 'EMP-001')!, type: clType, start: '2026-02-20', end: '2026-02-21', days: 2, status: 'APPROVED' as const, no: 'LA-2526-011' },
      { emp: employees.find(e => e.employeeNo === 'EMP-001')!, type: slType, start: '2026-03-01', end: '2026-03-03', days: 3, status: 'APPROVED' as const, no: 'LA-2526-012' },
      // Nasima (EMP-002)
      { emp: employees.find(e => e.employeeNo === 'EMP-002')!, type: alType, start: '2025-11-15', end: '2025-11-19', days: 3, status: 'APPROVED' as const, no: 'LA-2526-013' },
      { emp: employees.find(e => e.employeeNo === 'EMP-002')!, type: clType, start: '2026-03-05', end: '2026-03-06', days: 2, status: 'APPROVED' as const, no: 'LA-2526-014' },
      // Mahbub (EMP-003)
      { emp: employees.find(e => e.employeeNo === 'EMP-003')!, type: alType, start: '2025-10-01', end: '2025-10-10', days: 8, status: 'APPROVED' as const, no: 'LA-2526-015' },
      { emp: employees.find(e => e.employeeNo === 'EMP-003')!, type: clType, start: '2026-01-20', end: '2026-01-23', days: 3, status: 'APPROVED' as const, no: 'LA-2526-016' },
      { emp: employees.find(e => e.employeeNo === 'EMP-003')!, type: slType, start: '2026-03-15', end: '2026-03-16', days: 2, status: 'APPROVED' as const, no: 'LA-2526-017' },
      { emp: employees.find(e => e.employeeNo === 'EMP-003')!, type: alType, start: '2026-04-15', end: '2026-04-16', days: 2, status: 'REJECTED' as const, no: 'LA-2526-018' },
    ]

    for (const app of extraApps) {
      if (!app.emp) continue
      const exists = await prisma.leaveApplication.findUnique({ where: { applicationNo: app.no } })
      if (exists) continue
      await prisma.leaveApplication.create({
        data: {
          applicationNo: app.no,
          employeeId: app.emp.id,
          leaveTypeId: app.type.id,
          startDate: new Date(app.start),
          endDate: new Date(app.end),
          days: app.days,
          status: app.status,
          reason: app.status === 'PENDING' ? 'Personal work' : undefined,
          approvedById: app.status === 'APPROVED' ? adminUser?.id : undefined,
          approvedAt: app.status === 'APPROVED' ? new Date() : undefined,
        },
      })
    }
    console.log(`✓ ${extraApps.length} additional leave applications created`)
  } else {
    console.log(`✓ Leave applications already seeded (${existingApps} existing)`)
  }

  console.log('✅ Leave balance seeding complete!')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
