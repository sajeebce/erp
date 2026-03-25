'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
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

interface Organization {
  id: string
  name: string
  slug: string
  isActive: boolean
  subscriptionStatus?: string
  _count?: { users: number }
  storageUsedMb?: number
}

const columns: ColumnDef<Organization>[] = [
  {
    accessorKey: 'name',
    header: 'Organization',
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => <span className="text-sm text-muted-foreground font-mono">{row.getValue('slug')}</span>,
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('isActive') ? 'ACTIVE' : 'INACTIVE'} />,
  },
  {
    accessorKey: 'subscriptionStatus',
    header: 'Subscription',
    cell: ({ row }) => {
      const status = row.getValue('subscriptionStatus') as string
      return status ? <StatusBadge status={status} /> : <span className="text-xs text-muted-foreground">--</span>
    },
  },
  {
    id: 'userCount',
    header: 'Users',
    cell: ({ row }) => row.original._count?.users ?? 0,
  },
  {
    accessorKey: 'storageUsedMb',
    header: 'Storage',
    cell: ({ row }) => {
      const mb = row.getValue('storageUsedMb') as number | undefined
      if (!mb) return <span className="text-xs text-muted-foreground">--</span>
      return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
    },
  },
]

export default function AdminOrganizationsPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch('/api/v1/admin/organizations?limit=100')
      .then(json => { if (json.success) setOrganizations(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Organizations" description="Manage all tenant organizations on the platform">
        <Button size="sm" onClick={() => router.push('/admin/organizations/new')}>
          <Plus className="h-4 w-4 mr-2" />Create Organization
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={organizations}
        searchKey="name"
        searchPlaceholder="Search organizations..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/admin/organizations/${row.id}`)}
      />
    </div>
  )
}
