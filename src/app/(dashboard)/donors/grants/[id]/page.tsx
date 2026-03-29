'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { useFormatters } from '@/hooks/use-formatters'

const GRANT_STATUSES = [
  'PIPELINE',
  'PROPOSAL',
  'NEGOTIATION',
  'ACTIVE',
  'SUSPENDED',
  'COMPLETED',
  'CLOSED',
] as const

interface FundReceipt {
  id: string
  receiptNo: string
  date: string
  amount: number | string
  currencyCode: string
  amountInBDT: number | string
  status: string
  bankReference: string | null
  createdAt: string
}

interface FundRequisition {
  id: string
  requisitionNo: string
  date: string
  amount: number | string
  purpose: string
  status: string
  createdAt: string
}

interface GrantBudget {
  id: string
  name: string
  totalAmount: number | string
  status: string
}

interface Project {
  id: string
  name: string
}

interface GrantData {
  id: string
  grantNo: string
  title: string
  donorId: string
  donor?: { id: string; name: string; type: string; country: string; email: string }
  projectId: string | null
  project?: { id: string; name: string } | null
  awardAmount: number | string
  disbursedAmount: number | string
  currencyCode: string
  startDate: string | null
  endDate: string | null
  status: string
  lifecycleStage: string
  ngoabFdNo: string | null
  agreementRef: string | null
  description: string | null
  notes: string | null
  fundReceipts: FundReceipt[]
  fundRequisitions: FundRequisition[]
  budgets: GrantBudget[]
  createdAt: string
  updatedAt: string
}

