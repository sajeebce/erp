import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  FileText,
  UserPlus,
  CreditCard,
  AlertCircle,
  Settings,
  Upload,
  Edit,
  LogIn,
  LogOut,
  ShieldCheck,
  Ban,
  RefreshCw,
  Clock,
  Filter,
  Users,
  Wallet,
  FolderOpen,
  Activity,
} from "lucide-react";

interface ActivityEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  details: string;
  module: string;
  type: "approval" | "create" | "update" | "delete" | "login" | "system" | "finance" | "upload";
  status?: "success" | "warning" | "error";
}

interface LoginActivity {
  id: string;
  user: string;
  role: string;
  loginTime: string;
  logoutTime: string | null;
  ipAddress: string;
  device: string;
  status: "Active" | "Expired" | "Logged Out";
}

const activities: ActivityEntry[] = [
  { id: "ACT-001", timestamp: "2026-02-08 14:35:22", user: "Dr. Nasreen Ahmed", userRole: "Executive Director", action: "Approved Voucher", details: "DV-2026-488 - Staff salary disbursement (৳28,50,000)", module: "Finance", type: "approval", status: "success" },
  { id: "ACT-002", timestamp: "2026-02-08 14:20:10", user: "Kamal Hossain", userRole: "Finance Manager", action: "Submitted Voucher", details: "DV-2026-488 submitted for ED approval", module: "Finance", type: "finance" },
  { id: "ACT-003", timestamp: "2026-02-08 13:45:00", user: "Fatima Rahman", userRole: "Program Manager", action: "Updated Project", details: "Clean Water - Sylhet milestone 4 marked as complete (78% overall)", module: "Projects", type: "update", status: "success" },
  { id: "ACT-004", timestamp: "2026-02-08 12:30:15", user: "Sayeed Khan", userRole: "Procurement Officer", action: "Created PO", details: "PO-2026-079 - Office supplies for Chattogram office (৳1,25,000)", module: "Procurement", type: "create" },
  { id: "ACT-005", timestamp: "2026-02-08 11:15:33", user: "Roksana Begum", userRole: "M&E Coordinator", action: "Uploaded Report", details: "Q2 Monitoring Report - Healthcare project (Cox's Bazar)", module: "Reports", type: "upload" },
  { id: "ACT-006", timestamp: "2026-02-08 10:45:00", user: "Mizanur Rahman", userRole: "HR Manager", action: "Payroll Processing", details: "January 2026 payroll initiated for 285 employees", module: "HR", type: "finance" },
  { id: "ACT-007", timestamp: "2026-02-08 10:00:22", user: "Tanvir Hasan", userRole: "IT Admin", action: "System Update", details: "Finance module updated to v3.2.1 - bug fixes and performance", module: "System", type: "system" },
  { id: "ACT-008", timestamp: "2026-02-08 09:30:00", user: "Nusrat Jahan", userRole: "Communications", action: "Updated Beneficiary", details: "Beneficiary registry updated - 45 new enrollments (Sylhet program)", module: "Beneficiaries", type: "update" },
  { id: "ACT-009", timestamp: "2026-02-07 17:30:00", user: "Dr. Nasreen Ahmed", userRole: "Executive Director", action: "Rejected Requisition", details: "PR-2026-146 - Vehicle purchase rejected (budget exceeded)", module: "Procurement", type: "approval", status: "error" },
  { id: "ACT-010", timestamp: "2026-02-07 16:45:22", user: "Aminul Hoque", userRole: "MFI Manager", action: "Loan Disbursement", details: "12 loans disbursed in Samity #45, Kurigram (৳4,80,000 total)", module: "Microfinance", type: "finance" },
  { id: "ACT-011", timestamp: "2026-02-07 15:20:00", user: "Shafiqul Islam", userRole: "Internal Auditor", action: "Audit Review", details: "Finance audit Q1 review completed - 3 observations raised", module: "Audit", type: "approval", status: "warning" },
  { id: "ACT-012", timestamp: "2026-02-07 14:10:00", user: "Kamal Hossain", userRole: "Finance Manager", action: "Bank Reconciliation", details: "DBBL Mohakhali A/C reconciled for January 2026 - matched", module: "Finance", type: "finance", status: "success" },
  { id: "ACT-013", timestamp: "2026-02-07 11:30:00", user: "Fatima Rahman", userRole: "Program Manager", action: "Created Activity", details: "New activity planned: Community Health Camp - Cox's Bazar (March 2026)", module: "Projects", type: "create" },
  { id: "ACT-014", timestamp: "2026-02-07 10:00:00", user: "System", userRole: "Automated", action: "Auto Backup", details: "Incremental backup completed - BKP-2026-046 (720 MB)", module: "System", type: "system", status: "success" },
  { id: "ACT-015", timestamp: "2026-02-06 16:00:00", user: "Sharmin Akhter", userRole: "Regional Coordinator", action: "Submitted Report", details: "Rangpur regional monthly report for January 2026", module: "Reports", type: "upload" },
  { id: "ACT-016", timestamp: "2026-02-06 14:30:00", user: "Mahfuzur Rahman", userRole: "Regional Manager", action: "Asset Transfer", details: "Laptop (AST-2024-089) transferred from Chattogram to Cox's Bazar office", module: "Assets", type: "update" },
  { id: "ACT-017", timestamp: "2026-02-06 11:00:00", user: "Mizanur Rahman", userRole: "HR Manager", action: "New Employee", details: "Onboarding completed: Rashida Khatun (Community Health Worker, Cox's Bazar)", module: "HR", type: "create" },
  { id: "ACT-018", timestamp: "2026-02-06 09:00:00", user: "Kamal Hossain", userRole: "Finance Manager", action: "Fund Receipt", details: "USAID Q1 fund received - ৳50,00,000 credited to DBBL account", module: "Finance", type: "finance", status: "success" },
  { id: "ACT-019", timestamp: "2026-02-05 15:30:00", user: "Dr. Nasreen Ahmed", userRole: "Executive Director", action: "Approved Budget", details: "Healthcare - Cox's Bazar revised budget approved (৳22,00,000)", module: "Budget", type: "approval", status: "success" },
  { id: "ACT-020", timestamp: "2026-02-05 10:00:00", user: "Tanvir Hasan", userRole: "IT Admin", action: "User Created", details: "New user account: hasina.begum@bdf.org.bd (Field Officer, Satkhira)", module: "System", type: "create" },
];

