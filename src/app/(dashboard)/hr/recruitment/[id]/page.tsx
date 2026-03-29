'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft, Loader2, Pencil, Send, XCircle, MapPin, Building2,
  Briefcase, Users, CalendarDays, DollarSign, Sparkles, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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

interface JobPosting {
  id: string
  postingNo: string
  title: string
  department: { id: string; name: string } | null
  location: string
  isRemote: boolean
  employmentType: string
  vacancies: number
  salaryMin: number | null
  salaryMax: number | null
  showSalary: boolean
  applicationDeadline: string
  expectedStartDate: string | null
  description: string | null
  responsibilities: string | null
  qualifications: string | null
  preferredSkills: string | null
  benefits: string | null
  minEducation: string | null
  minExperience: number | null
  requiredSkills: string[] | null
  requiredLanguages: string[] | null
  requiredCertifications: string[] | null
  status: string
  createdAt: string
}

interface Application {
  id: string
  applicantName: string
  applicantEmail: string
  stage: string
  autoScore: number | null
  manualScore: number | null
  appliedAt: string
}

interface Interview {
  id: string
  applicantName: string
  interviewType: string
  scheduledAt: string
  duration: number
  location: string
  status: string
  rating: number | null
}

export default function JobPostingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate, formatCurrency } = useFormatters()

  const [job, setJob] = useState<JobPosting | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/v1/hr/recruitment/jobs/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setJob(json.data)
        else setError(tc('errors.notFound'))
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))

    fetch(`/api/v1/hr/recruitment/jobs/${params.id}/applications`)
      .then(res => res.json())
      .then(json => { if (json.success) setApplications(json.data) })
      .catch(() => {})

    fetch(`/api/v1/hr/recruitment/jobs/${params.id}/interviews`)
      .then(res => res.json())
      .then(json => { if (json.success) setInterviews(json.data) })
      .catch(() => {})
  }, [params.id, tc])

  async function handlePublish() {
    setActionLoading('publish')
    try {
      const res = await fetch(`/api/v1/hr/recruitment/jobs/${params.id}/publish`, { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.success) {
        setJob(json.data)
      } else {
        setError(json.error || t('recruitment.form.actionFailed'))
      }
    } catch {
      setError(t('recruitment.form.actionFailed'))
    } finally {
      setActionLoading('')
    }
  }

  async function handleClose() {
    setActionLoading('close')
    try {
      const res = await fetch(`/api/v1/hr/recruitment/jobs/${params.id}/close`, { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.success) {
        setJob(json.data)
      } else {
        setError(json.error || t('recruitment.form.actionFailed'))
      }
    } catch {
      setError(t('recruitment.form.actionFailed'))
    } finally {
      setActionLoading('')
    }
  }

  async function handleScoreAll() {
    setActionLoading('score')
    try {
      const res = await fetch(`/api/v1/hr/recruitment/jobs/${params.id}/score-all`, { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.success) {
        setApplications(json.data)
      }
    } catch {
      setError(t('recruitment.form.actionFailed'))
    } finally {
      setActionLoading('')
    }
  }

  function getStageApplications(stage: string) {
    return applications.filter(a => a.stage === stage)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('recruitment.jobDetails')} description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/recruitment')}>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.title}
        description={`${job.postingNo} - ${job.department?.name || ''}`}
      >
        <div className="flex gap-2 items-center">
          <StatusBadge status={job.status} />
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/recruitment')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/hr/recruitment/${params.id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            {tc('buttons.edit')}
          </Button>
          {job.status === 'DRAFT' && (
            <Button size="sm" onClick={handlePublish} disabled={!!actionLoading}>
              {actionLoading === 'publish' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {t('recruitment.publish')}
            </Button>
          )}
          {job.status === 'PUBLISHED' && (
            <Button variant="destructive" size="sm" onClick={handleClose} disabled={!!actionLoading}>
              {actionLoading === 'close' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {t('recruitment.closePosting')}
            </Button>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Job Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('recruitment.location')}</span>
            </div>
            <p className="text-sm font-medium">{job.location || '\u2014'}{job.isRemote ? ` (${t('recruitment.remote')})` : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('fields.department')}</span>
            </div>
            <p className="text-sm font-medium">{job.department?.name || '\u2014'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('fields.employmentType')}</span>
            </div>
            <p className="text-sm font-medium">{tc(`employmentTypes.${job.employmentType}`)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('recruitment.vacancies')}</span>
            </div>
            <p className="text-sm font-medium">{job.vacancies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('recruitment.deadline')}</span>
            </div>
            <p className="text-sm font-medium">{formatDate(job.applicationDeadline)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('recruitment.salaryRange')}</span>
            </div>
            <p className="text-sm font-medium">
              {job.salaryMin != null && job.salaryMax != null
                ? `${formatCurrency(job.salaryMin)} - ${formatCurrency(job.salaryMax)}`
                : job.salaryMin != null
                  ? `${formatCurrency(job.salaryMin)}+`
                  : '\u2014'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Pipeline, Details, Interviews */}
      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">
            {t('recruitment.applicationsPipeline')} ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="details">{t('recruitment.jobDetails')}</TabsTrigger>
          <TabsTrigger value="interviews">
            {t('recruitment.interviews')} ({interviews.length})
          </TabsTrigger>
        </TabsList>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleScoreAll} disabled={!!actionLoading}>
              {actionLoading === 'score' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {t('recruitment.scoreAll')}
            </Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map(stage => {
              const stageApps = getStageApplications(stage)
              return (
                <div key={stage} className="min-w-[280px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{t(`recruitment.stages.${stage}`)}</h3>
                    <Badge variant="secondary">{stageApps.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[100px] rounded-lg bg-muted/40 p-2">
                    {stageApps.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        {t('recruitment.noApplications')}
                      </p>
                    ) : (
                      stageApps.map(app => (
                        <Card
                          key={app.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => router.push(`/hr/recruitment/applications/${app.id}`)}
                        >
                          <CardContent className="p-3">
                            <p className="font-medium text-sm">{app.applicantName}</p>
                            <p className="text-xs text-muted-foreground">{app.applicantEmail}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {app.autoScore != null && (
                                <Badge variant={app.autoScore >= 70 ? 'default' : 'secondary'} className="text-[10px]">
                                  {app.autoScore}%
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">{formatDate(app.appliedAt)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* Job Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {job.description && (
              <Card>
                <CardHeader><CardTitle className="text-base">{t('recruitment.form.description')}</CardTitle></CardHeader>
                <CardContent><p className="text-sm whitespace-pre-wrap">{job.description}</p></CardContent>
              </Card>
            )}
            {job.responsibilities && (
              <Card>
                <CardHeader><CardTitle className="text-base">{t('recruitment.form.responsibilities')}</CardTitle></CardHeader>
                <CardContent><p className="text-sm whitespace-pre-wrap">{job.responsibilities}</p></CardContent>
              </Card>
            )}
            {job.qualifications && (
              <Card>
                <CardHeader><CardTitle className="text-base">{t('recruitment.form.qualifications')}</CardTitle></CardHeader>
                <CardContent><p className="text-sm whitespace-pre-wrap">{job.qualifications}</p></CardContent>
              </Card>
            )}
            {job.benefits && (
              <Card>
                <CardHeader><CardTitle className="text-base">{t('recruitment.form.benefits')}</CardTitle></CardHeader>
                <CardContent><p className="text-sm whitespace-pre-wrap">{job.benefits}</p></CardContent>
              </Card>
            )}
          </div>

          {/* Requirements section */}
          <Card>
            <CardHeader><CardTitle className="text-base">{t('recruitment.form.requirementsTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {job.minEducation && (
                <div>
                  <span className="text-muted-foreground">{t('recruitment.form.minEducation')}:</span>{' '}
                  <span className="font-medium">{t(`recruitment.education.${job.minEducation}`)}</span>
                </div>
              )}
              {job.minExperience != null && (
                <div>
                  <span className="text-muted-foreground">{t('recruitment.form.minExperience')}:</span>{' '}
                  <span className="font-medium">{job.minExperience} {t('recruitment.form.years')}</span>
                </div>
              )}
              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div>
                  <span className="text-muted-foreground">{t('recruitment.form.requiredSkills')}:</span>{' '}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.requiredSkills.map((skill, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {job.requiredLanguages && job.requiredLanguages.length > 0 && (
                <div>
                  <span className="text-muted-foreground">{t('recruitment.form.requiredLanguages')}:</span>{' '}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.requiredLanguages.map((lang, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{lang}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {job.requiredCertifications && job.requiredCertifications.length > 0 && (
                <div>
                  <span className="text-muted-foreground">{t('recruitment.form.requiredCertifications')}:</span>{' '}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.requiredCertifications.map((cert, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{cert}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interviews Tab */}
        <TabsContent value="interviews" className="space-y-4">
          {interviews.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                {t('recruitment.noInterviews')}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {interviews.map(interview => (
                <Card key={interview.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{interview.applicantName}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`recruitment.interviewTypes.${interview.interviewType}`)} &middot; {formatDate(interview.scheduledAt)} &middot; {interview.duration} {t('recruitment.minutes')}
                        </p>
                        {interview.location && (
                          <p className="text-xs text-muted-foreground mt-0.5">{interview.location}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {interview.rating != null && (
                          <Badge variant="secondary">{interview.rating}/5</Badge>
                        )}
                        <StatusBadge status={interview.status} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
