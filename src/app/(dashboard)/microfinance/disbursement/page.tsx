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
import { formatBDT, formatDate, formatNumber } from "@/lib/formatters";

interface Disbursement {
  disbursementId: string;
  date: string;
  loanAccount: string;
  borrower: string;
  product: string;
  disbursedAmount: number;
  mode: "Cash" | "Bank" | "Mobile";
  branch: string;
  disbursedBy: string;
  status: "Scheduled" | "Disbursed" | "On Hold" | "Cancelled";
}

const disbursements: Disbursement[] = [
  {
    disbursementId: "DIS-2026-001",
    date: "2026-01-20",
    loanAccount: "LN-2026-001",
    borrower: "Fatema Begum",
    product: "Jagoron",
    disbursedAmount: 30000,
    mode: "Cash",
    branch: "Dhanmondi, Dhaka",
    disbursedBy: "Md. Rafiqul Islam",
    status: "Disbursed",
  },
  {
    disbursementId: "DIS-2026-002",
    date: "2026-01-22",
    loanAccount: "LN-2026-002",
    borrower: "Rina Akter",
    product: "Krishi",
    disbursedAmount: 50000,
    mode: "Bank",
    branch: "Rajshahi Sadar",
    disbursedBy: "Kamrul Hasan",
    status: "Disbursed",
  },
  {
    disbursementId: "DIS-2026-003",
    date: "2026-01-25",
    loanAccount: "LN-2026-003",
    borrower: "Shahida Parveen",
    product: "Jagoron",
    disbursedAmount: 25000,
    mode: "Mobile",
    branch: "Bogra Sadar",
    disbursedBy: "Md. Rafiqul Islam",
    status: "Disbursed",
  },
  {
    disbursementId: "DIS-2026-004",
    date: "2026-01-28",
    loanAccount: "LN-2026-004",
    borrower: "Nasreen Sultana",
    product: "Apatkalin",
    disbursedAmount: 10000,
    mode: "Cash",
    branch: "Chattogram Sadar",
    disbursedBy: "Faruk Ahmed",
    status: "Disbursed",
  },
  {
    disbursementId: "DIS-2026-005",
    date: "2026-02-01",
    loanAccount: "LN-2026-005",
    borrower: "Monowara Begum",
    product: "Griha",
    disbursedAmount: 150000,
    mode: "Bank",
    branch: "Comilla Sadar",
    disbursedBy: "Abdul Karim",
    status: "Disbursed",
  },
  {
    disbursementId: "DIS-2026-006",
    date: "2026-02-05",
    loanAccount: "LN-2026-006",
    borrower: "Amena Khatun",
    product: "Mousumi",
    disbursedAmount: 60000,
    mode: "Bank",
    branch: "Rangpur Sadar",
    disbursedBy: "Kamrul Hasan",
    status: "Scheduled",
  },
  {
    disbursementId: "DIS-2026-007",
    date: "2026-02-06",
    loanAccount: "LN-2026-007",
    borrower: "Rekha Rani Das",
    product: "Jagoron",
    disbursedAmount: 40000,
    mode: "Cash",
    branch: "Dhanmondi, Dhaka",
    disbursedBy: "Md. Rafiqul Islam",
    status: "Scheduled",
  },
  {
    disbursementId: "DIS-2026-008",
    date: "2026-02-07",
    loanAccount: "LN-2026-008",
    borrower: "Rokeya Akter",
    product: "Jagoron",
    disbursedAmount: 35000,
    mode: "Mobile",
    branch: "Sylhet Sadar",
    disbursedBy: "Nasima Begum",
    status: "Scheduled",
  },
  {
    disbursementId: "DIS-2026-009",
    date: "2026-02-03",
    loanAccount: "LN-2026-009",
    borrower: "Kulsum Begum",
    product: "Krishi",
    disbursedAmount: 80000,
    mode: "Bank",
    branch: "Rajshahi Sadar",
    disbursedBy: "Kamrul Hasan",
    status: "On Hold",
  },
  {
    disbursementId: "DIS-2026-010",
    date: "2026-01-15",
    loanAccount: "LN-2026-010",
    borrower: "Jorina Begum",
    product: "Shiksha",
    disbursedAmount: 20000,
    mode: "Cash",
    branch: "Khulna Sadar",
    disbursedBy: "Taslima Akter",
    status: "Cancelled",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Disbursed": return "default";
    case "Scheduled": return "secondary";
    case "On Hold": return "outline";
    case "Cancelled": return "destructive";
    default: return "outline";
  }
}

function getModeVariant(mode: string): "default" | "secondary" | "outline" {
  switch (mode) {
    case "Cash": return "outline";
    case "Bank": return "default";
    case "Mobile": return "secondary";
    default: return "outline";
  }
}

export default function DisbursementPage() {
  const disbursedEntries = disbursements.filter((d) => d.status === "Disbursed");
  const thisMonthDisbursed = disbursedEntries
    .filter((d) => d.date.startsWith("2026-02"))
    .reduce((sum, d) => sum + d.disbursedAmount, 0);
  const thisYearDisbursed = disbursedEntries.reduce((sum, d) => sum + d.disbursedAmount, 0);
  const pending = disbursements.filter((d) => d.status === "Scheduled" || d.status === "On Hold").length;
  const disbursementCount = disbursedEntries.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Disbursement"
        description="Process loan disbursements to approved applicants"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Disbursement
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disbursed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(thisMonthDisbursed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total This Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(thisYearDisbursed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disbursement Count</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(disbursementCount)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disbursement Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disbursement ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Loan Account</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Disbursed Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Disbursed By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disbursements.map((dis) => (
                <TableRow key={dis.disbursementId}>
                  <TableCell className="font-mono text-sm">{dis.disbursementId}</TableCell>
                  <TableCell>{formatDate(dis.date)}</TableCell>
                  <TableCell className="font-mono text-sm">{dis.loanAccount}</TableCell>
                  <TableCell className="font-medium">{dis.borrower}</TableCell>
                  <TableCell>{dis.product}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(dis.disbursedAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={getModeVariant(dis.mode)}>{dis.mode}</Badge>
                  </TableCell>
                  <TableCell>{dis.branch}</TableCell>
                  <TableCell>{dis.disbursedBy}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(dis.status)}>{dis.status}</Badge>
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
