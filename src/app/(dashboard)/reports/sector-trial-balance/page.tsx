'use client'

import { useTranslations } from 'next-intl'
import { DimensionalReportPage } from '@/components/reports/dimensional-report-page'

interface SectorRow {
  sectorId: string | null
  sectorCode: string
  sectorName: string
  accounts: {
    accountCode: string
    accountName: string
    periodDebit: number
    periodCredit: number
    closingDebit: number
    closingCredit: number
  }[]
  subtotal: { periodDebit: number; periodCredit: number; closingDebit: number; closingCredit: number }
}

export default function SectorTrialBalancePage() {
  const t = useTranslations('reports.concern')

  return (
    <DimensionalReportPage
      title={t('sectorTrialBalance')}
      description={t('sectorTrialBalanceDesc')}
      endpoint="/api/v1/reports/sector-trial-balance"
      supports={['sectorId', 'fundClassId', 'projectId', 'grantId']}
      columns={[
        { key: 'accountCode', label: 'Code', align: 'left', format: 'text' },
        { key: 'accountName', label: 'Account / Sector', align: 'left', format: 'text' },
        { key: 'periodDebit', label: 'Period Debit', align: 'right', format: 'currency' },
        { key: 'periodCredit', label: 'Period Credit', align: 'right', format: 'currency' },
        { key: 'closingDebit', label: 'Closing Debit', align: 'right', format: 'currency' },
        { key: 'closingCredit', label: 'Closing Credit', align: 'right', format: 'currency' },
      ]}
      extractRows={(data) => {
        const sectors = (data.sectors as SectorRow[]) ?? []
        const totals = data.totals as Record<string, unknown> | undefined
        const rows: Record<string, unknown>[] = []
        for (const s of sectors) {
          rows.push({
            accountCode: '',
            accountName: `${s.sectorCode === '—' ? '' : s.sectorCode + ' · '}${s.sectorName}`,
            _isGroup: true,
          })
          for (const a of s.accounts) rows.push({ ...a })
          rows.push({
            accountCode: '',
            accountName: `Subtotal: ${s.sectorName}`,
            periodDebit: s.subtotal.periodDebit,
            periodCredit: s.subtotal.periodCredit,
            closingDebit: s.subtotal.closingDebit,
            closingCredit: s.subtotal.closingCredit,
            _isGroup: true,
          })
        }
        return {
          rows,
          totals: totals
            ? {
                accountName: 'Grand Total',
                periodDebit: totals.periodDebit,
                periodCredit: totals.periodCredit,
                closingDebit: totals.closingDebit,
                closingCredit: totals.closingCredit,
              }
            : undefined,
        }
      }}
    />
  )
}
