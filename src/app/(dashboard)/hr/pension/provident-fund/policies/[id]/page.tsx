'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/shared/page-header'

interface PFPolicy {
  id: string
  name: string
  employeeContribRate: number
  employerContribRate: number
  contributionBase: string
  eligibilityMonths: number
  interestRate: number
  interestCalcMethod: string
  allowPartialWithdraw: boolean
  allowLoan: boolean
  maxLoanPercent: number
  loanInterestRate: number | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

export default function PFPolicyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [policy, setPolicy] = useState<PFPolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

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

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/v1/hr/pf/policies/${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          const p = json.data
          setPolicy(p)
          setName(p.name)
          setEmployeeContribRate(String(p.employeeContribRate))
          setEmployerContribRate(String(p.employerContribRate))
          setContributionBase(p.contributionBase || 'BASIC')
          setEligibilityMonths(String(p.eligibilityMonths || 0))
          setInterestRate(String(p.interestRate))
          setInterestCalcMethod(p.interestCalcMethod || 'MONTHLY_BALANCE')
          setAllowPartialWithdraw(p.allowPartialWithdraw)
          setAllowLoan(p.allowLoan)
          setMaxLoanPercent(String(p.maxLoanPercent || 80))
          setLoanInterestRate(p.loanInterestRate != null ? String(p.loanInterestRate) : '')
        } else {
          setError(tc('errors.notFound'))
        }
      })
      .catch(() => setError(tc('errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [params.id, tc])

  async function handleSave() {
    if (!name.trim() || !employeeContribRate || !employerContribRate || !interestRate) {
      setError('Please fill all required fields')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/hr/pf/policies/${params.id}`, {
        method: 'PUT',
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
        setPolicy(json.data)
        setEditing(false)
      } else {
        setError(json.error || 'Failed to update policy')
      }
    } catch {
      setError('Failed to update policy')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!policy) {
    return (
      <div className="space-y-6">
        <PageHeader title="PF Policy" description="">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/policies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card><CardContent className="py-10 text-center text-muted-foreground">{error || tc('errors.notFound')}</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={editing ? 'Edit PF Policy' : policy.name} description={editing ? 'Update policy settings' : 'Policy details and configuration'}>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/policies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
          </Button>
          {!editing && (
            <Button size="sm" onClick={() => setEditing(true)}>{tc('buttons.edit')}</Button>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
      )}

      {!editing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Contribution Rates</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Employee Rate:</span> <span className="font-mono font-medium">{policy.employeeContribRate}%</span></div>
              <div><span className="text-muted-foreground">Employer Rate:</span> <span className="font-mono font-medium">{policy.employerContribRate}%</span></div>
              <div><span className="text-muted-foreground">Contribution Base:</span> <span className="font-medium">{policy.contributionBase}</span></div>
              <div><span className="text-muted-foreground">Eligibility:</span> <span className="font-medium">{policy.eligibilityMonths} months</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Interest & Loans</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Interest Rate:</span> <span className="font-mono font-medium">{policy.interestRate}%</span></div>
              <div><span className="text-muted-foreground">Calc Method:</span> <span className="font-medium">{policy.interestCalcMethod}</span></div>
              <div><span className="text-muted-foreground">Partial Withdrawal:</span> <StatusBadge status={policy.allowPartialWithdraw ? 'YES' : 'NO'} /></div>
              <div><span className="text-muted-foreground">Loan Allowed:</span> <StatusBadge status={policy.allowLoan ? 'YES' : 'NO'} /></div>
              {policy.allowLoan && (
                <>
                  <div><span className="text-muted-foreground">Max Loan:</span> <span className="font-mono">{policy.maxLoanPercent}%</span></div>
                  <div><span className="text-muted-foreground">Loan Interest:</span> <span className="font-mono">{policy.loanInterestRate ?? '\u2014'}%</span></div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle>Edit Policy</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Policy Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contribution Base</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={contributionBase} onChange={(e) => setContributionBase(e.target.value)}>
                  <option value="BASIC">Basic Salary</option>
                  <option value="BASIC_DA">Basic + DA</option>
                  <option value="GROSS">Gross Salary</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Employee Rate (%) *</Label><Input type="number" step="0.01" value={employeeContribRate} onChange={(e) => setEmployeeContribRate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Employer Rate (%) *</Label><Input type="number" step="0.01" value={employerContribRate} onChange={(e) => setEmployerContribRate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Eligibility (Months)</Label><Input type="number" min="0" value={eligibilityMonths} onChange={(e) => setEligibilityMonths(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Interest Rate (%) *</Label><Input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Calc Method</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={interestCalcMethod} onChange={(e) => setInterestCalcMethod(e.target.value)}>
                  <option value="MONTHLY_BALANCE">Monthly Balance</option>
                  <option value="YEARLY_BALANCE">Yearly Balance</option>
                  <option value="DAILY_BALANCE">Daily Balance</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={allowPartialWithdraw} onChange={(e) => setAllowPartialWithdraw(e.target.checked)} className="h-4 w-4" />
                <Label>Allow Partial Withdrawal</Label>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={allowLoan} onChange={(e) => setAllowLoan(e.target.checked)} className="h-4 w-4" />
                <Label>Allow Loan</Label>
              </div>
            </div>
            {allowLoan && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Max Loan (%)</Label><Input type="number" value={maxLoanPercent} onChange={(e) => setMaxLoanPercent(e.target.value)} /></div>
                <div className="space-y-2"><Label>Loan Interest Rate (%)</Label><Input type="number" step="0.01" value={loanInterestRate} onChange={(e) => setLoanInterestRate(e.target.value)} /></div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>{tc('buttons.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
