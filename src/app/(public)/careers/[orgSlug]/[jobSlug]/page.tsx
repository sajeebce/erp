'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  MapPin,
  Clock,
  Users,
  Building2,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
  GraduationCap,
  Languages,
  Award,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'

interface RequiredLanguage {
  language: string
  level?: string
}

interface JobDetail {
  id: string
  title: string
  slug: string
  location: string
  employmentType: string
  applicationDeadline: string
  salaryMin: number | null
  salaryMax: number | null
  currency: string
  showSalary: boolean
  isRemote: boolean
  vacancies: number
  description: string
  responsibilities: string
  qualifications: string
  preferredSkills: string | null
  benefits: string | null
  minEducation: string | null
  minExperience: number | null
  requiredSkills: string[] | null
  requiredLanguages: RequiredLanguage[] | null
  requiredCertifications: string[] | null
  requireCoverLetter: boolean
  customQuestions: { question: string; type: string; required: boolean; options?: string[] }[] | null
  department: { name: string }
  organization: { id: string; name: string; logo: string | null }
}

const EDUCATION_OPTIONS = [
  'SSC',
  'HSC',
  'Diploma',
  'Bachelors',
  'Masters',
  'PhD',
]

const LANGUAGE_LEVELS = ['Basic', 'Conversational', 'Fluent', 'Native']

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatEmploymentType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatSalary(min: number | null, max: number | null, currency: string) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  if (min && max) return `${fmt(min)} - ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  if (max) return `Up to ${fmt(max)}`
  return null
}

function splitCommaText(value: string | null) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toggleListItem(list: string[], item: string, checked: boolean) {
  if (checked) return list.includes(item) ? list : [...list, item]
  return list.filter((value) => value !== item)
}

export default function PublicJobDetailPage() {
  const params = useParams<{ orgSlug: string; jobSlug: string }>()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Application form state
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    applicantAddress: '',
    coverLetter: '',
  })
  const [declaredEducation, setDeclaredEducation] = useState('')
  const [declaredExperienceYears, setDeclaredExperienceYears] = useState('')
  const [declaredSkills, setDeclaredSkills] = useState<string[]>([])
  const [declaredLanguages, setDeclaredLanguages] = useState<RequiredLanguage[]>([])
  const [declaredCertifications, setDeclaredCertifications] = useState<string[]>([])
  const [confirmAccuracy, setConfirmAccuracy] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null)
  const [customResponses, setCustomResponses] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/v1/public/careers/${params.orgSlug}/${params.jobSlug}`)
        const json = await res.json()
        if (!json.success) {
          setError(json.error?.message || 'Job not found')
          return
        }
        setJob(json.data)
      } catch {
        setError('Failed to load job details')
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [params.orgSlug, params.jobSlug])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!job) return
      setSubmitError(null)

      const needsSelfDeclaration =
        Boolean(job.minEducation) ||
        job.minExperience !== null ||
        (job.requiredSkills || []).length > 0 ||
        (job.requiredLanguages || []).length > 0 ||
        (job.requiredCertifications || []).length > 0

      if (needsSelfDeclaration && !confirmAccuracy) {
        setSubmitError('Please confirm that your self-declared information is accurate.')
        return
      }

      setSubmitting(true)

      try {
        const body = new FormData()
        body.set('applicantName', formData.applicantName)
        body.set('applicantEmail', formData.applicantEmail)
        if (formData.applicantPhone) body.set('applicantPhone', formData.applicantPhone)
        if (formData.applicantAddress) body.set('applicantAddress', formData.applicantAddress)
        if (declaredEducation) body.set('declaredEducation', declaredEducation)
        if (declaredExperienceYears !== '') body.set('declaredExperienceYears', declaredExperienceYears)
        body.set('declaredSkills', JSON.stringify(declaredSkills))
        body.set('declaredLanguages', JSON.stringify(declaredLanguages))
        body.set('declaredCertifications', JSON.stringify(declaredCertifications))
        body.set('customResponses', JSON.stringify(
          Object.entries(customResponses).map(([idx, answer]) => ({
            questionIndex: Number(idx),
            answer,
          }))
        ))
        if (cvFile) body.set('cvFile', cvFile)
        if (coverLetterFile) body.set('coverLetterFile', coverLetterFile)

        const res = await fetch(`/api/v1/public/careers/${params.orgSlug}/${params.jobSlug}/apply`, {
          method: 'POST',
          body,
        })
        const json = await res.json()
        if (!json.success) {
          setSubmitError(json.error?.message || 'Failed to submit application')
          return
        }
        setSubmitted(true)
      } catch {
        setSubmitError('Failed to submit application. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
    [
      job,
      formData,
      declaredEducation,
      declaredExperienceYears,
      declaredSkills,
      declaredLanguages,
      declaredCertifications,
      confirmAccuracy,
      customResponses,
      cvFile,
      coverLetterFile,
      params.orgSlug,
      params.jobSlug,
    ]
  )

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-10 bg-muted rounded w-96" />
          <div className="h-4 bg-muted rounded w-64" />
          <div className="h-64 bg-muted rounded mt-8" />
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
        <p className="text-muted-foreground mb-4">{error || 'This job posting does not exist or is no longer available.'}</p>
        <Link href={`/careers/${params.orgSlug}`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Careers
          </Button>
        </Link>
      </div>
    )
  }

  const isDeadlinePassed = new Date(job.applicationDeadline) < new Date()
  const requiredSkills = job.requiredSkills || []
  const requiredLanguages = job.requiredLanguages || []
  const requiredCertifications = job.requiredCertifications || []
  const preferredSkillItems = splitCommaText(job.preferredSkills)
  const benefitItems = splitCommaText(job.benefits)
  const hasEligibilitySection =
    Boolean(job.minEducation) ||
    job.minExperience !== null ||
    requiredSkills.length > 0 ||
    requiredLanguages.length > 0 ||
    requiredCertifications.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/careers/${params.orgSlug}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to all positions at {job.organization.name}
      </Link>

      {/* Job Header */}
      <section className="mb-8 overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b bg-muted/35 px-6 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{job.organization.name}</Badge>
                <Badge variant={isDeadlinePassed ? 'destructive' : 'secondary'} className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Deadline: {formatDate(job.applicationDeadline)}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">{job.title}</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {job.department.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                  {job.isRemote && ' (Remote)'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {formatEmploymentType(job.employmentType)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {job.vacancies} {job.vacancies === 1 ? 'vacancy' : 'vacancies'}
                </span>
              </div>
            </div>
            {job.showSalary && (job.salaryMin || job.salaryMax) && (
              <div className="rounded-md border bg-background px-4 py-3 md:text-right">
                <p className="text-xs font-medium uppercase text-muted-foreground">Salary Range</p>
                <p className="mt-1 flex items-center gap-1 text-lg font-semibold md:justify-end">
                  <DollarSign className="h-4 w-4" />
                  {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                </p>
              </div>
            )}
          </div>
        </div>

        {hasEligibilitySection && (
          <div className="grid gap-3 px-6 py-5 md:grid-cols-2 lg:grid-cols-4">
            {job.minEducation && (
              <div className="rounded-md border bg-background p-3">
                <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  Education
                </p>
                <p className="mt-1 font-semibold">{job.minEducation}</p>
              </div>
            )}
            {job.minExperience !== null && (
              <div className="rounded-md border bg-background p-3">
                <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  Experience
                </p>
                <p className="mt-1 font-semibold">{job.minExperience}+ years</p>
              </div>
            )}
            {requiredLanguages.length > 0 && (
              <div className="rounded-md border bg-background p-3">
                <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                  <Languages className="h-4 w-4" />
                  Languages
                </p>
                <p className="mt-1 font-semibold">{requiredLanguages.map((item) => item.language).join(', ')}</p>
              </div>
            )}
            {requiredCertifications.length > 0 && (
              <div className="rounded-md border bg-background p-3">
                <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                  <Award className="h-4 w-4" />
                  Certifications
                </p>
                <p className="mt-1 font-semibold">{requiredCertifications.join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Job Description Sections */}
      <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-3">Description</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-7">
              {job.description}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-3">Responsibilities</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-7">
              {job.responsibilities}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-3">Qualifications</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-7">
              {job.qualifications}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          {requiredSkills.length > 0 && (
            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-base font-semibold">Required Skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {requiredSkills.map((skill) => (
                  <Badge key={skill} variant="outline">{skill}</Badge>
                ))}
              </div>
            </section>
          )}

          {preferredSkillItems.length > 0 && (
            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-base font-semibold">Preferred Skills</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {preferredSkillItems.map((skill) => (
                  <li key={skill} className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {benefitItems.length > 0 && (
            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-base font-semibold">Benefits</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {benefitItems.map((benefit) => (
                  <li key={benefit} className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {/* Application Form */}
      {submitted ? (
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for applying for the <strong>{job.title}</strong> position.
              We will review your application and get back to you soon.
            </p>
            <Link href={`/careers/${params.orgSlug}`} className="mt-6 inline-block">
              <Button variant="outline">Browse More Positions</Button>
            </Link>
          </CardContent>
        </Card>
      ) : isDeadlinePassed ? (
        <Card className="border-destructive/30">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Application Deadline Passed</h2>
            <p className="text-muted-foreground">
              The deadline for this position was {formatDate(job.applicationDeadline)}.
              Applications are no longer being accepted.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Apply for this Position</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicantName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="applicantName"
                    required
                    value={formData.applicantName}
                    onChange={(e) => setFormData((p) => ({ ...p, applicantName: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicantEmail">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="applicantEmail"
                    type="email"
                    required
                    value={formData.applicantEmail}
                    onChange={(e) => setFormData((p) => ({ ...p, applicantEmail: e.target.value }))}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicantPhone">Phone</Label>
                  <Input
                    id="applicantPhone"
                    type="tel"
                    value={formData.applicantPhone}
                    onChange={(e) => setFormData((p) => ({ ...p, applicantPhone: e.target.value }))}
                    placeholder="+880 1XX XXXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicantAddress">Address</Label>
                  <Input
                    id="applicantAddress"
                    value={formData.applicantAddress}
                    onChange={(e) => setFormData((p) => ({ ...p, applicantAddress: e.target.value }))}
                    placeholder="Your address"
                  />
                </div>
              </div>

              {/* Eligibility */}
              {hasEligibilitySection && (
                <div className="space-y-5 rounded-lg border p-4">
                  <div>
                    <h3 className="font-semibold">Applicant Self-Declaration</h3>
                    <p className="text-sm text-muted-foreground">
                      Select the requirements you meet. The hiring team may verify these claims during screening.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {job.minEducation && (
                      <div className="space-y-2">
                        <Label htmlFor="declaredEducation">
                          Highest Education <span className="text-destructive">*</span>
                        </Label>
                        <select
                          id="declaredEducation"
                          required
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          value={declaredEducation}
                          onChange={(e) => setDeclaredEducation(e.target.value)}
                        >
                          <option value="">Select education...</option>
                          {EDUCATION_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground">Minimum required: {job.minEducation}</p>
                      </div>
                    )}

                    {job.minExperience !== null && (
                      <div className="space-y-2">
                        <Label htmlFor="declaredExperienceYears">
                          Years of Experience <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="declaredExperienceYears"
                          type="number"
                          required
                          min="0"
                          step="0.5"
                          value={declaredExperienceYears}
                          onChange={(e) => setDeclaredExperienceYears(e.target.value)}
                          placeholder="0"
                        />
                        <p className="text-xs text-muted-foreground">Minimum required: {job.minExperience} years</p>
                      </div>
                    )}
                  </div>

                  {requiredSkills.length > 0 && (
                    <div className="space-y-2">
                      <Label>Which of these skills do you have?</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {requiredSkills.map((skill) => (
                          <label key={skill} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={declaredSkills.includes(skill)}
                              onChange={(e) =>
                                setDeclaredSkills((current) => toggleListItem(current, skill, e.target.checked))
                              }
                            />
                            <span>{skill}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {requiredLanguages.length > 0 && (
                    <div className="space-y-2">
                      <Label>Which languages do you speak?</Label>
                      <div className="space-y-2">
                        {requiredLanguages.map((item) => {
                          const selected = declaredLanguages.find((lang) => lang.language === item.language)
                          return (
                            <div key={item.language} className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2 rounded-md border px-3 py-2">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={Boolean(selected)}
                                  onChange={(e) =>
                                    setDeclaredLanguages((current) => {
                                      if (e.target.checked) {
                                        return current.some((lang) => lang.language === item.language)
                                          ? current
                                          : [...current, { language: item.language, level: item.level || 'Fluent' }]
                                      }
                                      return current.filter((lang) => lang.language !== item.language)
                                    })
                                  }
                                />
                                <span>{item.language}</span>
                              </label>
                              <select
                                className="rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
                                disabled={!selected}
                                value={selected?.level || item.level || 'Fluent'}
                                onChange={(e) =>
                                  setDeclaredLanguages((current) =>
                                    current.map((lang) =>
                                      lang.language === item.language ? { ...lang, level: e.target.value } : lang
                                    )
                                  )
                                }
                              >
                                {LANGUAGE_LEVELS.map((level) => (
                                  <option key={level} value={level}>
                                    {level}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {requiredCertifications.length > 0 && (
                    <div className="space-y-2">
                      <Label>Which certifications do you hold?</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {requiredCertifications.map((certification) => (
                          <label key={certification} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={declaredCertifications.includes(certification)}
                              onChange={(e) =>
                                setDeclaredCertifications((current) =>
                                  toggleListItem(current, certification, e.target.checked)
                                )
                              }
                            />
                            <span>{certification}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      required
                      className="mt-0.5 h-4 w-4"
                      checked={confirmAccuracy}
                      onChange={(e) => setConfirmAccuracy(e.target.checked)}
                    />
                    <span>I confirm the above information is accurate.</span>
                  </label>
                </div>
              )}

              {/* File Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cvFile">
                    CV / Resume
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <Input
                      id="cvFile"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="cursor-pointer"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX</p>
                  </div>
                </div>

                {job.requireCoverLetter && (
                  <div className="space-y-2">
                    <Label htmlFor="coverLetterFile">
                      Cover Letter <span className="text-destructive">*</span>
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <Input
                        id="coverLetterFile"
                        type="file"
                        required={job.requireCoverLetter}
                        accept=".pdf,.doc,.docx"
                        className="cursor-pointer"
                        onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Questions */}
              {job.customQuestions && job.customQuestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Additional Questions</h3>
                  {job.customQuestions.map((q, idx) => (
                    <div key={idx} className="space-y-2">
                      <Label>
                        {q.question}
                        {q.required && <span className="text-destructive"> *</span>}
                      </Label>
                      {q.type === 'textarea' ? (
                        <Textarea
                          required={q.required}
                          value={customResponses[idx] || ''}
                          onChange={(e) =>
                            setCustomResponses((p) => ({ ...p, [idx]: e.target.value }))
                          }
                        />
                      ) : q.type === 'select' && q.options ? (
                        <select
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          required={q.required}
                          value={customResponses[idx] || ''}
                          onChange={(e) =>
                            setCustomResponses((p) => ({ ...p, [idx]: e.target.value }))
                          }
                        >
                          <option value="">Select...</option>
                          {q.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          required={q.required}
                          value={customResponses[idx] || ''}
                          onChange={(e) =>
                            setCustomResponses((p) => ({ ...p, [idx]: e.target.value }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {submitError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center mt-12 pt-8 border-t">
        <p className="text-xs text-muted-foreground">
          Powered by NGO ERP
        </p>
      </div>
    </div>
  )
}
