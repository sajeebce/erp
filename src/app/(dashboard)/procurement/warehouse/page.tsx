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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { formatBDT, formatNumber, formatPercent } from "@/lib/formatters";

interface Store {
  id: string;
  storeName: string;
  location: string;
  capacityPercent: number;
  manager: string;
  itemsCount: number;
  totalValue: number;
  status: "Active" | "Under Maintenance" | "Closed";
}

const stores: Store[] = [
  {
    id: "STR-001",
    storeName: "Central Warehouse - Dhaka HQ",
    location: "Mohakhali, Dhaka",
    capacityPercent: 72,
    manager: "Anwar Hossain",
    itemsCount: 156,
    totalValue: 4250000,
    status: "Active",
  },
  {
    id: "STR-002",
    storeName: "Sylhet Regional Store",
    location: "Zindabazar, Sylhet",
    capacityPercent: 58,
    manager: "Kamrul Hasan",
    itemsCount: 89,
    totalValue: 1850000,
    status: "Active",
  },
  {
    id: "STR-003",
    storeName: "Chattogram Field Store",
    location: "Agrabad, Chattogram",
    capacityPercent: 85,
    manager: "Faruk Ahmed",
    itemsCount: 112,
    totalValue: 2700000,
    status: "Active",
  },
  {
    id: "STR-004",
    storeName: "Rangpur Distribution Center",
    location: "Central Road, Rangpur",
    capacityPercent: 41,
    manager: "Mizanur Rahman",
    itemsCount: 67,
    totalValue: 980000,
    status: "Active",
  },
  {
    id: "STR-005",
    storeName: "Barishal Program Store",
    location: "Sadar Road, Barishal",
    capacityPercent: 15,
    manager: "Shahidul Islam",
    itemsCount: 34,
    totalValue: 450000,
    status: "Under Maintenance",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Active": return "default";
    case "Under Maintenance": return "outline";
    case "Closed": return "destructive";
    default: return "outline";
  }
}

function getCapacityColor(percent: number): string {
  if (percent >= 80) return "[&>div]:bg-red-500";
  if (percent >= 60) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-emerald-500";
}

export default function WarehousePage() {
  const totalStores = stores.length;
  const totalItems = stores.reduce((sum, s) => sum + s.itemsCount, 0);
  const totalValue = stores.reduce((sum, s) => sum + s.totalValue, 0);
  const avgCapacity = Math.round(stores.reduce((sum, s) => sum + s.capacityPercent, 0) / stores.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse"
        description="Manage warehouse locations and storage"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Store
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStores}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalItems)}</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(avgCapacity)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Store ID</TableHead>
                <TableHead>Store Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-[180px]">Capacity</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Items Count</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-mono text-sm">{store.id}</TableCell>
                  <TableCell className="font-medium">{store.storeName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{store.location}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={store.capacityPercent}
                        className={`flex-1 h-2 ${getCapacityColor(store.capacityPercent)}`}
                      />
                      <span className="text-sm font-medium w-10 text-right">
                        {formatPercent(store.capacityPercent)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{store.manager}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(store.itemsCount)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(store.totalValue)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(store.status)}>
                      {store.status}
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
