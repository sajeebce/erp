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
import { Plus, Download, Star } from "lucide-react";
import { formatNumber } from "@/lib/formatters";

interface Vendor {
  id: string;
  companyName: string;
  category: "Supplier" | "Contractor" | "Service Provider";
  contactPerson: string;
  phone: string;
  email: string;
  rating: number;
  totalOrders: number;
  active: boolean;
}

const vendors: Vendor[] = [
  {
    id: "VND-001",
    companyName: "Bengal Office Solutions Ltd.",
    category: "Supplier",
    contactPerson: "Rafiqul Islam",
    phone: "+880-2-9876543",
    email: "info@bengaloffice.com.bd",
    rating: 4.5,
    totalOrders: 24,
    active: true,
  },
  {
    id: "VND-002",
    companyName: "Dhaka IT Hub",
    category: "Supplier",
    contactPerson: "Shakil Ahmed",
    phone: "+880-2-8765432",
    email: "sales@dhakait.com.bd",
    rating: 4.2,
    totalOrders: 18,
    active: true,
  },
  {
    id: "VND-003",
    companyName: "Padma Medical Supplies",
    category: "Supplier",
    contactPerson: "Dr. Farida Begum",
    phone: "+880-31-654321",
    email: "orders@padmamedical.com",
    rating: 4.8,
    totalOrders: 31,
    active: true,
  },
  {
    id: "VND-004",
    companyName: "Green Agro Bangladesh",
    category: "Supplier",
    contactPerson: "Abul Bashar",
    phone: "+880-91-543210",
    email: "contact@greenagro.com.bd",
    rating: 3.9,
    totalOrders: 12,
    active: true,
  },
  {
    id: "VND-005",
    companyName: "Meghna Construction Co.",
    category: "Contractor",
    contactPerson: "Engr. Zahidul Haque",
    phone: "+880-2-7654321",
    email: "projects@meghnacon.com",
    rating: 4.0,
    totalOrders: 8,
    active: true,
  },
  {
    id: "VND-006",
    companyName: "Sundarbans Solar Energy",
    category: "Contractor",
    contactPerson: "Tanvir Rahman",
    phone: "+880-2-6543210",
    email: "solar@sundarbans-energy.com",
    rating: 4.3,
    totalOrders: 5,
    active: true,
  },
  {
    id: "VND-007",
    companyName: "Chittagong Transport Services",
    category: "Service Provider",
    contactPerson: "Mosharraf Karim",
    phone: "+880-31-765432",
    email: "booking@ctgtransport.com.bd",
    rating: 3.5,
    totalOrders: 15,
    active: false,
  },
  {
    id: "VND-008",
    companyName: "Jamuna Stationery House",
    category: "Supplier",
    contactPerson: "Nazrul Islam",
    phone: "+880-2-5432109",
    email: "sales@jamunastationery.com",
    rating: 4.1,
    totalOrders: 22,
    active: true,
  },
  {
    id: "VND-009",
    companyName: "Delta Consulting Group",
    category: "Service Provider",
    contactPerson: "Tasneem Sultana",
    phone: "+880-2-4321098",
    email: "info@deltaconsulting.com.bd",
    rating: 4.6,
    totalOrders: 7,
    active: true,
  },
  {
    id: "VND-010",
    companyName: "Rupsha Printing & Publishing",
    category: "Service Provider",
    contactPerson: "Mahbubur Rahman",
    phone: "+880-41-321098",
    email: "print@rupshapress.com",
    rating: 3.8,
    totalOrders: 10,
    active: true,
  },
];

function getCategoryVariant(category: string): "default" | "secondary" | "outline" {
  switch (category) {
    case "Supplier": return "default";
    case "Contractor": return "secondary";
    case "Service Provider": return "outline";
    default: return "outline";
  }
}

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />);
    } else if (i === fullStars && hasHalf) {
      stars.push(<Star key={i} className="h-3.5 w-3.5 fill-amber-400/50 text-amber-400" />);
    } else {
      stars.push(<Star key={i} className="h-3.5 w-3.5 text-muted-foreground/30" />);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

export default function VendorsPage() {
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.active).length;
  const newThisYear = 3;
  const avgRating = (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Management"
        description="Manage vendor registry and performance tracking"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalVendors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeVendors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New This Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{newThisYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgRating} / 5</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Vendor ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-center">Total Orders</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-mono text-sm">{vendor.id}</TableCell>
                  <TableCell className="font-medium">{vendor.companyName}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryVariant(vendor.category)} className="text-[10px]">
                      {vendor.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{vendor.contactPerson}</TableCell>
                  <TableCell className="text-sm">{vendor.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{vendor.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {renderStars(vendor.rating)}
                      <span className="text-xs text-muted-foreground">({vendor.rating})</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{vendor.totalOrders}</TableCell>
                  <TableCell>
                    <Badge variant={vendor.active ? "default" : "outline"}>
                      {vendor.active ? "Active" : "Inactive"}
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
