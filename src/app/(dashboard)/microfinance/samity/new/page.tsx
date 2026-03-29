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

const MEETING_DAYS = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const

interface Branch {
  id: string
  code: string
  name: string
}

export default function NewSamityPage() {
  const router = useRouter()
  const t = useTranslations('microfinance')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [branchId, setBranchId] = useState('')
  const [formationDate, setFormationDate] = useState('')
  const [meetingDay, setMeetingDay] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  // Lookup data
  const [branches, setBranches] = useState<Branch[]>([])

  useEffect(() => {
    fetch('/api/v1/microfinance/branches?limit=200')
      .then(res => res.json())
      .then(json => { if (json.success) setBranches(json.data) })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    if (!name.trim() || !branchId || !formationDate || !meetingDay) {
      setError(t('samityForm.requiredFields'))
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
      name: name.trim(),
      branchId,
      formationDate,
      meetingDay,
    }
    if (meetingTime.trim()) payload.meetingTime = meetingTime.trim()
    if (location.trim()) payload.location = location.trim()
    if (notes.trim()) payload.notes = notes.trim()

    try {
      const res = await fetch('/api/v1/microfinance/samity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/microfinance/samity/${json.data.id}`)
      } else {
        setError(json.error || t('samityForm.failedToCreate'))
      }
    } catch {
      setError(t('samityForm.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('samityForm.createTitle')} description={t('samityForm.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/microfinance/samity')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('samityForm.samityDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="samity-name">{t('samity.name')} *</Label>
              <Input
                id="samity-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('samityForm.namePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="samity-branch">{t('samity.branch')} *</Label>
              <SearchableSelect
                id="samity-branch"
                options={branches.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` }))}
                value={branchId}
                onValueChange={setBranchId}
                placeholder={t('samityForm.selectBranch')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="samity-formation">{t('samity.formationDate')} *</Label>
              <Input
                id="samity-formation"
                type="date"
                value={formationDate}
                onChange={(e) => setFormationDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="samity-meeting-day">{t('samity.meetingDay')} *</Label>
              <SearchableSelect
                id="samity-meeting-day"
                options={MEETING_DAYS.map((day) => ({ value: day, label: t(`samityForm.days.${day}`) }))}
                value={meetingDay}
                onValueChange={setMeetingDay}
                placeholder={t('samityForm.selectMeetingDay')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="samity-meeting-time">{t('samityForm.meetingTime')}</Label>
              <Input
                id="samity-meeting-time"
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="samity-location">{t('samityForm.location')}</Label>
            <Input
              id="samity-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('samityForm.locationPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="samity-notes">{t('samityForm.notes')}</Label>
            <Textarea
              id="samity-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/microfinance/samity')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('samityForm.saving')}
              </>
            ) : (
              t('samityForm.saveSamity')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
