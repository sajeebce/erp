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
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONSULTANT', 'INTERN', 'VOLUNTEER'] as const
const EDUCATION_LEVELS = ['PHD', 'MASTERS', 'BACHELORS', 'DIPLOMA', 'HIGH_SCHOOL'] as const

interface Department {
  id: string
  name: string
}

export default function NewJobPostingPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

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
  const [qualifications, setQualifications] = useState('')
  const [preferredSkills, setPreferredSkills] = useState('')
  const [benefits, setBenefits] = useState('')

  // Requirements (Auto-Scoring)
  const [minEducation, setMinEducation] = useState('')
  const [minExperience, setMinExperience] = useState('')
  const [requiredSkills, setRequiredSkills] = useState('')
  const [requiredLanguages, setRequiredLanguages] = useState('')
  const [requiredCertifications, setRequiredCertifications] = useState('')

  // Settings
  const [isInternal, setIsInternal] = useState(false)
  const [requireCoverLetter, setRequireCoverLetter] = useState(false)

  // Lookup data
  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    fetch('/api/v1/hr/departments')
      .then(res => res.json())
      .then(json => { if (json.success) setDepartments(json.data) })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    if (!title.trim() || !departmentId || !applicationDeadline) {
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
    }
    if (location.trim()) payload.location = location.trim()
    if (salaryMin) payload.salaryMin = parseFloat(salaryMin)
    if (salaryMax) payload.salaryMax = parseFloat(salaryMax)
    if (expectedStartDate) payload.expectedStartDate = expectedStartDate
    if (description.trim()) payload.description = description.trim()
    if (responsibilities.trim()) payload.responsibilities = responsibilities.trim()
    if (qualifications.trim()) payload.qualifications = qualifications.trim()
    if (preferredSkills.trim()) payload.preferredSkills = preferredSkills.trim()
    if (benefits.trim()) payload.benefits = benefits.trim()
    if (minEducation) payload.minEducation = minEducation
    if (minExperience) payload.minExperience = parseInt(minExperience)
    if (requiredSkills.trim()) payload.requiredSkills = requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
    if (requiredLanguages.trim()) payload.requiredLanguages = requiredLanguages.split(',').map(s => s.trim()).filter(Boolean)
    if (requiredCertifications.trim()) payload.requiredCertifications = requiredCertifications.split(',').map(s => s.trim()).filter(Boolean)

    try {
      const res = await fetch('/api/v1/hr/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/recruitment/${json.data.id}`)
      } else {
        setError(json.error || t('recruitment.form.failedToCreate'))
      }
    } catch {
      setError(t('recruitment.form.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('recruitment.form.createTitle')} description={t('recruitment.form.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/recruitment')}>
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
              <Label htmlFor="job-location">{t('recruitment.location')}</Label>
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
            <Label htmlFor="job-description">{t('recruitment.form.description')}</Label>
            <Textarea
              id="job-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder={t('recruitment.form.descriptionPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-responsibilities">{t('recruitment.form.responsibilities')}</Label>
            <Textarea
              id="job-responsibilities"
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              rows={6}
              placeholder={t('recruitment.form.responsibilitiesPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-qualifications">{t('recruitment.form.qualifications')}</Label>
            <Textarea
              id="job-qualifications"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              rows={6}
              placeholder={t('recruitment.form.qualificationsPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-preferred-skills">{t('recruitment.form.preferredSkills')}</Label>
            <Textarea
              id="job-preferred-skills"
              value={preferredSkills}
              onChange={(e) => setPreferredSkills(e.target.value)}
              rows={3}
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

      {/* Card 3: Requirements for Auto-Scoring */}
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
            <Label htmlFor="job-required-skills">{t('recruitment.form.requiredSkills')}</Label>
            <Input
              id="job-required-skills"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder={t('recruitment.form.commaSeparatedPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('recruitment.form.commaSeparatedHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-required-languages">{t('recruitment.form.requiredLanguages')}</Label>
            <Input
              id="job-required-languages"
              value={requiredLanguages}
              onChange={(e) => setRequiredLanguages(e.target.value)}
              placeholder={t('recruitment.form.commaSeparatedPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-required-certs">{t('recruitment.form.requiredCertifications')}</Label>
            <Input
              id="job-required-certs"
              value={requiredCertifications}
              onChange={(e) => setRequiredCertifications(e.target.value)}
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
          <Button variant="outline" onClick={() => router.push('/hr/recruitment')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('recruitment.form.saving')}
              </>
            ) : (
              t('recruitment.form.saveJobPosting')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
