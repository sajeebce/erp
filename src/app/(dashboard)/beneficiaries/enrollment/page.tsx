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
import { Plus, Download } from "lucide-react";
import { formatDate, formatPercent } from "@/lib/formatters";

interface Enrollment {
  id: string;
  beneficiaryName: string;
  program: string;
  enrollmentDate: string;
  district: string;
  upazila: string;
  servicesAssigned: string[];
  status: "Active" | "Graduated" | "Dropped Out" | "Waitlisted";
}

const enrollments: Enrollment[] = [
  {
    id: "ENR-001",
    beneficiaryName: "Fatima Begum",
    program: "WASH Program - Sylhet",
    enrollmentDate: "2025-08-15",
    district: "Sylhet",
    upazila: "Golapganj",
    servicesAssigned: ["Health Checkup", "Hygiene Training"],
    status: "Active",
  },
  {
    id: "ENR-002",
    beneficiaryName: "Mohammad Rafiq",
    program: "Primary Education Enhancement",
    enrollmentDate: "2025-07-20",
    district: "Chittagong",
    upazila: "Patiya",
    servicesAssigned: ["School Supplies", "Tutoring"],
    status: "Active",
  },
  {
    id: "ENR-003",
    beneficiaryName: "Amina Khatun",
    program: "Maternal Health - Chattogram",
    enrollmentDate: "2025-06-10",
    district: "Chittagong",
    upazila: "Sitakunda",
    servicesAssigned: ["Prenatal Care", "Nutrition Support"],
    status: "Graduated",
  },
  {
    id: "ENR-004",
    beneficiaryName: "Abdul Karim",
    program: "Microfinance Expansion",
    enrollmentDate: "2025-09-01",
    district: "Rangpur",
    upazila: "Pirganj",
    servicesAssigned: ["Loan Disbursement", "Financial Literacy"],
    status: "Active",
  },
  {
    id: "ENR-005",
    beneficiaryName: "Rahima Akter",
    program: "Climate Resilience - Barishal",
    enrollmentDate: "2025-05-22",
    district: "Barishal",
    upazila: "Bakerganj",
    servicesAssigned: ["Disaster Preparedness", "Asset Distribution"],
    status: "Dropped Out",
  },
  {
    id: "ENR-006",
    beneficiaryName: "Jahanara Parvin",
    program: "Youth Skills Development",
    enrollmentDate: "2025-10-05",
    district: "Rajshahi",
    upazila: "Godagari",
    servicesAssigned: ["Vocational Training", "Job Placement"],
    status: "Active",
  },
  {
    id: "ENR-007",
    beneficiaryName: "Nurul Islam",
    program: "Food Security - Mymensingh",
    enrollmentDate: "2025-04-18",
    district: "Mymensingh",
    upazila: "Trishal",
    servicesAssigned: ["Seed Distribution", "Agricultural Training"],
    status: "Graduated",
  },
  {
    id: "ENR-008",
    beneficiaryName: "Salma Akhter",
    program: "WASH Program - Sylhet",
    enrollmentDate: "2025-11-12",
    district: "Sylhet",
    upazila: "Beanibazar",
    servicesAssigned: ["Safe Water Access", "Sanitation Kit"],
    status: "Active",
  },
  {
    id: "ENR-009",
    beneficiaryName: "Mokbul Hossain",
    program: "Primary Education Enhancement",
    enrollmentDate: "2025-12-01",
    district: "Khulna",
    upazila: "Dumuria",
    servicesAssigned: ["School Enrollment", "Uniforms"],
    status: "Waitlisted",
  },
  {
    id: "ENR-010",
    beneficiaryName: "Taslima Nasreen",
    program: "Maternal Health - Chattogram",
    enrollmentDate: "2026-01-08",
    district: "Dhaka",
    upazila: "Savar",
    servicesAssigned: ["Postnatal Care", "Counseling"],
    status: "Active",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Active": return "default";
    case "Graduated": return "secondary";
    case "Dropped Out": return "destructive";
    case "Waitlisted": return "outline";
    default: return "outline";
  }
}

export default function BeneficiaryEnrollmentPage() {
  const totalEnrolled = enrollments.length;
  const active = enrollments.filter((e) => e.status === "Active").length;
  const graduated = enrollments.filter((e) => e.status === "Graduated").length;
  const droppedOut = enrollments.filter((e) => e.status === "Dropped Out").length;
  const dropoutRate = (droppedOut / totalEnrolled) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beneficiary Enrollment"
        description="Manage beneficiary enrollment and program registration"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Enrollment
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalEnrolled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Graduated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{graduated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dropout Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(dropoutRate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Register</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Enrollment ID</TableHead>
                <TableHead>Beneficiary Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Upazila</TableHead>
                <TableHead>Services Assigned</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-mono text-sm">{enrollment.id}</TableCell>
                  <TableCell className="font-medium">{enrollment.beneficiaryName}</TableCell>
                  <TableCell>{enrollment.program}</TableCell>
                  <TableCell>{formatDate(enrollment.enrollmentDate)}</TableCell>
                  <TableCell>{enrollment.district}</TableCell>
                  <TableCell>{enrollment.upazila}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {enrollment.servicesAssigned.map((service) => (
                        <Badge key={service} variant="outline" className="text-[10px]">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(enrollment.status)}>
                      {enrollment.status}
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
