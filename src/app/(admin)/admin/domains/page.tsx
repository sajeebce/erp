'use client'

import { useEffect, useState } from 'react'
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

const columns: ColumnDef<Domain>[] = [
  {
    id: 'orgName',
    header: 'Organization',
    cell: ({ row }) => {
      const d = row.original
      return <span className="font-medium">{d.orgName || d.organization?.name || '--'}</span>
    },
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{row.getValue('slug')}</span>,
  },
  {
    accessorKey: 'customDomain',
    header: 'Custom Domain',
    cell: ({ row }) => {
      const domain = row.getValue('customDomain') as string | null
      return domain
        ? <span className="font-mono text-sm">{domain}</span>
        : <span className="text-xs text-muted-foreground">--</span>
    },
  },
  {
    accessorKey: 'domainVerified',
    header: 'Verified',
    cell: ({ row }) => {
      const verified = row.getValue('domainVerified') as boolean
      return <StatusBadge status={verified ? 'ACTIVE' : 'PENDING'} />
    },
  },
]

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch('/api/v1/admin/domains?limit=100')
      .then(json => { if (json.success) setDomains(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Domains" description="Manage organization slugs and custom domain mappings" />

      <DataTable
        columns={columns}
        data={domains}
        searchKey="slug"
        searchPlaceholder="Search by slug..."
        isLoading={loading}
      />
    </div>
  )
}
