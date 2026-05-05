'use client'

import { useTranslations } from 'next-intl'
import { DimensionalReportPage } from '@/components/reports/dimensional-report-page'

export default function FundPositionPage() {
  const t = useTranslations('reports.concern')

  return (
    <DimensionalReportPage
      title={t('fundPosition')}
      description={t('fundPositionDesc')}
      endpoint="/api/v1/finance/reports/fund-position"
      supports={['projectId', 'grantId']}
      columns={[
        { key: 'grantNo', label: 'Grant No.', align: 'left', format: 'text' },
        { key: 'grantTitle', label: 'Grant', align: 'left', format: 'text' },
        { key: 'donorName', label: 'Donor', align: 'left', format: 'text' },
        { key: 'totalIncome', label: 'Income', align: 'right', format: 'currency' },
        { key: 'totalExpenses', label: 'Expenses', align: 'right', format: 'currency' },
        { key: 'fundBalance', label: 'Fund Balance', align: 'right', format: 'currency' },
        { key: 'utilizationRate', label: 'Utilization %', align: 'right', format: 'text' },
      ]}
      extractRows={(data) => {
        const grants = (data.grants as Record<string, unknown>[]) ?? []
        const summary = data.summary as Record<string, unknown> | undefined
        return {
          rows: grants.map((g) => ({
            ...g,
            utilizationRate: `${Number(g.utilizationRate ?? 0).toFixed(1)}%`,
          })),
          totals: summary
            ? {
                grantTitle: 'Total',
                totalIncome: summary.totalIncome,
                totalExpenses: summary.totalExpenses,
                fundBalance: summary.totalFundBalance,
                utilizationRate: `${Number(summary.overallUtilizationRate ?? 0).toFixed(1)}%`,
              }
            : undefined,
        }
      }}
    />
  )
}
