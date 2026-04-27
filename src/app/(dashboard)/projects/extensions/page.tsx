'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { useFormatters } from '@/hooks/use-formatters'

interface ExtensionProject {
  id: string
  projectNo: string
  name: string
  status: string
  startDate: string | null
  endDate: string | null
  totalBudget: string | number
  currency: string | null
}

interface ProjectExtensionRequest {
  id: string
  projectId: string
  requestNo: string
  currentEndDate: string
  proposedEndDate: string
  currentBudget: string | number
  reason: string
  impactNotes: string | null
  approvalReference: string | null
  status: string
  requestedAt: string
  approvedAt: string | null
  approvalNotes: string | null
  rejectionReason: string | null
  project: ExtensionProject
}

function getApiError(json: { error?: string | { message?: string } } | null, fallback: string) {
  if (!json?.error) return fallback
  return typeof json.error === 'string' ? json.error : json.error.message || fallback
}

function daysBetween(from: string, to: string): number {
  const start = new Date(from).getTime()
  const end = new Date(to).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.ceil((end - start) / (24 * 60 * 60 * 1000))
}

export default function ProjectExtensionsPage() {
  const router = useRouter()
  const { formatCurrency, formatDate } = useFormatters()
  const [extensions, setExtensions] = useState<ProjectExtensionRequest[]>([])
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    fetchExtensions()
  }, [statusFilter])

  async function fetchExtensions() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      const res = await fetch(`/api/v1/projects/extensions?${params}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setExtensions(json.data)
      } else {
        setError(getApiError(json, 'Failed to load project extension requests'))
      }
    } catch {
      setError('Failed to load project extension requests')
    } finally {
      setLoading(false)
    }
  }

  async function approveExtension(extension: ProjectExtensionRequest) {
    const approvalNotes = window.prompt('Approval notes', 'Approved as no-cost extension. Budget remains unchanged.')
    if (approvalNotes === null) return

    setActionId(extension.id)
    setError('')
    try {
      const res = await fetch(`/api/v1/projects/${extension.projectId}/extensions/${extension.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalNotes }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        fetchExtensions()
      } else {
        setError(getApiError(json, 'Failed to approve extension request'))
      }
    } catch {
      setError('Failed to approve extension request')
    } finally {
      setActionId(null)
    }
  }

  async function rejectExtension(extension: ProjectExtensionRequest) {
    const rejectionReason = window.prompt('Rejection reason')
    if (!rejectionReason?.trim()) return

    setActionId(extension.id)
    setError('')
    try {
      const res = await fetch(`/api/v1/projects/${extension.projectId}/extensions/${extension.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        fetchExtensions()
      } else {
        setError(getApiError(json, 'Failed to reject extension request'))
      }
    } catch {
      setError('Failed to reject extension request')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="No-Cost Project Extensions"
        description="Review and approve project duration extensions without budget increase."
      >
        <Button variant="outline" size="sm" onClick={fetchExtensions} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span>Extension Approval Queue</span>
            <div className="flex flex-wrap gap-2">
              {['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4">Request</th>
                  <th className="text-left py-2 pr-4">Project</th>
                  <th className="text-left py-2 pr-4">Current End</th>
                  <th className="text-left py-2 pr-4">Proposed End</th>
                  <th className="text-right py-2 pr-4">Extension Days</th>
                  <th className="text-right py-2 pr-4">Budget</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Reason</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                      Loading...
                    </td>
                  </tr>
                ) : extensions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No extension requests found.
                    </td>
                  </tr>
                ) : (
                  extensions.map((extension) => (
                    <tr key={extension.id} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-4 font-mono text-xs">{extension.requestNo}</td>
                      <td className="py-2 pr-4">
                        <button
                          className="text-left font-medium hover:underline"
                          onClick={() => router.push(`/projects/${extension.projectId}`)}
                        >
                          {extension.project.projectNo}
                        </button>
                        <p className="text-xs text-muted-foreground">{extension.project.name}</p>
                      </td>
                      <td className="py-2 pr-4">{formatDate(extension.currentEndDate)}</td>
                      <td className="py-2 pr-4">{formatDate(extension.proposedEndDate)}</td>
                      <td className="py-2 pr-4 text-right font-mono">
                        {daysBetween(extension.currentEndDate, extension.proposedEndDate)}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono">
                        {formatCurrency(Number(extension.currentBudget))}
                        <Badge variant="outline" className="ml-2">Locked</Badge>
                      </td>
                      <td className="py-2 pr-4"><StatusBadge status={extension.status} /></td>
                      <td className="py-2 pr-4 max-w-[300px]">
                        <p className="line-clamp-2">{extension.reason}</p>
                        {extension.approvalReference && <p className="text-xs text-muted-foreground mt-1">Ref: {extension.approvalReference}</p>}
                        {extension.rejectionReason && <p className="text-xs text-destructive mt-1">Rejected: {extension.rejectionReason}</p>}
                      </td>
                      <td className="py-2 text-right">
                        {extension.status === 'PENDING_APPROVAL' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectExtension(extension)}
                              disabled={actionId === extension.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => approveExtension(extension)}
                              disabled={actionId === extension.id}
                            >
                              {actionId === extension.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                              Approve
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
