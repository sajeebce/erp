/**
 * Phase 12b Seed: Employee Detail Page Tabs
 * Performance Reviews, Contracts (gap-fill), Compliance, Timeline (via real data), Documents
 * Run after Phase 12 seed: npx tsx prisma/seed-phase12b-employee-tabs.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/ngo_erp?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── Helpers ──

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

async function main() {
  console.log('Seeding Phase 12b: Employee Detail Page Tabs...')

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

  const emp1 = getEmp('EMP-001') // Karim Ahmed — Finance Head
  const emp2 = getEmp('EMP-002') // Nasima Akter — Accountant
  const emp3 = getEmp('EMP-003') // Mahbub Alam — Field Coordinator
  const emp4 = getEmp('EMP-004') // Fatema Khatun — Program Manager
  const emp5 = getEmp('EMP-005') // Rafiqul Islam — Contract Field Coord
  const emp6 = getEmp('EMP-006') // Taslima Begum — HR Officer
  const emp7 = empMap.get('EMP-007') // Imran Hossain (may not exist)

  const allEmps = [emp1, emp2, emp3, emp4, emp5, emp6, ...(emp7 ? [emp7] : [])]

  // ════════════════════════════════════════════════════════
  // CLEAN existing Phase 12b data (idempotent re-runs)
  // ════════════════════════════════════════════════════════

  console.log('  Cleaning existing Phase 12b data...')

  for (const emp of allEmps) {
    await prisma.performanceReview.deleteMany({ where: { employeeId: emp.id } })
    await prisma.employeeDocument.deleteMany({ where: { employeeId: emp.id } })
  }

  // Clean audit log entries we created (tagged with specific descriptions)
  await prisma.tenantAuditLog.deleteMany({
    where: {
      organizationId: org.id,
      module: 'hr',
      description: { startsWith: '[seed]' },
    },
  })

  // ════════════════════════════════════════════════════════
  // 1. PERFORMANCE REVIEWS
  // ════════════════════════════════════════════════════════

  console.log('\n-- Performance Reviews --')

  const reviews = await Promise.all([
    // EMP-001: Karim Ahmed — ANNUAL, COMPLETED, EXCEEDS_EXPECTATIONS
    prisma.performanceReview.create({
      data: {
        employeeId: emp1.id,
        reviewPeriod: '2025-2026',
        reviewType: 'ANNUAL',
        selfScore: 4.2,
        supervisorScore: 4.5,
        finalScore: 4.4,
        rating: 'EXCEEDS_EXPECTATIONS',
        selfComments: 'Successfully managed the quarterly financial audit with zero discrepancies. Led the transition to the new ERP accounting module, training 4 staff members. Improved monthly closing time from 12 to 7 working days through process streamlining.',
        supervisorComments: 'Karim has shown exceptional dedication and financial acumen throughout the review period. His leadership during the external audit was outstanding — the auditors specifically commended our documentation quality. He consistently mentors junior staff and takes initiative on process improvements.',
        developmentPlan: 'Focus on grant management software training (QuickBooks Nonprofit). Attend the ICAB annual conference in July 2026. Consider pursuing ACCA certification for international donor compliance. Develop skills in financial data visualization for board presentations.',
        status: 'COMPLETED',
        reviewedById: emp4.id,
        completedAt: new Date('2026-02-15'),
        createdAt: new Date('2026-01-15'),
      },
    }),

    // EMP-001: Karim — previous year review
    prisma.performanceReview.create({
      data: {
        employeeId: emp1.id,
        reviewPeriod: '2024-2025',
        reviewType: 'ANNUAL',
        selfScore: 4.0,
        supervisorScore: 4.2,
        finalScore: 4.1,
        rating: 'EXCEEDS_EXPECTATIONS',
        selfComments: 'Managed end-to-end financial reporting for 3 donor-funded projects. Successfully completed NGOAB audit requirements on time. Introduced automated bank reconciliation process.',
        supervisorComments: 'Karim continues to be a reliable pillar in the finance department. His proactive approach to donor compliance saved the organization from potential delays in fund disbursement.',
        developmentPlan: 'Strengthen ERP system usage. Attend advanced Excel/data analytics training. Cross-train on program budgeting.',
        status: 'COMPLETED',
        reviewedById: emp4.id,
        completedAt: new Date('2025-02-20'),
        createdAt: new Date('2025-01-10'),
      },
    }),

    // EMP-002: Nasima Akter — ANNUAL, COMPLETED, MEETS_EXPECTATIONS
    prisma.performanceReview.create({
      data: {
        employeeId: emp2.id,
        reviewPeriod: '2025-2026',
        reviewType: 'ANNUAL',
        selfScore: 3.8,
        supervisorScore: 4.0,
        finalScore: 3.9,
        rating: 'MEETS_EXPECTATIONS',
        selfComments: 'Maintained accurate financial records for all project accounts. Processed 240+ payment vouchers with 99% accuracy rate. Supported the external audit team with timely document retrieval. Improved petty cash reconciliation process.',
        supervisorComments: 'Nasima is a dependable team member who consistently delivers accurate work. She has shown improvement in donor-specific reporting formats. Recommend she take more initiative in identifying process improvements and participate in cross-departmental meetings.',
        developmentPlan: 'Enroll in advanced accounting certification (CA foundation). Attend donor financial compliance workshop. Take on responsibility for one project budget independently. Improve English business writing skills through online course.',
        status: 'COMPLETED',
        reviewedById: emp1.id,
        completedAt: new Date('2026-02-20'),
        createdAt: new Date('2026-01-15'),
      },
    }),

    // EMP-003: Mahbub Alam — ANNUAL, SUPERVISOR_REVIEW (in progress)
    prisma.performanceReview.create({
      data: {
        employeeId: emp3.id,
        reviewPeriod: '2025-2026',
        reviewType: 'ANNUAL',
        selfScore: 4.0,
        supervisorScore: 3.5,
        finalScore: 3.7,
        rating: 'MEETS_EXPECTATIONS',
        selfComments: 'Coordinated WASH activities across 15 villages in Sylhet division. Achieved 92% beneficiary coverage target. Organized 8 community awareness sessions reaching 1,200+ participants. Maintained strong relationships with local government partners.',
        supervisorComments: 'Mahbub demonstrates strong community engagement skills. However, report submissions were occasionally delayed (3 instances). Field monitoring data quality needs improvement — recommend structured data collection training.',
        developmentPlan: 'Attend ToT (Training of Trainers) workshop. Complete online M&E course from USAID Learning Lab. Improve report writing timeliness — set internal deadlines 3 days before actual due dates. Practice using KoBoToolbox for digital data collection.',
        status: 'SUPERVISOR_REVIEW',
        reviewedById: emp4.id,
        createdAt: new Date('2026-01-20'),
      },
    }),

    // EMP-004: Fatema Khatun — ANNUAL, COMPLETED, OUTSTANDING
    prisma.performanceReview.create({
      data: {
        employeeId: emp4.id,
        reviewPeriod: '2025-2026',
        reviewType: 'ANNUAL',
        selfScore: 4.5,
        supervisorScore: 4.8,
        finalScore: 4.7,
        rating: 'OUTSTANDING',
        selfComments: 'Led the design and launch of the new maternal health program covering 3 districts. Secured BDT 2.5 Crore in new funding from UNICEF and WaterAid. Mentored 3 junior program officers. Published 2 case studies on our WASH impact methodology that were recognized by the donor consortium.',
        supervisorComments: 'Fatema is an exceptional program leader. Her ability to balance strategic vision with operational detail is rare. The UNICEF proposal she led was praised as one of the best submissions they received. She has grown significantly as a people manager and is ready for a senior leadership role.',
        developmentPlan: 'Consider for Deputy Director track. Attend international development conference (DevNet 2026). Lead the organization-wide theory of change revision. Pursue a short executive course in nonprofit leadership at BRAC University.',
        status: 'COMPLETED',
        reviewedById: emp1.id,
        completedAt: new Date('2026-02-10'),
        createdAt: new Date('2026-01-10'),
      },
    }),

    // EMP-004: Fatema — previous year
    prisma.performanceReview.create({
      data: {
        employeeId: emp4.id,
        reviewPeriod: '2024-2025',
        reviewType: 'ANNUAL',
        selfScore: 4.3,
        supervisorScore: 4.5,
        finalScore: 4.4,
        rating: 'EXCEEDS_EXPECTATIONS',
        selfComments: 'Successfully managed 2 concurrent donor-funded projects. Achieved all log-frame milestones within budget. Trained field teams on results-based management.',
        supervisorComments: 'Fatema demonstrated outstanding project management skills. Her proactive donor communication prevented potential funding gaps. Strong mentor to junior colleagues.',
        developmentPlan: 'Focus on proposal writing for institutional donors. Strengthen financial management oversight skills. Consider PMP certification renewal.',
        status: 'COMPLETED',
        reviewedById: emp1.id,
        completedAt: new Date('2025-02-15'),
        createdAt: new Date('2025-01-05'),
      },
    }),

    // EMP-005: Rafiqul Islam — PROBATION, COMPLETED
    prisma.performanceReview.create({
      data: {
        employeeId: emp5.id,
        reviewPeriod: '2025-2026',
        reviewType: 'PROBATION',
        selfScore: 3.5,
        supervisorScore: 3.0,
        finalScore: 3.2,
        rating: 'MEETS_EXPECTATIONS',
        selfComments: 'Completed initial field orientation in Barishal division. Conducted baseline surveys in 5 target villages. Learned community facilitation techniques from senior colleagues. Adapting to the organizational reporting structure and donor requirements.',
        supervisorComments: 'Rafiqul shows promise but needs significant mentoring. His community engagement skills are developing well. Key areas for improvement: report writing quality, time management, and understanding of donor compliance requirements. Probation extended by 3 months for additional support.',
        developmentPlan: 'Assign a senior field coordinator as mentor (Mahbub Alam). Complete mandatory safeguarding and PSEA training. Attend report writing workshop. Shadow senior staff during donor field visits. Weekly check-in meetings with supervisor for first 3 months.',
        status: 'COMPLETED',
        reviewedById: emp3.id,
        completedAt: new Date('2026-01-10'),
        createdAt: new Date('2025-12-15'),
      },
    }),

    // EMP-006: Taslima Begum — MID_YEAR, SELF_REVIEW (waiting for supervisor)
    prisma.performanceReview.create({
      data: {
        employeeId: emp6.id,
        reviewPeriod: '2025-2026',
        reviewType: 'MID_YEAR',
        selfScore: 4.0,
        selfComments: 'Streamlined the employee onboarding process from 15 to 10 working days. Processed 12 new employee inductions. Updated the HR policy manual with NGOAB-compliant clauses. Led the annual staff satisfaction survey with 89% response rate. Managed the performance review cycle for 45+ staff.',
        developmentPlan: 'Planning to complete SHRM-CP certification. Want to attend the National HR Conference in Dhaka. Need training on HRIS data analytics and workforce planning tools.',
        status: 'SELF_REVIEW',
        createdAt: new Date('2026-03-01'),
      },
    }),

    // EMP-006: Taslima — previous annual
    prisma.performanceReview.create({
      data: {
        employeeId: emp6.id,
        reviewPeriod: '2024-2025',
        reviewType: 'ANNUAL',
        selfScore: 3.7,
        supervisorScore: 3.9,
        finalScore: 3.8,
        rating: 'MEETS_EXPECTATIONS',
        selfComments: 'Managed full-cycle recruitment for 8 positions. Maintained employee records with 100% compliance. Coordinated quarterly training programs for all staff.',
        supervisorComments: 'Taslima has been reliable in all core HR functions. Her attention to compliance documentation is commendable. Encourage her to take on more strategic HR initiatives beyond operational tasks.',
        developmentPlan: 'Develop skills in HR analytics. Take ownership of the annual training needs assessment. Attend an advanced labor law workshop.',
        status: 'COMPLETED',
        reviewedById: emp4.id,
        completedAt: new Date('2025-02-25'),
        createdAt: new Date('2025-01-15'),
      },
    }),
  ])

  // EMP-007 reviews if exists
  if (emp7) {
    await prisma.performanceReview.create({
      data: {
        employeeId: emp7.id,
        reviewPeriod: '2024-2025',
        reviewType: 'ANNUAL',
        selfScore: 3.2,
        supervisorScore: 2.8,
        finalScore: 3.0,
        rating: 'BELOW_EXPECTATIONS',
        selfComments: 'Managed field monitoring for the WASH project in Sylhet. Completed 80% of planned field visits. Faced challenges with transportation and connectivity in remote areas.',
        supervisorComments: 'Imran struggled to meet reporting deadlines consistently. While his community rapport is good, data quality and timeliness fell below acceptable standards. Multiple discussions held regarding improvement.',
        developmentPlan: 'Was placed on a performance improvement plan (PIP) but subsequently resigned before completion.',
        status: 'COMPLETED',
        reviewedById: emp3.id,
        completedAt: new Date('2025-03-01'),
        createdAt: new Date('2025-01-20'),
      },
    })
  }

  console.log(`  Created ${reviews.length + (emp7 ? 1 : 0)} performance reviews`)

  // ════════════════════════════════════════════════════════
  // 2. CONTRACTS (gap-fill for employees missing contracts)
  // ════════════════════════════════════════════════════════

  console.log('\n-- Contracts (gap-fill) --')

  // Check which employees already have contracts
  const existingContracts = await prisma.employeeContract.findMany({
    where: { organizationId: org.id },
    select: { employeeId: true },
  })
  const employeesWithContracts = new Set(existingContracts.map((c) => c.employeeId))

  let contractsCreated = 0

  // EMP-003: Mahbub Alam — may be missing
  if (!employeesWithContracts.has(emp3.id)) {
    await prisma.employeeContract.create({
      data: {
        organizationId: org.id,
        contractNo: 'CTR-2026-010',
        employeeId: emp3.id,
        contractType: 'FULL_TIME',
        title: 'Field Coordinator - Permanent',
        startDate: new Date('2022-03-10'),
        probationEndDate: new Date('2022-09-10'),
        basicSalary: 55000,
        currency: 'BDT',
        costCenter: 'CC-FLD-001',
        isRenewable: false,
        noticePeriodDays: 30,
        status: 'ACTIVE',
        salaryComponents: JSON.stringify([
          { component: 'House Rent', amount: 22000, isPercentage: false },
          { component: 'Medical', amount: 5500, isPercentage: false },
          { component: 'Transport', amount: 4000, isPercentage: false },
        ]),
      },
    })
    contractsCreated++
    console.log('  Created contract for EMP-003 (Mahbub Alam)')
  }

  // EMP-006: Taslima Begum — may be missing
  if (!employeesWithContracts.has(emp6.id)) {
    await prisma.employeeContract.create({
      data: {
        organizationId: org.id,
        contractNo: 'CTR-2026-011',
        employeeId: emp6.id,
        contractType: 'FULL_TIME',
        title: 'HR Officer - Permanent',
        startDate: new Date('2023-01-15'),
        probationEndDate: new Date('2023-07-15'),
        basicSalary: 50000,
        currency: 'BDT',
        costCenter: 'CC-HQ-002',
        isRenewable: false,
        noticePeriodDays: 30,
        status: 'ACTIVE',
        salaryComponents: JSON.stringify([
          { component: 'House Rent', amount: 20000, isPercentage: false },
          { component: 'Medical', amount: 5000, isPercentage: false },
          { component: 'Transport', amount: 3500, isPercentage: false },
        ]),
      },
    })
    contractsCreated++
    console.log('  Created contract for EMP-006 (Taslima Begum)')
  }

  // EMP-007: Imran Hossain — terminated contract
  if (emp7 && !employeesWithContracts.has(emp7.id)) {
    await prisma.employeeContract.create({
      data: {
        organizationId: org.id,
        contractNo: 'CTR-2023-015',
        employeeId: emp7.id,
        contractType: 'CONTRACT',
        title: 'Field Coordinator - WASH Sylhet (Contract)',
        startDate: new Date('2023-06-01'),
        endDate: new Date('2026-05-31'),
        basicSalary: 38000,
        currency: 'BDT',
        costCenter: 'CC-FLD-002',
        isRenewable: true,
        renewalNoticeDays: 30,
        noticePeriodDays: 15,
        terminatedAt: new Date('2025-11-30'),
        terminationReason: 'Voluntary resignation — personal reasons',
        status: 'TERMINATED',
        salaryComponents: JSON.stringify([
          { component: 'House Rent', amount: 15200, isPercentage: false },
          { component: 'Medical', amount: 3800, isPercentage: false },
          { component: 'Transport', amount: 2500, isPercentage: false },
        ]),
      },
    })
    contractsCreated++
    console.log('  Created contract for EMP-007 (Imran Hossain - terminated)')
  }

  console.log(`  ${contractsCreated} new contracts created (${existingContracts.length} already existed)`)

  // ════════════════════════════════════════════════════════
  // 3. COMPLIANCE DATA (update employee records)
  // ════════════════════════════════════════════════════════

  console.log('\n-- Compliance Data --')

  // EMP-001: Karim Ahmed — fully compliant (already has most from Phase 12, reinforce)
  await prisma.employee.update({
    where: { id: emp1.id },
    data: {
      ngoabNotified: true,
      fd4ReferenceNo: 'FD4-2020-0156',
      fd4SubmissionDate: new Date('2020-01-20'),
      fd4ApprovalStatus: 'APPROVED',
      codeOfConductSigned: true,
      codeOfConductDate: new Date('2020-01-20'),
      pseaDeclarationSigned: true,
      safeguardingTrainingDate: new Date('2025-12-15'),
      safeguardingTrainingExpiry: new Date('2026-12-15'),
      backgroundCheckStatus: 'CLEARED',
      backgroundCheckDate: new Date('2020-01-10'),
      mdsCheckCompleted: true,
    },
  })

  // EMP-002: Nasima Akter — mostly compliant, FD4 pending
  await prisma.employee.update({
    where: { id: emp2.id },
    data: {
      ngoabNotified: true,
      fd4ReferenceNo: 'FD4-2021-0289',
      fd4SubmissionDate: new Date('2021-06-15'),
      fd4ApprovalStatus: 'PENDING',
      codeOfConductSigned: true,
      codeOfConductDate: new Date('2021-06-05'),
      pseaDeclarationSigned: true,
      safeguardingTrainingDate: new Date('2025-11-20'),
      safeguardingTrainingExpiry: new Date('2026-11-20'),
      backgroundCheckStatus: 'CLEARED',
      backgroundCheckDate: new Date('2021-05-25'),
      mdsCheckCompleted: true,
    },
  })

  // EMP-003: Mahbub Alam — safeguarding training expired, background check pending
  await prisma.employee.update({
    where: { id: emp3.id },
    data: {
      ngoabNotified: true,
      fd4ReferenceNo: 'FD4-2022-0412',
      fd4SubmissionDate: new Date('2022-03-20'),
      fd4ApprovalStatus: 'APPROVED',
      codeOfConductSigned: true,
      codeOfConductDate: new Date('2022-03-15'),
      pseaDeclarationSigned: true,
      safeguardingTrainingDate: new Date('2024-04-10'),
      safeguardingTrainingExpiry: new Date('2025-04-10'), // EXPIRED
      backgroundCheckStatus: 'PENDING',
      backgroundCheckDate: null,
      mdsCheckCompleted: false,
    },
  })

  // EMP-004: Fatema Khatun — fully compliant
  await prisma.employee.update({
    where: { id: emp4.id },
    data: {
      ngoabNotified: true,
      fd4ReferenceNo: 'FD4-2019-0098',
      fd4SubmissionDate: new Date('2019-08-15'),
      fd4ApprovalStatus: 'APPROVED',
      codeOfConductSigned: true,
      codeOfConductDate: new Date('2019-08-05'),
      pseaDeclarationSigned: true,
      safeguardingTrainingDate: new Date('2026-02-01'),
      safeguardingTrainingExpiry: new Date('2027-02-01'),
      backgroundCheckStatus: 'CLEARED',
      backgroundCheckDate: new Date('2019-07-20'),
      mdsCheckCompleted: true,
    },
  })

  // EMP-005: Rafiqul Islam — incomplete (new contract employee, many items pending)
  await prisma.employee.update({
    where: { id: emp5.id },
    data: {
      ngoabNotified: false,
      fd4ReferenceNo: null,
      fd4SubmissionDate: null,
      fd4ApprovalStatus: null,
      codeOfConductSigned: true,
      codeOfConductDate: new Date('2025-07-05'),
      pseaDeclarationSigned: false,
      safeguardingTrainingDate: null,
      safeguardingTrainingExpiry: null,
      backgroundCheckStatus: 'PENDING',
      backgroundCheckDate: null,
      mdsCheckCompleted: false,
    },
  })

  // EMP-006: Taslima Begum — mostly compliant, MDS check not done
  await prisma.employee.update({
    where: { id: emp6.id },
    data: {
      ngoabNotified: true,
      fd4ReferenceNo: 'FD4-2023-0567',
      fd4SubmissionDate: new Date('2023-01-25'),
      fd4ApprovalStatus: 'APPROVED',
      codeOfConductSigned: true,
      codeOfConductDate: new Date('2023-01-20'),
      pseaDeclarationSigned: true,
      safeguardingTrainingDate: new Date('2026-01-10'),
      safeguardingTrainingExpiry: new Date('2027-01-10'),
      backgroundCheckStatus: 'CLEARED',
      backgroundCheckDate: new Date('2023-01-05'),
      mdsCheckCompleted: false,
    },
  })

  // EMP-007: fully compliant (resigned, historical data)
  if (emp7) {
    await prisma.employee.update({
      where: { id: emp7.id },
      data: {
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
      },
    })
  }

  console.log(`  Updated compliance data for ${allEmps.length} employees`)

  // ════════════════════════════════════════════════════════
  // 4. TIMELINE — TenantAuditLog entries for employee lifecycle
  // ════════════════════════════════════════════════════════

  console.log('\n-- Timeline / Audit Log Entries --')

  // Find a user to attribute audit logs to (first user in org)
  const orgUser = await prisma.user.findFirst({
    where: { organizationId: org.id },
    select: { id: true },
  })
  const userId = orgUser?.id || null

  let auditCount = 0

  for (const emp of allEmps) {
    const events: Array<{
      action: 'CREATE' | 'UPDATE' | 'APPROVE'
      resource: string
      resourceId: string
      description: string
      createdAt: Date
    }> = [
      {
        action: 'CREATE',
        resource: 'employee',
        resourceId: emp.id,
        description: `[seed] Employee record created — ${emp.fullName} (${emp.employeeNo})`,
        createdAt: emp.joiningDate,
      },
      {
        action: 'CREATE',
        resource: 'employee-contract',
        resourceId: emp.id,
        description: `[seed] Employment contract created (DRAFT) for ${emp.fullName}`,
        createdAt: addDays(emp.joiningDate, 1),
      },
      {
        action: 'UPDATE',
        resource: 'employee-contract',
        resourceId: emp.id,
        description: `[seed] Contract activated for ${emp.fullName}`,
        createdAt: addDays(emp.joiningDate, 7),
      },
      {
        action: 'CREATE',
        resource: 'onboarding',
        resourceId: emp.id,
        description: `[seed] Onboarding initiated — 17 tasks assigned to ${emp.fullName}`,
        createdAt: emp.joiningDate,
      },
      {
        action: 'UPDATE',
        resource: 'employee',
        resourceId: emp.id,
        description: `[seed] Code of conduct signed by ${emp.fullName}`,
        createdAt: addDays(emp.joiningDate, 3),
      },
    ]

    // Probation confirmed (6 months after joining, only for non-contract)
    if (emp.employmentType !== 'CONTRACT') {
      events.push({
        action: 'UPDATE',
        resource: 'employee',
        resourceId: emp.id,
        description: `[seed] Probation period completed — ${emp.fullName} confirmed as permanent staff`,
        createdAt: addMonths(emp.joiningDate, 6),
      })
    }

    // Performance review initiated
    events.push({
      action: 'CREATE',
      resource: 'performance-review',
      resourceId: emp.id,
      description: `[seed] Annual performance review initiated for ${emp.fullName}`,
      createdAt: new Date('2026-01-15'),
    })

    // Safeguarding training (if they have a training date)
    if (emp.safeguardingTrainingDate) {
      events.push({
        action: 'UPDATE',
        resource: 'employee',
        resourceId: emp.id,
        description: `[seed] Safeguarding training completed by ${emp.fullName}`,
        createdAt: emp.safeguardingTrainingDate as Date,
      })
    }

    // NGOAB FD4 approval
    if (emp.fd4ApprovalStatus === 'APPROVED' && emp.fd4SubmissionDate) {
      events.push({
        action: 'APPROVE',
        resource: 'employee',
        resourceId: emp.id,
        description: `[seed] NGOAB FD-4 approval received for ${emp.fullName} (Ref: ${emp.fd4ReferenceNo})`,
        createdAt: addDays(emp.fd4SubmissionDate as Date, 45),
      })
    }

    for (const event of events) {
      await prisma.tenantAuditLog.create({
        data: {
          organizationId: org.id,
          userId,
          action: event.action,
          module: 'hr',
          resource: event.resource,
          resourceId: event.resourceId,
          description: event.description,
          createdAt: event.createdAt,
        },
      })
      auditCount++
    }
  }

  console.log(`  Created ${auditCount} audit log entries across ${allEmps.length} employees`)

  // ════════════════════════════════════════════════════════
  // 5. EMPLOYEE DOCUMENTS
  // ════════════════════════════════════════════════════════

  console.log('\n-- Employee Documents --')

  // Define document templates — each employee gets a subset
  interface DocTemplate {
    name: string
    type: string
    documentNumber?: string
    issuingAuthority?: string
    verificationStatus: string
  }

  const allDocTemplates: DocTemplate[] = [
    { name: 'National ID Card', type: 'NID_COPY', issuingAuthority: 'Election Commission of Bangladesh', verificationStatus: 'VERIFIED' },
    { name: 'TIN Certificate', type: 'TIN_CERTIFICATE', issuingAuthority: 'National Board of Revenue', verificationStatus: 'VERIFIED' },
    { name: 'Passport Copy', type: 'PASSPORT_COPY', issuingAuthority: 'Dept. of Immigration & Passports', verificationStatus: 'VERIFIED' },
    { name: 'Educational Certificate (Highest)', type: 'EDUCATIONAL_CERT', verificationStatus: 'VERIFIED' },
    { name: 'Employment Contract (Signed)', type: 'CONTRACT', verificationStatus: 'VERIFIED' },
    { name: 'Photograph (Passport Size)', type: 'PHOTO', verificationStatus: 'VERIFIED' },
    { name: 'Bank Account Statement', type: 'BANK_STATEMENT', verificationStatus: 'PENDING' },
    { name: 'Code of Conduct Declaration', type: 'CODE_OF_CONDUCT', verificationStatus: 'VERIFIED' },
    { name: 'PSEA Declaration Form', type: 'PSEA_DECLARATION', verificationStatus: 'VERIFIED' },
    { name: 'Medical Fitness Certificate', type: 'MEDICAL_CERT', issuingAuthority: 'Certified Physician', verificationStatus: 'PENDING' },
  ]

  // Assign documents per employee — senior employees have more docs uploaded
  const employeeDocSets: Record<string, number[]> = {
    'EMP-001': [0, 1, 2, 3, 4, 5, 7, 8],    // Karim: 8 docs, missing bank statement & medical
    'EMP-002': [0, 1, 3, 4, 5, 7],           // Nasima: 6 docs, missing passport, bank, PSEA, medical
    'EMP-003': [0, 3, 4, 5, 7, 8],           // Mahbub: 6 docs, missing TIN, passport, bank, medical
    'EMP-004': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // Fatema: all 10 docs — fully compliant
    'EMP-005': [0, 4, 5],                     // Rafiqul: only 3 — new employee, many missing
    'EMP-006': [0, 1, 3, 4, 5, 7, 8, 9],     // Taslima: 8 docs, missing passport & bank
    'EMP-007': [0, 1, 3, 4, 5, 7, 8],        // Imran: 7 docs (historical, resigned)
  }

  let docCount = 0

  for (const emp of allEmps) {
    const docIndices = employeeDocSets[emp.employeeNo] || [0, 4, 5]

    for (const idx of docIndices) {
      const template = allDocTemplates[idx]

      // Generate document number for ID-type documents
      let docNumber: string | undefined
      if (template.type === 'NID_COPY') {
        docNumber = `${Math.floor(1990 + Math.random() * 10)}${String(Math.floor(Math.random() * 9999999999)).padStart(10, '0')}`
      } else if (template.type === 'TIN_CERTIFICATE') {
        docNumber = `${String(Math.floor(Math.random() * 999999999999)).padStart(12, '0')}`
      } else if (template.type === 'PASSPORT_COPY') {
        docNumber = `BK${String(Math.floor(Math.random() * 9999999)).padStart(7, '0')}`
      }

      await prisma.employeeDocument.create({
        data: {
          employeeId: emp.id,
          name: template.name,
          type: template.type,
          filePath: `uploads/hr/employees/${emp.id}/${template.type}/${template.type.toLowerCase()}_${emp.employeeNo}.pdf`,
          documentNumber: docNumber || template.documentNumber,
          issuingAuthority: template.issuingAuthority,
          verificationStatus: template.verificationStatus,
          issuedDate: template.type === 'CONTRACT' ? emp.joiningDate : addDays(emp.joiningDate, -30),
          verifiedAt: template.verificationStatus === 'VERIFIED' ? addDays(emp.joiningDate, 5) : undefined,
          notes: template.verificationStatus === 'PENDING' ? 'Awaiting verification by HR' : undefined,
        },
      })
      docCount++
    }
  }

  console.log(`  Created ${docCount} employee documents`)

  // ─── Summary ───
  console.log('\n========================================')
  console.log('Phase 12b Seed Summary:')
  console.log(`  Performance reviews:  ${reviews.length + (emp7 ? 1 : 0)}`)
  console.log(`  Contracts gap-filled: ${contractsCreated}`)
  console.log(`  Compliance updates:   ${allEmps.length} employees`)
  console.log(`  Audit log entries:    ${auditCount}`)
  console.log(`  Employee documents:   ${docCount}`)
  console.log('========================================')
  console.log('Phase 12b seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Phase 12b seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
