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
import { Download } from "lucide-react";
import { formatBDT, formatDate, formatPercent, formatNumber } from "@/lib/formatters";

interface OverdueLoan {
  loanAccount: string;
  borrower: string;
  samity: string;
  product: string;
  loanAmount: number;
  outstanding: number;
  overdueAmount: number;
  daysOverdue: number;
  lastPaymentDate: string;
  classification: "Watch" | "Substandard" | "Doubtful" | "Bad";
  recoveryAction: string;
  status: "Follow Up" | "Notice Sent" | "Legal" | "Write Off";
}

const overdueLoans: OverdueLoan[] = [
  {
    loanAccount: "LN-2024-089",
    borrower: "Jahanara Begum",
    samity: "Karnaphuli Samity",
    product: "Jagoron",
    loanAmount: 30000,
    outstanding: 18500,
    overdueAmount: 4200,
    daysOverdue: 45,
    lastPaymentDate: "2025-12-25",
    classification: "Watch",
    recoveryAction: "Field visit scheduled",
    status: "Follow Up",
  },
  {
    loanAccount: "LN-2024-112",
    borrower: "Parvin Akter",
    samity: "Sundarbans Samity",
    product: "Krishi",
    loanAmount: 50000,
    outstanding: 38000,
    overdueAmount: 12500,
    daysOverdue: 92,
    lastPaymentDate: "2025-11-08",
    classification: "Substandard",
    recoveryAction: "Guarantor contacted",
    status: "Notice Sent",
  },
  {
    loanAccount: "LN-2024-078",
    borrower: "Salma Khatun",
    samity: "Karnaphuli Samity",
    product: "Griha",
    loanAmount: 150000,
    outstanding: 112000,
    overdueAmount: 28000,
    daysOverdue: 185,
    lastPaymentDate: "2025-08-05",
    classification: "Doubtful",
    recoveryAction: "Legal notice issued",
    status: "Legal",
  },
  {
    loanAccount: "LN-2024-145",
    borrower: "Rashida Begum",
    samity: "Sundarbans Samity",
    product: "Jagoron",
    loanAmount: 25000,
    outstanding: 22000,
    overdueAmount: 8500,
    daysOverdue: 120,
    lastPaymentDate: "2025-10-10",
    classification: "Substandard",
    recoveryAction: "Restructuring proposed",
    status: "Notice Sent",
  },
  {
    loanAccount: "LN-2023-201",
    borrower: "Nazma Akter",
    samity: "Meghna Sanchay Samity",
    product: "Krishi",
    loanAmount: 40000,
    outstanding: 35000,
    overdueAmount: 35000,
    daysOverdue: 380,
    lastPaymentDate: "2025-01-20",
    classification: "Bad",
    recoveryAction: "Write-off recommended",
    status: "Write Off",
  },
  {
    loanAccount: "LN-2025-034",
    borrower: "Kulsum Akter",
    samity: "Padma Unnayan Samity",
    product: "Mousumi",
    loanAmount: 60000,
    outstanding: 42000,
    overdueAmount: 6800,
    daysOverdue: 35,
    lastPaymentDate: "2026-01-03",
    classification: "Watch",
    recoveryAction: "Phone call follow-up",
    status: "Follow Up",
  },
  {
    loanAccount: "LN-2024-167",
    borrower: "Shefali Begum",
    samity: "Teesta Unnayan Dal",
    product: "Jagoron",
    loanAmount: 35000,
    outstanding: 28000,
    overdueAmount: 15000,
    daysOverdue: 150,
    lastPaymentDate: "2025-09-10",
    classification: "Doubtful",
    recoveryAction: "Samity pressure applied",
    status: "Notice Sent",
  },
  {
    loanAccount: "LN-2025-089",
    borrower: "Renu Begum",
    samity: "Jamuna Mohila Dal",
    product: "Apatkalin",
    loanAmount: 10000,
    outstanding: 7500,
    overdueAmount: 3200,
    daysOverdue: 60,
    lastPaymentDate: "2025-12-10",
    classification: "Substandard",
    recoveryAction: "Home visit completed",
    status: "Follow Up",
  },
  {
    loanAccount: "LN-2024-098",
    borrower: "Mosammat Hasina",
    samity: "Karnaphuli Samity",
    product: "Griha",
    loanAmount: 200000,
    outstanding: 165000,
    overdueAmount: 42000,
    daysOverdue: 210,
    lastPaymentDate: "2025-07-12",
    classification: "Doubtful",
    recoveryAction: "Legal proceedings initiated",
    status: "Legal",
  },
  {
    loanAccount: "LN-2025-156",
    borrower: "Tahmina Begum",
    samity: "Surjomukhi Samity",
    product: "Shiksha",
    loanAmount: 20000,
    outstanding: 14000,
    overdueAmount: 2800,
    daysOverdue: 32,
    lastPaymentDate: "2026-01-07",
    classification: "Watch",
    recoveryAction: "SMS reminder sent",
    status: "Follow Up",
  },
];

function getClassificationVariant(classification: string): "default" | "secondary" | "outline" | "destructive" {
  switch (classification) {
    case "Watch": return "outline";
    case "Substandard": return "secondary";
    case "Doubtful": return "default";
    case "Bad": return "destructive";
    default: return "outline";
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Follow Up": return "outline";
    case "Notice Sent": return "secondary";
    case "Legal": return "default";
    case "Write Off": return "destructive";
    default: return "outline";
  }
}

function getDaysOverdueColor(days: number): string {
  if (days <= 30) return "text-orange-500";
  if (days <= 90) return "text-orange-600";
  if (days <= 180) return "text-red-500";
  return "text-destructive font-bold";
}

export default function OverduePage() {
  const totalOverdueLoans = overdueLoans.length;
  const totalOverdueAmount = overdueLoans.reduce((sum, l) => sum + l.overdueAmount, 0);
  const totalOutstanding = overdueLoans.reduce((sum, l) => sum + l.outstanding, 0);
  const par30Loans = overdueLoans.filter((l) => l.daysOverdue > 30);
  const par30Amount = par30Loans.reduce((sum, l) => sum + l.outstanding, 0);
  const totalPortfolioEstimate = 29950000; // estimated from main page totals
  const par30Rate = (par30Amount / totalPortfolioEstimate) * 100;
  const recoveredThisMonth = 8500;
  const recoveryTarget = 50000;
  const recoveryRate = (recoveredThisMonth / recoveryTarget) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overdue Management"
        description="Track and manage overdue loans and recovery"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Overdue Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalOverdueLoans)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Overdue Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatBDT(totalOverdueAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">PAR {">"}30</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(par30Rate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recovery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(recoveryRate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overdue Loan Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan Account</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Samity</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Loan Amount</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Overdue Amount</TableHead>
                <TableHead className="text-right">Days Overdue</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Recovery Action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueLoans.map((loan) => (
                <TableRow key={loan.loanAccount}>
                  <TableCell className="font-mono text-sm">{loan.loanAccount}</TableCell>
                  <TableCell className="font-medium">{loan.borrower}</TableCell>
                  <TableCell>{loan.samity}</TableCell>
                  <TableCell>{loan.product}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(loan.loanAmount)}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(loan.outstanding)}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">{formatBDT(loan.overdueAmount)}</TableCell>
                  <TableCell className={`text-right ${getDaysOverdueColor(loan.daysOverdue)}`}>
                    {loan.daysOverdue}
                  </TableCell>
                  <TableCell>{formatDate(loan.lastPaymentDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getClassificationVariant(loan.classification)}>{loan.classification}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">{loan.recoveryAction}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(loan.status)}>{loan.status}</Badge>
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
