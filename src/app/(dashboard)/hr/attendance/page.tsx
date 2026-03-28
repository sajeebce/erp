import { getTranslations, getLocale } from 'next-intl/server';
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
import { Download } from "lucide-react";
import { formatPercent } from "@/lib/formatters";

interface AttendanceRecord {
  name: string;
  department: string;
  workingDays: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  otHours: number;
  attendancePercent: number;
}

const attendanceRecords: AttendanceRecord[] = [
  {
    name: "Dr. Aminul Haque",
    department: "Management",
    workingDays: 22,
    present: 21,
    absent: 0,
    late: 0,
    leave: 1,
    otHours: 8,
    attendancePercent: 95.5,
  },
  {
    name: "Nasreen Sultana",
    department: "Finance & Accounts",
    workingDays: 22,
    present: 22,
    absent: 0,
    late: 1,
    leave: 0,
    otHours: 12,
    attendancePercent: 100,
  },
  {
    name: "Md. Rafiqul Islam",
    department: "Programs",
    workingDays: 22,
    present: 20,
    absent: 0,
    late: 0,
    leave: 2,
    otHours: 6,
    attendancePercent: 90.9,
  },
  {
    name: "Fatima Akter Ruma",
    department: "Human Resources",
    workingDays: 22,
    present: 21,
    absent: 0,
    late: 2,
    leave: 1,
    otHours: 4,
    attendancePercent: 95.5,
  },
  {
    name: "Shahin Ahmed",
    department: "Programs",
    workingDays: 22,
    present: 19,
    absent: 1,
    late: 0,
    leave: 2,
    otHours: 10,
    attendancePercent: 86.4,
  },
  {
    name: "Tahmina Khanam",
    department: "M&E",
    workingDays: 22,
    present: 22,
    absent: 0,
    late: 0,
    leave: 0,
    otHours: 15,
    attendancePercent: 100,
  },
  {
    name: "Kamal Hossain",
    department: "Programs",
    workingDays: 22,
    present: 15,
    absent: 2,
    late: 0,
    leave: 5,
    otHours: 0,
    attendancePercent: 68.2,
  },
  {
    name: "Nusrat Jahan",
    department: "Finance & Accounts",
    workingDays: 22,
    present: 21,
    absent: 0,
    late: 1,
    leave: 1,
    otHours: 6,
    attendancePercent: 95.5,
  },
  {
    name: "Md. Sohel Rana",
    department: "Programs",
    workingDays: 22,
    present: 20,
    absent: 0,
    late: 3,
    leave: 2,
    otHours: 8,
    attendancePercent: 90.9,
  },
  {
    name: "Rubina Yasmin",
    department: "Programs",
    workingDays: 22,
    present: 22,
    absent: 0,
    late: 0,
    leave: 0,
    otHours: 4,
    attendancePercent: 100,
  },
  {
    name: "Tanvir Ahmed Khan",
    department: "IT & Admin",
    workingDays: 22,
    present: 21,
    absent: 0,
    late: 2,
    leave: 1,
    otHours: 18,
    attendancePercent: 95.5,
  },
  {
    name: "Sharmin Akhter",
    department: "Programs",
    workingDays: 22,
    present: 20,
    absent: 1,
    late: 1,
    leave: 1,
    otHours: 2,
    attendancePercent: 90.9,
  },
];

function getAttendanceBadge(percent: number): "default" | "secondary" | "destructive" {
  if (percent >= 95) return "default";
  if (percent >= 85) return "secondary";
  return "destructive";
}

export default async function AttendancePage() {
  const t = await getTranslations('hr');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const totalEmployees = attendanceRecords.length;
  const avgAttendance =
    attendanceRecords.reduce((sum, r) => sum + r.attendancePercent, 0) / attendanceRecords.length;
  const totalLate = attendanceRecords.reduce((sum, r) => sum + r.late, 0);
  const totalLeave = attendanceRecords.reduce((sum, r) => sum + r.leave, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('attendance.title')}
        description={t('attendance.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendance.totalEmployees')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalEmployees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendance.avgAttendance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(avgAttendance, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendance.totalLateInstances')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLate}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendance.totalLeaveDays')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLeave}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('attendance.monthlyAttendanceRegister')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('attendance.employeeName')}</TableHead>
                <TableHead>{t('attendance.department')}</TableHead>
                <TableHead className="text-right">{t('attendance.workingDays')}</TableHead>
                <TableHead className="text-right">{t('attendance.present')}</TableHead>
                <TableHead className="text-right">{t('attendance.absent')}</TableHead>
                <TableHead className="text-right">{t('attendance.late')}</TableHead>
                <TableHead className="text-right">{t('attendance.leave')}</TableHead>
                <TableHead className="text-right">{t('attendance.otHours')}</TableHead>
                <TableHead className="text-right">{t('attendance.attendancePercent')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.map((record) => (
                <TableRow key={record.name}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.department}</TableCell>
                  <TableCell className="text-right">{record.workingDays}</TableCell>
                  <TableCell className="text-right">{record.present}</TableCell>
                  <TableCell className="text-right">{record.absent > 0 ? <span className="text-destructive font-medium">{record.absent}</span> : record.absent}</TableCell>
                  <TableCell className="text-right">{record.late > 0 ? <span className="text-orange-600 font-medium">{record.late}</span> : record.late}</TableCell>
                  <TableCell className="text-right">{record.leave}</TableCell>
                  <TableCell className="text-right font-mono">{record.otHours}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getAttendanceBadge(record.attendancePercent)}>
                      {formatPercent(record.attendancePercent, locale)}
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
