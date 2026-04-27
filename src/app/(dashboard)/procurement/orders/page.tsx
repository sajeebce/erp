"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import { AlertTriangle, Download, Loader2, ExternalLink } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface PurchaseOrder {
  id: string;
  poNo: string;
  date: string;
  vendor: { companyName: string } | null;
  deliveryDate: string | null;
  totalAmount: number;
  paymentTerms: string | null;
  status: string;
  lines?: Array<{
    prLine: {
      requisition: { id: string; prNo: string } | null;
    } | null;
  }>;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED": return "default";
    case "ISSUED": return "secondary";
    case "PARTIALLY_RECEIVED": return "outline";
    case "DRAFT": return "outline";
    case "CANCELLED": return "destructive";
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
  };
  return map[status] ?? status;
}

export default function PurchaseOrdersPage() {
  const t = useTranslations("procurement");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/procurement/orders?limit=50&_=${Date.now()}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => {
        if (json.success) {
          setPurchaseOrders(json.data);
          setTotal(json.meta?.total ?? json.data.length);
          setError(null);
        } else {
          setError(json.error?.message ?? "Failed to load purchase orders.");
        }
      })
      .catch(() => setError("Failed to load purchase orders. Please refresh the page."))
      .finally(() => setLoading(false));
  }, []);

  const totalValue = purchaseOrders
    .filter((po) => po.status !== "CANCELLED")
    .reduce((sum, po) => sum + Number(po.totalAmount), 0);
  const pendingDelivery = purchaseOrders.filter(
    (po) => po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED"
  ).length;
  const completed = purchaseOrders.filter((po) => po.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("orders.title")}
        description={t("orders.description")}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc("buttons.export")}
        </Button>
      </PageHeader>

      {error && (
        <Alert className="border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("orders.totalPOs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "-" : total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("orders.totalValue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "-" : formatCurrency(totalValue, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("orders.pendingDelivery")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{loading ? "-" : pendingDelivery}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("orders.completed")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{loading ? "-" : completed}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("orders.purchaseOrderRegister")}</CardTitle>
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
                  <TableHead className="w-[140px]">{t("orders.poNo")}</TableHead>
                  <TableHead>{t("orders.date")}</TableHead>
                  <TableHead>{t("orders.vendor")}</TableHead>
                  <TableHead>Source PR</TableHead>
                  <TableHead>{t("orders.deliveryDate")}</TableHead>
                  <TableHead className="text-right">{t("orders.totalAmount")}</TableHead>
                  <TableHead>{t("orders.paymentTerms")}</TableHead>
                  <TableHead>{tc("labels.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((po) => {
                    const sourcePr = po.lines?.find((line) => line.prLine?.requisition)?.prLine?.requisition;

                    return (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono text-sm">
                          <Link href={`/procurement/orders/${po.id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                            {po.poNo}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(po.date, locale)}</TableCell>
                        <TableCell className="font-medium">{po.vendor?.companyName ?? "-"}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {sourcePr ? (
                            <Link href={`/procurement/requisitions/${sourcePr.id}`} className="text-primary hover:underline">
                              {sourcePr.prNo}
                            </Link>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{po.deliveryDate ? formatDate(po.deliveryDate, locale) : "-"}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(Number(po.totalAmount), locale)}</TableCell>
                        <TableCell className="text-sm">{po.paymentTerms ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(po.status)}>
                            {getStatusLabel(po.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
