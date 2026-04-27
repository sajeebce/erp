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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  PackagePlus,
  Info,
  Landmark,
} from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";

interface GRNLine {
  id: string;
  poLineId: string;
  description: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected: number;
  rejectionReason: string | null;
  poLine: { description: string; quantity: number; unitPrice: number } | null;
}

interface GoodsReceipt {
  id: string;
  grnNo: string;
  date: string;
  poId: string;
  purchaseOrder: { poNo: string; status: string } | null;
  vendor: { id: string; vendorNo: string; companyName: string } | null;
  receivedById: string;
  status: string;
  inspectionNotes: string | null;
  notes: string | null;
  createdAt: string;
  lines: GRNLine[];
  accountingEntries?: AccountingEntry[];
}

interface AccountingEntry {
  id: string;
  entryNo: string;
  date: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  postedAt: string | null;
}

interface AssetCategory {
  id: string;
  code: string;
  name: string;
}

interface AssetLineForm {
  grnLineId: string;
  name: string;
  categoryId: string;
  quantity: number;
  unitPrice: number;
  purchaseDate: string;
  serialNumbers: string;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACCEPTED": return "default";
    case "PENDING_INSPECTION": return "secondary";
    case "REJECTED": return "destructive";
    case "PARTIAL": return "outline";
    default: return "outline";
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ACCEPTED: "Accepted", PENDING_INSPECTION: "Pending Inspection",
    REJECTED: "Rejected", PARTIAL: "Partial",
  };
  return map[status] ?? status;
}

