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
import { formatBDT, formatDate, formatPercent, formatNumber } from "@/lib/formatters";

interface LoanApplication {
  applicationId: string;
  date: string;
  applicantName: string;
  samity: string;
  product: string;
  amountRequested: number;
  purpose: string;
  fieldOfficer: string;
  status: "Submitted" | "Under Review" | "Recommended" | "Approved" | "Rejected" | "Disbursed";
}

const applications: LoanApplication[] = [
  {
    applicationId: "LA-2026-001",
    date: "2026-01-28",
    applicantName: "Fatema Begum",
    samity: "Shapla Mohila Samity",
    product: "Jagoron",
    amountRequested: 30000,
    purpose: "Tailoring business expansion",
    fieldOfficer: "Md. Rafiqul Islam",
    status: "Approved",
  },
  {
    applicationId: "LA-2026-002",
    date: "2026-01-29",
    applicantName: "Rina Akter",
    samity: "Padma Unnayan Samity",
    product: "Krishi",
    amountRequested: 50000,
    purpose: "Boro rice cultivation",
    fieldOfficer: "Kamrul Hasan",
    status: "Disbursed",
  },
  {
    applicationId: "LA-2026-003",
    date: "2026-01-30",
    applicantName: "Halima Khatun",
    samity: "Surjomukhi Samity",
    product: "Shiksha",
    amountRequested: 15000,
    purpose: "Daughter SSC exam preparation",
    fieldOfficer: "Nasima Begum",
    status: "Under Review",
  },
  {
    applicationId: "LA-2026-004",
    date: "2026-02-01",
    applicantName: "Monowara Begum",
    samity: "Meghna Sanchay Samity",
    product: "Griha",
    amountRequested: 150000,
    purpose: "Tin shed house repair",
    fieldOfficer: "Abdul Karim",
    status: "Recommended",
  },
  {
    applicationId: "LA-2026-005",
    date: "2026-02-02",
    applicantName: "Shahida Parveen",
    samity: "Jamuna Mohila Dal",
    product: "Jagoron",
    amountRequested: 25000,
    purpose: "Grocery shop working capital",
    fieldOfficer: "Md. Rafiqul Islam",
    status: "Approved",
  },
  {
    applicationId: "LA-2026-006",
    date: "2026-02-03",
    applicantName: "Nasreen Sultana",
    samity: "Karnaphuli Samity",
    product: "Apatkalin",
    amountRequested: 10000,
    purpose: "Medical emergency - husband hospitalized",
    fieldOfficer: "Faruk Ahmed",
    status: "Approved",
  },
  {
    applicationId: "LA-2026-007",
    date: "2026-02-03",
    applicantName: "Amena Khatun",
    samity: "Teesta Unnayan Dal",
    product: "Mousumi",
    amountRequested: 60000,
    purpose: "Potato cultivation (Rabi season)",
    fieldOfficer: "Kamrul Hasan",
    status: "Under Review",
  },
  {
    applicationId: "LA-2026-008",
    date: "2026-02-04",
    applicantName: "Rekha Rani Das",
    samity: "Shapla Mohila Samity",
    product: "Jagoron",
    amountRequested: 40000,
    purpose: "Poultry farm setup",
    fieldOfficer: "Md. Rafiqul Islam",
    status: "Submitted",
  },
  {
    applicationId: "LA-2026-009",
    date: "2026-02-05",
    applicantName: "Bilkis Begum",
    samity: "Padma Unnayan Samity",
    product: "Krishi",
    amountRequested: 75000,
    purpose: "Fish farming (Pangasius)",
    fieldOfficer: "Kamrul Hasan",
    status: "Rejected",
  },
  {
    applicationId: "LA-2026-010",
    date: "2026-02-06",
    applicantName: "Rokeya Akter",
    samity: "Surjomukhi Samity",
    product: "Jagoron",
    amountRequested: 35000,
    purpose: "Handicraft business startup",
    fieldOfficer: "Nasima Begum",
    status: "Submitted",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Approved": return "default";
    case "Disbursed": return "default";
    case "Recommended": return "secondary";
    case "Under Review": return "secondary";
    case "Submitted": return "outline";
    case "Rejected": return "destructive";
    default: return "outline";
  }
}

export default function LoanApplicationsPage() {
  const totalApplications = applications.length;
  const underReview = applications.filter((a) => a.status === "Under Review" || a.status === "Submitted" || a.status === "Recommended").length;
  const approved = applications.filter((a) => a.status === "Approved" || a.status === "Disbursed").length;
  const rejected = applications.filter((a) => a.status === "Rejected").length;
  const approvalRate = (approved / totalApplications) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Applications"
        description="Process and review loan applications from members"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalApplications)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(underReview)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(approved)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(rejected)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(approvalRate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loan Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Samity</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Amount Requested</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Field Officer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.applicationId}>
                  <TableCell className="font-mono text-sm">{app.applicationId}</TableCell>
                  <TableCell>{formatDate(app.date)}</TableCell>
                  <TableCell className="font-medium">{app.applicantName}</TableCell>
                  <TableCell>{app.samity}</TableCell>
                  <TableCell>{app.product}</TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(app.amountRequested)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{app.purpose}</TableCell>
                  <TableCell>{app.fieldOfficer}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
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
