'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Loader2, Target, TrendingUp, AlertTriangle, TrendingDown, Plus, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AnalyticsData {
  cycleId: string
  totalObjectives: number
  onTrack: { count: number; percentage: number }
  atRisk: { count: number; percentage: number }
  behind: { count: number; percentage: number }
  completionRate: number
  adoptionRate: number
  averageProgress: number
  averageScore: number | null
}

interface KeyResult {
  id: string
  title: string
  resultType: string
  startValue: string
  targetValue: string
  currentValue: string
  progress: string
  status: string
  unit: string | null
  _count: { checkIns: number }
}

interface Objective {
  id: string
  title: string
  description: string | null
  ownerType: string
  progress: string
  status: string
  score: string | null
  cycle: { id: string; name: string; status: string }
  keyResults: KeyResult[]
  parentObjective: { id: string; title: string } | null
}

interface MyOKRsData {
  employee: { id: string; fullName: string }
  objectives: Objective[]
}

interface Cycle {
  id: string
  name: string
  status: string
}

export default function OKRDashboardPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [myOKRs, setMyOKRs] = useState<MyOKRsData | null>(null)
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [selectedCycleId, setSelectedCycleId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [checkInValue, setCheckInValue] = useState('')
  const [checkInNote, setCheckInNote] = useState('')
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false)

  // Fetch cycles first
  useEffect(() => {
    fetch('/api/v1/hr/okr/cycles?limit=50')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.length > 0) {
          setCycles(json.data)
          const activeCycle = json.data.find((c: Cycle) => c.status === 'ACTIVE') || json.data[0]
          setSelectedCycleId(activeCycle.id)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Fetch analytics and my-okrs when cycle changes
  useEffect(() => {
    if (!selectedCycleId) return

    setLoading(true)
    Promise.all([
      fetch(`/api/v1/hr/okr/analytics?cycleId=${selectedCycleId}`)
        .then(res => res.json())
        .then(json => { if (json.success) setAnalytics(json.data) }),
      fetch(`/api/v1/hr/okr/my-okrs?cycleId=${selectedCycleId}`)
        .then(res => res.json())
        .then(json => { if (json.success) setMyOKRs(json.data) }),
    ])
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedCycleId])

  const handleCheckIn = async (krId: string) => {
    if (!checkInValue) return
    setSubmittingCheckIn(true)
    try {
      const res = await fetch(`/api/v1/hr/okr/key-results/${krId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newValue: Number(checkInValue), note: checkInNote }),
      })
      const json = await res.json()
      if (json.success) {
        setCheckingIn(null)
        setCheckInValue('')
        setCheckInNote('')
        // Refresh data
        const myRes = await fetch(`/api/v1/hr/okr/my-okrs?cycleId=${selectedCycleId}`)
        const myJson = await myRes.json()
        if (myJson.success) setMyOKRs(myJson.data)
        const anaRes = await fetch(`/api/v1/hr/okr/analytics?cycleId=${selectedCycleId}`)
        const anaJson = await anaRes.json()
        if (anaJson.success) setAnalytics(anaJson.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingCheckIn(false)
    }
  }

  if (loading && cycles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Empty state: no cycles at all
  if (cycles.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('okr.title')} description={t('okr.description')} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-4">{t('okr.noCycles')}</p>
            <Button asChild>
              <Link href="/hr/okr/cycles">
                <Plus className="h-4 w-4 mr-2" />
                {t('okr.createCycle')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const kpiCards = [
    {
      title: t('okr.objectives'),
      value: analytics?.totalObjectives ?? 0,
      icon: Target,
      color: 'text-blue-600',
    },
    {
      title: t('okr.onTrack'),
      value: analytics?.onTrack.count ?? 0,
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
    {
      title: t('okr.atRisk'),
      value: analytics?.atRisk.count ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
    },
    {
      title: t('okr.behind'),
      value: analytics?.behind.count ?? 0,
      icon: TrendingDown,
      color: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('okr.title')} description={t('okr.description')}>
        <div className="flex items-center gap-2">
          <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cycles.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild variant="outline" size="sm">
            <Link href="/hr/okr/cycles">{t('okr.cycles')}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/hr/okr/objectives/new">
              <Plus className="h-4 w-4 mr-2" />
              {t('okr.createObjective')}
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/hr/okr/alignment">
            {t('okr.alignmentTree')}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* My OKRs Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('okr.myOKRs')}</h2>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !myOKRs || myOKRs.objectives.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">{t('okr.noObjectives')}</p>
              <Button asChild size="sm">
                <Link href="/hr/okr/objectives/new">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('okr.createObjective')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myOKRs.objectives.map((obj) => (
              <Card key={obj.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <Link
                        href={`/hr/okr/objectives/${obj.id}`}
                        className="font-semibold hover:underline line-clamp-1"
                      >
                        {obj.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{obj.cycle.name}</p>
                    </div>
                    <StatusBadge status={obj.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={Number(obj.progress)} className="flex-1" />
                    <span className="text-sm font-mono text-muted-foreground w-12 text-right">
                      {Number(obj.progress).toFixed(0)}%
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t('okr.keyResults')}
                    </p>
                    {obj.keyResults.map((kr) => (
                      <div key={kr.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[200px]">{kr.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono">
                              {Number(kr.currentValue)}/{Number(kr.targetValue)}
                              {kr.unit ? ` ${kr.unit}` : ''}
                            </span>
                            {checkingIn !== kr.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => {
                                  setCheckingIn(kr.id)
                                  setCheckInValue(String(Number(kr.currentValue)))
                                  setCheckInNote('')
                                }}
                              >
                                {t('okr.checkIn')}
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={Number(kr.progress)} className="flex-1 h-1.5" />
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {Number(kr.progress).toFixed(0)}%
                          </span>
                        </div>

                        {/* Inline check-in form */}
                        {checkingIn === kr.id && (
                          <div className="mt-2 p-3 rounded-md border bg-muted/30 space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={checkInValue}
                                onChange={(e) => setCheckInValue(e.target.value)}
                                className="flex-1 h-8 rounded-md border bg-background px-2 text-sm"
                                placeholder={t('okr.currentValue')}
                              />
                            </div>
                            <textarea
                              value={checkInNote}
                              onChange={(e) => setCheckInNote(e.target.value)}
                              className="w-full h-16 rounded-md border bg-background px-2 py-1 text-sm resize-none"
                              placeholder={t('okr.note')}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setCheckingIn(null)
                                  setCheckInValue('')
                                  setCheckInNote('')
                                }}
                              >
                                {tc('buttons.cancel')}
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                disabled={submittingCheckIn || !checkInValue}
                                onClick={() => handleCheckIn(kr.id)}
                              >
                                {submittingCheckIn && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                {t('okr.submitCheckIn')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
