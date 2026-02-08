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

interface Asset {
  assetId: string;
  name: string;
  category: string;
  location: string;
  purchaseDate: string;
  value: number;
  depreciatedValue: number;
  status: "In Use" | "Under Maintenance" | "Disposed" | "In Storage" | "Transferred";
}

const assets: Asset[] = [
  {
    assetId: "AST-001",
    name: "Toyota Hilux Pickup - Dhaka",
    category: "Vehicle",
    location: "Head Office, Dhaka",
    purchaseDate: "2022-03-15",
    value: 4500000,
    depreciatedValue: 3150000,
    status: "In Use",
  },
  {
    assetId: "AST-002",
    name: "Dell OptiPlex Desktop (x10)",
    category: "IT Equipment",
    location: "Head Office, Dhaka",
    purchaseDate: "2023-06-01",
    value: 800000,
    depreciatedValue: 560000,
    status: "In Use",
  },
  {
    assetId: "AST-003",
    name: "Honda CRF 150 Motorcycle",
    category: "Vehicle",
    location: "Sylhet Field Office",
    purchaseDate: "2023-01-20",
    value: 350000,
    depreciatedValue: 262500,
    status: "In Use",
  },
  {
    assetId: "AST-004",
    name: "Canon ImageRunner Photocopier",
    category: "Office Equipment",
    location: "Head Office, Dhaka",
    purchaseDate: "2021-11-10",
    value: 250000,
    depreciatedValue: 125000,
    status: "Under Maintenance",
  },
  {
    assetId: "AST-005",
    name: "Samsung Split AC 2 Ton (x5)",
    category: "Office Equipment",
    location: "Chattogram Regional Office",
    purchaseDate: "2023-04-15",
    value: 450000,
    depreciatedValue: 337500,
    status: "In Use",
  },
  {
    assetId: "AST-006",
    name: "Water Quality Testing Lab Kit",
    category: "Program Equipment",
    location: "Sylhet Field Office",
    purchaseDate: "2024-02-01",
    value: 1200000,
    depreciatedValue: 1080000,
    status: "In Use",
  },
  {
    assetId: "AST-007",
    name: "Toyota Noah Microbus",
    category: "Vehicle",
    location: "Head Office, Dhaka",
    purchaseDate: "2020-08-20",
    value: 5500000,
    depreciatedValue: 2750000,
    status: "In Use",
  },
  {
    assetId: "AST-008",
    name: "HP ProBook Laptop (x15)",
    category: "IT Equipment",
    location: "Multiple Offices",
    purchaseDate: "2024-01-10",
    value: 2250000,
    depreciatedValue: 2025000,
    status: "In Use",
  },
  {
    assetId: "AST-009",
    name: "Diesel Generator 10KVA",
    category: "Office Equipment",
    location: "Rangpur Field Office",
    purchaseDate: "2022-09-05",
    value: 380000,
    depreciatedValue: 228000,
    status: "In Storage",
  },
  {
    assetId: "AST-010",
    name: "Conference Room Furniture Set",
    category: "Furniture",
    location: "Head Office, Dhaka",
    purchaseDate: "2021-05-12",
    value: 320000,
    depreciatedValue: 160000,
    status: "In Use",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "In Use": return "default";
    case "Under Maintenance": return "secondary";
    case "In Storage": return "outline";
    case "Disposed": return "destructive";
    case "Transferred": return "outline";
    default: return "outline";
  }
}

export default function AssetsPage() {
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  const totalDepreciated = assets.reduce((sum, a) => sum + a.depreciatedValue, 0);
  const activeAssets = assets.filter((a) => a.status === "In Use").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Management"
        description="Track and manage organizational fixed assets"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Register Asset
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{assets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Original Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Book Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalDepreciated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Active Use</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeAssets}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead className="text-right">Original Value</TableHead>
                <TableHead className="text-right">Book Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.assetId}>
                  <TableCell className="font-mono text-sm">{asset.assetId}</TableCell>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell>{asset.category}</TableCell>
                  <TableCell>{asset.location}</TableCell>
                  <TableCell>{formatDate(asset.purchaseDate)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(asset.value)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(asset.depreciatedValue)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(asset.status)}>{asset.status}</Badge>
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
