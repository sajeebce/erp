'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft, Loader2, Pencil, Send, XCircle, MapPin, Building2,
  Briefcase, Users, CalendarDays, DollarSign, Calculator, RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'
import { ShareJobLinkButton } from '@/components/hr/share-job-link-button'

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
  slug: string
  organization: { slug: string }
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
  requiredLanguages: ({ language: string; level?: string } | string)[] | null
  requiredCertifications: string[] | null
  status: string
  createdAt: string
}

function formatRequiredLanguage(language: { language: string; level?: string } | string) {
  if (typeof language === 'string') return language
  return [language.language, language.level].filter(Boolean).join(' - ')
}

interface Application {
  id: string
  applicantName: string
  applicantEmail: string
  stage?: string
  status?: string
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
  const searchParams = useSearchParams()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate, formatCurrency } = useFormatters()

  const [job, setJob] = useState<JobPosting | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [allApplications, setAllApplications] = useState<Application[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [allApplicationsLoading, setAllApplicationsLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([])
  const [bulkTargetStage, setBulkTargetStage] = useState<(typeof PIPELINE_STAGES)[number]>('SCREENED')

  const q = searchParams.get('q') || ''
  const minScore = searchParams.get('minScore') || ''
  const skillsParam = searchParams.get('skills') || ''
  const selectedSkills = useMemo(
    () => skillsParam.split(',').map((skill) => skill.trim()).filter(Boolean),
    [skillsParam]
  )
  const selectedSkillsKey = selectedSkills.join(',')
  const hasActiveFilters = Boolean(q || minScore || selectedSkills.length > 0)
  const selectedApplicationIdSet = useMemo(
    () => new Set(selectedApplicationIds),
    [selectedApplicationIds]
  )
  const allVisibleSelected = applications.length > 0
    && applications.every((application) => selectedApplicationIdSet.has(application.id))
  const allApplicationRowsSelected = allApplications.length > 0
    && allApplications.every((application) => selectedApplicationIdSet.has(application.id))

  const fetchApplications = useCallback(async () => {
    if (!params.id) return

    const query = new URLSearchParams()
    query.set('limit', '100')
    if (q) query.set('q', q)
    if (minScore) query.set('minScore', minScore)
    if (selectedSkills.length > 0) query.set('skills', selectedSkills.join(','))

    setApplicationsLoading(true)
    try {
      const res = await fetch(`/api/v1/hr/recruitment/jobs/${params.id}/applications?${query.toString()}`)
      const json = await res.json()
      if (json.success) {
        setApplications(json.data)
        setSelectedApplicationIds((current) => {
          const visibleIds = new Set(json.data.map((application: Application) => application.id))
          return current.filter((id) => visibleIds.has(id))
        })
      }
    } catch {
      setError(t('recruitment.form.actionFailed'))
    } finally {
      setApplicationsLoading(false)
    }
  }, [params.id, q, minScore, selectedSkills, t])

  const fetchAllApplications = useCallback(async () => {
    if (!params.id) return

    setAllApplicationsLoading(true)
    try {
      const res = await fetch(`/api/v1/hr/recruitment/jobs/${params.id}/applications?limit=500`)
      const json = await res.json()
      if (json.success) {
        setAllApplications(json.data)
      }
    } catch {
      setError(t('recruitment.form.actionFailed'))
    } finally {
      setAllApplicationsLoading(false)
    }
  }, [params.id, t])

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

    fetch(`/api/v1/hr/recruitment/interviews?jobId=${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setInterviews(
            json.data.map((interview: {
              id: string
              interviewType: string
              scheduledAt: string
              durationMinutes: number
              location: string | null
              status: string
              overallRating: number | null
              application: { applicantName: string }
            }) => ({
              id: interview.id,
              applicantName: interview.application.applicantName,
              interviewType: interview.interviewType,
              scheduledAt: interview.scheduledAt,
              duration: interview.durationMinutes,
              location: interview.location || '',
              status: interview.status,
              rating: interview.overallRating,
            }))
          )
        }
      })
      .catch(() => {})
  }, [params.id, tc])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications, selectedSkillsKey])

  useEffect(() => {
    fetchAllApplications()
  }, [fetchAllApplications])

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
        setSelectedApplicationIds([])
        await fetchAllApplications()
      }
    } catch {
      setError(t('recruitment.form.actionFailed'))
    } finally {
      setActionLoading('')
    }
  }

  function getStageApplications(stage: string) {
    return applications.filter(a => (a.stage || a.status) === stage)
  }

  function toggleApplicationSelection(applicationId: string) {
    setSelectedApplicationIds((current) => (
      current.includes(applicationId)
        ? current.filter((id) => id !== applicationId)
        : [...current, applicationId]
    ))
  }

  function toggleAllVisibleApplications() {
    setSelectedApplicationIds(allVisibleSelected ? [] : applications.map((application) => application.id))
  }

  function toggleAllApplicationRows() {
    setSelectedApplicationIds(allApplicationRowsSelected ? [] : allApplications.map((application) => application.id))
  }

  async function handleBulkStage(mode: 'ids' | 'filtered') {
    setActionLoading(`bulk-${mode}`)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/recruitment/jobs/${params.id}/bulk-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          targetStage: bulkTargetStage,
          applicationIds: mode === 'ids' ? selectedApplicationIds : undefined,
          filters: mode === 'filtered'
            ? { q, minScore, skills: selectedSkills }
            : undefined,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        await Promise.all([fetchApplications(), fetchAllApplications()])
        setSelectedApplicationIds([])
      } else {
        setError(json.error?.message || t('recruitment.form.actionFailed'))
      }
    } catch {
      setError(t('recruitment.form.actionFailed'))
    } finally {
      setActionLoading('')
    }
  }

  function updateFilters(next: { q?: string; minScore?: string; skills?: string[] }) {
    const query = new URLSearchParams(searchParams.toString())
    const nextQ = next.q ?? q
    const nextMinScore = next.minScore ?? minScore
    const nextSkills = next.skills ?? selectedSkills

    if (nextQ) query.set('q', nextQ)
    else query.delete('q')

    if (nextMinScore) query.set('minScore', nextMinScore)
    else query.delete('minScore')

    if (nextSkills.length > 0) query.set('skills', nextSkills.join(','))
    else query.delete('skills')

    router.replace(`/hr/recruitment/${params.id}?${query.toString()}`)
  }

  function toggleSkillFilter(skill: string) {
    const exists = selectedSkills.some((item) => item.toLowerCase() === skill.toLowerCase())
    updateFilters({
      skills: exists
        ? selectedSkills.filter((item) => item.toLowerCase() !== skill.toLowerCase())
        : [...selectedSkills, skill],
    })
  }

  function selectedSkillLabel() {
    if (selectedSkills.length === 0) return 'Select skills'
    if (selectedSkills.length === 1) return selectedSkills[0]
    return `${selectedSkills[0]} +${selectedSkills.length - 1} more`
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
          <ShareJobLinkButton orgSlug={job.organization.slug} jobSlug={job.slug} status={job.status} />
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

      {/* Tabs: Applications, Pipeline, Details, Interviews */}
      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">
            Applications ({allApplications.length})
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            {t('recruitment.applicationsPipeline')} ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="details">{t('recruitment.jobDetails')}</TabsTrigger>
          <TabsTrigger value="interviews">
            {t('recruitment.interviews')} ({interviews.length})
          </TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 md:flex-row md:items-center md:justify-between">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={allApplicationRowsSelected}
                onCheckedChange={toggleAllApplicationRows}
                disabled={allApplications.length === 0 || allApplicationsLoading}
              />
              Select all applications ({allApplications.length})
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm text-muted-foreground">
                {selectedApplicationIds.length} selected
              </span>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={bulkTargetStage}
                onChange={(event) => setBulkTargetStage(event.target.value as typeof PIPELINE_STAGES[number])}
              >
                {PIPELINE_STAGES.slice(1).map((stage) => (
                  <option key={stage} value={stage}>
                    Move to {t(`recruitment.stages.${stage}`)}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={() => handleBulkStage('ids')}
                disabled={selectedApplicationIds.length === 0 || !!actionLoading}
              >
                {actionLoading === 'bulk-ids' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Move Selected
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {allApplicationsLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading applications...
                </div>
              ) : allApplications.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {t('recruitment.noApplications')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left">
                      <tr>
                        <th className="w-12 px-4 py-3">
                          <Checkbox
                            checked={allApplicationRowsSelected}
                            onCheckedChange={toggleAllApplicationRows}
                            aria-label="Select all applications"
                          />
                        </th>
                        <th className="px-4 py-3 font-medium">Applicant</th>
                        <th className="px-4 py-3 font-medium">Email</th>
                        <th className="px-4 py-3 font-medium">Stage</th>
                        <th className="px-4 py-3 font-medium">Score</th>
                        <th className="px-4 py-3 font-medium">Applied</th>
                        <th className="px-4 py-3 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allApplications.map((app) => {
                        const currentAppStage = app.stage || app.status || 'APPLIED'
                        return (
                          <tr key={app.id} className="border-b last:border-b-0 hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={selectedApplicationIdSet.has(app.id)}
                                onCheckedChange={() => toggleApplicationSelection(app.id)}
                                aria-label={`Select ${app.applicantName}`}
                              />
                            </td>
                            <td className="px-4 py-3 font-medium">{app.applicantName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{app.applicantEmail}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={currentAppStage} />
                            </td>
                            <td className="px-4 py-3">
                              {app.autoScore != null ? (
                                <Badge variant={app.autoScore >= 70 ? 'default' : 'secondary'}>
                                  {app.autoScore}%
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(app.appliedAt)}</td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/hr/recruitment/applications/${app.id}`)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="sticky top-0 z-10 flex flex-col gap-3 rounded-lg border bg-background p-3 md:flex-row md:items-end">
            <div className="min-w-0 flex-1 space-y-1">
              <label htmlFor="pipeline-search" className="text-xs font-medium text-muted-foreground">Search</label>
              <input
                id="pipeline-search"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={q}
                onChange={(e) => updateFilters({ q: e.target.value })}
                placeholder="Search name/email..."
              />
            </div>
            <div className="w-full space-y-1 md:w-40">
              <label htmlFor="pipeline-min-score" className="text-xs font-medium text-muted-foreground">Min score</label>
              <input
                id="pipeline-min-score"
                type="number"
                min="0"
                max="100"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={minScore}
                onChange={(e) => updateFilters({ minScore: e.target.value })}
                placeholder="60"
              />
            </div>
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="min-w-0 flex-1 space-y-1 md:max-w-xs">
                <label className="text-xs font-medium text-muted-foreground">Skills</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 w-full justify-between px-3 font-normal">
                      <span className="truncate">{selectedSkillLabel()}</span>
                      {selectedSkills.length > 0 && (
                        <Badge variant="secondary" className="ml-2 shrink-0">{selectedSkills.length}</Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-72 w-72 overflow-y-auto">
                    {job.requiredSkills.map((skill) => {
                      const selected = selectedSkills.some((item) => item.toLowerCase() === skill.toLowerCase())
                      return (
                        <DropdownMenuItem
                          key={skill}
                          onSelect={(event) => {
                            event.preventDefault()
                            toggleSkillFilter(skill)
                          }}
                          className="gap-2"
                        >
                          <Checkbox checked={selected} aria-hidden="true" />
                          <span className="truncate">{skill}</span>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedSkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkillFilter(skill)}
                        className="rounded-md border bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        {skill} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.replace(`/hr/recruitment/${params.id}`)}
              disabled={!q && !minScore && selectedSkills.length === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleScoreAll} disabled={!!actionLoading}>
              {actionLoading === 'score' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              {t('recruitment.scoreAll')}
            </Button>
          </div>
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 md:flex-row md:items-center md:justify-between">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={toggleAllVisibleApplications}
                disabled={applications.length === 0 || applicationsLoading}
              />
              Select visible ({applications.length})
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm text-muted-foreground">
                {selectedApplicationIds.length} selected
              </span>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={bulkTargetStage}
                onChange={(event) => setBulkTargetStage(event.target.value as typeof PIPELINE_STAGES[number])}
              >
                {PIPELINE_STAGES.slice(1).map((stage) => (
                  <option key={stage} value={stage}>
                    Move to {t(`recruitment.stages.${stage}`)}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStage('ids')}
                disabled={selectedApplicationIds.length === 0 || !!actionLoading}
              >
                {actionLoading === 'bulk-ids' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Move Selected
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkStage('filtered')}
                disabled={!hasActiveFilters || applications.length === 0 || !!actionLoading}
                title={hasActiveFilters ? undefined : 'Use score/search/skill filters first'}
              >
                {actionLoading === 'bulk-filtered' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Move Filtered
              </Button>
            </div>
          </div>
          {applicationsLoading && (
            <div className="text-sm text-muted-foreground">Loading filtered applications...</div>
          )}

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
                            <div className="flex items-start gap-2">
                              <Checkbox
                                checked={selectedApplicationIdSet.has(app.id)}
                                onClick={(event) => event.stopPropagation()}
                                onCheckedChange={() => toggleApplicationSelection(app.id)}
                                aria-label={`Select ${app.applicantName}`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm">{app.applicantName}</p>
                                <p className="text-xs text-muted-foreground">{app.applicantEmail}</p>
                              </div>
                            </div>
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
                      <Badge key={i} variant="outline" className="text-xs">{formatRequiredLanguage(lang)}</Badge>
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
