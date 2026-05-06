'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft, Loader2, ChevronRight, XCircle, CalendarPlus,
  Calculator, GraduationCap, BriefcaseBusiness, Code2, Languages, Award, UserCheck,
  FileText, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

const PIPELINE_STAGES = [
  'APPLIED',
  'SCREENED',
  'SHORTLISTED',
  'TECHNICAL_TEST',
  'INTERVIEW',
  'REFERENCE_CHECK',
  'OFFER',
  'HIRED',
] as const

interface ApplicationDetail {
  id: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string | null
  stage?: string
  status?: string
  autoScore: number | null
  manualScore: number | null
  finalScore: number | null
  scoreBreakdown: {
    education: number
    experience: number
    skills: number
    languages: number
    certifications: number
  } | null
  parsedCV?: {
    education: string[]
    experience: string[]
    skills: string[]
    languages: string[]
    certifications: string[]
  } | null
  parsedEducation?: { degree?: string; institution?: string; year?: string; field?: string }[] | null
  parsedExperience?: { title?: string; org?: string; startDate?: string; endDate?: string }[] | null
  parsedSkills?: string[] | null
  parsedLanguages?: { language?: string; level?: string }[] | null
  parsedCertifications?: string[] | null
  totalExperienceYears?: string | number | null
  cvFilePath: string | null
  coverLetterPath: string | null
  coverLetter: string | null
  customResponses: { question: string; answer: string }[] | null
  notes: string | null
  appliedAt: string
  jobPosting: {
    id: string
    title: string
    postingNo: string
  }
  interviews: {
    id: string
    interviewType: string
    scheduledAt: string
    duration: number
    status: string
    rating: number | null
    feedback: string | null
    interviewerName: string | null
  }[]
  offerSalary: number | null
  offerLetterUrl: string | null
}

function buildDeclaration(application: ApplicationDetail) {
  const parsedCV = application.parsedCV
  const education = parsedCV?.education?.length
    ? parsedCV.education
    : (application.parsedEducation || []).map((item) =>
        [item.degree, item.field, item.institution, item.year].filter(Boolean).join(' - ')
      )
  const experience = parsedCV?.experience?.length
    ? parsedCV.experience
    : [
        application.totalExperienceYears !== null && application.totalExperienceYears !== undefined
          ? `${application.totalExperienceYears} years`
          : '',
        ...(application.parsedExperience || []).map((item) =>
          [item.title, item.org].filter(Boolean).join(' - ')
        ),
      ].filter(Boolean)
  const skills = parsedCV?.skills?.length ? parsedCV.skills : application.parsedSkills || []
  const languages = parsedCV?.languages?.length
    ? parsedCV.languages
    : (application.parsedLanguages || []).map((item) =>
        [item.language, item.level].filter(Boolean).join(' - ')
      )
  const certifications = parsedCV?.certifications?.length
    ? parsedCV.certifications
    : application.parsedCertifications || []

  return { education, experience, skills, languages, certifications }
}

function getStoredFileName(path: string) {
  return path.split('/').pop()?.replace(/^[0-9a-f-]+-/i, '') || path
}

