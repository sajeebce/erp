'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/shared/file-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import {
  DimensionSelector,
  type DimensionValue,
} from '@/components/finance/dimension-selector'
import { PageHeader } from '@/components/shared/page-header'

const VOUCHER_TYPES = ['DEBIT', 'RECEIPT', 'CASH', 'BANK', 'JOURNAL', 'CONTRA'] as const
type VoucherType = (typeof VOUCHER_TYPES)[number]

const PAYEE_TYPES: VoucherType[] = ['DEBIT', 'CASH']
const BANK_TYPES: VoucherType[] = ['BANK', 'RECEIPT']

interface BankAccount {
  id: string
  accountName: string
  bankName?: string
  accountNumber?: string
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function emptyDimensions(): DimensionValue {
  return {
    businessUnitId: null,
    costCenterId: null,
    fundClassId: null,
    projectId: null,
    grantId: null,
  }
}

export default function NewVoucherPage() {
  const router = useRouter()
  const t = useTranslations('finance.vouchers')
  const tt = useTranslations('finance.voucherTypes')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [type, setType] = useState<VoucherType | ''>('')
  const [date, setDate] = useState(todayISO())
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [payee, setPayee] = useState('')
  const [bankAccountId, setBankAccountId] = useState('')
  const [chequeNo, setChequeNo] = useState('')
  const [chequeDate, setChequeDate] = useState('')
  const [dimensions, setDimensions] = useState<DimensionValue>(emptyDimensions())

  // Lookup data
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  useEffect(() => {
    fetch('/api/v1/finance/bank-accounts')
      .then(res => res.json())
      .then(json => { if (json.success) setBankAccounts(json.data) })
      .catch(() => {})
  }, [])

  const showPayee = type !== '' && PAYEE_TYPES.includes(type as VoucherType)
  const showBank = type !== '' && BANK_TYPES.includes(type as VoucherType)
  const showCheque = showBank && bankAccountId !== ''
  const showChequeDate = showCheque && chequeNo !== ''

  function validate(): boolean {
    if (!type || !date || !description.trim()) {
      setError(t('requiredFields'))
      return false
    }
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) {
      setError(t('amountMustBePositive'))
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
      type,
      date,
      description: description.trim(),
      amount: parseFloat(amount),
    }
    if (showPayee && payee.trim()) payload.payee = payee.trim()
    if (showBank && bankAccountId) payload.bankAccountId = bankAccountId
    if (showCheque && chequeNo.trim()) payload.chequeNo = chequeNo.trim()
    if (showChequeDate && chequeDate) payload.chequeDate = chequeDate
    // Voucher schema only stores businessUnitId/projectId/grantId at header today.
    // CC/FC are accepted by the form but applied to the auto-generated JE on approval
    // via the line-level cascade (the approve handler reads voucher.businessUnitId).
    if (dimensions.businessUnitId) payload.businessUnitId = dimensions.businessUnitId
    if (dimensions.projectId) payload.projectId = dimensions.projectId
    if (dimensions.grantId) payload.grantId = dimensions.grantId

    try {
      const res = await fetch('/api/v1/finance/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/finance/vouchers/${json.data.id}`)
      } else {
        setError(json.error || t('failedToCreate'))
      }
    } catch {
      setError(t('failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('createVoucher')} description={t('description')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/finance/vouchers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('newVoucher')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Type + Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="voucher-type">{t('voucherType')} *</Label>
              <SearchableSelect
                id="voucher-type"
                options={VOUCHER_TYPES.map((vt) => ({ value: vt, label: tt(vt) }))}
                value={type}
                onValueChange={(v) => setType(v as VoucherType)}
                placeholder={t('selectType')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voucher-date">{t('date')} *</Label>
              <Input
                id="voucher-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="space-y-2">
            <Label htmlFor="voucher-description">{t('description')} *</Label>
            <Textarea
              id="voucher-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Row 3: Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="voucher-amount">{t('amount')} *</Label>
              <Input
                id="voucher-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {/* Payee (for DEBIT/CASH) */}
            {showPayee && (
              <div className="space-y-2">
                <Label htmlFor="voucher-payee">{t('payee')}</Label>
                <Input
                  id="voucher-payee"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Bank fields (for BANK/RECEIPT) */}
          {showBank && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voucher-bank-account">{t('bankAccount')}</Label>
                <SearchableSelect
                  id="voucher-bank-account"
                  options={bankAccounts.map((ba) => ({ value: ba.id, label: `${ba.accountName}${ba.bankName ? ` - ${ba.bankName}` : ''}` }))}
                  value={bankAccountId}
                  onValueChange={setBankAccountId}
                  placeholder={t('selectBankAccount')}
                />
              </div>

              {showCheque && (
                <div className="space-y-2">
                  <Label htmlFor="voucher-cheque-no">{t('chequeNo')}</Label>
                  <Input
                    id="voucher-cheque-no"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                  />
                </div>
              )}

              {showChequeDate && (
                <div className="space-y-2">
                  <Label htmlFor="voucher-cheque-date">{t('chequeDate')}</Label>
                  <Input
                    id="voucher-cheque-date"
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Multi-concern dimensions */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-baseline justify-between">
              <Label className="text-sm font-medium">Dimensions</Label>
              <span className="text-xs text-muted-foreground">
                Cascade to the auto-posted JE on approval
              </span>
            </div>
            <DimensionSelector
              level="header"
              value={dimensions}
              onChange={setDimensions}
              idPrefix="voucher"
            />
          </div>

          {/* Attachments */}
          <FileUpload entityType="voucher" entityId={null} module="finance" />
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/finance/vouchers')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('saveAsDraft')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
