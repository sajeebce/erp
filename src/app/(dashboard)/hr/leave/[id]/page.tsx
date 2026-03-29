'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface LeaveApplication {
  id: string
  applicationNo: string
  employeeId: string
  employee?: { id: string; employeeNo: string; fullName: string }
  leaveTypeId: string
  leaveType?: { id: string; name: string; code: string }
  startDate: string
  endDate: string
  days: number
  reason?: string | null
  status: string
  notes?: string | null
  createdAt: string
}

export default function LeaveDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [application, setApplication] = useState<LeaveApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/v1/hr/leave?limit=500`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const found = json.data.find((a: LeaveApplication) => a.id === params.id)
          if (found) {
            setApplication(found)
          } else {
            setError(tc('errors.notFound'))
          }
        } else {
          setError(tc('errors.loadFailed'))
        }
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  async function handleApprove() {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/leave/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVED' }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setApplication((prev) => prev ? { ...prev, status: 'APPROVED' } : prev)
      } else {
        setError(json.error || t('leaveForm.failedToApprove'))
      }
    } catch {
      setError(t('leaveForm.failedToApprove'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/leave/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECTED' }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setApplication((prev) => prev ? { ...prev, status: 'REJECTED' } : prev)
      } else {
        setError(json.error || t('leaveForm.failedToReject'))
      }
    } catch {
      setError(t('leaveForm.failedToReject'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('leaveForm.leaveDetails')} description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/leave')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error || tc('errors.notFound')}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('leave.applicationNo')}: ${application.applicationNo}`}
        description={application.employee?.fullName || ''}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/leave')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
          {application.status === 'PENDING' && (
            <>
              <Button size="sm" onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                {tc('buttons.approve')}
              </Button>
              <Button size="sm" variant="destructive" onClick={handleReject} disabled={actionLoading}>
                <XCircle className="h-4 w-4 mr-2" />
                {tc('buttons.reject')}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('leaveForm.applicationInfo')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">{t('leave.applicationNo')}:</span> <span className="font-mono font-medium">{application.applicationNo}</span></div>
            <div><span className="text-muted-foreground">{tc('labels.status')}:</span> <StatusBadge status={application.status} /></div>
            <div><span className="text-muted-foreground">{tc('labels.createdAt')}:</span> {formatDate(application.createdAt)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('leaveForm.leaveDetails')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">{t('leave.employee')}:</span> <span className="font-medium">{application.employee?.fullName || '\u2014'}</span></div>
            <div><span className="text-muted-foreground">{t('leave.leaveType')}:</span> <StatusBadge status={application.leaveType?.name || application.leaveTypeId} /></div>
            <div><span className="text-muted-foreground">{t('leave.startDate')}:</span> {formatDate(application.startDate)}</div>
            <div><span className="text-muted-foreground">{t('leave.endDate')}:</span> {formatDate(application.endDate)}</div>
            <div><span className="text-muted-foreground">{t('leave.days')}:</span> <span className="font-mono font-medium">{application.days}</span></div>
          </CardContent>
        </Card>
      </div>

      {application.reason && (
        <Card>
          <CardHeader><CardTitle>{t('leave.reason')}</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{application.reason}</p></CardContent>
        </Card>
      )}

      {application.notes && (
        <Card>
          <CardHeader><CardTitle>{t('leaveForm.notes')}</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{application.notes}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
