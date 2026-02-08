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
import { Download, TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";
import { formatBDT, formatPercent } from "@/lib/formatters";

interface BudgetVsActualItem {
  id: string;
  budgetHead: string;
  category: string;
  budgetAmount: number;
  actualSpent: number;
  variance: number;
  variancePercent: number;
  status: "Under Budget" | "On Track" | "Over Budget" | "Critical";
}

const budgetVsActualItems: BudgetVsActualItem[] = [
  {
    id: "BVA-001",
    budgetHead: "Staff Salaries",
    category: "Personnel",
    budgetAmount: 5400000,
    actualSpent: 5250000,
    variance: 150000,
    variancePercent: 2.8,
    status: "On Track",
  },
  {
    id: "BVA-002",
    budgetHead: "Staff Benefits & Allowances",
    category: "Personnel",
    budgetAmount: 1620000,
    actualSpent: 1580000,
    variance: 40000,
    variancePercent: 2.5,
    status: "On Track",
  },
  {
    id: "BVA-003",
    budgetHead: "Consultants & Specialists",
    category: "Personnel",
    budgetAmount: 900000,
    actualSpent: 750000,
    variance: 150000,
    variancePercent: 16.7,
    status: "Under Budget",
  },
  {
    id: "BVA-004",
    budgetHead: "Community Training Workshops",
    category: "Direct Program Costs",
    budgetAmount: 2040000,
    actualSpent: 2180000,
    variance: -140000,
    variancePercent: -6.9,
    status: "Over Budget",
  },
  {
    id: "BVA-005",
    budgetHead: "Beneficiary Cash Support",
    category: "Direct Program Costs",
    budgetAmount: 3500000,
    actualSpent: 3200000,
    variance: 300000,
    variancePercent: 8.6,
    status: "Under Budget",
  },
  {
    id: "BVA-006",
    budgetHead: "Field Supplies & Materials",
    category: "Direct Program Costs",
    budgetAmount: 1200000,
    actualSpent: 1350000,
    variance: -150000,
    variancePercent: -12.5,
    status: "Over Budget",
  },
  {
    id: "BVA-007",
    budgetHead: "Office Rent & Maintenance",
    category: "Operating Costs",
    budgetAmount: 2160000,
    actualSpent: 2160000,
    variance: 0,
    variancePercent: 0,
    status: "On Track",
  },
  {
    id: "BVA-008",
    budgetHead: "Utilities & Communications",
    category: "Operating Costs",
    budgetAmount: 540000,
    actualSpent: 620000,
    variance: -80000,
    variancePercent: -14.8,
    status: "Over Budget",
  },
  {
    id: "BVA-009",
    budgetHead: "Vehicle & Transportation",
    category: "Operating Costs",
    budgetAmount: 720000,
    actualSpent: 680000,
    variance: 40000,
    variancePercent: 5.6,
    status: "On Track",
  },
  {
    id: "BVA-010",
    budgetHead: "IT Equipment & Software",
    category: "Capital Expenditure",
    budgetAmount: 650000,
    actualSpent: 720000,
    variance: -70000,
    variancePercent: -10.8,
    status: "Over Budget",
  },
  {
    id: "BVA-011",
    budgetHead: "Monitoring & Evaluation",
    category: "M&E",
    budgetAmount: 1500000,
    actualSpent: 850000,
    variance: 650000,
    variancePercent: 43.3,
    status: "Under Budget",
  },
  {
    id: "BVA-012",
    budgetHead: "Audit & Compliance",
    category: "M&E",
    budgetAmount: 400000,
    actualSpent: 380000,
    variance: 20000,
    variancePercent: 5.0,
    status: "On Track",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Under Budget": return "secondary";
    case "On Track": return "default";
    case "Over Budget": return "destructive";
    case "Critical": return "destructive";
    default: return "outline";
  }
}

export default function BudgetVsActualPage() {
  const totalBudget = budgetVsActualItems.reduce((sum, item) => sum + item.budgetAmount, 0);
  const totalActual = budgetVsActualItems.reduce((sum, item) => sum + item.actualSpent, 0);
  const totalVariance = totalBudget - totalActual;
  const burnRate = (totalActual / totalBudget) * 100;

  const categories = [...new Set(budgetVsActualItems.map((item) => item.category))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget vs Actual"
        description="Compare budgeted amounts against actual expenditures"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalActual)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {totalVariance >= 0 ? (
                <TrendingDown className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-destructive" />
              )}
              <p className={`text-2xl font-bold ${totalVariance >= 0 ? "text-green-600" : "text-destructive"}`}>
                {formatBDT(Math.abs(totalVariance))}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Burn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatPercent(burnRate)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Budget Head</TableHead>
                <TableHead className="text-right">Budget Amount</TableHead>
                <TableHead className="text-right">Actual Spent</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right w-[90px]">Variance %</TableHead>
                <TableHead className="w-[160px]">Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const categoryItems = budgetVsActualItems.filter((item) => item.category === category);
                const categoryBudget = categoryItems.reduce((sum, item) => sum + item.budgetAmount, 0);
                const categoryActual = categoryItems.reduce((sum, item) => sum + item.actualSpent, 0);
                const categoryVariance = categoryBudget - categoryActual;
                const categoryVariancePercent = (categoryVariance / categoryBudget) * 100;

                return [
                  <TableRow key={`cat-${category}`} className="bg-muted/50">
                    <TableCell colSpan={7} className="font-semibold text-sm">
                      {category}
                    </TableCell>
                  </TableRow>,
                  ...categoryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm pl-8">{item.budgetHead}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatBDT(item.budgetAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatBDT(item.actualSpent)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-sm ${
                          item.variance >= 0 ? "text-green-600" : "text-destructive"
                        }`}
                      >
                        {item.variance >= 0 ? "" : "-"}{formatBDT(Math.abs(item.variance))}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-sm ${
                          item.variancePercent >= 0 ? "text-green-600" : "text-destructive"
                        }`}
                      >
                        {item.variancePercent >= 0 ? "+" : ""}{formatPercent(item.variancePercent)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min((item.actualSpent / item.budgetAmount) * 100, 100)}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {formatPercent((item.actualSpent / item.budgetAmount) * 100)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                      </TableCell>
                    </TableRow>
                  )),
                  <TableRow key={`subtotal-${category}`} className="border-b-2">
                    <TableCell className="text-sm font-medium pl-8 italic">
                      Subtotal - {category}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {formatBDT(categoryBudget)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {formatBDT(categoryActual)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm font-medium ${
                        categoryVariance >= 0 ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      {categoryVariance >= 0 ? "" : "-"}{formatBDT(Math.abs(categoryVariance))}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm font-medium ${
                        categoryVariancePercent >= 0 ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      {categoryVariancePercent >= 0 ? "+" : ""}{formatPercent(categoryVariancePercent)}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>,
                ];
              })}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell className="font-semibold">Grand Total</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatBDT(totalBudget)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatBDT(totalActual)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono font-semibold ${
                    totalVariance >= 0 ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {totalVariance >= 0 ? "" : "-"}{formatBDT(Math.abs(totalVariance))}
                </TableCell>
                <TableCell
                  className={`text-right font-mono font-semibold ${
                    totalVariance >= 0 ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {totalVariance >= 0 ? "+" : ""}{formatPercent((totalVariance / totalBudget) * 100)}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
