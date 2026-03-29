'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Budget {
  id: string
  budgetCode: string
  name: string
  budgetType: string
  project?: { name: string }
  projectName?: string
  totalAmount: string | number
  currencyCode: string
  status: string
  version: number
  utilizationPercent: string | number
}

const BUDGET_TYPE_COLORS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PROJECT: 'default',
  CORE: 'secondary',
  PROGRAM: 'outline',
  OPERATIONAL: 'secondary',
  PROPOSAL: 'outline',
}

export default function BudgetPage() {
  const router = useRouter()
  const t = useTranslations('budget')
  const tc = useTranslations('common')
  const { formatCurrency, formatPercent } = useFormatters()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<Budget>[] = [
    {
      accessorKey: 'budgetCode',
      header: t('budgetCode'),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.getValue('budgetCode') || '\u2014'}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: t('name'),
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'budgetType',
      header: t('budgetType.label'),
      cell: ({ row }) => {
        const type = row.getValue('budgetType') as string
        return (
          <Badge variant={BUDGET_TYPE_COLORS[type] || 'outline'}>
            {t(`budgetType.${type}`)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'projectName',
      header: t('project'),
      cell: ({ row }) => {
        const budget = row.original
        return budget.project?.name || budget.projectName || '\u2014'
      },
    },
    {
      accessorKey: 'totalAmount',
      header: t('totalAmount'),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('totalAmount')))}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'utilizationPercent',
      header: t('utilization'),
      cell: ({ row }) => {
        const value = Number(row.getValue('utilizationPercent'))
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${value > 100 ? 'bg-destructive' : value > 80 ? 'bg-yellow-500' : 'bg-primary'}`}
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
            <span className="text-sm font-mono">{formatPercent(value)}</span>
          </div>
        )
      },
    },
  ]

  useEffect(() => {
    fetch('/api/v1/budget?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setBudgets(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button size="sm" onClick={() => router.push('/budget/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('createBudget')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={budgets}
        searchKey="name"
        searchPlaceholder={t('searchBudgets')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/budget/${row.id}`)}
      />
    </div>
  )
}
