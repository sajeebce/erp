'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'

const ACTIONS = ['VERBAL_WARNING', 'WRITTEN_WARNING', 'FINAL_WARNING', 'SUSPENSION', 'TERMINATION'] as const

interface Employee {
  id: string
  employeeNo: string
  fullName: string
}

export default function NewDisciplinaryCasePage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [employeeId, setEmployeeId] = useState('')
  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [actionDate, setActionDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [suspensionStart, setSuspensionStart] = useState('')
  const [suspensionEnd, setSuspensionEnd] = useState('')
  const [withPay, setWithPay] = useState(true)

  // Lookup data
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    fetch('/api/v1/hr/employees?limit=500')
      .then(res => res.json())
      .then(json => { if (json.success) setEmployees(json.data) })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    if (!employeeId || !action || !reason.trim() || !incidentDate) {
      setError(t('disciplinary.form.requiredFields'))
      return false
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!validate()) return

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      employeeId,
      action,
      reason: reason.trim(),
      incidentDate,
    }
    if (description.trim()) payload.description = description.trim()
    if (actionDate) payload.actionDate = actionDate
    if (expiryDate) payload.expiryDate = expiryDate
    if (action === 'SUSPENSION') {
      if (suspensionStart) payload.suspensionStart = suspensionStart
      if (suspensionEnd) payload.suspensionEnd = suspensionEnd
      payload.withPay = withPay
    }

    try {
      const res = await fetch('/api/v1/hr/disciplinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/disciplinary/${json.data.id}`)
      } else {
        setError(json.error || t('disciplinary.form.failedToCreate'))
      }
    } catch {
      setError(t('disciplinary.form.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('disciplinary.form.createTitle')} description={t('disciplinary.form.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/disciplinary')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('disciplinary.form.caseDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="disc-employee">{t('disciplinary.fields.employee')} *</Label>
              <SearchableSelect
                id="disc-employee"
                options={employees.map((e) => ({ value: e.id, label: `${e.fullName} (${e.employeeNo})` }))}
                value={employeeId}
                onValueChange={setEmployeeId}
                placeholder={t('disciplinary.form.selectEmployee')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disc-action">{t('disciplinary.fields.action')} *</Label>
              <SearchableSelect
                id="disc-action"
                options={ACTIONS.map((a) => ({ value: a, label: t(`disciplinary.actions.${a}`) }))}
                value={action}
                onValueChange={setAction}
                placeholder={t('disciplinary.form.selectAction')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disc-reason">{t('disciplinary.fields.reason')} *</Label>
            <Input id="disc-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('disciplinary.form.reasonPlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="disc-description">{tc('labels.description')}</Label>
            <Textarea id="disc-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder={t('disciplinary.form.descriptionPlaceholder')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="disc-incident-date">{t('disciplinary.fields.incidentDate')} *</Label>
              <Input id="disc-incident-date" type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disc-action-date">{t('disciplinary.fields.actionDate')}</Label>
              <Input id="disc-action-date" type="date" value={actionDate} onChange={(e) => setActionDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disc-expiry-date">{t('disciplinary.fields.expiryDate')}</Label>
              <Input id="disc-expiry-date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </div>

          {action === 'SUSPENSION' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disc-susp-start">Suspension Start</Label>
                  <Input id="disc-susp-start" type="date" value={suspensionStart} onChange={(e) => setSuspensionStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disc-susp-end">Suspension End</Label>
                  <Input id="disc-susp-end" type="date" value={suspensionEnd} onChange={(e) => setSuspensionEnd(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input id="disc-with-pay" type="checkbox" checked={withPay} onChange={(e) => setWithPay(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="disc-with-pay">With Pay</Label>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr/disciplinary')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('disciplinary.form.saving')}
              </>
            ) : (
              t('disciplinary.form.saveCase')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
