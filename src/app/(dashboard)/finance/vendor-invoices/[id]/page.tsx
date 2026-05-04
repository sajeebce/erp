'use client'

import { use, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Send,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface InvoiceGrnLink {
  id: string
  invoiceId: string
  grnId: string
  acceptedAmount: string | number
}

interface VendorPayment {
  id: string
  paymentNo: string
  paymentDate: string
  paymentMethod: string
  bankAccountId: string
  amount: string | number
  tdsAmount: string | number
  vdsAmount: string | number
  netPaid: string | number
  reference: string | null
  voucherId: string | null
  journalEntryId: string | null
  status: string
}

interface VendorInvoiceDetail {
  id: string
  invoiceNo: string
  invoiceDate: string
  vendorId: string
  poId: string
  grossAmount: string | number
  tdsAmount: string | number
  vdsAmount: string | number
  netPayable: string | number
  paidAmount: string | number
  outstandingAmount: string | number
  status: string
  matchedAt: string | null
  approvedById: string | null
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  notes: string | null
  createdAt: string
  vendor: { id: string; vendorNo: string; companyName: string } | null
  purchaseOrder: { id: string; poNo: string; status: string } | null
  goodsReceipts: Array<{ id: string; grnNo: string; status: string; date: string }>
  grns: InvoiceGrnLink[]
  payments: VendorPayment[]
}

interface BankAccount {
  id: string
  accountCode: string
  accountName: string
  type: string
  bankName: string | null
  currentBalance: string | number
  isActive: boolean
}

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_BANKING', label: 'Mobile banking' },
] as const

interface PageProps {
  params: Promise<{ id: string }>
}

