'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

const CONTRACT_TYPES = ['FULL_TIME', 'CONTRACT', 'CONSULTANT', 'INTERN', 'VOLUNTEER'] as const

interface Contract {
  id: string
  contractNo: string
  employeeId: string
  employee?: { id: string; employeeNo: string; fullName: string }
  contractType: string
  title?: string | null
  startDate: string
  endDate?: string | null
  probationEndDate?: string | null
  basicSalary?: number | string | null
  currency?: string | null
  projectId?: string | null
  project?: { id: string; name: string } | null
  isRenewable?: boolean
  noticePeriodDays?: number | null
  status: string
  renewedFromId?: string | null
  amendments?: { id: string; date: string; description: string }[]
  createdAt: string
}

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [terminateReason, setTerminateReason] = useState('')
  const [showTerminateDialog, setShowTerminateDialog] = useState(false)

  // Editable fields
  const [contractType, setContractType] = useState('')
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [basicSalary, setBasicSalary] = useState('')
  const [noticePeriodDays, setNoticePeriodDays] = useState('')
  const [isRenewable, setIsRenewable] = useState(false)

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/v1/hr/contracts/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setContract(json.data)
          populateForm(json.data)
        } else {
          setError(tc('errors.notFound'))
        }
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  function populateForm(c: Contract) {
    setContractType(c.contractType)
    setTitle(c.title || '')
    setStartDate(c.startDate?.split('T')[0] || '')
    setEndDate(c.endDate?.split('T')[0] || '')
    setBasicSalary(c.basicSalary != null ? String(c.basicSalary) : '')
    setNoticePeriodDays(c.noticePeriodDays != null ? String(c.noticePeriodDays) : '')
    setIsRenewable(c.isRenewable || false)
  }

  function handleCancel() {
    if (contract) populateForm(contract)
    setEditing(false)
    setError('')
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      contractType,
      title: title.trim() || null,
      startDate,
      endDate: endDate || null,
      basicSalary: basicSalary ? parseFloat(basicSalary) : null,
      noticePeriodDays: noticePeriodDays ? parseInt(noticePeriodDays) : null,
      isRenewable,
    }

    try {
      const res = await fetch(`/api/v1/hr/contracts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setContract(json.data)
        populateForm(json.data)
        setEditing(false)
      } else {
        setError(json.error || t('form.failedToSave'))
      }
    } catch {
      setError(t('form.failedToSave'))
    } finally {
      setSaving(false)
    }
  }

  async function handleRenew() {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/contracts/${params.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/contracts/${json.data.id}`)
      } else {
        setError(json.error || tc('errors.somethingWentWrong'))
      }
    } catch {
      setError(tc('errors.somethingWentWrong'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleTerminate() {
    if (!terminateReason.trim()) {
      setError(t('form.requiredFields'))
      return
    }
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/contracts/${params.id}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: terminateReason.trim() }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setContract(json.data)
        populateForm(json.data)
        setShowTerminateDialog(false)
        setTerminateReason('')
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

  if (!contract) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('contracts.title')} description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/contracts')}>
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
        title={editing ? tc('buttons.edit') : `${t('contracts.fields.contractNo')}: ${contract.contractNo}`}
        description={editing ? '' : contract.employee?.fullName || ''}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/contracts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
          {!editing && contract.status === 'ACTIVE' && (
            <>
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                {tc('buttons.edit')}
              </Button>
              {contract.isRenewable && (
                <Button size="sm" variant="outline" onClick={handleRenew} disabled={actionLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('contracts.renew')}
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => setShowTerminateDialog(true)} disabled={actionLoading}>
                <XCircle className="h-4 w-4 mr-2" />
                {t('contracts.terminate')}
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

      {/* Terminate Dialog */}
      {showTerminateDialog && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t('contracts.terminate')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="terminate-reason">{t('contracts.terminationReason')} *</Label>
              <Textarea
                id="terminate-reason"
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowTerminateDialog(false); setTerminateReason('') }}>
              {tc('buttons.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleTerminate} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {tc('buttons.confirm')}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* View Mode */}
      {!editing && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>{t('contracts.form.contractDetails')}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">{t('contracts.fields.contractNo')}:</span> <span className="font-mono font-medium">{contract.contractNo}</span></div>
                <div><span className="text-muted-foreground">{tc('labels.status')}:</span> <StatusBadge status={contract.status} /></div>
                <div><span className="text-muted-foreground">{t('contracts.fields.contractType')}:</span> <StatusBadge status={contract.contractType} /></div>
                {contract.title && <div><span className="text-muted-foreground">{t('contracts.fields.title')}:</span> {contract.title}</div>}
                <div><span className="text-muted-foreground">{t('contracts.fields.startDate')}:</span> {formatDate(contract.startDate)}</div>
                {contract.endDate && <div><span className="text-muted-foreground">{t('contracts.fields.endDate')}:</span> {formatDate(contract.endDate)}</div>}
                {contract.probationEndDate && <div><span className="text-muted-foreground">{t('contracts.fields.probationEnd')}:</span> {formatDate(contract.probationEndDate)}</div>}
                {contract.noticePeriodDays != null && <div><span className="text-muted-foreground">{t('contracts.fields.noticePeriod')}:</span> {contract.noticePeriodDays}</div>}
                <div><span className="text-muted-foreground">{t('contracts.fields.isRenewable')}:</span> {contract.isRenewable ? tc('labels.yes') : tc('labels.no')}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t('contracts.fields.employee')}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">{t('fields.fullName')}:</span> <span className="font-medium">{contract.employee?.fullName || '\u2014'}</span></div>
                {contract.employee?.employeeNo && <div><span className="text-muted-foreground">{t('fields.employeeNo')}:</span> <span className="font-mono text-xs">{contract.employee.employeeNo}</span></div>}
                {contract.basicSalary != null && <div><span className="text-muted-foreground">{t('contracts.fields.basicSalary')}:</span> <span className="font-mono">{formatCurrency(Number(contract.basicSalary))}</span></div>}
                {contract.currency && <div><span className="text-muted-foreground">Currency:</span> {contract.currency}</div>}
                {contract.project && <div><span className="text-muted-foreground">Project:</span> {contract.project.name}</div>}
              </CardContent>
            </Card>
          </div>

          {contract.amendments && contract.amendments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{t('contracts.renewalHistory')}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contract.amendments.map((amendment) => (
                    <div key={amendment.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm">{amendment.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(amendment.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Edit Mode */}
      {editing && (
        <Card>
          <CardHeader><CardTitle>{tc('buttons.edit')}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contract-type">{t('contracts.fields.contractType')}</Label>
                <SearchableSelect
                  id="edit-contract-type"
                  options={CONTRACT_TYPES.map((ct) => ({ value: ct, label: tc(`employmentTypes.${ct}`) }))}
                  value={contractType}
                  onValueChange={setContractType}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-title">{t('contracts.fields.title')}</Label>
                <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start">{t('contracts.fields.startDate')}</Label>
                <Input id="edit-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end">{t('contracts.fields.endDate')}</Label>
                <Input id="edit-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-salary">{t('contracts.fields.basicSalary')}</Label>
                <Input id="edit-salary" type="number" min="0" step="0.01" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notice">{t('contracts.fields.noticePeriod')}</Label>
                <Input id="edit-notice" type="number" min="0" value={noticePeriodDays} onChange={(e) => setNoticePeriodDays(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input id="edit-renewable" type="checkbox" checked={isRenewable} onChange={(e) => setIsRenewable(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="edit-renewable">{t('contracts.fields.isRenewable')}</Label>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('contracts.form.saving')}
                </>
              ) : (
                tc('buttons.save')
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
