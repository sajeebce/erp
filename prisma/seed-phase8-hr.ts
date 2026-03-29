/**
 * Phase 8 Seed: HR International-Grade Upgrade
 * Recruitment, Contracts, Offboarding, Holidays, Grievance & Disciplinary
 * Run after Phase 5 seed: npx tsx prisma/seed-phase8-hr.ts
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
  console.log('🌱 Seeding Phase 8: HR International-Grade Upgrade...')

  const org = await prisma.organization.findUnique({ where: { slug: 'shapla-foundation' } })
  if (!org) throw new Error('Organization "shapla-foundation" not found. Run base seed first.')

  // ─── Ensure departments exist (create if missing) ───
  let departments = await prisma.department.findMany({ where: { organizationId: org.id } })
  if (departments.length === 0) {
    console.log('  → No departments found, creating HR prerequisites...')
    departments = await Promise.all([
      prisma.department.create({ data: { organizationId: org.id, name: 'Finance & Accounts', code: 'FIN' } }),
      prisma.department.create({ data: { organizationId: org.id, name: 'Programs', code: 'PRG' } }),
      prisma.department.create({ data: { organizationId: org.id, name: 'Human Resources', code: 'HRD' } }),
      prisma.department.create({ data: { organizationId: org.id, name: 'Field Operations', code: 'FLD' } }),
      prisma.department.create({ data: { organizationId: org.id, name: 'IT & Systems', code: 'ITS' } }),
    ])
    console.log(`  → ${departments.length} Departments created`)
  }

  // ─── Ensure designations exist ───
  let designations = await prisma.designation.findMany()
  if (designations.length === 0) {
    designations = await Promise.all([
      prisma.designation.create({ data: { title: 'Executive Director', level: 1 } }),
      prisma.designation.create({ data: { title: 'Finance Head', level: 2 } }),
      prisma.designation.create({ data: { title: 'Program Manager', level: 2 } }),
      prisma.designation.create({ data: { title: 'Field Coordinator', level: 3 } }),
      prisma.designation.create({ data: { title: 'Accountant', level: 3 } }),
      prisma.designation.create({ data: { title: 'HR Officer', level: 3 } }),
      prisma.designation.create({ data: { title: 'IT Officer', level: 3 } }),
    ])
    console.log(`  → ${designations.length} Designations created`)
  }

  // ─── Ensure employees exist ───
  let employees = await prisma.employee.findMany({ where: { organizationId: org.id, deletedAt: null } })
  if (employees.length === 0) {
    const dMap = new Map(departments.map(d => [d.code, d]))
    const finHead = designations.find(d => d.title === 'Finance Head') || designations[0]
    const accountant = designations.find(d => d.title === 'Accountant') || designations[0]
    const pm = designations.find(d => d.title === 'Program Manager') || designations[0]
    const fc = designations.find(d => d.title === 'Field Coordinator') || designations[0]
    const hrOfficer = designations.find(d => d.title === 'HR Officer') || designations[0]

    employees = await Promise.all([
      prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-001', fullName: 'Karim Ahmed', gender: 'Male', departmentId: (dMap.get('FIN') || departments[0]).id, designationId: finHead.id, employmentType: 'FULL_TIME', joiningDate: new Date('2020-01-15'), status: 'ACTIVE', basicSalary: 85000, phone: '01712111222' } }),
      prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-002', fullName: 'Nasima Akter', gender: 'Female', departmentId: (dMap.get('FIN') || departments[0]).id, designationId: accountant.id, employmentType: 'FULL_TIME', joiningDate: new Date('2021-06-01'), status: 'ACTIVE', basicSalary: 45000, phone: '01812222333' } }),
      prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-003', fullName: 'Mahbub Alam', gender: 'Male', departmentId: (dMap.get('FLD') || departments[1]).id, designationId: fc.id, employmentType: 'FULL_TIME', joiningDate: new Date('2022-03-10'), status: 'ACTIVE', basicSalary: 55000, phone: '01912333444' } }),
      prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-004', fullName: 'Fatema Khatun', gender: 'Female', departmentId: (dMap.get('PRG') || departments[1]).id, designationId: pm.id, employmentType: 'FULL_TIME', joiningDate: new Date('2019-08-01'), status: 'ACTIVE', basicSalary: 75000, phone: '01612444555' } }),
      prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-005', fullName: 'Rafiqul Islam', gender: 'Male', departmentId: (dMap.get('FLD') || departments[1]).id, designationId: fc.id, employmentType: 'CONTRACT', joiningDate: new Date('2025-07-01'), endDate: new Date('2027-06-30'), status: 'ACTIVE', basicSalary: 40000, phone: '01512555666' } }),
      prisma.employee.create({ data: { organizationId: org.id, employeeNo: 'EMP-006', fullName: 'Taslima Begum', gender: 'Female', departmentId: (dMap.get('HRD') || departments[2]).id, designationId: hrOfficer.id, employmentType: 'FULL_TIME', joiningDate: new Date('2023-01-15'), status: 'ACTIVE', basicSalary: 50000, phone: '01312666777' } }),
    ])
    console.log(`  → ${employees.length} Employees created`)
  }

  // ─── Ensure leave types exist ───
  const leaveCount = await prisma.leaveType.count()
  if (leaveCount === 0) {
    await Promise.all([
      prisma.leaveType.create({ data: { name: 'Annual Leave', code: 'AL', daysPerYear: 15, isCarryForward: true, maxCarryForward: 10 } }),
      prisma.leaveType.create({ data: { name: 'Casual Leave', code: 'CL', daysPerYear: 10 } }),
      prisma.leaveType.create({ data: { name: 'Sick Leave', code: 'SL', daysPerYear: 14 } }),
      prisma.leaveType.create({ data: { name: 'Maternity Leave', code: 'ML', daysPerYear: 112 } }),
      prisma.leaveType.create({ data: { name: 'Without Pay', code: 'WP', daysPerYear: 365, isPaid: false } }),
    ])
    console.log('  → 5 Leave Types created')
  }

  const deptMap = new Map(departments.map(d => [d.code, d]))
  const programsDept = deptMap.get('PRG') || departments[0]
  const fieldDept = deptMap.get('FLD') || departments[1]
  const finDept = deptMap.get('FIN') || departments[0]
  const hrDept = deptMap.get('HRD') || departments[2]

  const pmDesig = designations.find(d => d.title === 'Program Manager') || designations[0]
  const fcDesig = designations.find(d => d.title === 'Field Coordinator') || designations[1]

  // ═══════════════════════════════════════════
  // 1. RECRUITMENT & JOB POSTINGS
  // ═══════════════════════════════════════════

  console.log('\n── Recruitment & ATS ──')

  const jobPostings = await Promise.all([
    prisma.jobPosting.create({
      data: {
        organizationId: org.id,
        postingNo: 'JOB-2026-001',
        title: 'Senior Program Officer - WASH',
        slug: 'senior-program-officer-wash-dhaka',
        departmentId: programsDept.id,
        designationId: pmDesig.id,
        employmentType: 'FULL_TIME',
        location: 'Dhaka, Bangladesh',
        isRemote: false,
        vacancies: 2,
        salaryMin: 65000,
        salaryMax: 85000,
        currency: 'BDT',
        showSalary: true,
        description: 'We are seeking an experienced Senior Program Officer to lead our WASH (Water, Sanitation, and Hygiene) program in Dhaka division. The role involves program design, implementation oversight, donor reporting, and team management.',
        responsibilities: '1. Lead WASH program design and implementation\n2. Manage a team of 5 field coordinators\n3. Prepare donor reports (quarterly and annual)\n4. Coordinate with government agencies (DPHE, LGED)\n5. Conduct field visits and monitoring\n6. Manage program budget (BDT 1.5 Crore)',
        qualifications: '1. Masters in Development Studies, Public Health, or related field\n2. Minimum 5 years experience in WASH sector\n3. Experience managing donor-funded projects (USAID, UNICEF, WaterAid)\n4. Strong report writing skills in English\n5. Proficiency in MS Office and project management tools',
        preferredSkills: 'Experience with CLTS approach, knowledge of SDG 6 indicators, familiarity with DPHE standards, GIS mapping skills',
        benefits: 'Festival bonus (2x), medical insurance, provident fund, annual leave 15 days, training opportunities',
        minEducation: 'Masters',
        minExperience: 5,
        requiredSkills: JSON.stringify(['WASH', 'project-management', 'donor-reporting', 'M&E', 'team-management']),
        requiredLanguages: JSON.stringify([{ language: 'English', level: 'Fluent' }, { language: 'Bangla', level: 'Native' }]),
        requiredCertifications: JSON.stringify(['PMP']),
        publishedAt: new Date('2026-03-15'),
        applicationDeadline: new Date('2026-04-30'),
        expectedStartDate: new Date('2026-06-01'),
        status: 'PUBLISHED',
        isInternal: false,
        requireCoverLetter: true,
        createdById: employees[0].id,
      },
    }),
    prisma.jobPosting.create({
      data: {
        organizationId: org.id,
        postingNo: 'JOB-2026-002',
        title: 'Field Coordinator - Sylhet',
        slug: 'field-coordinator-sylhet',
        departmentId: fieldDept.id,
        designationId: fcDesig.id,
        employmentType: 'CONTRACT',
        location: 'Sylhet, Bangladesh',
        isRemote: false,
        vacancies: 3,
        salaryMin: 35000,
        salaryMax: 45000,
        currency: 'BDT',
        showSalary: false,
        description: 'Field Coordinator position to support community-based nutrition program in Sylhet division. This is a 2-year contract position with possibility of extension.',
        responsibilities: '1. Coordinate field activities in assigned union parishads\n2. Train community health workers\n3. Collect and report field data using KoBoToolbox\n4. Organize community awareness sessions\n5. Maintain beneficiary database',
        qualifications: '1. Bachelors degree in Social Science, Public Health, or related field\n2. Minimum 2 years experience in NGO field work\n3. Fluency in Sylheti dialect preferred\n4. Motorcycle driving license\n5. Willingness to travel extensively',
        preferredSkills: 'KoBoToolbox experience, community mobilization, nutrition knowledge',
        benefits: 'Field allowance, motorcycle maintenance, mobile phone allowance',
        minEducation: 'Bachelors',
        minExperience: 2,
        requiredSkills: JSON.stringify(['field-work', 'data-collection', 'community-mobilization', 'report-writing']),
        requiredLanguages: JSON.stringify([{ language: 'Bangla', level: 'Native' }, { language: 'English', level: 'Working' }]),
        publishedAt: new Date('2026-03-20'),
        applicationDeadline: new Date('2026-04-15'),
        expectedStartDate: new Date('2026-05-01'),
        status: 'PUBLISHED',
        createdById: employees[0].id,
      },
    }),
    prisma.jobPosting.create({
      data: {
        organizationId: org.id,
        postingNo: 'JOB-2026-003',
        title: 'Finance & Grants Officer',
        slug: 'finance-grants-officer-dhaka',
        departmentId: finDept.id,
        employmentType: 'FULL_TIME',
        location: 'Dhaka, Bangladesh',
        vacancies: 1,
        salaryMin: 50000,
        salaryMax: 65000,
        currency: 'BDT',
        description: 'We need a Finance & Grants Officer to manage donor financial reporting, sub-grant management, and compliance for our multi-donor portfolio.',
        responsibilities: '1. Manage financial reporting for 5+ donor grants\n2. Process sub-grant disbursements\n3. Conduct internal audits\n4. Ensure compliance with donor financial regulations\n5. Support annual external audit',
        qualifications: '1. Masters in Accounting/Finance or CA (CC)\n2. 3+ years in NGO financial management\n3. Experience with Tally/QuickBooks\n4. Knowledge of USAID, EU, DFID financial rules',
        minEducation: 'Masters',
        minExperience: 3,
        requiredSkills: JSON.stringify(['financial-management', 'donor-compliance', 'audit', 'grant-management']),
        applicationDeadline: new Date('2026-05-15'),
        status: 'DRAFT',
        createdById: employees[0].id,
      },
    }),
  ])
  console.log(`✓ ${jobPostings.length} Job Postings created (2 Published, 1 Draft)`)

  // Applications for the WASH position
  const applications = await Promise.all([
    prisma.jobApplication.create({
      data: {
        applicationNo: 'APP-2026-001',
        jobPostingId: jobPostings[0].id,
        organizationId: org.id,
        applicantName: 'Dr. Sharmin Akter',
        applicantEmail: 'sharmin.akter@gmail.com',
        applicantPhone: '01711999111',
        parsedEducation: JSON.stringify([
          { degree: 'PhD', institution: 'University of Dhaka', year: 2020, field: 'Public Health' },
          { degree: 'Masters', institution: 'BRAC University', year: 2015, field: 'Development Studies' },
        ]),
        parsedExperience: JSON.stringify([
          { title: 'Program Manager', org: 'WaterAid Bangladesh', startDate: '2020-01', endDate: '2026-02' },
          { title: 'Program Officer', org: 'UNICEF Bangladesh', startDate: '2016-01', endDate: '2019-12' },
        ]),
        parsedSkills: JSON.stringify(['WASH', 'project-management', 'M&E', 'donor-reporting', 'team-management', 'CLTS', 'GIS']),
        parsedLanguages: JSON.stringify([{ language: 'English', level: 'Fluent' }, { language: 'Bangla', level: 'Native' }]),
        parsedCertifications: JSON.stringify(['PMP', 'WASH Specialist Certificate']),
        totalExperienceYears: 10.0,
        autoScore: 95.00,
        scoreBreakdown: JSON.stringify({ education: 25, experience: 30, skills: 20, languages: 15, certifications: 10 }),
        status: 'INTERVIEW',
      },
    }),
    prisma.jobApplication.create({
      data: {
        applicationNo: 'APP-2026-002',
        jobPostingId: jobPostings[0].id,
        organizationId: org.id,
        applicantName: 'Md. Tanvir Hasan',
        applicantEmail: 'tanvir.hasan@outlook.com',
        applicantPhone: '01812888222',
        parsedEducation: JSON.stringify([
          { degree: 'Masters', institution: 'Jahangirnagar University', year: 2018, field: 'Environmental Science' },
        ]),
        parsedExperience: JSON.stringify([
          { title: 'WASH Coordinator', org: 'BRAC', startDate: '2019-06', endDate: '2025-12' },
          { title: 'Field Officer', org: 'DSK', startDate: '2018-01', endDate: '2019-05' },
        ]),
        parsedSkills: JSON.stringify(['WASH', 'project-management', 'community-mobilization', 'report-writing']),
        parsedLanguages: JSON.stringify([{ language: 'English', level: 'Working' }, { language: 'Bangla', level: 'Native' }]),
        totalExperienceYears: 7.5,
        autoScore: 72.50,
        scoreBreakdown: JSON.stringify({ education: 25, experience: 25, skills: 12, languages: 10, certifications: 0 }),
        status: 'SHORTLISTED',
      },
    }),
    prisma.jobApplication.create({
      data: {
        applicationNo: 'APP-2026-003',
        jobPostingId: jobPostings[0].id,
        organizationId: org.id,
        applicantName: 'Farzana Rahman',
        applicantEmail: 'farzana.r@yahoo.com',
        applicantPhone: '01912777333',
        parsedEducation: JSON.stringify([
          { degree: 'Masters', institution: 'University of Chittagong', year: 2021, field: 'Sociology' },
        ]),
        parsedExperience: JSON.stringify([
          { title: 'Program Assistant', org: 'CARE Bangladesh', startDate: '2021-03', endDate: '2026-01' },
        ]),
        parsedSkills: JSON.stringify(['community-mobilization', 'report-writing', 'data-collection']),
        parsedLanguages: JSON.stringify([{ language: 'English', level: 'Working' }, { language: 'Bangla', level: 'Native' }]),
        totalExperienceYears: 4.8,
        autoScore: 48.00,
        scoreBreakdown: JSON.stringify({ education: 25, experience: 10, skills: 4, languages: 10, certifications: 0 }),
        status: 'APPLIED',
      },
    }),
    prisma.jobApplication.create({
      data: {
        applicationNo: 'APP-2026-004',
        jobPostingId: jobPostings[0].id,
        organizationId: org.id,
        applicantName: 'Rezaul Karim',
        applicantEmail: 'rezaul.karim@gmail.com',
        applicantPhone: '01612666444',
        parsedEducation: JSON.stringify([
          { degree: 'Bachelors', institution: 'National University', year: 2017, field: 'Social Work' },
        ]),
        parsedExperience: JSON.stringify([
          { title: 'Field Supervisor', org: 'Friendship', startDate: '2018-01', endDate: '2025-06' },
        ]),
        parsedSkills: JSON.stringify(['field-work', 'M&E']),
        parsedLanguages: JSON.stringify([{ language: 'Bangla', level: 'Native' }]),
        totalExperienceYears: 7.0,
        autoScore: 35.00,
        scoreBreakdown: JSON.stringify({ education: 10, experience: 25, skills: 4, languages: 5, certifications: 0 }),
        status: 'REJECTED',
        rejectionReason: 'Does not meet minimum education requirement (Masters required)',
      },
    }),
    // Applications for Field Coordinator position
    prisma.jobApplication.create({
      data: {
        applicationNo: 'APP-2026-005',
        jobPostingId: jobPostings[1].id,
        organizationId: org.id,
        applicantName: 'Sumon Chowdhury',
        applicantEmail: 'sumon.chowdhury@gmail.com',
        applicantPhone: '01711555888',
        parsedEducation: JSON.stringify([
          { degree: 'Bachelors', institution: 'Shahjalal University', year: 2022, field: 'Social Science' },
        ]),
        parsedExperience: JSON.stringify([
          { title: 'Field Assistant', org: 'ASA', startDate: '2022-06', endDate: '2026-02' },
        ]),
        parsedSkills: JSON.stringify(['field-work', 'data-collection', 'community-mobilization', 'KoBoToolbox']),
        parsedLanguages: JSON.stringify([{ language: 'Bangla', level: 'Native' }, { language: 'English', level: 'Working' }, { language: 'Sylheti', level: 'Native' }]),
        totalExperienceYears: 3.5,
        autoScore: 82.00,
        scoreBreakdown: JSON.stringify({ education: 20, experience: 20, skills: 20, languages: 15, certifications: 0 }),
        status: 'SCREENED',
      },
    }),
  ])
  console.log(`✓ ${applications.length} Job Applications created (across 2 postings)`)

  // Interview for top candidate
  const interview = await prisma.interview.create({
    data: {
      applicationId: applications[0].id,
      interviewType: 'PANEL',
      scheduledAt: new Date('2026-04-05T10:00:00'),
      durationMinutes: 60,
      location: 'Shapla Foundation HQ, Dhanmondi',
      isVirtual: false,
      status: 'SCHEDULED',
    },
  })
  console.log('✓ 1 Interview scheduled (Dr. Sharmin - Panel)')

  // ═══════════════════════════════════════════
  // 2. EMPLOYEE CONTRACTS
  // ═══════════════════════════════════════════

  console.log('\n── Contracts ──')

  const contracts = await Promise.all([
    // Karim Ahmed - permanent, active
    prisma.employeeContract.create({
      data: {
        organizationId: org.id,
        contractNo: 'CTR-2026-001',
        employeeId: employees[0].id,
        contractType: 'FULL_TIME',
        title: 'Finance Head - Permanent Contract',
        startDate: new Date('2020-01-15'),
        basicSalary: 85000,
        currency: 'BDT',
        isRenewable: false,
        noticePeriodDays: 60,
        status: 'ACTIVE',
      },
    }),
    // Rafiqul Islam - contract, expiring soon
    prisma.employeeContract.create({
      data: {
        organizationId: org.id,
        contractNo: 'CTR-2026-002',
        employeeId: employees[4].id,
        contractType: 'CONTRACT',
        title: 'Field Coordinator - WASH Project (Year 1)',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2026-04-30'),
        basicSalary: 40000,
        currency: 'BDT',
        isRenewable: true,
        renewalNoticeDays: 30,
        noticePeriodDays: 15,
        status: 'EXPIRING_SOON',
      },
    }),
    // Nasima Akter - full time, active
    prisma.employeeContract.create({
      data: {
        organizationId: org.id,
        contractNo: 'CTR-2026-003',
        employeeId: employees[1].id,
        contractType: 'FULL_TIME',
        title: 'Accountant - Permanent',
        startDate: new Date('2021-06-01'),
        probationEndDate: new Date('2021-12-01'),
        basicSalary: 45000,
        currency: 'BDT',
        status: 'ACTIVE',
      },
    }),
    // Fatema Khatun - renewed
    prisma.employeeContract.create({
      data: {
        organizationId: org.id,
        contractNo: 'CTR-2025-001',
        employeeId: employees[3].id,
        contractType: 'FULL_TIME',
        title: 'Program Manager - Year 1',
        startDate: new Date('2019-08-01'),
        endDate: new Date('2024-07-31'),
        basicSalary: 65000,
        currency: 'BDT',
        status: 'RENEWED',
      },
    }),
    prisma.employeeContract.create({
      data: {
        organizationId: org.id,
        contractNo: 'CTR-2026-004',
        employeeId: employees[3].id,
        contractType: 'FULL_TIME',
        title: 'Program Manager - Year 2 (Renewal)',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2027-07-31'),
        basicSalary: 75000,
        currency: 'BDT',
        previousContractId: null, // Will link after creation
        status: 'ACTIVE',
      },
    }),
  ])
  // Link renewal chain
  await prisma.employeeContract.update({
    where: { id: contracts[4].id },
    data: { previousContractId: contracts[3].id },
  })
  console.log(`✓ ${contracts.length} Employee Contracts created (1 expiring, 1 renewed chain)`)

  // ═══════════════════════════════════════════
  // 3. HOLIDAY CALENDAR
  // ═══════════════════════════════════════════

  console.log('\n── Holiday Calendar ──')

  const calendar = await prisma.holidayCalendar.create({
    data: {
      organizationId: org.id,
      name: 'Bangladesh 2026',
      year: 2026,
      isDefault: true,
      isActive: true,
    },
  })

  const holidays = await Promise.all([
    prisma.holiday.create({ data: { calendarId: calendar.id, name: 'International Mother Language Day', localizedName: JSON.stringify({ bn: 'আন্তর্জাতিক মাতৃভাষা দিবস' }), date: new Date('2026-02-21'), type: 'PUBLIC' } }),
    prisma.holiday.create({ data: { calendarId: calendar.id, name: 'Independence Day', localizedName: JSON.stringify({ bn: 'স্বাধীনতা দিবস' }), date: new Date('2026-03-26'), type: 'PUBLIC' } }),
    prisma.holiday.create({ data: { calendarId: calendar.id, name: 'Bengali New Year (Pahela Baishakh)', localizedName: JSON.stringify({ bn: 'পহেলা বৈশাখ' }), date: new Date('2026-04-14'), type: 'PUBLIC' } }),
    prisma.holiday.create({ data: { calendarId: calendar.id, name: 'May Day', localizedName: JSON.stringify({ bn: 'মে দিবস' }), date: new Date('2026-05-01'), type: 'PUBLIC' } }),
    prisma.holiday.create({ data: { calendarId: calendar.id, name: 'Shab-e-Qadr', localizedName: JSON.stringify({ bn: 'শবে কদর' }), date: new Date('2026-03-23'), type: 'PUBLIC' } }),
    prisma.holiday.create({ data: { calendarId: calendar.id, name: 'Eid ul-Fitr', localizedName: JSON.stringify({ bn: 'ঈদুল ফিতর' }), date: new Date('2026-03-27'), endDate: new Date('2026-03-29'), type: 'PUBLIC', description: '3 days Eid holiday' } }),
    prisma.holiday.create({ data: { calendarId: calendar.id, name: 'Eid ul-Adha', localizedName: JSON.stringify({ bn: 'ঈদুল আযহা' }), date: new Date('2026-06-03'), endDate: new Date('2026-06-05'), type: 'PUBLIC', description: '3 days Eid holiday' } }),
    prisma.holiday.create({ data: { calendarId: calendar.id, name: 'Victory Day', localizedName: JSON.stringify({ bn: 'বিজয় দিবস' }), date: new Date('2026-12-16'), type: 'PUBLIC' } }),
    prisma.holiday.create({ data: { calendarId: calendar.id, name: 'Shapla Foundation Anniversary', date: new Date('2026-07-15'), type: 'ORGANIZATIONAL', description: 'Organization founding anniversary' } }),
    prisma.holiday.create({ data: { calendarId: calendar.id, name: 'Annual Staff Retreat', date: new Date('2026-10-10'), endDate: new Date('2026-10-11'), type: 'ORGANIZATIONAL', description: '2-day staff retreat' } }),
  ])
  console.log(`✓ ${holidays.length} Holidays created (8 public + 2 organizational)`)

  // ═══════════════════════════════════════════
  // 4. OFFBOARDING (sample completed exit)
  // ═══════════════════════════════════════════

  console.log('\n── Offboarding ──')

  // Create a sample former employee first
  const formerEmployee = await prisma.employee.create({
    data: {
      organizationId: org.id,
      employeeNo: 'EMP-007',
      fullName: 'Imran Hossain',
      gender: 'Male',
      departmentId: fieldDept.id,
      designationId: fcDesig.id,
      employmentType: 'CONTRACT',
      joiningDate: new Date('2023-06-01'),
      endDate: new Date('2026-02-28'),
      status: 'RESIGNED',
      basicSalary: 38000,
      phone: '01413777888',
    },
  })

  const offboarding = await prisma.offboarding.create({
    data: {
      organizationId: org.id,
      offboardingNo: 'EXIT-2026-001',
      employeeId: formerEmployee.id,
      separationType: 'RESIGNATION',
      lastWorkingDay: new Date('2026-02-28'),
      noticeDate: new Date('2026-01-28'),
      noticePeriodDays: 30,
      exitInterviewDate: new Date('2026-02-25'),
      exitInterviewNotes: 'Employee resigned for better opportunity. Expressed satisfaction with work environment but cited limited career growth. Recommended improving promotion pathways.',
      exitReason: 'Better career opportunity',
      wouldRehire: true,
      unusedLeaveDays: 8.0,
      leaveEncashment: 10133.00,
      gratuity: 0,
      otherPayments: 0,
      deductions: 2500,
      finalSettlement: 7633.00,
      settlementPaidAt: new Date('2026-03-05'),
      experienceCertPath: null,
      status: 'COMPLETED',
      completedAt: new Date('2026-03-01'),
    },
  })

  // Offboarding tasks (all completed)
  const taskData = [
    { taskName: 'Return Laptop & Equipment', category: 'IT', isCompleted: true, completedAt: new Date('2026-02-27') },
    { taskName: 'Revoke Email & System Access', category: 'IT', isCompleted: true, completedAt: new Date('2026-02-28') },
    { taskName: 'Return ID Badge & Keys', category: 'SECURITY', isCompleted: true, completedAt: new Date('2026-02-28') },
    { taskName: 'Clear Financial Dues', category: 'FINANCE', isCompleted: true, completedAt: new Date('2026-02-26') },
    { taskName: 'Knowledge Transfer Documentation', category: 'HR', isCompleted: true, completedAt: new Date('2026-02-25') },
    { taskName: 'Exit Interview', category: 'HR', isCompleted: true, completedAt: new Date('2026-02-25') },
    { taskName: 'Update Employee Records', category: 'HR', isCompleted: true, completedAt: new Date('2026-03-01') },
    { taskName: 'Issue Experience Certificate', category: 'HR', isCompleted: true, completedAt: new Date('2026-03-01') },
  ]
  for (let i = 0; i < taskData.length; i++) {
    await prisma.offboardingTask.create({
      data: { offboardingId: offboarding.id, ...taskData[i], sortOrder: i + 1 },
    })
  }
  console.log(`✓ 1 Offboarding (completed) with 8 tasks`)

  // Also create an in-progress offboarding
  const inProgressOffboarding = await prisma.offboarding.create({
    data: {
      organizationId: org.id,
      offboardingNo: 'EXIT-2026-002',
      employeeId: employees[4].id, // Rafiqul - contract ending
      separationType: 'END_OF_CONTRACT',
      lastWorkingDay: new Date('2026-04-30'),
      noticeDate: new Date('2026-03-15'),
      noticePeriodDays: 15,
      status: 'IN_PROGRESS',
    },
  })
  const inProgressTasks = [
    { taskName: 'Return Laptop & Equipment', category: 'IT', isCompleted: false, sortOrder: 1 },
    { taskName: 'Revoke Email & System Access', category: 'IT', isCompleted: false, sortOrder: 2 },
    { taskName: 'Return ID Badge & Keys', category: 'SECURITY', isCompleted: false, sortOrder: 3 },
    { taskName: 'Clear Financial Dues', category: 'FINANCE', isCompleted: true, completedAt: new Date('2026-03-25'), sortOrder: 4 },
    { taskName: 'Knowledge Transfer Documentation', category: 'HR', isCompleted: true, completedAt: new Date('2026-03-28'), sortOrder: 5 },
    { taskName: 'Exit Interview', category: 'HR', isCompleted: false, sortOrder: 6 },
    { taskName: 'Update Employee Records', category: 'HR', isCompleted: false, sortOrder: 7 },
    { taskName: 'Issue Experience Certificate', category: 'HR', isCompleted: false, sortOrder: 8 },
  ]
  for (const task of inProgressTasks) {
    await prisma.offboardingTask.create({
      data: { offboardingId: inProgressOffboarding.id, ...task },
    })
  }
  console.log('✓ 1 Offboarding (in-progress) with 2/8 tasks done')

  // ═══════════════════════════════════════════
  // 5. GRIEVANCE & DISCIPLINARY
  // ═══════════════════════════════════════════

  console.log('\n── Grievance & Disciplinary ──')

  const grievances = await Promise.all([
    prisma.employeeGrievance.create({
      data: {
        organizationId: org.id,
        grievanceNo: 'GRV-2026-001',
        employeeId: employees[2].id,
        isAnonymous: false,
        category: 'SAFETY',
        subject: 'Unsafe field vehicle condition',
        description: 'The Toyota Hilux assigned to Sylhet field office has faulty brakes. Reported to admin 2 weeks ago but no action taken. Multiple field staff use this vehicle daily for community visits.',
        severity: 'HIGH',
        assignedToId: employees[5].id, // HR Officer
        investigationNotes: 'Verified with field office. Vehicle maintenance log shows overdue brake service. Escalated to admin for immediate repair.',
        status: 'INVESTIGATING',
      },
    }),
    prisma.employeeGrievance.create({
      data: {
        organizationId: org.id,
        grievanceNo: 'GRV-2026-002',
        isAnonymous: true,
        category: 'POLICY_VIOLATION',
        subject: 'Overtime not compensated',
        description: 'Field staff in Barishal branch are regularly working 10-12 hour days during monsoon emergency response but overtime is not being recorded or compensated as per policy.',
        severity: 'MEDIUM',
        status: 'SUBMITTED',
      },
    }),
    prisma.employeeGrievance.create({
      data: {
        organizationId: org.id,
        grievanceNo: 'GRV-2026-003',
        employeeId: employees[1].id,
        isAnonymous: false,
        category: 'INTERPERSONAL',
        subject: 'Work allocation disparity',
        description: 'Consistently receiving unequal workload distribution compared to peers in the same role. Requested rebalancing with supervisor but no change.',
        severity: 'LOW',
        resolution: 'Discussed with department head. Workload redistributed across the team. Monthly check-in scheduled to ensure balance.',
        resolutionDate: new Date('2026-03-20'),
        status: 'RESOLVED',
      },
    }),
  ])
  console.log(`✓ ${grievances.length} Grievances created (1 investigating, 1 submitted, 1 resolved)`)

  const disciplinaryCase = await prisma.disciplinaryCase.create({
    data: {
      organizationId: org.id,
      caseNo: 'DISC-2026-001',
      employeeId: formerEmployee.id,
      action: 'WRITTEN_WARNING',
      reason: 'Repeated tardiness',
      description: 'Employee was late to work on 8 out of 20 working days in January 2026. Verbal warning was given on Jan 15, but attendance did not improve. Written warning issued per HR policy section 4.2.',
      incidentDate: new Date('2026-01-31'),
      actionDate: new Date('2026-02-05'),
      expiryDate: new Date('2026-08-05'),
      issuedById: employees[5].id, // HR Officer
      acknowledgedAt: new Date('2026-02-06'),
    },
  })
  console.log('✓ 1 Disciplinary Case created (Written Warning)')

  // ═══════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════

  console.log('\n═══════════════════════════════════════════')
  console.log('✅ Phase 8 Seed Complete!')
  console.log('═══════════════════════════════════════════')
  console.log(`  Job Postings:    ${jobPostings.length} (2 published, 1 draft)`)
  console.log(`  Applications:    ${applications.length} (across 2 jobs)`)
  console.log(`  Interviews:      1 (scheduled)`)
  console.log(`  Contracts:       ${contracts.length} (1 expiring, 1 renewal chain)`)
  console.log(`  Holiday Calendar: 1 (${holidays.length} holidays)`)
  console.log(`  Offboardings:    2 (1 completed, 1 in-progress)`)
  console.log(`  Grievances:      ${grievances.length} (mixed statuses)`)
  console.log(`  Disciplinary:    1 (written warning)`)
  console.log('═══════════════════════════════════════════')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
