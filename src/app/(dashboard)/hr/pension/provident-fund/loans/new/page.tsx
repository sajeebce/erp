'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Employee { id: string; employeeNo: string; fullName: string }
interface BalanceInfo { ownBalance: number; maxLoanAmount: number; loanInterestRate: number }

export default function NewPFLoanPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null)

  const [employeeId, setEmployeeId] = useState('')
  const [principal, setPrincipal] = useState('')
  const [repaymentMonths, setRepaymentMonths] = useState('12')

  useEffect(() => {
    fetch('/api/v1/hr/employees?limit=500')
      .then(res => res.json())
      .then(json => { if (json.success) setEmployees(json.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (employeeId) {
      fetch(`/api/v1/hr/provident-fund/loans/eligibility/${employeeId}`)
        .then(res => res.json())
        .then(json => { if (json.success) setBalanceInfo(json.data) })
        .catch(() => setBalanceInfo(null))
    } else {
      setBalanceInfo(null)
    }
  }, [employeeId])

  const calculation = useMemo(() => {
    const p = parseFloat(principal) || 0
    const months = parseInt(repaymentMonths) || 12
    const annualRate = balanceInfo?.loanInterestRate || 8
    const monthlyRate = annualRate / 100 / 12

    if (p <= 0 || months <= 0) return null

    const totalInterest = p * (annualRate / 100) * (months / 12)
    const totalRepayable = p + totalInterest
    const emi = totalRepayable / months

    return { totalInterest, totalRepayable, emi }
  }, [principal, repaymentMonths, balanceInfo])

  async function handleSubmit() {
    if (!employeeId || !principal || !repaymentMonths) {
      setError('Employee, principal amount, and repayment months are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/v1/hr/provident-fund/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          principalAmount: parseFloat(principal),
          repaymentMonths: parseInt(repaymentMonths),
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/pension/provident-fund/loans/${json.data.id}`)
      } else {
        setError(json.error || 'Failed to apply for loan')
      }
    } catch {
      setError('Failed to apply for loan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Apply for PF Loan" description="Submit a loan application against provident fund balance">
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/loans')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Loan Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

              <div className="space-y-2">
                <Label>Employee *</Label>
                <SearchableSelect
                  options={employees.map(e => ({ value: e.id, label: `${e.fullName} (${e.employeeNo})` }))}
                  value={employeeId}
                  onValueChange={setEmployeeId}
                  placeholder="Select employee..."
                />
              </div>

              {balanceInfo && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 space-y-1">
                  <p className="text-sm text-blue-800 dark:text-blue-200">Own Balance: <span className="font-mono font-bold">{formatCurrency(balanceInfo.ownBalance)}</span></p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">Max Eligible (80%): <span className="font-mono font-bold">{formatCurrency(balanceInfo.maxLoanAmount)}</span></p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">Loan Interest Rate: <span className="font-mono font-bold">{balanceInfo.loanInterestRate}%</span></p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Principal Amount *</Label>
                  <Input type="number" step="0.01" min="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="Enter loan amount" />
                </div>
                <div className="space-y-2">
                  <Label>Repayment Months *</Label>
                  <Input type="number" min="1" max="60" value={repaymentMonths} onChange={(e) => setRepaymentMonths(e.target.value)} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.push('/hr/pension/provident-fund/loans')} disabled={saving}>{tc('buttons.cancel')}</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Loan Application'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>Loan Calculator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {calculation ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly EMI</p>
                    <p className="text-2xl font-bold font-mono">{formatCurrency(calculation.emi)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Interest</p>
                    <p className="text-lg font-medium font-mono text-orange-600">{formatCurrency(calculation.totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Repayable</p>
                    <p className="text-lg font-medium font-mono">{formatCurrency(calculation.totalRepayable)}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Enter principal amount and repayment months to see calculations</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