export default function GrantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const t = useTranslations('donors')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [grant, setGrant] = useState<GrantData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [formTitle, setFormTitle] = useState('')
  const [formAwardAmount, setFormAwardAmount] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formStatus, setFormStatus] = useState('')
  const [formProjectId, setFormProjectId] = useState('')
  const [formNgoabFdNo, setFormNgoabFdNo] = useState('')
  const [formAgreementRef, setFormAgreementRef] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formNotes, setFormNotes] = useState('')

  // Lookup data
  const [projects, setProjects] = useState<Project[]>([])

  const fetchGrant = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/donors/grants/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setGrant(json.data)
      } else {
        setError(json.error || t('grantForm.failedToLoad'))
      }
    } catch {
      setError(t('grantForm.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    fetchGrant()
  }, [fetchGrant])

  useEffect(() => {
    fetch('/api/v1/projects?limit=200')
      .then(res => res.json())
      .then(json => { if (json.success) setProjects(json.data) })
      .catch(() => {})
  }, [])

  function startEditing() {
    if (!grant) return
    setFormTitle(grant.title)
    setFormAwardAmount(String(grant.awardAmount))
    setFormStartDate(grant.startDate?.split('T')[0] || '')
    setFormEndDate(grant.endDate?.split('T')[0] || '')
    setFormStatus(grant.status)
    setFormProjectId(grant.projectId || '')
    setFormNgoabFdNo(grant.ngoabFdNo || '')
    setFormAgreementRef(grant.agreementRef || '')
    setFormDescription(grant.description || '')
    setFormNotes(grant.notes || '')
    setEditing(true)
    setError('')
  }

  function cancelEditing() {
    setEditing(false)
    setError('')
  }

  function validate(): boolean {
    if (!formTitle.trim()) {
      setError(t('grantForm.requiredFields'))
      return false
    }
    const amt = parseFloat(formAwardAmount)
    if (!formAwardAmount || isNaN(amt) || amt <= 0) {
      setError(t('grantForm.amountMustBePositive'))
      return false
    }
    if (formStartDate && formEndDate && new Date(formEndDate) <= new Date(formStartDate)) {
      setError(t('grantForm.endDateAfterStart'))
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
      title: formTitle.trim(),
      awardAmount: parseFloat(formAwardAmount),
      status: formStatus,
      startDate: formStartDate || null,
      endDate: formEndDate || null,
      projectId: formProjectId || null,
      ngoabFdNo: formNgoabFdNo.trim() || null,
      agreementRef: formAgreementRef.trim() || null,
      description: formDescription.trim() || null,
      notes: formNotes.trim() || null,
    }

    try {
      const res = await fetch(`/api/v1/donors/grants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditing(false)
        await fetchGrant()
      } else {
        setError(json.error || t('grantForm.failedToUpdate'))
      }
    } catch {
      setError(t('grantForm.failedToUpdate'))
    } finally {
      setSaving(false)
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

  // Error state (no data)
  if (error && !grant) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('grantForm.grantDetail')}>
          <Button variant="outline" size="sm" onClick={() => router.push('/donors/grants')}>
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

  if (!grant) return null

  const disbursedPercent = Number(grant.awardAmount) > 0
    ? Math.round((Number(grant.disbursedAmount) / Number(grant.awardAmount)) * 10000) / 100
    : 0

  // VIEW MODE
  if (!editing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${grant.grantNo} - ${grant.title}`}
          description={t('grantForm.grantDetail')}
        >
          <Button variant="outline" size="sm" onClick={() => router.push('/donors/grants')}>
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
                {grant.grantNo}
                <StatusBadge status={grant.status} />
                <StatusBadge status={grant.lifecycleStage} />
              </CardTitle>
              <Button size="sm" onClick={startEditing}>
                <Pencil className="h-4 w-4 mr-2" />
                {tc('buttons.edit')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label={t('grants.grantTitle')} value={grant.title} />
              <DetailItem label={t('grants.donor')} value={grant.donor?.name} />
              <DetailItem label={t('grants.awardAmount')} value={formatCurrency(Number(grant.awardAmount))} />
              <DetailItem label={t('grantForm.disbursed')} value={formatCurrency(Number(grant.disbursedAmount))} />
              <DetailItem label={t('grantForm.disbursedPercent')} value={`${disbursedPercent}%`} />
              <DetailItem label={t('grants.currency')} value={grant.currencyCode} />
              <DetailItem label={t('grants.startDate')} value={grant.startDate ? formatDate(grant.startDate) : undefined} />
              <DetailItem label={t('grants.endDate')} value={grant.endDate ? formatDate(grant.endDate) : undefined} />
              <DetailItem label={t('grants.status')}>
                <StatusBadge status={grant.status} />
              </DetailItem>
              <DetailItem label={t('grants.lifecycleStage')}>
                <StatusBadge status={grant.lifecycleStage} />
              </DetailItem>
              {grant.project && (
                <DetailItem label={t('grants.project')} value={grant.project.name} />
              )}
              {grant.ngoabFdNo && (
                <DetailItem label={t('grantForm.ngoabFdNo')} value={grant.ngoabFdNo} />
              )}
              {grant.agreementRef && (
                <DetailItem label={t('grantForm.agreementRef')} value={grant.agreementRef} />
              )}
              <DetailItem label={t('grantForm.createdAt')} value={formatDate(grant.createdAt)} />
              <DetailItem label={t('grantForm.updatedAt')} value={formatDate(grant.updatedAt)} />
            </div>

            {/* Donor info */}
            {grant.donor && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">{t('grantForm.donorInfo')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DetailItem label={t('fields.type')} value={t(`donorTypes.${grant.donor.type}`)} />
                  <DetailItem label={t('fields.country')} value={grant.donor.country} />
                  <DetailItem label={t('fields.email')} value={grant.donor.email} />
                </div>
              </div>
            )}

            {grant.description && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">{t('grantForm.description')}</span>
                <p className="text-sm">{grant.description}</p>
              </div>
            )}

            {grant.notes && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">{t('grantForm.notes')}</span>
                <p className="text-sm">{grant.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fund Receipts */}
        {grant.fundReceipts && grant.fundReceipts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('fundReceipts.title')} ({grant.fundReceipts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">{t('fundReceipts.receiptNo')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('fundReceipts.date')}</th>
                      <th className="text-right py-2 px-3 font-medium">{t('fundReceipts.amount')}</th>
                      <th className="text-right py-2 px-3 font-medium">{t('fundReceipts.bdtEquivalent')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('fundReceipts.confirm')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grant.fundReceipts.map((receipt) => (
                      <tr key={receipt.id} className="border-b last:border-0">
                        <td className="py-2 px-3 font-mono text-sm">{receipt.receiptNo}</td>
                        <td className="py-2 px-3">{formatDate(receipt.date)}</td>
                        <td className="py-2 px-3 text-right font-mono">
                          {receipt.currencyCode} {formatCurrency(Number(receipt.amount))}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(Number(receipt.amountInBDT))}</td>
                        <td className="py-2 px-3"><StatusBadge status={receipt.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fund Requisitions */}
        {grant.fundRequisitions && grant.fundRequisitions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('fundRequisitions.title')} ({grant.fundRequisitions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">{t('fundRequisitions.requisitionNo')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('fundRequisitions.date')}</th>
                      <th className="text-right py-2 px-3 font-medium">{t('fundRequisitions.amountRequested')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('fundRequisitions.purpose')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('fundRequisitions.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grant.fundRequisitions.map((req) => (
                      <tr key={req.id} className="border-b last:border-0">
                        <td className="py-2 px-3 font-mono text-sm">{req.requisitionNo}</td>
                        <td className="py-2 px-3">{formatDate(req.date)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(Number(req.amount))}</td>
                        <td className="py-2 px-3">{req.purpose}</td>
                        <td className="py-2 px-3"><StatusBadge status={req.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budgets */}
        {grant.budgets && grant.budgets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('grantForm.linkedBudgets')} ({grant.budgets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">{t('grantForm.budgetName')}</th>
                      <th className="text-right py-2 px-3 font-medium">{t('grantForm.budgetAmount')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('grants.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grant.budgets.map((budget) => (
                      <tr
                        key={budget.id}
                        className="border-b last:border-0 cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/budget/${budget.id}`)}
                      >
                        <td className="py-2 px-3 font-medium">{budget.name}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(Number(budget.totalAmount))}</td>
                        <td className="py-2 px-3"><StatusBadge status={budget.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
        title={t('grantForm.editTitle')}
        description={`${grant.grantNo} - ${grant.title}`}
      >
        <Button variant="outline" size="sm" onClick={cancelEditing}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.cancel')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('grantForm.grantDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Title + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-grant-title">{t('grants.grantTitle')} *</Label>
              <Input
                id="edit-grant-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-grant-status">{t('grants.status')}</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger id="edit-grant-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRANT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{tc(`status.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Award Amount + Project */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-grant-amount">{t('grants.awardAmount')} *</Label>
              <Input
                id="edit-grant-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={formAwardAmount}
                onChange={(e) => setFormAwardAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-grant-project">{t('grants.project')}</Label>
              <Select value={formProjectId} onValueChange={setFormProjectId}>
                <SelectTrigger id="edit-grant-project" className="w-full">
                  <SelectValue placeholder={t('grantForm.selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('grantForm.noProject')}</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Start Date + End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-grant-start">{t('grants.startDate')}</Label>
              <Input
                id="edit-grant-start"
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-grant-end">{t('grants.endDate')}</Label>
              <Input
                id="edit-grant-end"
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: NGOAB FD No + Agreement Ref */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-grant-ngoab">{t('grantForm.ngoabFdNo')}</Label>
              <Input
                id="edit-grant-ngoab"
                value={formNgoabFdNo}
                onChange={(e) => setFormNgoabFdNo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-grant-agreement">{t('grantForm.agreementRef')}</Label>
              <Input
                id="edit-grant-agreement"
                value={formAgreementRef}
                onChange={(e) => setFormAgreementRef(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-grant-description">{t('grantForm.description')}</Label>
            <Textarea
              id="edit-grant-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-grant-notes">{t('grantForm.notes')}</Label>
            <Textarea
              id="edit-grant-notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={cancelEditing} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleUpdate} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('grantForm.saving')}
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
  value?: string | null
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
