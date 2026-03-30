'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
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

export default function NewGratuityPolicyPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [vestingPeriodMonths, setVestingPeriodMonths] = useState('')
  const [minServiceMonths, setMinServiceMonths] = useState('')
  const [formulaType, setFormulaType] = useState('MONTHS_PER_YEAR')
  const [ratePerYear, setRatePerYear] = useState('')
  const [calculationBase, setCalculationBase] = useState('LAST_BASIC')
  const [accrualFrequency, setAccrualFrequency] = useState('MONTHLY')
  const [maintainFund, setMaintainFund] = useState(false)
  const [isDefault, setIsDefault] = useState(false)

  function validate(): boolean {
    if (!name.trim() || !vestingPeriodMonths || !ratePerYear) {
      setError('Please fill in all required fields (Name, Vesting Period, Rate Per Year).')
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
      name: name.trim(),
      vestingPeriodMonths: parseInt(vestingPeriodMonths),
      formulaType,
      ratePerYear: parseFloat(ratePerYear),
      calculationBase,
      accrualFrequency,
      maintainFund,
      isDefault,
    }
    if (minServiceMonths) payload.minServiceMonths = parseInt(minServiceMonths)

    try {
      const res = await fetch('/api/v1/hr/gratuity/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/pension/gratuity/policies/${json.data.id}`)
      } else {
        setError(json.error || 'Failed to create policy.')
      }
    } catch {
      setError('Failed to create policy.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Create Gratuity Policy" description="Define a new gratuity calculation policy">
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/gratuity/policies')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Policy Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="policy-name">Policy Name *</Label>
              <Input
                id="policy-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Gratuity Policy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-formula">Formula Type *</Label>
              <SearchableSelect
                id="policy-formula"
                options={FORMULA_TYPES}
                value={formulaType}
                onValueChange={setFormulaType}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="policy-rate">Rate Per Year *</Label>
              <Input
                id="policy-rate"
                type="number"
                min="0"
                step="0.01"
                value={ratePerYear}
                onChange={(e) => setRatePerYear(e.target.value)}
                placeholder="e.g. 1.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-vesting">Vesting Period (Months) *</Label>
              <Input
                id="policy-vesting"
                type="number"
                min="0"
                value={vestingPeriodMonths}
                onChange={(e) => setVestingPeriodMonths(e.target.value)}
                placeholder="e.g. 60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-min-service">Min Service (Months)</Label>
              <Input
                id="policy-min-service"
                type="number"
                min="0"
                value={minServiceMonths}
                onChange={(e) => setMinServiceMonths(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="policy-calc-base">Calculation Base</Label>
              <SearchableSelect
                id="policy-calc-base"
                options={CALCULATION_BASES}
                value={calculationBase}
                onValueChange={setCalculationBase}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-frequency">Accrual Frequency</Label>
              <SearchableSelect
                id="policy-frequency"
                options={ACCRUAL_FREQUENCIES}
                value={accrualFrequency}
                onValueChange={setAccrualFrequency}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input id="policy-fund" type="checkbox" checked={maintainFund} onChange={(e) => setMaintainFund(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="policy-fund">Maintain Separate Fund</Label>
            </div>
            <div className="flex items-center gap-2">
              <input id="policy-default" type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="policy-default">Set as Default Policy</Label>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr/pension/gratuity/policies')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Create Policy'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
