import { NextRequest } from 'next/server'
import { requireAuthFromRequest } from '@/lib/auth'
import {
  apiSuccess,
  handleRouteError,
} from '@/lib/api-response'

// ─── Main Handler ───

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)

    return apiSuccess({
      reportType: 'available-reports',
      generatedAt: new Date(),
      availableReports: [
        {
          type: 'financial',
          endpoint: '/api/v1/finance/reports/{type}',
          subtypes: [
            'trial-balance',
            'income-statement',
            'balance-sheet',
            'cash-flow',
            'fund-position',
          ],
          description: 'Financial statements and fund position reports',
        },
        {
          type: 'ngoab',
          endpoint: '/api/v1/reports/ngoab/{form}',
          subtypes: ['fd-1', 'fd-2', 'fd-3', 'fd-4', 'fd-5', 'fd-6'],
          description: 'NGOAB compliance forms (FD-1 through FD-6)',
        },
        {
          type: 'donor',
          endpoint: '/api/v1/reports/donor',
          description: 'Donor-wise fund utilization and grant details',
          queryParams: ['donorId', 'grantId'],
        },
        {
          type: 'project',
          endpoint: '/api/v1/reports/project',
          description: 'Project progress, budget utilization, and portfolio overview',
          queryParams: ['projectId'],
        },
        {
          type: 'hr',
          endpoint: '/api/v1/reports/hr/{type}',
          subtypes: [
            'staff-list',
            'attendance-summary',
            'leave-balance',
            'payroll-register',
            'training-report',
            'turnover',
          ],
          description: 'Human resources reports including payroll and attendance',
        },
        {
          type: 'procurement',
          endpoint: '/api/v1/reports/procurement',
          description: 'PO summary, vendor performance, contract status, inventory analytics',
        },
      ],
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
