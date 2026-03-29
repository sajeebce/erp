'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, AlertTriangle } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Contract {
  id: string
  contractNo: string
  employeeName?: string
  employee?: { fullName: string }
  contractType: string
  startDate: string
  endDate: string
  basicSalary?: number | string | null
  status: string
}

export default function ContractsPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/hr/contracts?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setContracts(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const activeContracts = contracts.filter(c => c.status === 'ACTIVE')
  const expiringSoon = contracts.filter(c => {
    if (c.status !== 'ACTIVE' || !c.endDate) return false
    const end = new Date(c.endDate)
    return end >= now && end <= thirtyDaysFromNow
  })
  const expiredContracts = contracts.filter(c => c.status === 'EXPIRED')

  const columns: ColumnDef<Contract>[] = [
    { accessorKey: 'contractNo', header: t('contracts.fields.contractNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('contractNo')}</span> },
    { id: 'employeeName', header: t('contracts.fields.employee'), accessorFn: (row) => row.employee?.fullName || row.employeeName || '\u2014', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: 'contractType', header: t('contracts.fields.contractType'), cell: ({ row }) => <StatusBadge status={row.getValue('contractType')} /> },
    { accessorKey: 'startDate', header: t('contracts.fields.startDate'), cell: ({ row }) => formatDate(row.getValue('startDate')) },
    { accessorKey: 'endDate', header: t('contracts.fields.endDate'), cell: ({ row }) => row.getValue('endDate') ? formatDate(row.getValue('endDate') as string) : '\u2014' },
    { accessorKey: 'basicSalary', header: t('contracts.fields.basicSalary'), cell: ({ row }) => row.getValue('basicSalary') != null ? <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('basicSalary')))}</span> : '\u2014' },
    { accessorKey: 'status', header: tc('labels.status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('contracts.title')} description={t('contracts.description')}>
        <Button size="sm" onClick={() => router.push('/hr/contracts/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('contracts.newContract')}
        </Button>
      </PageHeader>

      {expiringSoon.length > 0 && (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {expiringSoon.length} contract(s) expiring within 30 days
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('contracts.activeContracts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeContracts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('contracts.expiringSoon')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{expiringSoon.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('contracts.expired')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{expiredContracts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('contracts.totalContracts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{contracts.length}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={contracts}
        searchKey="employeeName"
        searchPlaceholder={t('contracts.searchContracts')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/hr/contracts/${row.id}`)}
      />
    </div>
  )
}
