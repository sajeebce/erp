'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, ChevronsUpDown, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, formatNumber } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface TrainingListRow {
  id: string
  trainingNo: string
  title: string
  type: 'INTERNAL' | 'EXTERNAL' | 'ONLINE'
  facilitator: string | null
  venue: string | null
  startDate: string
  endDate: string | null
  durationHours: number | null
  capacity: number | null
  budget: string | number
  actualCost: string | number
  projectId: string | null
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  _count: {
    participants: number
  }
}

interface ProjectOption {
  id: string
  projectNo: string
  name: string
}

interface EmployeeOption {
  id: string
  fullName: string
  employeeNo: string
  department: { name: string } | null
  eligible?: boolean
  reason?: string | null
  reasonLabel?: string | null
  conflictingTraining?: {
    trainingNo: string
    title: string
    startDate: string
    endDate: string
  } | null
}

interface TrainingParticipantRow {
  id: string
  attended: boolean
  score: string | number | null
  feedback: string | null
  employee: {
    id: string
    employeeNo: string
    fullName: string
    department?: { name: string } | null
  }
}

interface TrainingDetail {
  id: string
  trainingNo: string
  title: string
  type: string
  facilitator: string | null
  venue: string | null
  startDate: string
  endDate: string | null
  durationHours: number | null
  capacity: number | null
  budget: string | number
  actualCost: string | number
  projectId: string | null
  status: string
  description?: string | null
  participants: TrainingParticipantRow[]
}

interface ApiErrorResponse {
  success: false
  error?: {
    message?: string
    details?: Record<string, string[]>
  }
}

interface TrainingFormState {
  id?: string
  title: string
  type: 'INTERNAL' | 'EXTERNAL' | 'ONLINE'
  facilitator: string
  venue: string
  startDate: string
  endDate: string
  durationHours: string
  capacity: string
  budget: string
  actualCost: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  projectId: string
  description: string
}

const emptyTrainingForm: TrainingFormState = {
  title: '',
  type: 'INTERNAL',
  facilitator: '',
  venue: '',
  startDate: '',
  endDate: '',
  durationHours: '',
  capacity: '',
  budget: '0',
  actualCost: '0',
  status: 'PLANNED',
  projectId: '',
  description: '',
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'COMPLETED': return 'default'
    case 'IN_PROGRESS': return 'secondary'
    case 'PLANNED': return 'outline'
    case 'CANCELLED': return 'destructive'
    default: return 'outline'
  }
}

function getTypeVariant(type: string): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'INTERNAL': return 'default'
    case 'EXTERNAL': return 'secondary'
    case 'ONLINE': return 'outline'
    default: return 'outline'
  }
}

function formatTrainingType(type: string): string {
  return type.replace('_', ' ')
}

function formatTrainingDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function formatTrainingTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function formatDateRange(startDate: string, endDate: string | null, locale: string): string {
  const start = new Date(startDate)

  if (Number.isNaN(start.getTime())) return '-'
  if (!endDate) return formatTrainingDateTime(startDate, locale)

  const end = new Date(endDate)
  if (Number.isNaN(end.getTime())) return formatTrainingDateTime(startDate, locale)

  const startDay = formatDate(startDate, locale)
  const endDay = formatDate(endDate, locale)
  if (startDay === endDay) {
    return `${startDay}, ${formatTrainingTime(startDate, locale)}-${formatTrainingTime(endDate, locale)}`
  }

  return `${formatTrainingDateTime(startDate, locale)} - ${formatTrainingDateTime(endDate, locale)}`
}

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toIsoFromDateTimeLocal(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function getProjectLabel(projects: ProjectOption[], projectId: string | null): string {
  if (!projectId) return '-'
  const project = projects.find((item) => item.id === projectId)
  return project ? `${project.projectNo} - ${project.name}` : projectId
}

interface EmployeeMultiSelectProps {
  employees: EmployeeOption[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
}

function EmployeeMultiSelect({ employees, selectedIds, onSelectedIdsChange }: EmployeeMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const eligibleEmployees = employees.filter((employee) => employee.eligible !== false)
  const selectedEmployees = employees.filter((employee) => selectedIds.includes(employee.id))
  const selectedEligibleIds = selectedIds.filter((id) =>
    eligibleEmployees.some((employee) => employee.id === id)
  )
  const allEligibleSelected = eligibleEmployees.length > 0 && selectedEligibleIds.length === eligibleEmployees.length

  function toggleEmployee(employee: EmployeeOption) {
    if (employee.eligible === false) return
    onSelectedIdsChange(
      selectedIds.includes(employee.id)
        ? selectedIds.filter((id) => id !== employee.id)
        : [...selectedIds, employee.id]
    )
  }

  const triggerLabel = (() => {
    if (selectedEmployees.length === 0) {
      return employees.length === 0 ? 'No eligible employee' : 'Select employees'
    }
    if (selectedEmployees.length === 1) {
      const employee = selectedEmployees[0]
      return `${employee.employeeNo} - ${employee.fullName}`
    }
    return `${selectedEmployees.length} employees selected`
  })()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-9 w-full justify-between px-3 font-normal',
            selectedEmployees.length === 0 && 'text-muted-foreground'
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search employee..." />
          <div className="flex items-center justify-between gap-2 border-b px-2 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={allEligibleSelected
                ? () => onSelectedIdsChange([])
                : () => onSelectedIdsChange(eligibleEmployees.map((employee) => employee.id))}
              disabled={eligibleEmployees.length === 0}
            >
              {allEligibleSelected ? 'Clear all' : 'Select all eligible'}
            </Button>
            <span className="text-xs text-muted-foreground">
              {selectedEligibleIds.length} / {eligibleEmployees.length} selected
            </span>
          </div>
          <CommandList>
            <CommandEmpty>No employees found.</CommandEmpty>
            <CommandGroup>
              {employees.map((employee) => {
                const selected = selectedIds.includes(employee.id)
                const disabled = employee.eligible === false
                const label = `${employee.employeeNo} - ${employee.fullName}`

                return (
                  <CommandItem
                    key={employee.id}
                    value={`${label} ${employee.department?.name || ''} ${employee.reasonLabel || ''}`}
                    disabled={disabled}
                    onSelect={() => toggleEmployee(employee)}
                    className="items-start"
                  >
                    <Checkbox checked={selected} className="mt-0.5" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {disabled && employee.reasonLabel
                          ? employee.reasonLabel
                          : employee.department?.name || 'No department'}
                      </p>
                    </div>
                    <Check className={cn('mt-0.5 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function TrainingPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const locale = useLocale()

  const [trainings, setTrainings] = useState<TrainingListRow[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>('')
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [trainingDetail, setTrainingDetail] = useState<TrainingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [trainingForm, setTrainingForm] = useState<TrainingFormState>(emptyTrainingForm)
  const [showIneligible, setShowIneligible] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadBaseData() {
    setLoading(true)
    setError(null)
    try {
      const [trainingsRes, projectsRes] = await Promise.all([
        fetch('/api/v1/hr/training?limit=100'),
        fetch('/api/v1/projects?status=ACTIVE&limit=100'),
      ])

      const trainingsJson = await trainingsRes.json()
      const projectsJson = await projectsRes.json()

      if (!trainingsJson.success) {
        throw new Error(trainingsJson.error?.message || 'Failed to load trainings')
      }

      const nextTrainings = trainingsJson.data as TrainingListRow[]
      setTrainings(nextTrainings)
      setProjects(projectsJson.success ? projectsJson.data as ProjectOption[] : [])

      if (nextTrainings.length > 0) {
        setSelectedTrainingId((current) => current || nextTrainings[0].id)
      }
    } catch (loadError) {
      console.error(loadError)
      setError(loadError instanceof Error ? loadError.message : 'Failed to load training data')
    } finally {
      setLoading(false)
    }
  }

  const loadEligibleEmployees = useCallback(async (trainingId: string, includeIneligible = showIneligible) => {
    if (!trainingId) {
      setEmployees([])
      return
    }

    try {
      const response = await fetch(`/api/v1/hr/training/${trainingId}/eligible-employees?includeIneligible=${includeIneligible}`)
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to load eligible employees')
      }
      setEmployees(json.data as EmployeeOption[])
    } catch (employeeError) {
      console.error(employeeError)
      setEmployees([])
      setMessage(employeeError instanceof Error ? employeeError.message : 'Failed to load eligible employees')
    }
  }, [showIneligible])

  async function loadTrainingDetail(trainingId: string) {
    if (!trainingId) {
      setTrainingDetail(null)
      return
    }

    setDetailLoading(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/v1/hr/training/${trainingId}`)
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to load training details')
      }
      setTrainingDetail(json.data as TrainingDetail)
    } catch (detailError) {
      console.error(detailError)
      setMessage(detailError instanceof Error ? detailError.message : 'Failed to load training details')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    loadBaseData()
  }, [])

  useEffect(() => {
    if (!selectedTrainingId) return
    loadTrainingDetail(selectedTrainingId)
    loadEligibleEmployees(selectedTrainingId)
    setSelectedEmployeeIds([])
  }, [selectedTrainingId, loadEligibleEmployees])

  useEffect(() => {
    setSelectedEmployeeIds((current) =>
      current.filter((id) => employees.some((employee) => employee.id === id && employee.eligible !== false))
    )
  }, [employees])

  useEffect(() => {
    if (!selectedTrainingId) return
    loadEligibleEmployees(selectedTrainingId, showIneligible)
  }, [showIneligible, selectedTrainingId, loadEligibleEmployees])

  const totalTrainings = trainings.length
  const totalParticipants = trainings
    .filter((training) => training.status === 'COMPLETED' || training.status === 'IN_PROGRESS')
    .reduce((sum, training) => sum + training._count.participants, 0)
  const budgetUtilized = trainings
    .filter((training) => training.status === 'COMPLETED' || training.status === 'IN_PROGRESS')
    .reduce((sum, training) => sum + Number(training.actualCost || training.budget || 0), 0)
  const upcoming = trainings.filter((training) => training.status === 'PLANNED').length

  function openCreateDialog() {
    setTrainingForm(emptyTrainingForm)
    setDialogOpen(true)
  }

  function openEditDialog(training: TrainingDetail | TrainingListRow) {
    setTrainingForm({
      id: training.id,
      title: training.title,
      type: training.type as TrainingFormState['type'],
      facilitator: training.facilitator || '',
      venue: training.venue || '',
      startDate: toDateTimeLocal(training.startDate),
      endDate: toDateTimeLocal(training.endDate),
      durationHours: training.durationHours ? String(training.durationHours) : '',
      capacity: training.capacity ? String(training.capacity) : '',
      budget: String(training.budget ?? '0'),
      actualCost: String(training.actualCost ?? '0'),
      status: training.status as TrainingFormState['status'],
      projectId: training.projectId || '',
      description: 'description' in training && typeof training.description === 'string' ? training.description : '',
    })
    setDialogOpen(true)
  }

  async function handleSaveTraining() {
    const startDate = toIsoFromDateTimeLocal(trainingForm.startDate)
    const endDate = toIsoFromDateTimeLocal(trainingForm.endDate)
    if (!trainingForm.title.trim() || !startDate) {
      setMessage('Training title and start date/time are required')
      return
    }
    if (endDate && new Date(endDate) <= new Date(startDate)) {
      setMessage('End date/time must be after start date/time')
      return
    }

    setFormSubmitting(true)
    setMessage(null)
    try {
      const payload = {
        title: trainingForm.title.trim(),
        type: trainingForm.type,
        facilitator: trainingForm.facilitator || null,
        venue: trainingForm.venue || null,
        startDate,
        endDate,
        durationHours: trainingForm.durationHours || null,
        capacity: trainingForm.capacity || null,
        budget: trainingForm.budget || '0',
        actualCost: trainingForm.actualCost || '0',
        status: trainingForm.status,
        projectId: trainingForm.projectId || null,
        description: trainingForm.description || null,
      }
      const response = await fetch(
        trainingForm.id ? `/api/v1/hr/training/${trainingForm.id}` : '/api/v1/hr/training',
        {
          method: trainingForm.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to save training')
      }

      setDialogOpen(false)
      setTrainingForm(emptyTrainingForm)
      setMessage(trainingForm.id ? 'Training updated successfully' : 'Training scheduled successfully')
      await loadBaseData()
      setSelectedTrainingId(json.data.id)
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Failed to save training')
    } finally {
      setFormSubmitting(false)
    }
  }

  async function handleAssignParticipant() {
    if (!selectedTrainingId || selectedEmployeeIds.length === 0) return

    setSubmitting(true)
    setMessage(null)
    try {
      const failures: string[] = []
      let successCount = 0

      for (const employeeId of selectedEmployeeIds) {
        const employee = employees.find((item) => item.id === employeeId)
        const response = await fetch(`/api/v1/hr/training/${selectedTrainingId}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId }),
        })

        const json = await response.json()
        if (response.ok && json.success) {
          successCount += 1
          continue
        }

        const errorJson = json as ApiErrorResponse
        const details = errorJson.error?.details
        if (details?.conflictingTrainingTitle?.[0]) {
          const title = details.conflictingTrainingTitle[0]
          const trainingNo = details.conflictingTrainingNo?.[0] || ''
          const startDate = details.startDate?.[0] ? formatDate(details.startDate[0], locale) : ''
          const endDate = details.endDate?.[0] ? formatDate(details.endDate[0], locale) : startDate
          failures.push(
            `${employee?.employeeNo || 'Employee'}: Conflict with ${trainingNo ? `${trainingNo} - ` : ''}${title} (${startDate}${endDate && endDate !== startDate ? ` to ${endDate}` : ''})`
          )
        } else {
          failures.push(`${employee?.employeeNo || 'Employee'}: ${errorJson.error?.message || 'Failed to assign participant'}`)
        }
      }

      setSelectedEmployeeIds([])
      setMessage(
        failures.length
          ? `Assigned ${successCount} participant(s). ${failures.join(' ')}`
          : `Assigned ${successCount} participant(s) successfully`
      )
      await Promise.all([
        loadBaseData(),
        loadTrainingDetail(selectedTrainingId),
        loadEligibleEmployees(selectedTrainingId, showIneligible),
      ])
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Failed to assign participant')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateParticipant(participantId: string, data: Record<string, unknown>) {
    if (!selectedTrainingId) return
    setMessage(null)
    try {
      const response = await fetch(`/api/v1/hr/training/${selectedTrainingId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to update participant')
      await loadTrainingDetail(selectedTrainingId)
      setMessage('Participant updated successfully')
    } catch (updateError) {
      setMessage(updateError instanceof Error ? updateError.message : 'Failed to update participant')
    }
  }

  async function removeParticipant(participantId: string) {
    if (!selectedTrainingId) return
    setMessage(null)
    try {
      const response = await fetch(`/api/v1/hr/training/${selectedTrainingId}/participants/${participantId}`, {
        method: 'DELETE',
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to remove participant')
      await Promise.all([
        loadBaseData(),
        loadTrainingDetail(selectedTrainingId),
        loadEligibleEmployees(selectedTrainingId),
      ])
      setMessage('Participant removed successfully')
    } catch (removeError) {
      setMessage(removeError instanceof Error ? removeError.message : 'Failed to remove participant')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-[520px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('training.title')}
        description={t('training.description')}
      >
        <Button variant="outline" size="sm" disabled>
          <Download className="mr-2 h-4 w-4" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t('training.scheduleTraining')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('training.totalTrainings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTrainings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('training.participantsTrained')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalParticipants, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('training.budgetUtilized')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(budgetUtilized, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('training.upcoming')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcoming}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('training.trainingSchedule')}</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('training.trainingId')}</TableHead>
                  <TableHead>{t('training.trainingTitle')}</TableHead>
                  <TableHead>{t('training.type')}</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>{t('training.facilitator')}</TableHead>
                  <TableHead>{t('training.date')}</TableHead>
                  <TableHead>{t('training.duration')}</TableHead>
                  <TableHead className="text-right">{t('training.participants')}</TableHead>
                  <TableHead className="text-right">{t('training.budget')}</TableHead>
                  <TableHead>{tc('labels.status')}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      No trainings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  trainings.map((training) => (
                    <TableRow
                      key={training.id}
                      className={training.id === selectedTrainingId ? 'bg-muted/40' : undefined}
                    >
                      <TableCell className="font-mono text-sm">
                        <button
                          type="button"
                          className="text-left underline-offset-4 hover:underline"
                          onClick={() => setSelectedTrainingId(training.id)}
                        >
                          {training.trainingNo}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{training.title}</TableCell>
                      <TableCell>
                        <Badge variant={getTypeVariant(training.type)}>{formatTrainingType(training.type)}</Badge>
                      </TableCell>
                      <TableCell>{getProjectLabel(projects, training.projectId)}</TableCell>
                      <TableCell>{training.facilitator || '-'}</TableCell>
                      <TableCell>{formatDateRange(training.startDate, training.endDate, locale)}</TableCell>
                      <TableCell>{training.durationHours ? `${training.durationHours}h` : '-'}</TableCell>
                      <TableCell className="text-right">
                        {training._count.participants}
                        {training.capacity ? ` / ${training.capacity}` : ''}
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(Number(training.budget), locale)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(training.status)}>{formatTrainingType(training.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(training)} aria-label="Edit training">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Training Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Select value={selectedTrainingId} onValueChange={setSelectedTrainingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select training" />
                </SelectTrigger>
                <SelectContent>
                  {trainings.map((training) => (
                    <SelectItem key={training.id} value={training.id}>
                      {training.trainingNo} - {training.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <EmployeeMultiSelect
                employees={employees}
                selectedIds={selectedEmployeeIds}
                onSelectedIdsChange={setSelectedEmployeeIds}
              />

              <Button onClick={handleAssignParticipant} disabled={submitting || !selectedTrainingId || selectedEmployeeIds.length === 0}>
                Assign
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-ineligible-employees"
                checked={showIneligible}
                onCheckedChange={(checked) => setShowIneligible(Boolean(checked))}
              />
              <Label htmlFor="show-ineligible-employees" className="text-sm text-muted-foreground">
                Show ineligible employees with conflict reason
              </Label>
            </div>

            {message && (
              <p className={`text-sm ${message.startsWith('Participant assigned') || message.startsWith('Assigned ') ? 'text-primary' : 'text-destructive'}`}>
                {message}
              </p>
            )}

            {detailLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('fields.employeeNo')}</TableHead>
                    <TableHead>{t('attendance.employeeName')}</TableHead>
                    <TableHead>{t('fields.department')}</TableHead>
                    <TableHead>Attended</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!trainingDetail || trainingDetail.participants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No participants assigned yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trainingDetail.participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-mono text-sm">{participant.employee.employeeNo}</TableCell>
                        <TableCell className="font-medium">{participant.employee.fullName}</TableCell>
                        <TableCell>{participant.employee.department?.name || '-'}</TableCell>
                        <TableCell>
                          <Checkbox
                            checked={participant.attended}
                            onCheckedChange={(checked) => updateParticipant(participant.id, { attended: Boolean(checked) })}
                            aria-label="Mark attended"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 w-24"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            defaultValue={participant.score ?? ''}
                            onBlur={(event) => updateParticipant(participant.id, { score: event.currentTarget.value || null })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 min-w-40"
                            defaultValue={participant.feedback || ''}
                            onBlur={(event) => updateParticipant(participant.id, { feedback: event.currentTarget.value || null })}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-sm" onClick={() => removeParticipant(participant.id)} aria-label="Remove participant">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Selected Training</CardTitle>
              {trainingDetail && (
                <Button variant="outline" size="sm" onClick={() => openEditDialog(trainingDetail)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {detailLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : !trainingDetail ? (
              <p className="text-sm text-muted-foreground">No training selected.</p>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">{t('training.trainingId')}</p>
                  <p className="font-medium">{trainingDetail.trainingNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('training.trainingTitle')}</p>
                  <p className="font-medium">{trainingDetail.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getTypeVariant(trainingDetail.type)}>{formatTrainingType(trainingDetail.type)}</Badge>
                  <Badge variant={getStatusVariant(trainingDetail.status)}>{formatTrainingType(trainingDetail.status)}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('training.date')}</p>
                  <p className="font-medium">{formatDateRange(trainingDetail.startDate, trainingDetail.endDate, locale)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{getProjectLabel(projects, trainingDetail.projectId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('training.facilitator')}</p>
                  <p className="font-medium">{trainingDetail.facilitator || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('attendance.location')}</p>
                  <p className="font-medium">{trainingDetail.venue || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('training.participants')}</p>
                  <p className="font-medium">
                    {trainingDetail.participants.length}
                    {trainingDetail.capacity ? ` / ${trainingDetail.capacity}` : ''}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) setTrainingForm(emptyTrainingForm)
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{trainingForm.id ? 'Edit Training' : 'Schedule Training'}</DialogTitle>
            <DialogDescription>
              Configure training schedule, project context, capacity, and budget.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="training-title">Title</Label>
              <Input
                id="training-title"
                value={trainingForm.title}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={trainingForm.type}
                onValueChange={(value) => setTrainingForm((prev) => ({ ...prev, type: value as TrainingFormState['type'] }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                  <SelectItem value="EXTERNAL">External</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={trainingForm.status}
                onValueChange={(value) => setTrainingForm((prev) => ({ ...prev, status: value as TrainingFormState['status'] }))}
                disabled={!trainingForm.id}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-start">Start Date & Time</Label>
              <Input
                id="training-start"
                type="datetime-local"
                value={trainingForm.startDate}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, startDate: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-end">End Date & Time</Label>
              <Input
                id="training-end"
                type="datetime-local"
                value={trainingForm.endDate}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, endDate: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-duration">Duration Hours</Label>
              <Input
                id="training-duration"
                type="number"
                min="0"
                value={trainingForm.durationHours}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, durationHours: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-capacity">Capacity</Label>
              <Input
                id="training-capacity"
                type="number"
                min="1"
                value={trainingForm.capacity}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, capacity: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-facilitator">Facilitator</Label>
              <Input
                id="training-facilitator"
                value={trainingForm.facilitator}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, facilitator: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-venue">Venue</Label>
              <Input
                id="training-venue"
                value={trainingForm.venue}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, venue: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={trainingForm.projectId || '__none'}
                onValueChange={(value) => setTrainingForm((prev) => ({ ...prev, projectId: value === '__none' ? '' : value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectNo} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-budget">Budget</Label>
              <Input
                id="training-budget"
                type="number"
                min="0"
                step="0.01"
                value={trainingForm.budget}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, budget: event.target.value }))}
              />
            </div>

            {trainingForm.id && (
              <div className="space-y-2">
                <Label htmlFor="training-actual-cost">Actual Cost</Label>
                <Input
                  id="training-actual-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={trainingForm.actualCost}
                  onChange={(event) => setTrainingForm((prev) => ({ ...prev, actualCost: event.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="training-description">Description</Label>
              <Textarea
                id="training-description"
                rows={3}
                value={trainingForm.description}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTraining} disabled={formSubmitting}>
              {formSubmitting ? 'Saving...' : 'Save Training'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