export default function GRNDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();

  const [grn, setGrn] = useState<GoodsReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [assetLines, setAssetLines] = useState<AssetLineForm[]>([]);
  const [registering, setRegistering] = useState(false);
  const [postingAccounting, setPostingAccounting] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [registeredAssets, setRegisteredAssets] = useState<{ assetNo: string; id: string; name: string }[]>([]);
  const [userRole, setUserRole] = useState("");

  async function fetchGRN() {
    const res = await fetch(`/api/v1/procurement/goods-receipt/${id}`);
    const json = await res.json();
    if (json.success) setGrn(json.data);
    setLoading(false);
  }

  async function fetchCategories() {
    const res = await fetch("/api/v1/assets/categories?limit=100");
    const json = await res.json();
    if (json.success) setCategories(json.data);
  }

  useEffect(() => {
    fetchGRN();
    fetchCategories();
    fetch("/api/v1/auth/me")
      .then((r) => r.json())
      .then((json) => { if (json.success) setUserRole(json.data.role?.name ?? ""); })
      .catch(() => {});
  }, [id]);

  function openRegisterDialog() {
    if (!grn) return;
    const lines: AssetLineForm[] = grn.lines
      .filter((l) => Number(l.quantityAccepted) > 0)
      .map((l) => ({
        grnLineId: l.id,
        name: l.description,
        categoryId: categories[0]?.id ?? "",
        quantity: Number(l.quantityAccepted),
        unitPrice: l.poLine ? Number(l.poLine.unitPrice) : 0,
        purchaseDate: grn.date.split("T")[0],
        serialNumbers: "",
      }));
    setAssetLines(lines);
    setShowRegisterDialog(true);
  }

  function updateLine(idx: number, field: keyof AssetLineForm, value: string | number) {
    setAssetLines((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }

  async function handleRegisterAssets() {
    setRegistering(true);
    setActionMsg(null);
    try {
      const payload = {
        lines: assetLines.map((l) => ({
          grnLineId: l.grnLineId,
          categoryId: l.categoryId,
          name: l.name,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          purchaseDate: l.purchaseDate,
          serialNumbers: l.serialNumbers
            ? l.serialNumbers.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        })),
      };

      const res = await fetch(`/api/v1/procurement/goods-receipt/${id}/register-assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setRegisteredAssets(json.data.assets);
        setActionMsg({
          type: "success",
          text: `${json.data.assetsCreated} asset(s) registered successfully.`,
        });
        setShowRegisterDialog(false);
        fetchGRN();
      } else {
        setActionMsg({ type: "error", text: json.error?.message ?? "Registration failed." });
      }
    } catch {
      setActionMsg({ type: "error", text: "Network error." });
    } finally {
      setRegistering(false);
    }
  }

  async function handlePostAccounting() {
    setPostingAccounting(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/v1/procurement/goods-receipt/${id}/post-accounting`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setActionMsg({ type: "success", text: `Accounting entry ${json.data.entryNo} posted.` });
        fetchGRN();
      } else {
        setActionMsg({ type: "error", text: json.error?.message ?? "Accounting post failed." });
      }
    } catch {
      setActionMsg({ type: "error", text: "Network error." });
    } finally {
      setPostingAccounting(false);
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

  if (!grn) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Goods receipt not found.
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go back
          </Button>
        </div>
      </div>
    );
  }

  const canRegisterAssets = grn.status === "ACCEPTED" && registeredAssets.length === 0;
  const hasAccountingEntry = Boolean(grn.accountingEntries && grn.accountingEntries.length > 0);
  const canPostAccounting = userRole === "ADMIN" && ["ACCEPTED", "PARTIAL"].includes(grn.status) && !hasAccountingEntry;

  return (
    <div className="space-y-6">
      <PageHeader
        title={grn.grnNo}
        description={`Goods Receipt Note · ${getStatusLabel(grn.status)}`}
      >
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {canRegisterAssets && (
          <Button size="sm" onClick={openRegisterDialog}>
            <PackagePlus className="h-4 w-4 mr-2" />
            Register Assets
          </Button>
        )}
        {canPostAccounting && (
          <Button size="sm" variant="outline" onClick={handlePostAccounting} disabled={postingAccounting}>
            {postingAccounting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Landmark className="h-4 w-4 mr-2" />}
            Post Accounting
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

      {registeredAssets.length > 0 && (
        <Card className="border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-base text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Registered Assets ({registeredAssets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {registeredAssets.map((a) => (
                <Link
                  key={a.id}
                  href={`/assets/${a.id}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-mono hover:bg-muted"
                >
                  {a.assetNo}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">GRN Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">GRN Number</p>
                  <p className="font-mono font-medium">{grn.grnNo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{formatDate(grn.date, locale)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={getStatusVariant(grn.status)}>{getStatusLabel(grn.status)}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Purchase Order</p>
                  {grn.purchaseOrder ? (
                    <Link
                      href={`/procurement/orders/${grn.poId}`}
                      className="font-mono text-primary hover:underline flex items-center gap-1"
                    >
                      {grn.purchaseOrder.poNo}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : "—"}
                </div>
                <div>
                  <p className="text-muted-foreground">Vendor</p>
                  <p className="font-medium">{grn.vendor?.companyName ?? "—"}</p>
                </div>
                {grn.inspectionNotes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Inspection Notes</p>
                    <p>{grn.inspectionNotes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Received Lines</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right text-emerald-600">Accepted</TableHead>
                    <TableHead className="text-right text-red-600">Rejected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grn.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <p className="font-medium">{line.description}</p>
                        {line.rejectionReason && (
                          <p className="text-xs text-destructive mt-0.5">
                            Rejection: {line.rejectionReason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(Number(line.quantityOrdered), locale)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(Number(line.quantityReceived), locale)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600 font-medium">
                        {formatNumber(Number(line.quantityAccepted), locale)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {formatNumber(Number(line.quantityRejected), locale)}
                      </TableCell>
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
              <CardTitle className="text-base">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(grn.createdAt, locale)}</span>
                </div>
              </div>
              <div className="mt-3">
                <Link
                  href={`/reports/audit-trail?resource=GoodsReceipt&resourceId=${grn.id}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View full audit trail
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {grn.status === "ACCEPTED" && (
            <Card className="border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Asset Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>This GRN is accepted. Fixed assets (laptops, equipment, etc.) should be registered in the asset register.</p>
                <p>Consumable items (paper, toner) go to inventory automatically.</p>
                {registeredAssets.length === 0 ? (
                  <Button size="sm" className="w-full mt-2" onClick={openRegisterDialog}>
                    <PackagePlus className="h-4 w-4 mr-2" />
                    Register Assets
                  </Button>
                ) : (
                  <p className="text-emerald-600 font-medium">{registeredAssets.length} asset(s) registered.</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Accounting
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasAccountingEntry ? (
                <div className="space-y-3">
                  {grn.accountingEntries?.map((entry) => (
                    <div key={entry.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <Link href={`/finance/journal-entries/${entry.id}`} className="font-mono text-primary hover:underline">
                          {entry.entryNo}
                        </Link>
                        <Badge variant={entry.status === "APPROVED" ? "default" : "outline"}>{entry.status}</Badge>
                      </div>
                      <div className="mt-2 flex justify-between text-muted-foreground">
                        <span>Amount</span>
                        <span className="font-mono">{formatCurrency(Number(entry.totalDebit), locale)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No accounting entry posted yet.</p>
                  {canPostAccounting && (
                    <Button size="sm" className="w-full" onClick={handlePostAccounting} disabled={postingAccounting}>
                      {postingAccounting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Landmark className="h-4 w-4 mr-2" />}
                      Post Fixed Asset Entry
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Asset Registration Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Assets from {grn.grnNo}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {assetLines.map((line, idx) => (
              <div key={line.grnLineId} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{line.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {line.quantity} unit{line.quantity > 1 ? "s" : ""}
                  </Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Asset Name</Label>
                    <Input
                      value={line.name}
                      onChange={(e) => updateLine(idx, "name", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Select
                      value={line.categoryId}
                      onValueChange={(v) => updateLine(idx, "categoryId", v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Price (BDT)</Label>
                    <Input
                      type="number"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(idx, "unitPrice", Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Purchase Date</Label>
                    <Input
                      type="date"
                      value={line.purchaseDate}
                      onChange={(e) => updateLine(idx, "purchaseDate", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">
                      Serial Numbers <span className="text-muted-foreground">(comma-separated, one per unit)</span>
                    </Label>
                    <Input
                      value={line.serialNumbers}
                      onChange={(e) => updateLine(idx, "serialNumbers", e.target.value)}
                      placeholder="SN001, SN002, SN003..."
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegisterAssets} disabled={registering}>
              {registering
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registering...</>
                : <><PackagePlus className="h-4 w-4 mr-2" />Register {assetLines.reduce((s, l) => s + l.quantity, 0)} Asset(s)</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
