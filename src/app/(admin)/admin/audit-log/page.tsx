'use client'

import { useEffect, useState } from 'react'
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

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId?: string
  superAdminName?: string
  superAdmin?: { name: string }
  ipAddress: string
  metadata?: Record<string, unknown>
  createdAt: string
}

const columns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) => {
      const action = row.getValue('action') as string
      return <span className="font-medium text-sm">{action.replace(/_/g, ' ')}</span>
    },
  },
  {
    accessorKey: 'entityType',
    header: 'Entity Type',
    cell: ({ row }) => {
      const type = row.getValue('entityType') as string
      return <span className="text-sm capitalize">{type?.toLowerCase().replace(/_/g, ' ')}</span>
    },
  },
  {
    id: 'superAdminName',
    header: 'Admin',
    cell: ({ row }) => {
      const entry = row.original
      return <span className="text-sm">{entry.superAdminName || entry.superAdmin?.name || '--'}</span>
    },
  },
  {
    accessorKey: 'ipAddress',
    header: 'IP Address',
    cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.getValue('ipAddress')}</span>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Timestamp',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string
      return (
        <span className="text-sm text-muted-foreground">
          {new Date(date).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )
    },
  },
]

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminFetch('/api/v1/admin/audit-log?limit=100')
      .then(json => { if (json.success) setLogs(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" description="Track all super admin actions and platform changes" />

      <DataTable
        columns={columns}
        data={logs}
        searchKey="action"
        searchPlaceholder="Search by action..."
        isLoading={loading}
      />
    </div>
  )
}
