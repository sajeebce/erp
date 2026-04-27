"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, XCircle, Loader2, ExternalLink, ClipboardCheck } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";

interface POLine {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQty: number;
  prLine: {
    requisition: { id: string; prNo: string; status: string } | null;
  } | null;
}

interface GoodsReceiptRef {
  id: string;
  grnNo: string;
  date: string;
  status: string;
}

interface PurchaseOrder {
  id: string;
  poNo: string;
  date: string;
  vendor: { id: string; vendorNo: string; companyName: string } | null;
  deliveryDate: string | null;
  totalAmount: number;
  paymentTerms: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  lines: POLine[];
  goodsReceipts: GoodsReceiptRef[];
}

interface ReceiptLineForm {
  poLineId: string;
  description: string;
  quantityOrdered: number;
  quantityAccepted: number;
  quantityRejected: number;
  rejectionReason: string;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED": case "ACCEPTED": return "default";
    case "ISSUED": case "PENDING_INSPECTION": return "secondary";
    case "PARTIALLY_RECEIVED": case "PARTIAL": return "outline";
    case "CANCELLED": case "REJECTED": return "destructive";
    default: return "outline";
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    COMPLETED: "Completed",
    ISSUED: "Issued",
    PARTIALLY_RECEIVED: "Partially Received",
    DRAFT: "Draft",
    CANCELLED: "Cancelled",
    ACCEPTED: "Accepted",
    PENDING_INSPECTION: "Pending Inspection",
    REJECTED: "Rejected",
    PARTIAL: "Partial",
  };
  return map[status] ?? status;
}

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptLines, setReceiptLines] = useState<ReceiptLineForm[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState("Received and verified against purchase order.");
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchPO() {
    const res = await fetch(`/api/v1/procurement/orders/${id}`);
    const json = await res.json();
    if (json.success) {
      setPO(json.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPO();
  }, [id]);

  function openReceiptDialog() {
    if (!po) return;
    setReceiptLines(
      po.lines
        .map((line) => {
          const remaining = Math.max(Number(line.quantity) - Number(line.receivedQty), 0);
          return {
            poLineId: line.id,
            description: line.description,
            quantityOrdered: Number(line.quantity),
            quantityAccepted: remaining,
            quantityRejected: 0,
            rejectionReason: "",
          };
        })
        .filter((line) => line.quantityAccepted > 0)
    );
    setShowReceiptDialog(true);
  }

  function updateReceiptLine(index: number, field: keyof ReceiptLineForm, value: string | number) {
    setReceiptLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleCreateReceipt() {
    if (!po) return;
    setSavingReceipt(true);
    setActionMsg(null);
    try {
      const payload = {
        poId: po.id,
        inspectionNotes,
        lines: receiptLines.map((line) => ({
          poLineId: line.poLineId,
          description: line.description,
          quantityOrdered: line.quantityOrdered,
          quantityReceived: Number(line.quantityAccepted) + Number(line.quantityRejected),
          quantityAccepted: Number(line.quantityAccepted),
          quantityRejected: Number(line.quantityRejected),
          rejectionReason: line.rejectionReason,
        })),
      };

      const res = await fetch("/api/v1/procurement/goods-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg({ type: "success", text: `Goods receipt ${json.data.grnNo} created.` });
        setShowReceiptDialog(false);
        await fetchPO();
      } else {
        setActionMsg({ type: "error", text: json.error?.message ?? "Goods receipt creation failed." });
      }
    } catch {
      setActionMsg({ type: "error", text: "Network error." });
    } finally {
      setSavingReceipt(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!po) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Purchase order not found.
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go back
          </Button>
        </div>
      </div>
    );
  }

  const sourcePr = po.lines.find((line) => line.prLine?.requisition)?.prLine?.requisition;
  const canCreateReceipt = ["ISSUED", "PARTIALLY_RECEIVED"].includes(po.status)
    && po.lines.some((line) => Number(line.receivedQty) < Number(line.quantity));

  return (
    <div className="space-y-6">
      <PageHeader
        title={po.poNo}
        description={`Purchase Order - ${getStatusLabel(po.status)}`}
      >
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {canCreateReceipt && (
          <Button size="sm" onClick={openReceiptDialog}>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Create GRN
          </Button>
        )}
      </PageHeader>

      {actionMsg && (
        <Alert className={actionMsg.type === "success"
          ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20"
          : "border-destructive/50 bg-destructive/5"
        }>
          {actionMsg.type === "success"
            ? <CheckCircle className="h-4 w-4 text-emerald-600" />
            : <XCircle className="h-4 w-4 text-destructive" />
          }
          <AlertDescription className={actionMsg.type === "success" ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}>
            {actionMsg.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Purchase Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">PO Number</p>
                  <p className="font-mono font-medium">{po.poNo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{formatDate(po.date, locale)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={getStatusVariant(po.status)}>{getStatusLabel(po.status)}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Vendor</p>
                  <p className="font-medium">{po.vendor?.companyName ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivery Date</p>
                  <p>{po.deliveryDate ? formatDate(po.deliveryDate, locale) : "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-mono font-bold text-base">{formatCurrency(Number(po.totalAmount), locale)}</p>
                </div>
              </div>
              {(po.paymentTerms || po.notes) && <Separator />}
              {po.paymentTerms && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Payment Terms</p>
                  <p className="text-sm">{po.paymentTerms}</p>
                </div>
              )}
              {po.notes && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Notes</p>
                  <p className="text-sm">{po.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Lines</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.description}</TableCell>
                      <TableCell>{line.unit}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(Number(line.quantity), locale)}</TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(Number(line.receivedQty), locale)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(Number(line.unitPrice), locale)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatCurrency(Number(line.totalPrice), locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Traceability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Source PR</span>
                {sourcePr ? (
                  <Link href={`/procurement/requisitions/${sourcePr.id}`} className="font-mono text-primary hover:underline">
                    {sourcePr.prNo}
                  </Link>
                ) : <span>-</span>}
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Vendor</span>
                <span className="text-right">{po.vendor?.vendorNo ?? "-"}</span>
              </div>
              <Link
                href={`/reports/audit-trail?resource=PurchaseOrder&resourceId=${po.id}`}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View audit trail
                <ExternalLink className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Goods Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              {po.goodsReceipts.length > 0 ? (
                <div className="space-y-3">
                  {po.goodsReceipts.map((grn) => (
                    <div key={grn.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <Link href={`/procurement/goods-receipt/${grn.id}`} className="font-mono text-sm text-primary hover:underline inline-flex items-center gap-1">
                          {grn.grnNo}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatDate(grn.date, locale)}</p>
                      </div>
                      <Badge variant={getStatusVariant(grn.status)} className="text-[10px]">
                        {getStatusLabel(grn.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No goods receipt created yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Goods Receipt for {po.poNo}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label>Inspection Notes</Label>
              <Textarea value={inspectionNotes} onChange={(event) => setInspectionNotes(event.target.value)} />
            </div>

            {receiptLines.map((line, index) => (
              <div key={line.poLineId} className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm">{line.description}</p>
                  <Badge variant="outline">{formatNumber(line.quantityOrdered, locale)} ordered</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Accepted Qty</Label>
                    <Input
                      type="number"
                      min="0"
                      value={line.quantityAccepted}
                      onChange={(event) => updateReceiptLine(index, "quantityAccepted", Number(event.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rejected Qty</Label>
                    <Input
                      type="number"
                      min="0"
                      value={line.quantityRejected}
                      onChange={(event) => updateReceiptLine(index, "quantityRejected", Number(event.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rejection Reason</Label>
                    <Input
                      value={line.rejectionReason}
                      onChange={(event) => updateReceiptLine(index, "rejectionReason", event.target.value)}
                      disabled={Number(line.quantityRejected) === 0}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)} disabled={savingReceipt}>
              Cancel
            </Button>
            <Button onClick={handleCreateReceipt} disabled={savingReceipt || receiptLines.length === 0}>
              {savingReceipt ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ClipboardCheck className="h-4 w-4 mr-2" />}
              Create GRN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
