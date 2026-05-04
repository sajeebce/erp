'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface JournalLine {
  id: string
  description: string | null
  debit: string | number
  credit: string | number
  account: { code: string; name: string; type: string } | null
}

interface JournalEntry {
  id: string
  entryNo: string
  date: string
  description: string
  reference: string | null
  status: string
  totalDebit: string | number
  totalCredit: string | number
  lines: JournalLine[]
}

interface PaymentDetail {
  id: string
  paymentNo: string
  paymentDate: string
  paymentMethod: string
  amount: string | number
  tdsAmount: string | number
  vdsAmount: string | number
  netPaid: string | number
  reference: string | null
  status: string
  notes: string | null
  invoice: {
    id: string
    invoiceNo: string
    grossAmount: string | number
    netPayable: string | number
    paidAmount: string | number
    outstandingAmount: string | number
    status: string
    invoiceDate: string
  } | null
  vendor: { id: string; vendorNo: string; companyName: string } | null
  bankAccount: {
    id: string
    accountCode: string
    accountName: string
    bankName: string | null
    branchName: string | null
    type: string
    currentBalance: string | number
  } | null
  journalEntry: JournalEntry | null
  voucher: { id: string; voucherNo: string; type: string; status: string } | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PaymentDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/v1/finance/payments/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          setError(json.error?.message || 'Failed to load payment')
          return
        }
        setPayment(json.data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unexpected error'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading payment…
      </div>
    )
  }

  if (!payment) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Payment not found'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Payment ${payment.paymentNo}`}
        description={`${payment.vendor?.companyName || ''} — ${formatDate(payment.paymentDate)}`}
      >
        <Button variant="outline" size="sm" onClick={() => router.push('/finance/payments')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <span>Payment summary</span>
              <StatusBadge status={payment.status} />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <SummaryItem label="Vendor" value={payment.vendor?.companyName || '—'} />
            <SummaryItem
              label="Invoice"
              value={
                payment.invoice ? (
                  <Link
                    href={`/finance/vendor-invoices/${payment.invoice.id}`}
                    className="text-primary hover:underline font-mono"
                  >
                    {payment.invoice.invoiceNo}
                  </Link>
                ) : (
                  '—'
                )
              }
            />
            <SummaryItem label="Method" value={payment.paymentMethod} />
            <SummaryItem
              label="Bank/cash account"
              value={
                payment.bankAccount
                  ? `${payment.bankAccount.accountCode} — ${payment.bankAccount.accountName}`
                  : '—'
              }
            />
            <SummaryItem label="Gross amount" value={formatCurrency(Number(payment.amount))} mono />
            <SummaryItem label="TDS withheld" value={formatCurrency(Number(payment.tdsAmount))} mono />
            <SummaryItem label="VDS withheld" value={formatCurrency(Number(payment.vdsAmount))} mono />
            <SummaryItem label="Net disbursed" value={formatCurrency(Number(payment.netPaid))} mono emphasis />
            {payment.reference ? <SummaryItem label="Reference" value={payment.reference} /> : null}
            {payment.voucher ? (
              <SummaryItem
                label="Voucher"
                value={
                  <Link href={`/finance/vouchers/${payment.voucher.id}`} className="text-primary hover:underline font-mono">
                    {payment.voucher.voucherNo}
                  </Link>
                }
              />
            ) : null}
            {payment.journalEntry ? (
              <SummaryItem
                label="Journal entry"
                value={
                  <Link
                    href={`/finance/journal-entries/${payment.journalEntry.id}`}
                    className="text-primary hover:underline font-mono"
                  >
                    {payment.journalEntry.entryNo}
                  </Link>
                }
              />
            ) : null}
            {payment.bankAccount ? (
              <SummaryItem
                label="Bank balance after"
                value={formatCurrency(Number(payment.bankAccount.currentBalance))}
                mono
              />
            ) : null}
            {payment.notes ? <SummaryItem label="Notes" value={payment.notes} /> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Journal entry lines</CardTitle>
        </CardHeader>
        <CardContent>
          {payment.journalEntry ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.journalEntry.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-mono text-xs">
                      {line.account ? `${line.account.code} ${line.account.name}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm">{line.description || '—'}</TableCell>
                    <TableCell className="text-sm font-mono text-right">
                      {Number(line.debit) > 0 ? formatCurrency(Number(line.debit)) : ''}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-right">
                      {Number(line.credit) > 0 ? formatCurrency(Number(line.credit)) : ''}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-semibold">
                  <TableCell colSpan={2} className="text-right">
                    Totals
                  </TableCell>
                  <TableCell className="text-sm font-mono text-right">
                    {formatCurrency(Number(payment.journalEntry.totalDebit))}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-right">
                    {formatCurrency(Number(payment.journalEntry.totalCredit))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No journal entry linked</p>
          )}
        </CardContent>
      </Card>
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
