/**
 * Phase 12 Seed: HR Employee Profile Enhancement
 * Emergency contacts, education, work history, dependents, skills, languages, certifications
 * Run after Phase 8 seed: npx tsx prisma/seed-phase12-hr-profile.ts
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
  console.log('🌱 Seeding Phase 12: HR Employee Profile Enhancement...')

  // ─── 1. Find org and employees ───
  const org = await prisma.organization.findFirst({ where: { slug: 'cssbd' } })
  if (!org) throw new Error('Demo org not found. Run earlier seeds first.')

  const employees = await prisma.employee.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: { employeeNo: 'asc' },
  })

  if (employees.length === 0) throw new Error('No employees found. Run seed-phase8-hr.ts first.')

  const empMap = new Map(employees.map((e) => [e.employeeNo, e]))
  const getEmp = (no: string) => {
    const emp = empMap.get(no)
    if (!emp) throw new Error(`Employee ${no} not found`)
    return emp
  }

  const emp1 = getEmp('EMP-001')
  const emp2 = getEmp('EMP-002')
  const emp3 = getEmp('EMP-003')
  const emp4 = getEmp('EMP-004')
  const emp5 = getEmp('EMP-005')
  const emp6 = getEmp('EMP-006')
  const emp7 = empMap.get('EMP-007') // May not exist if offboarding seed skipped

  // ─── Clean existing Phase 12 data (idempotent) ───
  console.log('  Cleaning existing Phase 12 data...')
  for (const emp of employees) {
    await prisma.employeeEmergencyContact.deleteMany({ where: { employeeId: emp.id } })
    await prisma.employeeEducation.deleteMany({ where: { employeeId: emp.id } })
    await prisma.employeeWorkHistory.deleteMany({ where: { employeeId: emp.id } })
    await prisma.employeeDependent.deleteMany({ where: { employeeId: emp.id } })
    await prisma.employeeSkill.deleteMany({ where: { employeeId: emp.id } })
    await prisma.employeeLanguage.deleteMany({ where: { employeeId: emp.id } })
    await prisma.employeeCertification.deleteMany({ where: { employeeId: emp.id } })
  }

  // ─── 2. Update employees with Phase 12 fields ───
  console.log('  Updating employee profiles...')

  await prisma.employee.update({
    where: { id: emp1.id },
    data: {
      nationality: 'Bangladeshi',
      bloodGroup: 'O+',
      religion: 'ISLAM',
      dutyStation: 'Dhaka HQ',
      gradeLevel: 'G-7',
      costCenter: 'CC-HQ-001',
      noticePeriodDays: 60,
      paymentMethod: 'BANK_TRANSFER',
      bankBranch: 'Motijheel',
      bankRoutingNo: '090261234',
      houseRentAllowance: 34000,
      medicalAllowance: 8500,
      transportAllowance: 5000,
      grossSalary: 132500,
      ngoabNotified: true,
      fd4ReferenceNo: 'FD4-2020-0156',
      fd4ApprovalStatus: 'APPROVED',
      codeOfConductSigned: true,
      codeOfConductDate: new Date('2020-01-20'),
      pseaDeclarationSigned: true,
      safeguardingTrainingDate: new Date('2025-12-15'),
      safeguardingTrainingExpiry: new Date('2026-12-15'),
      backgroundCheckStatus: 'CLEARED',
      backgroundCheckDate: new Date('2020-01-10'),
      mdsCheckCompleted: true,
      maritalStatus: 'MARRIED',
      spouseName: 'Rahima Begum',
    },
  })

  await prisma.employee.update({
    where: { id: emp2.id },
    data: {
      nationality: 'Bangladeshi',
      bloodGroup: 'A+',
      religion: 'ISLAM',
      dutyStation: 'Dhaka HQ',
      gradeLevel: 'G-5',
      bankBranch: 'Gulshan',
      houseRentAllowance: 18000,
      medicalAllowance: 4500,
      transportAllowance: 3000,
      grossSalary: 70500,
      codeOfConductSigned: true,
      pseaDeclarationSigned: true,
      backgroundCheckStatus: 'CLEARED',
      maritalStatus: 'SINGLE',
    },
  })

  await prisma.employee.update({
    where: { id: emp3.id },
    data: {
      nationality: 'Bangladeshi',
      bloodGroup: 'B+',
      religion: 'ISLAM',
      dutyStation: 'Sylhet Field Office',
      gradeLevel: 'G-5',
      houseRentAllowance: 22000,
      medicalAllowance: 5500,
      transportAllowance: 4000,
      grossSalary: 86500,
      codeOfConductSigned: true,
      pseaDeclarationSigned: true,
      maritalStatus: 'MARRIED',
      spouseName: 'Salma Khatun',
    },
  })

  await prisma.employee.update({
    where: { id: emp4.id },
    data: {
      nationality: 'Bangladeshi',
      bloodGroup: 'A-',
      religion: 'ISLAM',
      dutyStation: 'Dhaka HQ',
      gradeLevel: 'G-6',
      costCenter: 'CC-PRG-001',
      houseRentAllowance: 30000,
      medicalAllowance: 7500,
      transportAllowance: 5000,
      grossSalary: 117500,
      ngoabNotified: true,
      fd4ApprovalStatus: 'APPROVED',
      codeOfConductSigned: true,
      pseaDeclarationSigned: true,
      maritalStatus: 'MARRIED',
      spouseName: 'Aminul Haque',
    },
  })

  await prisma.employee.update({
    where: { id: emp5.id },
    data: {
      nationality: 'Bangladeshi',
      bloodGroup: 'AB+',
      religion: 'ISLAM',
      dutyStation: 'Barishal Field',
      gradeLevel: 'G-4',
      houseRentAllowance: 16000,
      medicalAllowance: 4000,
      transportAllowance: 3000,
      grossSalary: 63000,
      maritalStatus: 'SINGLE',
    },
  })

  await prisma.employee.update({
    where: { id: emp6.id },
    data: {
      nationality: 'Bangladeshi',
      bloodGroup: 'O-',
      religion: 'ISLAM',
      dutyStation: 'Dhaka HQ',
      gradeLevel: 'G-5',
      houseRentAllowance: 20000,
      medicalAllowance: 5000,
      transportAllowance: 3500,
      grossSalary: 78500,
      codeOfConductSigned: true,
      pseaDeclarationSigned: true,
      maritalStatus: 'MARRIED',
      spouseName: 'Jashim Uddin',
    },
  })

  // EMP-007: Imran Hossain (resigned, contract, Field Operations)
  if (emp7) {
    await prisma.employee.update({
      where: { id: emp7.id },
      data: {
        nationality: 'Bangladeshi',
        bloodGroup: 'B-',
        religion: 'ISLAM',
        dutyStation: 'Sylhet Field Office',
        gradeLevel: 'G-4',
        costCenter: 'CC-FLD-002',
        noticePeriodDays: 30,
        paymentMethod: 'BANK_TRANSFER',
        bankName: 'Sonali Bank',
        bankBranch: 'Sylhet Main',
        bankAccountNo: '2345678901',
        bankRoutingNo: '230261789',
        mobileBankingProvider: 'bKash',
        mobileBankingNumber: '01413777888',
        tinNumber: '456789012345',
        taxCircle: 'Circle-8',
        taxZone: 'Zone-3, Sylhet',
        houseRentAllowance: 15200,
        medicalAllowance: 3800,
        transportAllowance: 2500,
        grossSalary: 59500,
        ngoabNotified: true,
        fd4ReferenceNo: 'FD4-2023-0789',
        fd4SubmissionDate: new Date('2023-06-10'),
        fd4ApprovalStatus: 'APPROVED',
        codeOfConductSigned: true,
        codeOfConductDate: new Date('2023-06-05'),
        pseaDeclarationSigned: true,
        safeguardingTrainingDate: new Date('2023-07-15'),
        safeguardingTrainingExpiry: new Date('2024-07-15'),
        backgroundCheckStatus: 'CLEARED',
        backgroundCheckDate: new Date('2023-05-20'),
        mdsCheckCompleted: true,
        maritalStatus: 'MARRIED',
        spouseName: 'Nasreen Akter',
        fatherName: 'Mokbul Hossain',
        motherName: 'Amena Begum',
        dateOfBirth: new Date('1995-03-15'),
        nidNumber: '1995345678901',
        confirmationDate: new Date('2023-12-01'),
        probationEndDate: new Date('2023-12-01'),
      },
    })
  }

  console.log(`  ✅ Updated ${emp7 ? 7 : 6} employee profiles`)

  // ─── 3. Emergency Contacts ───
  console.log('  Creating emergency contacts...')

  const emergencyContacts = await prisma.employeeEmergencyContact.createMany({
    data: [
      // EMP-001
      { employeeId: emp1.id, contactName: 'Rahima Begum', relationship: 'SPOUSE', phone: '01712345678', isPrimary: true, address: 'House 12, Road 5, Dhanmondi, Dhaka' },
      { employeeId: emp1.id, contactName: 'Abdul Karim', relationship: 'PARENT', phone: '01812345678', address: 'Village Char Bata, Noakhali' },
      // EMP-002
      { employeeId: emp2.id, contactName: 'Shafiq Akter', relationship: 'PARENT', phone: '01712456789', isPrimary: true, address: 'House 8, Mirpur-10, Dhaka' },
      { employeeId: emp2.id, contactName: 'Nasreen Akter', relationship: 'SIBLING', phone: '01912345678', address: 'House 8, Mirpur-10, Dhaka' },
      // EMP-003
      { employeeId: emp3.id, contactName: 'Salma Khatun', relationship: 'SPOUSE', phone: '01712567890', isPrimary: true, address: 'Zindabazar, Sylhet' },
      { employeeId: emp3.id, contactName: 'Habibur Rahman', relationship: 'PARENT', phone: '01812567890', address: 'Balagonj, Sylhet' },
      // EMP-004
      { employeeId: emp4.id, contactName: 'Aminul Haque', relationship: 'SPOUSE', phone: '01712678901', isPrimary: true, address: 'House 22, Uttara Sector 7, Dhaka' },
      { employeeId: emp4.id, contactName: 'Hasina Begum', relationship: 'PARENT', phone: '01612345678', address: 'Rangpur Sadar, Rangpur' },
      // EMP-005
      { employeeId: emp5.id, contactName: 'Korban Ali', relationship: 'PARENT', phone: '01712789012', isPrimary: true, address: 'Bakerganj, Barishal' },
      { employeeId: emp5.id, contactName: 'Rahim Mia', relationship: 'SIBLING', phone: '01512345678', address: 'Bakerganj, Barishal' },
      // EMP-007
      ...(emp7 ? [
        { employeeId: emp7.id, contactName: 'Nasreen Akter', relationship: 'SPOUSE', phone: '01712890123', isPrimary: true, address: 'Ambarkhana, Sylhet' },
        { employeeId: emp7.id, contactName: 'Mokbul Hossain', relationship: 'PARENT', phone: '01812901234', address: 'Golapganj, Sylhet' },
      ] : []),
    ],
  })
  console.log(`  ✅ Created ${emergencyContacts.count} emergency contacts`)

  // ─── 4. Education History ───
  console.log('  Creating education records...')

  const education = await prisma.employeeEducation.createMany({
    data: [
      // EMP-001
      { employeeId: emp1.id, degree: "Master's", institution: 'University of Dhaka', fieldOfStudy: 'Accounting', startYear: 2014, endYear: 2016, grade: '3.65/4.00', country: 'Bangladesh' },
      { employeeId: emp1.id, degree: "Bachelor's", institution: 'Jagannath University', fieldOfStudy: 'Commerce', startYear: 2010, endYear: 2014, grade: '3.42/4.00', country: 'Bangladesh' },
      // EMP-002
      { employeeId: emp2.id, degree: "Bachelor's", institution: 'National University', fieldOfStudy: 'Accounting', startYear: 2014, endYear: 2018, grade: '3.20/4.00', country: 'Bangladesh' },
      { employeeId: emp2.id, degree: 'HSC', institution: 'Govt. Bangla College', fieldOfStudy: 'Business Studies', startYear: 2012, endYear: 2014, grade: 'GPA 5.00', country: 'Bangladesh' },
      // EMP-003
      { employeeId: emp3.id, degree: "Master's", institution: 'Shahjalal University of Science & Technology', fieldOfStudy: 'Social Work', startYear: 2017, endYear: 2019, grade: '3.70/4.00', country: 'Bangladesh' },
      { employeeId: emp3.id, degree: "Bachelor's", institution: 'Shahjalal University of Science & Technology', fieldOfStudy: 'Sociology', startYear: 2013, endYear: 2017, grade: '3.55/4.00', country: 'Bangladesh' },
      // EMP-004
      { employeeId: emp4.id, degree: "Master's", institution: 'BRAC University', fieldOfStudy: 'Development Studies', startYear: 2013, endYear: 2015, grade: '3.80/4.00', country: 'Bangladesh' },
      { employeeId: emp4.id, degree: "Bachelor's", institution: 'University of Dhaka', fieldOfStudy: 'Economics', startYear: 2009, endYear: 2013, grade: '3.60/4.00', country: 'Bangladesh' },
      // EMP-005
      { employeeId: emp5.id, degree: "Bachelor's", institution: 'Bangladesh Agricultural University', fieldOfStudy: 'Agriculture', startYear: 2018, endYear: 2022, grade: '3.30/4.00', country: 'Bangladesh' },
      // EMP-006
      { employeeId: emp6.id, degree: "Master's", institution: 'University of Dhaka', fieldOfStudy: 'Human Resource Management', startYear: 2018, endYear: 2020, grade: '3.72/4.00', country: 'Bangladesh' },
      { employeeId: emp6.id, degree: "Bachelor's", institution: 'University of Dhaka', fieldOfStudy: 'Management', startYear: 2014, endYear: 2018, grade: '3.50/4.00', country: 'Bangladesh' },
      // EMP-007
      ...(emp7 ? [
        { employeeId: emp7.id, degree: "Bachelor's", institution: 'Shahjalal University of Science & Technology', fieldOfStudy: 'Social Work', startYear: 2013, endYear: 2017, grade: '3.25/4.00', country: 'Bangladesh' },
        { employeeId: emp7.id, degree: 'HSC', institution: 'MC College, Sylhet', fieldOfStudy: 'Humanities', startYear: 2011, endYear: 2013, grade: 'GPA 4.50', country: 'Bangladesh' },
      ] : []),
    ],
  })
  console.log(`  ✅ Created ${education.count} education records`)

  // ─── 5. Work History ───
  console.log('  Creating work history records...')

  const workHistory = await prisma.employeeWorkHistory.createMany({
    data: [
      // EMP-001
      { employeeId: emp1.id, employer: 'BRAC', jobTitle: 'Senior Accountant', department: 'Finance', startDate: new Date('2017-03-01'), endDate: new Date('2019-12-31'), location: 'Dhaka', reasonForLeaving: 'Career growth', responsibilities: 'Financial reporting, donor audit preparation, budget tracking for multiple programs' },
      // EMP-002
      { employeeId: emp2.id, employer: 'ASA', jobTitle: 'Junior Accountant', department: 'Accounts', startDate: new Date('2018-06-01'), endDate: new Date('2020-08-31'), location: 'Dhaka', reasonForLeaving: 'Better opportunity', responsibilities: 'Voucher entry, bank reconciliation, petty cash management' },
      // EMP-003
      { employeeId: emp3.id, employer: 'Grameen Bank', jobTitle: 'Field Assistant', department: 'Operations', startDate: new Date('2019-01-15'), endDate: new Date('2021-06-30'), location: 'Sylhet', reasonForLeaving: 'Project ended', responsibilities: 'Community mobilization, loan disbursement monitoring, field data collection' },
      // EMP-004
      { employeeId: emp4.id, employer: 'Save the Children', jobTitle: 'Program Officer', department: 'Programs', startDate: new Date('2015-09-01'), endDate: new Date('2019-08-31'), location: 'Dhaka', reasonForLeaving: 'Career advancement', responsibilities: 'Project design, donor reporting, M&E framework development, stakeholder coordination' },
      // EMP-005
      { employeeId: emp5.id, employer: 'CARE Bangladesh', jobTitle: 'Intern', department: 'Field Operations', startDate: new Date('2023-01-01'), endDate: new Date('2024-03-31'), location: 'Barishal', reasonForLeaving: 'Internship completed', responsibilities: 'Data collection, beneficiary surveys, report compilation' },
      // EMP-006
      { employeeId: emp6.id, employer: 'Proshika', jobTitle: 'HR Assistant', department: 'Human Resources', startDate: new Date('2020-07-01'), endDate: new Date('2022-12-31'), location: 'Dhaka', reasonForLeaving: 'Organization restructuring', responsibilities: 'Recruitment coordination, employee records management, training logistics' },
      // EMP-007
      ...(emp7 ? [
        { employeeId: emp7.id, employer: 'World Vision Bangladesh', jobTitle: 'Field Monitor', department: 'WASH Program', startDate: new Date('2020-01-15'), endDate: new Date('2023-05-31'), location: 'Sylhet', reasonForLeaving: 'Contract ended', responsibilities: 'WASH facility monitoring, community hygiene promotion, water quality testing, beneficiary surveys' },
        { employeeId: emp7.id, employer: 'WaterAid Bangladesh', jobTitle: 'Community Mobilizer', department: 'Programs', startDate: new Date('2017-06-01'), endDate: new Date('2019-12-31'), location: 'Moulvibazar', reasonForLeaving: 'Career growth', responsibilities: 'Community engagement, sanitation awareness campaigns, training facilitation' },
      ] : []),
    ],
  })
  console.log(`  ✅ Created ${workHistory.count} work history records`)

  // ─── 6. Dependents ───
  console.log('  Creating dependent records...')

  const dependents = await prisma.employeeDependent.createMany({
    data: [
      // EMP-001
      { employeeId: emp1.id, name: 'Rahima Begum', relationship: 'SPOUSE', dateOfBirth: new Date('1992-05-12'), gender: 'FEMALE', occupation: 'Homemaker', isNominee: true, nomineePercentage: 60, nomineeFor: 'PF' },
      { employeeId: emp1.id, name: 'Arif Ahmed', relationship: 'CHILD', dateOfBirth: new Date('2020-03-15'), gender: 'MALE', isNominee: true, nomineePercentage: 40, nomineeFor: 'PF' },
      // EMP-003
      { employeeId: emp3.id, name: 'Salma Khatun', relationship: 'SPOUSE', dateOfBirth: new Date('1994-08-22'), gender: 'FEMALE', occupation: 'Teacher', isNominee: true, nomineePercentage: 100, nomineeFor: 'GRATUITY' },
      // EMP-004
      { employeeId: emp4.id, name: 'Aminul Haque', relationship: 'SPOUSE', dateOfBirth: new Date('1988-11-05'), gender: 'MALE', occupation: 'Engineer', isNominee: false },
      { employeeId: emp4.id, name: 'Nusrat Fatema', relationship: 'CHILD', dateOfBirth: new Date('2021-07-20'), gender: 'FEMALE', isNominee: true, nomineePercentage: 50, nomineeFor: 'PF' },
      // EMP-006
      { employeeId: emp6.id, name: 'Jashim Uddin', relationship: 'SPOUSE', dateOfBirth: new Date('1991-02-14'), gender: 'MALE', occupation: 'Businessman', isNominee: true, nomineePercentage: 100, nomineeFor: 'PF' },
      // EMP-007
      ...(emp7 ? [
        { employeeId: emp7.id, name: 'Nasreen Akter', relationship: 'SPOUSE' as const, dateOfBirth: new Date('1997-09-20'), gender: 'FEMALE', occupation: 'Teacher', isNominee: true, nomineePercentage: 60, nomineeFor: 'GRATUITY' },
        { employeeId: emp7.id, name: 'Ayesha Hossain', relationship: 'CHILD' as const, dateOfBirth: new Date('2024-01-10'), gender: 'FEMALE', isNominee: true, nomineePercentage: 40, nomineeFor: 'GRATUITY' },
      ] : []),
    ],
  })
  console.log(`  ✅ Created ${dependents.count} dependent records`)

  // ─── 7. Skills ───
  console.log('  Creating skill records...')

  const skills = await prisma.employeeSkill.createMany({
    data: [
      // EMP-001
      { employeeId: emp1.id, skillName: 'Financial Reporting', proficiency: 'EXPERT', yearsOfExp: 8 },
      { employeeId: emp1.id, skillName: 'Tax Compliance', proficiency: 'ADVANCED', yearsOfExp: 6 },
      { employeeId: emp1.id, skillName: 'Excel/Tally', proficiency: 'EXPERT', yearsOfExp: 9 },
      // EMP-002
      { employeeId: emp2.id, skillName: 'Bookkeeping', proficiency: 'ADVANCED', yearsOfExp: 5 },
      { employeeId: emp2.id, skillName: 'Payroll Processing', proficiency: 'INTERMEDIATE', yearsOfExp: 3 },
      // EMP-003
      { employeeId: emp3.id, skillName: 'WASH Programming', proficiency: 'ADVANCED', yearsOfExp: 4 },
      { employeeId: emp3.id, skillName: 'Community Mobilization', proficiency: 'EXPERT', yearsOfExp: 6 },
      { employeeId: emp3.id, skillName: 'GIS Mapping', proficiency: 'INTERMEDIATE', yearsOfExp: 2 },
      // EMP-004
      { employeeId: emp4.id, skillName: 'Project Management', proficiency: 'EXPERT', yearsOfExp: 10 },
      { employeeId: emp4.id, skillName: 'M&E', proficiency: 'ADVANCED', yearsOfExp: 7 },
      { employeeId: emp4.id, skillName: 'Proposal Writing', proficiency: 'ADVANCED', yearsOfExp: 8 },
      // EMP-005
      { employeeId: emp5.id, skillName: 'Data Collection', proficiency: 'INTERMEDIATE', yearsOfExp: 2 },
      { employeeId: emp5.id, skillName: 'Report Writing', proficiency: 'BEGINNER', yearsOfExp: 1 },
      // EMP-006
      { employeeId: emp6.id, skillName: 'Recruitment', proficiency: 'ADVANCED', yearsOfExp: 5 },
      { employeeId: emp6.id, skillName: 'Training Facilitation', proficiency: 'INTERMEDIATE', yearsOfExp: 3 },
      { employeeId: emp6.id, skillName: 'HRIS Management', proficiency: 'ADVANCED', yearsOfExp: 4 },
      // EMP-007
      ...(emp7 ? [
        { employeeId: emp7.id, skillName: 'WASH Programming', proficiency: 'ADVANCED', yearsOfExp: 5 },
        { employeeId: emp7.id, skillName: 'Community Mobilization', proficiency: 'ADVANCED', yearsOfExp: 6 },
        { employeeId: emp7.id, skillName: 'Water Quality Testing', proficiency: 'INTERMEDIATE', yearsOfExp: 3 },
        { employeeId: emp7.id, skillName: 'Beneficiary Survey', proficiency: 'EXPERT', yearsOfExp: 5 },
      ] : []),
    ],
  })
  console.log(`  ✅ Created ${skills.count} skill records`)

  // ─── 8. Languages ───
  console.log('  Creating language records...')

  const languages = await prisma.employeeLanguage.createMany({
    data: [
      // EMP-001
      { employeeId: emp1.id, language: 'Bengali', speakLevel: 'NATIVE', readLevel: 'NATIVE', writeLevel: 'NATIVE' },
      { employeeId: emp1.id, language: 'English', speakLevel: 'FLUENT', readLevel: 'FLUENT', writeLevel: 'FLUENT' },
      // EMP-002
      { employeeId: emp2.id, language: 'Bengali', speakLevel: 'NATIVE', readLevel: 'NATIVE', writeLevel: 'NATIVE' },
      { employeeId: emp2.id, language: 'English', speakLevel: 'FLUENT', readLevel: 'BASIC', writeLevel: 'BASIC' },
      // EMP-003
      { employeeId: emp3.id, language: 'Bengali', speakLevel: 'NATIVE', readLevel: 'NATIVE', writeLevel: 'NATIVE' },
      { employeeId: emp3.id, language: 'English', speakLevel: 'FLUENT', readLevel: 'FLUENT', writeLevel: 'BASIC' },
      { employeeId: emp3.id, language: 'Hindi', speakLevel: 'BASIC', readLevel: 'NONE', writeLevel: 'BASIC' },
      // EMP-004
      { employeeId: emp4.id, language: 'Bengali', speakLevel: 'NATIVE', readLevel: 'NATIVE', writeLevel: 'NATIVE' },
      { employeeId: emp4.id, language: 'English', speakLevel: 'FLUENT', readLevel: 'FLUENT', writeLevel: 'FLUENT' },
      { employeeId: emp4.id, language: 'French', speakLevel: 'BASIC', readLevel: 'BASIC', writeLevel: 'BASIC' },
      // EMP-005
      { employeeId: emp5.id, language: 'Bengali', speakLevel: 'NATIVE', readLevel: 'NATIVE', writeLevel: 'NATIVE' },
      { employeeId: emp5.id, language: 'English', speakLevel: 'BASIC', readLevel: 'BASIC', writeLevel: 'BASIC' },
      // EMP-006
      { employeeId: emp6.id, language: 'Bengali', speakLevel: 'NATIVE', readLevel: 'NATIVE', writeLevel: 'NATIVE' },
      { employeeId: emp6.id, language: 'English', speakLevel: 'FLUENT', readLevel: 'FLUENT', writeLevel: 'FLUENT' },
      // EMP-007
      ...(emp7 ? [
        { employeeId: emp7.id, language: 'Bengali', speakLevel: 'NATIVE', readLevel: 'NATIVE', writeLevel: 'NATIVE' },
        { employeeId: emp7.id, language: 'English', speakLevel: 'FLUENT', readLevel: 'FLUENT', writeLevel: 'BASIC' },
        { employeeId: emp7.id, language: 'Sylheti', speakLevel: 'NATIVE', readLevel: 'NONE', writeLevel: 'NONE' },
      ] : []),
    ],
  })
  console.log(`  ✅ Created ${languages.count} language records`)

  // ─── 9. Certifications ───
  console.log('  Creating certification records...')

  const certifications = await prisma.employeeCertification.createMany({
    data: [
      // EMP-001
      { employeeId: emp1.id, name: 'CPA (Certified Public Accountant)', issuingOrg: 'ICAB (Institute of Chartered Accountants of Bangladesh)', issueDate: new Date('2018-06-15'), certificateNo: 'CPA-BD-2018-0456' },
      // EMP-004
      { employeeId: emp4.id, name: 'PMP (Project Management Professional)', issuingOrg: 'PMI (Project Management Institute)', issueDate: new Date('2019-06-01'), expiryDate: new Date('2025-06-01'), certificateNo: 'PMP-2019-78234' },
      { employeeId: emp4.id, name: 'MEAL Specialist Certification', issuingOrg: 'USAID', issueDate: new Date('2020-03-15'), certificateNo: 'MEAL-USAID-2020-112' },
      // EMP-006
      { employeeId: emp6.id, name: 'SHRM-CP (Certified Professional)', issuingOrg: 'SHRM (Society for Human Resource Management)', issueDate: new Date('2021-09-01'), expiryDate: new Date('2024-12-31'), certificateNo: 'SHRM-CP-2021-9087' },
      // EMP-007
      ...(emp7 ? [
        { employeeId: emp7.id, name: 'WASH Specialist Certification', issuingOrg: 'UNICEF', issueDate: new Date('2022-03-15'), certificateNo: 'WASH-UNICEF-2022-345' },
        { employeeId: emp7.id, name: 'Community Health First Aid', issuingOrg: 'Bangladesh Red Crescent Society', issueDate: new Date('2021-08-20'), expiryDate: new Date('2024-08-20'), certificateNo: 'CHFA-2021-678' },
      ] : []),
    ],
  })
  console.log(`  ✅ Created ${certifications.count} certification records`)

  // ─── Summary ───
  console.log('\n📊 Phase 12 Seed Summary:')
  console.log(`  Employee profiles updated: ${emp7 ? 7 : 6}`)
  console.log(`  Emergency contacts: ${emergencyContacts.count}`)
  console.log(`  Education records: ${education.count}`)
  console.log(`  Work history records: ${workHistory.count}`)
  console.log(`  Dependents: ${dependents.count}`)
  console.log(`  Skills: ${skills.count}`)
  console.log(`  Languages: ${languages.count}`)
  console.log(`  Certifications: ${certifications.count}`)
  console.log('\n✅ Phase 12 seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Phase 12 seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
