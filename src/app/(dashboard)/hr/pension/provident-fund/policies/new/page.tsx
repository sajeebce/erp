'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'

export default function NewPFPolicyPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [employeeContribRate, setEmployeeContribRate] = useState('')
  const [employerContribRate, setEmployerContribRate] = useState('')
  const [contributionBase, setContributionBase] = useState('BASIC')
  const [eligibilityMonths, setEligibilityMonths] = useState('0')
  const [interestRate, setInterestRate] = useState('')
  const [interestCalcMethod, setInterestCalcMethod] = useState('MONTHLY_BALANCE')
  const [allowPartialWithdraw, setAllowPartialWithdraw] = useState(false)
  const [allowLoan, setAllowLoan] = useState(false)
  const [maxLoanPercent, setMaxLoanPercent] = useState('80')
  const [loanInterestRate, setLoanInterestRate] = useState('')

  function validate(): boolean {
    if (!name.trim() || !employeeContribRate || !employerContribRate || !interestRate) {
      setError('Please fill all required fields')
      return false
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/v1/hr/pf/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          employeeContribRate: parseFloat(employeeContribRate),
          employerContribRate: parseFloat(employerContribRate),
          contributionBase,
          eligibilityMonths: parseInt(eligibilityMonths),
          interestRate: parseFloat(interestRate),
          interestCalcMethod,
          allowPartialWithdraw,
          allowLoan,
          maxLoanPercent: parseFloat(maxLoanPercent),
          loanInterestRate: loanInterestRate ? parseFloat(loanInterestRate) : null,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/pension/provident-fund/policies/${json.data.id}`)
      } else {
        setError(json.error || 'Failed to create policy')
      }
    } catch {
      setError('Failed to create policy')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Create PF Policy" description="Define a new provident fund contribution policy">
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/policies')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader><CardTitle>Policy Details</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pf-name">Policy Name *</Label>
              <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard PF Policy" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-contrib-base">Contribution Base *</Label>
              <select id="pf-contrib-base" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={contributionBase} onChange={(e) => setContributionBase(e.target.value)}>
                <option value="BASIC">Basic Salary</option>
                <option value="BASIC_DA">Basic + DA</option>
                <option value="GROSS">Gross Salary</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pf-emp-rate">Employee Contribution Rate (%) *</Label>
              <Input id="pf-emp-rate" type="number" step="0.01" min="0" max="100" value={employeeContribRate} onChange={(e) => setEmployeeContribRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-empr-rate">Employer Contribution Rate (%) *</Label>
              <Input id="pf-empr-rate" type="number" step="0.01" min="0" max="100" value={employerContribRate} onChange={(e) => setEmployerContribRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-elig">Eligibility (Months)</Label>
              <Input id="pf-elig" type="number" min="0" value={eligibilityMonths} onChange={(e) => setEligibilityMonths(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pf-interest">Interest Rate (%) *</Label>
              <Input id="pf-interest" type="number" step="0.01" min="0" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-calc-method">Interest Calculation Method</Label>
              <select id="pf-calc-method" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={interestCalcMethod} onChange={(e) => setInterestCalcMethod(e.target.value)}>
                <option value="MONTHLY_BALANCE">Monthly Balance</option>
                <option value="YEARLY_BALANCE">Yearly Balance</option>
                <option value="DAILY_BALANCE">Daily Balance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 pt-6">
              <input id="pf-partial" type="checkbox" checked={allowPartialWithdraw} onChange={(e) => setAllowPartialWithdraw(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="pf-partial">Allow Partial Withdrawal</Label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input id="pf-loan" type="checkbox" checked={allowLoan} onChange={(e) => setAllowLoan(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="pf-loan">Allow Loan</Label>
            </div>
          </div>

          {allowLoan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pf-max-loan">Max Loan (% of Balance)</Label>
                <Input id="pf-max-loan" type="number" step="1" min="0" max="100" value={maxLoanPercent} onChange={(e) => setMaxLoanPercent(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-loan-rate">Loan Interest Rate (%)</Label>
                <Input id="pf-loan-rate" type="number" step="0.01" min="0" value={loanInterestRate} onChange={(e) => setLoanInterestRate(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr/pension/provident-fund/policies')} disabled={saving}>{tc('buttons.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Create Policy'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
