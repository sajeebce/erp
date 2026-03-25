import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

// ─── Types ───

const VALID_REPORT_TYPES = [
  'staff-list',
  'attendance-summary',
  'leave-balance',
  'payroll-register',
  'training-report',
  'turnover',
] as const

type HRReportType = typeof VALID_REPORT_TYPES[number]

// ─── Main Handler ───

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { type } = await params
    const orgId = auth.organizationId
    const url = new URL(request.url)

    if (!VALID_REPORT_TYPES.includes(type as HRReportType)) {
      return apiBadRequest(
        `Invalid HR report type. Must be one of: ${VALID_REPORT_TYPES.join(', ')}`
      )
    }

    switch (type as HRReportType) {
      case 'staff-list':
        return apiSuccess(await generateStaffList(orgId))
      case 'attendance-summary':
        return apiSuccess(await generateAttendanceSummary(orgId, url))
      case 'leave-balance':
        return apiSuccess(await generateLeaveBalance(orgId))
      case 'payroll-register':
        return apiSuccess(await generatePayrollRegister(url))
      case 'training-report':
        return apiSuccess(await generateTrainingReport(orgId))
      case 'turnover':
        return apiSuccess(await generateTurnoverReport(orgId))
      default:
        return apiBadRequest('Invalid HR report type')
    }
  } catch (error) {
    return handleRouteError(error)
  }
}

// ─── Staff List ───

async function generateStaffList(organizationId: string) {
  const employees = await prisma.employee.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      employeeNo: true,
      fullName: true,
      joiningDate: true,
      status: true,
      employmentType: true,
      phone: true,
      email: true,
      department: {
        select: { name: true },
      },
      designation: {
        select: { title: true },
      },
    },
    orderBy: { fullName: 'asc' },
  })

  return {
    reportType: 'staff-list',
    generatedAt: new Date(),
    employees: employees.map((e) => ({
      employeeId: e.id,
      employeeNo: e.employeeNo,
      name: e.fullName,
      department: e.department.name,
      designation: e.designation.title,
      joiningDate: e.joiningDate,
      status: e.status,
      employmentType: e.employmentType,
      phone: e.phone,
      email: e.email,
    })),
    totalEmployees: employees.length,
    byStatus: {
      active: employees.filter((e) => e.status === 'ACTIVE').length,
      onLeave: employees.filter((e) => e.status === 'ON_LEAVE').length,
      probation: employees.filter((e) => e.status === 'PROBATION').length,
      resigned: employees.filter((e) => e.status === 'RESIGNED').length,
      terminated: employees.filter((e) => e.status === 'TERMINATED').length,
    },
    byType: {
      fullTime: employees.filter((e) => e.employmentType === 'FULL_TIME').length,
      contract: employees.filter((e) => e.employmentType === 'CONTRACT').length,
      consultant: employees.filter((e) => e.employmentType === 'CONSULTANT').length,
      intern: employees.filter((e) => e.employmentType === 'INTERN').length,
      volunteer: employees.filter((e) => e.employmentType === 'VOLUNTEER').length,
    },
  }
}

// ─── Attendance Summary ───

async function generateAttendanceSummary(organizationId: string, url: URL) {
  const now = new Date()
  const month = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1), 10)
  const year = parseInt(url.searchParams.get('year') || String(now.getFullYear()), 10)

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const employees = await prisma.employee.findMany({
    where: {
      organizationId,
      status: { in: ['ACTIVE', 'ON_LEAVE', 'PROBATION'] },
      deletedAt: null,
    },
    select: {
      id: true,
      employeeNo: true,
      fullName: true,
      department: {
        select: { name: true },
      },
      attendance: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          status: true,
          otHours: true,
        },
      },
    },
    orderBy: { fullName: 'asc' },
  })

  return {
    reportType: 'attendance-summary',
    generatedAt: new Date(),
    period: { month, year },
    employees: employees.map((e) => {
      const records = e.attendance
      return {
        employeeId: e.id,
        employeeNo: e.employeeNo,
        name: e.fullName,
        department: e.department.name,
        present: records.filter((r) => r.status === 'PRESENT').length,
        absent: records.filter((r) => r.status === 'ABSENT').length,
        late: records.filter((r) => r.status === 'LATE').length,
        leave: records.filter((r) => r.status === 'ON_LEAVE').length,
        halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
        holiday: records.filter((r) => r.status === 'HOLIDAY').length,
        weekend: records.filter((r) => r.status === 'WEEKEND').length,
        otHours: records.reduce((s, r) => s + Number(r.otHours), 0),
        totalRecords: records.length,
      }
    }),
    totalEmployees: employees.length,
  }
}

