'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, UserCheck, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

const STATUS_STEPS = ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as const

interface Grievance {
  id: string
  grievanceNo: string
  isAnonymous?: boolean
  category: string
  severity: string
  subject: string
  description: string
  status: string
  investigator?: string | null
  investigationNotes?: string | null
  resolution?: string | null
  resolvedAt?: string | null
  createdAt: string
}

function getSeverityVariant(severity: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (severity) {
    case 'CRITICAL': return 'destructive'
    case 'HIGH': return 'destructive'
    case 'MEDIUM': return 'secondary'
    case 'LOW': return 'outline'
    default: return 'secondary'
  }
}

export default function GrievanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [grievance, setGrievance] = useState<Grievance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [showAssignForm, setShowAssignForm] = useState(false)
  const [investigator, setInvestigator] = useState('')
  const [showResolveForm, setShowResolveForm] = useState(false)
  const [resolutionText, setResolutionText] = useState('')

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/v1/hr/grievances/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setGrievance(json.data)
        } else {
          setError(tc('errors.notFound'))
        }
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  async function handleAssignInvestigator() {
    if (!investigator.trim()) return
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/grievances/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investigator: investigator.trim(), status: 'INVESTIGATING' }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setGrievance(json.data)
        setShowAssignForm(false)
        setInvestigator('')
      } else {
        setError(json.error || tc('errors.somethingWentWrong'))
      }
    } catch {
      setError(tc('errors.somethingWentWrong'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleResolve() {
    if (!resolutionText.trim()) return
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/grievances/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: resolutionText.trim(), status: 'RESOLVED' }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setGrievance(json.data)
        setShowResolveForm(false)
        setResolutionText('')
      } else {
        setError(json.error || tc('errors.somethingWentWrong'))
      }
    } catch {
      setError(tc('errors.somethingWentWrong'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/grievances/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setGrievance(json.data)
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

  if (!grievance) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('grievances.title')} description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/grievances')}>
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

  const currentStepIndex = STATUS_STEPS.indexOf(grievance.status as typeof STATUS_STEPS[number])

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('grievances.fields.grievanceNo')}: ${grievance.grievanceNo}`}
        description={grievance.subject}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/grievances')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
          {grievance.status !== 'CLOSED' && grievance.status !== 'RESOLVED' && (
            <>
              {!grievance.investigator && (
                <Button size="sm" variant="outline" onClick={() => setShowAssignForm(true)} disabled={actionLoading}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  {t('grievances.investigation.assignInvestigator')}
                </Button>
              )}
              <Button size="sm" onClick={() => setShowResolveForm(true)} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('grievances.investigation.resolve')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('ESCALATED')} disabled={actionLoading}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                {t('grievances.investigation.escalate')}
              </Button>
            </>
          )}
          {grievance.status === 'RESOLVED' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('CLOSED')} disabled={actionLoading}>
              <XCircle className="h-4 w-4 mr-2" />
              {t('grievances.investigation.close')}
            </Button>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Status Timeline */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, index) => {
              const isActive = index <= currentStepIndex
              const isCurrent = step === grievance.status
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCurrent ? 'bg-primary text-primary-foreground' :
                      isActive ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`text-xs mt-1 text-center ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>
                      {tc(`status.${step}`)}
                    </span>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isActive ? 'bg-primary/40' : 'bg-muted'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Assign Investigator Form */}
      {showAssignForm && (
        <Card>
          <CardHeader><CardTitle>{t('grievances.investigation.assignInvestigator')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="investigator-name">Investigator Name</Label>
              <Input id="investigator-name" value={investigator} onChange={(e) => setInvestigator(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowAssignForm(false); setInvestigator('') }}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleAssignInvestigator} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {tc('buttons.confirm')}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Resolve Form */}
      {showResolveForm && (
        <Card>
          <CardHeader><CardTitle>{t('grievances.investigation.resolve')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolution-text">{t('grievances.investigation.resolution')} *</Label>
              <Textarea id="resolution-text" value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} rows={4} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowResolveForm(false); setResolutionText('') }}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleResolve} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {t('grievances.investigation.resolve')}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Grievance Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('grievances.form.grievanceDetails')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">{t('grievances.fields.grievanceNo')}:</span> <span className="font-mono font-medium">{grievance.grievanceNo}</span></div>
            <div><span className="text-muted-foreground">{tc('labels.status')}:</span> <StatusBadge status={grievance.status} /></div>
            <div><span className="text-muted-foreground">{t('grievances.fields.category')}:</span> <StatusBadge status={grievance.category} /></div>
            <div><span className="text-muted-foreground">{t('grievances.fields.severity')}:</span> <Badge variant={getSeverityVariant(grievance.severity)}>{t(`grievances.severities.${grievance.severity}`)}</Badge></div>
            <div><span className="text-muted-foreground">{t('grievances.fields.createdAt')}:</span> {formatDate(grievance.createdAt)}</div>
            {grievance.isAnonymous && <div><Badge variant="secondary">{t('grievances.fields.isAnonymous')}</Badge></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('grievances.investigation.title')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Investigator:</span> {grievance.investigator || '\u2014'}</div>
            {grievance.investigationNotes && <div><span className="text-muted-foreground">{t('grievances.investigation.notes')}:</span> <p className="mt-1 whitespace-pre-wrap">{grievance.investigationNotes}</p></div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{tc('labels.description')}</CardTitle></CardHeader>
        <CardContent><p className="text-sm whitespace-pre-wrap">{grievance.description}</p></CardContent>
      </Card>

      {grievance.resolution && (
        <Card>
          <CardHeader><CardTitle>{t('grievances.investigation.resolution')}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="whitespace-pre-wrap">{grievance.resolution}</p>
            {grievance.resolvedAt && <p className="text-xs text-muted-foreground">Resolved: {formatDate(grievance.resolvedAt)}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
