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
import { HelpButton } from '@/components/shared/help-modal'
import { useFormatters } from '@/hooks/use-formatters'

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

export default function VouchersPage() {
  const router = useRouter()
  const t = useTranslations('finance.vouchers')
  const th = useTranslations('finance.help.vouchers')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<Voucher>[] = [
    { accessorKey: 'voucherNo', header: t('voucherNo'), cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('voucherNo')}</span> },
    { accessorKey: 'type', header: t('type'), cell: ({ row }) => <StatusBadge status={row.getValue('type')} /> },
    { accessorKey: 'date', header: t('date'), cell: ({ row }) => new Date(row.getValue('date') as string).toLocaleDateString() },
    { accessorKey: 'description', header: t('description'), cell: ({ row }) => <span className="max-w-[250px] truncate block">{row.getValue('description')}</span> },
    { accessorKey: 'payee', header: t('payee'), cell: ({ row }) => row.getValue('payee') || '\u2014' },
    { accessorKey: 'amount', header: t('amount'), cell: ({ row }) => <span className="font-mono text-sm">{formatCurrency(Number(row.getValue('amount')))}</span> },
    { accessorKey: 'status', header: t('status'), cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
  ]

  useEffect(() => {
    fetch('/api/v1/finance/vouchers?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setVouchers(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <HelpButton
          title={th('title')}
          description={th('description')}
          steps={[
            { title: th('step1Title'), description: th('step1Desc') },
            { title: th('step2Title'), description: th('step2Desc') },
            { title: th('step3Title'), description: th('step3Desc') },
            { title: th('step4Title'), description: th('step4Desc') },
            { title: th('step5Title'), description: th('step5Desc') },
          ]}
          tips={[th('tip1'), th('tip2'), th('tip3')]}
        />
        <Button size="sm" onClick={() => router.push('/finance/vouchers/new')}>
          <Plus className="h-4 w-4 mr-2" />{t('newVoucher')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={vouchers}
        searchKey="description"
        searchPlaceholder={t('searchVouchers')}
        isLoading={loading}
        onRowClick={(row) => router.push(`/finance/vouchers/${row.id}`)}
      />
    </div>
  )
}
