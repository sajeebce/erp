import { getTranslations, getLocale } from 'next-intl/server';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, Circle, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface ChecklistItem {
  name: string;
  status: "Completed" | "In Progress" | "Pending";
  dueDate: string;
  completedDate: string | null;
  assignee: string;
}

interface CloseoutProject {
  id: string;
  name: string;
  donor: string;
  grant: string;
  budget: number;
  endDate: string;
  projectManager: string;
  checklist: ChecklistItem[];
}

const closeoutProjects: CloseoutProject[] = [
  {
    id: "PRJ-CLO-001",
    name: "Food Security & Nutrition Program",
    donor: "JICA",
    grant: "GRT-007",
    budget: 28000000,
    endDate: "2025-02-28",
    projectManager: "Fatema Akhter",
    checklist: [
      {
        name: "Final Financial Report",
        status: "Completed",
        dueDate: "2025-03-31",
        completedDate: "2025-03-25",
        assignee: "Aminul Haque",
      },
      {
        name: "Final Narrative Report",
        status: "Completed",
        dueDate: "2025-03-31",
        completedDate: "2025-03-28",
        assignee: "Fatema Akhter",
      },
      {
        name: "Asset Disposition Plan",
        status: "Completed",
        dueDate: "2025-04-15",
        completedDate: "2025-04-10",
        assignee: "Kamal Hossain",
      },
      {
        name: "Lessons Learned Document",
        status: "In Progress",
        dueDate: "2026-02-28",
        completedDate: null,
        assignee: "Fatema Akhter",
      },
      {
        name: "Donor Acknowledgement Letter",
        status: "Completed",
        dueDate: "2025-04-30",
        completedDate: "2025-04-22",
        assignee: "Executive Director",
      },
      {
        name: "Staff Transition Plan",
        status: "Completed",
        dueDate: "2025-03-15",
        completedDate: "2025-03-10",
        assignee: "HR Manager",
      },
      {
        name: "Data Archival",
        status: "In Progress",
        dueDate: "2026-02-15",
        completedDate: null,
        assignee: "IT Department",
      },
      {
        name: "Final Audit",
        status: "Pending",
        dueDate: "2026-03-31",
        completedDate: null,
        assignee: "External Auditor",
      },
    ],
  },
  {
    id: "PRJ-CLO-002",
    name: "Disaster Risk Reduction - Haor Region",
    donor: "DFID/FCDO",
    grant: "GRT-010",
    budget: 14000000,
    endDate: "2024-05-31",
    projectManager: "Md. Rashidul Islam",
    checklist: [
      {
        name: "Final Financial Report",
        status: "Completed",
        dueDate: "2024-06-30",
        completedDate: "2024-06-28",
        assignee: "Aminul Haque",
      },
      {
        name: "Final Narrative Report",
        status: "Completed",
        dueDate: "2024-06-30",
        completedDate: "2024-06-25",
        assignee: "Md. Rashidul Islam",
      },
      {
        name: "Asset Disposition Plan",
        status: "Completed",
        dueDate: "2024-07-15",
        completedDate: "2024-07-12",
        assignee: "Kamal Hossain",
      },
      {
        name: "Lessons Learned Document",
        status: "Completed",
        dueDate: "2024-07-31",
        completedDate: "2024-07-29",
        assignee: "Md. Rashidul Islam",
      },
      {
        name: "Donor Acknowledgement Letter",
        status: "Completed",
        dueDate: "2024-07-15",
        completedDate: "2024-07-05",
        assignee: "Executive Director",
      },
      {
        name: "Staff Transition Plan",
        status: "Completed",
        dueDate: "2024-06-15",
        completedDate: "2024-06-10",
        assignee: "HR Manager",
      },
      {
        name: "Data Archival",
        status: "Completed",
        dueDate: "2024-08-31",
        completedDate: "2024-08-20",
        assignee: "IT Department",
      },
      {
        name: "Final Audit",
        status: "Completed",
        dueDate: "2024-09-30",
        completedDate: "2024-09-25",
        assignee: "External Auditor",
      },
    ],
  },
  {
    id: "PRJ-CLO-003",
    name: "Microfinance Capacity Building",
    donor: "SDC",
    grant: "GRT-006",
    budget: 15000000,
    endDate: "2025-12-31",
    projectManager: "Aminul Haque",
    checklist: [
      {
        name: "Final Financial Report",
        status: "In Progress",
        dueDate: "2026-02-28",
        completedDate: null,
        assignee: "Aminul Haque",
      },
      {
        name: "Final Narrative Report",
        status: "In Progress",
        dueDate: "2026-02-28",
        completedDate: null,
        assignee: "Aminul Haque",
      },
      {
        name: "Asset Disposition Plan",
        status: "Pending",
        dueDate: "2026-03-15",
        completedDate: null,
        assignee: "Kamal Hossain",
      },
      {
        name: "Lessons Learned Document",
        status: "Pending",
        dueDate: "2026-03-31",
        completedDate: null,
        assignee: "Aminul Haque",
      },
      {
        name: "Donor Acknowledgement Letter",
        status: "Pending",
        dueDate: "2026-03-15",
        completedDate: null,
        assignee: "Executive Director",
      },
      {
        name: "Staff Transition Plan",
        status: "In Progress",
        dueDate: "2026-02-15",
        completedDate: null,
        assignee: "HR Manager",
      },
      {
        name: "Data Archival",
        status: "Pending",
        dueDate: "2026-04-30",
        completedDate: null,
        assignee: "IT Department",
      },
      {
        name: "Final Audit",
        status: "Pending",
        dueDate: "2026-05-31",
        completedDate: null,
        assignee: "External Auditor",
      },
    ],
  },
];

