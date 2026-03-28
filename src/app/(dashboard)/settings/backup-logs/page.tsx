import { getTranslations, getLocale } from 'next-intl/server';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Database,
  CheckCircle,
  HardDrive,
  Clock,
  AlertTriangle,
  Shield,
  RefreshCw,
  Trash2,
  FileText,
  Activity,
} from "lucide-react";
import { formatPercent } from "@/lib/formatters";

interface BackupEntry {
  backupId: string;
  dateTime: string;
  type: "Full" | "Incremental" | "Database" | "Files";
  size: string;
  duration: string;
  status: "Success" | "Failed" | "In Progress";
  initiatedBy: string;
  retentionDays: number;
}

interface SystemLog {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  source: string;
  user?: string;
}

interface BackupSchedule {
  type: string;
  frequency: string;
  time: string;
  retention: string;
  lastRun: string;
  nextRun: string;
  status: "Active" | "Paused";
}

const backups: BackupEntry[] = [
  { backupId: "BKP-2026-048", dateTime: "2026-02-08 02:00:00", type: "Full", size: "4.5 GB", duration: "19 min", status: "Success", initiatedBy: "System (Scheduled)", retentionDays: 90 },
  { backupId: "BKP-2026-047", dateTime: "2026-02-07 14:30:00", type: "Database", size: "1.9 GB", duration: "7 min", status: "Success", initiatedBy: "Kamal Hossain", retentionDays: 30 },
  { backupId: "BKP-2026-046", dateTime: "2026-02-07 02:00:00", type: "Incremental", size: "720 MB", duration: "4 min", status: "Success", initiatedBy: "System (Scheduled)", retentionDays: 14 },
  { backupId: "BKP-2026-045", dateTime: "2026-02-06 02:00:00", type: "Full", size: "4.4 GB", duration: "18 min", status: "Success", initiatedBy: "System (Scheduled)", retentionDays: 90 },
  { backupId: "BKP-2026-044", dateTime: "2026-02-05 02:00:00", type: "Incremental", size: "580 MB", duration: "3 min", status: "Failed", initiatedBy: "System (Scheduled)", retentionDays: 14 },
  { backupId: "BKP-2026-043", dateTime: "2026-02-04 02:00:00", type: "Incremental", size: "490 MB", duration: "3 min", status: "Success", initiatedBy: "System (Scheduled)", retentionDays: 14 },
  { backupId: "BKP-2026-042", dateTime: "2026-02-03 11:00:00", type: "Files", size: "2.5 GB", duration: "13 min", status: "Success", initiatedBy: "Dr. Nasreen Ahmed", retentionDays: 60 },
  { backupId: "BKP-2026-041", dateTime: "2026-02-03 02:00:00", type: "Full", size: "4.3 GB", duration: "17 min", status: "Success", initiatedBy: "System (Scheduled)", retentionDays: 90 },
  { backupId: "BKP-2026-040", dateTime: "2026-02-02 02:00:00", type: "Incremental", size: "410 MB", duration: "2 min", status: "Success", initiatedBy: "System (Scheduled)", retentionDays: 14 },
  { backupId: "BKP-2026-039", dateTime: "2026-02-01 02:00:00", type: "Database", size: "1.8 GB", duration: "6 min", status: "In Progress", initiatedBy: "System (Scheduled)", retentionDays: 30 },
];

