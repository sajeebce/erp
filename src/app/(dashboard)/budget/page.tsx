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
import { formatBDT, formatPercent } from "@/lib/formatters";

interface BudgetItem {
  id: string;
  project: string;
  donor: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  utilization: number;
  status: "On Track" | "Over Budget" | "Under Utilized" | "Critical";
}

const budgetItems: BudgetItem[] = [
  {
    id: "BDG-001",
    project: "WASH Program - Sylhet Division",
    donor: "USAID",
    budgetAmount: 25000000,
    spent: 18750000,
    remaining: 6250000,
    utilization: 75,
    status: "On Track",
  },
  {
    id: "BDG-002",
    project: "Primary Education Enhancement",
    donor: "World Bank",
    budgetAmount: 42000000,
    spent: 38640000,
    remaining: 3360000,
    utilization: 92,
    status: "On Track",
  },
  {
    id: "BDG-003",
    project: "Maternal Health - Chattogram",
    donor: "UNICEF",
    budgetAmount: 18000000,
    spent: 19260000,
    remaining: -1260000,
    utilization: 107,
    status: "Over Budget",
  },
  {
    id: "BDG-004",
    project: "Climate Resilience - Barishal",
    donor: "DFID/FCDO",
    budgetAmount: 35000000,
    spent: 10500000,
    remaining: 24500000,
    utilization: 30,
    status: "Under Utilized",
  },
  {
    id: "BDG-005",
    project: "Microfinance Expansion - Rangpur",
    donor: "SDC",
    budgetAmount: 15000000,
    spent: 12750000,
    remaining: 2250000,
    utilization: 85,
    status: "On Track",
  },
  {
    id: "BDG-006",
    project: "Youth Skills Development",
    donor: "EU",
    budgetAmount: 22000000,
    spent: 20900000,
    remaining: 1100000,
    utilization: 95,
    status: "Critical",
  },
  {
    id: "BDG-007",
    project: "Food Security - Mymensingh",
    donor: "JICA",
    budgetAmount: 28000000,
    spent: 16800000,
    remaining: 11200000,
    utilization: 60,
    status: "On Track",
  },
  {
    id: "BDG-008",
    project: "Admin & Operations",
    donor: "Core Fund",
    budgetAmount: 8000000,
    spent: 7200000,
    remaining: 800000,
    utilization: 90,
    status: "On Track",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "On Track": return "default";
    case "Over Budget": return "destructive";
    case "Under Utilized": return "outline";
    case "Critical": return "destructive";
    default: return "secondary";
  }
}

function getProgressColor(utilization: number): string {
  if (utilization > 100) return "text-destructive";
  if (utilization > 90) return "text-orange-500";
  if (utilization < 40) return "text-yellow-500";
  return "text-primary";
}

export default function BudgetPage() {
  const totalBudget = budgetItems.reduce((sum, item) => sum + item.budgetAmount, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = budgetItems.reduce((sum, item) => sum + item.remaining, 0);
  const overallUtilization = Math.round((totalSpent / totalBudget) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Management"
        description="Monitor and manage project budgets across all programs"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalRemaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(overallUtilization)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead className="text-right">Budget Amount</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="w-[200px]">Utilization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.project}</TableCell>
                  <TableCell>{item.donor}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(item.budgetAmount)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(item.spent)}</TableCell>
                  <TableCell className={`text-right font-mono ${item.remaining < 0 ? "text-destructive" : ""}`}>
                    {formatBDT(item.remaining)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(item.utilization, 100)} className="flex-1" />
                      <span className={`text-sm font-medium w-12 text-right ${getProgressColor(item.utilization)}`}>
                        {formatPercent(item.utilization)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
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
