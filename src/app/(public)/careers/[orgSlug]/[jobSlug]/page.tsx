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
} from 'lucide-react'
import Link from 'next/link'

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
  requireCoverLetter: boolean
  customQuestions: { question: string; type: string; required: boolean; options?: string[] }[] | null
  department: { name: string }
  organization: { id: string; name: string; logo: string | null }
}

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
      setSubmitting(true)

      try {
        const body: Record<string, unknown> = {
          applicantName: formData.applicantName,
          applicantEmail: formData.applicantEmail,
          applicantPhone: formData.applicantPhone || undefined,
          applicantAddress: formData.applicantAddress || undefined,
          customResponses: Object.entries(customResponses).map(([idx, answer]) => ({
            questionIndex: Number(idx),
            answer,
          })),
        }

        // Note: File uploads would be handled by a separate upload endpoint
        // For now, we submit the application data without file attachments
        if (cvFile) {
          body.cvFileName = cvFile.name
        }
        if (coverLetterFile) {
          body.coverLetterFileName = coverLetterFile.name
        }

        const res = await fetch(`/api/v1/public/careers/${params.orgSlug}/${params.jobSlug}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
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
    [job, formData, customResponses, cvFile, coverLetterFile, params.orgSlug, params.jobSlug]
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">{job.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            {job.department.name}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {job.location}
            {job.isRemote && ' (Remote)'}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            {formatEmploymentType(job.employmentType)}
          </span>
          {job.vacancies > 1 && (
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {job.vacancies} vacancies
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {job.showSalary && (job.salaryMin || job.salaryMax) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
            </Badge>
          )}
          <Badge variant={isDeadlinePassed ? 'destructive' : 'secondary'} className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Deadline: {formatDate(job.applicationDeadline)}
          </Badge>
        </div>
      </div>

      {/* Job Description Sections */}
      <div className="space-y-6 mb-10">
        <section>
          <h2 className="text-xl font-semibold mb-3">Description</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {job.description}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Responsibilities</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {job.responsibilities}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Qualifications</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {job.qualifications}
          </div>
        </section>

        {job.preferredSkills && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Preferred Skills</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {job.preferredSkills}
            </div>
          </section>
        )}

        {job.benefits && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Benefits</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {job.benefits}
            </div>
          </section>
        )}
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

              {/* File Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cvFile">
                    CV / Resume <span className="text-destructive">*</span>
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <Input
                      id="cvFile"
                      type="file"
                      required
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
