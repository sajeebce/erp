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
import { Plus, Users, UserCheck, UserX, Clock } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface User {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  lastLogin: string;
  status: "Active" | "Inactive" | "Locked" | "Pending";
}

const users: User[] = [
  {
    userId: "USR-001",
    fullName: "Dr. Nasreen Ahmed",
    email: "nasreen.ahmed@ngoerp.org.bd",
    role: "Super Admin",
    department: "Executive",
    lastLogin: "2026-02-02",
    status: "Active",
  },
  {
    userId: "USR-002",
    fullName: "Kamal Hossain",
    email: "kamal.hossain@ngoerp.org.bd",
    role: "Finance Manager",
    department: "Finance & Accounts",
    lastLogin: "2026-02-02",
    status: "Active",
  },
  {
    userId: "USR-003",
    fullName: "Fatima Begum",
    email: "fatima.begum@ngoerp.org.bd",
    role: "Program Manager",
    department: "Programs",
    lastLogin: "2026-02-02",
    status: "Active",
  },
  {
    userId: "USR-004",
    fullName: "Rahim Uddin",
    email: "rahim.uddin@ngoerp.org.bd",
    role: "HR Manager",
    department: "Human Resources",
    lastLogin: "2026-02-01",
    status: "Active",
  },
  {
    userId: "USR-005",
    fullName: "Taslima Akter",
    email: "taslima.akter@ngoerp.org.bd",
    role: "Field Officer",
    department: "Programs",
    lastLogin: "2026-02-02",
    status: "Active",
  },
  {
    userId: "USR-006",
    fullName: "Mizanur Rahman",
    email: "mizanur.rahman@ngoerp.org.bd",
    role: "Field Officer",
    department: "Programs",
    lastLogin: "2026-02-01",
    status: "Active",
  },
  {
    userId: "USR-007",
    fullName: "Sharmin Sultana",
    email: "sharmin.sultana@ngoerp.org.bd",
    role: "Data Entry Operator",
    department: "Finance & Accounts",
    lastLogin: "2026-01-30",
    status: "Active",
  },
  {
    userId: "USR-008",
    fullName: "Anwar Hossain",
    email: "anwar.hossain@ngoerp.org.bd",
    role: "Auditor",
    department: "Internal Audit",
    lastLogin: "2026-01-28",
    status: "Active",
  },
  {
    userId: "USR-009",
    fullName: "Rashida Khatun",
    email: "rashida.khatun@ngoerp.org.bd",
    role: "Branch Manager",
    department: "Sylhet Office",
    lastLogin: "2026-02-01",
    status: "Active",
  },
  {
    userId: "USR-010",
    fullName: "Mohammad Ali",
    email: "mohammad.ali@ngoerp.org.bd",
    role: "Data Entry Operator",
    department: "Programs",
    lastLogin: "2025-12-15",
    status: "Inactive",
  },
  {
    userId: "USR-011",
    fullName: "Salma Begum",
    email: "salma.begum@ngoerp.org.bd",
    role: "Finance Admin",
    department: "Finance & Accounts",
    lastLogin: "-",
    status: "Locked",
  },
  {
    userId: "USR-012",
    fullName: "Hafizur Rahman",
    email: "hafizur.rahman@ngoerp.org.bd",
    role: "Field Officer",
    department: "Programs",
    lastLogin: "-",
    status: "Pending",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Active": return "default";
    case "Inactive": return "secondary";
    case "Locked": return "destructive";
    case "Pending": return "outline";
    default: return "secondary";
  }
}

export default async function UsersPage() {
  const t = await getTranslations('settings');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "Active").length;
  const inactiveUsers = users.filter((u) => u.status === "Inactive").length;
  const pendingUsers = users.filter((u) => u.status === "Pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
      >
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('users.addUser')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('users.totalUsers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('users.active')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">{activeUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('users.inactive')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              <p className="text-2xl font-bold">{inactiveUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('users.pendingActivation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">{pendingUsers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.userAccounts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">{t('users.userId')}</TableHead>
                <TableHead>{t('users.fullName')}</TableHead>
                <TableHead>{t('users.email')}</TableHead>
                <TableHead>{t('users.role')}</TableHead>
                <TableHead>{t('users.department')}</TableHead>
                <TableHead>{t('users.lastLogin')}</TableHead>
                <TableHead>{t('users.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-mono text-sm">{user.userId}</TableCell>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{user.department}</TableCell>
                  <TableCell className="text-sm">
                    {user.lastLogin === "-" ? "-" : formatDate(user.lastLogin, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
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
