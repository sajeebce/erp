'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { formatBDT } from '@/lib/formatters'

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

const columns: ColumnDef<JournalEntry>[] = [
  { accessorKey: 'entryNo', header: 'Entry No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('entryNo')}</span> },
  { accessorKey: 'date', header: 'Date', cell: ({ row }) => new Date(row.getValue('date') as string).toLocaleDateString() },
  { accessorKey: 'description', header: 'Description', cell: ({ row }) => <span className="max-w-[300px] truncate block">{row.getValue('description')}</span> },
  { accessorKey: 'totalDebit', header: 'Debit', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('totalDebit')))}</span> },
  { accessorKey: 'totalCredit', header: 'Credit', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('totalCredit')))}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
]

export default function JournalEntriesPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/finance/journal-entries?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setEntries(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Journal Entries" description="Double-entry journal voucher management">
        <Button size="sm" onClick={() => router.push('/finance/journal-entries/new')}>
          <Plus className="h-4 w-4 mr-2" />New Entry
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={entries}
        searchKey="description"
        searchPlaceholder="Search entries..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/finance/journal-entries/${row.id}`)}
      />
    </div>
  )
}