function isDownloadableDocument(path: string) {
  return path.includes('/hr/recruitment/')
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate, formatCurrency } = useFormatters()

  const [application, setApplication] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  // Reject dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Schedule interview dialog
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [interviewType, setInterviewType] = useState('PHONE')
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewDuration, setInterviewDuration] = useState('30')
  const [interviewLocation, setInterviewLocation] = useState('')
  const [interviewerName, setInterviewerName] = useState('')

  const fetchApplication = useCallback(async () => {
    if (!params.id) return

    const res = await fetch(`/api/v1/hr/recruitment/applications/${params.id}`)
    const json = await res.json()
    if (res.ok && json.success) {
      setApplication(json.data)
      return true
    }

    setError(json.error?.message || tc('errors.notFound'))
    return false
  }, [params.id, tc])

  useEffect(() => {
    if (!params.id) return

    fetchApplication()
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc, fetchApplication])

  async function handleScore() {
    setActionLoading('score')
    try {
      const res = await fetch(`/api/v1/hr/recruitment/applications/${params.id}/score`, { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.success) await fetchApplication()
      else setError(json.error?.message || t('recruitment.form.actionFailed'))
    } catch {
      setError(t('recruitment.form.actionFailed'))
    } finally {
      setActionLoading('')
    }
  }

  async function handleAdvance() {
    setActionLoading('advance')
    try {
      const res = await fetch(`/api/v1/hr/recruitment/applications/${params.id}/advance`, { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.success) await fetchApplication()
      else setError(json.error?.message || t('recruitment.form.actionFailed'))
    } catch {
      setError(t('recruitment.form.actionFailed'))
    } finally {
      setActionLoading('')
    }
  }

  async function handleReject() {
    setActionLoading('reject')
    try {
      const res = await fetch(`/api/v1/hr/recruitment/applications/${params.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        await fetchApplication()
        setShowRejectDialog(false)
        setRejectReason('')
      } else {
        setError(json.error?.message || t('recruitment.form.actionFailed'))
      }
    } catch {
      setError(t('recruitment.form.actionFailed'))
    } finally {
      setActionLoading('')
    }
  }

  async function handleScheduleInterview() {
    if (!interviewDate) return
    setActionLoading('schedule')
    setError('')
    try {
      const res = await fetch('/api/v1/hr/recruitment/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: params.id,
          interviewType,
          scheduledAt: interviewDate,
          durationMinutes: parseInt(interviewDuration) || 30,
          location: interviewLocation.trim() || undefined,
          interviewerName: interviewerName.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        await fetchApplication()
        setShowScheduleDialog(false)
        setInterviewType('PHONE')
        setInterviewDate('')
        setInterviewDuration('30')
        setInterviewLocation('')
        setInterviewerName('')
      } else {
        setError(json.error?.message || t('recruitment.form.actionFailed'))
      }
    } catch {
      setError(t('recruitment.form.actionFailed'))
    } finally {
      setActionLoading('')
    }
  }

  function getCurrentStageIndex(): number {
    if (!application) return 0
    const currentStage = application.stage || application.status || 'APPLIED'
    const idx = PIPELINE_STAGES.indexOf(currentStage as typeof PIPELINE_STAGES[number])
    return idx >= 0 ? idx : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('recruitment.applicationDetails')} description="">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error || tc('errors.notFound')}
          </CardContent>
        </Card>
      </div>
    )
  }

  const stageIndex = getCurrentStageIndex()
  const currentStage = application.stage || application.status || 'APPLIED'
  const isRejected = currentStage === 'REJECTED'
  const isHired = currentStage === 'HIRED'
  const declaration = buildDeclaration(application)
  const cvUrl = `/api/v1/hr/recruitment/applications/${application.id}/documents/cv`
  const coverLetterUrl = `/api/v1/hr/recruitment/applications/${application.id}/documents/cover-letter`
  const canDownloadCv = Boolean(application.cvFilePath && isDownloadableDocument(application.cvFilePath))
  const canDownloadCoverLetter = Boolean(
    application.coverLetterPath && isDownloadableDocument(application.coverLetterPath)
  )
  const hasDeclaration =
    declaration.education.length > 0 ||
    declaration.experience.length > 0 ||
    declaration.skills.length > 0 ||
    declaration.languages.length > 0 ||
    declaration.certifications.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={application.applicantName}
        description={`${application.jobPosting.postingNo} - ${application.jobPosting.title}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/hr/recruitment/${application.jobPosting.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Pipeline Stage Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isCurrent = currentStage === stage
              const isPast = idx < stageIndex
              return (
                <div key={stage} className="flex items-center gap-1 flex-shrink-0">
                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isPast
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                    } ${isRejected ? 'opacity-50' : ''}`}
                  >
                    {t(`recruitment.stages.${stage}`)}
                  </div>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              )
            })}
            {isRejected && (
              <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">
                  {tc('status.REJECTED')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parsed CV */}
          {hasDeclaration && (
            <Card>
              <CardHeader>
                <CardTitle>Applicant Self-Declaration</CardTitle>
                <p className="text-sm text-muted-foreground">Verify these claims at interview.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {declaration.education.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('recruitment.cvSections.education')}</span>
                    </div>
                    <ul className="text-sm space-y-1 ml-6 list-disc">
                      {declaration.education.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {declaration.experience.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('recruitment.cvSections.experience')}</span>
                    </div>
                    <ul className="text-sm space-y-1 ml-6 list-disc">
                      {declaration.experience.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {declaration.skills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Code2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('recruitment.cvSections.skills')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-6">
                      {declaration.skills.map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {declaration.languages.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Languages className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('recruitment.cvSections.languages')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-6">
                      {declaration.languages.map((lang, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {declaration.certifications.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('recruitment.cvSections.certifications')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-6">
                      {declaration.certifications.map((cert, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Custom Question Responses */}
          {application.customResponses && application.customResponses.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{t('recruitment.customResponses')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {application.customResponses.map((resp, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium">{resp.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">{resp.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Cover Letter */}
          {application.coverLetter && (
            <Card>
              <CardHeader><CardTitle>{t('recruitment.coverLetter')}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{application.coverLetter}</p>
              </CardContent>
            </Card>
          )}

          {/* Interview History */}
          {application.interviews.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{t('recruitment.interviewHistory')}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {application.interviews.map(interview => (
                    <div key={interview.id} className="flex items-start justify-between border rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium">
                          {t(`recruitment.interviewTypes.${interview.interviewType}`)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(interview.scheduledAt)} &middot; {interview.duration} {t('recruitment.minutes')}
                        </p>
                        {interview.interviewerName && (
                          <p className="text-xs text-muted-foreground">{t('recruitment.interviewer')}: {interview.interviewerName}</p>
                        )}
                        {interview.feedback && (
                          <p className="text-sm mt-2">{interview.feedback}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {interview.rating != null && (
                          <Badge variant="secondary">{interview.rating}/5</Badge>
                        )}
                        <StatusBadge status={interview.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {application.notes && (
            <Card>
              <CardHeader><CardTitle>{t('recruitment.notes')}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{application.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {application.cvFilePath ? (
                  <div className="rounded-md border px-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">CV / Resume: {getStoredFileName(application.cvFilePath)}</span>
                    </span>
                    {canDownloadCv ? (
                      <a
                        href={cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        View PDF
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Stored as filename only. Ask candidate to submit again with the new upload flow.
                      </p>
                    )}
                  </div>
              ) : (
                <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
                  No CV / Resume uploaded for this application.
                </div>
              )}

              {application.coverLetterPath ? (
                  <div className="rounded-md border px-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">Cover Letter: {getStoredFileName(application.coverLetterPath)}</span>
                    </span>
                    {canDownloadCoverLetter ? (
                      <a
                        href={coverLetterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        View File
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Stored as filename only. Ask candidate to submit again with the new upload flow.
                      </p>
                    )}
                  </div>
              ) : (
                <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
                  No cover letter file uploaded.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score Card */}
          <Card>
            <CardHeader><CardTitle>{t('recruitment.scoreCard')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Circular Score Display */}
              <div className="flex justify-center">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                    <circle
                      cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
                      className="text-primary"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - (application.finalScore ?? application.autoScore ?? 0) / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{application.finalScore ?? application.autoScore ?? '\u2014'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('recruitment.autoScore')}</span>
                  <span className="font-mono font-medium">{application.autoScore ?? '\u2014'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('recruitment.manualScore')}</span>
                  <span className="font-mono font-medium">{application.manualScore ?? '\u2014'}%</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">{t('recruitment.finalScore')}</span>
                  <span className="font-mono font-bold">{application.finalScore ?? '\u2014'}%</span>
                </div>
              </div>

              {/* Score Breakdown */}
              {application.scoreBreakdown && (
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-sm font-medium">{t('recruitment.scoreBreakdown')}</p>
                  {(['education', 'experience', 'skills', 'languages', 'certifications'] as const).map(key => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground capitalize">{t(`recruitment.cvSections.${key}`)}</span>
                        <span className="font-mono">{application.scoreBreakdown![key]}%</span>
                      </div>
                      <Progress value={application.scoreBreakdown![key]} className="h-1.5" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader><CardTitle>{t('recruitment.quickInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">{t('recruitment.appliedDate')}:</span>{' '}
                <span className="font-medium">{formatDate(application.appliedAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('recruitment.currentStage')}:</span>{' '}
                <StatusBadge status={currentStage} />
              </div>
              <div>
                <span className="text-muted-foreground">{t('recruitment.jobTitle')}:</span>{' '}
                <button
                  className="font-medium text-primary hover:underline"
                  onClick={() => router.push(`/hr/recruitment/${application.jobPosting.id}`)}
                >
                  {application.jobPosting.title}
                </button>
              </div>
              {application.applicantEmail && (
                <div>
                  <span className="text-muted-foreground">{t('fields.email')}:</span>{' '}
                  <span>{application.applicantEmail}</span>
                </div>
              )}
              {application.applicantPhone && (
                <div>
                  <span className="text-muted-foreground">{t('fields.phone')}:</span>{' '}
                  <span>{application.applicantPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Offer Section */}
          {currentStage === 'OFFER' && (
            <Card>
              <CardHeader><CardTitle>{t('recruitment.offerDetails')}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {application.offerSalary != null && (
                  <div>
                    <span className="text-muted-foreground">{t('recruitment.offeredSalary')}:</span>{' '}
                    <span className="font-mono font-medium">{formatCurrency(application.offerSalary)}</span>
                  </div>
                )}
                {application.offerLetterUrl && (
                  <div>
                    <a href={application.offerLetterUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">
                      {t('recruitment.viewOfferLetter')}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Convert to Employee */}
          {isHired && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => router.push(`/hr/employees/new?fromApplication=${application.id}`)}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Convert to Employee
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {!isRejected && !isHired && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <Button className="w-full" size="sm" onClick={handleAdvance} disabled={!!actionLoading}>
                  {actionLoading === 'advance' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  {t('recruitment.advanceToNext')}
                </Button>

                <Button className="w-full" variant="outline" size="sm" onClick={handleScore} disabled={!!actionLoading}>
                  {actionLoading === 'score' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4 mr-2" />
                  )}
                  {t('recruitment.scoreCV')}
                </Button>

                <Button className="w-full" variant="outline" size="sm" onClick={() => setShowScheduleDialog(true)} disabled={!!actionLoading}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  {t('recruitment.scheduleInterview')}
                </Button>

                <Button className="w-full" variant="destructive" size="sm" onClick={() => setShowRejectDialog(true)} disabled={!!actionLoading}>
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('recruitment.reject')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('recruitment.rejectApplication')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">{t('recruitment.rejectReason')}</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder={t('recruitment.rejectReasonPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={actionLoading === 'reject'}>
              {tc('buttons.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading === 'reject'}>
              {actionLoading === 'reject' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {t('recruitment.confirmReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('recruitment.scheduleInterview')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interview-type">{t('recruitment.interviewType')}</Label>
              <select
                id="interview-type"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="PHONE">{t('recruitment.interviewTypes.PHONE')}</option>
                <option value="VIDEO">{t('recruitment.interviewTypes.VIDEO')}</option>
                <option value="IN_PERSON">{t('recruitment.interviewTypes.IN_PERSON')}</option>
                <option value="PANEL">{t('recruitment.interviewTypes.PANEL')}</option>
                <option value="TECHNICAL">{t('recruitment.interviewTypes.TECHNICAL')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interview-date">{t('recruitment.scheduledDate')} *</Label>
              <Input
                id="interview-date"
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interview-duration">{t('recruitment.duration')} (minutes)</Label>
                <Input
                  id="interview-duration"
                  type="number"
                  min="15"
                  step="15"
                  value={interviewDuration}
                  onChange={(e) => setInterviewDuration(e.target.value)}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">Example: 30, 45, 60, 75</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interview-location">{t('recruitment.location')}</Label>
                <Input
                  id="interview-location"
                  value={interviewLocation}
                  onChange={(e) => setInterviewLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interviewer-name">{t('recruitment.interviewer')}</Label>
              <Input
                id="interviewer-name"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)} disabled={actionLoading === 'schedule'}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleScheduleInterview} disabled={actionLoading === 'schedule' || !interviewDate}>
              {actionLoading === 'schedule' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {t('recruitment.confirmSchedule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