const loginActivities: LoginActivity[] = [
  { id: "SES-001", user: "Dr. Nasreen Ahmed", role: "Executive Director", loginTime: "2026-02-08 09:00", logoutTime: null, ipAddress: "103.48.16.xx", device: "Chrome / Windows", status: "Active" },
  { id: "SES-002", user: "Kamal Hossain", role: "Finance Manager", loginTime: "2026-02-08 08:45", logoutTime: null, ipAddress: "103.48.16.xx", device: "Firefox / Windows", status: "Active" },
  { id: "SES-003", user: "Fatima Rahman", role: "Program Manager", loginTime: "2026-02-08 09:15", logoutTime: null, ipAddress: "103.48.16.xx", device: "Chrome / MacOS", status: "Active" },
  { id: "SES-004", user: "Tanvir Hasan", role: "IT Admin", loginTime: "2026-02-08 08:30", logoutTime: null, ipAddress: "103.48.16.xx", device: "Chrome / Linux", status: "Active" },
  { id: "SES-005", user: "Aminul Hoque", role: "MFI Manager", loginTime: "2026-02-08 10:00", logoutTime: "2026-02-08 13:30", ipAddress: "103.220.xx.xx", device: "Chrome / Android", status: "Logged Out" },
  { id: "SES-006", user: "Mizanur Rahman", role: "HR Manager", loginTime: "2026-02-08 09:30", logoutTime: null, ipAddress: "103.48.16.xx", device: "Edge / Windows", status: "Active" },
  { id: "SES-007", user: "Roksana Begum", role: "M&E Coordinator", loginTime: "2026-02-07 14:00", logoutTime: "2026-02-07 18:30", ipAddress: "103.48.16.xx", device: "Chrome / Windows", status: "Logged Out" },
  { id: "SES-008", user: "Sayeed Khan", role: "Procurement Officer", loginTime: "2026-02-07 09:00", logoutTime: null, ipAddress: "103.48.16.xx", device: "Chrome / Windows", status: "Expired" },
];

