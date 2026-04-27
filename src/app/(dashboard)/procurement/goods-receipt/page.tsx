"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Download, Loader2 } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/formatters";

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

export default function GoodsReceiptPage() {
  const t = useTranslations("procurement");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("/api/v1/procurement/goods-receipt?limit=50")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setReceipts(json.data);
          setTotal(json.meta?.total ?? json.data.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendingInspection = receipts.filter((g) => g.status === "PENDING_INSPECTION").length;
  const accepted = receipts.filter((g) => g.status === "ACCEPTED").length;
  const rejected = receipts.filter((g) => g.status === "REJECTED").length;

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
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t("goodsReceipt.newGRN")}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("goodsReceipt.totalGRNs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "—" : total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("goodsReceipt.pendingInspection")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{loading ? "—" : pendingInspection}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("goodsReceipt.accepted")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{loading ? "—" : accepted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("goodsReceipt.rejected")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{loading ? "—" : rejected}</p>
          </CardContent>
        </Card>
      </div>

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
                        ) : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {grn.vendor?.companyName ?? "—"}
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
