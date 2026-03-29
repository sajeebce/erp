'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface DisciplinaryCase {
  id: string
  caseNo: string
  employeeId: string
  employee?: { id: string; employeeNo: string; fullName: string; department?: { name: string } }
  action: string
  reason: string
  description?: string | null
  incidentDate: string
  actionDate?: string | null
  expiryDate?: string | null
  suspensionStart?: string | null
  suspensionEnd?: string | null
  withPay?: boolean
  status: string
  appealFiled?: boolean
  appealReason?: string | null
  appealOutcome?: string | null
  timeline?: { date: string; event: string; description?: string }[]
  createdAt: string
}

export default function DisciplinaryCaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [caseData, setCaseData] = useState<DisciplinaryCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [showAppealForm, setShowAppealForm] = useState(false)
  const [appealReason, setAppealReason] = useState('')

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/v1/hr/disciplinary/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setCaseData(json.data)
        } else {
          setError(tc('errors.notFound'))
        }
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  async function handleFileAppeal() {
    if (!appealReason.trim()) {
      setError(t('form.requiredFields'))
      return
    }
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/disciplinary/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appealFiled: true, appealReason: appealReason.trim() }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setCaseData(json.data)
        setShowAppealForm(false)
        setAppealReason('')
      } else {
        setError(json.error || tc('errors.somethingWentWrong'))
      }
    } catch {
      setError(tc('errors.somethingWentWrong'))
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

  if (!caseData) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('disciplinary.title')} description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/disciplinary')}>
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
        title={`${t('disciplinary.fields.caseNo')}: ${caseData.caseNo}`}
        description={caseData.employee?.fullName || ''}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/disciplinary')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
          {!caseData.appealFiled && caseData.status === 'ACTIVE' && (
            <Button size="sm" variant="outline" onClick={() => setShowAppealForm(true)} disabled={actionLoading}>
              <Scale className="h-4 w-4 mr-2" />
              {t('disciplinary.appeal.fileAppeal')}
            </Button>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {showAppealForm && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader><CardTitle>{t('disciplinary.appeal.fileAppeal')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appeal-reason">Appeal Reason *</Label>
              <Textarea id="appeal-reason" value={appealReason} onChange={(e) => setAppealReason(e.target.value)} rows={4} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowAppealForm(false); setAppealReason('') }}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleFileAppeal} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {tc('buttons.submit')}
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('disciplinary.form.caseDetails')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">{t('disciplinary.fields.caseNo')}:</span> <span className="font-mono font-medium">{caseData.caseNo}</span></div>
            <div><span className="text-muted-foreground">{tc('labels.status')}:</span> <StatusBadge status={caseData.status} /></div>
            <div><span className="text-muted-foreground">{t('disciplinary.fields.action')}:</span> <StatusBadge status={caseData.action} /></div>
            <div><span className="text-muted-foreground">{t('disciplinary.fields.incidentDate')}:</span> {formatDate(caseData.incidentDate)}</div>
            {caseData.actionDate && <div><span className="text-muted-foreground">{t('disciplinary.fields.actionDate')}:</span> {formatDate(caseData.actionDate)}</div>}
            {caseData.expiryDate && <div><span className="text-muted-foreground">{t('disciplinary.fields.expiryDate')}:</span> {formatDate(caseData.expiryDate)}</div>}
            {caseData.appealFiled && <div><Badge variant="destructive">{t('disciplinary.appeal.title')}</Badge></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('disciplinary.fields.employee')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">{t('fields.fullName')}:</span> <span className="font-medium">{caseData.employee?.fullName || '\u2014'}</span></div>
            {caseData.employee?.employeeNo && <div><span className="text-muted-foreground">{t('fields.employeeNo')}:</span> <span className="font-mono text-xs">{caseData.employee.employeeNo}</span></div>}
            {caseData.employee?.department?.name && <div><span className="text-muted-foreground">{t('fields.department')}:</span> {caseData.employee.department.name}</div>}
            {caseData.action === 'SUSPENSION' && (
              <>
                {caseData.suspensionStart && <div><span className="text-muted-foreground">Suspension Start:</span> {formatDate(caseData.suspensionStart)}</div>}
                {caseData.suspensionEnd && <div><span className="text-muted-foreground">Suspension End:</span> {formatDate(caseData.suspensionEnd)}</div>}
                <div><span className="text-muted-foreground">With Pay:</span> {caseData.withPay ? tc('labels.yes') : tc('labels.no')}</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('disciplinary.fields.reason')}</CardTitle></CardHeader>
        <CardContent><p className="text-sm">{caseData.reason}</p></CardContent>
      </Card>

      {caseData.description && (
        <Card>
          <CardHeader><CardTitle>{tc('labels.description')}</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{caseData.description}</p></CardContent>
        </Card>
      )}

      {caseData.timeline && caseData.timeline.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {caseData.timeline.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    {index < caseData.timeline!.length - 1 && <div className="w-0.5 flex-1 bg-muted mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium">{event.event}</p>
                    {event.description && <p className="text-xs text-muted-foreground mt-1">{event.description}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {caseData.appealFiled && (
        <Card>
          <CardHeader><CardTitle>{t('disciplinary.appeal.title')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {caseData.appealReason && <div><p className="whitespace-pre-wrap">{caseData.appealReason}</p></div>}
            {caseData.appealOutcome && <div><span className="text-muted-foreground">{t('disciplinary.appeal.outcome')}:</span> <StatusBadge status={caseData.appealOutcome} /></div>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
