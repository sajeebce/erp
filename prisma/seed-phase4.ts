/**
 * Phase 4 Seed: Activities, Milestones, Beneficiaries, Enrollments, Services, Impact
 * Run after Phase 3 seed: npx tsx prisma/seed-phase4.ts
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
  console.log('🌱 Seeding Phase 4 data...')

  const org = await prisma.organization.findUnique({ where: { slug: 'shapla-foundation' } })
  if (!org) throw new Error('Org not found')

  const projects = await prisma.project.findMany({ where: { organizationId: org.id }, orderBy: { projectNo: 'asc' } })
  const washProject = projects.find(p => p.name.includes('WASH'))!
  const eduProject = projects.find(p => p.name.includes('Education'))!
  const climateProject = projects.find(p => p.name.includes('Climate'))!

  // ─── 1. Activities for WASH project ───
  const activities = await Promise.all([
    prisma.activity.create({
      data: { activityNo: `${washProject.projectNo}-A001`, name: 'Install 50 tubewells in Sylhet Sadar', projectId: washProject.id, startDate: new Date('2025-10-01'), endDate: new Date('2026-03-31'), budget: 1500000, progress: 72, status: 'IN_PROGRESS' },
    }),
    prisma.activity.create({
      data: { activityNo: `${washProject.projectNo}-A002`, name: 'Conduct 20 hygiene awareness sessions', projectId: washProject.id, startDate: new Date('2025-09-01'), endDate: new Date('2026-06-30'), budget: 500000, progress: 40, status: 'IN_PROGRESS' },
    }),
    prisma.activity.create({
      data: { activityNo: `${washProject.projectNo}-A003`, name: 'Water quality testing in 5 upazilas', projectId: washProject.id, startDate: new Date('2026-01-01'), endDate: new Date('2026-05-31'), budget: 300000, progress: 15, status: 'PLANNED' },
    }),
    prisma.activity.create({
      data: { activityNo: `${washProject.projectNo}-A004`, name: 'Community WASH committee formation', projectId: washProject.id, startDate: new Date('2025-08-01'), endDate: new Date('2025-12-31'), budget: 200000, progress: 100, status: 'COMPLETED' },
    }),
    prisma.activity.create({
      data: { activityNo: `${eduProject.projectNo}-A001`, name: 'Teacher training program (50 sessions)', projectId: eduProject.id, startDate: new Date('2026-01-01'), endDate: new Date('2026-06-30'), budget: 750000, progress: 30, status: 'IN_PROGRESS' },
    }),
    prisma.activity.create({
      data: { activityNo: `${eduProject.projectNo}-A002`, name: 'Distribute textbooks to 5000 students', projectId: eduProject.id, startDate: new Date('2026-02-01'), endDate: new Date('2026-04-30'), budget: 1200000, progress: 0, status: 'DELAYED' },
    }),
  ])
  console.log(`✓ ${activities.length} Activities created`)

  // ─── 2. Milestones for WASH project ───
  const milestones = await Promise.all([
    prisma.milestone.create({
      data: { milestoneNo: `${washProject.projectNo}-M01`, description: 'Complete 25 tubewell installations', projectId: washProject.id, targetDate: new Date('2026-01-31'), actualDate: new Date('2026-01-28'), status: 'ACHIEVED', deliverable: 'Installation completion report' },
    }),
    prisma.milestone.create({
      data: { milestoneNo: `${washProject.projectNo}-M02`, description: 'Complete all 50 tubewells', projectId: washProject.id, targetDate: new Date('2026-03-31'), status: 'ON_TRACK', deliverable: 'Final installation report + GPS coordinates' },
    }),
    prisma.milestone.create({
      data: { milestoneNo: `${washProject.projectNo}-M03`, description: 'Submit mid-term evaluation report', projectId: washProject.id, targetDate: new Date('2026-06-30'), status: 'ON_TRACK', deliverable: 'Mid-term evaluation report to USAID' },
    }),
    prisma.milestone.create({
      data: { milestoneNo: `${eduProject.projectNo}-M01`, description: 'Complete teacher training Phase 1', projectId: eduProject.id, targetDate: new Date('2026-03-31'), status: 'AT_RISK', deliverable: 'Training completion certificates' },
    }),
  ])
  console.log(`✓ ${milestones.length} Milestones created`)

  // ─── 3. Beneficiaries ───
  const bens = await Promise.all([
    prisma.beneficiary.create({ data: { organizationId: org.id, beneficiaryNo: 'BEN-2026-001', name: 'Halima Begum', fatherSpouseName: 'Abdul Karim', age: 35, gender: 'Female', nidNumber: '1990123456789', district: 'Sylhet', upazila: 'Sylhet Sadar', union: 'Khadimpara', village: 'Hatkhola' } }),
    prisma.beneficiary.create({ data: { organizationId: org.id, beneficiaryNo: 'BEN-2026-002', name: 'Reshma Khatun', fatherSpouseName: 'Md. Alam', age: 28, gender: 'Female', nidNumber: '1995234567890', district: 'Sylhet', upazila: 'Sylhet Sadar', union: 'Mogalgaon' } }),
    prisma.beneficiary.create({ data: { organizationId: org.id, beneficiaryNo: 'BEN-2026-003', name: 'Kamal Hossain', fatherSpouseName: 'Late Nurul Islam', age: 42, gender: 'Male', nidNumber: '1982345678901', district: 'Sylhet', upazila: 'Bianibazar', union: 'Mathiura' } }),
    prisma.beneficiary.create({ data: { organizationId: org.id, beneficiaryNo: 'BEN-2026-004', name: 'Fatema Akter', fatherSpouseName: 'Jamal Uddin', age: 30, gender: 'Female', nidNumber: '1994456789012', district: 'Dhaka', upazila: 'Kamrangirchar', union: 'Ward 5' } }),
    prisma.beneficiary.create({ data: { organizationId: org.id, beneficiaryNo: 'BEN-2026-005', name: 'Sufia Begum', fatherSpouseName: 'Md. Rafiq', age: 38, gender: 'Female', nidNumber: '1986567890123', district: 'Sylhet', upazila: 'Golapganj', union: 'Lakshmanpur' } }),
    prisma.beneficiary.create({ data: { organizationId: org.id, beneficiaryNo: 'BEN-2026-006', name: 'Rahim Mia', fatherSpouseName: 'Korban Ali', age: 45, gender: 'Male', nidNumber: '1979678901234', district: 'Barishal', upazila: 'Bakerganj', union: 'Padrishibpur' } }),
    prisma.beneficiary.create({ data: { organizationId: org.id, beneficiaryNo: 'BEN-2026-007', name: 'Josna Rani', fatherSpouseName: 'Shyamal Das', age: 25, gender: 'Female', nidNumber: '1999789012345', district: 'Dhaka', upazila: 'Hazaribagh', union: 'Ward 3' } }),
    prisma.beneficiary.create({ data: { organizationId: org.id, beneficiaryNo: 'BEN-2026-008', name: 'Nargis Akter', fatherSpouseName: 'Md. Hanif', age: 32, gender: 'Female', nidNumber: '1992890123456', district: 'Sylhet', upazila: 'Companiganj', union: 'Islampur' } }),
  ])
  console.log(`✓ ${bens.length} Beneficiaries created`)

  // Update sequence
  await prisma.numberSequence.update({
    where: { organizationId_entity: { organizationId: org.id, entity: 'beneficiary' } },
    data: { currentValue: 8 },
  })

  // ─── 4. Enrollments ───
  const enrollments = await Promise.all([
    prisma.beneficiaryEnrollment.create({ data: { enrollmentNo: 'ENR-2026-001', beneficiaryId: bens[0].id, projectId: washProject.id, programName: 'WASH - Safe Water', enrollmentDate: new Date('2025-09-15'), status: 'ACTIVE' } }),
    prisma.beneficiaryEnrollment.create({ data: { enrollmentNo: 'ENR-2026-002', beneficiaryId: bens[1].id, projectId: washProject.id, programName: 'WASH - Safe Water', enrollmentDate: new Date('2025-09-15'), status: 'ACTIVE' } }),
    prisma.beneficiaryEnrollment.create({ data: { enrollmentNo: 'ENR-2026-003', beneficiaryId: bens[2].id, projectId: washProject.id, programName: 'WASH - Hygiene', enrollmentDate: new Date('2025-10-01'), status: 'ACTIVE' } }),
    prisma.beneficiaryEnrollment.create({ data: { enrollmentNo: 'ENR-2026-004', beneficiaryId: bens[4].id, projectId: washProject.id, programName: 'WASH - Sanitation', enrollmentDate: new Date('2025-10-01'), status: 'GRADUATED', graduationDate: new Date('2026-02-28') } }),
    prisma.beneficiaryEnrollment.create({ data: { enrollmentNo: 'ENR-2026-005', beneficiaryId: bens[3].id, projectId: eduProject.id, programName: 'Education - Scholarship', enrollmentDate: new Date('2026-01-10'), status: 'ACTIVE' } }),
    prisma.beneficiaryEnrollment.create({ data: { enrollmentNo: 'ENR-2026-006', beneficiaryId: bens[6].id, projectId: eduProject.id, programName: 'Education - Scholarship', enrollmentDate: new Date('2026-01-10'), status: 'ACTIVE' } }),
    prisma.beneficiaryEnrollment.create({ data: { enrollmentNo: 'ENR-2026-007', beneficiaryId: bens[5].id, projectId: climateProject.id, programName: 'Climate - Flood Resilience', enrollmentDate: new Date('2026-02-01'), status: 'ACTIVE' } }),
  ])
  console.log(`✓ ${enrollments.length} Enrollments created`)

  // ─── 5. Service Deliveries ───
  const services = await Promise.all([
    prisma.serviceDelivery.create({ data: { serviceNo: 'SVC-2026-001', beneficiaryId: bens[0].id, projectId: washProject.id, serviceType: 'Asset Distribution', date: new Date('2026-01-15'), location: 'Khadimpara, Sylhet', quantity: 1, value: 35000, status: 'DELIVERED', notes: 'Tubewell installed at household' } }),
    prisma.serviceDelivery.create({ data: { serviceNo: 'SVC-2026-002', beneficiaryId: bens[0].id, projectId: washProject.id, serviceType: 'Training', date: new Date('2026-01-20'), location: 'Khadimpara School, Sylhet', status: 'DELIVERED', notes: 'Hygiene awareness session' } }),
    prisma.serviceDelivery.create({ data: { serviceNo: 'SVC-2026-003', beneficiaryId: bens[1].id, projectId: washProject.id, serviceType: 'Health Checkup', date: new Date('2026-02-05'), location: 'Mogalgaon Health Camp', status: 'DELIVERED' } }),
    prisma.serviceDelivery.create({ data: { serviceNo: 'SVC-2026-004', beneficiaryId: bens[3].id, projectId: eduProject.id, serviceType: 'Asset Distribution', date: new Date('2026-02-10'), quantity: 5, value: 2500, status: 'DELIVERED', notes: 'Textbook set distributed' } }),
    prisma.serviceDelivery.create({ data: { serviceNo: 'SVC-2026-005', beneficiaryId: bens[3].id, projectId: eduProject.id, serviceType: 'Cash Transfer', date: new Date('2026-03-01'), value: 3000, status: 'DELIVERED', notes: 'Monthly scholarship stipend' } }),
  ])
  console.log(`✓ ${services.length} Service Deliveries created`)

  // ─── 6. Impact Indicators & Assessments ───
  const indicators = await Promise.all([
    prisma.impactIndicator.create({ data: { name: 'Access to Safe Water', unit: '%', category: 'WASH' } }),
    prisma.impactIndicator.create({ data: { name: 'School Enrollment Rate', unit: '%', category: 'Education' } }),
    prisma.impactIndicator.create({ data: { name: 'Hygiene Practice Adoption', unit: '%', category: 'WASH' } }),
    prisma.impactIndicator.create({ data: { name: 'Household Income Increase', unit: '%', category: 'Livelihood' } }),
  ])

  await Promise.all([
    prisma.impactAssessment.create({ data: { indicatorId: indicators[0].id, projectId: washProject.id, baseline: 45, target: 85, currentValue: 68, achievementPct: 57.5, dataSource: 'Household survey Q1 2026', measurementDate: new Date('2026-03-01') } }),
    prisma.impactAssessment.create({ data: { indicatorId: indicators[2].id, projectId: washProject.id, baseline: 30, target: 75, currentValue: 52, achievementPct: 48.9, dataSource: 'KAP survey', measurementDate: new Date('2026-03-01') } }),
    prisma.impactAssessment.create({ data: { indicatorId: indicators[1].id, projectId: eduProject.id, baseline: 62, target: 90, currentValue: 74, achievementPct: 42.9, dataSource: 'School records', measurementDate: new Date('2026-02-15') } }),
  ])
  console.log('✓ 4 Impact Indicators + 3 Assessments created')

  // ─── 7. Grievances ───
  await Promise.all([
    prisma.grievance.create({ data: { grievanceNo: 'GRV-2026-001', date: new Date('2026-02-10'), beneficiaryId: bens[4].id, complainantName: 'Sufia Begum', category: 'DELAY', description: 'Tubewell installation delayed by 3 weeks, no communication from field team', severity: 'MEDIUM', status: 'RESOLVED', resolutionDate: new Date('2026-02-20'), resolutionNotes: 'Tubewell installed on Feb 18. Delay was due to materials shortage. Communicated to beneficiary.' } }),
    prisma.grievance.create({ data: { grievanceNo: 'GRV-2026-002', date: new Date('2026-03-05'), beneficiaryId: bens[3].id, complainantName: 'Fatema Akter', category: 'SERVICE_QUALITY', description: 'Received only 3 textbooks instead of 5. Missing Math and English books.', severity: 'HIGH', status: 'OPEN' } }),
  ])
  console.log('✓ 2 Grievances created')

  // Update sequences
  await prisma.numberSequence.update({ where: { organizationId_entity: { organizationId: org.id, entity: 'enrollment' } }, data: { currentValue: 7 } })
  await prisma.numberSequence.update({ where: { organizationId_entity: { organizationId: org.id, entity: 'grievance' } }, data: { currentValue: 2 } })

  console.log('\n✅ Phase 4 seeding complete!')
  console.log('   6 Activities, 4 Milestones, 8 Beneficiaries, 7 Enrollments, 5 Services, 4 Indicators, 3 Assessments, 2 Grievances')
}

main()
  .catch((e) => { console.error('❌ Phase 4 seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
