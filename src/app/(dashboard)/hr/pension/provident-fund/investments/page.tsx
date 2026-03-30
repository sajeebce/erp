'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface PFInvestment {
  id: string
  type: string
  institution: string
  amount: number
  interestRate: number
  maturityDate: string
  status: string
}

export default function PFInvestmentsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()
  const [investments, setInvestments] = useState<PFInvestment[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<PFInvestment>[] = [
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <StatusBadge status={row.getValue('type')} /> },
    { accessorKey: 'institution', header: 'Institution', cell: ({ row }) => <span className="font-medium">{row.getValue('institution')}</span> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="font-mono text-sm font-medium">{formatCurrency(row.getValue('amount'))}</span> },
    { accessorKey: 'interestRate', header: 'Rate', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('interestRate')}%</span> },
    { accessorKey: 'maturityDate', header: 'Maturity', cell: ({ row }) => formatDate(row.getValue('maturityDate')) },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/hr/provident-fund/investments?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setInvestments(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="PF Investments" description="Investment portfolio of the provident fund">
        <Button size="sm" onClick={() => router.push('/hr/pension/provident-fund/investments/new')}>
          <Plus className="h-4 w-4 mr-2" />New Investment
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Invested</p>
            <p className="text-2xl font-bold font-mono">{formatCurrency(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Investments</p>
            <p className="text-2xl font-bold">{investments.filter(i => i.status === 'ACTIVE').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Matured</p>
            <p className="text-2xl font-bold">{investments.filter(i => i.status === 'MATURED').length}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={investments}
        searchKey="institution"
        searchPlaceholder="Search investments..."
        isLoading={loading}
      />
    </div>
  )
}
