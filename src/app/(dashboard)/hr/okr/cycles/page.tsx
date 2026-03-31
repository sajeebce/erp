'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Plus, Play, ClipboardCheck, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useFormatters } from '@/hooks/use-formatters'

interface Cycle {
  id: string
  name: string
  cycleType: string
  startDate: string
  endDate: string
  status: string
  checkInFrequency: string
  _count: { objectives: number }
}

export default function OKRCyclesPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatDate } = useFormatters()

  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [transitioning, setTransitioning] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formCycleType, setFormCycleType] = useState('QUARTERLY')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')

  const fetchCycles = useCallback(() => {
    setLoading(true)
    fetch('/api/v1/hr/okr/cycles?limit=50')
      .then(res => res.json())
      .then(json => {
        if (json.success) setCycles(json.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchCycles() }, [fetchCycles])

  const handleCreateCycle = async () => {
    if (!formName || !formStartDate || !formEndDate) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/hr/okr/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          cycleType: formCycleType,
          startDate: formStartDate,
          endDate: formEndDate,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setDialogOpen(false)
        setFormName('')
        setFormCycleType('QUARTERLY')
        setFormStartDate('')
        setFormEndDate('')
        fetchCycles()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusTransition = async (cycleId: string, newStatus: string) => {
    setTransitioning(cycleId)
    try {
      const res = await fetch(`/api/v1/hr/okr/cycles/${cycleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (json.success) fetchCycles()
    } catch (err) {
      console.error(err)
    } finally {
      setTransitioning(null)
    }
  }

  const getTransitionButton = (cycle: Cycle) => {
    const isTransitioning = transitioning === cycle.id

    switch (cycle.status) {
      case 'PLANNING':
        return (
          <Button
            variant="outline"
            size="sm"
            disabled={isTransitioning}
            onClick={() => handleStatusTransition(cycle.id, 'ACTIVE')}
          >
            {isTransitioning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
            {t('okr.startCycle')}
          </Button>
        )
      case 'ACTIVE':
        return (
          <Button
            variant="outline"
            size="sm"
            disabled={isTransitioning}
            onClick={() => handleStatusTransition(cycle.id, 'SCORING')}
          >
            {isTransitioning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ClipboardCheck className="h-3 w-3 mr-1" />}
            {t('okr.scoreObjective')}
          </Button>
        )
      case 'SCORING':
        return (
          <Button
            variant="outline"
            size="sm"
            disabled={isTransitioning}
            onClick={() => handleStatusTransition(cycle.id, 'CLOSED')}
          >
            {isTransitioning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
            {t('okr.closeCycle')}
          </Button>
        )
      default:
        return null
    }
  }

  if (loading && cycles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('okr.cycles')} description={t('okr.description')}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('okr.createCycle')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('okr.createCycle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cycleName">{t('okr.cycleName')}</Label>
                <Input
                  id="cycleName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Q1 2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycleType">{t('okr.cycleType')}</Label>
                <Select value={formCycleType} onValueChange={setFormCycleType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUARTERLY">{t('okr.quarterly')}</SelectItem>
                    <SelectItem value="ANNUAL">{t('okr.annual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t('fields.startDate')}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">{t('fields.endDate')}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateCycle}
                disabled={submitting || !formName || !formStartDate || !formEndDate}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('okr.createCycle')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('okr.cycles')}</CardTitle>
        </CardHeader>
        <CardContent>
          {cycles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>{t('okr.noCycles')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('okr.cycleName')}</TableHead>
                  <TableHead>{t('okr.cycleType')}</TableHead>
                  <TableHead>{t('fields.startDate')}</TableHead>
                  <TableHead>{t('fields.endDate')}</TableHead>
                  <TableHead>{tc('labels.status')}</TableHead>
                  <TableHead className="text-right">{t('okr.objectives')}</TableHead>
                  <TableHead>{tc('labels.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-medium">{cycle.name}</TableCell>
                    <TableCell>
                      {cycle.cycleType === 'QUARTERLY' ? t('okr.quarterly') : t('okr.annual')}
                    </TableCell>
                    <TableCell>{formatDate(cycle.startDate)}</TableCell>
                    <TableCell>{formatDate(cycle.endDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={cycle.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {cycle._count.objectives}
                    </TableCell>
                    <TableCell>
                      {getTransitionButton(cycle)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
