'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface Vendor {
  id: string
  vendorNo: string
  companyName: string
  isActive: boolean
  isApproved: boolean
}

interface PurchaseOrder {
  id: string
  poNo: string
  status: string
  vendorId: string
  totalAmount: string | number
  date: string
}

interface GoodsReceipt {
  id: string
  grnNo: string
  status: string
  date: string
  acceptedAmount?: number
  lines?: Array<{ quantityAccepted: number; poLine?: { unitPrice: number } }>
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function NewVendorInvoicePage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [grns, setGrns] = useState<GoodsReceipt[]>([])
  const [vendorId, setVendorId] = useState('')
  const [poId, setPoId] = useState('')
  const [grnIds, setGrnIds] = useState<string[]>([])
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(todayIso())
  const [grossAmount, setGrossAmount] = useState('')
  const [tdsRate, setTdsRate] = useState('0')
  const [vdsRate, setVdsRate] = useState('0')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/procurement/vendors?limit=200&isActive=true')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setVendors((json.data as Vendor[]).filter((vendor) => vendor.isApproved && vendor.isActive))
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    setPos([])
    setPoId('')
    setGrns([])
    setGrnIds([])
    if (!vendorId) return
    fetch(`/api/v1/procurement/orders?vendorId=${vendorId}&limit=100`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          // Only POs that have at least been issued can be invoiced.
          setPos(
            (json.data as PurchaseOrder[]).filter((po) =>
              ['ISSUED', 'PARTIALLY_RECEIVED', 'COMPLETED'].includes(po.status)
            )
          )
        }
      })
      .catch(console.error)
  }, [vendorId])

  useEffect(() => {
    setGrns([])
    setGrnIds([])
    if (!poId) return
    fetch(`/api/v1/procurement/goods-receipt?poId=${poId}&limit=100`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setGrns((json.data as GoodsReceipt[]).filter((grn) => grn.status === 'ACCEPTED' || grn.status === 'PARTIAL'))
        }
      })
      .catch(console.error)
  }, [poId])

  const grossNum = Number(grossAmount) || 0
  const tdsRateNum = Math.max(0, Number(tdsRate) || 0)
  const vdsRateNum = Math.max(0, Number(vdsRate) || 0)
  const tdsAmount = useMemo(() => Math.round(grossNum * tdsRateNum) / 100, [grossNum, tdsRateNum])
  const vdsAmount = useMemo(() => Math.round(grossNum * vdsRateNum) / 100, [grossNum, vdsRateNum])
  const netPayable = Math.max(0, grossNum - tdsAmount - vdsAmount)

  const toggleGrn = (id: string) => {
    setGrnIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit() {
    setError(null)
    if (!invoiceNo.trim()) return setError('Invoice number is required')
    if (!vendorId) return setError('Vendor is required')
    if (!poId) return setError('Purchase order is required')
    if (grnIds.length === 0) return setError('Select at least one accepted GRN')
    if (grossNum <= 0) return setError('Gross amount must be greater than zero')
    if (tdsAmount + vdsAmount > grossNum) return setError('TDS + VDS cannot exceed gross amount')

    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/finance/vendor-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNo: invoiceNo.trim(),
          invoiceDate,
          vendorId,
          poId,
          grnIds,
          grossAmount: grossNum,
          tdsAmount,
          vdsAmount,
          notes: notes.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error?.message || json.message || 'Failed to create invoice')
        return
      }
      router.push(`/finance/vendor-invoices/${json.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Vendor Invoice"
        description="Match a vendor invoice against an approved PO and one or more accepted GRNs."
      >
        <Button variant="outline" size="sm" onClick={() => router.push('/finance/vendor-invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to list
        </Button>
      </PageHeader>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Three-way matching</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <SearchableSelect
                id="vendor"
                options={vendors.map((vendor) => ({
                  value: vendor.id,
                  label: `${vendor.companyName} (${vendor.vendorNo})`,
                }))}
                value={vendorId}
                onValueChange={setVendorId}
                placeholder="Select vendor"
                searchPlaceholder="Search vendors…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po">Purchase order</Label>
              <SearchableSelect
                id="po"
                options={pos.map((po) => ({
                  value: po.id,
                  label: `${po.poNo} — ${formatCurrency(Number(po.totalAmount))}`,
                  description: po.status,
                }))}
                value={poId}
                onValueChange={setPoId}
                placeholder={vendorId ? 'Select PO' : 'Select vendor first'}
                searchPlaceholder="Search purchase orders…"
                disabled={!vendorId}
                emptyMessage={vendorId ? 'No matching POs' : 'Pick a vendor first'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Goods Receipts</Label>
            <p className="text-xs text-muted-foreground">Pick the accepted/partial GRNs this invoice covers. Posted-to-accounting GRNs only.</p>
            <div className="border rounded-md divide-y">
              {grns.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  {poId ? 'No matching GRNs found' : 'Select a PO to load GRNs'}
                </div>
              ) : (
                grns.map((grn) => (
                  <label key={grn.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30">
                    <Checkbox checked={grnIds.includes(grn.id)} onCheckedChange={() => toggleGrn(grn.id)} />
                    <div className="flex-1 grid grid-cols-3 gap-4 items-center text-sm">
                      <span className="font-mono">{grn.grnNo}</span>
                      <span className="text-muted-foreground">{formatDate(grn.date)}</span>
                      <span>{grn.status}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNo">Vendor invoice no.</Label>
              <Input
                id="invoiceNo"
                value={invoiceNo}
                onChange={(event) => setInvoiceNo(event.target.value)}
                placeholder="INV-2026-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice date</Label>
              <Input id="invoiceDate" type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grossAmount">Gross amount (BDT)</Label>
              <Input
                id="grossAmount"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={grossAmount}
                onChange={(event) => setGrossAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tdsRate">TDS rate (%)</Label>
              <Input
                id="tdsRate"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={tdsRate}
                onChange={(event) => setTdsRate(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">TDS amount: {formatCurrency(tdsAmount)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vdsRate">VDS rate (%)</Label>
              <Input
                id="vdsRate"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={vdsRate}
                onChange={(event) => setVdsRate(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">VDS amount: {formatCurrency(vdsAmount)}</p>
            </div>
          </div>

          <div className="rounded-md bg-muted/30 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Gross</div>
              <div className="font-mono">{formatCurrency(grossNum)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">TDS</div>
              <div className="font-mono">{formatCurrency(tdsAmount)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">VDS</div>
              <div className="font-mono">{formatCurrency(vdsAmount)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Net payable</div>
              <div className="font-mono font-semibold">{formatCurrency(netPayable)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => router.push('/finance/vendor-invoices')} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Match & save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
