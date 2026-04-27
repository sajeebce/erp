"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Download, AlertTriangle, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface PRLine {
  id: string;
  description: string;
  quantity: number;
  estimatedPrice: number;
  totalEstimate: number;
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
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  budgetWarning?: string | null;
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PO_CREATED": return "default";
    case "APPROVED": return "default";
    case "REVIEWED": return "secondary";
    case "SUBMITTED": return "outline";
    case "DRAFT": return "outline";
    case "REJECTED": return "destructive";
    default: return "outline";
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PO_CREATED: "PO Created",
    APPROVED: "Approved",
    REVIEWED: "Reviewed",
    SUBMITTED: "Submitted",
    DRAFT: "Draft",
    REJECTED: "Rejected",
  };
  return map[status] ?? status;
}

function getPriorityVariant(priority: string): "default" | "secondary" | "outline" | "destructive" {
  switch (priority) {
    case "URGENT": return "destructive";
    case "HIGH": return "default";
    case "NORMAL": return "secondary";
    case "LOW": return "outline";
    default: return "outline";
  }
}

export default function PurchaseRequisitionsPage() {
  const t = useTranslations("procurement");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("/api/v1/procurement/requisitions?limit=50")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setRequisitions(json.data);
          setTotal(json.meta?.total ?? json.data.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalValue = requisitions.reduce((sum, r) => sum + Number(r.totalEstimate), 0);
  const pendingApproval = requisitions.filter((r) => ["SUBMITTED", "REVIEWED"].includes(r.status)).length;
  const poCreated = requisitions.filter((r) => r.status === "PO_CREATED").length;
  const withWarning = requisitions.filter((r) => r.budgetWarning).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("requisitions.title")}
        description={t("requisitions.description")}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc("buttons.export")}
        </Button>
        <Button size="sm" asChild>
          <Link href="/procurement/requisitions/new">
            <Plus className="h-4 w-4 mr-2" />
            {t("requisitions.newRequisition")}
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("requisitions.totalRequisitions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("requisitions.totalValue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {loading ? "—" : formatCurrency(totalValue, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("requisitions.pendingApproval")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{loading ? "—" : pendingApproval}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("requisitions.poCreated")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{loading ? "—" : poCreated}</p>
          </CardContent>
        </Card>
      </div>

      {withWarning > 0 && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            {withWarning} requisition{withWarning > 1 ? "s" : ""} have budget warnings. Review before approval.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("requisitions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">{t("requisitions.prNo")}</TableHead>
                  <TableHead>{t("requisitions.date")}</TableHead>
                  <TableHead className="text-right">{t("requisitions.estimatedCost")}</TableHead>
                  <TableHead>{t("requisitions.priority")}</TableHead>
                  <TableHead>{tc("labels.status")}</TableHead>
                  <TableHead>{t("requisitions.poRef")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No requisitions found
                    </TableCell>
                  </TableRow>
                ) : (
                  requisitions.map((req) => (
                    <TableRow
                      key={req.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-mono text-sm">
                        <Link href={`/procurement/requisitions/${req.id}`} className="hover:underline text-primary flex items-center gap-1">
                          {req.prNo}
                          {req.budgetWarning && (
                            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(req.date, locale)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(Number(req.totalEstimate), locale)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityVariant(req.priority)} className="text-[10px]">
                          {req.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(req.status)}>
                          {getStatusLabel(req.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {req.status === "PO_CREATED" ? "PO linked" : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
