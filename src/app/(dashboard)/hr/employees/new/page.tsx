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
const RELIGIONS = ['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Other', 'Prefer not to say'] as const
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

interface Department {
  id: string
  name: string
}

interface Designation {
  id: string
  title: string
}

interface SalaryGrade {
  id: string
  code: string
  name: string
  midSalary: number | string
  maxSalary: number | string
  minSalary: number | string
  steps?: { stepNumber: number; basicSalary: number | string }[]
}

type CandidateRecord = Record<string, unknown>

function normalizeGender(value: unknown) {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'MALE' || normalized === 'FEMALE' || normalized === 'OTHER') return normalized
  return ''
}

function normalizeMaritalStatus(value: unknown) {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'UNMARRIED') return 'SINGLE'
  if (normalized === 'SINGLE' || normalized === 'MARRIED' || normalized === 'DIVORCED' || normalized === 'WIDOWED') return normalized
  return ''
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
  const [fatherName, setFatherName] = useState('')
  const [motherName, setMotherName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [designationId, setDesignationId] = useState('')
  const [employmentType, setEmploymentType] = useState('FULL_TIME')
  const [joiningDate, setJoiningDate] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [nationality, setNationality] = useState('Bangladeshi')
  const [religion, setReligion] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [nidNumber, setNidNumber] = useState('')
  const [basicSalary, setBasicSalary] = useState('')
  const [salaryGradeId, setSalaryGradeId] = useState('')
  const [salaryStructureId, setSalaryStructureId] = useState('')
  const [presentAddress, setPresentAddress] = useState('')
  const [permanentAddress, setPermanentAddress] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccountNo, setBankAccountNo] = useState('')
  const [notes, setNotes] = useState('')
  const [candidateNotes, setCandidateNotes] = useState('')
  const [educationRecords, setEducationRecords] = useState<CandidateRecord[]>([])
  const [previousEmployments, setPreviousEmployments] = useState<CandidateRecord[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<CandidateRecord[]>([])
  const [candidateSkills, setCandidateSkills] = useState<CandidateRecord[] | string[]>([])
  const [candidateLanguages, setCandidateLanguages] = useState<CandidateRecord[] | string[]>([])
  const [candidateCertifications, setCandidateCertifications] = useState<CandidateRecord[] | string[]>([])

  // Lookup data
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [salaryGrades, setSalaryGrades] = useState<SalaryGrade[]>([])

  useEffect(() => {
    fetch('/api/v1/hr/departments')
      .then(res => res.json())
      .then(json => { if (json.success) setDepartments(json.data) })
      .catch(() => {})

    fetch('/api/v1/hr/designations')
      .then(res => res.json())
      .then(json => { if (json.success) setDesignations(json.data) })
      .catch(() => {})

    fetch('/api/v1/hr/salary-grades?isActive=true&limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setSalaryGrades(json.data) })
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
            setLocalizedName(prefill.localizedName || '')
            setEmail(prefill.email || '')
            setPhone(prefill.phone || '')
            setFatherName(prefill.fatherName || '')
            setMotherName(prefill.motherName || '')
            setDateOfBirth(prefill.dateOfBirth ? String(prefill.dateOfBirth).split('T')[0] : '')
            setGender(normalizeGender(prefill.gender))
            setNationality(prefill.nationality || 'Bangladeshi')
            setReligion(prefill.religion || '')
            setBloodGroup(prefill.bloodGroup || '')
            setMaritalStatus(normalizeMaritalStatus(prefill.maritalStatus))
            setNidNumber(prefill.nidNumber || '')
            setPresentAddress(prefill.presentAddress || '')
            setPermanentAddress(prefill.permanentAddress || '')
            setEmergencyContact(prefill.emergencyContact || '')
            setEducationRecords(Array.isArray(prefill.educationRecords) ? prefill.educationRecords : [])
            setPreviousEmployments(Array.isArray(prefill.previousEmployments) ? prefill.previousEmployments : [])
            setEmergencyContacts(Array.isArray(prefill.emergencyContacts) ? prefill.emergencyContacts : [])
            setCandidateSkills(Array.isArray(prefill.skills) ? prefill.skills : [])
            setCandidateLanguages(Array.isArray(prefill.languages) ? prefill.languages : [])
            setCandidateCertifications(Array.isArray(prefill.certifications) ? prefill.certifications : [])
            const candidateSummary = [
              prefill.alternatePhone ? `Alternate phone: ${prefill.alternatePhone}` : '',
              prefill.trainingDetails ? `Training: ${prefill.trainingDetails}` : '',
              prefill.professionName ? `Profession/license: ${prefill.professionName}` : '',
              prefill.hasProfessionalLicense !== null && prefill.hasProfessionalLicense !== undefined ? `Has professional license: ${prefill.hasProfessionalLicense ? 'Yes' : 'No'}` : '',
              prefill.hasLegalCase !== null && prefill.hasLegalCase !== undefined ? `Has legal case: ${prefill.hasLegalCase ? 'Yes' : 'No'}` : '',
              prefill.hasRelativeInOrg !== null && prefill.hasRelativeInOrg !== undefined ? `Has relative in organization: ${prefill.hasRelativeInOrg ? 'Yes' : 'No'}` : '',
              Array.isArray(prefill.references) && prefill.references.length > 0 ? `References: ${JSON.stringify(prefill.references)}` : '',
              Array.isArray(prefill.previousEmployments) && prefill.previousEmployments.length > 0 ? `Candidate previous employment form: ${JSON.stringify(prefill.previousEmployments)}` : '',
            ].filter(Boolean).join('\n')
            setCandidateNotes(candidateSummary)
            if (jobPosting.departmentId) setDepartmentId(jobPosting.departmentId)
            if (jobPosting.designationId) setDesignationId(jobPosting.designationId)
            if (jobPosting.employmentType) setEmploymentType(jobPosting.employmentType)
            if (prefill.salaryGradeId) setSalaryGradeId(prefill.salaryGradeId)
            if (prefill.salaryStructureId) setSalaryStructureId(prefill.salaryStructureId)
            if (prefill.basicSalary) setBasicSalary(String(prefill.basicSalary))
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
    if (fatherName.trim()) payload.fatherName = fatherName.trim()
    if (motherName.trim()) payload.motherName = motherName.trim()
    if (nationality.trim()) payload.nationality = nationality.trim()
    if (religion) payload.religion = religion
    if (bloodGroup) payload.bloodGroup = bloodGroup
    if (maritalStatus) payload.maritalStatus = maritalStatus
    if (nidNumber.trim()) payload.nidNumber = nidNumber.trim()
    if (basicSalary) payload.basicSalary = parseFloat(basicSalary)
    if (salaryGradeId) payload.salaryGradeId = salaryGradeId
    if (salaryStructureId) payload.salaryStructureId = salaryStructureId
    if (presentAddress.trim()) payload.presentAddress = presentAddress.trim()
    if (permanentAddress.trim()) payload.permanentAddress = permanentAddress.trim()
    if (emergencyContact.trim()) payload.emergencyContact = emergencyContact.trim()
    if (bankName.trim()) payload.bankName = bankName.trim()
    if (bankAccountNo.trim()) payload.bankAccountNo = bankAccountNo.trim()
    if (educationRecords.length > 0) payload.educationRecords = educationRecords
    if (previousEmployments.length > 0) payload.previousEmployments = previousEmployments
    if (emergencyContacts.length > 0) payload.emergencyContacts = emergencyContacts
    if (candidateSkills.length > 0) payload.skills = candidateSkills
    if (candidateLanguages.length > 0) payload.languages = candidateLanguages
    if (candidateCertifications.length > 0) payload.certifications = candidateCertifications
    const combinedNotes = [notes.trim(), candidateNotes].filter(Boolean).join('\n\n')
    if (combinedNotes) payload.notes = combinedNotes
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-father-name">{t('form.fatherName')}</Label>
              <Input
                id="emp-father-name"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-mother-name">{t('form.motherName')}</Label>
              <Input
                id="emp-mother-name"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-nid">{t('form.nidNumber')}</Label>
              <Input
                id="emp-nid"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-nationality">{t('form.nationality')}</Label>
              <Input
                id="emp-nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-religion">{t('form.religion')}</Label>
              <SearchableSelect
                id="emp-religion"
                options={RELIGIONS.map((item) => ({ value: item, label: item }))}
                value={religion}
                onValueChange={setReligion}
                placeholder="Select religion"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-blood-group">{t('form.bloodGroup')}</Label>
              <SearchableSelect
                id="emp-blood-group"
                options={BLOOD_GROUPS.map((item) => ({ value: item, label: item }))}
                value={bloodGroup}
                onValueChange={setBloodGroup}
                placeholder="Select blood group"
              />
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="emp-salary-grade">Salary Grade</Label>
            <SearchableSelect
              id="emp-salary-grade"
              options={salaryGrades.map((grade) => ({
                value: grade.id,
                label: `${grade.code} - ${grade.name}`,
                description: `Gross ${Number(grade.midSalary || grade.maxSalary || grade.minSalary || 0).toLocaleString('en-BD')} BDT`,
              }))}
              value={salaryGradeId}
              onValueChange={(value) => {
                setSalaryGradeId(value)
                const grade = salaryGrades.find((item) => item.id === value)
                if (grade) setBasicSalary(String(grade.steps?.[0]?.basicSalary || grade.minSalary || grade.midSalary || grade.maxSalary || ''))
              }}
              placeholder="Select salary grade"
            />
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
