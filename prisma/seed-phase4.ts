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
  const washProject = projects.find(p => p.name.includes('Clean Water'))!
  const eduProject = projects.find(p => p.name.includes('Girls Education'))!
  const climateProject = projects.find(p => p.name.includes('Climate'))!

  // ─── 1. Activities ───
  const activities = await Promise.all([
    prisma.activity.create({
      data: { activityNo: `${washProject.projectNo}-A001`, name: 'Drill 30 boreholes in Turkana South', projectId: washProject.id, startDate: new Date('2025-10-01'), endDate: new Date('2026-03-31'), budget: 450000, actualCost: 324000, progress: 72, status: 'IN_PROGRESS' },
    }),
    prisma.activity.create({
      data: { activityNo: `${washProject.projectNo}-A002`, name: 'Community hygiene promotion campaigns', projectId: washProject.id, startDate: new Date('2025-09-01'), endDate: new Date('2026-06-30'), budget: 80000, actualCost: 32000, progress: 40, status: 'IN_PROGRESS' },
    }),
    prisma.activity.create({
      data: { activityNo: `${washProject.projectNo}-A003`, name: 'Water quality testing & monitoring', projectId: washProject.id, startDate: new Date('2026-01-01'), endDate: new Date('2026-05-31'), budget: 45000, progress: 15, status: 'PLANNED' },
    }),
    prisma.activity.create({
      data: { activityNo: `${washProject.projectNo}-A004`, name: 'Establish community water committees', projectId: washProject.id, startDate: new Date('2025-08-01'), endDate: new Date('2025-12-31'), budget: 25000, actualCost: 23500, progress: 100, status: 'COMPLETED' },
    }),
    prisma.activity.create({
      data: { activityNo: `${eduProject.projectNo}-A001`, name: 'Teacher training (200 teachers, 3-day residential)', projectId: eduProject.id, startDate: new Date('2026-01-01'), endDate: new Date('2026-06-30'), budget: 120000, actualCost: 36000, progress: 30, status: 'IN_PROGRESS' },
    }),
    prisma.activity.create({
      data: { activityNo: `${eduProject.projectNo}-A002`, name: 'Distribute learning kits to 5,000 girls', projectId: eduProject.id, startDate: new Date('2026-02-01'), endDate: new Date('2026-04-30'), budget: 175000, progress: 0, status: 'DELAYED' },
    }),
  ])
  console.log(`✓ ${activities.length} Activities created`)

  // ─── 2. Milestones ───
  const milestones = await Promise.all([
    prisma.milestone.create({
      data: { milestoneNo: `${washProject.projectNo}-M01`, description: 'Complete 15 borehole installations', projectId: washProject.id, targetDate: new Date('2026-01-31'), actualDate: new Date('2026-01-28'), status: 'ACHIEVED', deliverable: 'Installation completion report with GPS coordinates' },
    }),
    prisma.milestone.create({
      data: { milestoneNo: `${washProject.projectNo}-M02`, description: 'Complete all 30 boreholes', projectId: washProject.id, targetDate: new Date('2026-03-31'), status: 'ON_TRACK', deliverable: 'Final installation report + water quality test results' },
    }),
    prisma.milestone.create({
      data: { milestoneNo: `${washProject.projectNo}-M03`, description: 'Submit mid-term evaluation to USAID', projectId: washProject.id, targetDate: new Date('2026-06-30'), status: 'ON_TRACK', deliverable: 'Mid-term evaluation report' },
    }),
    prisma.milestone.create({
      data: { milestoneNo: `${eduProject.projectNo}-M01`, description: 'Complete teacher training Phase 1', projectId: eduProject.id, targetDate: new Date('2026-03-31'), status: 'AT_RISK', deliverable: 'Training completion certificates' },
    }),
  ])
  console.log(`✓ ${milestones.length} Milestones created`)

  // ─── 2b. Project Indicators ───
  const projIndicators = await Promise.all([
    prisma.projectIndicator.create({ data: { projectId: washProject.id, name: 'Households with access to safe water', type: 'QUANTITATIVE', unit: 'households', baselineValue: 1200, baselineDate: new Date('2025-06-01'), targetValue: 5000, currentValue: 2875, frequency: 'QUARTERLY', dataSource: 'Household survey', responsible: 'M&E Officer', disaggregation: 'gender, disability', sortOrder: 1 } }),
    prisma.projectIndicator.create({ data: { projectId: washProject.id, name: 'Hygiene practice adoption rate', type: 'QUANTITATIVE', unit: 'percentage', baselineValue: 30, baselineDate: new Date('2025-06-01'), targetValue: 85, currentValue: 52, frequency: 'SEMI_ANNUALLY', dataSource: 'KAP survey', responsible: 'Community Health Worker', sortOrder: 2 } }),
    prisma.projectIndicator.create({ data: { projectId: washProject.id, name: 'Water quality compliance rate', type: 'QUANTITATIVE', unit: 'percentage', baselineValue: 45, targetValue: 95, currentValue: 78, frequency: 'QUARTERLY', dataSource: 'Lab testing', sortOrder: 3 } }),
    prisma.projectIndicator.create({ data: { projectId: eduProject.id, name: 'Girls enrollment rate', type: 'QUANTITATIVE', unit: 'percentage', baselineValue: 62, baselineDate: new Date('2025-09-01'), targetValue: 90, currentValue: 74, frequency: 'ANNUALLY', dataSource: 'School records', responsible: 'Education Specialist', disaggregation: 'age group', sortOrder: 1 } }),
    prisma.projectIndicator.create({ data: { projectId: eduProject.id, name: 'Teacher competency improvement', type: 'QUALITATIVE', unit: 'score (1-5)', baselineValue: 2.1, targetValue: 4.0, currentValue: 3.2, frequency: 'SEMI_ANNUALLY', dataSource: 'Classroom observation', sortOrder: 2 } }),
  ])
  console.log(`✓ ${projIndicators.length} Project Indicators created`)

  // ─── 2c. Project Risks ───
  const projRisks = await Promise.all([
    prisma.projectRisk.create({ data: { projectId: washProject.id, title: 'Drought reduces water table levels', category: 'ENVIRONMENTAL', likelihood: 'HIGH', impact: 'MAJOR', riskScore: 16, mitigation: 'Pre-drilling hydrogeological survey; deeper boreholes in vulnerable areas', owner: 'Lead Hydrogeologist', status: 'OPEN', reviewDate: new Date('2026-06-01') } }),
    prisma.projectRisk.create({ data: { projectId: washProject.id, title: 'Supply chain delays for borehole equipment', category: 'OPERATIONAL', likelihood: 'MEDIUM', impact: 'MODERATE', riskScore: 9, mitigation: 'Maintain 30-day buffer stock; identify alternative suppliers', owner: 'Procurement Manager', status: 'MITIGATED' } }),
    prisma.projectRisk.create({ data: { projectId: washProject.id, title: 'Community resistance to user fee model', category: 'POLITICAL', likelihood: 'LOW', impact: 'MAJOR', riskScore: 8, mitigation: 'Community engagement sessions; subsidized fee structure for vulnerable households', owner: 'Community Liaison', status: 'OPEN' } }),
    prisma.projectRisk.create({ data: { projectId: eduProject.id, title: 'Security incidents in refugee camps', category: 'SECURITY', likelihood: 'MEDIUM', impact: 'CRITICAL', riskScore: 15, mitigation: 'Security assessment protocol; coordination with UNHCR security; alternative delivery modes', owner: 'Security Focal Point', status: 'OPEN', reviewDate: new Date('2026-04-01') } }),
    prisma.projectRisk.create({ data: { projectId: eduProject.id, title: 'Teacher attrition in camp schools', category: 'OPERATIONAL', likelihood: 'HIGH', impact: 'MODERATE', riskScore: 12, mitigation: 'Competitive incentive packages; backup teacher pool; online training modules', owner: 'HR Coordinator', status: 'OPEN' } }),
    prisma.projectRisk.create({ data: { projectId: climateProject.id, title: 'Monsoon flooding disrupts implementation', category: 'ENVIRONMENTAL', likelihood: 'VERY_HIGH', impact: 'MAJOR', riskScore: 20, mitigation: 'Seasonal activity planning; flood-resilient infrastructure designs; contingency budget 10%', owner: 'Project Director', status: 'OPEN', reviewDate: new Date('2026-05-01') } }),
  ])
  console.log(`✓ ${projRisks.length} Project Risks created`)

  // ─── 2d. LogFrame entries for WASH ───
  const logEntries = await Promise.all([
    prisma.logFrameEntry.create({ data: { projectId: washProject.id, level: 'GOAL', narrative: 'Improved health outcomes and reduced waterborne diseases in Turkana County', indicators: 'Diarrheal disease incidence reduced by 40%', meansOfVerification: 'County health records, baseline vs endline survey', assumptions: 'Health facilities maintain service quality', sortOrder: 1 } }),
    prisma.logFrameEntry.create({ data: { projectId: washProject.id, level: 'PURPOSE', narrative: 'Increased access to safe, sustainable water and sanitation services for 5,000 households', indicators: '5,000 HH with access to improved water source within 500m', meansOfVerification: 'Household survey, GPS mapping', assumptions: 'Community maintains water points post-project', sortOrder: 2 } }),
    prisma.logFrameEntry.create({ data: { projectId: washProject.id, level: 'OUTPUT', narrative: '30 boreholes drilled and operational', indicators: '30 boreholes with water quality meeting WHO standards', meansOfVerification: 'Installation reports, water quality test certificates', assumptions: 'Groundwater available at drillable depths', sortOrder: 3 } }),
    prisma.logFrameEntry.create({ data: { projectId: washProject.id, level: 'OUTPUT', narrative: '100 community WASH committees established and trained', indicators: '100 committees with trained members meeting monthly', meansOfVerification: 'Training records, meeting minutes', assumptions: 'Community leaders willing to participate', sortOrder: 4 } }),
    prisma.logFrameEntry.create({ data: { projectId: washProject.id, level: 'ACTIVITY', narrative: 'Conduct hydrogeological surveys and drill boreholes', indicators: 'Survey reports, drilling logs', meansOfVerification: 'Contractor reports, site inspection', assumptions: 'Drilling equipment available', sortOrder: 5 } }),
    prisma.logFrameEntry.create({ data: { projectId: washProject.id, level: 'ACTIVITY', narrative: 'Train community health workers in hygiene promotion', indicators: '200 CHWs trained', meansOfVerification: 'Training attendance, post-test scores', assumptions: 'CHWs available and willing', sortOrder: 6 } }),
  ])
  console.log(`✓ ${logEntries.length} LogFrame entries created`)

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

  // Update sequence (upsert in case it doesn't exist)
  await prisma.numberSequence.upsert({
    where: { organizationId_entity: { organizationId: org.id, entity: 'beneficiary' } },
    update: { currentValue: 8 },
    create: { organizationId: org.id, entity: 'beneficiary', prefix: 'BEN', separator: '-', padLength: 3, currentValue: 8, includeYear: true },
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
  await prisma.numberSequence.upsert({ where: { organizationId_entity: { organizationId: org.id, entity: 'enrollment' } }, update: { currentValue: 7 }, create: { organizationId: org.id, entity: 'enrollment', prefix: 'ENR', separator: '-', padLength: 3, currentValue: 7, includeYear: true } })
  await prisma.numberSequence.upsert({ where: { organizationId_entity: { organizationId: org.id, entity: 'grievance' } }, update: { currentValue: 2 }, create: { organizationId: org.id, entity: 'grievance', prefix: 'GRV', separator: '-', padLength: 3, currentValue: 2, includeYear: true } })

  console.log('\n✅ Phase 4 seeding complete!')
  console.log('   6 Activities, 4 Milestones, 8 Beneficiaries, 7 Enrollments, 5 Services, 4 Indicators, 3 Assessments, 2 Grievances')
}

main()
  .catch((e) => { console.error('❌ Phase 4 seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
