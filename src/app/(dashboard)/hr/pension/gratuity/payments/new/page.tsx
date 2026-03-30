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

const PAYMENT_TYPES = [
  { value: 'FINAL_SETTLEMENT', label: 'Final Settlement' },
  { value: 'INTERIM', label: 'Interim Payment' },
  { value: 'PARTIAL', label: 'Partial Payment' },
]

interface LedgerOption {
  employeeId: string
  employeeName: string
  employeeNo: string
  currentBalance: number
  isVested: boolean
}

export default function NewGratuityPaymentPage() {
  const router = useRouter()
  const t = useTranslations('hr')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [employeeId, setEmployeeId] = useState('')
  const [paymentType, setPaymentType] = useState('FINAL_SETTLEMENT')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const [ledgers, setLedgers] = useState<LedgerOption[]>([])

  useEffect(() => {
    fetch('/api/v1/hr/gratuity/ledgers')
      .then(res => res.json())
      .then(json => { if (json.success) setLedgers(json.data) })
      .catch(() => {})
  }, [])

  const selectedLedger = ledgers.find(l => l.employeeId === employeeId)

  function validate(): boolean {
    if (!employeeId || !paymentType || !amount) {
      setError('Please fill in all required fields (Employee, Payment Type, Amount).')
      return false
    }
    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than zero.')
      return false
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!validate()) return

    setSaving(true)
    setError('')

    const payload = {
      employeeId,
      paymentType,
      amount: parseFloat(amount),
      notes: notes.trim() || null,
    }

    try {
      const res = await fetch('/api/v1/hr/gratuity/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push('/hr/pension/gratuity/payments')
      } else {
        setError(json.error || 'Failed to create payment.')
      }
    } catch {
      setError('Failed to create payment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Gratuity Payment" description="Create a gratuity payment for an employee">
        <Button variant="outline" size="sm" onClick={() => router.push('/hr/pension/gratuity/payments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-employee">Employee *</Label>
              <SearchableSelect
                id="payment-employee"
                options={ledgers.map((l) => ({ value: l.employeeId, label: `${l.employeeName} (${l.employeeNo})` }))}
                value={employeeId}
                onValueChange={setEmployeeId}
                placeholder="Select employee..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-type">Payment Type *</Label>
              <SearchableSelect
                id="payment-type"
                options={PAYMENT_TYPES}
                value={paymentType}
                onValueChange={setPaymentType}
              />
            </div>
          </div>

          {/* Employee Balance Info */}
          {selectedLedger && (
            <div className="rounded-md bg-muted/50 border p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Balance:</span>
                  <p className="font-mono font-bold text-lg">{formatCurrency(selectedLedger.currentBalance)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vested:</span>
                  <p className="font-medium">{selectedLedger.isVested ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount *</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Notes</Label>
            <Textarea
              id="payment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes..."
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/hr/pension/gratuity/payments')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Create Payment'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
