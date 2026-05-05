'use client'

import { useTranslations } from 'next-intl'
import { DimensionalReportPage } from '@/components/reports/dimensional-report-page'

interface CcRow {
  costCenterId: string | null
  costCenterCode: string
  costCenterName: string
  businessUnitCode: string | null
  accounts: { code: string; name: string; amount: number }[]
  subtotal: number
}

export default function CostCenterExpensesPage() {
  const t = useTranslations('reports.concern')

  return (
    <DimensionalReportPage
      title={t('costCenterExpenses')}
      description={t('costCenterExpensesDesc')}
      endpoint="/api/v1/reports/cost-center-expenses"
      supports={['sectorId', 'businessUnitId', 'fundClassId', 'projectId', 'grantId']}
      columns={[
        { key: 'code', label: 'Code', align: 'left', format: 'text' },
        { key: 'name', label: 'Cost Center / Account', align: 'left', format: 'text' },
        { key: 'businessUnit', label: 'Business Unit', align: 'left', format: 'text' },
        { key: 'amount', label: 'Amount', align: 'right', format: 'currency' },
      ]}
      extractRows={(data) => {
        const ccs = (data.costCenters as CcRow[]) ?? []
        const summary = data.summary as Record<string, unknown> | undefined
        const rows: Record<string, unknown>[] = []
        for (const cc of ccs) {
          rows.push({
            code: cc.costCenterCode,
            name: cc.costCenterName,
            businessUnit: cc.businessUnitCode ?? '—',
            amount: cc.subtotal,
            _isGroup: true,
          })
          for (const acc of cc.accounts) {
            rows.push({
              code: acc.code,
              name: `   ${acc.name}`,
              businessUnit: '',
              amount: acc.amount,
            })
          }
        }
        return {
          rows,
          totals: summary
            ? {
                name: 'Grand Total',
                amount: summary.grandTotal,
              }
            : undefined,
        }
      }}
    />
  )
}
