'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Loader2, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
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

interface VendorInvoiceRow {
  id: string
  invoiceNo: string
  invoiceDate: string
  vendorId: string
  poId: string
  grossAmount: string | number
  netPayable: string | number
  paidAmount: string | number
  outstandingAmount: string | number
  status: string
  createdAt: string
  vendor?: { companyName: string } | null
}

interface Vendor {
  id: string
  companyName: string
}

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'MATCHED', 'SUBMITTED', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'REJECTED', 'CANCELLED'] as const

export default function VendorInvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<VendorInvoiceRow[]>([])
  const [vendors, setVendors] = useState<Map<string, Vendor>>(new Map())
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ limit: '100' })
    if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    Promise.all([
      fetch(`/api/v1/finance/vendor-invoices?${params.toString()}`).then((res) => res.json()),
      fetch('/api/v1/procurement/vendors?limit=200').then((res) => res.json()),
    ])
      .then(([invoiceRes, vendorRes]) => {
        if (cancelled) return
        if (invoiceRes.success) setInvoices(invoiceRes.data || [])
        if (vendorRes.success) {
          const map = new Map<string, Vendor>()
          for (const vendor of vendorRes.data || []) map.set(vendor.id, vendor)
          setVendors(map)
        }
      })
      .catch((error) => console.error('Failed to load vendor invoices', error))
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
        title="Vendor Invoices"
        description="Match vendor invoices against approved POs and GRNs, then approve and settle through payments."
      >
        <Button size="sm" onClick={() => router.push('/finance/vendor-invoices/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </PageHeader>

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
            <span className="text-xs text-muted-foreground ml-auto">{invoices.length} invoice(s)</span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="text-sm">No vendor invoices yet.</p>
              <Link href="/finance/vendor-invoices/new" className="text-sm text-primary hover:underline">
                Create your first invoice
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/finance/vendor-invoices/${invoice.id}`)}
                  >
                    <TableCell className="font-mono text-xs font-medium">{invoice.invoiceNo}</TableCell>
                    <TableCell className="text-sm">{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell className="text-sm">
                      {invoice.vendor?.companyName || vendors.get(invoice.vendorId)?.companyName || '—'}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-right">{formatCurrency(Number(invoice.grossAmount))}</TableCell>
                    <TableCell className="text-sm font-mono text-right">{formatCurrency(Number(invoice.paidAmount))}</TableCell>
                    <TableCell className="text-sm font-mono text-right">{formatCurrency(Number(invoice.outstandingAmount))}</TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
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
