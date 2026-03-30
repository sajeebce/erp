'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Employee { id: string; employeeNo: string; fullName: string }
interface BalanceInfo { availableBalance: number }

export default function NewPFWithdrawalPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null)

  const [employeeId, setEmployeeId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetch('/api/v1/hr/employees?limit=500')
      .then(res => res.json())
      .then(json => { if (json.success) setEmployees(json.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (employeeId) {
      fetch(`/api/v1/hr/provident-fund/enrollments/balance/${employeeId}`)
        .then(res => res.json())
        .then(json => { if (json.success) setBalanceInfo(json.data) })
        .catch(() => setBalanceInfo(null))
    } else {
      setBalanceInfo(null)
    }
  }, [employeeId])

  async function handleSubmit() {
    if (!employeeId || !amount || !reason) {
      setError('Employee, amount, and reason are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/v1/hr/provident-fund/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          amount: parseFloat(amount),
          reason,
          description: description.trim(),
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/hr/pension/provident-fund/withdrawals/${json.data.id}`)
      } else {
        setError(json.error || 'Failed to submit withdrawal')
      }
    } catch {
      setError('Failed to submit withdrawal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Apply for PF Withdrawal" description="Submit a provident fund withdrawal request">
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/withdrawals')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader><CardTitle>Withdrawal Details</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <SearchableSelect
                options={employees.map(e => ({ value: e.id, label: `${e.fullName} (${e.employeeNo})` }))}
                value={employeeId}
                onValueChange={setEmployeeId}
                placeholder="Select employee..."
              />
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="">Select reason...</option>
                <option value="MEDICAL">Medical</option>
                <option value="HOUSING">Housing</option>
                <option value="EDUCATION">Education</option>
                <option value="MARRIAGE">Marriage</option>
                <option value="HARDSHIP">Financial Hardship</option>
              </select>
            </div>
          </div>

          {balanceInfo && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">Available Balance: <span className="font-mono font-bold">{formatCurrency(balanceInfo.availableBalance)}</span></p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Provide details for the withdrawal request..." />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr/pension/provident-fund/withdrawals')} disabled={saving}>{tc('buttons.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Withdrawal'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
