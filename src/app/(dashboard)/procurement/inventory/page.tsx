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
import { formatBDT, formatNumber } from "@/lib/formatters";

interface InventoryItem {
  id: string;
  itemName: string;
  category: "Office Supplies" | "IT Equipment" | "Program Materials" | "Medical Supplies" | "Agricultural Inputs";
  unit: string;
  stockInHand: number;
  reorderLevel: number;
  unitPrice: number;
  totalValue: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

const inventoryItems: InventoryItem[] = [
  {
    id: "INV-001",
    itemName: "A4 Paper (Ream)",
    category: "Office Supplies",
    unit: "Ream",
    stockInHand: 250,
    reorderLevel: 50,
    unitPrice: 450,
    totalValue: 112500,
    status: "In Stock",
  },
  {
    id: "INV-002",
    itemName: "Laptop - Dell Inspiron 15",
    category: "IT Equipment",
    unit: "Unit",
    stockInHand: 5,
    reorderLevel: 3,
    unitPrice: 85000,
    totalValue: 425000,
    status: "In Stock",
  },
  {
    id: "INV-003",
    itemName: "First Aid Kit (Standard)",
    category: "Medical Supplies",
    unit: "Kit",
    stockInHand: 8,
    reorderLevel: 15,
    unitPrice: 3500,
    totalValue: 28000,
    status: "Low Stock",
  },
  {
    id: "INV-004",
    itemName: "Rice Seeds (HYV)",
    category: "Agricultural Inputs",
    unit: "Kg",
    stockInHand: 500,
    reorderLevel: 200,
    unitPrice: 120,
    totalValue: 60000,
    status: "In Stock",
  },
  {
    id: "INV-005",
    itemName: "Training Manual - WASH",
    category: "Program Materials",
    unit: "Copy",
    stockInHand: 0,
    reorderLevel: 100,
    unitPrice: 250,
    totalValue: 0,
    status: "Out of Stock",
  },
  {
    id: "INV-006",
    itemName: "Printer Toner Cartridge",
    category: "Office Supplies",
    unit: "Unit",
    stockInHand: 12,
    reorderLevel: 10,
    unitPrice: 4500,
    totalValue: 54000,
    status: "Low Stock",
  },
  {
    id: "INV-007",
    itemName: "Water Testing Kit",
    category: "Program Materials",
    unit: "Kit",
    stockInHand: 45,
    reorderLevel: 20,
    unitPrice: 8000,
    totalValue: 360000,
    status: "In Stock",
  },
  {
    id: "INV-008",
    itemName: "PPE Set (Mask, Gloves, Gown)",
    category: "Medical Supplies",
    unit: "Set",
    stockInHand: 200,
    reorderLevel: 100,
    unitPrice: 650,
    totalValue: 130000,
    status: "In Stock",
  },
  {
    id: "INV-009",
    itemName: "Vegetable Seeds (Mixed)",
    category: "Agricultural Inputs",
    unit: "Packet",
    stockInHand: 30,
    reorderLevel: 50,
    unitPrice: 80,
    totalValue: 2400,
    status: "Low Stock",
  },
  {
    id: "INV-010",
    itemName: "Solar Panel (100W)",
    category: "IT Equipment",
    unit: "Unit",
    stockInHand: 15,
    reorderLevel: 5,
    unitPrice: 12000,
    totalValue: 180000,
    status: "In Stock",
  },
  {
    id: "INV-011",
    itemName: "Flip Chart Paper Pad",
    category: "Program Materials",
    unit: "Pad",
    stockInHand: 0,
    reorderLevel: 30,
    unitPrice: 350,
    totalValue: 0,
    status: "Out of Stock",
  },
  {
    id: "INV-012",
    itemName: "Hand Pump (No. 6)",
    category: "Program Materials",
    unit: "Unit",
    stockInHand: 22,
    reorderLevel: 10,
    unitPrice: 18000,
    totalValue: 396000,
    status: "In Stock",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "In Stock": return "default";
    case "Low Stock": return "outline";
    case "Out of Stock": return "destructive";
    default: return "outline";
  }
}

function getCategoryVariant(category: string): "default" | "secondary" | "outline" {
  switch (category) {
    case "Office Supplies": return "outline";
    case "IT Equipment": return "default";
    case "Program Materials": return "secondary";
    case "Medical Supplies": return "default";
    case "Agricultural Inputs": return "secondary";
    default: return "outline";
  }
}

export default function InventoryPage() {
  const totalItems = inventoryItems.length;
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockItems = inventoryItems.filter((item) => item.status === "Low Stock").length;
  const outOfStock = inventoryItems.filter((item) => item.status === "Out of Stock").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track inventory levels and stock movements"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalItems}</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{lowStockItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Item Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Stock In Hand</TableHead>
                <TableHead className="text-right">Reorder Level</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.id}</TableCell>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryVariant(item.category)} className="text-[10px]">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(item.stockInHand)}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{formatNumber(item.reorderLevel)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(item.totalValue)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.status)}>
                      {item.status}
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
