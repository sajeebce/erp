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

interface Voucher {
  id: string
  voucherNo: string
  type: string
  date: string
  description: string
  amount: string | number
  payee: string | null
  status: string
}

const columns: ColumnDef<Voucher>[] = [
  { accessorKey: 'voucherNo', header: 'Voucher No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('voucherNo')}</span> },
  { accessorKey: 'type', header: 'Type', cell: ({ row }) => <StatusBadge status={row.getValue('type')} /> },
  { accessorKey: 'date', header: 'Date', cell: ({ row }) => new Date(row.getValue('date') as string).toLocaleDateString() },
  { accessorKey: 'description', header: 'Description', cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.getValue('description')}</span> },
  { accessorKey: 'payee', header: 'Payee', cell: ({ row }) => row.getValue('payee') || '\u2014' },
  { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('amount')))}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
]

export default function VouchersPage() {
  const router = useRouter()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/finance/vouchers?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setVouchers(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Vouchers" description="Payment, receipt, cash, bank, and journal vouchers">
        <Button size="sm" onClick={() => router.push('/finance/vouchers/new')}>
          <Plus className="h-4 w-4 mr-2" />New Voucher
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={vouchers}
        searchKey="description"
        searchPlaceholder="Search vouchers..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/finance/vouchers/${row.id}`)}
      />
    </div>
  )
}