export default function VendorInvoiceDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [invoice, setInvoice] = useState<VendorInvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionPending, setActionPending] = useState<string | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [rejectOpen, setRejectOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payTds, setPayTds] = useState('')
  const [payVds, setPayVds] = useState('')
  const [payMethod, setPayMethod] = useState<string>('BANK_TRANSFER')
  const [payBank, setPayBank] = useState('')
  const [payRef, setPayRef] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/finance/vendor-invoices/${id}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error?.message || 'Failed to load invoice')
        return
      }
      setInvoice(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    reload()
    fetch('/api/v1/finance/bank-accounts?limit=100')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setBankAccounts(((json.data as BankAccount[]) || []).filter((account) => account.isActive))
        }
      })
      .catch(console.error)
  }, [reload])

  const outstandingNum = invoice ? Number(invoice.outstandingAmount) : 0

  const proportionalSplit = useMemo(() => {
    if (!invoice) return { tds: 0, vds: 0 }
    const amount = Number(payAmount) || 0
    const gross = Number(invoice.grossAmount)
    if (gross === 0) return { tds: 0, vds: 0 }
    const ratio = amount / gross
    return {
      tds: Math.round(Number(invoice.tdsAmount) * ratio * 100) / 100,
      vds: Math.round(Number(invoice.vdsAmount) * ratio * 100) / 100,
    }
  }, [invoice, payAmount])

  useEffect(() => {
    setPayTds(String(proportionalSplit.tds))
    setPayVds(String(proportionalSplit.vds))
  }, [proportionalSplit.tds, proportionalSplit.vds])

  async function callAction(path: string, body?: Record<string, unknown>) {
    setActionPending(path)
    setError(null)
    try {
      const res = await fetch(`/api/v1/finance/vendor-invoices/${id}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error?.message || `Action ${path} failed`)
        return false
      }
      await reload()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      return false
    } finally {
      setActionPending(null)
    }
  }

  async function submitInvoice() {
    await callAction('/submit')
  }

  async function approveInvoice() {
    await callAction('/approve')
  }

  async function rejectInvoice() {
    if (!rejectReason.trim()) return
    const ok = await callAction('/reject', { reason: rejectReason.trim() })
    if (ok) {
      setRejectOpen(false)
      setRejectReason('')
    }
  }

  async function cancelInvoice() {
    const ok = await callAction('/cancel', { reason: cancelReason.trim() || undefined })
    if (ok) {
      setCancelOpen(false)
      setCancelReason('')
    }
  }

  async function recordPayment() {
    if (!payBank) {
      setError('Bank/cash account is required')
      return
    }
    const amountNum = Number(payAmount) || 0
    if (amountNum <= 0) {
      setError('Payment amount must be greater than zero')
      return
    }
    setActionPending('payment')
    setError(null)
    try {
      const res = await fetch(`/api/v1/finance/vendor-invoices/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentDate: payDate,
          paymentMethod: payMethod,
          bankAccountId: payBank,
          amount: amountNum,
          tdsAmount: Number(payTds) || 0,
          vdsAmount: Number(payVds) || 0,
          reference: payRef.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error?.message || json.message || 'Payment failed')
        return
      }
      setPayOpen(false)
      setPayAmount('')
      setPayRef('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setActionPending(null)
    }
  }

  if (loading && !invoice) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading invoice…
      </div>
    )
  }

  if (!invoice) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Invoice not found'}</AlertDescription>
      </Alert>
    )
  }

  const status = invoice.status
  const canSubmit = status === 'MATCHED'
  const canApprove = status === 'MATCHED' || status === 'SUBMITTED'
  const canReject = status === 'MATCHED' || status === 'SUBMITTED'
  const canCancel = ['DRAFT', 'MATCHED', 'SUBMITTED', 'APPROVED'].includes(status) && Number(invoice.paidAmount) === 0
  const canPay = (status === 'APPROVED' || status === 'PARTIALLY_PAID') && outstandingNum > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.invoiceNo}`}
        description={`${invoice.vendor?.companyName || ''} — ${formatDate(invoice.invoiceDate)}`}
      >
        <Button variant="outline" size="sm" onClick={() => router.push('/finance/vendor-invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </PageHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <span>Invoice summary</span>
              <StatusBadge status={status} />
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              {canSubmit && (
                <Button size="sm" variant="outline" onClick={submitInvoice} disabled={actionPending !== null}>
                  <Send className="h-4 w-4 mr-2" /> Submit for approval
                </Button>
              )}
              {canApprove && (
                <Button size="sm" onClick={approveInvoice} disabled={actionPending !== null}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                </Button>
              )}
              {canReject && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectOpen(true)}
                  disabled={actionPending !== null}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
              )}
              {canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelOpen(true)}
                  disabled={actionPending !== null}
                >
                  <Ban className="h-4 w-4 mr-2" /> Cancel
                </Button>
              )}
              {canPay && (
                <Button size="sm" onClick={() => setPayOpen(true)} disabled={actionPending !== null}>
                  <CircleDollarSign className="h-4 w-4 mr-2" /> Record payment
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <SummaryItem label="Vendor" value={invoice.vendor?.companyName || '—'} />
            <SummaryItem
              label="Purchase order"
              value={
                invoice.purchaseOrder ? (
                  <Link href={`/procurement/orders/${invoice.purchaseOrder.id}`} className="text-primary hover:underline font-mono">
                    {invoice.purchaseOrder.poNo}
                  </Link>
                ) : (
                  '—'
                )
              }
            />
            <SummaryItem label="Invoice date" value={formatDate(invoice.invoiceDate)} />
            <SummaryItem label="Created" value={formatDate(invoice.createdAt)} />
            <SummaryItem label="Gross amount" value={formatCurrency(Number(invoice.grossAmount))} mono />
            <SummaryItem label="TDS withheld" value={formatCurrency(Number(invoice.tdsAmount))} mono />
            <SummaryItem label="VDS withheld" value={formatCurrency(Number(invoice.vdsAmount))} mono />
            <SummaryItem label="Net payable" value={formatCurrency(Number(invoice.netPayable))} mono />
            <SummaryItem label="Paid" value={formatCurrency(Number(invoice.paidAmount))} mono />
            <SummaryItem
              label="Outstanding"
              value={formatCurrency(Number(invoice.outstandingAmount))}
              mono
              emphasis
            />
            {invoice.rejectionReason ? (
              <SummaryItem label="Rejection reason" value={invoice.rejectionReason} />
            ) : null}
            {invoice.notes ? <SummaryItem label="Notes" value={invoice.notes} /> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked Goods Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.goodsReceipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No GRN links</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Accepted amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.goodsReceipts.map((grn) => {
                  const link = invoice.grns.find((entry) => entry.grnId === grn.id)
                  return (
                    <TableRow key={grn.id}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/procurement/goods-receipt/${grn.id}`} className="text-primary hover:underline">
                          {grn.grnNo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={grn.status} />
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(grn.date)}</TableCell>
                      <TableCell className="text-sm font-mono text-right">
                        {link ? formatCurrency(Number(link.acceptedAmount)) : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">TDS</TableHead>
                  <TableHead className="text-right">VDS</TableHead>
                  <TableHead className="text-right">Net paid</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/finance/payments/${payment.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{payment.paymentNo}</TableCell>
                    <TableCell className="text-sm">{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="text-sm">{payment.paymentMethod}</TableCell>
                    <TableCell className="text-sm font-mono text-right">{formatCurrency(Number(payment.amount))}</TableCell>
                    <TableCell className="text-sm font-mono text-right">{formatCurrency(Number(payment.tdsAmount))}</TableCell>
                    <TableCell className="text-sm font-mono text-right">{formatCurrency(Number(payment.vdsAmount))}</TableCell>
                    <TableCell className="text-sm font-mono text-right font-semibold">
                      {formatCurrency(Number(payment.netPaid))}
                    </TableCell>
                    <TableCell className="text-sm">{payment.reference || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject invoice</DialogTitle>
            <DialogDescription>Provide a reason. The invoice will move to REJECTED.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectReason">Reason</Label>
            <Textarea
              id="rejectReason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={actionPending !== null}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={rejectInvoice}
              disabled={!rejectReason.trim() || actionPending !== null}
            >
              {actionPending === '/reject' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel invoice</DialogTitle>
            <DialogDescription>Approved invoices with zero payments can be cancelled. No actuals are reversed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancelReason">Reason (optional)</Label>
            <Textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={actionPending !== null}>
              Back
            </Button>
            <Button onClick={cancelInvoice} disabled={actionPending !== null}>
              {actionPending === '/cancel' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Cancel invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Posts a balanced JE: DR Accounts Payable, CR Bank/Cash (net), CR TDS Payable, CR VDS Payable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="payDate">Payment date</Label>
                <Input id="payDate" type="date" value={payDate} onChange={(event) => setPayDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payMethod">Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger id="payMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payBank">Bank/cash account</Label>
              <Select value={payBank} onValueChange={setPayBank}>
                <SelectTrigger id="payBank">
                  <SelectValue placeholder="Select bank/cash account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountCode} — {account.accountName} ({formatCurrency(Number(account.currentBalance))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="payAmount">Amount</Label>
                <Input
                  id="payAmount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={payAmount}
                  onChange={(event) => setPayAmount(event.target.value)}
                  placeholder={String(outstandingNum)}
                />
                <p className="text-xs text-muted-foreground">Outstanding: {formatCurrency(outstandingNum)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payTds">TDS</Label>
                <Input
                  id="payTds"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={payTds}
                  onChange={(event) => setPayTds(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payVds">VDS</Label>
                <Input
                  id="payVds"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={payVds}
                  onChange={(event) => setPayVds(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payRef">Reference</Label>
              <Input
                id="payRef"
                value={payRef}
                onChange={(event) => setPayRef(event.target.value)}
                placeholder="Cheque/transaction reference"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} disabled={actionPending !== null}>
              Back
            </Button>
            <Button onClick={recordPayment} disabled={actionPending !== null}>
              {actionPending === 'payment' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Post payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryItem({
  label,
  value,
  mono,
  emphasis,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  emphasis?: boolean
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`${mono ? 'font-mono' : ''} ${emphasis ? 'font-semibold text-base' : ''}`}>{value}</div>
    </div>
  )
}
