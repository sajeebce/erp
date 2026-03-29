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

const SEPARATION_TYPES = ['RESIGNATION', 'TERMINATION', 'END_OF_CONTRACT', 'RETIREMENT', 'REDUNDANCY', 'MUTUAL_SEPARATION'] as const

interface Employee {
  id: string
  employeeNo: string
  fullName: string
}

export default function NewOffboardingPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [employeeId, setEmployeeId] = useState('')
  const [separationType, setSeparationType] = useState('')
  const [lastWorkingDay, setLastWorkingDay] = useState('')
  const [noticeDate, setNoticeDate] = useState('')
  const [noticePeriodDays, setNoticePeriodDays] = useState('')
  const [notes, setNotes] = useState('')

  // Lookup data
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    fetch('/api/v1/hr/employees?limit=500')
      .then(res => res.json())
      .then(json => { if (json.success) setEmployees(json.data) })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    if (!employeeId || !separationType || !lastWorkingDay) {
      setError(t('offboarding.form.requiredFields'))
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
      separationType,
      lastWorkingDay,
    }
    if (noticeDate) payload.noticeDate = noticeDate
    if (noticePeriodDays) payload.noticePeriodDays = parseInt(noticePeriodDays)
    if (notes.trim()) payload.notes = notes.trim()

    try {
      const res = await fetch('/api/v1/hr/offboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/offboarding/${json.data.id}`)
      } else {
        setError(json.error || t('offboarding.form.failedToCreate'))
      }
    } catch {
      setError(t('offboarding.form.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('offboarding.form.createTitle')} description={t('offboarding.form.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/offboarding')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('offboarding.form.exitDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exit-employee">{t('offboarding.fields.employee')} *</Label>
              <SearchableSelect
                id="exit-employee"
                options={employees.map((e) => ({ value: e.id, label: `${e.fullName} (${e.employeeNo})` }))}
                value={employeeId}
                onValueChange={setEmployeeId}
                placeholder={t('offboarding.form.selectEmployee')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exit-type">{t('offboarding.fields.separationType')} *</Label>
              <SearchableSelect
                id="exit-type"
                options={SEPARATION_TYPES.map((st) => ({ value: st, label: t(`offboarding.separationTypes.${st}`) }))}
                value={separationType}
                onValueChange={setSeparationType}
                placeholder={t('offboarding.form.selectSeparationType')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exit-last-day">{t('offboarding.fields.lastWorkingDay')} *</Label>
              <Input id="exit-last-day" type="date" value={lastWorkingDay} onChange={(e) => setLastWorkingDay(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exit-notice-date">Notice Date</Label>
              <Input id="exit-notice-date" type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exit-notice-days">Notice Period (Days)</Label>
              <Input id="exit-notice-days" type="number" min="0" value={noticePeriodDays} onChange={(e) => setNoticePeriodDays(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exit-notes">{tc('labels.notes')}</Label>
            <Textarea id="exit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr/offboarding')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('offboarding.form.saving')}
              </>
            ) : (
              t('offboarding.form.saveOffboarding')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
