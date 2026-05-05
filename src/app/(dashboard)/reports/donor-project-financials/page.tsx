'use client'

import { useTranslations } from 'next-intl'
import { DimensionalReportPage } from '@/components/reports/dimensional-report-page'

export default function DonorProjectFinancialsPage() {
  const t = useTranslations('reports.concern')

  return (
    <DimensionalReportPage
      title={t('donorProjectFinancials')}
      description={t('donorProjectFinancialsDesc')}
      endpoint="/api/v1/reports/donor-project-financials"
      supports={['businessUnitId', 'fundClassId', 'projectId', 'grantId']}
      columns={[
        { key: 'donorName', label: 'Donor', align: 'left', format: 'text' },
        { key: 'projectNo', label: 'Project No.', align: 'left', format: 'text' },
        { key: 'projectName', label: 'Project', align: 'left', format: 'text' },
        { key: 'budget', label: 'Budget', align: 'right', format: 'currency' },
        { key: 'actual', label: 'Actual', align: 'right', format: 'currency' },
        { key: 'variance', label: 'Variance', align: 'right', format: 'currency' },
        { key: 'utilizationRate', label: 'Utilization %', align: 'right', format: 'text' },
      ]}
      extractRows={(data) => {
        const rows = (data.rows as Record<string, unknown>[]) ?? []
        const summary = data.summary as Record<string, unknown> | undefined
        return {
          rows: rows.map((r) => ({
            ...r,
            utilizationRate: `${Number(r.utilizationRate ?? 0).toFixed(1)}%`,
          })),
          totals: summary
            ? {
                projectName: 'Grand Total',
                budget: summary.totalBudget,
                actual: summary.totalActual,
                variance: summary.totalVariance,
              }
            : undefined,
        }
      }}
    />
  )
}
