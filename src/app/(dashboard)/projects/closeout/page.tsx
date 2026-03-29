'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Plus,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

// ---------- types ----------

interface Project {
  id: string
  name: string
  projectNo: string
  status: string
}

interface CloseoutItem {
  id: string
  name: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  dueDate: string | null
  completedDate: string | null
  notes: string | null
}

interface Closeout {
  id: string
  projectId: string
  progress: number
  status: string
  createdAt: string
  project?: { id: string; name: string; projectNo: string }
  items: CloseoutItem[]
}

const ITEM_STATUS_CYCLE: Record<string, 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'> = {
  NOT_STARTED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: 'NOT_STARTED',
}

// ---------- component ----------

export default function ProjectCloseoutPage() {
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [closeouts, setCloseouts] = useState<Closeout[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  // initiate dialog
  const [showInitiate, setShowInitiate] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [initiating, setInitiating] = useState(false)

  // ---------- data fetching ----------

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/projects?limit=100')
      if (res.ok) {
        const json = await res.json()
        const list = json.data ?? json.projects ?? json ?? []
        setProjects(Array.isArray(list) ? list : [])
      }
    } catch {
      /* silent */
    }
  }, [])

  const fetchCloseouts = useCallback(async () => {
    try {
      // Fetch closeouts for all projects
      const res = await fetch('/api/v1/projects/closeout')
      if (res.ok) {
        const json = await res.json()
        const list = json.data ?? json.closeouts ?? json ?? []
        setCloseouts(Array.isArray(list) ? list : [])
      }
    } catch {
      /* silent */
    }
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      await Promise.all([fetchProjects(), fetchCloseouts()])
      setLoading(false)
    }
    load()
  }, [fetchProjects, fetchCloseouts])

  // ---------- actions ----------

  async function handleInitiate() {
    if (!selectedProjectId) return
    setInitiating(true)
    try {
      const res = await fetch('/api/v1/projects/closeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId }),
      })
      if (res.ok) {
        await fetchCloseouts()
        setShowInitiate(false)
        setSelectedProjectId('')
      }
    } catch {
      /* silent */
    } finally {
      setInitiating(false)
    }
  }

  async function handleToggleStatus(closeoutId: string, item: CloseoutItem) {
    const nextStatus = ITEM_STATUS_CYCLE[item.status] ?? 'NOT_STARTED'
    setToggling(item.id)
    try {
      const res = await fetch(`/api/v1/projects/closeout/${closeoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, status: nextStatus, notes: item.notes }),
      })
      if (res.ok) {
        await fetchCloseouts()
      }
    } catch {
      /* silent */
    } finally {
      setToggling(null)
    }
  }

  // ---------- computed ----------

  const projectsInCloseout = closeouts.length
  const fullyClosed = closeouts.filter(c => c.progress === 100).length
  const pendingItemsTotal = closeouts.reduce(
    (sum, c) => sum + (c.items?.filter(i => i.status !== 'COMPLETED').length ?? 0),
    0,
  )

  // Projects eligible for initiation (COMPLETED/CLOSED, not already in closeout)
  const closeoutProjectIds = new Set(closeouts.map(c => c.projectId))
  const eligibleProjects = projects.filter(
    p => ['COMPLETED', 'CLOSED'].includes(p.status) && !closeoutProjectIds.has(p.id),
  )

  function getStatusIcon(status: string) {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-amber-500" />
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }

  // ---------- render ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('closeout.title')}>
        <Button size="sm" onClick={() => setShowInitiate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('closeout.initiate')}
        </Button>
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('closeout.projectsInCloseout')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{projectsInCloseout}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('closeout.fullyClosed')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fullyClosed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('closeout.pendingItemsTotal')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingItemsTotal}</p>
          </CardContent>
        </Card>
      </div>

      {/* Closeout process cards */}
      {closeouts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {tc('noData')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {closeouts.map(closeout => {
            const completedCount = closeout.items?.filter(i => i.status === 'COMPLETED').length ?? 0
            const totalCount = closeout.items?.length ?? 0
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

            return (
              <Card key={closeout.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        {closeout.project?.name ?? t('closeout.title')}
                      </CardTitle>
                      {closeout.project?.projectNo && (
                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                          {closeout.project.projectNo}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={progress === 100 ? 'COMPLETED' : 'IN_PROGRESS'} />
                      <p className="text-sm font-medium mt-1">
                        {completedCount}/{totalCount} {t('closeout.complete')}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('closeout.closeoutProgress')}</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(closeout.items ?? []).map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className="flex items-start gap-3 rounded-md border p-3 text-left hover:bg-accent/50 transition-colors w-full"
                        disabled={toggling === item.id}
                        onClick={() => handleToggleStatus(closeout.id, item)}
                      >
                        <div className="mt-0.5">
                          {toggling === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            getStatusIcon(item.status)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-sm font-medium ${item.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {item.name}
                            </p>
                            <StatusBadge status={item.status} />
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {item.dueDate && (
                              <span>
                                {t('closeout.due')}: {formatDate(item.dueDate)}
                              </span>
                            )}
                            {item.completedDate && (
                              <span>
                                {t('closeout.done')}: {formatDate(item.completedDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Initiate Closeout Dialog */}
      <Dialog open={showInitiate} onOpenChange={setShowInitiate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('closeout.initiate')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{tc('project')}</Label>
              <SearchableSelect
                options={eligibleProjects.map(p => ({
                  value: p.id,
                  label: `${p.projectNo ? p.projectNo + ' - ' : ''}${p.name}`,
                }))}
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                placeholder={tc('selectProject')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInitiate(false)}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleInitiate} disabled={!selectedProjectId || initiating}>
              {initiating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('closeout.initiate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
