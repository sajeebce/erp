import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { logAudit, getAuditContext } from '@/lib/audit'
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const run = await prisma.payrollRun.findUnique({ where: { id } })
    if (!run) return apiNotFound('Payroll run not found')

    if (run.status !== 'DRAFT') {
      return apiBadRequest('Payroll run has already been processed')
    }

    // Get active employees for this org
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: auth.organizationId,
        status: 'ACTIVE',
        deletedAt: null,
        basicSalary: { not: null },
      },
    })

    // Get attendance for the month
    const startDate = new Date(run.year, run.month - 1, 1)
    const endDate = new Date(run.year, run.month, 0, 23, 59, 59)
    const daysInMonth = new Date(run.year, run.month, 0).getDate()

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: { in: employees.map((e) => e.id) },
        date: { gte: startDate, lte: endDate },
      },
    })

    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0

    const entries: Prisma.PayrollEntryCreateManyInput[] = []

    for (const emp of employees) {
      const basic = Number(emp.basicSalary ?? 0)
      if (basic <= 0) continue

      // Salary components (standard NGO structure)
      const houseRent = basic * 0.5
      const medical = basic * 0.1
      const transport = basic * 0.1

      // Attendance
      const empAttendance = attendanceRecords.filter((a) => a.employeeId === emp.id)
      const presentDays = empAttendance.filter((a) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)).length
      const leaveDays = empAttendance.filter((a) => a.status === 'ON_LEAVE').length
      const absentDays = daysInMonth - presentDays - leaveDays
      const effectiveAbsent = Math.max(0, absentDays)

      const otHours = empAttendance.reduce((sum, a) => sum + Number(a.otHours), 0)

      const grossSalary = basic + houseRent + medical + transport

      // Deductions
      const pfDeduction = basic * 0.1
      const tdsDeduction = basic * 0.05

      // Absent deduction: per-day rate * absent days
      const perDayRate = grossSalary / daysInMonth
      const absentDeduction = Math.round(perDayRate * effectiveAbsent * 100) / 100

      const totalDeductionsForEmp = pfDeduction + tdsDeduction + absentDeduction
      const netSalary = Math.round((grossSalary - totalDeductionsForEmp) * 100) / 100

      entries.push({
        payrollRunId: id,
        employeeId: emp.id,
        basicSalary: new Prisma.Decimal(basic),
        houseRent: new Prisma.Decimal(houseRent),
        medicalAllowance: new Prisma.Decimal(medical),
        transportAllowance: new Prisma.Decimal(transport),
        grossSalary: new Prisma.Decimal(grossSalary),
        pfDeduction: new Prisma.Decimal(pfDeduction),
        tdsDeduction: new Prisma.Decimal(tdsDeduction),
        absentDeduction: new Prisma.Decimal(absentDeduction),
        netSalary: new Prisma.Decimal(netSalary),
        workingDays: daysInMonth,
        presentDays,
        absentDays: effectiveAbsent,
        otHours: new Prisma.Decimal(otHours),
      })

      totalGross += grossSalary
      totalDeductions += totalDeductionsForEmp
      totalNet += netSalary
    }

    await prisma.$transaction([
      prisma.payrollEntry.createMany({ data: entries }),
      prisma.payrollRun.update({
        where: { id },
        data: {
          status: 'PROCESSED',
          totalGross: new Prisma.Decimal(Math.round(totalGross * 100) / 100),
          totalDeductions: new Prisma.Decimal(Math.round(totalDeductions * 100) / 100),
          totalNet: new Prisma.Decimal(Math.round(totalNet * 100) / 100),
          employeeCount: entries.length,
          processedById: auth.userId,
          processedAt: new Date(),
        },
      }),
    ])

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'payroll_run',
      resourceId: id,
      description: `Processed payroll run ${run.runNo} — ${entries.length} employees`,
      newValues: { status: 'PROCESSED', employeeCount: entries.length, totalNet },
      ...auditCtx,
    })

    return apiSuccess({
      id,
      status: 'PROCESSED',
      employeeCount: entries.length,
      totalGross: Math.round(totalGross * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
