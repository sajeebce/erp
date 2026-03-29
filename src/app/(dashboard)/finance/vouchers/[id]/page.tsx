'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, ChevronDown, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useFormatters } from '@/hooks/use-formatters'
import { FileUpload } from '@/components/shared/file-upload'

const VOUCHER_TYPES = ['DEBIT', 'RECEIPT', 'CASH', 'BANK', 'JOURNAL', 'CONTRA'] as const
type VoucherType = (typeof VOUCHER_TYPES)[number]

const PAYEE_TYPES: VoucherType[] = ['DEBIT', 'CASH']
const BANK_TYPES: VoucherType[] = ['BANK', 'RECEIPT']

interface JournalEntryLine {
  id: string
  accountCode: string
  accountName: string
  debit: number | string
  credit: number | string
  description?: string
}

interface JournalEntry {
  id: string
  entryNo: string
  date: string
  description: string
  status: string
  lines: JournalEntryLine[]
}

interface VoucherData {
  id: string
  voucherNo: string
  type: VoucherType
  date: string
  description: string
  amount: number | string
  payee: string | null
  bankAccountId: string | null
  bankAccount?: { id: string; accountName: string; bankName?: string; accountNumber?: string } | null
  chequeNo: string | null
  chequeDate: string | null
  projectId: string | null
  project?: { id: string; name: string; code?: string } | null
  grantId: string | null
  grant?: { id: string; name: string; code?: string } | null
  status: string
  journalEntry?: JournalEntry | null
  createdBy?: { name: string; email?: string } | null
  createdAt: string
  approvedBy?: { name: string; email?: string } | null
}

interface BankAccount {
  id: string
  accountName: string
  bankName?: string
  accountNumber?: string
}

interface Project {
  id: string
  name: string
  code?: string
}

interface Grant {
  id: string
  name: string
  code?: string
}

