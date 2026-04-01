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

export default function NewPFInvestmentPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [type, setType] = useState('')
  const [institution, setInstitution] = useState('')
  const [amount, setAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [maturityDate, setMaturityDate] = useState('')

  async function handleSubmit() {
    if (!type || !institution.trim() || !amount || !interestRate || !startDate || !maturityDate) {
      setError('Please fill all required fields')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/v1/hr/pf/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          institution: institution.trim(),
          amount: parseFloat(amount),
          interestRate: parseFloat(interestRate),
          startDate,
          maturityDate,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push('/hr/pension/provident-fund/investments')
      } else {
        setError(json.error || 'Failed to create investment')
      }
    } catch {
      setError('Failed to create investment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Investment" description="Add a new investment to the PF portfolio">
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/provident-fund/investments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader><CardTitle>Investment Details</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {error && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Investment Type *</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Select type...</option>
                <option value="FDR">Fixed Deposit Receipt (FDR)</option>
                <option value="GOVT_SECURITIES">Government Securities</option>
                <option value="ICB_UNIT">ICB Unit Certificate</option>
                <option value="BANK_DEPOSIT">Bank Deposit</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Institution *</Label>
              <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. Bangladesh Bank, Sonali Bank" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Investment amount" />
            </div>
            <div className="space-y-2">
              <Label>Interest Rate (%) *</Label>
              <Input type="number" step="0.01" min="0" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Maturity Date *</Label>
              <Input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr/pension/provident-fund/investments')} disabled={saving}>{tc('buttons.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create Investment'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
