'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CircleDollarSign } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface PaymentRow {
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
  status: string
  invoice: { id: string; invoiceNo: string } | null
  vendor: { id: string; companyName: string } | null
  bankAccount: { id: string; accountCode: string; accountName: string; type: string } | null
}

const STATUS_OPTIONS = ['ALL', 'APPROVED', 'POSTED', 'CANCELLED'] as const

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ limit: '100' })
    if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetch(`/api/v1/finance/payments?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.success) setPayments(json.data || [])
      })
      .catch((error) => console.error('Failed to load payments', error))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Payments"
        description="All vendor payment vouchers with linked invoices, journal entries, and bank impact."
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Status</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === 'ALL' ? 'All statuses' : status.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto">{payments.length} payment(s)</span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading payments…
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <CircleDollarSign className="h-8 w-8" />
              <p className="text-sm">No payments yet. Settle vendor invoices to record payments.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Bank/Cash</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Net paid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/finance/payments/${payment.id}`)}
                  >
                    <TableCell className="font-mono text-xs font-medium">{payment.paymentNo}</TableCell>
                    <TableCell className="text-sm">{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="text-sm">{payment.vendor?.companyName || '—'}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {payment.invoice?.invoiceNo || '—'}
                    </TableCell>
                    <TableCell className="text-sm">{payment.paymentMethod}</TableCell>
                    <TableCell className="text-sm">
                      {payment.bankAccount ? `${payment.bankAccount.accountCode} ${payment.bankAccount.accountName}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-right">{formatCurrency(Number(payment.amount))}</TableCell>
                    <TableCell className="text-sm font-mono text-right font-semibold">
                      {formatCurrency(Number(payment.netPaid))}
                    </TableCell>
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
    </div>
  )
}
