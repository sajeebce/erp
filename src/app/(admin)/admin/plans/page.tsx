'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
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

interface Plan {
  id: string
  name: string
  priceMonthly: number
  priceYearly?: number
  maxUsers: number
  maxProjects: number
  storageGb: number
  _count?: { subscriptions: number }
  subscriptionCount?: number
}

export default function AdminPlansPage() {
  const t = useTranslations('admin')
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<Plan>[] = [
  {
    accessorKey: 'name',
    header: t('plans.name'),
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'priceMonthly',
    header: t('plans.priceMonthly'),
    cell: ({ row }) => <span className="font-mono text-sm">${Number(row.getValue('priceMonthly')).toLocaleString()}</span>,
  },
  {
    accessorKey: 'maxUsers',
    header: t('plans.maxUsers'),
    cell: ({ row }) => {
      const val = row.getValue('maxUsers') as number
      return val === -1 || val === 0 ? 'Unlimited' : String(val)
    },
  },
  {
    accessorKey: 'maxProjects',
    header: t('plans.maxProjects'),
    cell: ({ row }) => {
      const val = row.getValue('maxProjects') as number
      return val === -1 || val === 0 ? 'Unlimited' : String(val)
    },
  },
  {
    accessorKey: 'storageGb',
    header: t('plans.storage'),
    cell: ({ row }) => {
      const gb = row.getValue('storageGb') as number
      return gb === -1 ? 'Unlimited' : `${gb} GB`
    },
  },
  {
    id: 'subscriptionCount',
    header: t('plans.subscriptions'),
    cell: ({ row }) => {
      const plan = row.original
      return plan._count?.subscriptions ?? plan.subscriptionCount ?? 0
    },
  },
]

  useEffect(() => {
    adminFetch('/api/v1/admin/plans')
      .then(json => { if (json.success) setPlans(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('plans.title')} description={t('plans.description')} />

      <DataTable
        columns={columns}
        data={plans}
        searchKey="name"
        searchPlaceholder={t('plans.searchPlaceholder')}
        isLoading={loading}
      />
    </div>
  )
}
