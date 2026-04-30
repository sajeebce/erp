/**
 * Seed: Demo Training Data for Training Participation Control
 * Creates trainings to demonstrate duplicate, overlap, non-overlap,
 * cancelled, and completed-history behavior.
 *
 * Run: pnpm exec tsx prisma/seed-training-demo.ts
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
    trainingNo: 'TRN-A',
    title: 'Safeguarding Training',
    type: 'INTERNAL' as const,
    facilitator: 'HR Department',
    venue: 'Khulna Head Office - Training Hall',
    startDate: new Date('2026-05-10T10:00:00+06:00'),
    endDate: new Date('2026-05-10T13:00:00+06:00'),
    durationHours: 3,
    capacity: 20,
    status: 'PLANNED' as const,
    projectNo: 'PRJ-2026-001',
    description: 'Safeguarding and code of conduct training.',
  },
  {
    trainingNo: 'TRN-B',
    title: 'Project Cycle Management',
    type: 'EXTERNAL' as const,
    facilitator: 'BRAC Institute of Development Studies',
    venue: 'Khulna Head Office - Conference Room A',
    startDate: new Date('2026-05-10T12:00:00+06:00'),
    endDate: new Date('2026-05-10T15:00:00+06:00'),
    durationHours: 3,
    capacity: 20,
    status: 'PLANNED' as const,
    projectNo: 'PRJ-2026-001',
    description: 'PCM fundamentals: logframe, M&E, reporting.',
  },
  {
    trainingNo: 'TRN-F',
    title: 'Partner Reporting Workshop',
    type: 'EXTERNAL' as const,
    facilitator: 'Program Quality Team',
    venue: 'Khulna Head Office - Conference Room C',
    startDate: new Date('2026-05-10T12:00:00+06:00'),
    endDate: new Date('2026-05-10T15:00:00+06:00'),
    durationHours: 3,
    capacity: 20,
    status: 'PLANNED' as const,
    projectNo: 'PRJ-2026-002',
    description: 'Different-project overlap fixture for nomination conflict testing.',
  },
  {
    trainingNo: 'TRN-C',
    title: 'Finance Compliance Orientation',
    type: 'INTERNAL' as const,
    facilitator: 'Finance Department',
    venue: 'Khulna Head Office - Conference Room B',
    startDate: new Date('2026-05-10T14:00:00+06:00'),
    endDate: new Date('2026-05-10T17:00:00+06:00'),
    durationHours: 3,
    capacity: 20,
    status: 'PLANNED' as const,
    projectNo: 'PRJ-2026-001',
    description: 'Finance compliance orientation for project staff.',
  },
  {
    trainingNo: 'TRN-D',
    title: 'Cancelled Field Safety Session',
    type: 'INTERNAL' as const,
    facilitator: 'Security Focal',
    venue: 'Khulna Head Office - Training Hall',
    startDate: new Date('2026-05-10T11:00:00+06:00'),
    endDate: new Date('2026-05-10T12:00:00+06:00'),
    durationHours: 1,
    capacity: 20,
    status: 'CANCELLED' as const,
    projectNo: 'PRJ-2026-002',
    description: 'Cancelled overlap control fixture.',
  },
  {
    trainingNo: 'TRN-E',
    title: 'Completed HR Policy Session',
    type: 'INTERNAL' as const,
    facilitator: 'HR Department',
    venue: 'Khulna Head Office - Training Hall',
    startDate: new Date('2026-05-09T10:00:00+06:00'),
    endDate: new Date('2026-05-09T12:00:00+06:00'),
    durationHours: 2,
    capacity: 20,
    status: 'COMPLETED' as const,
    projectNo: 'PRJ-2026-001',
    description: 'Completed training history fixture.',
  },
]

async function main() {
  console.log('=== Training Demo Seed ===\n')

  const organization = await prisma.organization.findFirst({
    where: { slug: 'cssbd' },
    select: { id: true, slug: true },
  })
  if (!organization) {
    throw new Error('Organization cssbd not found. Run the base demo seed first.')
  }

  const projects = await prisma.project.findMany({
    where: { organizationId: organization.id, status: 'ACTIVE', deletedAt: null },
    select: { id: true, projectNo: true },
    orderBy: { projectNo: 'asc' },
    take: 2,
  })
  if (projects.length < 2) {
    throw new Error('At least two active projects are required for training demo seed.')
  }
  const projectByNo = Object.fromEntries(projects.map((project) => [project.projectNo, project]))

  for (const training of TRAININGS) {
    const { projectNo, ...trainingData } = training
    const project = projectByNo[projectNo] ?? projects[0]
    await prisma.training.upsert({
      where: {
        organizationId_trainingNo: {
          organizationId: organization.id,
          trainingNo: trainingData.trainingNo,
        },
      },
      create: {
        ...trainingData,
        organizationId: organization.id,
        projectId: project.id,
      },
      update: {
        ...trainingData,
        projectId: project.id,
      },
    })
    console.log(`OK ${training.trainingNo} - ${training.title} (${training.status})`)
  }

  console.log('\n=== Done ===')
  console.log(`Organization: ${organization.slug}`)
  console.log(`Project A: ${projects[0].projectNo}`)
  console.log(`Project B: ${projects[1].projectNo}`)
  console.log('\nDemo scenario:')
  console.log('  1. Assign employee to TRN-A -> SUCCESS')
  console.log('  2. Assign same employee to TRN-A again -> DUPLICATE ERROR')
  console.log('  3. Assign same employee to TRN-B (same project, overlaps TRN-A) -> OVERLAP ERROR')
  console.log('  4. Assign same employee to TRN-F (different project, overlaps TRN-A) -> OVERLAP ERROR')
  console.log('  5. Assign same employee to TRN-C (14:00-17:00, no overlap) -> SUCCESS')
}

main()
  .catch(console.error)
  .finally(() => pool.end())
