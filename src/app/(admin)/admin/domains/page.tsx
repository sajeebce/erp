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

interface Domain {
  id: string
  orgName?: string
  organization?: { name: string }
  slug: string
  customDomain: string | null
  domainVerified: boolean
}

export default function AdminDomainsPage() {
  const t = useTranslations('admin')
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)

  const columns: ColumnDef<Domain>[] = [
  {
    id: 'orgName',
    header: t('domains.organization'),
    cell: ({ row }) => {
      const d = row.original
      return <span className="font-medium">{d.orgName || d.organization?.name || '--'}</span>
    },
  },
  {
    accessorKey: 'slug',
    header: t('domains.slug'),
    cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{row.getValue('slug')}</span>,
  },
  {
    accessorKey: 'customDomain',
    header: t('domains.customDomain'),
    cell: ({ row }) => {
      const domain = row.getValue('customDomain') as string | null
      return domain
        ? <span className="font-mono text-sm">{domain}</span>
        : <span className="text-xs text-muted-foreground">--</span>
    },
  },
  {
    accessorKey: 'domainVerified',
    header: t('domains.verified'),
    cell: ({ row }) => {
      const verified = row.getValue('domainVerified') as boolean
      return <StatusBadge status={verified ? 'ACTIVE' : 'PENDING'} />
    },
  },
]

  useEffect(() => {
    adminFetch('/api/v1/admin/domains?limit=100')
      .then(json => { if (json.success) setDomains(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title={t('domains.title')} description={t('domains.description')} />

      <DataTable
        columns={columns}
        data={domains}
        searchKey="slug"
        searchPlaceholder={t('domains.searchPlaceholder')}
        isLoading={loading}
      />
    </div>
  )
}
