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
import {
  Building2,
  MapPin,
  Calendar,
  Globe,
  Phone,
  Mail,
  Users,
  Edit,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  head: string;
  employees: number;
  status: "Active" | "Inactive";
}

interface Office {
  id: string;
  name: string;
  type: "Head Office" | "Regional Office" | "Field Office" | "Sub-Office";
  location: string;
  district: string;
  contactPerson: string;
  phone: string;
  employees: number;
  status: "Active" | "Inactive";
}

const orgInfo = {
  name: "Bangladesh Development Foundation (BDF)",
  banglaName: "বাংলাদেশ উন্নয়ন ফাউন্ডেশন (বিডিএফ)",
  registrationNo: "S-12345/2005 (Dept. of Social Services)",
  ngoabLicense: "FD/NGO-2345/2010",
  tin: "123456789012",
  bin: "001234567-0201",
  established: "15 March 2005",
  registeredAddress: "House 42, Road 7, Block D, Banani, Dhaka-1213",
  headOffice: "Mohakhali DOHS, Dhaka-1206",
  phone: "+880-2-8876543",
  email: "info@bdf.org.bd",
  website: "www.bdf.org.bd",
  executiveDirector: "Dr. Nasreen Ahmed",
  chairperson: "Prof. Abdul Karim",
};

const departments: Department[] = [
  { id: "DEPT-001", name: "Finance & Accounts", head: "Kamal Hossain", employees: 18, status: "Active" },
  { id: "DEPT-002", name: "Program Management", head: "Fatima Rahman", employees: 42, status: "Active" },
  { id: "DEPT-003", name: "Human Resources", head: "Mizanur Rahman", employees: 8, status: "Active" },
  { id: "DEPT-004", name: "Procurement & Supply Chain", head: "Sayeed Khan", employees: 12, status: "Active" },
  { id: "DEPT-005", name: "Monitoring & Evaluation", head: "Roksana Begum", employees: 15, status: "Active" },
  { id: "DEPT-006", name: "IT & MIS", head: "Tanvir Hasan", employees: 10, status: "Active" },
  { id: "DEPT-007", name: "Communications & Advocacy", head: "Nusrat Jahan", employees: 6, status: "Active" },
  { id: "DEPT-008", name: "Internal Audit", head: "Shafiqul Islam", employees: 5, status: "Active" },
  { id: "DEPT-009", name: "Microfinance Operations", head: "Aminul Hoque", employees: 85, status: "Active" },
  { id: "DEPT-010", name: "Research & Development", head: "Dr. Shamima Akter", employees: 7, status: "Inactive" },
];

const offices: Office[] = [
  { id: "OFF-001", name: "Dhaka Head Office", type: "Head Office", location: "Mohakhali DOHS", district: "Dhaka", contactPerson: "Dr. Nasreen Ahmed", phone: "+880-2-8876543", employees: 65, status: "Active" },
  { id: "OFF-002", name: "Chattogram Regional Office", type: "Regional Office", location: "Agrabad C/A", district: "Chattogram", contactPerson: "Mahfuzur Rahman", phone: "+880-31-712345", employees: 35, status: "Active" },
  { id: "OFF-003", name: "Sylhet Regional Office", type: "Regional Office", location: "Zindabazar", district: "Sylhet", contactPerson: "Nazmul Huda", phone: "+880-821-716789", employees: 28, status: "Active" },
  { id: "OFF-004", name: "Rangpur Regional Office", type: "Regional Office", location: "Station Road", district: "Rangpur", contactPerson: "Sharmin Akhter", phone: "+880-521-63456", employees: 22, status: "Active" },
  { id: "OFF-005", name: "Cox's Bazar Field Office", type: "Field Office", location: "Kolatoli", district: "Cox's Bazar", contactPerson: "Jahangir Alam", phone: "+880-341-63890", employees: 45, status: "Active" },
  { id: "OFF-006", name: "Kurigram Field Office", type: "Field Office", location: "Town Hall Road", district: "Kurigram", contactPerson: "Rafiqul Islam", phone: "+880-581-61234", employees: 18, status: "Active" },
  { id: "OFF-007", name: "Satkhira Field Office", type: "Field Office", location: "Satkhira Sadar", district: "Satkhira", contactPerson: "Hasina Begum", phone: "+880-471-63456", employees: 15, status: "Active" },
  { id: "OFF-008", name: "Sunamganj Sub-Office", type: "Sub-Office", location: "Sunamganj Sadar", district: "Sunamganj", contactPerson: "Babul Mia", phone: "+880-871-62345", employees: 10, status: "Active" },
  { id: "OFF-009", name: "Bandarban Field Office", type: "Field Office", location: "Bandarban Sadar", district: "Bandarban", contactPerson: "Aung Shing Marma", phone: "+880-361-62890", employees: 12, status: "Active" },
  { id: "OFF-010", name: "Patuakhali Sub-Office", type: "Sub-Office", location: "Patuakhali Sadar", district: "Patuakhali", contactPerson: "Mostafa Kamal", phone: "+880-441-63456", employees: 8, status: "Inactive" },
];

