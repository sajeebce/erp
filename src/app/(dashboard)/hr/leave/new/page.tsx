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

interface Employee {
  id: string
  employeeNo: string
  fullName: string
}

interface LeaveType {
  id: string
  name: string
  code: string
  daysPerYear: number
}

export default function NewLeavePage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [employeeId, setEmployeeId] = useState('')
  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [days, setDays] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  // Lookup data
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])

  useEffect(() => {
    fetch('/api/v1/hr/employees?limit=500')
      .then(res => res.json())
      .then(json => { if (json.success) setEmployees(json.data) })
      .catch(() => {})

    fetch('/api/v1/hr/leave/types')
      .then(res => res.json())
      .then(json => { if (json.success) setLeaveTypes(json.data) })
      .catch(() => {})
  }, [])

  // Auto-calculate days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end >= start) {
        const diffTime = end.getTime() - start.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        setDays(String(diffDays))
      }
    }
  }, [startDate, endDate])

  function validate(): boolean {
    if (!employeeId || !leaveTypeId || !startDate || !endDate || !days) {
      setError(t('leaveForm.requiredFields'))
      return false
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError(t('leaveForm.endDateAfterStart'))
      return false
    }
    if (parseInt(days) <= 0) {
      setError(t('leaveForm.daysMustBePositive'))
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
      leaveTypeId,
      startDate,
      endDate,
      days: parseInt(days),
    }
    if (reason.trim()) payload.reason = reason.trim()
    if (notes.trim()) payload.notes = notes.trim()

    try {
      const res = await fetch('/api/v1/hr/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/leave/${json.data.id}`)
      } else {
        setError(json.error || t('leaveForm.failedToCreate'))
      }
    } catch {
      setError(t('leaveForm.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('leaveForm.createTitle')} description={t('leaveForm.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/leave')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('leaveForm.leaveDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leave-employee">{t('leave.employee')} *</Label>
              <SearchableSelect
                id="leave-employee"
                options={employees.map((e) => ({ value: e.id, label: `${e.fullName} (${e.employeeNo})` }))}
                value={employeeId}
                onValueChange={setEmployeeId}
                placeholder={t('leaveForm.selectEmployee')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leave-type">{t('leave.leaveType')} *</Label>
              <SearchableSelect
                id="leave-type"
                options={leaveTypes.map((lt) => ({ value: lt.id, label: `${lt.name} (${lt.daysPerYear} ${t('leave.days')}/${t('leaveForm.year')})` }))}
                value={leaveTypeId}
                onValueChange={setLeaveTypeId}
                placeholder={t('leaveForm.selectLeaveType')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leave-start">{t('leave.startDate')} *</Label>
              <Input
                id="leave-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-end">{t('leave.endDate')} *</Label>
              <Input
                id="leave-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-days">{t('leave.days')} *</Label>
              <Input
                id="leave-days"
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-reason">{t('leave.reason')}</Label>
            <Textarea
              id="leave-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('leaveForm.reasonPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-notes">{t('leaveForm.notes')}</Label>
            <Textarea
              id="leave-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr/leave')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('leaveForm.saving')}
              </>
            ) : (
              t('leaveForm.submitApplication')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
