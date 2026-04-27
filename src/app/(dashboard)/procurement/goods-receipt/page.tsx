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
import { AlertTriangle, Download, ExternalLink, Loader2, PackageCheck } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";

interface PurchaseOrder {
  id: string;
  poNo: string;
  date: string;
  vendor: { companyName: string } | null;
  deliveryDate: string | null;
  totalAmount: number;
  status: string;
}

interface GoodsReceipt {
  id: string;
  grnNo: string;
  date: string;
  poId: string;
  purchaseOrder: { poNo: string } | null;
  vendorId: string;
  vendor: { companyName: string } | null;
  receivedById: string;
  status: string;
  inspectionNotes: string | null;
  createdAt: string;
  _count: { lines: number };
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
    ACCEPTED: "Accepted",
    PENDING_INSPECTION: "Pending Inspection",
    REJECTED: "Rejected",
    PARTIAL: "Partial",
  };
  return map[status] ?? status;
}

function getPoStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ISSUED: "Issued",
    PARTIALLY_RECEIVED: "Partially Received",
  };
  return map[status] ?? status;
}

export default function GoodsReceiptPage() {
  const t = useTranslations("procurement");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceiptDashboard() {
      setLoading(true);
      setError(null);

      try {
        const cacheBust = Date.now();
        const [ordersResponse, receiptsResponse] = await Promise.all([
          fetch(`/api/v1/procurement/orders?limit=50&_=${cacheBust}`, { cache: "no-store" }),
          fetch(`/api/v1/procurement/goods-receipt?limit=50&_=${cacheBust}`, { cache: "no-store" }),
        ]);

        const [ordersJson, receiptsJson] = await Promise.all([
          ordersResponse.json(),
          receiptsResponse.json(),
        ]);

        if (!ordersJson.success) {
          throw new Error(ordersJson.error?.message ?? "Failed to load purchase orders.");
        }
        if (!receiptsJson.success) {
          throw new Error(receiptsJson.error?.message ?? "Failed to load goods receipts.");
        }

        setPurchaseOrders(ordersJson.data);
        setReceipts(receiptsJson.data);
        setTotal(receiptsJson.meta?.total ?? receiptsJson.data.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load goods receipt dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchReceiptDashboard();
  }, []);

  const receivableOrders = purchaseOrders.filter((po) =>
    po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED"
  );
  const accepted = receipts.filter((g) => g.status === "ACCEPTED").length;
  const partiallyReceived = purchaseOrders.filter((po) => po.status === "PARTIALLY_RECEIVED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("goodsReceipt.title")}
        description={t("goodsReceipt.description")}
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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              POs Awaiting Receipt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "-" : receivableOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("goodsReceipt.totalGRNs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "-" : total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partially Received POs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{loading ? "-" : partiallyReceived}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("goodsReceipt.accepted")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{loading ? "-" : accepted}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            Purchase Orders Awaiting Receipt
          </CardTitle>
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
                  <TableHead className="w-[130px]">{t("orders.poNo")}</TableHead>
                  <TableHead>{t("orders.date")}</TableHead>
                  <TableHead>{t("orders.vendor")}</TableHead>
                  <TableHead>{t("orders.deliveryDate")}</TableHead>
                  <TableHead className="text-right">{t("orders.totalAmount")}</TableHead>
                  <TableHead>{tc("labels.status")}</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivableOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No purchase orders are waiting for receipt
                    </TableCell>
                  </TableRow>
                ) : (
                  receivableOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-sm">
                        <Link href={`/procurement/orders/${po.id}`} className="hover:underline text-primary inline-flex items-center gap-1">
                          {po.poNo}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(po.date, locale)}</TableCell>
                      <TableCell className="font-medium">{po.vendor?.companyName ?? "-"}</TableCell>
                      <TableCell>{po.deliveryDate ? formatDate(po.deliveryDate, locale) : "-"}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(Number(po.totalAmount), locale)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={po.status === "PARTIALLY_RECEIVED" ? "outline" : "secondary"}>
                          {getPoStatusLabel(po.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" asChild>
                          <Link href={`/procurement/orders/${po.id}`}>
                            Receive / Create GRN
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("goodsReceipt.goodsReceiptNotes")}</CardTitle>
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
                  <TableHead className="w-[130px]">{t("goodsReceipt.grnNo")}</TableHead>
                  <TableHead>{t("goodsReceipt.date")}</TableHead>
                  <TableHead>{t("goodsReceipt.poReference")}</TableHead>
                  <TableHead>{t("goodsReceipt.vendor")}</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead>{tc("labels.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No goods receipts found
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((grn) => (
                    <TableRow key={grn.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/procurement/goods-receipt/${grn.id}`}
                          className="hover:underline text-primary"
                        >
                          {grn.grnNo}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(grn.date, locale)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {grn.purchaseOrder ? (
                          <Link
                            href={`/procurement/orders/${grn.poId}`}
                            className="hover:underline text-primary"
                          >
                            {grn.purchaseOrder.poNo}
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {grn.vendor?.companyName ?? "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(grn._count.lines, locale)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(grn.status)}>
                          {getStatusLabel(grn.status)}
                        </Badge>
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
