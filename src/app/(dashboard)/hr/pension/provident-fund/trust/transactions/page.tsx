'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface TrustTransaction {
  id: string
  date: string
  transactionNo: string
  type: string
  description: string
  debit: number
  credit: number
  balance: number
}

export default function TrustTransactionsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()
  const [transactions, setTransactions] = useState<TrustTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<TrustTransaction>[] = [
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => formatDate(row.getValue('date')) },
    { accessorKey: 'transactionNo', header: 'Txn No', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('transactionNo')}</span> },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <StatusBadge status={row.getValue('type')} /> },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'debit', header: 'Debit', cell: ({ row }) => { const v = row.getValue('debit') as number; return v ? <span className="font-mono text-sm text-red-600">{formatCurrency(v)}</span> : <span className="text-muted-foreground">{'\u2014'}</span> } },
    { accessorKey: 'credit', header: 'Credit', cell: ({ row }) => { const v = row.getValue('credit') as number; return v ? <span className="font-mono text-sm text-green-600">{formatCurrency(v)}</span> : <span className="text-muted-foreground">{'\u2014'}</span> } },
    { accessorKey: 'balance', header: 'Balance', cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatCurrency(row.getValue('balance'))}</span> },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/provident-fund/trust/transactions?limit=200')
      .then(res => res.json())
      .then(json => { if (json.success) setTransactions(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Trust Transactions" description="Complete transaction history of the PF trust fund">
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/trust')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={transactions}
        searchKey="description"
        searchPlaceholder="Search transactions..."
        isLoading={loading}
      />
    </div>
  )
}
