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

interface AddressForm {
  village: string
  postOffice: string
  union: string
  thana: string
  district: string
}

interface EducationRow {
  examName: string
  passingYear: string
  gradeGpa: string
  institution: string
  board: string
}

interface EmploymentRow {
  orgName: string
  designation: string
  period: string
  lastSalary: string
  reasonForLeaving: string
}

interface ReferenceRow {
  name: string
  relationship: string
  address: string
  mobile: string
}

interface EmergencyRow {
  name: string
  relationship: string
  mobile: string
}

const EMPTY_ADDRESS: AddressForm = { village: '', postOffice: '', union: '', thana: '', district: '' }
const EMPTY_EDU_ROW: EducationRow = { examName: '', passingYear: '', gradeGpa: '', institution: '', board: '' }
const EMPTY_EMP_ROW: EmploymentRow = { orgName: '', designation: '', period: '', lastSalary: '', reasonForLeaving: '' }
const EMPTY_REF_ROW: ReferenceRow = { name: '', relationship: '', address: '', mobile: '' }
const EMPTY_EMG_ROW: EmergencyRow = { name: '', relationship: '', mobile: '' }

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const RELIGIONS = ['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Other', 'Prefer not to say']

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
    coverLetter: '',
  })

  // CSS Personal Info state
  const [personalInfo, setPersonalInfo] = useState({
    applicantNameBn: '',
    parNo: '',
    motherName: '',
    fatherSpouseName: '',
    phoneAlt: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'Bangladeshi',
    nidNumber: '',
    religion: '',
    bloodGroup: '',
    maritalStatus: '',
    hasRelativeInOrg: '',
    trainingDetails: '',
    hasProfessionalLicense: '',
    professionName: '',
    hasLegalCase: '',
  })
  const [presentAddress, setPresentAddress] = useState<AddressForm>({ ...EMPTY_ADDRESS })
  const [permanentAddress, setPermanentAddress] = useState<AddressForm>({ ...EMPTY_ADDRESS })
  const [sameAddress, setSameAddress] = useState(false)
  const [educationRows, setEducationRows] = useState<EducationRow[]>([
    { ...EMPTY_EDU_ROW }, { ...EMPTY_EDU_ROW }, { ...EMPTY_EDU_ROW }, { ...EMPTY_EDU_ROW },
  ])
  const [employmentRows, setEmploymentRows] = useState<EmploymentRow[]>([
    { ...EMPTY_EMP_ROW }, { ...EMPTY_EMP_ROW },
  ])
  const [refRows, setRefRows] = useState<ReferenceRow[]>([{ ...EMPTY_REF_ROW }, { ...EMPTY_REF_ROW }])
  const [emergencyRows, setEmergencyRows] = useState<EmergencyRow[]>([{ ...EMPTY_EMG_ROW }, { ...EMPTY_EMG_ROW }])
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

      if (!personalInfo.religion) {
        setSubmitError('Please select religion.')
        return
      }

      setSubmitting(true)

      try {
        const body = new FormData()
        body.set('applicantName', formData.applicantName)
        body.set('applicantEmail', formData.applicantEmail)
        if (formData.applicantPhone) body.set('applicantPhone', formData.applicantPhone)

        // CSS Personal Info
        if (personalInfo.applicantNameBn) body.set('applicantNameBn', personalInfo.applicantNameBn)
        if (personalInfo.parNo) body.set('parNo', personalInfo.parNo)
        if (personalInfo.motherName) body.set('motherName', personalInfo.motherName)
        if (personalInfo.fatherSpouseName) body.set('fatherSpouseName', personalInfo.fatherSpouseName)
        if (personalInfo.phoneAlt) body.set('phoneAlt', personalInfo.phoneAlt)
        if (personalInfo.dateOfBirth) body.set('dateOfBirth', personalInfo.dateOfBirth)
        if (personalInfo.gender) body.set('gender', personalInfo.gender)
        if (personalInfo.nationality) body.set('nationality', personalInfo.nationality)
        if (personalInfo.nidNumber) body.set('nidNumber', personalInfo.nidNumber)
        if (personalInfo.religion) body.set('religion', personalInfo.religion)
        if (personalInfo.bloodGroup) body.set('bloodGroup', personalInfo.bloodGroup)
        if (personalInfo.maritalStatus) body.set('maritalStatus', personalInfo.maritalStatus)
        if (personalInfo.hasRelativeInOrg !== '') body.set('hasRelativeInOrg', personalInfo.hasRelativeInOrg)
        if (personalInfo.trainingDetails) body.set('trainingDetails', personalInfo.trainingDetails)
        if (personalInfo.hasProfessionalLicense !== '') body.set('hasProfessionalLicense', personalInfo.hasProfessionalLicense)
        if (personalInfo.professionName) body.set('professionName', personalInfo.professionName)
        if (personalInfo.hasLegalCase !== '') body.set('hasLegalCase', personalInfo.hasLegalCase)
        body.set('presentAddress', JSON.stringify(presentAddress))
        body.set('permanentAddress', JSON.stringify(sameAddress ? presentAddress : permanentAddress))
        body.set('educationRecords', JSON.stringify(educationRows.filter(r => r.examName || r.institution)))
        body.set('previousEmployments', JSON.stringify(employmentRows.filter(r => r.orgName || r.designation)))
        body.set('references', JSON.stringify(refRows.filter(r => r.name || r.mobile)))
        body.set('emergencyContacts', JSON.stringify(emergencyRows.filter(r => r.name || r.mobile)))
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
      personalInfo,
      presentAddress,
      permanentAddress,
      sameAddress,
      educationRows,
      employmentRows,
      refRows,
      emergencyRows,
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
              {/* ── Section 1: Personal Information ── */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="applicantNameBn">Name (Bengali)</Label>
                    <Input
                      id="applicantNameBn"
                      value={personalInfo.applicantNameBn}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, applicantNameBn: e.target.value }))}
                      placeholder="Name in Bengali"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicantName">
                      Name (English) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="applicantName"
                      required
                      value={formData.applicantName}
                      onChange={(e) => setFormData((p) => ({ ...p, applicantName: e.target.value }))}
                      placeholder="FULL NAME IN CAPITAL LETTERS"
                      className="uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parNo">Par No.</Label>
                    <Input
                      id="parNo"
                      value={personalInfo.parNo}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, parNo: e.target.value }))}
                      placeholder="Par number"
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
                    <Label htmlFor="motherName">Mother&apos;s Name</Label>
                    <Input
                      id="motherName"
                      value={personalInfo.motherName}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, motherName: e.target.value }))}
                      placeholder="Mother's full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherSpouseName">Father&apos;s / Spouse&apos;s Name</Label>
                    <Input
                      id="fatherSpouseName"
                      value={personalInfo.fatherSpouseName}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, fatherSpouseName: e.target.value }))}
                      placeholder="Father's or spouse's full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicantPhone">Mobile (Primary)</Label>
                    <Input
                      id="applicantPhone"
                      type="tel"
                      value={formData.applicantPhone}
                      onChange={(e) => setFormData((p) => ({ ...p, applicantPhone: e.target.value }))}
                      placeholder="+880 1XX XXXX XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneAlt">Mobile (Secondary)</Label>
                    <Input
                      id="phoneAlt"
                      type="tel"
                      value={personalInfo.phoneAlt}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, phoneAlt: e.target.value }))}
                      placeholder="+880 1XX XXXX XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={personalInfo.dateOfBirth}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={personalInfo.gender}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={personalInfo.nationality}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, nationality: e.target.value }))}
                      placeholder="Bangladeshi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nidNumber">National ID Number</Label>
                    <Input
                      id="nidNumber"
                      value={personalInfo.nidNumber}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, nidNumber: e.target.value }))}
                      placeholder="NID number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="religion">Religion *</Label>
                    <select
                      id="religion"
                      required
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={personalInfo.religion}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, religion: e.target.value }))}
                    >
                      <option value="">Select religion...</option>
                      {RELIGIONS.map((religion) => (
                        <option key={religion} value={religion}>{religion}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <select
                      id="bloodGroup"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={personalInfo.bloodGroup}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, bloodGroup: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <select
                      id="maritalStatus"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={personalInfo.maritalStatus}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, maritalStatus: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      <option value="Married">Married</option>
                      <option value="Unmarried">Unmarried</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Does any relative work at CSS?</Label>
                  <div className="flex gap-4">
                    {['true', 'false'].map((val) => (
                      <label key={val} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="hasRelativeInOrg"
                          value={val}
                          checked={personalInfo.hasRelativeInOrg === val}
                          onChange={(e) => setPersonalInfo((p) => ({ ...p, hasRelativeInOrg: e.target.value }))}
                          className="h-4 w-4"
                        />
                        {val === 'true' ? 'Yes' : 'No'}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Section 2: Present Address ── */}
              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">Present Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    ['village', 'Village / Area / Road'],
                    ['postOffice', 'Post Office / Ward No.'],
                    ['union', 'Union / Municipality / City Corporation'],
                    ['thana', 'Thana / Upazila'],
                    ['district', 'District'],
                  ] as [keyof AddressForm, string][]).map(([field, label]) => (
                    <div key={field} className="space-y-1">
                      <Label htmlFor={`present-${field}`}>{label}</Label>
                      <Input
                        id={`present-${field}`}
                        value={presentAddress[field]}
                        onChange={(e) => setPresentAddress((p) => ({ ...p, [field]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Section 3: Permanent Address ── */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Permanent Address</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={sameAddress}
                      onChange={(e) => setSameAddress(e.target.checked)}
                    />
                    Same as present address
                  </label>
                </div>
                {!sameAddress && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      ['village', 'Village / Area / Road'],
                      ['postOffice', 'Post Office / Ward No.'],
                      ['union', 'Union / Municipality / City Corporation'],
                      ['thana', 'Thana / Upazila'],
                      ['district', 'District'],
                    ] as [keyof AddressForm, string][]).map(([field, label]) => (
                      <div key={field} className="space-y-1">
                        <Label htmlFor={`permanent-${field}`}>{label}</Label>
                        <Input
                          id={`permanent-${field}`}
                          value={permanentAddress[field]}
                          onChange={(e) => setPermanentAddress((p) => ({ ...p, [field]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Section 4: Training Details ── */}
              <div className="space-y-2 rounded-lg border p-4">
                <h3 className="font-semibold">Training</h3>
                <p className="text-xs text-muted-foreground">Provide details of any training you have received</p>
                <Textarea
                  rows={3}
                  value={personalInfo.trainingDetails}
                  onChange={(e) => setPersonalInfo((p) => ({ ...p, trainingDetails: e.target.value }))}
                  placeholder="Training details..."
                />
              </div>

              {/* ── Section 5: Education Records ── */}
              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">Educational Qualifications</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="border px-2 py-1.5 text-left font-medium">Exam Name</th>
                        <th className="border px-2 py-1.5 text-left font-medium">Passing Year</th>
                        <th className="border px-2 py-1.5 text-left font-medium">Division / CGPA</th>
                        <th className="border px-2 py-1.5 text-left font-medium">School / College</th>
                        <th className="border px-2 py-1.5 text-left font-medium">Board / University</th>
                      </tr>
                    </thead>
                    <tbody>
                      {educationRows.map((row, i) => (
                        <tr key={i}>
                          {(['examName', 'passingYear', 'gradeGpa', 'institution', 'board'] as (keyof EducationRow)[]).map((field) => (
                            <td key={field} className="border px-1 py-1">
                              <Input
                                className="h-8 text-xs border-0 focus-visible:ring-0 px-1"
                                value={row[field]}
                                onChange={(e) => setEducationRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: e.target.value } : r))}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Section 6: Previous Employment ── */}
              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">Previous Employment</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="border px-2 py-1.5 text-left font-medium">Organization</th>
                        <th className="border px-2 py-1.5 text-left font-medium">Designation</th>
                        <th className="border px-2 py-1.5 text-left font-medium">Period</th>
                        <th className="border px-2 py-1.5 text-left font-medium">Last Salary</th>
                        <th className="border px-2 py-1.5 text-left font-medium">Reason for Leaving</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employmentRows.map((row, i) => (
                        <tr key={i}>
                          {(['orgName', 'designation', 'period', 'lastSalary', 'reasonForLeaving'] as (keyof EmploymentRow)[]).map((field) => (
                            <td key={field} className="border px-1 py-1">
                              <Input
                                className="h-8 text-xs border-0 focus-visible:ring-0 px-1"
                                value={row[field]}
                                onChange={(e) => setEmploymentRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: e.target.value } : r))}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Section 7: Other Information ── */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">Other Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Do you have a valid driving / professional license?</Label>
                    <div className="flex gap-4">
                      {['true', 'false'].map((val) => (
                        <label key={val} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="hasProfessionalLicense"
                            value={val}
                            checked={personalInfo.hasProfessionalLicense === val}
                            onChange={(e) => setPersonalInfo((p) => ({ ...p, hasProfessionalLicense: e.target.value }))}
                            className="h-4 w-4"
                          />
                          {val === 'true' ? 'Yes' : 'No'}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professionName">Profession</Label>
                    <Input
                      id="professionName"
                      value={personalInfo.professionName}
                      onChange={(e) => setPersonalInfo((p) => ({ ...p, professionName: e.target.value }))}
                      placeholder="Your profession"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Do you have any pending legal case?</Label>
                    <div className="flex gap-4">
                      {['true', 'false'].map((val) => (
                        <label key={val} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="hasLegalCase"
                            value={val}
                            checked={personalInfo.hasLegalCase === val}
                            onChange={(e) => setPersonalInfo((p) => ({ ...p, hasLegalCase: e.target.value }))}
                            className="h-4 w-4"
                          />
                          {val === 'true' ? 'Yes' : 'No'}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 8: References ── */}
              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">References</h3>
                <p className="text-xs text-muted-foreground">Two reputable persons (excluding immediate family members)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {refRows.map((row, i) => (
                    <div key={i} className="rounded-md border p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Reference {i + 1}</p>
                      {([
                        ['name', 'Name'],
                        ['relationship', 'Relationship'],
                        ['address', 'Address'],
                        ['mobile', 'Mobile Number'],
                      ] as [keyof ReferenceRow, string][]).map(([field, label]) => (
                        <div key={field} className="space-y-1">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            className="h-8 text-sm"
                            value={row[field]}
                            onChange={(e) => setRefRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: e.target.value } : r))}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Section 9: Emergency Contacts ── */}
              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">Emergency Contacts</h3>
                <p className="text-xs text-muted-foreground">Other family members or nearest relatives</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emergencyRows.map((row, i) => (
                    <div key={i} className="rounded-md border p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Emergency Contact {i + 1}</p>
                      {([
                        ['name', 'Name'],
                        ['relationship', 'Relationship'],
                        ['mobile', 'Mobile Number'],
                      ] as [keyof EmergencyRow, string][]).map(([field, label]) => (
                        <div key={field} className="space-y-1">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            className="h-8 text-sm"
                            value={row[field]}
                            onChange={(e) => setEmergencyRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: e.target.value } : r))}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
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
