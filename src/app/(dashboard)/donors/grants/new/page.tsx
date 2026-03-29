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

interface Donor {
  id: string
  name: string
  type: string
}

export default function NewGrantPage() {
  const router = useRouter()
  const t = useTranslations('donors')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [donorId, setDonorId] = useState('')
  const [awardAmount, setAwardAmount] = useState('')
  const [currencyCode, setCurrencyCode] = useState('BDT')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  // Lookup data
  const [donors, setDonors] = useState<Donor[]>([])

  useEffect(() => {
    fetch('/api/v1/donors?limit=200')
      .then(res => res.json())
      .then(json => { if (json.success) setDonors(json.data) })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    if (!title.trim() || !donorId) {
      setError(t('grantForm.requiredFields'))
      return false
    }
    const amt = parseFloat(awardAmount)
    if (!awardAmount || isNaN(amt) || amt <= 0) {
      setError(t('grantForm.amountMustBePositive'))
      return false
    }
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      setError(t('grantForm.endDateAfterStart'))
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
      title: title.trim(),
      donorId,
      awardAmount: parseFloat(awardAmount),
      currencyCode,
    }
    if (startDate) payload.startDate = startDate
    if (endDate) payload.endDate = endDate
    if (description.trim()) payload.description = description.trim()
    if (notes.trim()) payload.notes = notes.trim()

    try {
      const res = await fetch('/api/v1/donors/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/donors/grants/${json.data.id}`)
      } else {
        setError(json.error || t('grantForm.failedToCreate'))
      }
    } catch {
      setError(t('grantForm.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('grantForm.createTitle')} description={t('grantForm.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/donors/grants')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('grantForm.grantDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Title + Donor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grant-title">{t('grants.grantTitle')} *</Label>
              <Input
                id="grant-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('grantForm.titlePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grant-donor">{t('grants.donor')} *</Label>
              <Select value={donorId} onValueChange={setDonorId}>
                <SelectTrigger id="grant-donor" className="w-full">
                  <SelectValue placeholder={t('grantForm.selectDonor')} />
                </SelectTrigger>
                <SelectContent>
                  {donors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Award Amount + Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grant-amount">{t('grants.awardAmount')} *</Label>
              <Input
                id="grant-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={awardAmount}
                onChange={(e) => setAwardAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grant-currency">{t('grants.currency')}</Label>
              <Select value={currencyCode} onValueChange={setCurrencyCode}>
                <SelectTrigger id="grant-currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BDT">BDT</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Start Date + End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grant-start-date">{t('grants.startDate')}</Label>
              <Input
                id="grant-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grant-end-date">{t('grants.endDate')}</Label>
              <Input
                id="grant-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="grant-description">{t('grantForm.description')}</Label>
            <Textarea
              id="grant-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="grant-notes">{t('grantForm.notes')}</Label>
            <Textarea
              id="grant-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/donors/grants')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('grantForm.saving')}
              </>
            ) : (
              t('grantForm.saveGrant')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
