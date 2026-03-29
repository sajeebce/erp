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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'

const PROJECT_STATUSES = ['PIPELINE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED'] as const

interface Donor {
  id: string
  name: string
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function NewProjectPage() {
  const router = useRouter()
  const t = useTranslations('projects')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [donorId, setDonorId] = useState('')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState('')
  const [totalBudget, setTotalBudget] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<string>('PIPELINE')

  // Lookup data
  const [donors, setDonors] = useState<Donor[]>([])

  useEffect(() => {
    fetch('/api/v1/donors?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setDonors(json.data) })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    if (!name.trim()) {
      setError(t('form.nameRequired'))
      return false
    }
    if (endDate && startDate && endDate < startDate) {
      setError(t('form.endDateAfterStart'))
      return false
    }
    if (totalBudget && (isNaN(Number(totalBudget)) || Number(totalBudget) < 0)) {
      setError(t('form.budgetPositive'))
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
      status,
    }
    if (description.trim()) payload.description = description.trim()
    if (donorId) payload.donorId = donorId
    if (startDate) payload.startDate = startDate
    if (endDate) payload.endDate = endDate
    if (totalBudget) payload.totalBudget = Number(totalBudget)
    if (location.trim()) payload.location = location.trim()

    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/projects/${json.data.id}`)
      } else {
        setError(json.error || t('form.failedToCreate'))
      }
    } catch {
      setError(t('form.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('form.createTitle')} description={t('form.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('form.projectInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Name + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">{t('fields.name')} *</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('form.namePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-status">{t('fields.status')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="project-status" className="w-full">
                  <SelectValue placeholder={t('form.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tc(`status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="space-y-2">
            <Label htmlFor="project-description">{t('fields.description')}</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          {/* Row 3: Start Date + End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-start-date">{t('fields.startDate')}</Label>
              <Input
                id="project-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-end-date">{t('fields.endDate')}</Label>
              <Input
                id="project-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Donor + Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-donor">{t('fields.donor')}</Label>
              <Select value={donorId} onValueChange={setDonorId}>
                <SelectTrigger id="project-donor" className="w-full">
                  <SelectValue placeholder={t('form.selectDonor')} />
                </SelectTrigger>
                <SelectContent>
                  {donors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-budget">{t('fields.totalBudget')}</Label>
              <Input
                id="project-budget"
                type="number"
                min="0"
                step="0.01"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Row 5: Location */}
          <div className="space-y-2">
            <Label htmlFor="project-location">{t('fields.location')}</Label>
            <Input
              id="project-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('form.locationPlaceholder')}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('form.saving')}
              </>
            ) : (
              t('form.createProject')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