function getStatusIcon(status: string) {
  switch (status) {
    case "Completed":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "In Progress":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "Pending":
      return <Circle className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "Completed": return "default";
    case "In Progress": return "secondary";
    case "Pending": return "outline";
    default: return "outline";
  }
}

function getCompletionPercent(checklist: ChecklistItem[]): number {
  const completed = checklist.filter((item) => item.status === "Completed").length;
  return Math.round((completed / checklist.length) * 100);
}

export default async function ProjectCloseoutPage() {
  const t = await getTranslations('projects');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('closeout.title')}
        description={t('closeout.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('closeout.projectsInCloseout')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{closeoutProjects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('closeout.fullyClosed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {closeoutProjects.filter((p) => getCompletionPercent(p.checklist) === 100).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('closeout.pendingItemsTotal')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {closeoutProjects.reduce(
                (sum, p) => sum + p.checklist.filter((c) => c.status !== "Completed").length,
                0
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {closeoutProjects.map((project) => {
          const completionPercent = getCompletionPercent(project.checklist);
          const completedCount = project.checklist.filter((c) => c.status === "Completed").length;

          return (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-mono">{project.id}</span> | {project.donor} | Grant: <span className="font-mono">{project.grant}</span> | Budget: {formatCurrency(project.budget, locale)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('closeout.projectEnd')}: {formatDate(project.endDate, locale)} | {t('closeout.manager')}: {project.projectManager}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={completionPercent === 100 ? "default" : "secondary"}>
                      {completionPercent === 100 ? t('closeout.closed') : t('closeout.inProgress')}
                    </Badge>
                    <p className="text-sm font-medium mt-1">{completedCount}/{project.checklist.length} {t('closeout.complete')}</p>
                  </div>
                </div>
                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('closeout.closeoutProgress')}</span>
                    <span className="font-medium">{completionPercent}%</span>
                  </div>
                  <Progress value={completionPercent} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {project.checklist.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-md border p-3"
                    >
                      <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium ${item.status === "Completed" ? "line-through text-muted-foreground" : ""}`}>
                            {item.name}
                          </p>
                          <Badge variant={getStatusBadgeVariant(item.status)} className="text-[10px] shrink-0">
                            {item.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{t('closeout.due')}: {formatDate(item.dueDate, locale)}</span>
                          {item.completedDate && (
                            <span>{t('closeout.done')}: {formatDate(item.completedDate, locale)}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('closeout.assignee')}: {item.assignee}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
