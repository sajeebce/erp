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
import { formatBDT, formatPercent, formatNumber } from "@/lib/formatters";

interface LoanProduct {
  productCode: string;
  name: string;
  category: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  duration: number;
  repaymentFrequency: string;
  gracePeriod: number;
  serviceCharge: number;
  activeLoans: number;
  status: "Active" | "Inactive" | "Pilot";
}

const loanProducts: LoanProduct[] = [
  {
    productCode: "LP-001",
    name: "Jagoron",
    category: "Income Generating",
    minAmount: 10000,
    maxAmount: 50000,
    interestRate: 24.0,
    duration: 12,
    repaymentFrequency: "Weekly",
    gracePeriod: 0,
    serviceCharge: 1.0,
    activeLoans: 1245,
    status: "Active",
  },
  {
    productCode: "LP-002",
    name: "Krishi",
    category: "Agriculture",
    minAmount: 15000,
    maxAmount: 100000,
    interestRate: 20.0,
    duration: 12,
    repaymentFrequency: "Monthly",
    gracePeriod: 3,
    serviceCharge: 1.0,
    activeLoans: 892,
    status: "Active",
  },
  {
    productCode: "LP-003",
    name: "Shiksha",
    category: "Education",
    minAmount: 5000,
    maxAmount: 30000,
    interestRate: 15.0,
    duration: 18,
    repaymentFrequency: "Monthly",
    gracePeriod: 6,
    serviceCharge: 0.5,
    activeLoans: 456,
    status: "Active",
  },
  {
    productCode: "LP-004",
    name: "Griha",
    category: "Housing",
    minAmount: 50000,
    maxAmount: 300000,
    interestRate: 22.0,
    duration: 36,
    repaymentFrequency: "Monthly",
    gracePeriod: 1,
    serviceCharge: 1.5,
    activeLoans: 234,
    status: "Active",
  },
  {
    productCode: "LP-005",
    name: "Apatkalin",
    category: "Emergency",
    minAmount: 2000,
    maxAmount: 15000,
    interestRate: 12.0,
    duration: 6,
    repaymentFrequency: "Weekly",
    gracePeriod: 0,
    serviceCharge: 0.5,
    activeLoans: 178,
    status: "Active",
  },
  {
    productCode: "LP-006",
    name: "Mousumi",
    category: "Seasonal Crop",
    minAmount: 20000,
    maxAmount: 80000,
    interestRate: 18.0,
    duration: 9,
    repaymentFrequency: "Monthly",
    gracePeriod: 4,
    serviceCharge: 1.0,
    activeLoans: 315,
    status: "Active",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "Active": return "default";
    case "Pilot": return "secondary";
    case "Inactive": return "outline";
    default: return "outline";
  }
}

function getCategoryColor(category: string): "default" | "secondary" | "outline" | "destructive" {
  switch (category) {
    case "Income Generating": return "default";
    case "Agriculture": return "secondary";
    case "Education": return "outline";
    case "Housing": return "secondary";
    case "Emergency": return "destructive";
    case "Seasonal Crop": return "outline";
    default: return "outline";
  }
}

export default function LoanProductsPage() {
  const totalProducts = loanProducts.length;
  const totalActiveLoans = loanProducts.reduce((sum, p) => sum + p.activeLoans, 0);
  const totalPortfolio = loanProducts.reduce((sum, p) => sum + p.activeLoans * ((p.minAmount + p.maxAmount) / 2), 0);
  const avgInterestRate = loanProducts.reduce((sum, p) => sum + p.interestRate, 0) / loanProducts.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Products"
        description="Configure and manage microfinance loan products"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Product
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalProducts)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalActiveLoans)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalPortfolio)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Interest Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(avgInterestRate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loan Product Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Code</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Min Amount</TableHead>
                <TableHead className="text-right">Max Amount</TableHead>
                <TableHead className="text-right">Interest Rate</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Repayment</TableHead>
                <TableHead className="text-right">Grace Period</TableHead>
                <TableHead className="text-right">Service Charge</TableHead>
                <TableHead className="text-right">Active Loans</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loanProducts.map((product) => (
                <TableRow key={product.productCode}>
                  <TableCell className="font-mono text-sm">{product.productCode}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryColor(product.category)}>{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(product.minAmount)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(product.maxAmount)}</TableCell>
                  <TableCell className="text-right">{formatPercent(product.interestRate)}</TableCell>
                  <TableCell className="text-right">{product.duration} months</TableCell>
                  <TableCell>{product.repaymentFrequency}</TableCell>
                  <TableCell className="text-right">{product.gracePeriod > 0 ? `${product.gracePeriod} months` : "None"}</TableCell>
                  <TableCell className="text-right">{formatPercent(product.serviceCharge)}</TableCell>
                  <TableCell className="text-right">{formatNumber(product.activeLoans)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(product.status)}>{product.status}</Badge>
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
