'use client'

import { useTranslations } from 'next-intl'
import { DimensionalReportPage } from '@/components/reports/dimensional-report-page'

export default function ConcernIncomeStatementPage() {
  const t = useTranslations('reports.concern')

  return (
    <DimensionalReportPage
      title={t('concernIncomeStatement')}
      description={t('concernIncomeStatementDesc')}
      endpoint="/api/v1/finance/reports/income-statement"
      supports={['sectorId', 'businessUnitId', 'costCenterId', 'fundClassId', 'projectId', 'grantId']}
      columns={[
        { key: 'accountCode', label: 'Code', align: 'left', format: 'text' },
        { key: 'accountName', label: 'Account', align: 'left', format: 'text' },
        { key: 'amount', label: 'Amount', align: 'right', format: 'currency' },
      ]}
      extractRows={(data) => {
        const incomeSection = data.income as { accounts?: Record<string, unknown>[]; total?: number } | undefined
        const expenseSection = data.expenses as { accounts?: Record<string, unknown>[]; total?: number } | undefined
        const rows: Record<string, unknown>[] = []
        rows.push({ accountCode: '', accountName: 'INCOME', amount: incomeSection?.total ?? 0, _isGroup: true })
        for (const a of incomeSection?.accounts ?? []) rows.push(a)
        rows.push({ accountCode: '', accountName: 'EXPENSES', amount: expenseSection?.total ?? 0, _isGroup: true })
        for (const a of expenseSection?.accounts ?? []) rows.push(a)
        return {
          rows,
          totals: { accountName: 'Net Surplus / (Deficit)', amount: data.netSurplusDeficit },
        }
      }}
    />
  )
}
