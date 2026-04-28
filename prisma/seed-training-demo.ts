/**
 * Seed: Demo Training Data for Task 2 — Training Participation Control
 * Creates trainings to demonstrate duplicate + overlap validation.
 *
 * Run: npx tsx prisma/seed-training-demo.ts
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

const TRAININGS = [
  {
    trainingNo: 'TRN-2026-001',
    title: 'Financial Management for NGOs',
    type: 'INTERNAL' as const,
    facilitator: 'Accounts Department',
    venue: 'Khulna Head Office — Conference Room A',
    startDate: new Date('2026-03-10'),
    endDate: new Date('2026-03-12'),
    durationHours: 24,
    status: 'COMPLETED' as const,
    description: 'Core financial management principles for NGO staff.',
  },
  {
    trainingNo: 'TRN-2026-002',
    title: 'Project Cycle Management',
    type: 'EXTERNAL' as const,
    facilitator: 'BRAC Institute of Development Studies',
    venue: 'Khulna Head Office — Training Hall',
    startDate: new Date('2026-05-10'),
    endDate: new Date('2026-05-12'),
    durationHours: 24,
    status: 'PLANNED' as const,
    description: 'PCM fundamentals: logframe, M&E, reporting.',
  },
  {
    trainingNo: 'TRN-2026-003',
    title: 'Field Data Collection & MIS',
    type: 'INTERNAL' as const,
    facilitator: 'M&E Unit',
    venue: 'MFP Branch 001 — Batiaghata',
    startDate: new Date('2026-05-11'),
    endDate: new Date('2026-05-13'),
    durationHours: 16,
    status: 'PLANNED' as const,
    description: 'Data collection tools, KoboToolbox, MIS entry standards.',
  },
  {
    trainingNo: 'TRN-2026-004',
    title: 'HR Policies & Staff Conduct',
    type: 'INTERNAL' as const,
    facilitator: 'HR Department',
    venue: 'Khulna Head Office — Conference Room B',
    startDate: new Date('2026-06-05'),
    endDate: new Date('2026-06-05'),
    durationHours: 8,
    status: 'PLANNED' as const,
    description: 'Policy orientation for all staff — annual requirement.',
  },
]

async function main() {
  console.log('=== Training Demo Seed ===\n')

  for (const training of TRAININGS) {
    await prisma.training.upsert({
      where: { trainingNo: training.trainingNo },
      create: training,
      update: {
        title: training.title,
        status: training.status,
        startDate: training.startDate,
        endDate: training.endDate,
      },
    })
    console.log(`✅ ${training.trainingNo} — ${training.title} (${training.status})`)
  }

  console.log('\n=== Done ===')
  console.log('\nDemo scenario:')
  console.log('  1. Assign employee to TRN-2026-002 → SUCCESS')
  console.log('  2. Assign same employee to TRN-2026-002 again → DUPLICATE ERROR')
  console.log('  3. Assign same employee to TRN-2026-003 (May 11-13, overlaps May 10-12) → OVERLAP ERROR')
  console.log('  4. Assign same employee to TRN-2026-004 (June 5, no overlap) → SUCCESS')
}

main()
  .catch(console.error)
  .finally(() => pool.end())
