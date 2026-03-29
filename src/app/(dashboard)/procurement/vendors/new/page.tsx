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

const VENDOR_CATEGORIES = ['SUPPLIER', 'CONTRACTOR', 'CONSULTANT', 'SERVICE_PROVIDER'] as const

export default function NewVendorPage() {
  const router = useRouter()
  const t = useTranslations('procurement.vendors')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [category, setCategory] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [tin, setTin] = useState('')
  const [tradeLicense, setTradeLicense] = useState('')
  const [notes, setNotes] = useState('')

  function validate(): boolean {
    if (!companyName.trim()) {
      setError(t('companyNameRequired'))
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
      companyName: companyName.trim(),
    }
    if (category) payload.category = category
    if (contactPerson.trim()) payload.contactPerson = contactPerson.trim()
    if (phone.trim()) payload.phone = phone.trim()
    if (email.trim()) payload.email = email.trim()
    if (address.trim()) payload.address = address.trim()
    if (tin.trim()) payload.tin = tin.trim()
    if (tradeLicense.trim()) payload.tradeLicense = tradeLicense.trim()
    if (notes.trim()) payload.notes = notes.trim()

    try {
      const res = await fetch('/api/v1/procurement/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push('/procurement/vendors')
      } else {
        setError(json.error || t('failedToCreate'))
      }
    } catch {
      setError(t('failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('newVendor')} description={t('newVendorDesc')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/procurement/vendors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('newVendor')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Company Name + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-company-name">{t('companyName')} *</Label>
              <Input
                id="vendor-company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-category">{t('category')}</Label>
              <SearchableSelect
                id="vendor-category"
                options={VENDOR_CATEGORIES.map((cat) => ({ value: cat, label: t(`categories.${cat}`) }))}
                value={category}
                onValueChange={setCategory}
                placeholder={t('selectCategory')}
              />
            </div>
          </div>

          {/* Row 2: Contact Person + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-contact">{t('contactPerson')}</Label>
              <Input
                id="vendor-contact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-phone">{t('phone')}</Label>
              <Input
                id="vendor-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Email + TIN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-email">{t('email')}</Label>
              <Input
                id="vendor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-tin">{t('tin')}</Label>
              <Input
                id="vendor-tin"
                value={tin}
                onChange={(e) => setTin(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Trade License */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-trade-license">{t('tradeLicense')}</Label>
              <Input
                id="vendor-trade-license"
                value={tradeLicense}
                onChange={(e) => setTradeLicense(e.target.value)}
              />
            </div>
          </div>

          {/* Row 5: Address */}
          <div className="space-y-2">
            <Label htmlFor="vendor-address">{t('address')}</Label>
            <Textarea
              id="vendor-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>

          {/* Row 6: Notes */}
          <div className="space-y-2">
            <Label htmlFor="vendor-notes">{tc('labels.notes')}</Label>
            <Textarea
              id="vendor-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/procurement/vendors')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              tc('buttons.save')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
