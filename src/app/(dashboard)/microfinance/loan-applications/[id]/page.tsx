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

interface LoanApplication {
  id: string
  applicationNo: string
  date: string
  memberId: string
  productId: string
  amountRequested: number | string
  purpose: string
  durationMonths: number
  status: string
  approvedAmount?: number | string | null
  approvedAt?: string | null
  notes?: string | null
  createdAt: string
  product?: { id: string; productCode: string; name: string }
  member?: { fullName?: string; memberNo?: string; beneficiary?: { name: string } }
}

export default function LoanApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('microfinance')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [application, setApplication] = useState<LoanApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!params.id) return

    // Fetch from list endpoint and find by id
    fetch('/api/v1/microfinance/loan-applications?limit=500')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const found = json.data.find((a: LoanApplication) => a.id === params.id)
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
      const res = await fetch(`/api/v1/microfinance/loan-applications/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVED',
          approvedAmount: application?.amountRequested,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setApplication((prev) => prev ? { ...prev, status: 'APPROVED', approvedAmount: prev.amountRequested, approvedAt: new Date().toISOString() } : prev)
      } else {
        setError(json.error || t('loanForm.failedToApprove'))
      }
    } catch {
      setError(t('loanForm.failedToApprove'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/microfinance/loan-applications/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECTED' }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setApplication((prev) => prev ? { ...prev, status: 'REJECTED' } : prev)
      } else {
        setError(json.error || t('loanForm.failedToReject'))
      }
    } catch {
      setError(t('loanForm.failedToReject'))
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
        <PageHeader title={t('loanForm.applicationDetails')} description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/microfinance/loan-applications')}>
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

  const memberName = application.member?.fullName || application.member?.beneficiary?.name || application.member?.memberNo || '\u2014'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('loanApplications.applicationNo')}: ${application.applicationNo}`}
        description={memberName}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/microfinance/loan-applications')}>
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
          <CardHeader><CardTitle>{t('loanForm.applicationInfo')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">{t('loanApplications.applicationNo')}:</span> <span className="font-mono font-medium">{application.applicationNo}</span></div>
            <div><span className="text-muted-foreground">{tc('labels.date')}:</span> {formatDate(application.date)}</div>
            <div><span className="text-muted-foreground">{tc('labels.status')}:</span> <StatusBadge status={application.status} /></div>
            <div><span className="text-muted-foreground">{tc('labels.createdAt')}:</span> {formatDate(application.createdAt)}</div>
            {application.approvedAt && <div><span className="text-muted-foreground">{t('loanForm.approvedAt')}:</span> {formatDate(application.approvedAt)}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('loanForm.loanDetails')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">{t('loanApplications.member')}:</span> <span className="font-medium">{memberName}</span></div>
            <div><span className="text-muted-foreground">{t('loanApplications.product')}:</span> {application.product?.name || '\u2014'} {application.product?.productCode && <span className="text-muted-foreground font-mono text-xs">({application.product.productCode})</span>}</div>
            <div><span className="text-muted-foreground">{t('loanApplications.amountRequested')}:</span> <span className="font-mono font-medium">{formatCurrency(Number(application.amountRequested))}</span></div>
            {application.approvedAmount != null && (
              <div><span className="text-muted-foreground">{t('loanForm.approvedAmount')}:</span> <span className="font-mono font-medium">{formatCurrency(Number(application.approvedAmount))}</span></div>
            )}
            <div><span className="text-muted-foreground">{t('loanForm.durationMonths')}:</span> <span className="font-mono">{application.durationMonths}</span> {t('loanProducts.months')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('loanApplications.purpose')}</CardTitle></CardHeader>
        <CardContent><p className="text-sm whitespace-pre-wrap">{application.purpose}</p></CardContent>
      </Card>

      {application.notes && (
        <Card>
          <CardHeader><CardTitle>{t('loanForm.notes')}</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{application.notes}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
