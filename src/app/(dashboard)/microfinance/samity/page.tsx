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

interface Samity {
  id: string;
  name: string;
  branch: string;
  formationDate: string;
  meetingDay: string;
  meetingTime: string;
  totalMembers: number;
  activeLoans: number;
  totalSavings: number;
  outstandingLoan: number;
  fieldOfficer: string;
  status: "Active" | "Inactive" | "Suspended" | "New";
}

const samities: Samity[] = [
  {
    id: "SMT-001",
    name: "Shapla Mohila Samity",
    branch: "Sylhet Sadar",
    formationDate: "2018-03-15",
    meetingDay: "Saturday",
    meetingTime: "9:00 AM",
    totalMembers: 35,
    activeLoans: 28,
    totalSavings: 875000,
    outstandingLoan: 1120000,
    fieldOfficer: "Md. Rafiqul Islam",
    status: "Active",
  },
  {
    id: "SMT-002",
    name: "Padma Unnayan Samity",
    branch: "Sylhet Sadar",
    formationDate: "2019-06-10",
    meetingDay: "Sunday",
    meetingTime: "10:00 AM",
    totalMembers: 30,
    activeLoans: 24,
    totalSavings: 720000,
    outstandingLoan: 960000,
    fieldOfficer: "Kamrul Hasan",
    status: "Active",
  },
  {
    id: "SMT-003",
    name: "Surjomukhi Samity",
    branch: "Moulvibazar",
    formationDate: "2020-01-20",
    meetingDay: "Monday",
    meetingTime: "9:30 AM",
    totalMembers: 28,
    activeLoans: 22,
    totalSavings: 580000,
    outstandingLoan: 780000,
    fieldOfficer: "Nasima Begum",
    status: "Active",
  },
  {
    id: "SMT-004",
    name: "Meghna Sanchay Samity",
    branch: "Habiganj",
    formationDate: "2017-09-05",
    meetingDay: "Tuesday",
    meetingTime: "10:00 AM",
    totalMembers: 40,
    activeLoans: 32,
    totalSavings: 1250000,
    outstandingLoan: 1650000,
    fieldOfficer: "Abdul Karim",
    status: "Active",
  },
  {
    id: "SMT-005",
    name: "Jamuna Mohila Dal",
    branch: "Sunamganj",
    formationDate: "2021-04-12",
    meetingDay: "Wednesday",
    meetingTime: "9:00 AM",
    totalMembers: 25,
    activeLoans: 18,
    totalSavings: 420000,
    outstandingLoan: 540000,
    fieldOfficer: "Md. Rafiqul Islam",
    status: "Active",
  },
  {
    id: "SMT-006",
    name: "Karnaphuli Samity",
    branch: "Moulvibazar",
    formationDate: "2019-11-08",
    meetingDay: "Thursday",
    meetingTime: "10:30 AM",
    totalMembers: 32,
    activeLoans: 26,
    totalSavings: 680000,
    outstandingLoan: 850000,
    fieldOfficer: "Faruk Ahmed",
    status: "Active",
  },
  {
    id: "SMT-007",
    name: "Teesta Unnayan Dal",
    branch: "Sunamganj",
    formationDate: "2022-02-15",
    meetingDay: "Saturday",
    meetingTime: "10:00 AM",
    totalMembers: 22,
    activeLoans: 15,
    totalSavings: 310000,
    outstandingLoan: 380000,
    fieldOfficer: "Kamrul Hasan",
    status: "Active",
  },
  {
    id: "SMT-008",
    name: "Ruposhi Bangla Samity",
    branch: "Habiganj",
    formationDate: "2023-07-20",
    meetingDay: "Sunday",
    meetingTime: "9:00 AM",
    totalMembers: 20,
    activeLoans: 12,
    totalSavings: 180000,
    outstandingLoan: 250000,
    fieldOfficer: "Abdul Karim",
    status: "New",
  },
  {
    id: "SMT-009",
    name: "Mohanonda Mohila Samity",
    branch: "Sylhet Sadar",
    formationDate: "2016-05-10",
    meetingDay: "Monday",
    meetingTime: "9:30 AM",
    totalMembers: 15,
    activeLoans: 0,
    totalSavings: 950000,
    outstandingLoan: 0,
    fieldOfficer: "Nasima Begum",
    status: "Inactive",
  },
  {
    id: "SMT-010",
    name: "Chottogram Unnayan Dal",
    branch: "Moulvibazar",
    formationDate: "2020-08-25",
    meetingDay: "Wednesday",
    meetingTime: "10:00 AM",
    totalMembers: 18,
    activeLoans: 0,
    totalSavings: 290000,
    outstandingLoan: 120000,
    fieldOfficer: "Faruk Ahmed",
    status: "Suspended",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Active": return "default";
    case "New": return "secondary";
    case "Inactive": return "outline";
    case "Suspended": return "destructive";
    default: return "outline";
  }
}

export default function SamityManagementPage() {
  const totalSamities = samities.length;
  const activeSamities = samities.filter((s) => s.status === "Active" || s.status === "New").length;
  const totalMembers = samities.reduce((sum, s) => sum + s.totalMembers, 0);
  const totalSavingsPortfolio = samities.reduce((sum, s) => sum + s.totalSavings, 0);
  const totalOutstandingLoans = samities.reduce((sum, s) => sum + s.outstandingLoan, 0);
  const totalActiveLoans = samities.reduce((sum, s) => sum + s.activeLoans, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Samity / Group Management"
        description="Manage microfinance groups (Samity), members, and meeting schedules"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Samity
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Samities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSamities}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{activeSamities}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalMembers)}</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalSavingsPortfolio)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(totalOutstandingLoans)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Samity Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Samity ID</TableHead>
                <TableHead>Samity Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Formation Date</TableHead>
                <TableHead>Meeting</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-center">Active Loans</TableHead>
                <TableHead className="text-right">Total Savings</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Field Officer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samities.map((samity) => (
                <TableRow key={samity.id}>
                  <TableCell className="font-mono text-sm">{samity.id}</TableCell>
                  <TableCell className="font-medium">{samity.name}</TableCell>
                  <TableCell className="text-sm">{samity.branch}</TableCell>
                  <TableCell>{formatDate(samity.formationDate)}</TableCell>
                  <TableCell className="text-sm">
                    <div>{samity.meetingDay}</div>
                    <div className="text-xs text-muted-foreground">{samity.meetingTime}</div>
                  </TableCell>
                  <TableCell className="text-center font-mono">{samity.totalMembers}</TableCell>
                  <TableCell className="text-center font-mono">{samity.activeLoans}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatBDT(samity.totalSavings)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatBDT(samity.outstandingLoan)}</TableCell>
                  <TableCell className="text-sm">{samity.fieldOfficer}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(samity.status)}>{samity.status}</Badge>
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
