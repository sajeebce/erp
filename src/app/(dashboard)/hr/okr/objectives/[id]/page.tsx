'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Loader2, ArrowLeft, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useFormatters } from '@/hooks/use-formatters'

interface CheckIn {
  id: string
  previousValue: string
  newValue: string
  progress: string
  note: string | null
  blockers: string | null
  checkInDate: string
  createdById: string
}

interface KeyResult {
  id: string
  title: string
  description: string | null
  resultType: string
  startValue: string
  targetValue: string
  currentValue: string
  progress: string
  status: string
  unit: string | null
  dueDate: string | null
  checkIns: CheckIn[]
}

interface Score {
  id: string
  scoreType: string
  score: string
  comments: string | null
  scorerId: string
  scoredAt: string
}

interface ObjectiveDetail {
  id: string
  title: string
  description: string | null
  ownerType: string
  ownerId: string
  progress: string
  status: string
  score: string | null
  weight: string
  cycle: { id: string; name: string; status: string }
  parentObjective: { id: string; title: string } | null
  childObjectives: { id: string; title: string; ownerType: string; progress: string; status: string }[]
  keyResults: KeyResult[]
  scores: Score[]
}

export default function ObjectiveDetailPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()
  const params = useParams()
  const objectiveId = params.id as string

  const [objective, setObjective] = useState<ObjectiveDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Check-in form state
  const [checkingInKrId, setCheckingInKrId] = useState<string | null>(null)
  const [checkInValue, setCheckInValue] = useState('')
  const [checkInNote, setCheckInNote] = useState('')
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false)

  // Score form state
  const [scoreType, setScoreType] = useState('SELF')
  const [scoreValue, setScoreValue] = useState('')
  const [scoreComment, setScoreComment] = useState('')
  const [submittingScore, setSubmittingScore] = useState(false)

  const fetchObjective = () => {
    setLoading(true)
    fetch(`/api/v1/hr/okr/objectives/${objectiveId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setObjective(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchObjective() }, [objectiveId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckIn = async (krId: string) => {
    if (!checkInValue) return
    setSubmittingCheckIn(true)
    try {
      const res = await fetch(`/api/v1/hr/okr/key-results/${krId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newValue: Number(checkInValue),
          note: checkInNote || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setCheckingInKrId(null)
        setCheckInValue('')
        setCheckInNote('')
        fetchObjective()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingCheckIn(false)
    }
  }

  const handleScore = async () => {
    if (!scoreValue) return
    setSubmittingScore(true)
    try {
      const res = await fetch(`/api/v1/hr/okr/objectives/${objectiveId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoreType,
          score: Number(scoreValue),
          comments: scoreComment || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setScoreValue('')
        setScoreComment('')
        fetchObjective()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingScore(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!objective) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Objective not found
      </div>
    )
  }

  const selfScore = objective.scores.find(s => s.scoreType === 'SELF')
  const managerScore = objective.scores.find(s => s.scoreType === 'MANAGER')
  const peerScore = objective.scores.find(s => s.scoreType === 'PEER')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/hr/okr">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {tc('buttons.back')}
          </Link>
        </Button>
      </div>

      {/* Objective Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1 flex-1">
              <h1 className="text-2xl font-bold">{objective.title}</h1>
              {objective.description && (
                <p className="text-muted-foreground">{objective.description}</p>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{objective.cycle.name}</span>
                <span>{t(`okr.${objective.ownerType.toLowerCase()}`)}</span>
                {objective.parentObjective && (
                  <Link
                    href={`/hr/okr/objectives/${objective.parentObjective.id}`}
                    className="hover:underline"
                  >
                    {t('okr.parentObjective')}: {objective.parentObjective.title}
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={objective.status} />
              {objective.score !== null && (
                <span className="text-lg font-bold font-mono">
                  {Number(objective.score).toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={Number(objective.progress)} className="flex-1" />
            <span className="text-sm font-mono font-medium w-12 text-right">
              {Number(objective.progress).toFixed(0)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Child Objectives */}
      {objective.childObjectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('okr.objectives')} ({objective.childObjectives.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {objective.childObjectives.map(child => (
                <Link
                  key={child.id}
                  href={`/hr/okr/objectives/${child.id}`}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{child.title}</span>
                    <StatusBadge status={child.status} />
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {Number(child.progress).toFixed(0)}%
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('okr.keyResults')}</h2>

        {objective.keyResults.map((kr) => (
          <Card key={kr.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-base">{kr.title}</CardTitle>
                  {kr.description && (
                    <p className="text-sm text-muted-foreground">{kr.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={kr.status} />
                  {checkingInKrId !== kr.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCheckingInKrId(kr.id)
                        setCheckInValue(String(Number(kr.currentValue)))
                        setCheckInNote('')
                      }}
                    >
                      {t('okr.checkIn')}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress info */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {t('okr.currentValue')}: <strong className="font-mono">{Number(kr.currentValue)}</strong>
                </span>
                <span className="text-muted-foreground">
                  {t('okr.targetValue')}: <strong className="font-mono">{Number(kr.targetValue)}</strong>
                </span>
                {kr.unit && (
                  <span className="text-muted-foreground">
                    {t('okr.unit')}: {kr.unit}
                  </span>
                )}
                {kr.dueDate && (
                  <span className="text-muted-foreground">
                    {t('okr.dueDate')}: {formatDate(kr.dueDate)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Progress value={Number(kr.progress)} className="flex-1" />
                <span className="text-sm font-mono w-12 text-right">
                  {Number(kr.progress).toFixed(0)}%
                </span>
              </div>

              {/* Inline check-in form */}
              {checkingInKrId === kr.id && (
                <div className="p-4 rounded-md border bg-muted/30 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm">{t('okr.currentValue')}</Label>
                      <Input
                        type="number"
                        value={checkInValue}
                        onChange={(e) => setCheckInValue(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">{t('okr.note')}</Label>
                    <Textarea
                      value={checkInNote}
                      onChange={(e) => setCheckInNote(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCheckingInKrId(null)
                        setCheckInValue('')
                        setCheckInNote('')
                      }}
                    >
                      {tc('buttons.cancel')}
                    </Button>
                    <Button
                      size="sm"
                      disabled={submittingCheckIn || !checkInValue}
                      onClick={() => handleCheckIn(kr.id)}
                    >
                      {submittingCheckIn && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                      {t('okr.submitCheckIn')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Check-in History Timeline */}
              {kr.checkIns.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('okr.checkInHistory')} ({kr.checkIns.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {kr.checkIns.map((ci) => (
                      <div key={ci.id} className="flex items-start gap-3 p-2 rounded-md border text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {Number(ci.previousValue)} &rarr; {Number(ci.newValue)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({Number(ci.progress).toFixed(0)}%)
                            </span>
                          </div>
                          {ci.note && (
                            <p className="text-muted-foreground text-xs mt-0.5">{ci.note}</p>
                          )}
                          {ci.blockers && (
                            <p className="text-destructive text-xs mt-0.5">
                              {t('okr.blockers')}: {ci.blockers}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(ci.checkInDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scoring Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('okr.scoreObjective')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-md border text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('okr.selfScore')}</p>
              <p className="text-xl font-bold font-mono">
                {selfScore ? Number(selfScore.score).toFixed(2) : '--'}
              </p>
            </div>
            <div className="p-3 rounded-md border text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('okr.managerScore')}</p>
              <p className="text-xl font-bold font-mono">
                {managerScore ? Number(managerScore.score).toFixed(2) : '--'}
              </p>
            </div>
            <div className="p-3 rounded-md border text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('okr.peerScore')}</p>
              <p className="text-xl font-bold font-mono">
                {peerScore ? Number(peerScore.score).toFixed(2) : '--'}
              </p>
            </div>
          </div>

          {/* Score form */}
          <div className="p-4 rounded-md border bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">{t('okr.resultType')}</Label>
                <select
                  className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  value={scoreType}
                  onChange={(e) => setScoreType(e.target.value)}
                >
                  <option value="SELF">{t('okr.selfScore')}</option>
                  <option value="MANAGER">{t('okr.managerScore')}</option>
                  <option value="PEER">{t('okr.peerScore')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">{t('okr.score')} (0.00 - 1.00)</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={scoreValue}
                  onChange={(e) => setScoreValue(e.target.value)}
                  placeholder="0.75"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">{t('okr.note')}</Label>
              <Textarea
                value={scoreComment}
                onChange={(e) => setScoreComment(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={submittingScore || !scoreValue}
                onClick={handleScore}
              >
                {submittingScore && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                {t('okr.scoreObjective')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
