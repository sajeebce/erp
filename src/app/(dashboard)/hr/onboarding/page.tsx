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
import { Progress } from "@/components/ui/progress";
import { Plus, Download } from "lucide-react";
import { formatDate, formatPercent } from "@/lib/formatters";

interface OnboardingTask {
  name: string;
  completed: boolean;
}

interface OnboardingEmployee {
  name: string;
  position: string;
  department: string;
  startDate: string;
  tasks: OnboardingTask[];
  status: "In Progress" | "Completed" | "Overdue";
}

const onboardingEmployees: OnboardingEmployee[] = [
  {
    name: "Farhana Begum",
    position: "Finance Officer",
    department: "Finance & Accounts",
    startDate: "2026-02-01",
    tasks: [
      { name: "ID Card", completed: true },
      { name: "Bank Account", completed: true },
      { name: "IT Access", completed: true },
      { name: "Policy Handbook", completed: true },
      { name: "Orientation", completed: true },
      { name: "Supervisor Intro", completed: true },
      { name: "Probation Goals", completed: false },
    ],
    status: "In Progress",
  },
  {
    name: "Mahbubur Rahman",
    position: "Field Coordinator",
    department: "Programs",
    startDate: "2026-02-03",
    tasks: [
      { name: "ID Card", completed: true },
      { name: "Bank Account", completed: true },
      { name: "IT Access", completed: true },
      { name: "Policy Handbook", completed: true },
      { name: "Orientation", completed: false },
      { name: "Supervisor Intro", completed: false },
      { name: "Probation Goals", completed: false },
    ],
    status: "In Progress",
  },
  {
    name: "Sadia Islam Mitu",
    position: "Communications Officer",
    department: "Management",
    startDate: "2026-01-15",
    tasks: [
      { name: "ID Card", completed: true },
      { name: "Bank Account", completed: true },
      { name: "IT Access", completed: true },
      { name: "Policy Handbook", completed: true },
      { name: "Orientation", completed: true },
      { name: "Supervisor Intro", completed: true },
      { name: "Probation Goals", completed: true },
    ],
    status: "Completed",
  },
  {
    name: "Rezaul Karim",
    position: "Data Entry Operator",
    department: "M&E",
    startDate: "2026-01-20",
    tasks: [
      { name: "ID Card", completed: true },
      { name: "Bank Account", completed: false },
      { name: "IT Access", completed: true },
      { name: "Policy Handbook", completed: true },
      { name: "Orientation", completed: true },
      { name: "Supervisor Intro", completed: true },
      { name: "Probation Goals", completed: false },
    ],
    status: "Overdue",
  },
  {
    name: "Ayesha Siddiqua",
    position: "WASH Program Officer",
    department: "Programs",
    startDate: "2026-02-05",
    tasks: [
      { name: "ID Card", completed: true },
      { name: "Bank Account", completed: false },
      { name: "IT Access", completed: false },
      { name: "Policy Handbook", completed: false },
      { name: "Orientation", completed: false },
      { name: "Supervisor Intro", completed: false },
      { name: "Probation Goals", completed: false },
    ],
    status: "In Progress",
  },
];

function getCompletionPercent(tasks: OnboardingTask[]): number {
  const completed = tasks.filter((t) => t.completed).length;
  return (completed / tasks.length) * 100;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "Completed": return "default";
    case "In Progress": return "secondary";
    case "Overdue": return "destructive";
    default: return "secondary";
  }
}

export default async function OnboardingPage() {
  const t = await getTranslations('hr');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const totalNew = onboardingEmployees.length;
  const completed = onboardingEmployees.filter((e) => e.status === "Completed").length;
  const inProgress = onboardingEmployees.filter((e) => e.status === "In Progress").length;
  const overdue = onboardingEmployees.filter((e) => e.status === "Overdue").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('onboarding.title')}
        description={t('onboarding.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('onboarding.newOnboarding')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('onboarding.newEmployees')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalNew}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('onboarding.completed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('onboarding.inProgress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('onboarding.overdue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{overdue}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('onboarding.onboardingTracker')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('onboarding.employeeName')}</TableHead>
                <TableHead>{t('onboarding.position')}</TableHead>
                <TableHead>{t('onboarding.department')}</TableHead>
                <TableHead>{t('onboarding.startDate')}</TableHead>
                <TableHead>{t('onboarding.tasksProgress')}</TableHead>
                <TableHead className="text-right">{t('onboarding.completionPercent')}</TableHead>
                <TableHead>{tc('labels.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {onboardingEmployees.map((employee) => {
                const percent = getCompletionPercent(employee.tasks);
                const completedTasks = employee.tasks.filter((t) => t.completed).length;
                return (
                  <TableRow key={employee.name}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{formatDate(employee.startDate, locale)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={percent} className="h-2 w-32" />
                        <div className="flex flex-wrap gap-1">
                          {employee.tasks.map((task) => (
                            <Badge
                              key={task.name}
                              variant={task.completed ? "default" : "outline"}
                              className="text-[9px] px-1 py-0"
                            >
                              {task.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercent(percent, locale)}
                      <span className="text-muted-foreground text-xs ml-1">
                        ({completedTasks}/{employee.tasks.length})
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(employee.status)}>{employee.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
