'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'

interface Employee {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
  code: string
}

interface Grant {
  id: string
  name: string
  grantCode: string
}

export default function CreatePettyCashFundPage() {
  const t = useTranslations('finance.expenses.pettyCash')
  const tc = useTranslations('common')
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Lookup data
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [grants, setGrants] = useState<Grant[]>([])

  // Form fields
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [imprest, setImprest] = useState('')
  const [custodianId, setCustodianId] = useState('')
  const [altCustodianId, setAltCustodianId] = useState('')
  const [location, setLocation] = useState('')
  const [maxTxnLimit, setMaxTxnLimit] = useState('')
  const [reconFrequency, setReconFrequency] = useState('MONTHLY')
  const [projectId, setProjectId] = useState('')
  const [grantId, setGrantId] = useState('')
  const [notes, setNotes] = useState('')

  const fetchLookups = useCallback(async () => {
    try {
      const [empRes, projRes, grantRes] = await Promise.all([
        fetch('/api/v1/hr/employees?limit=200'),
        fetch('/api/v1/projects?limit=200'),
        fetch('/api/v1/donors/grants?limit=200'),
      ])
      if (empRes.ok) {
        const d = await empRes.json()
        const items = d.data ?? d ?? []
        setEmployees(items.map((e: Record<string, string>) => ({
          id: e.id,
          name: e.name ?? `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
        })))
      }
      if (projRes.ok) {
        const d = await projRes.json()
        const items = d.data ?? d ?? []
        setProjects(items.map((p: Record<string, string>) => ({
          id: p.id, name: p.name, code: p.code ?? '',
        })))
      }
      if (grantRes.ok) {
        const d = await grantRes.json()
        const items = d.data ?? d ?? []
        setGrants(items.map((g: Record<string, string>) => ({
          id: g.id, name: g.name, grantCode: g.grantCode ?? '',
        })))
      }
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => { fetchLookups() }, [fetchLookups])

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/v1/finance/petty-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code,
          imprestAmount: parseFloat(imprest) || 0,
          custodianId,
          alternateCustodianId: altCustodianId || null,
          location: location || null,
          maxTransactionLimit: maxTxnLimit ? parseFloat(maxTxnLimit) : null,
          reconciliationFrequency: reconFrequency,
          projectId: projectId || null,
          grantId: grantId || null,
          notes: notes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error?.message || 'Failed to create fund')
      }
      router.push('/finance/expenses/petty-cash')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  const isValid = name.trim() && code.trim() && custodianId && imprest && parseFloat(imprest) > 0

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t('createFund')}
        description={t('createFundDescription')}
      />

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Fund Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sectionFundIdentification')}</CardTitle>
          <CardDescription>{t('sectionFundIdentificationDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('fundName')} *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('fundNamePlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">{t('fundCode')} *</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('fundCodePlaceholder')} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imprest">{t('imprestAmount')} *</Label>
              <Input id="imprest" type="number" min="0" step="0.01" value={imprest} onChange={(e) => setImprest(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">{t('location')}</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('locationPlaceholder')} />
          </div>
        </CardContent>
      </Card>

      {/* Custodian & Authority */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sectionCustodian')}</CardTitle>
          <CardDescription>{t('sectionCustodianDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>{t('custodian')} *</Label>
            <SearchableSelect
              options={employees.map((e) => ({ value: e.id, label: e.name }))}
              value={custodianId}
              onValueChange={setCustodianId}
              placeholder={t('selectCustodian')}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t('alternateCustodian')}</Label>
            <SearchableSelect
              options={employees.filter((e) => e.id !== custodianId).map((e) => ({ value: e.id, label: e.name }))}
              value={altCustodianId}
              onValueChange={setAltCustodianId}
              placeholder={t('selectAlternateCustodian')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Controls & Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sectionControls')}</CardTitle>
          <CardDescription>{t('sectionControlsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="max-txn">{t('maxTransactionLimit')}</Label>
            <Input id="max-txn" type="number" min="0" step="0.01" value={maxTxnLimit} onChange={(e) => setMaxTxnLimit(e.target.value)} placeholder={t('maxTransactionPlaceholder')} />
            <p className="text-xs text-muted-foreground">{t('maxTransactionHint')}</p>
          </div>
          <div className="grid gap-2">
            <Label>{t('reconciliationFrequency')}</Label>
            <SearchableSelect
              options={[
                { value: 'DAILY', label: t('freqDaily') },
                { value: 'WEEKLY', label: t('freqWeekly') },
                { value: 'BIWEEKLY', label: t('freqBiweekly') },
                { value: 'MONTHLY', label: t('freqMonthly') },
              ]}
              value={reconFrequency}
              onValueChange={setReconFrequency}
              placeholder={t('selectFrequency')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Project & Grant Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sectionAllocation')}</CardTitle>
          <CardDescription>{t('sectionAllocationDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>{t('project')}</Label>
            <SearchableSelect
              options={projects.map((p) => ({ value: p.id, label: p.code ? `${p.code} - ${p.name}` : p.name }))}
              value={projectId}
              onValueChange={setProjectId}
              placeholder={t('selectProject')}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t('grant')}</Label>
            <SearchableSelect
              options={grants.map((g) => ({ value: g.id, label: g.grantCode ? `${g.grantCode} - ${g.name}` : g.name }))}
              value={grantId}
              onValueChange={setGrantId}
              placeholder={t('selectGrant')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t('notesPlaceholder')} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/finance/expenses/petty-cash')}>
          {tc('buttons.cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={saving || !isValid}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('createFund')}
        </Button>
      </div>
    </div>
  )
}
