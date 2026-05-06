'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONSULTANT', 'INTERN', 'VOLUNTEER'] as const
const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const
const MARITAL_STATUSES = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] as const

interface Department {
  id: string
  name: string
}

interface Designation {
  id: string
  title: string
}

export default function NewEmployeePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const fromApplicationId = searchParams.get('fromApplication')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [convertedFromApplicationId, setConvertedFromApplicationId] = useState('')

  // Form state
  const [fullName, setFullName] = useState('')
  const [localizedName, setLocalizedName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [designationId, setDesignationId] = useState('')
  const [employmentType, setEmploymentType] = useState('FULL_TIME')
  const [joiningDate, setJoiningDate] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [nidNumber, setNidNumber] = useState('')
  const [basicSalary, setBasicSalary] = useState('')
  const [presentAddress, setPresentAddress] = useState('')
  const [permanentAddress, setPermanentAddress] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccountNo, setBankAccountNo] = useState('')
  const [notes, setNotes] = useState('')

  // Lookup data
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])

  useEffect(() => {
    fetch('/api/v1/hr/departments')
      .then(res => res.json())
      .then(json => { if (json.success) setDepartments(json.data) })
      .catch(() => {})

    fetch('/api/v1/hr/designations')
      .then(res => res.json())
      .then(json => { if (json.success) setDesignations(json.data) })
      .catch(() => {})
  }, [])

  // If coming from recruitment, fetch pre-fill data
  useEffect(() => {
    if (fromApplicationId) {
      fetch(`/api/v1/hr/recruitment/applications/${fromApplicationId}/convert-to-employee`)
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            const { prefill, jobPosting } = json.data
            setFullName(prefill.fullName || '')
            setEmail(prefill.email || '')
            setPhone(prefill.phone || '')
            if (jobPosting.departmentId) setDepartmentId(jobPosting.departmentId)
            if (jobPosting.designationId) setDesignationId(jobPosting.designationId)
            if (jobPosting.employmentType) setEmploymentType(jobPosting.employmentType)
            setConvertedFromApplicationId(fromApplicationId)
          }
        })
        .catch(() => {})
    }
  }, [fromApplicationId])

  function validate(): boolean {
    if (!fullName.trim() || !departmentId || !designationId || !joiningDate) {
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
      fullName: fullName.trim(),
      departmentId,
      designationId,
      joiningDate,
      employmentType,
    }
    if (localizedName.trim()) payload.localizedName = localizedName.trim()
    if (email.trim()) payload.email = email.trim()
    if (phone.trim()) payload.phone = phone.trim()
    if (dateOfBirth) payload.dateOfBirth = dateOfBirth
    if (gender) payload.gender = gender
    if (maritalStatus) payload.maritalStatus = maritalStatus
    if (nidNumber.trim()) payload.nidNumber = nidNumber.trim()
    if (basicSalary) payload.basicSalary = parseFloat(basicSalary)
    if (presentAddress.trim()) payload.presentAddress = presentAddress.trim()
    if (permanentAddress.trim()) payload.permanentAddress = permanentAddress.trim()
    if (emergencyContact.trim()) payload.emergencyContact = emergencyContact.trim()
    if (bankName.trim()) payload.bankName = bankName.trim()
    if (bankAccountNo.trim()) payload.bankAccountNo = bankAccountNo.trim()
    if (notes.trim()) payload.notes = notes.trim()
    if (convertedFromApplicationId) payload.convertedFromApplicationId = convertedFromApplicationId

    try {
      const res = await fetch('/api/v1/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/employees/${json.data.id}`)
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
        <Button variant="outline" size="sm" onClick={() => router.push('/hr')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {convertedFromApplicationId && (
        <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-200">
          This form is pre-filled from recruitment application. Review and complete all fields before saving.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('form.personalInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-name">{t('fields.fullName')} *</Label>
              <Input
                id="emp-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('form.namePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-localized-name">{t('form.localizedName')}</Label>
              <Input
                id="emp-localized-name"
                value={localizedName}
                onChange={(e) => setLocalizedName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-email">{t('fields.email')}</Label>
              <Input
                id="emp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-phone">{t('fields.phone')}</Label>
              <Input
                id="emp-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-dob">{t('form.dateOfBirth')}</Label>
              <Input
                id="emp-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-gender">{t('form.gender')}</Label>
              <SearchableSelect
                id="emp-gender"
                options={GENDERS.map((g) => ({ value: g, label: t(`form.genders.${g}`) }))}
                value={gender}
                onValueChange={setGender}
                placeholder={t('form.selectGender')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-marital">{t('form.maritalStatus')}</Label>
              <SearchableSelect
                id="emp-marital"
                options={MARITAL_STATUSES.map((s) => ({ value: s, label: t(`form.maritalStatuses.${s}`) }))}
                value={maritalStatus}
                onValueChange={setMaritalStatus}
                placeholder={t('form.selectMaritalStatus')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-nid">{t('form.nidNumber')}</Label>
            <Input
              id="emp-nid"
              value={nidNumber}
              onChange={(e) => setNidNumber(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('form.employmentInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-dept">{t('fields.department')} *</Label>
              <SearchableSelect
                id="emp-dept"
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                value={departmentId}
                onValueChange={setDepartmentId}
                placeholder={t('form.selectDepartment')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-desig">{t('fields.designation')} *</Label>
              <SearchableSelect
                id="emp-desig"
                options={designations.map((d) => ({ value: d.id, label: d.title }))}
                value={designationId}
                onValueChange={setDesignationId}
                placeholder={t('form.selectDesignation')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-type">{t('fields.employmentType')} *</Label>
              <SearchableSelect
                id="emp-type"
                options={EMPLOYMENT_TYPES.map((et) => ({ value: et, label: tc(`employmentTypes.${et}`) }))}
                value={employmentType}
                onValueChange={setEmploymentType}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-joining">{t('fields.joiningDate')} *</Label>
              <Input
                id="emp-joining"
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-salary">{t('fields.basicSalary')}</Label>
              <Input
                id="emp-salary"
                type="number"
                min="0"
                step="0.01"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-bank-name">{t('form.bankName')}</Label>
              <Input
                id="emp-bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-bank-account">{t('form.bankAccountNo')}</Label>
              <Input
                id="emp-bank-account"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('form.contactInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="emp-present-addr">{t('form.presentAddress')}</Label>
            <Textarea
              id="emp-present-addr"
              value={presentAddress}
              onChange={(e) => setPresentAddress(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-perm-addr">{t('form.permanentAddress')}</Label>
            <Textarea
              id="emp-perm-addr"
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-emergency">{t('form.emergencyContact')}</Label>
            <Input
              id="emp-emergency"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-notes">{t('form.notes')}</Label>
            <Textarea
              id="emp-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('form.saving')}
              </>
            ) : (
              t('form.saveEmployee')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
