'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Cycle {
  id: string
  name: string
  status: string
}

interface ParentObjective {
  id: string
  title: string
  ownerType: string
}

interface KeyResultForm {
  title: string
  resultType: string
  startValue: string
  targetValue: string
  unit: string
  dueDate: string
}

const emptyKR = (): KeyResultForm => ({
  title: '',
  resultType: 'METRIC',
  startValue: '0',
  targetValue: '',
  unit: '',
  dueDate: '',
})

export default function CreateObjectivePage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const router = useRouter()

  const [cycles, setCycles] = useState<Cycle[]>([])
  const [parentObjectives, setParentObjectives] = useState<ParentObjective[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ownerType, setOwnerType] = useState('INDIVIDUAL')
  const [ownerId, setOwnerId] = useState('')
  const [weight, setWeight] = useState('1')
  const [cycleId, setCycleId] = useState('')
  const [parentObjectiveId, setParentObjectiveId] = useState('')
  const [keyResults, setKeyResults] = useState<KeyResultForm[]>([emptyKR()])

  // Owner options based on ownerType
  const [ownerOptions, setOwnerOptions] = useState<{ id: string; label: string }[]>([])

  useEffect(() => {
    // Fetch cycles
    fetch('/api/v1/hr/okr/cycles?limit=50')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setCycles(json.data)
          const activeCycle = json.data.find((c: Cycle) => c.status === 'ACTIVE') || json.data[0]
          if (activeCycle) setCycleId(activeCycle.id)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Fetch parent objectives when cycleId changes
  useEffect(() => {
    if (!cycleId) return
    fetch(`/api/v1/hr/okr/objectives?cycleId=${cycleId}&limit=100`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setParentObjectives(json.data || [])
      })
      .catch(console.error)
  }, [cycleId])

  // Fetch owner options when ownerType changes
  useEffect(() => {
    setOwnerId('')
    if (ownerType === 'ORGANIZATION') {
      // For org-level, just use a placeholder
      setOwnerOptions([{ id: 'org', label: t('okr.organization') }])
      setOwnerId('org')
    } else if (ownerType === 'DEPARTMENT') {
      fetch('/api/v1/departments?limit=100')
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setOwnerOptions((json.data || []).map((d: { id: string; name: string }) => ({ id: d.id, label: d.name })))
          }
        })
        .catch(console.error)
    } else if (ownerType === 'TEAM') {
      // Teams might be departments or a dedicated team endpoint
      fetch('/api/v1/departments?limit=100')
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setOwnerOptions((json.data || []).map((d: { id: string; name: string }) => ({ id: d.id, label: d.name })))
          }
        })
        .catch(console.error)
    } else if (ownerType === 'INDIVIDUAL') {
      fetch('/api/v1/hr/employees?limit=200&status=ACTIVE')
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setOwnerOptions((json.data || []).map((e: { id: string; fullName: string }) => ({ id: e.id, label: e.fullName })))
          }
        })
        .catch(console.error)
    }
  }, [ownerType, t])

  const addKeyResult = () => setKeyResults([...keyResults, emptyKR()])

  const removeKeyResult = (index: number) => {
    if (keyResults.length <= 1) return
    setKeyResults(keyResults.filter((_, i) => i !== index))
  }

  const updateKeyResult = (index: number, field: keyof KeyResultForm, value: string) => {
    const updated = [...keyResults]
    updated[index] = { ...updated[index], [field]: value }
    setKeyResults(updated)
  }

  const handleSubmit = async () => {
    if (!title || !cycleId || !ownerType || !ownerId) return

    const validKRs = keyResults.filter(kr => kr.title && kr.targetValue)
    if (validKRs.length === 0) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/hr/okr/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId,
          ownerType,
          ownerId,
          title,
          description: description || undefined,
          weight: Number(weight),
          parentObjectiveId: parentObjectiveId || undefined,
          keyResults: validKRs.map(kr => ({
            title: kr.title,
            resultType: kr.resultType,
            startValue: Number(kr.startValue),
            targetValue: Number(kr.targetValue),
            unit: kr.unit || undefined,
            dueDate: kr.dueDate || undefined,
          })),
        }),
      })
      const json = await res.json()
      if (json.success) {
        router.push('/hr/okr')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('okr.createObjective')} description={t('okr.description')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Objective Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('okr.objectives')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('okr.objectiveTitle')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Increase customer satisfaction by 20%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{tc('labels.description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('okr.ownerType')}</Label>
                <Select value={ownerType} onValueChange={setOwnerType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORGANIZATION">{t('okr.organization')}</SelectItem>
                    <SelectItem value="DEPARTMENT">{t('okr.department')}</SelectItem>
                    <SelectItem value="TEAM">{t('okr.team')}</SelectItem>
                    <SelectItem value="INDIVIDUAL">{t('okr.individual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{ownerType === 'INDIVIDUAL' ? t('okr.individual') : t('okr.ownerType')}</Label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={tc('labels.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('okr.weight')}</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar: Cycle & Parent */}
        <Card>
          <CardHeader>
            <CardTitle>{t('okr.cycles')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('okr.cycleName')}</Label>
              <Select value={cycleId} onValueChange={setCycleId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('okr.parentObjective')}</Label>
              <Select value={parentObjectiveId} onValueChange={setParentObjectiveId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tc('labels.none')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tc('labels.none')}</SelectItem>
                  {parentObjectives.map(obj => (
                    <SelectItem key={obj.id} value={obj.id}>{obj.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('okr.keyResults')}</CardTitle>
            <Button variant="outline" size="sm" onClick={addKeyResult}>
              <Plus className="h-4 w-4 mr-1" />
              {t('okr.addKeyResult')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {keyResults.map((kr, index) => (
            <div key={index} className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('okr.keyResults')} #{index + 1}
                </span>
                {keyResults.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive"
                    onClick={() => removeKeyResult(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('okr.keyResultTitle')}</Label>
                <Input
                  value={kr.title}
                  onChange={(e) => updateKeyResult(index, 'title', e.target.value)}
                  placeholder="Achieve NPS score of 80+"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label>{t('okr.resultType')}</Label>
                  <Select value={kr.resultType} onValueChange={(v) => updateKeyResult(index, 'resultType', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="METRIC">{t('okr.metric')}</SelectItem>
                      <SelectItem value="MILESTONE">{t('okr.milestone')}</SelectItem>
                      <SelectItem value="PERCENTAGE">{t('okr.percentage')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('okr.startValue')}</Label>
                  <Input
                    type="number"
                    value={kr.startValue}
                    onChange={(e) => updateKeyResult(index, 'startValue', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('okr.targetValue')}</Label>
                  <Input
                    type="number"
                    value={kr.targetValue}
                    onChange={(e) => updateKeyResult(index, 'targetValue', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('okr.unit')}</Label>
                  <Input
                    value={kr.unit}
                    onChange={(e) => updateKeyResult(index, 'unit', e.target.value)}
                    placeholder="%"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('okr.dueDate')}</Label>
                <Input
                  type="date"
                  value={kr.dueDate}
                  onChange={(e) => updateKeyResult(index, 'dueDate', e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          {tc('buttons.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !title || !cycleId || !ownerId || keyResults.every(kr => !kr.title || !kr.targetValue)}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {t('okr.createObjective')}
        </Button>
      </div>
    </div>
  )
}
