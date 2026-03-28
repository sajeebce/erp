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
import { Plus, Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface ServiceDelivery {
  id: string;
  beneficiary: string;
  serviceType: "Health Checkup" | "Training" | "Asset Distribution" | "Cash Transfer" | "Counseling";
  date: string;
  location: string;
  deliveredBy: string;
  quantityValue: string;
  status: "Delivered" | "Scheduled" | "Cancelled";
}

const services: ServiceDelivery[] = [
  {
    id: "SRV-001",
    beneficiary: "Fatima Begum",
    serviceType: "Health Checkup",
    date: "2026-01-15",
    location: "Golapganj Health Center, Sylhet",
    deliveredBy: "Dr. Sharmin Akter",
    quantityValue: "1 Visit",
    status: "Delivered",
  },
  {
    id: "SRV-002",
    beneficiary: "Abdul Karim",
    serviceType: "Cash Transfer",
    date: "2026-01-18",
    location: "Pirganj Branch Office, Rangpur",
    deliveredBy: "Mizanur Rahman",
    quantityValue: "৳5,000",
    status: "Delivered",
  },
  {
    id: "SRV-003",
    beneficiary: "Jahanara Parvin",
    serviceType: "Training",
    date: "2026-02-01",
    location: "Godagari Training Center, Rajshahi",
    deliveredBy: "Shahidul Islam",
    quantityValue: "3-Day Workshop",
    status: "Scheduled",
  },
  {
    id: "SRV-004",
    beneficiary: "Nurul Islam",
    serviceType: "Asset Distribution",
    date: "2026-01-10",
    location: "Trishal Field Office, Mymensingh",
    deliveredBy: "Kamrul Hasan",
    quantityValue: "10 kg Seeds + Tools",
    status: "Delivered",
  },
  {
    id: "SRV-005",
    beneficiary: "Salma Akhter",
    serviceType: "Health Checkup",
    date: "2026-01-22",
    location: "Beanibazar Clinic, Sylhet",
    deliveredBy: "Dr. Nasreen Jahan",
    quantityValue: "1 Visit",
    status: "Delivered",
  },
  {
    id: "SRV-006",
    beneficiary: "Taslima Nasreen",
    serviceType: "Counseling",
    date: "2026-02-05",
    location: "Savar Community Center, Dhaka",
    deliveredBy: "Rubina Yasmin",
    quantityValue: "2 Sessions",
    status: "Scheduled",
  },
  {
    id: "SRV-007",
    beneficiary: "Mohammad Rafiq",
    serviceType: "Asset Distribution",
    date: "2026-01-08",
    location: "Patiya School, Chittagong",
    deliveredBy: "Anwar Hossain",
    quantityValue: "School Kit (Books + Bag)",
    status: "Delivered",
  },
  {
    id: "SRV-008",
    beneficiary: "Rahima Akter",
    serviceType: "Cash Transfer",
    date: "2025-12-20",
    location: "Bakerganj Branch, Barishal",
    deliveredBy: "Faruk Ahmed",
    quantityValue: "৳3,500",
    status: "Cancelled",
  },
  {
    id: "SRV-009",
    beneficiary: "Mokbul Hossain",
    serviceType: "Training",
    date: "2026-02-10",
    location: "Dumuria Center, Khulna",
    deliveredBy: "Rezaul Karim",
    quantityValue: "5-Day Course",
    status: "Scheduled",
  },
  {
    id: "SRV-010",
    beneficiary: "Amina Khatun",
    serviceType: "Health Checkup",
    date: "2026-01-25",
    location: "Sitakunda Upazila Hospital, Chittagong",
    deliveredBy: "Dr. Tahmina Begum",
    quantityValue: "1 Visit",
    status: "Delivered",
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Delivered": return "default";
    case "Scheduled": return "secondary";
    case "Cancelled": return "destructive";
    default: return "outline";
  }
}

function getServiceBadgeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "Health Checkup": return "default";
    case "Training": return "secondary";
    case "Cash Transfer": return "default";
    case "Asset Distribution": return "outline";
    case "Counseling": return "secondary";
    default: return "outline";
  }
}

export default async function ServiceDeliveryPage() {
  const t = await getTranslations('beneficiaries');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const totalServices = services.length;
  const deliveredThisMonth = services.filter(
    (s) => s.status === "Delivered" && s.date.startsWith("2026-01")
  ).length;
  const pending = services.filter((s) => s.status === "Scheduled").length;
  const uniqueBeneficiaries = new Set(services.filter((s) => s.status === "Delivered").map((s) => s.beneficiary)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('serviceDelivery.title')}
        description={t('serviceDelivery.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('serviceDelivery.addService')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('serviceDelivery.totalServices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalServices}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('serviceDelivery.deliveredThisMonth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{deliveredThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('serviceDelivery.pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('serviceDelivery.beneficiariesReached')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{uniqueBeneficiaries}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('serviceDelivery.serviceDeliveryLog')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">{t('serviceDelivery.serviceId')}</TableHead>
                <TableHead>{t('serviceDelivery.beneficiary')}</TableHead>
                <TableHead>{t('serviceDelivery.serviceType')}</TableHead>
                <TableHead>{t('serviceDelivery.date')}</TableHead>
                <TableHead>{t('serviceDelivery.location')}</TableHead>
                <TableHead>{t('serviceDelivery.deliveredBy')}</TableHead>
                <TableHead>{t('serviceDelivery.quantityValue')}</TableHead>
                <TableHead>{tc('labels.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-mono text-sm">{service.id}</TableCell>
                  <TableCell className="font-medium">{service.beneficiary}</TableCell>
                  <TableCell>
                    <Badge variant={getServiceBadgeVariant(service.serviceType)} className="text-[10px]">
                      {service.serviceType}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(service.date, locale)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{service.location}</TableCell>
                  <TableCell>{service.deliveredBy}</TableCell>
                  <TableCell>{service.quantityValue}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(service.status)}>
                      {service.status}
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
