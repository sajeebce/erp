import { getTranslations, getLocale } from 'next-intl/server';
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
import { Plus, Download } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/formatters";

interface GoodsReceipt {
  id: string;
  date: string;
  poReference: string;
  vendor: string;
  items: string;
  quantityOrdered: number;
  quantityReceived: number;
  inspectionStatus: "Passed" | "Failed" | "Partial";
  receivedBy: string;
  status: "Pending Inspection" | "Accepted" | "Rejected" | "Partial";
}

const goodsReceipts: GoodsReceipt[] = [
  {
    id: "GRN-2026-001",
    date: "2026-01-25",
    poReference: "PO-2026-002",
    vendor: "Dhaka IT Hub",
    items: "Laptops, Printers, Networking Equipment",
    quantityOrdered: 13,
    quantityReceived: 13,
    inspectionStatus: "Passed",
    receivedBy: "Shakil Ahmed",
    status: "Accepted",
  },
  {
    id: "GRN-2026-002",
    date: "2026-01-28",
    poReference: "PO-2026-005",
    vendor: "Jamuna Stationery House",
    items: "Training Manuals, Notebooks, Pens, Flip Charts",
    quantityOrdered: 500,
    quantityReceived: 500,
    inspectionStatus: "Passed",
    receivedBy: "Anwar Hossain",
    status: "Accepted",
  },
  {
    id: "GRN-2026-003",
    date: "2026-01-30",
    poReference: "PO-2026-004",
    vendor: "Green Agro Bangladesh",
    items: "Rice Seeds, Wheat Seeds",
    quantityOrdered: 800,
    quantityReceived: 500,
    inspectionStatus: "Partial",
    receivedBy: "Kamrul Hasan",
    status: "Partial",
  },
  {
    id: "GRN-2026-004",
    date: "2026-02-01",
    poReference: "PO-2026-001",
    vendor: "Bengal Office Solutions Ltd.",
    items: "Office Desks, Chairs",
    quantityOrdered: 30,
    quantityReceived: 30,
    inspectionStatus: "Failed",
    receivedBy: "Rezaul Karim",
    status: "Rejected",
  },
  {
    id: "GRN-2026-005",
    date: "2026-02-03",
    poReference: "PO-2026-003",
    vendor: "Padma Medical Supplies",
    items: "Medical Kits, First Aid Supplies",
    quantityOrdered: 100,
    quantityReceived: 100,
    inspectionStatus: "Passed",
    receivedBy: "Dr. Nasreen Jahan",
    status: "Accepted",
  },
  {
    id: "GRN-2026-006",
    date: "2026-02-05",
    poReference: "PO-2026-004",
    vendor: "Green Agro Bangladesh",
    items: "Vegetable Seeds, Fertilizers",
    quantityOrdered: 300,
    quantityReceived: 300,
    inspectionStatus: "Passed",
    receivedBy: "Kamrul Hasan",
    status: "Accepted",
  },
  {
    id: "GRN-2026-007",
    date: "2026-02-06",
    poReference: "PO-2026-006",
    vendor: "Meghna Construction Co.",
    items: "Tube Well Materials, Hand Pumps",
    quantityOrdered: 50,
    quantityReceived: 50,
    inspectionStatus: "Passed",
    receivedBy: "Faruk Ahmed",
    status: "Pending Inspection",
  },
  {
    id: "GRN-2026-008",
    date: "2026-02-07",
    poReference: "PO-2026-001",
    vendor: "Bengal Office Solutions Ltd.",
    items: "Filing Cabinets (Replacement Batch)",
    quantityOrdered: 15,
    quantityReceived: 15,
    inspectionStatus: "Passed",
    receivedBy: "Rezaul Karim",
    status: "Pending Inspection",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Accepted": return "default";
    case "Pending Inspection": return "secondary";
    case "Rejected": return "destructive";
    case "Partial": return "outline";
    default: return "outline";
  }
}

function getInspectionVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Passed": return "default";
    case "Failed": return "destructive";
    case "Partial": return "outline";
    default: return "outline";
  }
}

export default async function GoodsReceiptPage() {
  const t = await getTranslations('procurement');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const totalGRNs = goodsReceipts.length;
  const pendingInspection = goodsReceipts.filter((g) => g.status === "Pending Inspection").length;
  const accepted = goodsReceipts.filter((g) => g.status === "Accepted").length;
  const rejected = goodsReceipts.filter((g) => g.status === "Rejected").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('goodsReceipt.title')}
        description={t('goodsReceipt.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('goodsReceipt.newGRN')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('goodsReceipt.totalGRNs')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalGRNs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('goodsReceipt.pendingInspection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{pendingInspection}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('goodsReceipt.accepted')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{accepted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('goodsReceipt.rejected')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{rejected}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('goodsReceipt.goodsReceiptNotes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">{t('goodsReceipt.grnNo')}</TableHead>
                <TableHead>{t('goodsReceipt.date')}</TableHead>
                <TableHead>{t('goodsReceipt.poReference')}</TableHead>
                <TableHead>{t('goodsReceipt.vendor')}</TableHead>
                <TableHead>{t('goodsReceipt.items')}</TableHead>
                <TableHead className="text-right">{t('goodsReceipt.qtyOrdered')}</TableHead>
                <TableHead className="text-right">{t('goodsReceipt.qtyReceived')}</TableHead>
                <TableHead>{t('goodsReceipt.inspection')}</TableHead>
                <TableHead>{t('goodsReceipt.receivedBy')}</TableHead>
                <TableHead>{tc('labels.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goodsReceipts.map((grn) => (
                <TableRow key={grn.id}>
                  <TableCell className="font-mono text-sm">{grn.id}</TableCell>
                  <TableCell>{formatDate(grn.date, locale)}</TableCell>
                  <TableCell className="font-mono text-sm">{grn.poReference}</TableCell>
                  <TableCell className="font-medium">{grn.vendor}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {grn.items}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(grn.quantityOrdered, locale)}</TableCell>
                  <TableCell className={`text-right font-mono ${grn.quantityReceived < grn.quantityOrdered ? "text-amber-600" : ""}`}>
                    {formatNumber(grn.quantityReceived, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getInspectionVariant(grn.inspectionStatus)} className="text-[10px]">
                      {grn.inspectionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{grn.receivedBy}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(grn.status)}>
                      {grn.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
