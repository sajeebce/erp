'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'

const FORMULA_TYPES = [
  { value: 'MONTHS_PER_YEAR', label: 'Months Per Year' },
  { value: 'FIXED_RATE', label: 'Fixed Rate' },
]

const CALCULATION_BASES = [
  { value: 'LAST_BASIC', label: 'Last Basic Salary' },
  { value: 'AVERAGE_BASIC', label: 'Average Basic Salary' },
  { value: 'GROSS', label: 'Gross Salary' },
]

const ACCRUAL_FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' },
]

interface GratuityPolicy {
  id: string
  name: string
  formulaType: string
  ratePerYear: number
  vestingPeriodMonths: number
  minServiceMonths?: number | null
  calculationBase: string
  accrualFrequency: string
  maintainFund: boolean
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

export default function GratuityPolicyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [policy, setPolicy] = useState<GratuityPolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Editable fields
  const [name, setName] = useState('')
  const [formulaType, setFormulaType] = useState('')
  const [ratePerYear, setRatePerYear] = useState('')
  const [vestingPeriodMonths, setVestingPeriodMonths] = useState('')
  const [minServiceMonths, setMinServiceMonths] = useState('')
  const [calculationBase, setCalculationBase] = useState('')
  const [accrualFrequency, setAccrualFrequency] = useState('')
  const [maintainFund, setMaintainFund] = useState(false)
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (!params.id) return

    fetch(`/api/v1/hr/gratuity/policies/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setPolicy(json.data)
          populateForm(json.data)
        } else {
          setError(tc('errors.notFound'))
        }
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  function populateForm(p: GratuityPolicy) {
    setName(p.name)
    setFormulaType(p.formulaType)
    setRatePerYear(String(p.ratePerYear))
    setVestingPeriodMonths(String(p.vestingPeriodMonths))
    setMinServiceMonths(p.minServiceMonths != null ? String(p.minServiceMonths) : '')
    setCalculationBase(p.calculationBase)
    setAccrualFrequency(p.accrualFrequency)
    setMaintainFund(p.maintainFund)
    setIsDefault(p.isDefault)
  }

  function handleCancel() {
    if (policy) populateForm(policy)
    setEditing(false)
    setError('')
  }

  async function handleSave() {
    if (!name.trim() || !ratePerYear || !vestingPeriodMonths) {
      setError('Please fill in all required fields.')
      return
    }

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      name: name.trim(),
      formulaType,
      ratePerYear: parseFloat(ratePerYear),
      vestingPeriodMonths: parseInt(vestingPeriodMonths),
      minServiceMonths: minServiceMonths ? parseInt(minServiceMonths) : null,
      calculationBase,
      accrualFrequency,
      maintainFund,
      isDefault,
    }

    try {
      const res = await fetch(`/api/v1/hr/gratuity/policies/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setPolicy(json.data)
        populateForm(json.data)
        setEditing(false)
      } else {
        setError(json.error || 'Failed to update policy.')
      }
    } catch {
      setError('Failed to update policy.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!policy) {
    return (
      <div className="space-y-6">
        <PageHeader title="Gratuity Policy" description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/gratuity/policies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error || tc('errors.notFound')}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? 'Edit Policy' : policy.name}
        description={editing ? '' : `Formula: ${policy.formulaType} | Frequency: ${policy.accrualFrequency}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/gratuity/policies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
          {!editing && (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              {tc('buttons.edit')}
            </Button>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* View Mode */}
      {!editing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Policy Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{policy.name}</span></div>
              <div><span className="text-muted-foreground">Formula Type:</span> <StatusBadge status={policy.formulaType} /></div>
              <div><span className="text-muted-foreground">Rate Per Year:</span> <span className="font-mono">{policy.ratePerYear}</span></div>
              <div><span className="text-muted-foreground">Calculation Base:</span> <StatusBadge status={policy.calculationBase} /></div>
              <div><span className="text-muted-foreground">Accrual Frequency:</span> <StatusBadge status={policy.accrualFrequency} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Eligibility & Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Vesting Period:</span> {policy.vestingPeriodMonths} months</div>
              {policy.minServiceMonths != null && <div><span className="text-muted-foreground">Min Service:</span> {policy.minServiceMonths} months</div>}
              <div><span className="text-muted-foreground">Maintain Fund:</span> {policy.maintainFund ? 'Yes' : 'No'}</div>
              <div><span className="text-muted-foreground">Default Policy:</span> {policy.isDefault ? <span className="text-green-600 font-medium">Yes</span> : 'No'}</div>
              <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={policy.isActive ? 'ACTIVE' : 'INACTIVE'} /></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Mode */}
      {editing && (
        <Card>
          <CardHeader><CardTitle>Edit Policy</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Policy Name *</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-formula">Formula Type *</Label>
                <SearchableSelect
                  id="edit-formula"
                  options={FORMULA_TYPES}
                  value={formulaType}
                  onValueChange={setFormulaType}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-rate">Rate Per Year *</Label>
                <Input id="edit-rate" type="number" min="0" step="0.01" value={ratePerYear} onChange={(e) => setRatePerYear(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vesting">Vesting Period (Months) *</Label>
                <Input id="edit-vesting" type="number" min="0" value={vestingPeriodMonths} onChange={(e) => setVestingPeriodMonths(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-min-service">Min Service (Months)</Label>
                <Input id="edit-min-service" type="number" min="0" value={minServiceMonths} onChange={(e) => setMinServiceMonths(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-calc-base">Calculation Base</Label>
                <SearchableSelect
                  id="edit-calc-base"
                  options={CALCULATION_BASES}
                  value={calculationBase}
                  onValueChange={setCalculationBase}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-frequency">Accrual Frequency</Label>
                <SearchableSelect
                  id="edit-frequency"
                  options={ACCRUAL_FREQUENCIES}
                  value={accrualFrequency}
                  onValueChange={setAccrualFrequency}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input id="edit-fund" type="checkbox" checked={maintainFund} onChange={(e) => setMaintainFund(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="edit-fund">Maintain Separate Fund</Label>
              </div>
              <div className="flex items-center gap-2">
                <input id="edit-default" type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="edit-default">Set as Default Policy</Label>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              {tc('buttons.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                tc('buttons.save')
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
