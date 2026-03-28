'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface JournalEntry {
  id: string
  entryNo: string
  date: string
  description: string
  totalDebit: string | number
  totalCredit: string | number
  status: string
  createdAt: string
}

export default function JournalEntriesPage() {
  const router = useRouter()
  const t = useTranslations('finance.journalEntries')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<JournalEntry>[] = [
    { accessorKey: 'entryNo', header: t('entryNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('entryNo')}</span> },
    { accessorKey: 'date', header: t('date'), cell: ({ row }) => new Date(row.getValue('date') as string).toLocaleDateString() },
    { accessorKey: 'description', header: t('description'), cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.getValue('description')}</span> },
    { accessorKey: 'totalDebit', header: t('debit'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('totalDebit')))}</span> },
    { accessorKey: 'totalCredit', header: t('credit'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('totalCredit')))}</span> },
    { accessorKey: 'status', header: t('status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/finance/journal-entries?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setEntries(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button size="sm" onClick={() => router.push('/finance/journal-entries/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('newEntry')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={entries}
        searchKey="description"
        searchPlaceholder={t('searchEntries')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/finance/journal-entries/${row.id}`)}
      />
    </div>
  )
}
