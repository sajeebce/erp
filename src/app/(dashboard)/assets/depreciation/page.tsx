import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Calculator } from "lucide-react";
import { formatBDT, formatDate } from "@/lib/formatters";

interface DepreciationEntry {
  assetId: string;
  name: string;
  category: string;
  purchaseDate: string;
  originalCost: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  annualDepreciation: number;
  monthlyDepreciation: number;
}

const depreciationSchedule: DepreciationEntry[] = [
  {
    assetId: "AST-001",
    name: "Toyota Hilux Pickup - Dhaka",
    category: "Vehicle",
    purchaseDate: "2022-03-15",
    originalCost: 4500000,
    accumulatedDepreciation: 1350000,
    netBookValue: 3150000,
    annualDepreciation: 450000,
    monthlyDepreciation: 37500,
  },
  {
    assetId: "AST-002",
    name: "Dell OptiPlex Desktop (x10)",
    category: "IT Equipment",
    purchaseDate: "2023-06-01",
    originalCost: 800000,
    accumulatedDepreciation: 240000,
    netBookValue: 560000,
    annualDepreciation: 200000,
    monthlyDepreciation: 16667,
  },
  {
    assetId: "AST-003",
    name: "Honda CRF 150 Motorcycle",
    category: "Vehicle",
    purchaseDate: "2023-01-20",
    originalCost: 350000,
    accumulatedDepreciation: 87500,
    netBookValue: 262500,
    annualDepreciation: 35000,
    monthlyDepreciation: 2917,
  },
  {
    assetId: "AST-004",
    name: "Canon ImageRunner Photocopier",
    category: "Office Equipment",
    purchaseDate: "2021-11-10",
    originalCost: 250000,
    accumulatedDepreciation: 125000,
    netBookValue: 125000,
    annualDepreciation: 50000,
    monthlyDepreciation: 4167,
  },
  {
    assetId: "AST-005",
    name: "Samsung Split AC 2 Ton (x5)",
    category: "Office Equipment",
    purchaseDate: "2023-04-15",
    originalCost: 450000,
    accumulatedDepreciation: 112500,
    netBookValue: 337500,
    annualDepreciation: 90000,
    monthlyDepreciation: 7500,
  },
  {
    assetId: "AST-006",
    name: "Water Quality Testing Lab Kit",
    category: "Program Equipment",
    purchaseDate: "2024-02-01",
    originalCost: 1200000,
    accumulatedDepreciation: 120000,
    netBookValue: 1080000,
    annualDepreciation: 240000,
    monthlyDepreciation: 20000,
  },
  {
    assetId: "AST-007",
    name: "Toyota Noah Microbus",
    category: "Vehicle",
    purchaseDate: "2020-08-20",
    originalCost: 5500000,
    accumulatedDepreciation: 2750000,
    netBookValue: 2750000,
    annualDepreciation: 550000,
    monthlyDepreciation: 45833,
  },
  {
    assetId: "AST-008",
    name: "HP ProBook Laptop (x15)",
    category: "IT Equipment",
    purchaseDate: "2024-01-10",
    originalCost: 2250000,
    accumulatedDepreciation: 225000,
    netBookValue: 2025000,
    annualDepreciation: 562500,
    monthlyDepreciation: 46875,
  },
  {
    assetId: "AST-009",
    name: "Diesel Generator 10KVA",
    category: "Office Equipment",
    purchaseDate: "2022-09-05",
    originalCost: 380000,
    accumulatedDepreciation: 152000,
    netBookValue: 228000,
    annualDepreciation: 76000,
    monthlyDepreciation: 6333,
  },
  {
    assetId: "AST-010",
    name: "Conference Room Furniture Set",
    category: "Furniture",
    purchaseDate: "2021-05-12",
    originalCost: 320000,
    accumulatedDepreciation: 160000,
    netBookValue: 160000,
    annualDepreciation: 40000,
    monthlyDepreciation: 3333,
  },
];

export default function DepreciationPage() {
  const totalOriginalCost = depreciationSchedule.reduce((sum, d) => sum + d.originalCost, 0);
  const totalAccumulated = depreciationSchedule.reduce((sum, d) => sum + d.accumulatedDepreciation, 0);
  const totalNetBook = depreciationSchedule.reduce((sum, d) => sum + d.netBookValue, 0);
  const currentYearDepreciation = depreciationSchedule.reduce((sum, d) => sum + d.annualDepreciation, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Depreciation Schedule"
        description="Calculate and manage asset depreciation schedules"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Calculator className="h-4 w-4 mr-2" />
          Run Depreciation
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Original Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalOriginalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Accumulated Dep.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalAccumulated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Net Book Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalNetBook)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Year Dep.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(currentYearDepreciation)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Depreciation Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset ID</TableHead>
                <TableHead>Asset Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead className="text-right">Original Cost</TableHead>
                <TableHead className="text-right">Accum. Depreciation</TableHead>
                <TableHead className="text-right">Net Book Value</TableHead>
                <TableHead className="text-right">Annual Dep.</TableHead>
                <TableHead className="text-right">Monthly Dep.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depreciationSchedule.map((entry) => (
                <TableRow key={entry.assetId}>
                  <TableCell className="font-mono text-sm">{entry.assetId}</TableCell>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell>{entry.category}</TableCell>
                  <TableCell>{formatDate(entry.purchaseDate)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(entry.originalCost)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(entry.accumulatedDepreciation)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(entry.netBookValue)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(entry.annualDepreciation)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(entry.monthlyDepreciation)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
