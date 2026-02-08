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
import { formatDate } from "@/lib/formatters";

interface LeaveRequest {
  leaveId: string;
  employee: string;
  leaveType: "Annual" | "Casual" | "Sick" | "Maternity" | "Paternity" | "Without Pay";
  startDate: string;
  endDate: string;
  days: number;
  appliedOn: string;
  status: "Approved" | "Pending" | "Rejected" | "Cancelled";
}

const leaveRequests: LeaveRequest[] = [
  {
    leaveId: "LV-2026-001",
    employee: "Kamal Hossain",
    leaveType: "Sick",
    startDate: "2026-02-01",
    endDate: "2026-02-05",
    days: 5,
    appliedOn: "2026-02-01",
    status: "Approved",
  },
  {
    leaveId: "LV-2026-002",
    employee: "Md. Rafiqul Islam",
    leaveType: "Annual",
    startDate: "2026-02-10",
    endDate: "2026-02-11",
    days: 2,
    appliedOn: "2026-01-28",
    status: "Approved",
  },
  {
    leaveId: "LV-2026-003",
    employee: "Shahin Ahmed",
    leaveType: "Casual",
    startDate: "2026-02-06",
    endDate: "2026-02-07",
    days: 2,
    appliedOn: "2026-02-04",
    status: "Approved",
  },
  {
    leaveId: "LV-2026-004",
    employee: "Fatima Akter Ruma",
    leaveType: "Annual",
    startDate: "2026-02-20",
    endDate: "2026-02-20",
    days: 1,
    appliedOn: "2026-02-05",
    status: "Pending",
  },
  {
    leaveId: "LV-2026-005",
    employee: "Nusrat Jahan",
    leaveType: "Casual",
    startDate: "2026-02-14",
    endDate: "2026-02-14",
    days: 1,
    appliedOn: "2026-02-06",
    status: "Pending",
  },
  {
    leaveId: "LV-2026-006",
    employee: "Rubina Yasmin",
    leaveType: "Maternity",
    startDate: "2026-03-01",
    endDate: "2026-06-28",
    days: 120,
    appliedOn: "2026-01-15",
    status: "Approved",
  },
  {
    leaveId: "LV-2026-007",
    employee: "Md. Sohel Rana",
    leaveType: "Annual",
    startDate: "2026-02-15",
    endDate: "2026-02-16",
    days: 2,
    appliedOn: "2026-02-03",
    status: "Rejected",
  },
  {
    leaveId: "LV-2026-008",
    employee: "Tanvir Ahmed Khan",
    leaveType: "Casual",
    startDate: "2026-02-08",
    endDate: "2026-02-08",
    days: 1,
    appliedOn: "2026-02-07",
    status: "Approved",
  },
  {
    leaveId: "LV-2026-009",
    employee: "Sharmin Akhter",
    leaveType: "Sick",
    startDate: "2026-02-03",
    endDate: "2026-02-03",
    days: 1,
    appliedOn: "2026-02-03",
    status: "Approved",
  },
  {
    leaveId: "LV-2026-010",
    employee: "Dr. Aminul Haque",
    leaveType: "Annual",
    startDate: "2026-02-25",
    endDate: "2026-02-25",
    days: 1,
    appliedOn: "2026-02-08",
    status: "Pending",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Approved": return "default";
    case "Pending": return "secondary";
    case "Rejected": return "destructive";
    case "Cancelled": return "outline";
    default: return "outline";
  }
}

function getLeaveTypeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "Annual": return "default";
    case "Casual": return "secondary";
    case "Sick": return "destructive";
    case "Maternity": return "outline";
    case "Paternity": return "outline";
    case "Without Pay": return "outline";
    default: return "outline";
  }
}

export default function LeavePage() {
  const totalRequests = leaveRequests.length;
  const approved = leaveRequests.filter((l) => l.status === "Approved").length;
  const pending = leaveRequests.filter((l) => l.status === "Pending").length;
  const totalDaysUsed = leaveRequests
    .filter((l) => l.status === "Approved")
    .reduce((sum, l) => sum + l.days, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Manage leave applications, balances, and approvals"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Apply Leave
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRequests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Days Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalDaysUsed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Annual Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">15 days</p>
            <p className="text-xs text-muted-foreground">per employee/year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Casual Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">10 days</p>
            <p className="text-xs text-muted-foreground">per employee/year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Sick Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">14 days</p>
            <p className="text-xs text-muted-foreground">per employee/year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Maternity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">120 days</p>
            <p className="text-xs text-muted-foreground">as per BD Labor Law</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Paternity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">10 days</p>
            <p className="text-xs text-muted-foreground">per occurrence</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Without Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">As needed</p>
            <p className="text-xs text-muted-foreground">requires approval</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave ID</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((leave) => (
                <TableRow key={leave.leaveId}>
                  <TableCell className="font-mono text-sm">{leave.leaveId}</TableCell>
                  <TableCell className="font-medium">{leave.employee}</TableCell>
                  <TableCell>
                    <Badge variant={getLeaveTypeVariant(leave.leaveType)}>{leave.leaveType}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(leave.startDate)}</TableCell>
                  <TableCell>{formatDate(leave.endDate)}</TableCell>
                  <TableCell className="text-right font-mono">{leave.days}</TableCell>
                  <TableCell>{formatDate(leave.appliedOn)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(leave.status)}>{leave.status}</Badge>
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
