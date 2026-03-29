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
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'

const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const

export default function NewBeneficiaryPage() {
  const router = useRouter()
  const t = useTranslations('beneficiaries')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [fatherSpouseName, setFatherSpouseName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [nidNumber, setNidNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [division, setDivision] = useState('')
  const [district, setDistrict] = useState('')
  const [upazila, setUpazila] = useState('')
  const [union, setUnion] = useState('')
  const [village, setVillage] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  function validate(): boolean {
    if (!name.trim()) {
      setError(t('form.nameRequired'))
      return false
    }
    if (age && (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 150)) {
      setError(t('form.ageInvalid'))
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
    }
    if (fatherSpouseName.trim()) payload.fatherSpouseName = fatherSpouseName.trim()
    if (dateOfBirth) payload.dateOfBirth = dateOfBirth
    if (age) payload.age = Number(age)
    if (gender) payload.gender = gender
    if (nidNumber.trim()) payload.nidNumber = nidNumber.trim()
    if (phone.trim()) payload.phone = phone.trim()
    if (division.trim()) payload.division = division.trim()
    if (district.trim()) payload.district = district.trim()
    if (upazila.trim()) payload.upazila = upazila.trim()
    if (union.trim()) payload.union = union.trim()
    if (village.trim()) payload.village = village.trim()
    if (address.trim()) payload.address = address.trim()
    if (notes.trim()) payload.notes = notes.trim()

    try {
      const res = await fetch('/api/v1/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/beneficiaries/${json.data.id}`)
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
          <CardTitle>{t('form.personalInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Name + Father/Spouse Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ben-name">{t('fields.name')} *</Label>
              <Input
                id="ben-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('form.namePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ben-father">{t('form.fatherSpouseName')}</Label>
              <Input
                id="ben-father"
                value={fatherSpouseName}
                onChange={(e) => setFatherSpouseName(e.target.value)}
                placeholder={t('form.fatherSpousePlaceholder')}
              />
            </div>
          </div>

          {/* Row 2: Gender + DOB + Age */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ben-gender">{t('fields.gender')}</Label>
              <SearchableSelect
                id="ben-gender"
                options={GENDERS.map((g) => ({ value: g, label: t(`genders.${g}`) }))}
                value={gender}
                onValueChange={setGender}
                placeholder={t('form.selectGender')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ben-dob">{t('fields.dateOfBirth')}</Label>
              <Input
                id="ben-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ben-age">{t('form.age')}</Label>
              <Input
                id="ben-age"
                type="number"
                min="0"
                max="150"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: NID + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ben-nid">{t('fields.nidNumber')}</Label>
              <Input
                id="ben-nid"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
                placeholder={t('form.nidPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ben-phone">{t('fields.phone')}</Label>
              <Input
                id="ben-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('form.phonePlaceholder')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('form.addressInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Row: Division + District */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ben-division">{t('form.division')}</Label>
              <Input
                id="ben-division"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder={t('form.divisionPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ben-district">{t('fields.district')}</Label>
              <Input
                id="ben-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={t('form.districtPlaceholder')}
              />
            </div>
          </div>

          {/* Row: Upazila + Union */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ben-upazila">{t('fields.upazila')}</Label>
              <Input
                id="ben-upazila"
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                placeholder={t('form.upazilaPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ben-union">{t('fields.union')}</Label>
              <Input
                id="ben-union"
                value={union}
                onChange={(e) => setUnion(e.target.value)}
                placeholder={t('form.unionPlaceholder')}
              />
            </div>
          </div>

          {/* Row: Village */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ben-village">{t('fields.village')}</Label>
              <Input
                id="ben-village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder={t('form.villagePlaceholder')}
              />
            </div>
          </div>

          {/* Full Address */}
          <div className="space-y-2">
            <Label htmlFor="ben-address">{t('form.fullAddress')}</Label>
            <Textarea
              id="ben-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder={t('form.addressPlaceholder')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tc('labels.notes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="ben-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t('form.notesPlaceholder')}
          />
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
              t('form.register')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
