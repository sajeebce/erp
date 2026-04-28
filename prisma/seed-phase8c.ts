/**
 * Phase 8c Seed: Salary Grades, Structures, OKR, Leave Calendar,
 * PayrollEntryLines, Project Allocations, Budget Allocations
 *
 * Run: npx tsx prisma/seed-phase8c.ts
 * Requires: seed-bootstrap, seed-phase3, seed-phase5, seed-phase8-hr
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
  console.log('🌱 Seeding Phase 8c data...')

  const org = await prisma.organization.findUnique({ where: { slug: 'css' } })
  if (!org) throw new Error('Organization not found. Run seed-bootstrap first.')

  const adminUser = await prisma.user.findFirst({ where: { organizationId: org.id, email: 'rahim@cssbd.org' } })
    ?? await prisma.user.findFirst({ where: { organizationId: org.id } })
  if (!adminUser) throw new Error('Admin user not found')

  const employees = await prisma.employee.findMany({
    where: { organizationId: org.id, status: 'ACTIVE' },
    include: { department: true },
    orderBy: { employeeNo: 'asc' },
  })
  if (employees.length === 0) throw new Error('No employees found. Run seed-phase5 first.')

  // Link admin user to first employee so "My OKRs" works on login
  if (employees[0] && !employees[0].userId) {
    await prisma.employee.update({
      where: { id: employees[0].id },
      data: { userId: adminUser.id },
    })
  }

  const departments = await prisma.department.findMany({ where: { organizationId: org.id } })
  const projects = await prisma.project.findMany({ where: { organizationId: org.id }, take: 3 })

  // ═══════════════════════════════════════════
  // 1. SALARY GRADES (6 grades × 5 steps)
  // ═══════════════════════════════════════════
  console.log('  → Seeding Salary Grades...')

  const gradeData = [
    { code: 'G-1', name: 'Support Staff', level: 1, min: 15000, mid: 20000, max: 25000, stepBase: 15000, stepInc: 2500 },
    { code: 'G-2', name: 'Junior Officer', level: 2, min: 22000, mid: 30000, max: 38000, stepBase: 22000, stepInc: 4000 },
    { code: 'G-3', name: 'Officer', level: 3, min: 35000, mid: 45000, max: 55000, stepBase: 35000, stepInc: 5000 },
    { code: 'G-4', name: 'Senior Officer', level: 4, min: 50000, mid: 65000, max: 80000, stepBase: 50000, stepInc: 7500 },
    { code: 'G-5', name: 'Manager', level: 5, min: 70000, mid: 90000, max: 110000, stepBase: 70000, stepInc: 10000 },
    { code: 'G-6', name: 'Director', level: 6, min: 100000, mid: 130000, max: 160000, stepBase: 100000, stepInc: 15000 },
  ]

  const grades: Record<string, string> = {}
  for (const g of gradeData) {
    const grade = await prisma.salaryGrade.create({
      data: {
        organizationId: org.id,
        code: g.code,
        name: g.name,
        level: g.level,
        minSalary: g.min,
        midSalary: g.mid,
        maxSalary: g.max,
        currency: 'BDT',
        effectiveFrom: new Date('2025-07-01'),
        isActive: true,
        steps: {
          create: Array.from({ length: 5 }, (_, i) => ({
            stepNumber: i + 1,
            basicSalary: g.stepBase + g.stepInc * i,
            effectiveFrom: new Date('2025-07-01'),
          })),
        },
      },
    })
    grades[g.code] = grade.id
  }
  console.log(`  ✓ ${gradeData.length} salary grades created (5 steps each)`)

  // ═══════════════════════════════════════════
  // 2. SALARY COMPONENTS (ensure they exist)
  // ═══════════════════════════════════════════
  console.log('  → Ensuring Salary Components...')

  const componentDefs = [
    { name: 'Basic Salary', code: 'BASIC', type: 'EARNING', sortOrder: 1 },
    { name: 'House Rent Allowance', code: 'HRA', type: 'EARNING', sortOrder: 2 },
    { name: 'Medical Allowance', code: 'MEDICAL', type: 'EARNING', sortOrder: 3 },
    { name: 'Transport Allowance', code: 'TRANSPORT', type: 'EARNING', sortOrder: 4 },
    { name: 'Festival Bonus', code: 'FESTIVAL', type: 'EARNING', sortOrder: 5 },
    { name: 'Provident Fund Deduction', code: 'PF_EMP', type: 'DEDUCTION', sortOrder: 10 },
    { name: 'Tax Deduction at Source', code: 'TDS', type: 'DEDUCTION', sortOrder: 11 },
    { name: 'PF Employer Contribution', code: 'PF_ER', type: 'EMPLOYER_CONTRIBUTION', sortOrder: 20 },
  ]

  const components: Record<string, string> = {}
  for (const c of componentDefs) {
    const comp = await prisma.salaryComponent.upsert({
      where: { code: c.code },
      update: { type: c.type, sortOrder: c.sortOrder },
      create: { name: c.name, code: c.code, type: c.type, sortOrder: c.sortOrder, isActive: true },
    })
    components[c.code] = comp.id
  }
  console.log(`  ✓ ${componentDefs.length} salary components ensured`)

  // ═══════════════════════════════════════════
  // 3. SALARY STRUCTURES (2 templates)
  // ═══════════════════════════════════════════
  console.log('  → Seeding Salary Structures...')

  const stdStructure = await prisma.salaryStructure.create({
    data: {
      organizationId: org.id,
      name: 'Standard Bangladesh',
      description: 'Standard salary structure for Bangladesh-based staff',
      isDefault: true,
      isActive: true,
      lines: {
        create: [
          { componentId: components['HRA'], calculationType: 'PERCENT_OF_BASIC', percentage: 50, sortOrder: 1 },
          { componentId: components['MEDICAL'], calculationType: 'PERCENT_OF_BASIC', percentage: 10, sortOrder: 2 },
          { componentId: components['TRANSPORT'], calculationType: 'FIXED', amount: 3000, sortOrder: 3 },
          { componentId: components['PF_EMP'], calculationType: 'PERCENT_OF_BASIC', percentage: 10, sortOrder: 10 },
          { componentId: components['TDS'], calculationType: 'PERCENT_OF_BASIC', percentage: 5, sortOrder: 11 },
          { componentId: components['PF_ER'], calculationType: 'PERCENT_OF_BASIC', percentage: 10, sortOrder: 20 },
        ],
      },
    },
  })

  const fieldStructure = await prisma.salaryStructure.create({
    data: {
      organizationId: org.id,
      name: 'Field Staff',
      description: 'Salary structure for field-based staff with hardship allowance',
      isDefault: false,
      isActive: true,
      lines: {
        create: [
          { componentId: components['HRA'], calculationType: 'PERCENT_OF_BASIC', percentage: 40, sortOrder: 1 },
          { componentId: components['MEDICAL'], calculationType: 'PERCENT_OF_BASIC', percentage: 15, sortOrder: 2 },
          { componentId: components['TRANSPORT'], calculationType: 'FIXED', amount: 5000, sortOrder: 3 },
          { componentId: components['PF_EMP'], calculationType: 'PERCENT_OF_BASIC', percentage: 10, sortOrder: 10 },
          { componentId: components['TDS'], calculationType: 'PERCENT_OF_BASIC', percentage: 5, sortOrder: 11 },
          { componentId: components['PF_ER'], calculationType: 'PERCENT_OF_BASIC', percentage: 10, sortOrder: 20 },
        ],
      },
    },
  })
  console.log('  ✓ 2 salary structures created (Standard Bangladesh, Field Staff)')

  // ═══════════════════════════════════════════
  // 4. ASSIGN GRADES TO EMPLOYEES + SALARY REVISIONS
  // ═══════════════════════════════════════════
  console.log('  → Assigning grades to employees...')

  const gradeAssignments = [
    { idx: 0, grade: 'G-5', step: 3 },  // First employee = Manager Step 3
    { idx: 1, grade: 'G-4', step: 2 },  // Senior Officer Step 2
    { idx: 2, grade: 'G-3', step: 4 },  // Officer Step 4
    { idx: 3, grade: 'G-3', step: 2 },  // Officer Step 2
    { idx: 4, grade: 'G-2', step: 3 },  // Junior Officer Step 3
    { idx: 5, grade: 'G-2', step: 1 },  // Junior Officer Step 1
  ]

  for (const ga of gradeAssignments) {
    if (!employees[ga.idx]) continue
    const emp = employees[ga.idx]
    const gradeId = grades[ga.grade]

    // Get step basic salary
    const step = await prisma.salaryGradeStep.findUnique({
      where: { gradeId_stepNumber: { gradeId, stepNumber: ga.step } },
    })
    if (!step) continue

    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        salaryGradeId: gradeId,
        salaryStepNo: ga.step,
        salaryStructureId: stdStructure.id,
        basicSalary: step.basicSalary,
      },
    })

    // Create initial revision
    await prisma.salaryRevisionHistory.create({
      data: {
        organizationId: org.id,
        employeeId: emp.id,
        revisionDate: new Date('2025-07-01'),
        effectiveDate: new Date('2025-07-01'),
        revisionType: 'INITIAL',
        newGradeId: gradeId,
        newStepNo: ga.step,
        newBasic: step.basicSalary,
        newGross: Number(step.basicSalary) * 1.6 + 3000, // approx: basic + 50% HRA + 10% medical + 3000 transport
        reason: 'Initial grade assignment',
        approvedById: adminUser.id,
        approvedAt: new Date('2025-07-01'),
      },
    })
  }

  // Add a step increment revision for the first employee
  if (employees[0]) {
    await prisma.salaryRevisionHistory.create({
      data: {
        organizationId: org.id,
        employeeId: employees[0].id,
        revisionDate: new Date('2026-01-01'),
        effectiveDate: new Date('2026-01-01'),
        revisionType: 'STEP_INCREMENT',
        previousGradeId: grades['G-5'],
        newGradeId: grades['G-5'],
        previousStepNo: 2,
        newStepNo: 3,
        previousBasic: 80000,
        newBasic: 90000,
        previousGross: 131000,
        newGross: 147000,
        reason: 'Annual step increment',
        approvedById: adminUser.id,
        approvedAt: new Date('2026-01-01'),
      },
    })
  }
  console.log(`  ✓ ${Math.min(gradeAssignments.length, employees.length)} employees assigned grades + revisions`)

  // ═══════════════════════════════════════════
  // 5. PAYSLIP TEMPLATE
  // ═══════════════════════════════════════════
  console.log('  → Seeding Payslip Template...')

  await prisma.payslipTemplate.create({
    data: {
      organizationId: org.id,
      name: 'Default NGO Payslip',
      headerText: 'CSS',
      footerText: 'This is a computer-generated payslip and does not require a signature.',
      showYTD: true,
      showEmployerContributions: true,
      showAttendanceSummary: true,
      showNetPayInWords: true,
      paperSize: 'A4',
      isDefault: true,
    },
  })
  console.log('  ✓ 1 payslip template created')

  // ═══════════════════════════════════════════
  // 6. TEAM COVERAGE RULES
  // ═══════════════════════════════════════════
  console.log('  → Seeding Team Coverage Rules...')

  // Org-wide default
  await prisma.teamCoverageRule.create({
    data: { organizationId: org.id, departmentId: null, minimumPresencePercent: 60, isActive: true },
  })
  // Finance dept stricter
  const financeDept = departments.find(d => d.name.toLowerCase().includes('finance'))
  if (financeDept) {
    await prisma.teamCoverageRule.create({
      data: { organizationId: org.id, departmentId: financeDept.id, minimumPresencePercent: 80, isActive: true },
    })
  }
  console.log('  ✓ 2 coverage rules created (org-wide 60%, finance 80%)')

  // ═══════════════════════════════════════════
  // 7. ADDITIONAL LEAVE APPLICATIONS (for calendar)
  // ═══════════════════════════════════════════
  console.log('  → Seeding additional leave applications for calendar...')

  const leaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } })
  const annualLeave = leaveTypes.find(lt => lt.code === 'ANNUAL' || lt.name.toLowerCase().includes('annual'))
  const sickLeave = leaveTypes.find(lt => lt.code === 'SICK' || lt.name.toLowerCase().includes('sick'))
  const casualLeave = leaveTypes.find(lt => lt.code === 'CASUAL' || lt.name.toLowerCase().includes('casual'))

  if (annualLeave && employees.length >= 3) {
    const leaveApps = [
      { emp: 0, lt: annualLeave.id, start: '2026-03-10', end: '2026-03-14', days: 5, status: 'APPROVED' as const, isHalfDay: false },
      { emp: 1, lt: sickLeave?.id || annualLeave.id, start: '2026-03-18', end: '2026-03-19', days: 2, status: 'APPROVED' as const, isHalfDay: false },
      { emp: 2, lt: casualLeave?.id || annualLeave.id, start: '2026-03-25', end: '2026-03-25', days: 1, status: 'PENDING' as const, isHalfDay: false },
      { emp: 0, lt: casualLeave?.id || annualLeave.id, start: '2026-03-28', end: '2026-03-28', days: 1, status: 'APPROVED' as const, isHalfDay: true, halfDaySession: 'MORNING' },
      { emp: 3, lt: annualLeave.id, start: '2026-04-01', end: '2026-04-05', days: 5, status: 'PENDING' as const, isHalfDay: false },
    ]

    let appCounter = 100
    for (const la of leaveApps) {
      if (!employees[la.emp]) continue
      appCounter++
      try {
        await prisma.leaveApplication.create({
          data: {
            applicationNo: `LA-2026-${appCounter}`,
            employeeId: employees[la.emp].id,
            leaveTypeId: la.lt,
            startDate: new Date(la.start),
            endDate: new Date(la.end),
            days: la.days,
            reason: 'Seed data for team leave calendar testing',
            isHalfDay: la.isHalfDay,
            halfDaySession: la.isHalfDay ? la.halfDaySession : null,
            status: la.status,
            approvedById: la.status === 'APPROVED' ? adminUser.id : null,
            approvedAt: la.status === 'APPROVED' ? new Date() : null,
          },
        })
      } catch {
        // Skip duplicates
      }
    }
    console.log('  ✓ Leave applications seeded for calendar')
  }

  // ═══════════════════════════════════════════
  // 8. OKR CYCLE + OBJECTIVES + KEY RESULTS
  // ═══════════════════════════════════════════
  console.log('  → Seeding OKR data...')

  const cycle = await prisma.oKRCycle.create({
    data: {
      organizationId: org.id,
      name: 'Q1 2026',
      cycleType: 'QUARTERLY',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      status: 'ACTIVE',
      checkInFrequency: 'BIWEEKLY',
      createdById: adminUser.id,
    },
  })

  // Organization-level objectives
  const orgObj1 = await prisma.oKRObjective.create({
    data: {
      organizationId: org.id,
      cycleId: cycle.id,
      ownerType: 'ORGANIZATION',
      ownerId: org.id,
      title: 'Increase beneficiary reach in Cox\'s Bazar by 30%',
      description: 'Expand WASH and Education programs to new camps and host communities',
      weight: 0.6,
      progress: 65,
      status: 'ACTIVE',
      createdById: adminUser.id,
      keyResults: {
        create: [
          { title: 'Enroll 500 new beneficiaries in WASH program', resultType: 'METRIC', startValue: 0, targetValue: 500, currentValue: 320, unit: 'beneficiaries', progress: 64, status: 'ACTIVE' },
          { title: 'Complete 12 community assessments', resultType: 'METRIC', startValue: 0, targetValue: 12, currentValue: 8, unit: 'assessments', progress: 67, status: 'ACTIVE' },
        ],
      },
    },
  })

  const orgObj2 = await prisma.oKRObjective.create({
    data: {
      organizationId: org.id,
      cycleId: cycle.id,
      ownerType: 'ORGANIZATION',
      ownerId: org.id,
      title: 'Strengthen organizational capacity and compliance',
      description: 'Improve internal systems, staff training, and donor compliance readiness',
      weight: 0.4,
      progress: 45,
      status: 'ACTIVE',
      createdById: adminUser.id,
      keyResults: {
        create: [
          { title: 'All staff complete PSEA training', resultType: 'PERCENTAGE', startValue: 0, targetValue: 100, currentValue: 75, unit: '%', progress: 75, status: 'ACTIVE' },
          { title: 'Submit 4 donor reports on time', resultType: 'METRIC', startValue: 0, targetValue: 4, currentValue: 1, unit: 'reports', progress: 25, status: 'ACTIVE' },
        ],
      },
    },
  })

  // Department-level objectives (cascading from org)
  if (departments.length > 0) {
    const deptObj = await prisma.oKRObjective.create({
      data: {
        organizationId: org.id,
        cycleId: cycle.id,
        ownerType: 'DEPARTMENT',
        ownerId: departments[0].id,
        parentObjectiveId: orgObj1.id,
        title: 'Deliver WASH services to 200 households in Ward 5',
        weight: 0.5,
        progress: 55,
        status: 'ACTIVE',
        createdById: adminUser.id,
        keyResults: {
          create: [
            { title: 'Install 20 tube wells', resultType: 'METRIC', startValue: 0, targetValue: 20, currentValue: 11, unit: 'tube wells', progress: 55, status: 'ACTIVE' },
            { title: 'Conduct 30 hygiene sessions', resultType: 'METRIC', startValue: 0, targetValue: 30, currentValue: 18, unit: 'sessions', progress: 60, status: 'ACTIVE' },
          ],
        },
      },
    })

    // Individual-level objectives (cascading from department)
    if (employees.length >= 2) {
      for (let i = 0; i < Math.min(3, employees.length); i++) {
        const empProgress = [72, 45, 88][i]
        await prisma.oKRObjective.create({
          data: {
            organizationId: org.id,
            cycleId: cycle.id,
            ownerType: 'INDIVIDUAL',
            ownerId: employees[i].id,
            parentObjectiveId: deptObj.id,
            title: [`Supervise tube well installation in Zone A`, `Complete 10 community training sessions`, `Prepare monthly M&E reports for WASH`][i],
            weight: 0.5,
            progress: empProgress,
            status: 'ACTIVE',
            createdById: adminUser.id,
            keyResults: {
              create: [
                { title: [`Install 7 tube wells in Zone A`, `Train 300 community members`, `Submit 3 M&E reports`][i], resultType: 'METRIC', startValue: 0, targetValue: [7, 300, 3][i], currentValue: [5, 135, 3][i], unit: ['tube wells', 'members', 'reports'][i], progress: empProgress, status: i === 2 ? 'COMPLETED' : 'ACTIVE' },
                { title: [`Ensure 95% quality inspection pass rate`, `Achieve 80% attendance in sessions`, `Maintain data accuracy above 98%`][i], resultType: 'PERCENTAGE', startValue: 0, targetValue: 100, currentValue: [70, 65, 98][i], unit: '%', progress: [70, 65, 98][i], status: 'ACTIVE' },
              ],
            },
          },
        })
      }
    }
  }

  // Add check-ins for some KRs
  const keyResults = await prisma.oKRKeyResult.findMany({
    where: { objective: { organizationId: org.id } },
    take: 4,
  })

  for (const kr of keyResults) {
    const checkInValues = [
      { prev: 0, new: Number(kr.currentValue) * 0.3, date: new Date('2026-01-15') },
      { prev: Number(kr.currentValue) * 0.3, new: Number(kr.currentValue) * 0.6, date: new Date('2026-02-01') },
      { prev: Number(kr.currentValue) * 0.6, new: Number(kr.currentValue), date: new Date('2026-03-01') },
    ]
    for (const ci of checkInValues) {
      await prisma.oKRCheckIn.create({
        data: {
          keyResultId: kr.id,
          checkInDate: ci.date,
          previousValue: ci.prev,
          newValue: ci.new,
          progress: (ci.new / Number(kr.targetValue)) * 100,
          note: 'Regular progress update',
          createdById: adminUser.id,
        },
      })
    }
  }
  console.log('  ✓ OKR cycle + 8 objectives + 16 key results + check-ins seeded')

  // ═══════════════════════════════════════════
  // 9. PROJECT ALLOCATIONS
  // ═══════════════════════════════════════════
  console.log('  → Seeding Project Allocations...')

  if (projects.length >= 2) {
    const allocations = [
      { empIdx: 0, projectIdx: 0, pct: 60 },
      { empIdx: 0, projectIdx: 1, pct: 40 },
      { empIdx: 1, projectIdx: 0, pct: 100 },
      { empIdx: 2, projectIdx: 1, pct: 50 },
      { empIdx: 2, projectIdx: Math.min(2, projects.length - 1), pct: 50 },
      { empIdx: 3, projectIdx: 0, pct: 80 },
      { empIdx: 3, projectIdx: 1, pct: 20 },
      { empIdx: 4, projectIdx: 1, pct: 100 },
    ]

    for (const a of allocations) {
      if (!employees[a.empIdx] || !projects[a.projectIdx]) continue
      try {
        await prisma.employeeProjectAllocation.create({
          data: {
            employeeId: employees[a.empIdx].id,
            projectId: projects[a.projectIdx].id,
            percentage: a.pct,
            startDate: new Date('2025-07-01'),
            isActive: true,
          },
        })
      } catch {
        // Skip duplicates
      }
    }
    console.log(`  ✓ ${allocations.length} project allocations seeded`)
  }

  // ═══════════════════════════════════════════
  // 10. PAYROLL RUN WITH DYNAMIC ENTRY LINES
  // ═══════════════════════════════════════════
  console.log('  → Seeding Payroll Run with dynamic lines...')

  const payrollRun = await prisma.payrollRun.create({
    data: {
      organizationId: org.id,
      runNo: 'PR-2026-003',
      month: 3,
      year: 2026,
      status: 'PROCESSED',
      processedById: adminUser.id,
      processedAt: new Date(),
    },
  })

  let totalGross = 0
  let totalDeductions = 0
  let totalNet = 0
  let entryCount = 0

  for (const emp of employees.slice(0, 6)) {
    const basic = Number(emp.basicSalary || 30000)
    const hra = basic * 0.5
    const medical = basic * 0.1
    const transport = 3000
    const gross = basic + hra + medical + transport
    const pf = basic * 0.1
    const tds = basic * 0.05
    const net = gross - pf - tds

    const entry = await prisma.payrollEntry.create({
      data: {
        payrollRunId: payrollRun.id,
        employeeId: emp.id,
        basicSalary: basic,
        houseRent: hra,
        medicalAllowance: medical,
        transportAllowance: transport,
        grossSalary: gross,
        pfDeduction: pf,
        tdsDeduction: tds,
        netSalary: net,
        workingDays: 26,
        presentDays: 24,
        absentDays: 2,
        // Dynamic lines
        lines: {
          create: [
            { componentId: components['BASIC'] || Object.values(components)[0], componentName: 'Basic Salary', componentCode: 'BASIC', lineType: 'EARNING', calculationType: 'FIXED', amount: basic, ytdAmount: basic * 3, sortOrder: 1 },
            { componentId: components['HRA'] || Object.values(components)[1], componentName: 'House Rent Allowance', componentCode: 'HRA', lineType: 'EARNING', calculationType: 'PERCENT_OF_BASIC', percentage: 50, amount: hra, ytdAmount: hra * 3, sortOrder: 2 },
            { componentId: components['MEDICAL'] || Object.values(components)[2], componentName: 'Medical Allowance', componentCode: 'MEDICAL', lineType: 'EARNING', calculationType: 'PERCENT_OF_BASIC', percentage: 10, amount: medical, ytdAmount: medical * 3, sortOrder: 3 },
            { componentId: components['TRANSPORT'] || Object.values(components)[3], componentName: 'Transport Allowance', componentCode: 'TRANSPORT', lineType: 'EARNING', calculationType: 'FIXED', amount: transport, ytdAmount: transport * 3, sortOrder: 4 },
            { componentId: components['PF_EMP'] || Object.values(components)[5], componentName: 'Provident Fund', componentCode: 'PF_EMP', lineType: 'DEDUCTION', calculationType: 'PERCENT_OF_BASIC', percentage: 10, amount: pf, ytdAmount: pf * 3, sortOrder: 10 },
            { componentId: components['TDS'] || Object.values(components)[6], componentName: 'Tax Deduction', componentCode: 'TDS', lineType: 'DEDUCTION', calculationType: 'PERCENT_OF_BASIC', percentage: 5, amount: tds, ytdAmount: tds * 3, sortOrder: 11 },
            { componentId: components['PF_ER'] || Object.values(components)[7], componentName: 'PF Employer Contribution', componentCode: 'PF_ER', lineType: 'EMPLOYER_CONTRIBUTION', calculationType: 'PERCENT_OF_BASIC', percentage: 10, amount: pf, ytdAmount: pf * 3, sortOrder: 20 },
          ],
        },
      },
    })

    totalGross += gross
    totalDeductions += pf + tds
    totalNet += net
    entryCount++
  }

  await prisma.payrollRun.update({
    where: { id: payrollRun.id },
    data: { totalGross, totalDeductions, totalNet, employeeCount: entryCount },
  })

  console.log(`  ✓ Payroll run PR-2026-003 with ${entryCount} entries + dynamic lines`)

  // ═══════════════════════════════════════════
  // 11. PERFORMANCE REVIEW WITH OKR LINK
  // ═══════════════════════════════════════════
  console.log('  → Linking performance reviews to OKR...')

  if (employees.length >= 2) {
    for (let i = 0; i < Math.min(3, employees.length); i++) {
      try {
        await prisma.performanceReview.create({
          data: {
            employeeId: employees[i].id,
            reviewPeriod: '2025-2026',
            reviewType: 'MID_YEAR',
            selfScore: [4.2, 3.5, 4.8][i],
            supervisorScore: [4.0, 3.8, 4.5][i],
            finalScore: [4.1, 3.65, 4.65][i],
            rating: ['EXCEEDS_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'OUTSTANDING'][i] as 'OUTSTANDING' | 'EXCEEDS_EXPECTATIONS' | 'MEETS_EXPECTATIONS',
            okrCycleId: cycle.id,
            okrScore: [0.72, 0.45, 0.88][i],
            competencyScore: [0.78, 0.65, 0.90][i],
            status: 'COMPLETED',
            reviewedById: adminUser.id,
            completedAt: new Date('2026-03-15'),
          },
        })
      } catch {
        // Skip if already exists
      }
    }
    console.log('  ✓ 3 performance reviews linked to OKR cycle')
  }

  console.log('\n✅ Phase 8c seed completed successfully!')
  console.log('═══════════════════════════════════════════')
  console.log('  Salary Grades:     6 (5 steps each)')
  console.log('  Salary Components: 8 (upserted)')
  console.log('  Salary Structures: 2 (Standard + Field)')
  console.log('  Employee Grades:   ' + Math.min(6, employees.length))
  console.log('  Salary Revisions:  ' + (Math.min(6, employees.length) + 1))
  console.log('  Payslip Template:  1')
  console.log('  Coverage Rules:    2')
  console.log('  Leave Applications: 5 (for calendar)')
  console.log('  OKR Cycle:         1 (Q1 2026)')
  console.log('  OKR Objectives:    ~8')
  console.log('  OKR Key Results:   ~16')
  console.log('  OKR Check-ins:     ~12')
  console.log('  Project Allocations: ~8')
  console.log('  Payroll Run:       1 (with dynamic lines)')
  console.log('  Performance Reviews: 3 (OKR-linked)')
  console.log('═══════════════════════════════════════════')
}

main()
  .catch((e) => {
    console.error('❌ Phase 8c seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
