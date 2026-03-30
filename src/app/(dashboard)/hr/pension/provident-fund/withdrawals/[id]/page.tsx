'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, CheckCircle, XCircle, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface PFWithdrawal {
  id: string
  withdrawalNo: string
  employee?: { fullName: string; employeeNo: string }
  amount: number
  reason: string
  description?: string
  status: string
  approvedAt?: string
  paidAt?: string
  createdAt: string
}

export default function PFWithdrawalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [data, setData] = useState<PFWithdrawal | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/v1/hr/provident-fund/withdrawals/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data)
        else setError(tc('errors.notFound'))
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  async function handleAction(action: string) {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/provident-fund/withdrawals/${params.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setData(json.data)
      } else {
        setError(json.error || `Failed to ${action} withdrawal`)
      }
    } catch {
      setError(`Failed to ${action} withdrawal`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Withdrawal Detail" description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/withdrawals')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card><CardContent className="py-10 text-center text-muted-foreground">{error || tc('errors.notFound')}</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Withdrawal: ${data.withdrawalNo}`} description={data.employee?.fullName || ''}>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/withdrawals')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
          {data.status === 'PENDING' && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('approve')} disabled={actionLoading}>
                <CheckCircle className="h-4 w-4 mr-2" />Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleAction('reject')} disabled={actionLoading}>
                <XCircle className="h-4 w-4 mr-2" />Reject
              </Button>
            </>
          )}
          {data.status === 'APPROVED' && (
            <Button size="sm" onClick={() => handleAction('pay')} disabled={actionLoading}>
              <Banknote className="h-4 w-4 mr-2" />Mark as Paid
            </Button>
          )}
        </div>
      </PageHeader>

      {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Withdrawal Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Withdrawal No:</span> <span className="font-mono font-medium">{data.withdrawalNo}</span></div>
            <div><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{data.employee?.fullName || '\u2014'}</span></div>
            <div><span className="text-muted-foreground">Employee No:</span> <span className="font-mono">{data.employee?.employeeNo || '\u2014'}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={data.status} /></div>
            <div><span className="text-muted-foreground">Created:</span> {formatDate(data.createdAt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Amount & Reason</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Amount:</span> <span className="font-mono text-lg font-bold">{formatCurrency(data.amount)}</span></div>
            <div><span className="text-muted-foreground">Reason:</span> <StatusBadge status={data.reason} /></div>
            {data.description && <div><span className="text-muted-foreground">Description:</span><p className="mt-1 whitespace-pre-wrap">{data.description}</p></div>}
            {data.approvedAt && <div><span className="text-muted-foreground">Approved:</span> {formatDate(data.approvedAt)}</div>}
            {data.paidAt && <div><span className="text-muted-foreground">Paid:</span> {formatDate(data.paidAt)}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
