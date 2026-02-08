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
import { Save, Download, Users, Target, Settings, BarChart3 } from "lucide-react";
import { formatBDT, formatPercent } from "@/lib/formatters";

interface BudgetLineItem {
  id: string;
  category: string;
  budgetHead: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
  total: number;
  notes: string;
}

const budgetLineItems: BudgetLineItem[] = [
  {
    id: "BL-001",
    category: "Personnel",
    budgetHead: "Staff Salaries",
    description: "Project Manager (1) + Field Officers (4)",
    unit: "Month",
    quantity: 12,
    unitCost: 450000,
    total: 5400000,
    notes: "Includes 5% annual increment",
  },
  {
    id: "BL-002",
    category: "Personnel",
    budgetHead: "Staff Benefits",
    description: "Provident Fund, Gratuity, Insurance",
    unit: "Month",
    quantity: 12,
    unitCost: 135000,
    total: 1620000,
    notes: "30% of base salary",
  },
  {
    id: "BL-003",
    category: "Personnel",
    budgetHead: "Consultants",
    description: "M&E Specialist, Gender Expert",
    unit: "Day",
    quantity: 60,
    unitCost: 15000,
    total: 900000,
    notes: "Short-term consultancy",
  },
  {
    id: "BL-004",
    category: "Operations",
    budgetHead: "Office Rent",
    description: "Head Office Mohakhali + Sylhet Field Office",
    unit: "Month",
    quantity: 12,
    unitCost: 180000,
    total: 2160000,
    notes: "Includes service charges",
  },
  {
    id: "BL-005",
    category: "Operations",
    budgetHead: "Utilities & Communications",
    description: "Electricity, Internet, Phone for all offices",
    unit: "Month",
    quantity: 12,
    unitCost: 45000,
    total: 540000,
    notes: "Based on 2025 actuals",
  },
  {
    id: "BL-006",
    category: "Equipment",
    budgetHead: "IT Equipment",
    description: "Laptops (5), Printer (2), Server (1)",
    unit: "Lump Sum",
    quantity: 1,
    unitCost: 650000,
    total: 650000,
    notes: "One-time procurement",
  },
  {
    id: "BL-007",
    category: "Travel",
    budgetHead: "Field Travel",
    description: "Vehicle hire, fuel, per diem for field visits",
    unit: "Trip",
    quantity: 48,
    unitCost: 15000,
    total: 720000,
    notes: "4 trips/month to project sites",
  },
  {
    id: "BL-008",
    category: "Training",
    budgetHead: "Capacity Building",
    description: "Community training workshops (beneficiaries)",
    unit: "Workshop",
    quantity: 24,
    unitCost: 85000,
    total: 2040000,
    notes: "2 workshops/month across divisions",
  },
  {
    id: "BL-009",
    category: "Training",
    budgetHead: "Staff Training",
    description: "Professional development & certifications",
    unit: "Person",
    quantity: 10,
    unitCost: 50000,
    total: 500000,
    notes: "All project staff",
  },
  {
    id: "BL-010",
    category: "Admin",
    budgetHead: "Office Supplies",
    description: "Stationery, printing, photocopying",
    unit: "Month",
    quantity: 12,
    unitCost: 25000,
    total: 300000,
    notes: "All offices combined",
  },
  {
    id: "BL-011",
    category: "M&E",
    budgetHead: "Monitoring & Evaluation",
    description: "Baseline survey, mid-term review, endline",
    unit: "Survey",
    quantity: 3,
    unitCost: 500000,
    total: 1500000,
    notes: "External evaluation firm",
  },
  {
    id: "BL-012",
    category: "Contingency",
    budgetHead: "Contingency Reserve",
    description: "Unforeseen expenses and cost escalation",
    unit: "Lump Sum",
    quantity: 1,
    unitCost: 670000,
    total: 670000,
    notes: "~4% of total budget",
  },
];

function getCategoryVariant(category: string): "default" | "secondary" | "outline" | "destructive" {
  switch (category) {
    case "Personnel": return "default";
    case "Operations": return "secondary";
    case "Equipment": return "outline";
    case "Travel": return "outline";
    case "Training": return "default";
    case "Admin": return "secondary";
    case "M&E": return "outline";
    case "Contingency": return "destructive";
    default: return "secondary";
  }
}

export default function BudgetCreatePage() {
  const totalBudget = budgetLineItems.reduce((sum, item) => sum + item.total, 0);
  const personnelCost = budgetLineItems
    .filter((item) => item.category === "Personnel")
    .reduce((sum, item) => sum + item.total, 0);
  const directProgramCost = budgetLineItems
    .filter((item) => ["Training", "M&E", "Travel"].includes(item.category))
    .reduce((sum, item) => sum + item.total, 0);
  const adminCost = budgetLineItems
    .filter((item) => ["Admin", "Operations"].includes(item.category))
    .reduce((sum, item) => sum + item.total, 0);

  const personnelPercent = (personnelCost / totalBudget) * 100;
  const directProgramPercent = (directProgramCost / totalBudget) * 100;
  const adminRatio = (adminCost / totalBudget) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Budget"
        description="WASH Program - Sylhet Division (FY 2026-2027)"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatBDT(totalBudget)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Personnel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatPercent(personnelPercent)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Direct Program Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatPercent(directProgramPercent)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admin Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatPercent(adminRatio)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Budget Head</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[90px]">Unit</TableHead>
                <TableHead className="text-right w-[60px]">Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetLineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant={getCategoryVariant(item.category)}>{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{item.budgetHead}</TableCell>
                  <TableCell className="text-sm">{item.description}</TableCell>
                  <TableCell className="text-sm">{item.unit}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatBDT(item.unitCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatBDT(item.total)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.notes}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={6} className="text-right font-semibold">
                  Total Budget
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatBDT(totalBudget)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
