'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'
import { TagInput } from '@/components/shared/tag-input'

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONSULTANT', 'INTERN', 'VOLUNTEER'] as const
const EDUCATION_LEVELS = ['PHD', 'MASTERS', 'BACHELORS', 'DIPLOMA', 'HIGH_SCHOOL'] as const

interface Department {
  id: string
  name: string
}

type RecruitmentTagType = 'SKILL' | 'LANGUAGE' | 'CERTIFICATION'

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function extractLanguageStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object' && typeof (item as { language?: unknown }).language === 'string') {
      return (item as { language: string; level?: string }).language
    }
    return ''
  }).filter(Boolean)
}

export default function EditJobPostingPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Job Details
  const [title, setTitle] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [location, setLocation] = useState('')
  const [isRemote, setIsRemote] = useState(false)
  const [employmentType, setEmploymentType] = useState('FULL_TIME')
  const [vacancies, setVacancies] = useState('1')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [showSalary, setShowSalary] = useState(true)
  const [applicationDeadline, setApplicationDeadline] = useState('')
  const [expectedStartDate, setExpectedStartDate] = useState('')

  // Job Description
  const [description, setDescription] = useState('')
  const [responsibilities, setResponsibilities] = useState('')
  const [benefits, setBenefits] = useState('')

  // Requirements
  const [minEducation, setMinEducation] = useState('')
  const [minExperience, setMinExperience] = useState('')
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [requiredLanguages, setRequiredLanguages] = useState<string[]>([])
  const [requiredCertifications, setRequiredCertifications] = useState<string[]>([])
  const [tagSuggestions, setTagSuggestions] = useState<Record<RecruitmentTagType, string[]>>({
    SKILL: [],
    LANGUAGE: [],
    CERTIFICATION: [],
  })

  // Settings
  const [isInternal, setIsInternal] = useState(false)
  const [requireCoverLetter, setRequireCoverLetter] = useState(false)

  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    fetch('/api/v1/hr/departments?isActive=true')
      .then(res => res.json())
      .then(json => { if (json.success) setDepartments(json.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    ;(['SKILL', 'LANGUAGE', 'CERTIFICATION'] as const).forEach((type) => {
      fetch(`/api/v1/hr/recruitment/tags?type=${type}`)
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setTagSuggestions((current) => ({
              ...current,
              [type]: json.data.map((tag: { name: string }) => tag.name),
            }))
          }
        })
        .catch(() => {})
    })
  }, [])

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/v1/hr/recruitment/jobs/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          setError(tc('errors.notFound'))
          return
        }
        const job = json.data
        setTitle(job.title ?? '')
        setDepartmentId(job.department?.id ?? job.departmentId ?? '')
        setLocation(job.location ?? '')
        setIsRemote(job.isRemote ?? false)
        setEmploymentType(job.employmentType ?? 'FULL_TIME')
        setVacancies(String(job.vacancies ?? 1))
        setSalaryMin(job.salaryMin != null ? String(job.salaryMin) : '')
        setSalaryMax(job.salaryMax != null ? String(job.salaryMax) : '')
        setShowSalary(job.showSalary ?? true)
        setApplicationDeadline(toDateInputValue(job.applicationDeadline))
        setExpectedStartDate(toDateInputValue(job.expectedStartDate))
        setDescription(job.description ?? '')
        setResponsibilities(job.responsibilities ?? '')
        setBenefits(job.benefits ?? '')
        setMinEducation(job.minEducation ?? '')
        setMinExperience(job.minExperience != null ? String(job.minExperience) : '')
        setRequiredSkills(Array.isArray(job.requiredSkills) ? job.requiredSkills : [])
        setRequiredLanguages(extractLanguageStrings(job.requiredLanguages))
        setRequiredCertifications(Array.isArray(job.requiredCertifications) ? job.requiredCertifications : [])
        setIsInternal(job.isInternal ?? false)
        setRequireCoverLetter(job.requireCoverLetter ?? false)
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  function handleCreateTag(type: RecruitmentTagType, name: string) {
    setTagSuggestions((current) => ({
      ...current,
      [type]: current[type].some((tag) => tag.toLowerCase() === name.toLowerCase())
        ? current[type]
        : [...current[type], name],
    }))

    fetch('/api/v1/hr/recruitment/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name }),
    }).catch(() => {})
  }

  function validate(): boolean {
    if (
      !title.trim() ||
      !departmentId ||
      !location.trim() ||
      !applicationDeadline ||
      !description.trim() ||
      !responsibilities.trim()
    ) {
      setError(t('recruitment.form.requiredFields'))
      return false
    }
    if (salaryMin && salaryMax && parseFloat(salaryMin) > parseFloat(salaryMax)) {
      setError(t('recruitment.form.salaryMinMax'))
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
      departmentId,
      employmentType,
      vacancies: parseInt(vacancies) || 1,
      applicationDeadline,
      isRemote,
      showSalary,
      isInternal,
      requireCoverLetter,
      location: location.trim(),
      description: description.trim(),
      responsibilities: responsibilities.trim(),
      qualifications: 'See structured requirements',
      benefits: benefits.trim() || null,
      salaryMin: salaryMin ? parseFloat(salaryMin) : null,
      salaryMax: salaryMax ? parseFloat(salaryMax) : null,
      expectedStartDate: expectedStartDate || null,
      minEducation: minEducation || null,
      minExperience: minExperience ? parseInt(minExperience) : null,
      requiredSkills: requiredSkills.length > 0 ? requiredSkills : [],
      requiredLanguages: requiredLanguages.map((language) => ({ language })),
      requiredCertifications: requiredCertifications.length > 0 ? requiredCertifications : [],
    }

    try {
      const res = await fetch(`/api/v1/hr/recruitment/jobs/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/recruitment/${params.id}`)
      } else {
        setError(json.error?.message || t('recruitment.form.failedToCreate'))
      }
    } catch {
      setError(t('recruitment.form.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('recruitment.form.editTitle')} description={t('recruitment.form.editDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.push(`/hr/recruitment/${params.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      {/* Card 1: Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recruitment.form.jobDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">{t('recruitment.jobTitle')} *</Label>
              <Input
                id="job-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('recruitment.form.titlePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-dept">{t('fields.department')} *</Label>
              <SearchableSelect
                id="job-dept"
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                value={departmentId}
                onValueChange={setDepartmentId}
                placeholder={t('form.selectDepartment')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-location">{t('recruitment.location')} *</Label>
              <Input
                id="job-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('recruitment.form.locationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-type">{t('fields.employmentType')}</Label>
              <SearchableSelect
                id="job-type"
                options={EMPLOYMENT_TYPES.map((et) => ({ value: et, label: tc(`employmentTypes.${et}`) }))}
                value={employmentType}
                onValueChange={setEmploymentType}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-vacancies">{t('recruitment.vacancies')}</Label>
              <Input
                id="job-vacancies"
                type="number"
                min="1"
                value={vacancies}
                onChange={(e) => setVacancies(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-salary-min">{t('recruitment.form.salaryMin')}</Label>
              <Input
                id="job-salary-min"
                type="number"
                min="0"
                step="0.01"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-salary-max">{t('recruitment.form.salaryMax')}</Label>
              <Input
                id="job-salary-max"
                type="number"
                min="0"
                step="0.01"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="job-show-salary"
                  checked={showSalary}
                  onCheckedChange={(checked) => setShowSalary(checked === true)}
                />
                <Label htmlFor="job-show-salary" className="text-sm font-normal cursor-pointer">
                  {t('recruitment.form.showSalaryInPosting')}
                </Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-deadline">{t('recruitment.deadline')} *</Label>
              <Input
                id="job-deadline"
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-start-date">{t('recruitment.form.expectedStartDate')}</Label>
              <Input
                id="job-start-date"
                type="date"
                value={expectedStartDate}
                onChange={(e) => setExpectedStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="job-remote"
              checked={isRemote}
              onCheckedChange={(checked) => setIsRemote(checked === true)}
            />
            <Label htmlFor="job-remote" className="text-sm font-normal cursor-pointer">
              {t('recruitment.form.isRemote')}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Job Description */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recruitment.form.jobDescription')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="job-description">{t('recruitment.form.description')} *</Label>
            <Textarea
              id="job-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder={t('recruitment.form.descriptionPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-responsibilities">{t('recruitment.form.responsibilities')} *</Label>
            <Textarea
              id="job-responsibilities"
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              rows={6}
              placeholder={t('recruitment.form.responsibilitiesPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-benefits">{t('recruitment.form.benefits')}</Label>
            <Textarea
              id="job-benefits"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recruitment.form.requirementsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-min-education">{t('recruitment.form.minEducation')}</Label>
              <SearchableSelect
                id="job-min-education"
                options={EDUCATION_LEVELS.map((lvl) => ({ value: lvl, label: t(`recruitment.education.${lvl}`) }))}
                value={minEducation}
                onValueChange={setMinEducation}
                placeholder={t('recruitment.form.selectEducation')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-min-experience">{t('recruitment.form.minExperience')}</Label>
              <Input
                id="job-min-experience"
                type="number"
                min="0"
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                placeholder={t('recruitment.form.yearsPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('recruitment.form.requiredSkills')}</Label>
            <TagInput
              value={requiredSkills}
              onChange={setRequiredSkills}
              suggestions={tagSuggestions.SKILL}
              onCreateSuggestion={(name) => handleCreateTag('SKILL', name)}
              placeholder={t('recruitment.form.commaSeparatedPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('recruitment.form.requiredLanguages')}</Label>
            <TagInput
              value={requiredLanguages}
              onChange={setRequiredLanguages}
              suggestions={tagSuggestions.LANGUAGE}
              onCreateSuggestion={(name) => handleCreateTag('LANGUAGE', name)}
              placeholder={t('recruitment.form.commaSeparatedPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('recruitment.form.requiredCertifications')}</Label>
            <TagInput
              value={requiredCertifications}
              onChange={setRequiredCertifications}
              suggestions={tagSuggestions.CERTIFICATION}
              onCreateSuggestion={(name) => handleCreateTag('CERTIFICATION', name)}
              placeholder={t('recruitment.form.commaSeparatedPlaceholder')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recruitment.form.settings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="job-internal"
              checked={isInternal}
              onCheckedChange={(checked) => setIsInternal(checked === true)}
            />
            <Label htmlFor="job-internal" className="text-sm font-normal cursor-pointer">
              {t('recruitment.form.isInternal')}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="job-cover-letter"
              checked={requireCoverLetter}
              onCheckedChange={(checked) => setRequireCoverLetter(checked === true)}
            />
            <Label htmlFor="job-cover-letter" className="text-sm font-normal cursor-pointer">
              {t('recruitment.form.requireCoverLetter')}
            </Label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push(`/hr/recruitment/${params.id}`)} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('recruitment.form.saving')}
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
