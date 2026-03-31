import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  apiNotFound,
  handleRouteError,
} from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id } = await params

    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            employee: {
              select: {
                id: true,
                employeeNo: true,
                fullName: true,
                department: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    if (!run) {
      return apiNotFound('Payroll run not found')
    }

    // Get all employee IDs from the run
    const employeeIds = run.entries.map((e) => e.employeeId)

    // Get active project allocations for these employees
    const allocations = await prisma.employeeProjectAllocation.findMany({
      where: {
        employeeId: { in: employeeIds },
        isActive: true,
      },
      include: {
        project: { select: { id: true, projectNo: true, name: true } },
      },
    })

    // Group allocations by employee
    const allocByEmployee: Record<string, typeof allocations> = {}
    for (const alloc of allocations) {
      if (!allocByEmployee[alloc.employeeId]) allocByEmployee[alloc.employeeId] = []
      allocByEmployee[alloc.employeeId].push(alloc)
    }

    // Get all project IDs from allocations
    const projectIds = [...new Set(allocations.map((a) => a.projectId))]

    // Find matching budgets with Personnel budget lines
    const budgets = await prisma.budget.findMany({
      where: {
        projectId: { in: projectIds },
        status: { in: ['APPROVED', 'ACTIVE'] },
      },
      include: {
        lines: {
          where: { category: 'Personnel' },
        },
      },
    })

    // Build budget lookup: projectId -> { budget, personnelLine }
    const budgetByProject: Record<string, {
      budgetId: string
      budgetName: string
      totalAmount: number
      personnelLineId: string | null
      personnelBudgeted: number
    }> = {}

    for (const budget of budgets) {
      const personnelLine = budget.lines.find((l) => l.category === 'Personnel')
      budgetByProject[budget.projectId] = {
        budgetId: budget.id,
        budgetName: budget.name,
        totalAmount: Number(budget.totalAmount),
        personnelLineId: personnelLine?.id ?? null,
        personnelBudgeted: personnelLine ? Number(personnelLine.totalAmount) : 0,
      }
    }

    // Calculate existing personnel spend from PayrollBudgetAllocation for each project
    const existingSpend: Record<string, number> = {}
    if (projectIds.length > 0) {
      const prevAllocations = await prisma.payrollBudgetAllocation.groupBy({
        by: ['projectId'],
        where: {
          organizationId: auth.organizationId,
          projectId: { in: projectIds },
          payrollRunId: { not: id }, // Exclude current run
        },
        _sum: { totalCharge: true },
      })

      for (const pa of prevAllocations) {
        existingSpend[pa.projectId] = Number(pa._sum.totalCharge ?? 0)
      }
    }

    // Build budget impact rows
    const impactRows: {
      employee: { id: string; employeeNo: string; fullName: string; department: string | null }
      project: { id: string; projectNo: string; name: string }
      budget: { id: string; name: string; personnelBudgeted: number } | null
      allocPct: number
      grossCharge: number
      budgetAvailable: number | null
      status: 'OK' | 'WARNING' | 'OVER_BUDGET' | 'NO_BUDGET'
    }[] = []

    for (const entry of run.entries) {
      const empAllocations = allocByEmployee[entry.employeeId] ?? []

      for (const alloc of empAllocations) {
        const allocPct = Number(alloc.percentage)
        const grossCharge = Math.round(Number(entry.grossSalary) * allocPct / 100 * 100) / 100

        const budgetInfo = budgetByProject[alloc.projectId]

        let budgetAvailable: number | null = null
        let status: 'OK' | 'WARNING' | 'OVER_BUDGET' | 'NO_BUDGET' = 'NO_BUDGET'

        if (budgetInfo && budgetInfo.personnelBudgeted > 0) {
          const spent = existingSpend[alloc.projectId] ?? 0
          budgetAvailable = Math.round((budgetInfo.personnelBudgeted - spent) * 100) / 100

          if (grossCharge > budgetAvailable) {
            status = 'OVER_BUDGET'
          } else if (grossCharge > budgetAvailable * 0.9) {
            status = 'WARNING'
          } else {
            status = 'OK'
          }
        }

        impactRows.push({
          employee: {
            id: entry.employee.id,
            employeeNo: entry.employee.employeeNo,
            fullName: entry.employee.fullName,
            department: entry.employee.department?.name ?? null,
          },
          project: {
            id: alloc.project.id,
            projectNo: alloc.project.projectNo,
            name: alloc.project.name,
          },
          budget: budgetInfo ? {
            id: budgetInfo.budgetId,
            name: budgetInfo.budgetName,
            personnelBudgeted: budgetInfo.personnelBudgeted,
          } : null,
          allocPct,
          grossCharge,
          budgetAvailable,
          status,
        })
      }
    }

    // Summary
    const totalGrossCharge = impactRows.reduce((s, r) => s + r.grossCharge, 0)
    const overBudgetCount = impactRows.filter((r) => r.status === 'OVER_BUDGET').length
    const warningCount = impactRows.filter((r) => r.status === 'WARNING').length

    return apiSuccess({
      payrollRunId: id,
      month: run.month,
      year: run.year,
      summary: {
        totalGrossCharge: Math.round(totalGrossCharge * 100) / 100,
        allocationsCount: impactRows.length,
        overBudgetCount,
        warningCount,
      },
      allocations: impactRows,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
