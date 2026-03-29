'use client'

import { useState } from 'react'
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

const DONOR_TYPES = [
  'BILATERAL',
  'MULTILATERAL',
  'FOUNDATION',
  'CORPORATE',
  'INDIVIDUAL',
  'GOVERNMENT',
  'INGO',
] as const

export default function NewDonorPage() {
  const router = useRouter()
  const t = useTranslations('donors')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [country, setCountry] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  function validate(): boolean {
    if (!name.trim() || !type) {
      setError(t('form.requiredFields'))
      return false
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('form.invalidEmail'))
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
      type,
    }
    if (country.trim()) payload.country = country.trim()
    if (address.trim()) payload.address = address.trim()
    if (phone.trim()) payload.phone = phone.trim()
    if (email.trim()) payload.email = email.trim()
    if (website.trim()) payload.website = website.trim()
    if (description.trim()) payload.description = description.trim()
    if (notes.trim()) payload.notes = notes.trim()

    try {
      const res = await fetch('/api/v1/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/donors/${json.data.id}`)
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
        <Button variant="outline" size="sm" onClick={() => router.push('/donors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('form.donorDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Name + Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="donor-name">{t('fields.donorName')} *</Label>
              <Input
                id="donor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('form.namePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="donor-type">{t('fields.type')} *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="donor-type" className="w-full">
                  <SelectValue placeholder={t('form.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {DONOR_TYPES.map((dt) => (
                    <SelectItem key={dt} value={dt}>
                      {t(`donorTypes.${dt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Country + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="donor-country">{t('fields.country')}</Label>
              <Input
                id="donor-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={t('form.countryPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="donor-phone">{t('fields.phone')}</Label>
              <Input
                id="donor-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Email + Website */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="donor-email">{t('fields.email')}</Label>
              <Input
                id="donor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="donor-website">{t('fields.website')}</Label>
              <Input
                id="donor-website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="donor-address">{t('form.address')}</Label>
            <Textarea
              id="donor-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="donor-description">{t('form.description')}</Label>
            <Textarea
              id="donor-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="donor-notes">{t('form.notes')}</Label>
            <Textarea
              id="donor-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/donors')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('form.saving')}
              </>
            ) : (
              t('form.saveDonor')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
