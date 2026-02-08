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
import { Plus, Download, Search } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface Beneficiary {
  id: string;
  name: string;
  gender: "Male" | "Female" | "Other";
  age: number;
  district: string;
  upazila: string;
  program: string;
  enrollmentDate: string;
  status: "Active" | "Completed" | "Inactive" | "Transferred";
}

const beneficiaries: Beneficiary[] = [
  {
    id: "BEN-0001",
    name: "Fatema Begum",
    gender: "Female",
    age: 28,
    district: "Sylhet",
    upazila: "Golapganj",
    program: "WASH Program",
    enrollmentDate: "2024-02-15",
    status: "Active",
  },
  {
    id: "BEN-0002",
    name: "Md. Rahim Uddin",
    gender: "Male",
    age: 35,
    district: "Chattogram",
    upazila: "Sitakunda",
    program: "Maternal Health",
    enrollmentDate: "2024-03-01",
    status: "Active",
  },
  {
    id: "BEN-0003",
    name: "Rashida Khatun",
    gender: "Female",
    age: 22,
    district: "Rangpur",
    upazila: "Pirganj",
    program: "Youth Skills",
    enrollmentDate: "2024-06-10",
    status: "Active",
  },
  {
    id: "BEN-0004",
    name: "Abdul Karim Sheikh",
    gender: "Male",
    age: 45,
    district: "Barishal",
    upazila: "Bakerganj",
    program: "Climate Resilience",
    enrollmentDate: "2024-11-01",
    status: "Active",
  },
  {
    id: "BEN-0005",
    name: "Halima Akter",
    gender: "Female",
    age: 30,
    district: "Rajshahi",
    upazila: "Godagari",
    program: "Primary Education",
    enrollmentDate: "2023-08-15",
    status: "Completed",
  },
  {
    id: "BEN-0006",
    name: "Nurul Islam",
    gender: "Male",
    age: 40,
    district: "Mymensingh",
    upazila: "Trishal",
    program: "Food Security",
    enrollmentDate: "2024-04-20",
    status: "Active",
  },
  {
    id: "BEN-0007",
    name: "Sahana Parvin",
    gender: "Female",
    age: 25,
    district: "Khulna",
    upazila: "Dumuria",
    program: "Women Empowerment",
    enrollmentDate: "2025-01-05",
    status: "Active",
  },
  {
    id: "BEN-0008",
    name: "Mohammad Hasan",
    gender: "Male",
    age: 32,
    district: "Dhaka",
    upazila: "Savar",
    program: "Microfinance",
    enrollmentDate: "2023-05-10",
    status: "Inactive",
  },
  {
    id: "BEN-0009",
    name: "Taslima Nasreen",
    gender: "Female",
    age: 38,
    district: "Sylhet",
    upazila: "Beanibazar",
    program: "WASH Program",
    enrollmentDate: "2024-02-20",
    status: "Active",
  },
  {
    id: "BEN-0010",
    name: "Shafikul Alam",
    gender: "Male",
    age: 50,
    district: "Rangpur",
    upazila: "Mithapukur",
    program: "Food Security",
    enrollmentDate: "2024-05-15",
    status: "Transferred",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "Active": return "default";
    case "Completed": return "secondary";
    case "Inactive": return "outline";
    case "Transferred": return "destructive";
    default: return "outline";
  }
}

function getGenderVariant(gender: string): "default" | "secondary" | "outline" {
  switch (gender) {
    case "Female": return "secondary";
    case "Male": return "default";
    default: return "outline";
  }
}

export default function BeneficiariesPage() {
  const activeCount = beneficiaries.filter((b) => b.status === "Active").length;
  const totalCount = beneficiaries.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beneficiary Management"
        description="Manage beneficiary registry and program enrollment"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Register Beneficiary
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCount}</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Female</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{beneficiaries.filter((b) => b.gender === "Female").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Districts Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{new Set(beneficiaries.map((b) => b.district)).size}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Beneficiary Registry</CardTitle>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beneficiaries.map((beneficiary) => (
                <TableRow key={beneficiary.id}>
                  <TableCell className="font-mono text-sm">{beneficiary.id}</TableCell>
                  <TableCell className="font-medium">{beneficiary.name}</TableCell>
                  <TableCell>
                    <Badge variant={getGenderVariant(beneficiary.gender)} className="text-[10px]">
                      {beneficiary.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>{beneficiary.age}</TableCell>
                  <TableCell>{beneficiary.district}</TableCell>
                  <TableCell>{beneficiary.program}</TableCell>
                  <TableCell>{formatDate(beneficiary.enrollmentDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(beneficiary.status)}>{beneficiary.status}</Badge>
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
