'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Download, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
  budget: string | number
  actualCost: string | number
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  _count: {
    participants: number
  }
}

interface EmployeeOption {
  id: string
  fullName: string
  employeeNo: string
  department: { name: string } | null
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
  budget: string | number
  actualCost: string | number
  status: string
  participants: TrainingParticipantRow[]
}

interface ApiErrorResponse {
  success: false
  error?: {
    message?: string
    details?: Record<string, string[]>
  }
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

function formatDateRange(startDate: string, endDate: string | null, locale: string): string {
  const start = formatDate(startDate, locale)
  const end = endDate ? formatDate(endDate, locale) : start
  return start === end ? start : `${start} - ${end}`
}

export default function TrainingPage() {
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const locale = useLocale()

  const [trainings, setTrainings] = useState<TrainingListRow[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [trainingDetail, setTrainingDetail] = useState<TrainingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadBaseData() {
    setLoading(true)
    setError(null)
    try {
      const [trainingsRes, employeesRes] = await Promise.all([
        fetch('/api/v1/hr/training?limit=100'),
        fetch('/api/v1/hr/employees?status=ACTIVE&limit=100'),
      ])

      const trainingsJson = await trainingsRes.json()
      const employeesJson = await employeesRes.json()

      if (!trainingsJson.success) {
        throw new Error(trainingsJson.error?.message || 'Failed to load trainings')
      }
      if (!employeesJson.success) {
        throw new Error(employeesJson.error?.message || 'Failed to load employees')
      }

      const nextTrainings = trainingsJson.data as TrainingListRow[]
      setTrainings(nextTrainings)
      setEmployees(employeesJson.data as EmployeeOption[])

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
  }, [selectedTrainingId])

  const activeTrainings = useMemo(
    () => trainings.filter((training) => training.status !== 'CANCELLED'),
    [trainings]
  )

  const totalTrainings = activeTrainings.length
  const totalParticipants = trainings
    .filter((training) => training.status === 'COMPLETED' || training.status === 'IN_PROGRESS')
    .reduce((sum, training) => sum + training._count.participants, 0)
  const budgetUtilized = trainings
    .filter((training) => training.status === 'COMPLETED' || training.status === 'IN_PROGRESS')
    .reduce((sum, training) => sum + Number(training.actualCost || training.budget || 0), 0)
  const upcoming = trainings.filter((training) => training.status === 'PLANNED').length

  async function handleAssignParticipant() {
    if (!selectedTrainingId || !selectedEmployeeId) return

    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/v1/hr/training/${selectedTrainingId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmployeeId }),
      })

      const json = await response.json()
      if (!json.success) {
        const errorJson = json as ApiErrorResponse
        const details = errorJson.error?.details
        if (details?.conflictingTrainingTitle?.[0]) {
          const title = details.conflictingTrainingTitle[0]
          const trainingNo = details.conflictingTrainingNo?.[0] || ''
          const startDate = details.startDate?.[0] ? formatDate(details.startDate[0], locale) : ''
          const endDate = details.endDate?.[0] ? formatDate(details.endDate[0], locale) : startDate
          throw new Error(
            `Conflict with ${trainingNo ? `${trainingNo} - ` : ''}${title} (${startDate}${endDate && endDate !== startDate ? ` to ${endDate}` : ''})`
          )
        }
        throw new Error(errorJson.error?.message || 'Failed to assign participant')
      }

      setSelectedEmployeeId('')
      setMessage('Participant assigned successfully')
      await Promise.all([loadBaseData(), loadTrainingDetail(selectedTrainingId)])
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Failed to assign participant')
    } finally {
      setSubmitting(false)
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
        <Button size="sm" disabled>
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
                  <TableHead>{t('training.facilitator')}</TableHead>
                  <TableHead>{t('training.date')}</TableHead>
                  <TableHead>{t('training.duration')}</TableHead>
                  <TableHead className="text-right">{t('training.participants')}</TableHead>
                  <TableHead className="text-right">{t('training.budget')}</TableHead>
                  <TableHead>{tc('labels.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
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
                      <TableCell>{training.facilitator || '-'}</TableCell>
                      <TableCell>{formatDateRange(training.startDate, training.endDate, locale)}</TableCell>
                      <TableCell>{training.durationHours ? `${training.durationHours}h` : '-'}</TableCell>
                      <TableCell className="text-right">{training._count.participants}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(Number(training.budget), locale)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(training.status)}>{formatTrainingType(training.status)}</Badge>
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

              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.employeeNo} - {employee.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleAssignParticipant} disabled={submitting || !selectedTrainingId || !selectedEmployeeId}>
                Assign
              </Button>
            </div>

            {message && (
              <p className={`text-sm ${message.startsWith('Participant assigned') ? 'text-primary' : 'text-destructive'}`}>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!trainingDetail || trainingDetail.participants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                          <Badge variant={participant.attended ? 'default' : 'outline'}>
                            {participant.attended ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>{participant.score ?? '-'}</TableCell>
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
            <CardTitle>Selected Training</CardTitle>
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
                  <p className="text-sm text-muted-foreground">{t('training.facilitator')}</p>
                  <p className="font-medium">{trainingDetail.facilitator || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('attendance.location')}</p>
                  <p className="font-medium">{trainingDetail.venue || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('training.participants')}</p>
                  <p className="font-medium">{trainingDetail.participants.length}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
