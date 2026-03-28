import { getLocale } from 'next-intl/server';
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
import { Download, Database, CheckCircle, HardDrive, Clock, AlertTriangle } from "lucide-react";
import { formatPercent } from "@/lib/formatters";

interface BackupEntry {
  backupId: string;
  dateTime: string;
  type: "Full" | "Incremental" | "Database" | "Files";
  size: string;
  duration: string;
  status: "Success" | "Failed" | "In Progress";
  initiatedBy: string;
}

interface SystemLog {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  source: string;
}

const backups: BackupEntry[] = [
  {
    backupId: "BKP-2026-048",
    dateTime: "2026-02-02 02:00:00",
    type: "Full",
    size: "4.2 GB",
    duration: "18 min",
    status: "Success",
    initiatedBy: "System (Scheduled)",
  },
  {
    backupId: "BKP-2026-047",
    dateTime: "2026-02-01 14:30:00",
    type: "Database",
    size: "1.8 GB",
    duration: "6 min",
    status: "Success",
    initiatedBy: "Kamal Hossain",
  },
  {
    backupId: "BKP-2026-046",
    dateTime: "2026-02-01 02:00:00",
    type: "Incremental",
    size: "680 MB",
    duration: "4 min",
    status: "Success",
    initiatedBy: "System (Scheduled)",
  },
  {
    backupId: "BKP-2026-045",
    dateTime: "2026-01-31 02:00:00",
    type: "Full",
    size: "4.1 GB",
    duration: "17 min",
    status: "Success",
    initiatedBy: "System (Scheduled)",
  },
  {
    backupId: "BKP-2026-044",
    dateTime: "2026-01-30 02:00:00",
    type: "Incremental",
    size: "520 MB",
    duration: "3 min",
    status: "Failed",
    initiatedBy: "System (Scheduled)",
  },
  {
    backupId: "BKP-2026-043",
    dateTime: "2026-01-29 02:00:00",
    type: "Incremental",
    size: "445 MB",
    duration: "3 min",
    status: "Success",
    initiatedBy: "System (Scheduled)",
  },
  {
    backupId: "BKP-2026-042",
    dateTime: "2026-01-28 11:00:00",
    type: "Files",
    size: "2.3 GB",
    duration: "12 min",
    status: "Success",
    initiatedBy: "Dr. Nasreen Ahmed",
  },
  {
    backupId: "BKP-2026-041",
    dateTime: "2026-01-28 02:00:00",
    type: "Full",
    size: "4.0 GB",
    duration: "16 min",
    status: "Success",
    initiatedBy: "System (Scheduled)",
  },
  {
    backupId: "BKP-2026-040",
    dateTime: "2026-01-27 02:00:00",
    type: "Incremental",
    size: "390 MB",
    duration: "2 min",
    status: "Success",
    initiatedBy: "System (Scheduled)",
  },
  {
    backupId: "BKP-2026-039",
    dateTime: "2026-01-26 02:00:00",
    type: "Database",
    size: "1.7 GB",
    duration: "5 min",
    status: "Success",
    initiatedBy: "System (Scheduled)",
  },
];

const systemLogs: SystemLog[] = [
  {
    timestamp: "2026-02-02 14:35:22",
    level: "INFO",
    message: "User login successful - Dr. Nasreen Ahmed",
    source: "Auth Service",
  },
  {
    timestamp: "2026-02-02 12:15:33",
    level: "WARN",
    message: "Failed login attempt from IP 185.220.101.34 - invalid credentials",
    source: "Auth Service",
  },
  {
    timestamp: "2026-02-02 02:18:00",
    level: "INFO",
    message: "Full backup completed successfully - BKP-2026-048 (4.2 GB)",
    source: "Backup Service",
  },
  {
    timestamp: "2026-02-01 14:10:05",
    level: "WARN",
    message: "Account locked after 3 failed attempts - IP 45.134.26.78",
    source: "Auth Service",
  },
  {
    timestamp: "2026-01-30 02:04:30",
    level: "ERROR",
    message: "Incremental backup failed - disk space threshold exceeded on backup volume",
    source: "Backup Service",
  },
  {
    timestamp: "2026-01-30 01:00:00",
    level: "INFO",
    message: "Database optimization completed - 12 tables reindexed",
    source: "DB Service",
  },
  {
    timestamp: "2026-01-29 18:00:00",
    level: "INFO",
    message: "Scheduled report generation completed - 4 reports processed",
    source: "Report Service",
  },
  {
    timestamp: "2026-01-28 11:12:00",
    level: "INFO",
    message: "Manual file backup initiated by Dr. Nasreen Ahmed",
    source: "Backup Service",
  },
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
    case "Database": return "outline";
    case "Files": return "outline";
    default: return "outline";
  }
}

function getLogLevelVariant(level: string): "default" | "secondary" | "outline" | "destructive" {
  switch (level) {
    case "INFO": return "secondary";
    case "WARN": return "outline";
    case "ERROR": return "destructive";
    default: return "secondary";
  }
}

export default async function BackupPage() {
  const locale = await getLocale();
  const totalBackups = backups.length;
  const successfulBackups = backups.filter((b) => b.status === "Success").length;
  const successRate = (successfulBackups / totalBackups) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup & Logs"
        description="Manage database backups and view system logs"
      >
        <Button size="sm">
          <Database className="h-4 w-4 mr-2" />
          Run Backup Now
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">02 Feb</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">02:00 AM (Full)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{totalBackups}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">{formatPercent(successRate, locale)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">18.6 GB</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">of 50 GB allocated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Backup ID</TableHead>
                <TableHead>Date/Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Initiated By</TableHead>
                <TableHead className="text-right">Action</TableHead>
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
                        Download
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Source</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
