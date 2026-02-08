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
import { Download, RefreshCw, Landmark, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { formatBDT, formatDate, formatNumber } from "@/lib/formatters";

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNo: string;
  bookBalance: number;
  statementBalance: number;
  difference: number;
  lastReconciledDate: string;
  status: "Reconciled" | "Pending" | "Discrepancy";
  unreconciledItems: number;
}

const bankAccounts: BankAccount[] = [
  {
    id: "BA-001",
    accountName: "Main Operating Account",
    bankName: "Sonali Bank",
    accountNo: "****-****-4521",
    bookBalance: 8500000,
    statementBalance: 8500000,
    difference: 0,
    lastReconciledDate: "2026-01-31",
    status: "Reconciled",
    unreconciledItems: 0,
  },
  {
    id: "BA-002",
    accountName: "USAID Project Account",
    bankName: "BRAC Bank",
    accountNo: "****-****-7832",
    bookBalance: 3850000,
    statementBalance: 3925000,
    difference: -75000,
    lastReconciledDate: "2026-01-25",
    status: "Discrepancy",
    unreconciledItems: 3,
  },
  {
    id: "BA-003",
    accountName: "Savings Account",
    bankName: "Dutch-Bangla Bank",
    accountNo: "****-****-6190",
    bookBalance: 12400000,
    statementBalance: 12400000,
    difference: 0,
    lastReconciledDate: "2026-01-31",
    status: "Reconciled",
    unreconciledItems: 0,
  },
  {
    id: "BA-004",
    accountName: "Donor Fund Account (USD)",
    bankName: "Standard Chartered",
    accountNo: "****-****-3045",
    bookBalance: 22500000,
    statementBalance: 22650000,
    difference: -150000,
    lastReconciledDate: "2026-01-20",
    status: "Pending",
    unreconciledItems: 5,
  },
  {
    id: "BA-005",
    accountName: "Microfinance Operations Account",
    bankName: "Sonali Bank",
    accountNo: "****-****-8877",
    bookBalance: 5600000,
    statementBalance: 5580000,
    difference: 20000,
    lastReconciledDate: "2026-01-28",
    status: "Discrepancy",
    unreconciledItems: 2,
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Reconciled": return "default";
    case "Pending": return "outline";
    case "Discrepancy": return "destructive";
    default: return "secondary";
  }
}

export default function BankReconciliationPage() {
  const totalBookBalance = bankAccounts.reduce((sum, a) => sum + a.bookBalance, 0);
  const totalStatementBalance = bankAccounts.reduce((sum, a) => sum + a.statementBalance, 0);
  const totalUnreconciled = bankAccounts.reduce((sum, a) => sum + a.unreconciledItems, 0);
  const lastReconciliation = bankAccounts
    .map((a) => a.lastReconciledDate)
    .sort()
    .reverse()[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Reconciliation"
        description="Reconcile bank statements with your book records"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Start Reconciliation
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Book Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatBDT(totalBookBalance)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Statement Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalStatementBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unreconciled Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">{totalUnreconciled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Reconciliation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatDate(lastReconciliation)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bank Account Reconciliation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Account No</TableHead>
                <TableHead className="text-right">Book Balance</TableHead>
                <TableHead className="text-right">Statement Balance</TableHead>
                <TableHead className="text-right">Difference</TableHead>
                <TableHead>Last Reconciled</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="text-sm font-medium">{account.accountName}</TableCell>
                  <TableCell className="text-sm">{account.bankName}</TableCell>
                  <TableCell className="font-mono text-sm">{account.accountNo}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatBDT(account.bookBalance)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatBDT(account.statementBalance)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-sm ${
                      account.difference !== 0 ? "text-destructive" : "text-green-600"
                    }`}
                  >
                    {formatBDT(account.difference)}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(account.lastReconciledDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(account.status)}>{account.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={3} className="text-right font-semibold">
                  Totals
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatBDT(totalBookBalance)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatBDT(totalStatementBalance)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono font-semibold ${
                    totalBookBalance !== totalStatementBalance ? "text-destructive" : "text-green-600"
                  }`}
                >
                  {formatBDT(totalBookBalance - totalStatementBalance)}
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
