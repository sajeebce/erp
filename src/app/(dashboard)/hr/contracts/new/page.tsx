'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'

const CONTRACT_TYPES = ['FULL_TIME', 'CONTRACT', 'CONSULTANT', 'INTERN', 'VOLUNTEER'] as const

interface Employee {
  id: string
  employeeNo: string
  fullName: string
}

interface Project {
  id: string
  name: string
  projectNo?: string
}

export default function NewContractPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [employeeId, setEmployeeId] = useState('')
  const [contractType, setContractType] = useState('FULL_TIME')
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [probationEndDate, setProbationEndDate] = useState('')
  const [basicSalary, setBasicSalary] = useState('')
  const [currency, setCurrency] = useState('BDT')
  const [projectId, setProjectId] = useState('')
  const [isRenewable, setIsRenewable] = useState(false)
  const [noticePeriodDays, setNoticePeriodDays] = useState('')

  // Lookup data
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetch('/api/v1/hr/employees?limit=500')
      .then(res => res.json())
      .then(json => { if (json.success) setEmployees(json.data) })
      .catch(() => {})

    fetch('/api/v1/projects?limit=500')
      .then(res => res.json())
      .then(json => { if (json.success) setProjects(json.data) })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    if (!employeeId || !contractType || !startDate) {
      setError(t('contracts.form.requiredFields'))
      return false
    }
    if (endDate && new Date(endDate) < new Date(startDate)) {
      setError(t('leaveForm.endDateAfterStart'))
      return false
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!validate()) return

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      employeeId,
      contractType,
      startDate,
    }
    if (title.trim()) payload.title = title.trim()
    if (endDate) payload.endDate = endDate
    if (probationEndDate) payload.probationEndDate = probationEndDate
    if (basicSalary) payload.basicSalary = parseFloat(basicSalary)
    if (currency) payload.currency = currency
    if (projectId) payload.projectId = projectId
    payload.isRenewable = isRenewable
    if (noticePeriodDays) payload.noticePeriodDays = parseInt(noticePeriodDays)

    try {
      const res = await fetch('/api/v1/hr/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/contracts/${json.data.id}`)
      } else {
        setError(json.error || t('contracts.form.failedToCreate'))
      }
    } catch {
      setError(t('contracts.form.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('contracts.form.createTitle')} description={t('contracts.form.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/contracts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('contracts.form.contractDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract-employee">{t('contracts.fields.employee')} *</Label>
              <SearchableSelect
                id="contract-employee"
                options={employees.map((e) => ({ value: e.id, label: `${e.fullName} (${e.employeeNo})` }))}
                value={employeeId}
                onValueChange={setEmployeeId}
                placeholder={t('contracts.form.selectEmployee')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract-type">{t('contracts.fields.contractType')} *</Label>
              <SearchableSelect
                id="contract-type"
                options={CONTRACT_TYPES.map((ct) => ({ value: ct, label: tc(`employmentTypes.${ct}`) }))}
                value={contractType}
                onValueChange={setContractType}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-title">{t('contracts.fields.title')}</Label>
            <Input
              id="contract-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('contracts.form.titlePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract-start">{t('contracts.fields.startDate')} *</Label>
              <Input id="contract-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract-end">{t('contracts.fields.endDate')}</Label>
              <Input id="contract-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract-probation">{t('contracts.fields.probationEnd')}</Label>
              <Input id="contract-probation" type="date" value={probationEndDate} onChange={(e) => setProbationEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract-salary">{t('contracts.fields.basicSalary')}</Label>
              <Input id="contract-salary" type="number" min="0" step="0.01" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract-currency">Currency</Label>
              <SearchableSelect
                id="contract-currency"
                options={[
                  { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'GBP', label: 'GBP - British Pound' },
                ]}
                value={currency}
                onValueChange={setCurrency}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract-notice">{t('contracts.fields.noticePeriod')}</Label>
              <Input id="contract-notice" type="number" min="0" value={noticePeriodDays} onChange={(e) => setNoticePeriodDays(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-project">Project</Label>
            <SearchableSelect
              id="contract-project"
              options={projects.map((p) => ({ value: p.id, label: p.projectNo ? `${p.name} (${p.projectNo})` : p.name }))}
              value={projectId}
              onValueChange={setProjectId}
              placeholder="Select project (optional)"
            />
          </div>

          <div className="flex items-center gap-2">
            <input id="contract-renewable" type="checkbox" checked={isRenewable} onChange={(e) => setIsRenewable(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor="contract-renewable">{t('contracts.fields.isRenewable')}</Label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr/contracts')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('contracts.form.saving')}
              </>
            ) : (
              t('contracts.form.saveContract')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