const systemLogs: SystemLog[] = [
  { timestamp: "2026-02-08 14:35:22", level: "INFO", message: "User login successful - Dr. Nasreen Ahmed", source: "Auth Service", user: "Dr. Nasreen Ahmed" },
  { timestamp: "2026-02-08 14:20:10", level: "INFO", message: "Voucher DV-2026-488 approved by Kamal Hossain", source: "Finance Module", user: "Kamal Hossain" },
  { timestamp: "2026-02-08 12:15:33", level: "WARN", message: "Failed login attempt from IP 185.220.101.34 - invalid credentials", source: "Auth Service" },
  { timestamp: "2026-02-08 10:45:00", level: "INFO", message: "Payroll batch processing started for January 2026", source: "HR Module", user: "Mizanur Rahman" },
  { timestamp: "2026-02-08 02:19:00", level: "INFO", message: "Full backup completed successfully - BKP-2026-048 (4.5 GB)", source: "Backup Service" },
  { timestamp: "2026-02-07 18:30:05", level: "WARN", message: "Database connection pool nearing limit (85/100 connections)", source: "DB Service" },
  { timestamp: "2026-02-07 16:22:11", level: "ERROR", message: "Report generation timeout - Annual Financial Report (exceeded 120s)", source: "Report Service", user: "Fatima Rahman" },
  { timestamp: "2026-02-07 14:10:05", level: "WARN", message: "Account locked after 3 failed attempts - user tanvir.test@bdf.org.bd", source: "Auth Service" },
  { timestamp: "2026-02-05 02:04:30", level: "ERROR", message: "Incremental backup failed - disk space threshold exceeded on backup volume", source: "Backup Service" },
  { timestamp: "2026-02-05 01:00:00", level: "INFO", message: "Database optimization completed - 14 tables reindexed, 2.1 GB reclaimed", source: "DB Service" },
  { timestamp: "2026-02-04 22:00:00", level: "DEBUG", message: "Scheduled report queue cleared - 6 reports processed successfully", source: "Report Service" },
  { timestamp: "2026-02-04 18:00:00", level: "INFO", message: "New user account created: aminul.hoque@bdf.org.bd (Microfinance Officer)", source: "Auth Service", user: "Tanvir Hasan" },
  { timestamp: "2026-02-03 11:12:00", level: "INFO", message: "Manual file backup initiated by Dr. Nasreen Ahmed", source: "Backup Service", user: "Dr. Nasreen Ahmed" },
  { timestamp: "2026-02-03 09:30:00", level: "WARN", message: "SSL certificate expiring in 30 days - *.bdf.org.bd", source: "System Monitor" },
  { timestamp: "2026-02-02 14:00:00", level: "INFO", message: "System module updated: Finance & Accounting v3.2.0 → v3.2.1", source: "Update Service", user: "Tanvir Hasan" },
];

const backupSchedules: BackupSchedule[] = [
  { type: "Full Database Backup", frequency: "Every Sunday & Wednesday", time: "02:00 AM", retention: "90 days", lastRun: "2026-02-08 02:00", nextRun: "2026-02-11 02:00", status: "Active" },
  { type: "Incremental Backup", frequency: "Daily (except Full days)", time: "02:00 AM", retention: "14 days", lastRun: "2026-02-07 02:00", nextRun: "2026-02-09 02:00", status: "Active" },
  { type: "File/Document Backup", frequency: "Weekly (Saturday)", time: "03:00 AM", retention: "60 days", lastRun: "2026-02-01 03:00", nextRun: "2026-02-08 03:00", status: "Active" },
  { type: "Transaction Log Backup", frequency: "Every 6 hours", time: "00:00, 06:00, 12:00, 18:00", retention: "7 days", lastRun: "2026-02-08 12:00", nextRun: "2026-02-08 18:00", status: "Active" },
  { type: "Off-site Replication", frequency: "Weekly (Sunday)", time: "04:00 AM", retention: "180 days", lastRun: "2026-02-02 04:00", nextRun: "2026-02-09 04:00", status: "Paused" },
];

function getBackupStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "Success": return "default";
    case "Failed": return "destructive";
    case "In Progress": return "secondary";
    default: return "secondary";
  }
}

function getTypeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "Full": return "default";
    case "Incremental": return "secondary";
    default: return "outline";
  }
}

function getLogLevelVariant(level: string): "default" | "secondary" | "outline" | "destructive" {
  switch (level) {
    case "INFO": return "secondary";
    case "WARN": return "outline";
    case "ERROR": return "destructive";
    case "DEBUG": return "default";
    default: return "secondary";
  }
}