export default function VoucherDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const t = useTranslations('finance.vouchers')
  const tt = useTranslations('finance.voucherTypes')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [voucher, setVoucher] = useState<VoucherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [jeOpen, setJeOpen] = useState(false)

  // Edit form state
  const [formType, setFormType] = useState<VoucherType | ''>('')
  const [formDate, setFormDate] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formPayee, setFormPayee] = useState('')
  const [formBankAccountId, setFormBankAccountId] = useState('')
  const [formChequeNo, setFormChequeNo] = useState('')
  const [formChequeDate, setFormChequeDate] = useState('')
  const [formProjectId, setFormProjectId] = useState('')
  const [formGrantId, setFormGrantId] = useState('')

  // Lookup data
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [grants, setGrants] = useState<Grant[]>([])

  const fetchVoucher = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/finance/vouchers/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setVoucher(json.data)
      } else {
        setError(json.error?.message || t('failedToLoad'))
      }
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    fetchVoucher()
  }, [fetchVoucher])

  useEffect(() => {
    fetch('/api/v1/finance/bank-accounts')
      .then(res => res.json())
      .then(json => { if (json.success) setBankAccounts(json.data) })
      .catch(() => {})

    fetch('/api/v1/projects?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setProjects(json.data) })
      .catch(() => {})

    fetch('/api/v1/donors/grants?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setGrants(json.data) })
      .catch(() => {})
  }, [])

  function startEditing() {
    if (!voucher) return
    setFormType(voucher.type)
    setFormDate(voucher.date?.split('T')[0] || '')
    setFormDescription(voucher.description)
    setFormAmount(String(voucher.amount))
    setFormPayee(voucher.payee || '')
    setFormBankAccountId(voucher.bankAccountId || '')
    setFormChequeNo(voucher.chequeNo || '')
    setFormChequeDate(voucher.chequeDate?.split('T')[0] || '')
    setFormProjectId(voucher.projectId || '')
    setFormGrantId(voucher.grantId || '')
    setEditing(true)
    setError('')
  }

  function cancelEditing() {
    setEditing(false)
    setError('')
  }

  const showPayee = formType !== '' && PAYEE_TYPES.includes(formType as VoucherType)
  const showBank = formType !== '' && BANK_TYPES.includes(formType as VoucherType)
  const showCheque = showBank && formBankAccountId !== ''
  const showChequeDate = showCheque && formChequeNo !== ''

  function validate(): boolean {
    if (!formType || !formDate || !formDescription.trim()) {
      setError(t('requiredFields'))
      return false
    }
    const amt = parseFloat(formAmount)
    if (!formAmount || isNaN(amt) || amt <= 0) {
      setError(t('amountMustBePositive'))
      return false
    }
    setError('')
    return true
  }

  async function handleUpdate() {
    if (!validate()) return

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      type: formType,
      date: formDate,
      description: formDescription.trim(),
      amount: parseFloat(formAmount),
    }
    if (showPayee && formPayee.trim()) payload.payee = formPayee.trim()
    if (showBank && formBankAccountId) payload.bankAccountId = formBankAccountId
    if (showCheque && formChequeNo.trim()) payload.chequeNo = formChequeNo.trim()
    if (showChequeDate && formChequeDate) payload.chequeDate = formChequeDate
    if (formProjectId) payload.projectId = formProjectId
    if (formGrantId) payload.grantId = formGrantId

    try {
      const res = await fetch(`/api/v1/finance/vouchers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditing(false)
        await fetchVoucher()
      } else {
        setError(json.error?.message || t('failedToUpdate'))
      }
    } catch {
      setError(t('failedToUpdate'))
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove() {
    try {
      const res = await fetch(`/api/v1/finance/vouchers/${id}/approve`, {
        method: 'POST',
      })
      const json = await res.json()
      if (res.ok && json.success) {
        await fetchVoucher()
      } else {
        setError(json.error?.message || json.message || t('failedToUpdate'))
      }
    } catch {
      setError(t('failedToUpdate'))
    }
  }

  async function handleReject() {
    try {
      const res = await fetch(`/api/v1/finance/vouchers/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setRejectReason('')
        await fetchVoucher()
      } else {
        setError(json.error?.message || json.message || t('failedToUpdate'))
      }
    } catch {
      setError(t('failedToUpdate'))
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/v1/finance/vouchers/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push('/finance/vouchers')
      } else {
        setError(json.error?.message || t('failedToUpdate'))
      }
    } catch {
      setError(t('failedToUpdate'))
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error && !voucher) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('voucherDetail')}>
          <Button variant="outline" size="sm" onClick={() => router.push('/finance/vouchers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!voucher) return null

  const isDraft = voucher.status === 'DRAFT'
  const isReadOnly = !isDraft || !editing

  // VIEW MODE
  if (!editing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${t('voucherNo')}: ${voucher.voucherNo}`}
          description={t('voucherDetail')}
        >
          <Button variant="outline" size="sm" onClick={() => router.push('/finance/vouchers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                {voucher.voucherNo}
                <StatusBadge status={voucher.type} />
                <StatusBadge status={voucher.status} />
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label={t('voucherType')} value={tt(voucher.type)} />
              <DetailItem label={t('date')} value={formatDate(voucher.date)} />
              <DetailItem label={t('amount')} value={formatCurrency(Number(voucher.amount))} />
              {voucher.payee && (
                <DetailItem label={t('payee')} value={voucher.payee} />
              )}
              {voucher.bankAccount && (
                <DetailItem
                  label={t('bankAccount')}
                  value={`${voucher.bankAccount.accountName}${voucher.bankAccount.bankName ? ` - ${voucher.bankAccount.bankName}` : ''}`}
                />
              )}
              {voucher.chequeNo && (
                <DetailItem label={t('chequeNo')} value={voucher.chequeNo} />
              )}
              {voucher.chequeDate && (
                <DetailItem label={t('chequeDate')} value={formatDate(voucher.chequeDate)} />
              )}
              {voucher.project && (
                <DetailItem
                  label={t('project')}
                  value={`${voucher.project.code ? `${voucher.project.code} - ` : ''}${voucher.project.name}`}
                />
              )}
              {voucher.grant && (
                <DetailItem
                  label={t('grant')}
                  value={`${voucher.grant.code ? `${voucher.grant.code} - ` : ''}${voucher.grant.name}`}
                />
              )}
              <DetailItem label={t('status')}><StatusBadge status={voucher.status} /></DetailItem>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">{t('description')}</span>
              <p className="text-sm">{voucher.description}</p>
            </div>

            {/* Attachments */}
            <div className="border-t pt-4">
              <FileUpload entityType="voucher" entityId={id} module="finance" readOnly={voucher.status !== 'DRAFT'} />
            </div>

            {/* Metadata */}
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {voucher.createdBy && (
                <DetailItem label={t('createdBy')} value={voucher.createdBy.name} />
              )}
              <DetailItem label={t('createdAt')} value={formatDate(voucher.createdAt)} />
              {voucher.approvedBy && (
                <DetailItem label={t('approvedBy')} value={voucher.approvedBy.name} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Journal Entry Section */}
        {voucher.journalEntry && (
          <Collapsible open={jeOpen} onOpenChange={setJeOpen}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent">
                    <CardTitle className="flex items-center gap-2">
                      {t('journalEntry')}: {voucher.journalEntry.entryNo}
                      <StatusBadge status={voucher.journalEntry.status} />
                    </CardTitle>
                    <ChevronDown className={`h-5 w-5 transition-transform ${jeOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">{tc('labels.description')}</th>
                          <th className="text-left py-2 px-3 font-medium">{tc('accountNature.DEBIT')}</th>
                          <th className="text-left py-2 px-3 font-medium">{tc('accountNature.CREDIT')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voucher.journalEntry.lines.map((line) => (
                          <tr key={line.id} className="border-b last:border-0">
                            <td className="py-2 px-3">
                              <div className="font-medium">{line.accountName}</div>
                              <div className="text-muted-foreground text-xs">{line.accountCode}</div>
                              {line.description && (
                                <div className="text-muted-foreground text-xs">{line.description}</div>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono">
                              {Number(line.debit) > 0 ? formatCurrency(Number(line.debit)) : '\u2014'}
                            </td>
                            <td className="py-2 px-3 font-mono">
                              {Number(line.credit) > 0 ? formatCurrency(Number(line.credit)) : '\u2014'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Action Buttons */}
        {isDraft && (
          <Card>
            <CardContent className="flex flex-wrap gap-3 pt-6">
              <Button onClick={startEditing}>
                <Pencil className="h-4 w-4 mr-2" />
                {tc('buttons.edit')}
              </Button>

              <ConfirmDialog
                trigger={
                  <Button variant="default">
                    {t('approve')}
                  </Button>
                }
                title={t('approve')}
                description={t('confirmApprove')}
                confirmText={t('approve')}
                variant="default"
                onConfirm={handleApprove}
              />

              <ConfirmDialog
                trigger={
                  <Button variant="outline">
                    {t('reject')}
                  </Button>
                }
                title={t('reject')}
                description={t('confirmReject')}
                confirmText={t('reject')}
                variant="destructive"
                onConfirm={handleReject}
              />

              <ConfirmDialog
                trigger={
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {tc('buttons.delete')}
                  </Button>
                }
                title={tc('buttons.delete')}
                description={t('confirmDelete')}
                confirmText={tc('buttons.delete')}
                variant="destructive"
                onConfirm={handleDelete}
              />
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // EDIT MODE
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('editVoucher')}
        description={`${t('voucherNo')}: ${voucher.voucherNo}`}
      >
        <Button variant="outline" size="sm" onClick={cancelEditing}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.cancel')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('editVoucher')}</CardTitle>
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
              <Label htmlFor="edit-voucher-type">{t('voucherType')} *</Label>
              <SearchableSelect
                id="edit-voucher-type"
                options={VOUCHER_TYPES.map((vt) => ({ value: vt, label: tt(vt) }))}
                value={formType}
                onValueChange={(v) => setFormType(v as VoucherType)}
                placeholder={t('selectType')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-voucher-date">{t('date')} *</Label>
              <Input
                id="edit-voucher-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-voucher-description">{t('description')} *</Label>
            <Textarea
              id="edit-voucher-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Row 3: Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-voucher-amount">{t('amount')} *</Label>
              <Input
                id="edit-voucher-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                required
              />
            </div>

            {showPayee && (
              <div className="space-y-2">
                <Label htmlFor="edit-voucher-payee">{t('payee')}</Label>
                <Input
                  id="edit-voucher-payee"
                  value={formPayee}
                  onChange={(e) => setFormPayee(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Bank fields */}
          {showBank && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-voucher-bank-account">{t('bankAccount')}</Label>
                <SearchableSelect
                  id="edit-voucher-bank-account"
                  options={bankAccounts.map((ba) => ({ value: ba.id, label: `${ba.accountName}${ba.bankName ? ` - ${ba.bankName}` : ''}` }))}
                  value={formBankAccountId}
                  onValueChange={setFormBankAccountId}
                  placeholder={t('selectBankAccount')}
                />
              </div>

              {showCheque && (
                <div className="space-y-2">
                  <Label htmlFor="edit-voucher-cheque-no">{t('chequeNo')}</Label>
                  <Input
                    id="edit-voucher-cheque-no"
                    value={formChequeNo}
                    onChange={(e) => setFormChequeNo(e.target.value)}
                  />
                </div>
              )}

              {showChequeDate && (
                <div className="space-y-2">
                  <Label htmlFor="edit-voucher-cheque-date">{t('chequeDate')}</Label>
                  <Input
                    id="edit-voucher-cheque-date"
                    type="date"
                    value={formChequeDate}
                    onChange={(e) => setFormChequeDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Project + Grant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-voucher-project">{t('project')}</Label>
              <SearchableSelect
                id="edit-voucher-project"
                options={projects.map((p) => ({ value: p.id, label: `${p.code ? `${p.code} - ` : ''}${p.name}` }))}
                value={formProjectId}
                onValueChange={setFormProjectId}
                placeholder={t('selectProject')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-voucher-grant">{t('grant')}</Label>
              <SearchableSelect
                id="edit-voucher-grant"
                options={grants.map((g) => ({ value: g.id, label: `${g.code ? `${g.code} - ` : ''}${g.name}` }))}
                value={formGrantId}
                onValueChange={setFormGrantId}
                placeholder={t('selectGrant')}
              />
            </div>
          </div>
        </CardContent>

        <CardContent className="pt-0">
          <FileUpload entityType="voucher" entityId={id} module="finance" readOnly={false} />
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={cancelEditing} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleUpdate} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              tc('buttons.save')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function DetailItem({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children ? (
        <div>{children}</div>
      ) : (
        <p className="text-sm font-medium">{value || '\u2014'}</p>
      )}
    </div>
  )
}
