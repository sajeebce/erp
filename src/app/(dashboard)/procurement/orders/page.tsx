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
import { formatBDT, formatDate } from "@/lib/formatters";

interface PurchaseOrder {
  id: string;
  date: string;
  vendor: string;
  itemsDescription: string;
  deliveryDate: string;
  totalAmount: number;
  paymentTerms: string;
  status: "Draft" | "Issued" | "Partially Received" | "Completed" | "Cancelled";
}

const purchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-2026-001",
    date: "2026-01-05",
    vendor: "Bengal Office Solutions Ltd.",
    itemsDescription: "Office furniture - desks, chairs, filing cabinets",
    deliveryDate: "2026-02-05",
    totalAmount: 850000,
    paymentTerms: "Net 30",
    status: "Issued",
  },
  {
    id: "PO-2026-002",
    date: "2026-01-08",
    vendor: "Dhaka IT Hub",
    itemsDescription: "Laptops (10), printers (3), networking equipment",
    deliveryDate: "2026-01-25",
    totalAmount: 1250000,
    paymentTerms: "50% Advance",
    status: "Completed",
  },
  {
    id: "PO-2026-003",
    date: "2026-01-10",
    vendor: "Padma Medical Supplies",
    itemsDescription: "Medical kits, first aid supplies, PPE materials",
    deliveryDate: "2026-02-10",
    totalAmount: 420000,
    paymentTerms: "Net 15",
    status: "Issued",
  },
  {
    id: "PO-2026-004",
    date: "2026-01-12",
    vendor: "Green Agro Bangladesh",
    itemsDescription: "Seeds (rice, wheat, vegetables), fertilizers, pesticides",
    deliveryDate: "2026-01-30",
    totalAmount: 680000,
    paymentTerms: "Net 30",
    status: "Partially Received",
  },
  {
    id: "PO-2026-005",
    date: "2026-01-15",
    vendor: "Jamuna Stationery House",
    itemsDescription: "Training manuals, notebooks, pens, flip charts",
    deliveryDate: "2026-01-28",
    totalAmount: 175000,
    paymentTerms: "Net 15",
    status: "Completed",
  },
  {
    id: "PO-2026-006",
    date: "2026-01-18",
    vendor: "Meghna Construction Co.",
    itemsDescription: "Tube well materials, hand pumps, PVC pipes",
    deliveryDate: "2026-02-28",
    totalAmount: 1850000,
    paymentTerms: "30% Advance, 70% on Delivery",
    status: "Issued",
  },
  {
    id: "PO-2026-007",
    date: "2026-01-20",
    vendor: "Sundarbans Solar Energy",
    itemsDescription: "Solar panels (25), batteries, inverters",
    deliveryDate: "2026-03-15",
    totalAmount: 2100000,
    paymentTerms: "LC at Sight",
    status: "Draft",
  },
  {
    id: "PO-2026-008",
    date: "2025-12-15",
    vendor: "Chittagong Transport Services",
    itemsDescription: "Vehicle rental for 6 months - project field visits",
    deliveryDate: "2026-01-01",
    totalAmount: 360000,
    paymentTerms: "Monthly Payment",
    status: "Cancelled",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Completed": return "default";
    case "Issued": return "secondary";
    case "Partially Received": return "outline";
    case "Draft": return "outline";
    case "Cancelled": return "destructive";
    default: return "outline";
  }
}

export default function PurchaseOrdersPage() {
  const totalPOs = purchaseOrders.length;
  const totalValue = purchaseOrders
    .filter((po) => po.status !== "Cancelled")
    .reduce((sum, po) => sum + po.totalAmount, 0);
  const pendingDelivery = purchaseOrders.filter(
    (po) => po.status === "Issued" || po.status === "Partially Received"
  ).length;
  const completed = purchaseOrders.filter((po) => po.status === "Completed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Create and manage purchase orders to vendors"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total POs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPOs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingDelivery}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completed}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">PO No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="max-w-[250px]">Items Description</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-sm">{po.id}</TableCell>
                  <TableCell>{formatDate(po.date)}</TableCell>
                  <TableCell className="font-medium">{po.vendor}</TableCell>
                  <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                    {po.itemsDescription}
                  </TableCell>
                  <TableCell>{formatDate(po.deliveryDate)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(po.totalAmount)}</TableCell>
                  <TableCell className="text-sm">{po.paymentTerms}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(po.status)}>
                      {po.status}
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