export default async function BackupLogsPage() {
  const t = await getTranslations('settings');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const totalBackups = backups.length;
  const successfulBackups = backups.filter((b) => b.status === "Success").length;
  const failedBackups = backups.filter((b) => b.status === "Failed").length;
  const successRate = (successfulBackups / totalBackups) * 100;
  const totalSizeGB = 24.8;
  const allocatedGB = 50;
  const storagePercent = (totalSizeGB / allocatedGB) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('backupLogs.title')}
        description={t('backupLogs.description')}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            {t('backupLogs.exportLogs')}
          </Button>
          <Button size="sm">
            <Database className="h-4 w-4 mr-2" />
            {t('backupLogs.runBackupNow')}
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('backupLogs.lastBackup')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">08 Feb</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">02:00 AM (Full) - 4.5 GB</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('backupLogs.successRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <p className="text-2xl font-bold">{formatPercent(successRate, locale)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('backupLogs.successful', { count: successfulBackups, total: totalBackups })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('backupLogs.failedBackups')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-2xl font-bold">{failedBackups}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('backupLogs.inLastBackups', { count: 10 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('backupLogs.storageUsed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">{totalSizeGB} GB</p>
            </div>
            <Progress value={storagePercent} className="h-1.5 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{t('backupLogs.ofAllocated', { size: `${allocatedGB} GB`, percent: formatPercent(storagePercent, locale) })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Backup Schedules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">{t('backupLogs.backupSchedules')}</CardTitle>
                <CardDescription>{t('backupLogs.backupSchedulesDesc')}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">{t('backupLogs.addSchedule')}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('backupLogs.backupType')}</TableHead>
                <TableHead>{t('backupLogs.frequency')}</TableHead>
                <TableHead>{t('backupLogs.time')}</TableHead>
                <TableHead>{t('backupLogs.retention')}</TableHead>
                <TableHead>{t('backupLogs.lastRun')}</TableHead>
                <TableHead>{t('backupLogs.nextRun')}</TableHead>
                <TableHead>{t('backupLogs.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backupSchedules.map((schedule) => (
                <TableRow key={schedule.type}>
                  <TableCell className="font-medium">{schedule.type}</TableCell>
                  <TableCell className="text-sm">{schedule.frequency}</TableCell>
                  <TableCell className="font-mono text-xs">{schedule.time}</TableCell>
                  <TableCell className="text-sm">{schedule.retention}</TableCell>
                  <TableCell className="font-mono text-xs">{schedule.lastRun}</TableCell>
                  <TableCell className="font-mono text-xs">{schedule.nextRun}</TableCell>
                  <TableCell>
                    <Badge variant={schedule.status === "Active" ? "default" : "secondary"}>
                      {schedule.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">{t('backupLogs.backupHistory')}</CardTitle>
                <CardDescription>{t('backupLogs.backupHistoryDesc')}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('backupLogs.purgeExpired')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">{t('backupLogs.backupId')}</TableHead>
                <TableHead>{t('backupLogs.dateTime')}</TableHead>
                <TableHead>{t('backupLogs.type')}</TableHead>
                <TableHead>{t('backupLogs.size')}</TableHead>
                <TableHead>{t('backupLogs.duration')}</TableHead>
                <TableHead>{t('backupLogs.status')}</TableHead>
                <TableHead>{t('backupLogs.initiatedBy')}</TableHead>
                <TableHead className="text-right">{t('backupLogs.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.backupId}>
                  <TableCell className="font-mono text-sm">{backup.backupId}</TableCell>
                  <TableCell className="font-mono text-xs">{backup.dateTime}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(backup.type)}>{backup.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{backup.size}</TableCell>
                  <TableCell className="text-sm">{backup.duration}</TableCell>
                  <TableCell>
                    <Badge variant={getBackupStatusVariant(backup.status)}>{backup.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{backup.initiatedBy}</TableCell>
                  <TableCell className="text-right">
                    {backup.status === "Success" && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        {tc('buttons.download')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">{t('backupLogs.systemLogs')}</CardTitle>
                <CardDescription>{t('backupLogs.systemLogsDesc')}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                {systemLogs.filter(l => l.level === "ERROR").length} {t('backupLogs.errors')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {systemLogs.filter(l => l.level === "WARN").length} {t('backupLogs.warnings')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[170px]">{t('backupLogs.timestamp')}</TableHead>
                <TableHead className="w-[70px]">{t('backupLogs.level')}</TableHead>
                <TableHead>{t('backupLogs.message')}</TableHead>
                <TableHead>{t('backupLogs.source')}</TableHead>
                <TableHead>{t('backupLogs.user')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemLogs.map((log, index) => (
                <TableRow key={`${log.timestamp}-${index}`}>
                  <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                  <TableCell>
                    <Badge variant={getLogLevelVariant(log.level)}>{log.level}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.message}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.source}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.user || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Data Retention Policy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{t('backupLogs.dataRetention')}</CardTitle>
              <CardDescription>{t('backupLogs.dataRetentionDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: "Full Backups", retention: "90 days", count: "~12 backups" },
              { type: "Incremental Backups", retention: "14 days", count: "~10 backups" },
              { type: "File Backups", retention: "60 days", count: "~8 backups" },
              { type: "Transaction Logs", retention: "7 days", count: "~28 logs" },
              { type: "Audit Logs", retention: "365 days", count: "All records" },
              { type: "System Logs", retention: "90 days", count: "Rolling" },
            ].map((policy) => (
              <div key={policy.type} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{policy.type}</p>
                  <p className="text-xs text-muted-foreground">{policy.count}</p>
                </div>
                <Badge variant="outline">{policy.retention}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