// ─── Leave Balance ───

async function generateLeaveBalance(organizationId: string) {
  const employees = await prisma.employee.findMany({
    where: {
      organizationId,
      status: { in: ['ACTIVE', 'ON_LEAVE', 'PROBATION'] },
      deletedAt: null,
    },
    select: {
      id: true,
      employeeNo: true,
      fullName: true,
      department: {
        select: { name: true },
      },
      leaveBalances: {
        select: {
          entitled: true,
          taken: true,
          remaining: true,
          carriedForward: true,
          leaveType: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: { fullName: 'asc' },
  })

  return {
    reportType: 'leave-balance',
    generatedAt: new Date(),
    employees: employees.map((e) => ({
      employeeId: e.id,
      employeeNo: e.employeeNo,
      name: e.fullName,
      department: e.department.name,
      leaveBalances: e.leaveBalances.map((lb) => ({
        leaveType: lb.leaveType.name,
        leaveCode: lb.leaveType.code,
        entitled: lb.entitled,
        taken: lb.taken,
        remaining: lb.remaining,
        carriedForward: lb.carriedForward,
      })),
    })),
    totalEmployees: employees.length,
  }
}

// ─── Payroll Register ───

async function generatePayrollRegister(url: URL) {
  const now = new Date()
  const month = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1), 10)
  const year = parseInt(url.searchParams.get('year') || String(now.getFullYear()), 10)

  const payrollRun = await prisma.payrollRun.findUnique({
    where: {
      month_year: { month, year },
    },
    select: {
      id: true,
      runNo: true,
      month: true,
      year: true,
      totalGross: true,
      totalDeductions: true,
      totalNet: true,
      employeeCount: true,
      status: true,
      processedAt: true,
      paidAt: true,
      entries: {
        select: {
          basicSalary: true,
          houseRent: true,
          medicalAllowance: true,
          transportAllowance: true,
          otherEarnings: true,
          grossSalary: true,
          pfDeduction: true,
          tdsDeduction: true,
          otherDeductions: true,
          absentDeduction: true,
          netSalary: true,
          workingDays: true,
          presentDays: true,
          absentDays: true,
          otHours: true,
          otPayment: true,
          isPaid: true,
          employee: {
            select: {
              employeeNo: true,
              fullName: true,
              department: {
                select: { name: true },
              },
              designation: {
                select: { title: true },
              },
            },
          },
        },
        orderBy: {
          employee: { fullName: 'asc' },
        },
      },
    },
  })

  if (!payrollRun) {
    return {
      reportType: 'payroll-register',
      generatedAt: new Date(),
      period: { month, year },
      message: 'No payroll run found for this period',
      payrollRun: null,
      entries: [],
    }
  }

  return {
    reportType: 'payroll-register',
    generatedAt: new Date(),
    period: { month, year },
    payrollRun: {
      runNo: payrollRun.runNo,
      status: payrollRun.status,
      processedAt: payrollRun.processedAt,
      paidAt: payrollRun.paidAt,
      employeeCount: payrollRun.employeeCount,
      totalGross: Number(payrollRun.totalGross),
      totalDeductions: Number(payrollRun.totalDeductions),
      totalNet: Number(payrollRun.totalNet),
    },
    entries: payrollRun.entries.map((e) => ({
      employeeNo: e.employee.employeeNo,
      name: e.employee.fullName,
      department: e.employee.department.name,
      designation: e.employee.designation.title,
      basic: Number(e.basicSalary),
      houseRent: Number(e.houseRent),
      medical: Number(e.medicalAllowance),
      transport: Number(e.transportAllowance),
      otherEarnings: Number(e.otherEarnings),
      gross: Number(e.grossSalary),
      pfDeduction: Number(e.pfDeduction),
      tds: Number(e.tdsDeduction),
      otherDeductions: Number(e.otherDeductions),
      absentDeduction: Number(e.absentDeduction),
      net: Number(e.netSalary),
      workingDays: e.workingDays,
      presentDays: e.presentDays,
      absentDays: e.absentDays,
      otHours: Number(e.otHours),
      otPayment: Number(e.otPayment),
      isPaid: e.isPaid,
    })),
  }
}

// ─── Training Report ───

async function generateTrainingReport(_organizationId: string) {
  // Training model does not have direct orgId, but we filter through project or list all
  // For a broader view, we list all trainings (system-wide accessible ones)
  const trainings = await prisma.training.findMany({
    select: {
      id: true,
      trainingNo: true,
      title: true,
      type: true,
      facilitator: true,
      venue: true,
      startDate: true,
      endDate: true,
      durationHours: true,
      budget: true,
      actualCost: true,
      status: true,
      participants: {
        select: {
          id: true,
          attended: true,
          employee: {
            select: {
              organizationId: true,
            },
          },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  })

  // Filter trainings that have at least one participant from this org,
  // or if no participants yet, include all (draft/planned trainings)
  const orgTrainings = trainings.filter((t) => {
    if (t.participants.length === 0) return true
    return t.participants.some((p) => p.employee.organizationId === _organizationId)
  })

  return {
    reportType: 'training-report',
    generatedAt: new Date(),
    trainings: orgTrainings.map((t) => {
      const orgParticipants = t.participants.filter(
        (p) => p.employee.organizationId === _organizationId
      )
      return {
        trainingId: t.id,
        trainingNo: t.trainingNo,
        title: t.title,
        type: t.type,
        facilitator: t.facilitator,
        venue: t.venue,
        startDate: t.startDate,
        endDate: t.endDate,
        durationHours: t.durationHours,
        budget: Number(t.budget),
        actualCost: Number(t.actualCost),
        status: t.status,
        participantsCount: orgParticipants.length,
        attendedCount: orgParticipants.filter((p) => p.attended).length,
      }
    }),
    summary: {
      totalTrainings: orgTrainings.length,
      byStatus: {
        planned: orgTrainings.filter((t) => t.status === 'PLANNED').length,
        inProgress: orgTrainings.filter((t) => t.status === 'IN_PROGRESS').length,
        completed: orgTrainings.filter((t) => t.status === 'COMPLETED').length,
        cancelled: orgTrainings.filter((t) => t.status === 'CANCELLED').length,
      },
      totalBudget: orgTrainings.reduce((s, t) => s + Number(t.budget), 0),
      totalActualCost: orgTrainings.reduce((s, t) => s + Number(t.actualCost), 0),
    },
  }
}

// ─── Turnover Report ───

async function generateTurnoverReport(organizationId: string) {
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

  // Get employees who resigned or were terminated in last 12 months
  const separatedEmployees = await prisma.employee.findMany({
    where: {
      organizationId,
      status: { in: ['RESIGNED', 'TERMINATED'] },
      updatedAt: { gte: twelveMonthsAgo },
    },
    select: {
      id: true,
      status: true,
      updatedAt: true,
      department: {
        select: { name: true },
      },
    },
  })

  // Build monthly separation counts
  const monthlyTurnover: Array<{
    month: number
    year: number
    resigned: number
    terminated: number
  }> = []

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

    const monthSeparated = separatedEmployees.filter(
      (e) => e.updatedAt >= monthStart && e.updatedAt <= monthEnd
    )

    monthlyTurnover.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      resigned: monthSeparated.filter((e) => e.status === 'RESIGNED').length,
      terminated: monthSeparated.filter((e) => e.status === 'TERMINATED').length,
    })
  }

  // Current headcount by department
  const departmentHeadcount = await prisma.employee.groupBy({
    by: ['departmentId'],
    where: {
      organizationId,
      status: { in: ['ACTIVE', 'ON_LEAVE', 'PROBATION'] },
      deletedAt: null,
    },
    _count: { id: true },
  })

  // Fetch department names
  const departments = await prisma.department.findMany({
    where: {
      organizationId,
      id: { in: departmentHeadcount.map((d) => d.departmentId) },
    },
    select: {
      id: true,
      name: true,
    },
  })

  const deptMap = new Map(departments.map((d) => [d.id, d.name]))

  return {
    reportType: 'turnover',
    generatedAt: new Date(),
    period: {
      from: twelveMonthsAgo,
      to: now,
    },
    monthlyTurnover: monthlyTurnover.reverse(),
    totalSeparations: {
      resigned: separatedEmployees.filter((e) => e.status === 'RESIGNED').length,
      terminated: separatedEmployees.filter((e) => e.status === 'TERMINATED').length,
      total: separatedEmployees.length,
    },
    currentHeadcountByDepartment: departmentHeadcount.map((d) => ({
      department: deptMap.get(d.departmentId) ?? 'Unknown',
      headcount: d._count.id,
    })),
    totalCurrentHeadcount: departmentHeadcount.reduce((s, d) => s + d._count.id, 0),
  }
}
