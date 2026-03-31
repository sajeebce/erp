'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Loader2, ChevronRight, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface AlignmentKeyResult {
  id: string
  title: string
  progress: string
  status: string
}

interface AlignmentNode {
  id: string
  title: string
  ownerType: string
  ownerId: string
  progress: string
  status: string
  keyResults: AlignmentKeyResult[]
  children: AlignmentNode[]
}

interface Cycle {
  id: string
  name: string
  status: string
}

function AlignmentTreeNode({ node, depth = 0 }: { node: AlignmentNode; depth?: number }) {
  const t = useTranslations('hr')
  const [open, setOpen] = useState(depth < 2)

  const hasChildren = node.children.length > 0
  const progressNum = Number(node.progress)

  const progressColor = progressNum >= 70
    ? 'text-emerald-600'
    : progressNum >= 30
      ? 'text-amber-600'
      : 'text-red-600'

  const dotColor = progressNum >= 70
    ? 'bg-emerald-500'
    : progressNum >= 30
      ? 'bg-amber-500'
      : 'bg-red-500'

  return (
    <div className={depth > 0 ? 'ml-6 border-l pl-4' : ''}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2 py-2">
          {(hasChildren || node.keyResults.length > 0) ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}

          <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotColor}`} />

          <Link
            href={`/hr/okr/objectives/${node.id}`}
            className="font-medium hover:underline text-sm flex-1 min-w-0 truncate"
          >
            {node.title}
          </Link>

          <span className="text-xs text-muted-foreground shrink-0">
            {t(`okr.${node.ownerType.toLowerCase()}`)}
          </span>

          <span className={`text-xs font-mono font-medium shrink-0 w-10 text-right ${progressColor}`}>
            {progressNum.toFixed(0)}%
          </span>

          <StatusBadge status={node.status} />
        </div>

        <CollapsibleContent>
          {/* Key Results */}
          {node.keyResults.length > 0 && (
            <div className="ml-8 mb-2 space-y-1">
              {node.keyResults.map(kr => (
                <div key={kr.id} className="flex items-center gap-2 text-xs py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-muted-foreground">{kr.title}</span>
                  <Progress value={Number(kr.progress)} className="w-20 h-1" />
                  <span className="font-mono text-muted-foreground w-8 text-right">
                    {Number(kr.progress).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Child Objectives */}
          {node.children.map(child => (
            <AlignmentTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default function AlignmentPage() {
  const t = useTranslations('hr')

  const [cycles, setCycles] = useState<Cycle[]>([])
  const [selectedCycleId, setSelectedCycleId] = useState('')
  const [tree, setTree] = useState<AlignmentNode[]>([])
  const [totalObjectives, setTotalObjectives] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch cycles
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

  // Fetch alignment tree when cycle changes
  useEffect(() => {
    if (!selectedCycleId) return
    setLoading(true)
    fetch(`/api/v1/hr/okr/alignment?cycleId=${selectedCycleId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setTree(json.data.tree || [])
          setTotalObjectives(json.data.totalObjectives || 0)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedCycleId])

  if (loading && cycles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('okr.alignmentTree')} description={t('okr.description')}>
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
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('okr.alignment')} ({totalObjectives} {t('okr.objectives').toLowerCase()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Target className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t('okr.noObjectives')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map(node => (
                <AlignmentTreeNode key={node.id} node={node} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
