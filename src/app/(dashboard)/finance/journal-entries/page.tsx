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
import { Plus, Download, BookOpen, Clock, CheckCircle, FileText } from "lucide-react";
import { formatBDT, formatDate } from "@/lib/formatters";

interface JournalEntry {
  entryNo: string;
  date: string;
  description: string;
  account: string;
  project: string;
  debit: number;
  credit: number;
  status: "Posted" | "Draft" | "Pending Review";
}

const journalEntries: JournalEntry[] = [
  {
    entryNo: "JV-2026-001",
    date: "2026-01-05",
    description: "Grant Receipt from USAID",
    account: "3100 - Grant Income USAID",
    project: "WASH Program - Sylhet",
    debit: 0,
    credit: 15000000,
    status: "Posted",
  },
  {
    entryNo: "JV-2026-002",
    date: "2026-01-10",
    description: "Salary Payment Jan 2026",
    account: "4200 - Staff Salaries & Benefits",
    project: "General Admin",
    debit: 3250000,
    credit: 0,
    status: "Posted",
  },
  {
    entryNo: "JV-2026-003",
    date: "2026-01-12",
    description: "Office Rent Payment - Head Office",
    account: "4300 - Office & Admin Expenses",
    project: "General Admin",
    debit: 180000,
    credit: 0,
    status: "Posted",
  },
  {
    entryNo: "JV-2026-004",
    date: "2026-01-15",
    description: "Equipment Purchase - Laptops",
    account: "1300 - Fixed Assets",
    project: "Primary Education Enhancement",
    debit: 450000,
    credit: 0,
    status: "Posted",
  },
  {
    entryNo: "JV-2026-005",
    date: "2026-01-18",
    description: "Training Workshop Expense - Chattogram",
    account: "4100 - Program Expenses",
    project: "Maternal Health - Chattogram",
    debit: 320000,
    credit: 0,
    status: "Pending Review",
  },
  {
    entryNo: "JV-2026-006",
    date: "2026-01-20",
    description: "Donor Fund Transfer - World Bank",
    account: "3200 - Grant Income World Bank",
    project: "Climate Resilience - Barishal",
    debit: 0,
    credit: 8500000,
    status: "Posted",
  },
  {
    entryNo: "JV-2026-007",
    date: "2026-01-25",
    description: "Depreciation Entry - Q4 2025",
    account: "4300 - Depreciation Expense",
    project: "General Admin",
    debit: 875000,
    credit: 0,
    status: "Draft",
  },
  {
    entryNo: "JV-2026-008",
    date: "2026-01-28",
    description: "Vehicle Fuel Expense - Field Offices",
    account: "4400 - Travel & Transportation",
    project: "WASH Program - Sylhet",
    debit: 95000,
    credit: 0,
    status: "Pending Review",
  },
  {
    entryNo: "JV-2026-009",
    date: "2026-01-30",
    description: "Beneficiary Cash Transfer - Rangpur",
    account: "4100 - Program Expenses",
    project: "Microfinance Expansion - Rangpur",
    debit: 2200000,
    credit: 0,
    status: "Posted",
  },
  {
    entryNo: "JV-2026-010",
    date: "2026-02-01",
    description: "UNICEF Fund Receipt - Maternal Health",
    account: "3300 - Grant Income UNICEF",
    project: "Maternal Health - Chattogram",
    debit: 0,
    credit: 5000000,
    status: "Pending Review",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Posted": return "default";
    case "Draft": return "secondary";
    case "Pending Review": return "outline";
    default: return "secondary";
  }
}

export default function JournalEntriesPage() {
  const totalEntries = journalEntries.length;
  const totalDebits = journalEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredits = journalEntries.reduce((sum, e) => sum + e.credit, 0);
  const pendingReview = journalEntries.filter((e) => e.status === "Pending Review").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal Entries"
        description="Create and manage journal entries for financial transactions"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalEntries}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalDebits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalCredits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">{pendingReview}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal Entry Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Entry No</TableHead>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map((entry) => (
                <TableRow key={entry.entryNo}>
                  <TableCell className="font-mono text-sm">{entry.entryNo}</TableCell>
                  <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                  <TableCell className="text-sm font-medium">{entry.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.account}</TableCell>
                  <TableCell className="text-sm">{entry.project}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {entry.debit > 0 ? formatBDT(entry.debit) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {entry.credit > 0 ? formatBDT(entry.credit) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(entry.status)}>{entry.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={5} className="text-right font-semibold">
                  Totals
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatBDT(totalDebits)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatBDT(totalCredits)}
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
