import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface SubDepartment {
  name: string;
  head: string;
  staffCount: number;
}

interface Department {
  name: string;
  head: string;
  headDesignation: string;
  staffCount: number;
  subDepartments?: SubDepartment[];
  color: string;
}

const departments: Department[] = [
  {
    name: "Management",
    head: "Dr. Aminul Haque",
    headDesignation: "Executive Director",
    staffCount: 4,
    color: "bg-blue-500/10 border-blue-500/20",
    subDepartments: [
      { name: "Communications", head: "Sadia Islam Mitu", staffCount: 2 },
      { name: "Strategic Planning", head: "Dr. Aminul Haque", staffCount: 1 },
    ],
  },
  {
    name: "Finance & Accounts",
    head: "Nasreen Sultana",
    headDesignation: "Finance Director",
    staffCount: 6,
    color: "bg-emerald-500/10 border-emerald-500/20",
    subDepartments: [
      { name: "Financial Reporting", head: "Nusrat Jahan", staffCount: 2 },
      { name: "Grants Accounting", head: "Farhana Begum", staffCount: 2 },
    ],
  },
  {
    name: "Programs",
    head: "Md. Rafiqul Islam",
    headDesignation: "Program Director",
    staffCount: 28,
    color: "bg-violet-500/10 border-violet-500/20",
    subDepartments: [
      { name: "Education", head: "Sharmin Akhter", staffCount: 6 },
      { name: "Health & Nutrition", head: "Kamal Hossain", staffCount: 5 },
      { name: "WASH", head: "Ayesha Siddiqua", staffCount: 5 },
      { name: "Climate & Environment", head: "Md. Sohel Rana", staffCount: 4 },
      { name: "Microfinance", head: "Shahin Ahmed", staffCount: 8 },
    ],
  },
  {
    name: "HR & Admin",
    head: "Fatima Akter Ruma",
    headDesignation: "HR Manager",
    staffCount: 5,
    color: "bg-amber-500/10 border-amber-500/20",
    subDepartments: [
      { name: "Recruitment & Talent", head: "Fatima Akter Ruma", staffCount: 2 },
      { name: "Administration", head: "Rezaul Karim", staffCount: 3 },
    ],
  },
  {
    name: "Monitoring & Evaluation",
    head: "Tahmina Khanam",
    headDesignation: "M&E Specialist",
    staffCount: 4,
    color: "bg-rose-500/10 border-rose-500/20",
    subDepartments: [
      { name: "Data Management", head: "Rezaul Karim", staffCount: 2 },
      { name: "Impact Assessment", head: "Tahmina Khanam", staffCount: 2 },
    ],
  },
  {
    name: "IT & Technology",
    head: "Tanvir Ahmed Khan",
    headDesignation: "IT Officer",
    staffCount: 3,
    color: "bg-cyan-500/10 border-cyan-500/20",
    subDepartments: [
      { name: "Infrastructure", head: "Tanvir Ahmed Khan", staffCount: 2 },
      { name: "MIS & Software", head: "Tanvir Ahmed Khan", staffCount: 1 },
    ],
  },
  {
    name: "Field Operations",
    head: "Shahin Ahmed",
    headDesignation: "Regional Coordinator",
    staffCount: 35,
    color: "bg-orange-500/10 border-orange-500/20",
    subDepartments: [
      { name: "Sylhet Region", head: "Shahin Ahmed", staffCount: 8 },
      { name: "Chattogram Region", head: "Sharmin Akhter", staffCount: 7 },
      { name: "Rajshahi Region", head: "Rubina Yasmin", staffCount: 6 },
      { name: "Rangpur Region", head: "Md. Sohel Rana", staffCount: 7 },
      { name: "Barishal Region", head: "Kamal Hossain", staffCount: 7 },
    ],
  },
];

const totalStaff = departments.reduce((sum, d) => sum + d.staffCount, 0);

export default function OrgChartPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Chart"
        description="View the organizational hierarchy and reporting structure"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{departments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStaff}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sub-Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {departments.reduce((sum, d) => sum + (d.subDepartments?.length || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Executive Director - Top of hierarchy */}
      <div className="flex justify-center">
        <Card className="w-full max-w-md border-2 border-primary/30 bg-primary/5">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-lg">Executive Director</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="font-semibold">Dr. Aminul Haque</p>
            <p className="text-sm text-muted-foreground">Head Office, Dhaka</p>
            <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{totalStaff} staff across {departments.length} departments</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connecting line */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-border" />
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {departments.map((dept) => (
          <Card key={dept.name} className={`border ${dept.color}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{dept.name}</CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  <Users className="h-3 w-3 mr-1" />
                  {dept.staffCount}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">{dept.head}</p>
                <p className="text-xs text-muted-foreground">{dept.headDesignation}</p>
              </div>
            </CardHeader>
            {dept.subDepartments && dept.subDepartments.length > 0 && (
              <CardContent className="pt-0">
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Sub-Departments
                  </p>
                  {dept.subDepartments.map((sub) => (
                    <div
                      key={sub.name}
                      className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">{sub.head}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px]">
                        {sub.staffCount}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
