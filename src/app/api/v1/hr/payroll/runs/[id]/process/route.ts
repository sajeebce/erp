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

// ─── Helper: round to 2 decimal places ───
function r2(n: number): number {
  return Math.round(n * 100) / 100
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function countWeekendDays(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  let weekends = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = new Date(year, month - 1, day).getDay()
    if (weekday === 5 || weekday === 6) {
      weekends++
    }
  }

  return weekends
}

function expandHolidayDateKeys(startDate: Date, endDate: Date, monthStart: Date, monthEnd: Date): string[] {
  const keys: string[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    if (current >= monthStart && current <= monthEnd) {
      keys.push(toDateKey(current))
    }
    current.setDate(current.getDate() + 1)
  }

  return keys
}

function getWeekdayFromDateKey(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).getDay()
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
      },
      include: {
        salaryGrade: { include: { steps: true } },
        salaryStructure: {
          include: {
            lines: {
              where: { isActive: true },
              include: { component: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
      },
    })

    // Get attendance for the month
    const startDate = new Date(run.year, run.month - 1, 1)
    const endDate = new Date(run.year, run.month, 0, 23, 59, 59)
    const daysInMonth = new Date(run.year, run.month, 0).getDate()
    const weekendDays = countWeekendDays(run.year, run.month)

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: { in: employees.map((e) => e.id) },
        date: { gte: startDate, lte: endDate },
      },
    })

    const holidayCalendar = await prisma.holidayCalendar.findFirst({
      where: {
        organizationId: auth.organizationId,
        year: run.year,
        isActive: true,
        isDefault: true,
      },
      select: { id: true },
    })

    const holidays = holidayCalendar
      ? await prisma.holiday.findMany({
          where: {
            calendarId: holidayCalendar.id,
            date: { lte: endDate },
            OR: [
              { endDate: null },
              { endDate: { gte: startDate } },
            ],
          },
          select: { date: true, endDate: true },
        })
      : []

    const holidayDateKeys = new Set<string>()
    for (const holiday of holidays) {
      const holidayStart = new Date(holiday.date)
      const holidayEnd = holiday.endDate ? new Date(holiday.endDate) : new Date(holiday.date)

      for (const key of expandHolidayDateKeys(holidayStart, holidayEnd, startDate, endDate)) {
        holidayDateKeys.add(key)
      }
    }

    let weekdayHolidayCount = 0
    for (const key of holidayDateKeys) {
      const weekday = getWeekdayFromDateKey(key)
      if (weekday !== 5 && weekday !== 6) {
        weekdayHolidayCount++
      }
    }

    const workingCalendarDays = Math.max(0, daysInMonth - weekendDays - weekdayHolidayCount)

    // Determine fiscal year for YTD calculation
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: { organizationId: auth.organizationId, isCurrent: true },
      select: { id: true, startDate: true, endDate: true },
    })

    // Pre-fetch previous PayrollEntryLines in this fiscal year for YTD
    // We need all entries from payroll runs in the same fiscal year, before current month
    let previousEntryLines: { payrollEntryId: string; componentId: string; amount: Prisma.Decimal }[] = []
    let previousEntryEmployeeMap: Record<string, string> = {} // entryId -> employeeId

    if (fiscalYear) {
      const previousRuns = await prisma.payrollRun.findMany({
        where: {
          id: { not: id },
          status: { in: ['PROCESSED', 'APPROVED', 'PAID'] },
          // Runs within fiscal year dates
          OR: [
            {
              year: { gt: fiscalYear.startDate.getFullYear(), lt: fiscalYear.endDate.getFullYear() },
            },
            {
              year: fiscalYear.startDate.getFullYear(),
              month: { gte: fiscalYear.startDate.getMonth() + 1 },
            },
            {
              year: fiscalYear.endDate.getFullYear(),
              month: { lte: fiscalYear.endDate.getMonth() + 1 },
            },
          ],
        },
        select: { id: true },
      })

      if (previousRuns.length > 0) {
        const prevEntries = await prisma.payrollEntry.findMany({
          where: { payrollRunId: { in: previousRuns.map((r) => r.id) } },
          select: { id: true, employeeId: true },
        })

        previousEntryEmployeeMap = Object.fromEntries(
          prevEntries.map((e) => [e.id, e.employeeId])
        )

        previousEntryLines = await prisma.payrollEntryLine.findMany({
          where: { payrollEntryId: { in: prevEntries.map((e) => e.id) } },
          select: { payrollEntryId: true, componentId: true, amount: true },
        })
      }
    }

    // Build YTD lookup: employeeId -> componentId -> sum
    const ytdMap: Record<string, Record<string, number>> = {}
    for (const line of previousEntryLines) {
      const empId = previousEntryEmployeeMap[line.payrollEntryId]
      if (!empId) continue
      if (!ytdMap[empId]) ytdMap[empId] = {}
      ytdMap[empId][line.componentId] = (ytdMap[empId][line.componentId] || 0) + Number(line.amount)
    }

    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0

    const entries: Prisma.PayrollEntryCreateManyInput[] = []
    // Collect lines per employee to create after entries
    const allLines: {
      employeeId: string
      lines: {
        componentId: string
        componentName: string
        componentCode: string
        lineType: string
        calculationType: string
        percentage: number | null
        amount: number
        ytdAmount: number
        sortOrder: number
      }[]
    }[] = []

    for (const emp of employees) {
      let basicSalary = 0
      let useStructure = false

      // (a) If employee has salaryGradeId + salaryStepNo -> get basic from SalaryGradeStep
      if (emp.salaryGradeId && emp.salaryStepNo && emp.salaryGrade) {
        const step = emp.salaryGrade.steps.find(
          (s) => s.stepNumber === emp.salaryStepNo
        )
        if (step) {
          basicSalary = Number(step.basicSalary)
        }
      }

      // If no grade/step basic found, fall back to employee.basicSalary
      if (basicSalary <= 0) {
        basicSalary = Number(emp.basicSalary ?? 0)
      }

      if (basicSalary <= 0) continue

      // (b) Check if employee has salary structure
      const structureLines = emp.salaryStructure?.lines ?? []

      // ── Attendance ──
      const empAttendance = attendanceRecords.filter((a) => a.employeeId === emp.id)
      const presentDays = empAttendance.filter((a) =>
        ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)
      ).length
      const leaveDays = empAttendance.filter((a) => a.status === 'ON_LEAVE').length
      const absentDays = Math.max(0, workingCalendarDays - presentDays - leaveDays)
      const otHours = empAttendance.reduce((sum, a) => sum + Number(a.otHours), 0)

      // ── Calculate components ──
      const entryLines: typeof allLines[number]['lines'] = []

      let houseRent = 0
      let medical = 0
      let transport = 0
      let otherEarnings = 0
      let pfDeduction = 0
      let tdsDeduction = 0
      let otherDeductions = 0
      let grossSalary = 0

      if (structureLines.length > 0) {
        useStructure = true

        // First pass: calculate FIXED and PERCENT_OF_BASIC earnings to get subtotal for PERCENT_OF_GROSS
        let earningsSubtotal = 0
        const pendingGrossLines: typeof structureLines = []

        for (const line of structureLines) {
          const comp = line.component
          if (line.calculationType === 'PERCENT_OF_GROSS') {
            pendingGrossLines.push(line)
            continue
          }

          let amount = 0
          let pct: number | null = null

          if (line.calculationType === 'FIXED') {
            amount = Number(line.amount ?? 0)
          } else if (line.calculationType === 'PERCENT_OF_BASIC') {
            pct = Number(line.percentage ?? 0)
            amount = r2(basicSalary * pct / 100)
          }

          if (comp.type === 'EARNING') {
            earningsSubtotal += amount
          }

          const empYtd = ytdMap[emp.id]?.[comp.id] ?? 0

          entryLines.push({
            componentId: comp.id,
            componentName: comp.name,
            componentCode: comp.code,
            lineType: comp.type,
            calculationType: line.calculationType,
            percentage: pct,
            amount: r2(amount),
            ytdAmount: r2(empYtd + amount),
            sortOrder: line.sortOrder,
          })
        }

        // Calculate gross from earnings so far (for PERCENT_OF_GROSS)
        // Gross = all earnings summed
        grossSalary = earningsSubtotal

        // Second pass: PERCENT_OF_GROSS
        for (const line of pendingGrossLines) {
          const comp = line.component
          const pct = Number(line.percentage ?? 0)
          const amount = r2(grossSalary * pct / 100)

          if (comp.type === 'EARNING') {
            grossSalary += amount
          }

          const empYtd = ytdMap[emp.id]?.[comp.id] ?? 0

          entryLines.push({
            componentId: comp.id,
            componentName: comp.name,
            componentCode: comp.code,
            lineType: comp.type,
            calculationType: 'PERCENT_OF_GROSS',
            percentage: pct,
            amount: r2(amount),
            ytdAmount: r2(empYtd + amount),
            sortOrder: line.sortOrder,
          })
        }

        // Re-calculate grossSalary as sum of all EARNING lines
        grossSalary = r2(entryLines
          .filter((l) => l.lineType === 'EARNING')
          .reduce((s, l) => s + l.amount, 0))

        // Map component codes to flat columns for backward compat
        for (const line of entryLines) {
          const code = line.componentCode.toUpperCase()
          if (line.lineType === 'EARNING') {
            if (code === 'BASIC') {
              // basicSalary is already set
            } else if (code === 'HOUSE_RENT' || code === 'HRA') {
              houseRent += line.amount
            } else if (code === 'MEDICAL' || code === 'MED') {
              medical += line.amount
            } else if (code === 'TRANSPORT' || code === 'TA') {
              transport += line.amount
            } else {
              otherEarnings += line.amount
            }
          } else if (line.lineType === 'DEDUCTION') {
            if (code === 'PF' || code === 'PF_DEDUCTION') {
              pfDeduction += line.amount
            } else if (code === 'TDS' || code === 'TAX') {
              tdsDeduction += line.amount
            } else {
              otherDeductions += line.amount
            }
          }
        }
      } else {
        // ── FALLBACK: Legacy flat calculation ──
        houseRent = r2(basicSalary * 0.5)
        medical = r2(basicSalary * 0.1)
        transport = r2(basicSalary * 0.1)

        grossSalary = r2(basicSalary + houseRent + medical + transport)

        pfDeduction = r2(basicSalary * 0.1)
        tdsDeduction = r2(basicSalary * 0.05)
      }

      // Absent deduction always applies
      const perDayRate = grossSalary / daysInMonth
      const absentDeduction = r2(perDayRate * absentDays)

      const totalDeductionsForEmp = useStructure
        ? r2(entryLines.filter((l) => l.lineType === 'DEDUCTION').reduce((s, l) => s + l.amount, 0) + absentDeduction)
        : r2(pfDeduction + tdsDeduction + absentDeduction)

      const netSalary = r2(grossSalary - totalDeductionsForEmp)

      entries.push({
        payrollRunId: id,
        employeeId: emp.id,
        basicSalary: new Prisma.Decimal(basicSalary),
        houseRent: new Prisma.Decimal(houseRent),
        medicalAllowance: new Prisma.Decimal(medical),
        transportAllowance: new Prisma.Decimal(transport),
        otherEarnings: new Prisma.Decimal(otherEarnings),
        grossSalary: new Prisma.Decimal(grossSalary),
        pfDeduction: new Prisma.Decimal(pfDeduction),
        tdsDeduction: new Prisma.Decimal(tdsDeduction),
        otherDeductions: new Prisma.Decimal(otherDeductions),
        absentDeduction: new Prisma.Decimal(absentDeduction),
        netSalary: new Prisma.Decimal(netSalary),
        workingDays: workingCalendarDays,
        presentDays,
        absentDays,
        otHours: new Prisma.Decimal(otHours),
      })

      if (useStructure && entryLines.length > 0) {
        allLines.push({ employeeId: emp.id, lines: entryLines })
      }

      totalGross += grossSalary
      totalDeductions += totalDeductionsForEmp
      totalNet += netSalary
    }

    // Execute in transaction
    await prisma.$transaction(async (tx) => {
      // Create all payroll entries
      await tx.payrollEntry.createMany({ data: entries })

      // Update the run
      await tx.payrollRun.update({
        where: { id },
        data: {
          organizationId: auth.organizationId,
          status: 'PROCESSED',
          totalGross: new Prisma.Decimal(r2(totalGross)),
          totalDeductions: new Prisma.Decimal(r2(totalDeductions)),
          totalNet: new Prisma.Decimal(r2(totalNet)),
          employeeCount: entries.length,
          processedById: auth.userId,
          processedAt: new Date(),
        },
      })

      // Create PayrollEntryLine records for structure-based entries
      if (allLines.length > 0) {
        // Fetch the just-created entries to get their IDs
        const createdEntries = await tx.payrollEntry.findMany({
          where: { payrollRunId: id },
          select: { id: true, employeeId: true },
        })

        const entryIdMap = Object.fromEntries(
          createdEntries.map((e) => [e.employeeId, e.id])
        )

        const lineRecords: Prisma.PayrollEntryLineCreateManyInput[] = []

        for (const { employeeId, lines } of allLines) {
          const payrollEntryId = entryIdMap[employeeId]
          if (!payrollEntryId) continue

          for (const line of lines) {
            lineRecords.push({
              payrollEntryId,
              componentId: line.componentId,
              componentName: line.componentName,
              componentCode: line.componentCode,
              lineType: line.lineType,
              calculationType: line.calculationType as 'FIXED' | 'PERCENT_OF_BASIC' | 'PERCENT_OF_GROSS',
              percentage: line.percentage != null ? new Prisma.Decimal(line.percentage) : null,
              amount: new Prisma.Decimal(line.amount),
              ytdAmount: new Prisma.Decimal(line.ytdAmount),
              sortOrder: line.sortOrder,
            })
          }
        }

        if (lineRecords.length > 0) {
          await tx.payrollEntryLine.createMany({ data: lineRecords })
        }
      }
    })

    const auditCtx = getAuditContext(request)
    await logAudit({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'UPDATE',
      module: 'hr',
      resource: 'payroll_run',
      resourceId: id,
      description: `Processed payroll run ${run.runNo} — ${entries.length} employees`,
      newValues: { status: 'PROCESSED', employeeCount: entries.length, totalNet: r2(totalNet) },
      ...auditCtx,
    })

    return apiSuccess({
      id,
      status: 'PROCESSED',
      employeeCount: entries.length,
      totalGross: r2(totalGross),
      totalDeductions: r2(totalDeductions),
      totalNet: r2(totalNet),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
