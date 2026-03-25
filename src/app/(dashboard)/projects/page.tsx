'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { formatBDT } from '@/lib/formatters'

interface Project {
  id: string
  projectNo: string
  name: string
  location: string
  totalBudget: string | number
  progress: number
  status: string
}

const columns: ColumnDef<Project>[] = [
  { accessorKey: 'projectNo', header: 'Project No', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue('projectNo')}</span> },
  { accessorKey: 'name', header: 'Project Name', cell: ({ row }) => <span className="max-w-[250px] truncate block font-medium">{row.getValue('name')}</span> },
  { accessorKey: 'location', header: 'Location' },
  { accessorKey: 'totalBudget', header: 'Total Budget', cell: ({ row }) => <span className="font-mono text-sm">{formatBDT(Number(row.getValue('totalBudget')))}</span> },
  { accessorKey: 'progress', header: 'Progress', cell: ({ row }) => {
    const value = Number(row.getValue('progress'))
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
        <span className="text-sm font-mono w-10">{value}%</span>
      </div>
    )
  }},
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.getValue('status')} /> },
]

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/projects?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setProjects(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Project Management" description="Manage all development projects across programs">
        <Button size="sm" onClick={() => router.push('/projects/new')}>
          <Plus className="h-4 w-4 mr-2" />New Project
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={projects}
        searchKey="name"
        searchPlaceholder="Search projects..."
        isLoading={loading}
        onRowClick={(row) => router.push(`/projects/${row.id}`)}
      />
    </div>
  )
}
