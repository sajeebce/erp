'use client'

import { useTranslations } from 'next-intl'
import { DimensionalReportPage } from '@/components/reports/dimensional-report-page'

interface InterEntry {
  journalEntryId: string
  entryNo: string
  date: string
  description: string
  reference: string | null
  sourceModule: string | null
  totalDebit: number
  totalCredit: number
  businessUnitCount: number
  fundClassCount: number
  spansMultipleBu: boolean
  spansMultipleFc: boolean
  lines: {
    accountCode: string
    accountName: string
    debit: number
    credit: number
    businessUnitCode: string | null
    businessUnitName: string | null
    fundClassCode: string | null
    fundClassName: string | null
  }[]
}

export default function InterConcernTransactionsPage() {
  const t = useTranslations('reports.concern')

  return (
    <DimensionalReportPage
      title={t('interConcernTransactions')}
      description={t('interConcernTransactionsDesc')}
      endpoint="/api/v1/reports/inter-concern-transactions"
      supports={['businessUnitId', 'fundClassId']}
      columns={[
        { key: 'date', label: 'Date', align: 'left', format: 'date' },
        { key: 'entryNo', label: 'Entry No.', align: 'left', format: 'text' },
        { key: 'description', label: 'Description', align: 'left', format: 'text' },
        { key: 'businessUnits', label: 'Business Units', align: 'left', format: 'text' },
        { key: 'fundClasses', label: 'Fund Classes', align: 'left', format: 'text' },
        { key: 'totalDebit', label: 'Debit', align: 'right', format: 'currency' },
        { key: 'totalCredit', label: 'Credit', align: 'right', format: 'currency' },
      ]}
      extractRows={(data) => {
        const entries = (data.entries as InterEntry[]) ?? []
        const summary = data.summary as Record<string, unknown> | undefined
        const rows = entries.map((entry) => {
          const buCodes = [
            ...new Set(entry.lines.map((l) => l.businessUnitCode).filter((v): v is string => Boolean(v))),
          ]
          const fcCodes = [
            ...new Set(entry.lines.map((l) => l.fundClassCode).filter((v): v is string => Boolean(v))),
          ]
          return {
            date: entry.date,
            entryNo: entry.entryNo,
            description: entry.description,
            businessUnits: buCodes.join(', ') || '—',
            fundClasses: fcCodes.join(', ') || '—',
            totalDebit: entry.totalDebit,
            totalCredit: entry.totalCredit,
          }
        })
        return {
          rows,
          totals: summary
            ? {
                description: `${summary.totalEntries ?? 0} entries (${summary.crossBuCount ?? 0} cross-BU, ${summary.crossFcCount ?? 0} cross-FC)`,
                totalDebit: summary.totalDebit,
                totalCredit: summary.totalCredit,
              }
            : undefined,
          emptyMessage: 'No journal entries spanning multiple Business Units or Fund Classes for the selected period.',
        }
      }}
    />
  )
}
