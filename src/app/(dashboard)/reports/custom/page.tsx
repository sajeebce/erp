import { getTranslations, getLocale } from 'next-intl/server';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock, Play, Settings, Calendar, Database } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface CustomReport {
  name: string;
  createdBy: string;
  dataSource: string;
  columns: string[];
  filters: string[];
  lastRun: string;
  schedule: "None" | "Daily" | "Weekly" | "Monthly";
}

const savedReports: CustomReport[] = [
  {
    name: "Donor-wise Fund Utilization Summary",
    createdBy: "Dr. Nasreen Ahmed",
    dataSource: "Finance",
    columns: ["Donor", "Grant", "Budget", "Spent", "Balance", "Utilization %"],
    filters: ["FY 2025-26", "Active Grants Only"],
    lastRun: "2026-02-01",
    schedule: "Monthly",
  },
  {
    name: "Project Staff Allocation Matrix",
    createdBy: "Fatima Begum",
    dataSource: "HR + Projects",
    columns: ["Staff Name", "Designation", "Project", "% Allocation", "Cost Center"],
    filters: ["Active Staff", "Current Projects"],
    lastRun: "2026-01-28",
    schedule: "Weekly",
  },
  {
    name: "Beneficiary Reach by District",
    createdBy: "Taslima Akter",
    dataSource: "Beneficiaries",
    columns: ["District", "Upazila", "Male", "Female", "Total", "Target", "Achievement %"],
    filters: ["FY 2025-26", "All Projects"],
    lastRun: "2026-01-31",
    schedule: "Monthly",
  },
  {
    name: "Overdue Voucher Approval Tracker",
    createdBy: "Kamal Hossain",
    dataSource: "Finance",
    columns: ["Voucher No", "Type", "Amount", "Prepared By", "Days Pending", "Approver"],
    filters: ["Status: Pending", "Age > 3 Days"],
    lastRun: "2026-02-02",
    schedule: "Daily",
  },
  {
    name: "Asset Register with Depreciation",
    createdBy: "Rahim Uddin",
    dataSource: "Assets",
    columns: ["Asset ID", "Description", "Location", "Purchase Value", "Current Value", "Depreciation"],
    filters: ["Active Assets", "All Offices"],
    lastRun: "2026-01-15",
    schedule: "None",
  },
];

function getScheduleVariant(schedule: string): "default" | "secondary" | "outline" {
  switch (schedule) {
    case "Daily": return "default";
    case "Weekly": return "secondary";
    case "Monthly": return "outline";
    default: return "outline";
  }
}

export default async function CustomReportsPage() {
  const t = await getTranslations('reports');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const totalSaved = savedReports.length;
  const scheduledReports = savedReports.filter((r) => r.schedule !== "None").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('custom.title')}
        description={t('custom.description')}
      >
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('custom.createNewReport')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('custom.savedReports')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalSaved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('custom.scheduledReports')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{scheduledReports}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('custom.lastGenerated')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">02 Feb 2026</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedReports.map((report) => (
          <Card key={report.name}>
            <CardHeader>
              <CardTitle className="text-base">{report.name}</CardTitle>
              <CardDescription>{t('custom.createdBy', { name: report.createdBy })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Database className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{t('custom.source')}:</span>
                <Badge variant="outline">{report.dataSource}</Badge>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">{t('custom.columns')}:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.columns.slice(0, 4).map((col) => (
                    <Badge key={col} variant="secondary" className="text-xs">
                      {col}
                    </Badge>
                  ))}
                  {report.columns.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      {t('custom.more', { count: report.columns.length - 4 })}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">{t('custom.filters')}:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.filters.map((filter) => (
                    <Badge key={filter} variant="outline" className="text-xs">
                      {filter}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {t('custom.lastRun', { date: formatDate(report.lastRun, locale) })}
                </div>
                <Badge variant={getScheduleVariant(report.schedule)}>
                  {report.schedule === "None" ? t('custom.manual') : report.schedule}
                </Badge>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-3 w-3 mr-1" />
                  {t('custom.edit')}
                </Button>
                <Button size="sm" className="flex-1">
                  <Play className="h-3 w-3 mr-1" />
                  {t('custom.run')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] gap-3">
            <div className="rounded-full bg-muted p-3">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">{t('custom.createNewReport')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('custom.createNewReportDesc')}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('custom.getStarted')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
