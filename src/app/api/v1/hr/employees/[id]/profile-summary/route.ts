import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthFromRequest } from '@/lib/auth'
import { apiSuccess, apiNotFound, handleRouteError } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthFromRequest(request)
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: auth.organizationId, deletedAt: null },
      select: { id: true },
    })

    if (!employee) {
      return apiNotFound('Employee not found')
    }

    // Leave balance
    let leaveBalance: { totalEntitled: number; totalTaken: number; totalRemaining: number } = {
      totalEntitled: 0,
      totalTaken: 0,
      totalRemaining: 0,
    }
    try {
      const balances = await prisma.leaveBalance.findMany({
        where: { employeeId },
      })
      leaveBalance = {
        totalEntitled: balances.reduce((sum, b) => sum + (Number(b.entitled) || 0), 0),
        totalTaken: balances.reduce((sum, b) => sum + (Number(b.taken) || 0), 0),
        totalRemaining: balances.reduce((sum, b) => sum + (Number(b.remaining) || 0), 0),
      }
    } catch {
      // Model may not exist or have no data
    }

    // Contract status
    let contractStatus: {
      hasActive: boolean
      contractNo: string | null
      endDate: string | null
      daysLeft: number | null
    } = { hasActive: false, contractNo: null, endDate: null, daysLeft: null }
    try {
      const contract = await prisma.employeeContract.findFirst({
        where: { employeeId, status: 'ACTIVE' },
        orderBy: { endDate: 'desc' },
      })
      if (contract) {
        const daysLeft = contract.endDate
          ? Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
        contractStatus = {
          hasActive: true,
          contractNo: contract.contractNo ?? null,
          endDate: contract.endDate ? contract.endDate.toISOString().split('T')[0] : null,
          daysLeft,
        }
      }
    } catch {
      // Model may not exist
    }

    // PF balance
    let pfBalance: { enrolled: boolean; balance: number } = { enrolled: false, balance: 0 }
    try {
      const pf = await prisma.pFEnrollment.findFirst({
        where: { employeeId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      })
      if (pf) {
        pfBalance = {
          enrolled: true,
          balance: Number(pf.currentBalance) || 0,
        }
      }
    } catch {
      // Model may not exist
    }

    // Active projects
    let activeProjects: { count: number; totalAllocation: number } = { count: 0, totalAllocation: 0 }
    try {
      const allocations = await prisma.employeeProjectAllocation.findMany({
        where: { employeeId, isActive: true },
      })
      activeProjects = {
        count: allocations.length,
        totalAllocation: allocations.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0),
      }
    } catch {
      // Model may not exist
    }

    // Onboarding progress
    let onboardingProgress: { total: number; completed: number; percentage: number } = {
      total: 0,
      completed: 0,
      percentage: 0,
    }
    try {
      const tasks = await prisma.onboardingProgress.findMany({
        where: { employeeId },
      })
      const total = tasks.length
      const completed = tasks.filter((t) => t.completedAt !== null).length
      onboardingProgress = {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    } catch {
      // Model may not exist
    }

    // Gratuity accrual
    let gratuityAccrual: { eligible: boolean; accrued: number } = { eligible: false, accrued: 0 }
    try {
      const gratuity = await prisma.gratuityLedger.findFirst({
        where: { employeeId },
      })
      if (gratuity) {
        gratuityAccrual = {
          eligible: true,
          accrued: Number(gratuity.currentBalance) || 0,
        }
      }
    } catch {
      // Model may not exist
    }

    return apiSuccess({
      leaveBalance,
      contractStatus,
      pfBalance,
      activeProjects,
      onboardingProgress,
      gratuityAccrual,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
