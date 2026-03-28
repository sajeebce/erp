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
import { Download } from "lucide-react";
import { formatPercent } from "@/lib/formatters";

interface PerformanceReview {
  employee: string;
  department: string;
  reviewPeriod: string;
  selfScore: number;
  supervisorScore: number;
  finalScore: number;
  rating: "Outstanding" | "Exceeds Expectations" | "Meets Expectations" | "Below Expectations" | "Unsatisfactory";
  status: "Completed" | "In Progress" | "Not Started";
}

const reviews: PerformanceReview[] = [
  {
    employee: "Dr. Aminul Haque",
    department: "Management",
    reviewPeriod: "Jul - Dec 2025",
    selfScore: 92,
    supervisorScore: 95,
    finalScore: 94,
    rating: "Outstanding",
    status: "Completed",
  },
  {
    employee: "Nasreen Sultana",
    department: "Finance & Accounts",
    reviewPeriod: "Jul - Dec 2025",
    selfScore: 88,
    supervisorScore: 90,
    finalScore: 89,
    rating: "Exceeds Expectations",
    status: "Completed",
  },
  {
    employee: "Md. Rafiqul Islam",
    department: "Programs",
    reviewPeriod: "Jul - Dec 2025",
    selfScore: 85,
    supervisorScore: 82,
    finalScore: 83,
    rating: "Exceeds Expectations",
    status: "Completed",
  },
  {
    employee: "Fatima Akter Ruma",
    department: "Human Resources",
    reviewPeriod: "Jul - Dec 2025",
    selfScore: 78,
    supervisorScore: 80,
    finalScore: 79,
    rating: "Meets Expectations",
    status: "Completed",
  },
  {
    employee: "Shahin Ahmed",
    department: "Programs",
    reviewPeriod: "Jul - Dec 2025",
    selfScore: 80,
    supervisorScore: 76,
    finalScore: 78,
    rating: "Meets Expectations",
    status: "Completed",
  },
  {
    employee: "Tahmina Khanam",
    department: "M&E",
    reviewPeriod: "Jul - Dec 2025",
    selfScore: 90,
    supervisorScore: 92,
    finalScore: 91,
    rating: "Outstanding",
    status: "Completed",
  },
  {
    employee: "Kamal Hossain",
    department: "Programs",
    reviewPeriod: "Jul - Dec 2025",
    selfScore: 65,
    supervisorScore: 58,
    finalScore: 61,
    rating: "Below Expectations",
    status: "Completed",
  },
  {
    employee: "Nusrat Jahan",
    department: "Finance & Accounts",
    reviewPeriod: "Jul - Dec 2025",
    selfScore: 82,
    supervisorScore: 85,
    finalScore: 84,
    rating: "Exceeds Expectations",
    status: "Completed",
  },
  {
    employee: "Md. Sohel Rana",
    department: "Programs",
    reviewPeriod: "Jul - Dec 2025",
    selfScore: 75,
    supervisorScore: 70,
    finalScore: 72,
    rating: "Meets Expectations",
    status: "In Progress",
  },
  {
    employee: "Rubina Yasmin",
    department: "Programs",
    reviewPeriod: "Jul - Dec 2025",
    selfScore: 0,
    supervisorScore: 0,
    finalScore: 0,
    rating: "Meets Expectations",
    status: "Not Started",
  },
];

function getRatingVariant(rating: string): "default" | "secondary" | "outline" | "destructive" {
  switch (rating) {
    case "Outstanding": return "default";
    case "Exceeds Expectations": return "secondary";
    case "Meets Expectations": return "outline";
    case "Below Expectations": return "destructive";
    case "Unsatisfactory": return "destructive";
    default: return "outline";
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "Completed": return "default";
    case "In Progress": return "secondary";
    case "Not Started": return "outline";
    default: return "outline";
  }
}

export default async function PerformancePage() {
  const t = await getTranslations('hr');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const completedReviews = reviews.filter((r) => r.status === "Completed");
  const completedCount = completedReviews.length;
  const avgScore = completedReviews.length > 0
    ? completedReviews.reduce((sum, r) => sum + r.finalScore, 0) / completedReviews.length
    : 0;
  const outstandingCount = reviews.filter((r) => r.rating === "Outstanding" && r.status === "Completed").length;
  const needsImprovement = reviews.filter(
    (r) => (r.rating === "Below Expectations" || r.rating === "Unsatisfactory") && r.status === "Completed"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('performance.title')}
        description={t('performance.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('performance.reviewsCompleted')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedCount}/{reviews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('performance.averageScore')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(avgScore, locale)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('performance.outstanding')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{outstandingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('performance.needsImprovement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{needsImprovement}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('performance.performanceReviews')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('performance.employee')}</TableHead>
                <TableHead>{t('performance.department')}</TableHead>
                <TableHead>{t('performance.period')}</TableHead>
                <TableHead className="text-right">{t('performance.selfScore')}</TableHead>
                <TableHead className="text-right">{t('performance.supervisorScore')}</TableHead>
                <TableHead className="text-right">{t('performance.finalScore')}</TableHead>
                <TableHead>{t('performance.rating')}</TableHead>
                <TableHead>{tc('labels.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.employee}>
                  <TableCell className="font-medium">{review.employee}</TableCell>
                  <TableCell>{review.department}</TableCell>
                  <TableCell>{review.reviewPeriod}</TableCell>
                  <TableCell className="text-right font-mono">
                    {review.status === "Not Started" ? <span className="text-muted-foreground">--</span> : review.selfScore}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {review.status === "Not Started" ? <span className="text-muted-foreground">--</span> : review.supervisorScore}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {review.status === "Not Started" ? <span className="text-muted-foreground">--</span> : review.finalScore}
                  </TableCell>
                  <TableCell>
                    {review.status === "Not Started" ? (
                      <span className="text-muted-foreground text-sm">--</span>
                    ) : (
                      <Badge variant={getRatingVariant(review.rating)}>{review.rating}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(review.status)}>{review.status}</Badge>
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
