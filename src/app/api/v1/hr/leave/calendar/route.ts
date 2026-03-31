import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiBadRequest,
  handleRouteError,
} from '@/lib/api-response'

/** Map leave type codes to calendar colors */
const LEAVE_TYPE_COLORS: Record<string, string> = {
  ANNUAL: '#3B82F6',   // blue
  SICK: '#EF4444',     // red
  CASUAL: '#22C55E',   // green
  MATERNITY: '#A855F7', // purple
  PATERNITY: '#8B5CF6', // violet
  WOP: '#6B7280',      // gray (without pay)
  COMP: '#F59E0B',     // amber (compensatory)
  STUDY: '#06B6D4',    // cyan
}

function getLeaveColor(code: string): string {
  return LEAVE_TYPE_COLORS[code.toUpperCase()] || '#6B7280'
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthFromRequest(request)
    const orgId = auth.organizationId

    const url = new URL(request.url)
    const monthParam = url.searchParams.get('month')
    const yearParam = url.searchParams.get('year')
    const departmentId = url.searchParams.get('departmentId')

    if (!monthParam || !yearParam) {
      return apiBadRequest('month and year are required')
    }

    const month = parseInt(monthParam, 10)
    const year = parseInt(yearParam, 10)

    if (month < 1 || month > 12 || isNaN(year)) {
      return apiBadRequest('Invalid month (1-12) or year')
    }

    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)
    const daysInMonth = new Date(year, month, 0).getDate()

    // ── Build employee filter ──
    const employeeWhere: Record<string, unknown> = {
      organizationId: orgId,
      status: 'ACTIVE',
      deletedAt: null,
    }
    if (departmentId) {
      employeeWhere.departmentId = departmentId
    }

    // ── Parallel queries ──
    const [employees, leaveApplications, holidayCalendars, coverageRules] =
      await Promise.all([
        // Active employees
        prisma.employee.findMany({
          where: employeeWhere,
          select: {
            id: true,
            fullName: true,
            departmentId: true,
            department: { select: { name: true } },
            designation: { select: { title: true } },
          },
          orderBy: { fullName: 'asc' },
        }),

        // Approved leaves overlapping this month
        prisma.leaveApplication.findMany({
          where: {
            employee: employeeWhere,
            status: 'APPROVED',
            startDate: { lte: endOfMonth },
            endDate: { gte: startOfMonth },
          },
          select: {
            id: true,
            employeeId: true,
            startDate: true,
            endDate: true,
            isHalfDay: true,
            halfDaySession: true,
            leaveType: { select: { name: true, code: true } },
          },
        }),

        // Holidays for this org and year
        prisma.holidayCalendar.findMany({
          where: {
            organizationId: orgId,
            year,
            isActive: true,
          },
          select: {
            holidays: {
              where: {
                date: { gte: startOfMonth, lte: endOfMonth },
              },
              select: {
                date: true,
                name: true,
                type: true,
              },
              orderBy: { date: 'asc' },
            },
          },
        }),

        // Coverage rules
        prisma.teamCoverageRule.findMany({
          where: {
            organizationId: orgId,
            isActive: true,
            ...(departmentId ? { departmentId } : {}),
          },
        }),
      ])

    // ── Flatten holidays ──
    const holidays = holidayCalendars.flatMap((cal) =>
      cal.holidays.map((h) => ({
        date: h.date,
        name: h.name,
        type: h.type,
      }))
    )

    // ── Determine coverage threshold ──
    // Prefer department-specific rule, fall back to org-wide (departmentId=null), then default 80%
    const deptRule = coverageRules.find((r) => r.departmentId === departmentId)
    const orgRule = coverageRules.find((r) => r.departmentId === null)
    const minimumPresencePercent = Number(
      deptRule?.minimumPresencePercent ?? orgRule?.minimumPresencePercent ?? 80
    )

    // ── Group leaves by employee ──
    const leavesByEmployee = new Map<
      string,
      {
        id: string
        startDate: Date
        endDate: Date
        leaveTypeName: string
        color: string
        status: string
        isHalfDay: boolean
        halfDaySession: string | null
      }[]
    >()

    for (const la of leaveApplications) {
      const list = leavesByEmployee.get(la.employeeId) || []
      list.push({
        id: la.id,
        startDate: la.startDate,
        endDate: la.endDate,
        leaveTypeName: la.leaveType.name,
        color: getLeaveColor(la.leaveType.code),
        status: 'APPROVED',
        isHalfDay: la.isHalfDay,
        halfDaySession: la.halfDaySession,
      })
      leavesByEmployee.set(la.employeeId, list)
    }

    // ── Build employee list with leaves ──
    const employeeList = employees.map((emp) => ({
      id: emp.id,
      fullName: emp.fullName,
      department: emp.department.name,
      designation: emp.designation.title,
      leaves: leavesByEmployee.get(emp.id) || [],
    }))

    // ── Build daily coverage ──
    const totalEmployees = employees.length
    const coverage = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)

      // Count employees on leave this day
      let onLeave = 0
      for (const la of leaveApplications) {
        const start = new Date(la.startDate)
        const end = new Date(la.endDate)
        if (date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
            date <= new Date(end.getFullYear(), end.getMonth(), end.getDate())) {
          onLeave += la.isHalfDay ? 0.5 : 1
        }
      }

      const present = totalEmployees - onLeave
      const presencePercent =
        totalEmployees > 0
          ? Math.round((present / totalEmployees) * 10000) / 100
          : 100

      let status: 'GOOD' | 'WARNING' | 'CRITICAL'
      if (presencePercent >= minimumPresencePercent) {
        status = 'GOOD'
      } else if (presencePercent >= 50) {
        status = 'WARNING'
      } else {
        status = 'CRITICAL'
      }

      coverage.push({
        date,
        totalEmployees,
        onLeave,
        present,
        presencePercent,
        status,
      })
    }

    return apiSuccess({
      month,
      year,
      holidays,
      employees: employeeList,
      coverage,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
