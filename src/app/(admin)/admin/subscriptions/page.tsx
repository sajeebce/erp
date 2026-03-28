'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'

function getAdminToken(): string {
  return document.cookie
    .split('; ')
    .find(c => c.startsWith('superAdminToken='))
    ?.split('=')[1] || ''
}

function adminFetch(url: string) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  }).then(r => {
    if (r.status === 401) {
      window.location.href = '/admin/login'
      throw new Error('Unauthorized')
    }
    return r.json()
  })
}

interface Subscription {
  id: string
  orgName?: string
  organization?: { name: string }
  planName?: string
  plan?: { name: string }
  status: string
  billingCycle: string
  currentPeriodEnd: string
  currentPeriodStart?: string
}

export default function AdminSubscriptionsPage() {
  const t = useTranslations('admin')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<Subscription>[] = [
  {
    id: 'orgName',
    header: t('subscriptions.organization'),
    cell: ({ row }) => {
      const sub = row.original
      return <span className="font-medium">{sub.orgName || sub.organization?.name || '--'}</span>
    },
  },
  {
    id: 'planName',
    header: t('subscriptions.plan'),
    cell: ({ row }) => {
      const sub = row.original
      return sub.planName || sub.plan?.name || '--'
    },
  },
  {
    accessorKey: 'status',
    header: t('subscriptions.status'),
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    accessorKey: 'billingCycle',
    header: t('subscriptions.billingCycle'),
    cell: ({ row }) => {
      const cycle = row.getValue('billingCycle') as string
      return <span className="capitalize">{cycle?.toLowerCase()}</span>
    },
  },
  {
    accessorKey: 'currentPeriodEnd',
    header: t('subscriptions.periodEnds'),
    cell: ({ row }) => {
      const date = row.getValue('currentPeriodEnd') as string
      if (!date) return '--'
      return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    },
  },
]

  useEffect(() => {
    adminFetch('/api/v1/admin/subscriptions?limit=100')
      .then(json => { if (json.success) setSubscriptions(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('subscriptions.title')} description={t('subscriptions.description')} />

      <DataTable
        columns={columns}
        data={subscriptions}
        searchKey="orgName"
        searchPlaceholder={t('subscriptions.searchPlaceholder')}
        isLoading={loading}
      />
    </div>
  )
}
