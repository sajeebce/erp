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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { useFormatters } from '@/hooks/use-formatters'

interface Member {
  id: string
  memberNo: string
  beneficiaryId: string
  status: string
  beneficiary?: { name: string }
}

interface LoanProduct {
  id: string
  productCode: string
  name: string
  minAmount: number | string
  maxAmount: number | string
  isActive: boolean
}

export default function NewLoanApplicationPage() {
  const router = useRouter()
  const t = useTranslations('microfinance')
  const tc = useTranslations('common')
  const { formatCurrency } = useFormatters()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [memberId, setMemberId] = useState('')
  const [productId, setProductId] = useState('')
  const [amountRequested, setAmountRequested] = useState('')
  const [purpose, setPurpose] = useState('')
  const [durationMonths, setDurationMonths] = useState('')
  const [notes, setNotes] = useState('')

  // Lookup data
  const [members, setMembers] = useState<Member[]>([])
  const [products, setProducts] = useState<LoanProduct[]>([])

  // Selected product info for display
  const selectedProduct = products.find((p) => p.id === productId)

  useEffect(() => {
    fetch('/api/v1/microfinance/samity?limit=200')
      .then(res => res.json())
      .then(async (json) => {
        if (json.success && json.data.length > 0) {
          // Fetch members from each samity
          const allMembers: Member[] = []
          for (const samity of json.data) {
            try {
              const mRes = await fetch(`/api/v1/microfinance/samity/${samity.id}/members`)
              const mJson = await mRes.json()
              if (mJson.success) {
                allMembers.push(...mJson.data)
              }
            } catch { /* skip */ }
          }
          setMembers(allMembers.filter((m) => m.status === 'ACTIVE'))
        }
      })
      .catch(() => {})

    fetch('/api/v1/microfinance/loan-products?limit=100')
      .then(res => res.json())
      .then(json => {
        if (json.success) setProducts(json.data.filter((p: LoanProduct) => p.isActive))
      })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    if (!memberId || !productId || !amountRequested || !purpose.trim() || !durationMonths) {
      setError(t('loanForm.requiredFields'))
      return false
    }
    const amount = parseFloat(amountRequested)
    if (isNaN(amount) || amount <= 0) {
      setError(t('loanForm.amountMustBePositive'))
      return false
    }
    if (selectedProduct) {
      if (amount < Number(selectedProduct.minAmount) || amount > Number(selectedProduct.maxAmount)) {
        setError(t('loanForm.amountOutOfRange', {
          min: formatCurrency(Number(selectedProduct.minAmount)),
          max: formatCurrency(Number(selectedProduct.maxAmount)),
        }))
        return false
      }
    }
    const duration = parseInt(durationMonths)
    if (isNaN(duration) || duration <= 0) {
      setError(t('loanForm.durationMustBePositive'))
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
      memberId,
      productId,
      amountRequested: parseFloat(amountRequested),
      purpose: purpose.trim(),
      durationMonths: parseInt(durationMonths),
    }
    if (notes.trim()) payload.notes = notes.trim()

    try {
      const res = await fetch('/api/v1/microfinance/loan-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push(`/microfinance/loan-applications/${json.data.id}`)
      } else {
        setError(json.error || t('loanForm.failedToCreate'))
      }
    } catch {
      setError(t('loanForm.failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('loanForm.createTitle')} description={t('loanForm.createDescription')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/microfinance/loan-applications')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('loanForm.applicationDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-member">{t('loanApplications.member')} *</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger id="loan-member" className="w-full">
                  <SelectValue placeholder={t('loanForm.selectMember')} />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.beneficiary?.name || m.memberNo} ({m.memberNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-product">{t('loanApplications.product')} *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="loan-product" className="w-full">
                  <SelectValue placeholder={t('loanForm.selectProduct')} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.productCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProduct && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="text-muted-foreground">{t('loanForm.amountRange')}:</span>{' '}
              <span className="font-mono">{formatCurrency(Number(selectedProduct.minAmount))}</span>
              {' - '}
              <span className="font-mono">{formatCurrency(Number(selectedProduct.maxAmount))}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-amount">{t('loanApplications.amountRequested')} *</Label>
              <Input
                id="loan-amount"
                type="number"
                min="0"
                step="0.01"
                value={amountRequested}
                onChange={(e) => setAmountRequested(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loan-duration">{t('loanForm.durationMonths')} *</Label>
              <Input
                id="loan-duration"
                type="number"
                min="1"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan-purpose">{t('loanApplications.purpose')} *</Label>
            <Textarea
              id="loan-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              placeholder={t('loanForm.purposePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan-notes">{t('loanForm.notes')}</Label>
            <Textarea
              id="loan-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/microfinance/loan-applications')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('loanForm.saving')}
              </>
            ) : (
              t('loanForm.submitApplication')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
