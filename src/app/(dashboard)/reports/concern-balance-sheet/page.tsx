'use client'

import { useTranslations } from 'next-intl'
import { DimensionalReportPage } from '@/components/reports/dimensional-report-page'

export default function ConcernBalanceSheetPage() {
  const t = useTranslations('reports.concern')

  return (
    <DimensionalReportPage
      title={t('concernBalanceSheet')}
      description={t('concernBalanceSheetDesc')}
      endpoint="/api/v1/finance/reports/balance-sheet"
      supports={['sectorId', 'businessUnitId', 'costCenterId', 'fundClassId', 'projectId', 'grantId']}
      columns={[
        { key: 'accountCode', label: 'Code', align: 'left', format: 'text' },
        { key: 'accountName', label: 'Account', align: 'left', format: 'text' },
        { key: 'balance', label: 'Balance', align: 'right', format: 'currency' },
      ]}
      extractRows={(data) => {
        const assets = data.assets as { accounts?: Record<string, unknown>[]; total?: number } | undefined
        const liab = data.liabilities as { accounts?: Record<string, unknown>[]; total?: number } | undefined
        const equity = data.equity as
          | { accounts?: Record<string, unknown>[]; total?: number; totalWithSurplus?: number; netSurplusDeficit?: number }
          | undefined
        const rows: Record<string, unknown>[] = []
        rows.push({ accountCode: '', accountName: 'ASSETS', balance: assets?.total ?? 0, _isGroup: true })
        for (const a of assets?.accounts ?? []) rows.push(a)
        rows.push({ accountCode: '', accountName: 'LIABILITIES', balance: liab?.total ?? 0, _isGroup: true })
        for (const a of liab?.accounts ?? []) rows.push(a)
        rows.push({
          accountCode: '',
          accountName: 'EQUITY / FUND BALANCE',
          balance: equity?.totalWithSurplus ?? equity?.total ?? 0,
          _isGroup: true,
        })
        for (const a of equity?.accounts ?? []) rows.push(a)
        if (equity?.netSurplusDeficit !== undefined) {
          rows.push({ accountCode: '', accountName: 'Net Surplus / (Deficit)', balance: equity.netSurplusDeficit })
        }
        return {
          rows,
          totals: {
            accountName: 'Total Assets = Liabilities + Equity',
            balance: data.totalLiabilitiesAndEquity,
          },
        }
      }}
    />
  )
}
