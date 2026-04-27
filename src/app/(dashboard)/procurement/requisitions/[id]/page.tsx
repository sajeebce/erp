"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ArrowLeft, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface PRLine {
  id: string;
  description: string;
  specification: string | null;
  unit: string;
  quantity: number;
  estimatedPrice: number;
  totalEstimate: number;
  sortOrder: number;
}

interface LinkedPO {
  id: string;
  poNo: string;
  status: string;
  totalAmount: number;
  date: string;
}

interface PurchaseRequisition {
  id: string;
  prNo: string;
  date: string;
  requestedById: string;
  departmentId: string | null;
  projectId: string | null;
  priority: string;
  totalEstimate: number;
  status: string;
  justification: string | null;
  notes: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  lines: PRLine[];
  budgetWarning?: string | null;
  linkedPOs?: LinkedPO[];
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PO_CREATED": case "APPROVED": return "default";
    case "REVIEWED": return "secondary";
    case "SUBMITTED": case "DRAFT": return "outline";
    case "REJECTED": return "destructive";
    default: return "outline";
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PO_CREATED: "PO Created", APPROVED: "Approved", REVIEWED: "Reviewed",
    SUBMITTED: "Submitted", DRAFT: "Draft", REJECTED: "Rejected",
  };
  return map[status] ?? status;
}

function getPOStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "COMPLETED": return "default";
    case "PARTIALLY_RECEIVED": case "ISSUED": return "secondary";
    case "DRAFT": return "outline";
    case "CANCELLED": return "destructive";
    default: return "outline";
  }
}

export default function PRDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("procurement");
  const tc = useTranslations("common");

  const [pr, setPr] = useState<PurchaseRequisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  async function fetchPR() {
    const res = await fetch(`/api/v1/procurement/requisitions/${id}`);
    const json = await res.json();
    if (json.success) {
      const data = json.data;
      // Fetch linked POs via PO list filtered by prId
      const poRes = await fetch(`/api/v1/procurement/orders?prId=${id}&limit=10`);
      const poJson = await poRes.json();
      const linkedPOs: LinkedPO[] = poJson.success ? poJson.data : [];
      setPr({ ...data, linkedPOs });
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPR();
    fetch("/api/v1/auth/me")
      .then((r) => r.json())
      .then((json) => { if (json.success) setUserRole(json.data.role?.name ?? ""); })
      .catch(() => {});
  }, [id]);

  async function handleApprove() {
    setApproving(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/v1/procurement/requisitions/${id}/approve`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setActionMsg({ type: "success", text: "Requisition approved successfully." });
        fetchPR();
      } else {
        setActionMsg({ type: "error", text: json.error?.message ?? "Approval failed." });
      }
    } catch {
      setActionMsg({ type: "error", text: "Network error." });
    } finally {
      setApproving(false);
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

  if (!pr) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Purchase requisition not found.
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go back
          </Button>
        </div>
      </div>
    );
  }

  const canApprove = userRole === "ADMIN" && ["DRAFT", "SUBMITTED", "REVIEWED"].includes(pr.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={pr.prNo}
        description={`Purchase Requisition · ${getStatusLabel(pr.status)}`}
      >
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {canApprove && (
          <Button size="sm" onClick={handleApprove} disabled={approving}>
            {approving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Approve
          </Button>
        )}
      </PageHeader>

      {pr.budgetWarning && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            <strong>Budget Warning:</strong> {pr.budgetWarning}
          </AlertDescription>
        </Alert>
      )}

      {actionMsg && (
        <Alert className={actionMsg.type === "success"
          ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20"
          : "border-destructive/50 bg-destructive/5"
        }>
          {actionMsg.type === "success"
            ? <CheckCircle className="h-4 w-4 text-emerald-600" />
            : <XCircle className="h-4 w-4 text-destructive" />
          }
          <AlertDescription className={actionMsg.type === "success" ? "text-emerald-700" : "text-destructive"}>
            {actionMsg.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requisition Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">PR Number</p>
                  <p className="font-mono font-medium">{pr.prNo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{formatDate(pr.date, locale)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={getStatusVariant(pr.status)}>{getStatusLabel(pr.status)}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Priority</p>
                  <p className="font-medium">{pr.priority}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Estimate</p>
                  <p className="font-mono font-bold text-base">{formatCurrency(Number(pr.totalEstimate), locale)}</p>
                </div>
                {pr.approvedAt && (
                  <div>
                    <p className="text-muted-foreground">Approved At</p>
                    <p>{formatDate(pr.approvedAt, locale)}</p>
                  </div>
                )}
              </div>
              {pr.justification && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Justification</p>
                    <p className="text-sm">{pr.justification}</p>
                  </div>
                </>
              )}
              {pr.notes && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Notes</p>
                  <p className="text-sm">{pr.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pr.lines.map((line, idx) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <p className="font-medium">{line.description}</p>
                        {line.specification && (
                          <p className="text-xs text-muted-foreground">{line.specification}</p>
                        )}
                      </TableCell>
                      <TableCell>{line.unit}</TableCell>
                      <TableCell className="text-right font-mono">{Number(line.quantity)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(Number(line.estimatedPrice), locale)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(Number(line.totalEstimate), locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-medium">Total</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(Number(pr.totalEstimate), locale)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Linked Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {pr.linkedPOs && pr.linkedPOs.length > 0 ? (
                <div className="space-y-3">
                  {pr.linkedPOs.map((po) => (
                    <div key={po.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Link
                          href={`/procurement/orders/${po.id}`}
                          className="font-mono text-sm font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          {po.poNo}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(Number(po.totalAmount), locale)}
                        </p>
                      </div>
                      <Badge variant={getPOStatusVariant(po.status)} className="text-[10px]">
                        {po.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {pr.status === "APPROVED"
                    ? "Approved — awaiting PO creation."
                    : "No purchase order linked yet."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(pr.createdAt, locale)}</span>
                </div>
                {pr.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved</span>
                    <span>{formatDate(pr.approvedAt, locale)}</span>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <Link
                  href={`/reports/audit-trail?resource=PurchaseRequisition&resourceId=${pr.id}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View full audit trail
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
