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
import { Download, Activity, Users, AlertTriangle, BarChart3 } from "lucide-react";

interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: "Create" | "Update" | "Delete" | "Login" | "Logout" | "Approve" | "Reject" | "Export";
  module: string;
  recordId: string;
  description: string;
  ipAddress: string;
  status: "Success" | "Failed";
}

const auditLogs: AuditLogEntry[] = [
  {
    timestamp: "2026-02-02 14:35:22",
    user: "Dr. Nasreen Ahmed",
    action: "Approve",
    module: "Finance",
    recordId: "JV-2026-001",
    description: "Approved journal voucher for depreciation adjustment",
    ipAddress: "103.48.16.45",
    status: "Success",
  },
  {
    timestamp: "2026-02-02 14:20:11",
    user: "Kamal Hossain",
    action: "Create",
    module: "Finance",
    recordId: "DV-2026-004",
    description: "Created debit voucher for Rangpur office rent",
    ipAddress: "103.48.16.50",
    status: "Success",
  },
  {
    timestamp: "2026-02-02 13:55:08",
    user: "Fatima Begum",
    action: "Export",
    module: "Reports",
    recordId: "RPT-FIN-001",
    description: "Exported Trial Balance for January 2026",
    ipAddress: "103.48.16.48",
    status: "Success",
  },
  {
    timestamp: "2026-02-02 13:30:45",
    user: "Rahim Uddin",
    action: "Update",
    module: "HR",
    recordId: "EMP-2026-045",
    description: "Updated employee record - salary revision for Mizanur Rahman",
    ipAddress: "103.48.16.52",
    status: "Success",
  },
  {
    timestamp: "2026-02-02 12:15:33",
    user: "Unknown",
    action: "Login",
    module: "System",
    recordId: "-",
    description: "Failed login attempt with invalid credentials",
    ipAddress: "185.220.101.34",
    status: "Failed",
  },
  {
    timestamp: "2026-02-02 11:50:20",
    user: "Taslima Akter",
    action: "Create",
    module: "Beneficiaries",
    recordId: "BEN-2026-1204",
    description: "Enrolled new beneficiary - Rajshahi district WASH program",
    ipAddress: "103.48.16.55",
    status: "Success",
  },
  {
    timestamp: "2026-02-02 11:22:18",
    user: "Mizanur Rahman",
    action: "Approve",
    module: "Procurement",
    recordId: "PO-2026-018",
    description: "Approved purchase order for office furniture - Sylhet branch",
    ipAddress: "103.48.16.60",
    status: "Success",
  },
  {
    timestamp: "2026-02-02 10:45:02",
    user: "Kamal Hossain",
    action: "Reject",
    module: "Finance",
    recordId: "BV-2026-003",
    description: "Rejected bank voucher - insufficient supporting documents",
    ipAddress: "103.48.16.50",
    status: "Success",
  },
  {
    timestamp: "2026-02-02 10:10:55",
    user: "Fatima Begum",
    action: "Login",
    module: "System",
    recordId: "-",
    description: "User logged in successfully",
    ipAddress: "103.48.16.48",
    status: "Success",
  },
  {
    timestamp: "2026-02-02 09:45:30",
    user: "Dr. Nasreen Ahmed",
    action: "Login",
    module: "System",
    recordId: "-",
    description: "User logged in successfully",
    ipAddress: "103.48.16.45",
    status: "Success",
  },
  {
    timestamp: "2026-02-01 17:30:15",
    user: "Rahim Uddin",
    action: "Logout",
    module: "System",
    recordId: "-",
    description: "User logged out",
    ipAddress: "103.48.16.52",
    status: "Success",
  },
  {
    timestamp: "2026-02-01 16:55:42",
    user: "Kamal Hossain",
    action: "Update",
    module: "Budget",
    recordId: "BUD-2026-003",
    description: "Revised Q3 budget allocation for Climate Resilience project",
    ipAddress: "103.48.16.50",
    status: "Success",
  },
  {
    timestamp: "2026-02-01 15:20:38",
    user: "Taslima Akter",
    action: "Delete",
    module: "Beneficiaries",
    recordId: "BEN-2026-1180",
    description: "Removed duplicate beneficiary record",
    ipAddress: "103.48.16.55",
    status: "Success",
  },
  {
    timestamp: "2026-02-01 14:10:05",
    user: "Unknown",
    action: "Login",
    module: "System",
    recordId: "-",
    description: "Failed login attempt - account locked after 3 attempts",
    ipAddress: "45.134.26.78",
    status: "Failed",
  },
  {
    timestamp: "2026-02-01 13:40:22",
    user: "Mizanur Rahman",
    action: "Create",
    module: "Procurement",
    recordId: "PR-2026-025",
    description: "Created purchase requisition for field equipment",
    ipAddress: "103.48.16.60",
    status: "Success",
  },
  {
    timestamp: "2026-02-01 12:05:18",
    user: "Fatima Begum",
    action: "Approve",
    module: "HR",
    recordId: "LV-2026-089",
    description: "Approved annual leave request for Sharmin Sultana",
    ipAddress: "103.48.16.48",
    status: "Success",
  },
  {
    timestamp: "2026-02-01 11:30:44",
    user: "Kamal Hossain",
    action: "Export",
    module: "Finance",
    recordId: "RPT-GL-001",
    description: "Exported General Ledger to Excel for January 2026",
    ipAddress: "103.48.16.50",
    status: "Success",
  },
  {
    timestamp: "2026-02-01 10:15:33",
    user: "Dr. Nasreen Ahmed",
    action: "Update",
    module: "Projects",
    recordId: "PRJ-2026-005",
    description: "Updated project milestone dates for Girls Education program",
    ipAddress: "103.48.16.45",
    status: "Success",
  },
];

function getActionVariant(action: string): "default" | "secondary" | "outline" | "destructive" {
  switch (action) {
    case "Create": return "default";
    case "Update": return "secondary";
    case "Delete": return "destructive";
    case "Approve": return "default";
    case "Reject": return "destructive";
    case "Login": return "outline";
    case "Logout": return "outline";
    case "Export": return "secondary";
    default: return "outline";
  }
}

function getStatusVariant(status: string): "default" | "destructive" {
  return status === "Success" ? "default" : "destructive";
}

export default function AuditTrailPage() {
  const todayLogs = auditLogs.filter((l) => l.timestamp.startsWith("2026-02-02"));
  const totalActionsToday = todayLogs.length;
  const activeUsers = new Set(auditLogs.filter((l) => l.user !== "Unknown").map((l) => l.user)).size;
  const failedAttempts = auditLogs.filter((l) => l.status === "Failed").length;
  const moduleCounts = auditLogs.reduce((acc, log) => {
    acc[log.module] = (acc[log.module] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostActiveModule = Object.entries(moduleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Track system activities, data changes, and user actions"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Actions Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalActionsToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Users Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{activeUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-2xl font-bold">{failedAttempts}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most Active Module</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">{mostActiveModule}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Record ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log, index) => (
                <TableRow key={`${log.timestamp}-${index}`}>
                  <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                  <TableCell className="text-sm">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline">{log.module}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.recordId}</TableCell>
                  <TableCell className="text-sm max-w-[250px] truncate">
                    {log.description}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ipAddress}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
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