const fiscalYearSettings = [
  { label: "Fiscal Year Start", value: "July" },
  { label: "Current Fiscal Year", value: "FY 2025-26 (Jul 2025 - Jun 2026)" },
  { label: "Base Currency", value: "BDT (৳) - Bangladeshi Taka" },
  { label: "Reporting Currencies", value: "BDT, USD" },
  { label: "Number Format", value: "Indian (12,34,567.89)" },
  { label: "Date Format", value: "DD/MM/YYYY" },
];

function getOfficeTypeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "Head Office": return "default";
    case "Regional Office": return "secondary";
    default: return "outline";
  }
}

export default function OrganizationSetupPage() {
  const totalEmployees = offices.reduce((sum, o) => sum + o.employees, 0);
  const activeOffices = offices.filter((o) => o.status === "Active").length;
  const activeDepartments = departments.filter((d) => d.status === "Active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Setup"
        description="Configure organization profile, offices, departments, and fiscal year"
      >
        <Button size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Organization
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{totalEmployees}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">across all offices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Offices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <p className="text-2xl font-bold">{activeOffices}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">of {offices.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-500" />
              <p className="text-2xl font-bold">{activeDepartments}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">active departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Established</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">2005</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">21 years of service</p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Profile + Fiscal Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Organization Profile</CardTitle>
                <CardDescription>Legal registration and identity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name (English)</span>
                <span className="font-medium text-right max-w-[60%]">{orgInfo.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name (Bangla)</span>
                <span className="font-medium text-right max-w-[60%]">{orgInfo.banglaName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Registration No</span>
                <span className="font-medium text-right max-w-[60%]">{orgInfo.registrationNo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">NGOAB License</span>
                <span className="font-medium">{orgInfo.ngoabLicense}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TIN</span>
                <span className="font-mono font-medium">{orgInfo.tin}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">BIN (VAT)</span>
                <span className="font-mono font-medium">{orgInfo.bin}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Executive Director</span>
                <span className="font-medium">{orgInfo.executiveDirector}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chairperson</span>
                <span className="font-medium">{orgInfo.chairperson}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                  <CardDescription>Addresses and communication</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Registered Address</p>
                    <p className="font-medium">{orgInfo.registeredAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Head Office</p>
                    <p className="font-medium">{orgInfo.headOffice}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{orgInfo.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{orgInfo.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{orgInfo.website}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Fiscal Year & Currency</CardTitle>
                  <CardDescription>Financial year and format settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fiscalYearSettings.map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Departments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Departments</CardTitle>
                <CardDescription>{activeDepartments} active departments with {totalEmployees} total staff</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">Add Department</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Department Head</TableHead>
                <TableHead className="text-center">Employees</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-mono text-sm">{dept.id}</TableCell>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-sm">{dept.head}</TableCell>
                  <TableCell className="text-center text-sm">{dept.employees}</TableCell>
                  <TableCell>
                    <Badge variant={dept.status === "Active" ? "default" : "secondary"}>
                      {dept.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Offices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Office Locations</CardTitle>
                <CardDescription>{activeOffices} active offices across Bangladesh</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">Add Office</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">ID</TableHead>
                <TableHead>Office Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Staff</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offices.map((office) => (
                <TableRow key={office.id}>
                  <TableCell className="font-mono text-sm">{office.id}</TableCell>
                  <TableCell className="font-medium">{office.name}</TableCell>
                  <TableCell>
                    <Badge variant={getOfficeTypeVariant(office.type)}>{office.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{office.district}</TableCell>
                  <TableCell className="text-sm">{office.contactPerson}</TableCell>
                  <TableCell className="font-mono text-xs">{office.phone}</TableCell>
                  <TableCell className="text-center text-sm">{office.employees}</TableCell>
                  <TableCell>
                    <Badge variant={office.status === "Active" ? "default" : "secondary"}>
                      {office.status}
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
