import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Download, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  office: string;
  joinDate: string;
  status: "Active" | "On Leave" | "Probation" | "Resigned";
  email: string;
  phone: string;
  initials: string;
}

const employees: Employee[] = [
  {
    id: "EMP-001",
    name: "Dr. Aminul Haque",
    designation: "Executive Director",
    department: "Management",
    office: "Head Office, Dhaka",
    joinDate: "2015-03-01",
    status: "Active",
    email: "aminul@org.bd",
    phone: "+880-1711-000001",
    initials: "AH",
  },
  {
    id: "EMP-002",
    name: "Nasreen Sultana",
    designation: "Finance Director",
    department: "Finance & Accounts",
    office: "Head Office, Dhaka",
    joinDate: "2016-07-15",
    status: "Active",
    email: "nasreen@org.bd",
    phone: "+880-1711-000002",
    initials: "NS",
  },
  {
    id: "EMP-003",
    name: "Md. Rafiqul Islam",
    designation: "Program Manager",
    department: "Programs",
    office: "Head Office, Dhaka",
    joinDate: "2018-01-10",
    status: "Active",
    email: "rafiqul@org.bd",
    phone: "+880-1711-000003",
    initials: "RI",
  },
  {
    id: "EMP-004",
    name: "Fatima Akter Ruma",
    designation: "HR Manager",
    department: "Human Resources",
    office: "Head Office, Dhaka",
    joinDate: "2019-04-20",
    status: "Active",
    email: "fatima@org.bd",
    phone: "+880-1711-000004",
    initials: "FA",
  },
  {
    id: "EMP-005",
    name: "Shahin Ahmed",
    designation: "Regional Coordinator",
    department: "Programs",
    office: "Sylhet Regional Office",
    joinDate: "2020-02-01",
    status: "Active",
    email: "shahin@org.bd",
    phone: "+880-1711-000005",
    initials: "SA",
  },
  {
    id: "EMP-006",
    name: "Tahmina Khanam",
    designation: "M&E Specialist",
    department: "Monitoring & Evaluation",
    office: "Head Office, Dhaka",
    joinDate: "2021-06-15",
    status: "Active",
    email: "tahmina@org.bd",
    phone: "+880-1711-000006",
    initials: "TK",
  },
  {
    id: "EMP-007",
    name: "Kamal Hossain",
    designation: "Field Officer",
    department: "Programs",
    office: "Barishal Field Office",
    joinDate: "2022-03-01",
    status: "On Leave",
    email: "kamal@org.bd",
    phone: "+880-1711-000007",
    initials: "KH",
  },
  {
    id: "EMP-008",
    name: "Nusrat Jahan",
    designation: "Accounts Officer",
    department: "Finance & Accounts",
    office: "Head Office, Dhaka",
    joinDate: "2022-09-01",
    status: "Active",
    email: "nusrat@org.bd",
    phone: "+880-1711-000008",
    initials: "NJ",
  },
  {
    id: "EMP-009",
    name: "Md. Sohel Rana",
    designation: "Agriculture Specialist",
    department: "Programs",
    office: "Mymensingh Field Office",
    joinDate: "2023-01-15",
    status: "Active",
    email: "sohel@org.bd",
    phone: "+880-1711-000009",
    initials: "SR",
  },
  {
    id: "EMP-010",
    name: "Rubina Yasmin",
    designation: "Gender Specialist",
    department: "Programs",
    office: "Rajshahi Regional Office",
    joinDate: "2023-06-01",
    status: "Active",
    email: "rubina@org.bd",
    phone: "+880-1711-000010",
    initials: "RY",
  },
  {
    id: "EMP-011",
    name: "Tanvir Ahmed Khan",
    designation: "IT Officer",
    department: "IT & Admin",
    office: "Head Office, Dhaka",
    joinDate: "2024-01-10",
    status: "Probation",
    email: "tanvir@org.bd",
    phone: "+880-1711-000011",
    initials: "TK",
  },
  {
    id: "EMP-012",
    name: "Sharmin Akhter",
    designation: "Community Mobilizer",
    department: "Programs",
    office: "Chattogram Regional Office",
    joinDate: "2024-04-01",
    status: "Probation",
    email: "sharmin@org.bd",
    phone: "+880-1711-000012",
    initials: "SA",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Active": return "default";
    case "On Leave": return "secondary";
    case "Probation": return "outline";
    case "Resigned": return "destructive";
    default: return "outline";
  }
}

export default function HRPage() {
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const departments = new Set(employees.map((e) => e.department)).size;
  const offices = new Set(employees.map((e) => e.office)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human Resources"
        description="Manage employee directory and HR operations"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{employees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{departments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{offices}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {employee.initials}
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold truncate">{employee.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{employee.designation}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={getStatusVariant(employee.status)} className="text-[10px]">
                  {employee.status}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">{employee.id}</span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{employee.office}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>Joined {formatDate(employee.joinDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span>{employee.phone}</span>
                </div>
              </div>
              <div className="pt-1">
                <Badge variant="outline" className="text-[10px]">{employee.department}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