function getActivityIcon(type: string) {
  switch (type) {
    case "approval": return <CheckCircle className="h-4 w-4" />;
    case "create": return <FileText className="h-4 w-4" />;
    case "update": return <Edit className="h-4 w-4" />;
    case "delete": return <Ban className="h-4 w-4" />;
    case "login": return <LogIn className="h-4 w-4" />;
    case "system": return <Settings className="h-4 w-4" />;
    case "finance": return <CreditCard className="h-4 w-4" />;
    case "upload": return <Upload className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
}

function getActivityIconBg(type: string): string {
  switch (type) {
    case "approval": return "bg-emerald-500/10 text-emerald-600";
    case "create": return "bg-blue-500/10 text-blue-600";
    case "update": return "bg-amber-500/10 text-amber-600";
    case "delete": return "bg-red-500/10 text-red-600";
    case "login": return "bg-purple-500/10 text-purple-600";
    case "system": return "bg-slate-500/10 text-slate-600";
    case "finance": return "bg-teal-500/10 text-teal-600";
    case "upload": return "bg-indigo-500/10 text-indigo-600";
    default: return "bg-primary/10 text-primary";
  }
}

function getModuleBadgeVariant(module: string): "default" | "secondary" | "outline" {
  switch (module) {
    case "Finance": return "default";
    case "Projects": return "secondary";
    case "System": return "outline";
    default: return "secondary";
  }
}

function getSessionStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Active": return "default";
    case "Logged Out": return "secondary";
    case "Expired": return "outline";
    default: return "secondary";
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date("2026-02-08T15:00:00");
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default async function ActivityFeedPage() {
  const t = await getTranslations('dashboard');
  const todayActivities = activities.filter((a) => a.timestamp.startsWith("2026-02-08")).length;
  const approvalCount = activities.filter((a) => a.type === "approval").length;
  const activeSessions = loginActivities.filter((s) => s.status === "Active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('activityFeed.title')}
        description={t('activityFeed.description')}
      >
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          {t('activityFeed.filterActivities')}
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('activityFeed.todaysActivities')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{todayActivities}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('activityFeed.actionsRecordedToday')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('activityFeed.approvals')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <p className="text-2xl font-bold">{approvalCount}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('activityFeed.approvalActionsThisWeek')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('activityFeed.activeSessions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <p className="text-2xl font-bold">{activeSessions}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('activityFeed.usersCurrentlyOnline')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('activityFeed.totalThisWeek')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">{activities.length}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('activityFeed.activitiesSince')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">{t('activityFeed.activityTimeline')}</CardTitle>
                <CardDescription>{t('activityFeed.activityTimelineDesc')}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('activityFeed.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {activities.map((activity, index) => {
              const prevActivity = activities[index - 1];
              const currentDate = activity.timestamp.split(" ")[0];
              const prevDate = prevActivity?.timestamp.split(" ")[0];
              const showDateHeader = currentDate !== prevDate;

              return (
                <div key={activity.id}>
                  {showDateHeader && (
                    <div className="flex items-center gap-2 py-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-medium text-muted-foreground px-2">
                        {new Date(currentDate).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getActivityIconBg(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{activity.user}</span>
                        <span className="text-xs text-muted-foreground">({activity.userRole})</span>
                        {activity.status && (
                          <Badge
                            variant={activity.status === "success" ? "default" : activity.status === "warning" ? "outline" : "destructive"}
                            className="text-[10px] h-5"
                          >
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mt-0.5">
                        <span className="font-medium">{activity.action}</span>
                        <span className="text-muted-foreground"> — {activity.details}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getModuleBadgeVariant(activity.module)} className="text-[10px] h-5">
                          {activity.module}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{t('activityFeed.userSessions')}</CardTitle>
              <CardDescription>{t('activityFeed.userSessionsDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('activityFeed.user')}</TableHead>
                <TableHead>{t('activityFeed.role')}</TableHead>
                <TableHead>{t('activityFeed.loginTime')}</TableHead>
                <TableHead>{t('activityFeed.logoutTime')}</TableHead>
                <TableHead>{t('activityFeed.ipAddress')}</TableHead>
                <TableHead>{t('activityFeed.device')}</TableHead>
                <TableHead>{t('activityFeed.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loginActivities.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.user}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{session.role}</TableCell>
                  <TableCell className="font-mono text-xs">{session.loginTime}</TableCell>
                  <TableCell className="font-mono text-xs">{session.logoutTime || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{session.ipAddress}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{session.device}</TableCell>
                  <TableCell>
                    <Badge variant={getSessionStatusVariant(session.status)}>
                      {session.status}
                    </Badge>
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
