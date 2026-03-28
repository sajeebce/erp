import { getTranslations } from 'next-intl/server';
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

interface LogFrameRow {
  level: "Goal" | "Purpose" | "Output" | "Activity";
  narrative: string;
  indicators: string;
  meansOfVerification: string;
  assumptions: string;
}

const logframeData: LogFrameRow[] = [
  {
    level: "Goal",
    narrative: "Improved public health outcomes and reduced waterborne diseases in Sylhet Division",
    indicators: "30% reduction in waterborne disease incidence in target upazilas by 2027; Under-5 diarrheal mortality reduced by 40%",
    meansOfVerification: "District Health Information System (DHIS2) records; Upazila Health Complex reports; National WASH survey data",
    assumptions: "Government health infrastructure remains functional; No major natural disasters disrupt baseline conditions",
  },
  {
    level: "Purpose",
    narrative: "Target communities in Sylhet Division have sustained access to safe water, improved sanitation, and practice good hygiene behaviors",
    indicators: "80% of target HHs using improved water sources; 70% of target HHs with access to improved sanitation; 60% handwashing with soap at critical times",
    meansOfVerification: "Annual KAP (Knowledge, Attitude, Practice) surveys; Household monitoring data; Third-party evaluation reports",
    assumptions: "Community participation remains strong; Local government cooperates with implementation; Water table levels remain viable",
  },
  {
    level: "Output",
    narrative: "Output 1: Safe water supply infrastructure installed and functional in target communities",
    indicators: "200 tube wells installed across 5 upazilas; 95% of installed tube wells functional after 12 months; 15,000 households with new water access",
    meansOfVerification: "Installation completion reports; GPS-mapped asset register; Quarterly functionality testing records; Beneficiary registration database",
    assumptions: "Suitable groundwater sources available; Spare parts supply chain functional; Community pump caretakers trained and active",
  },
  {
    level: "Output",
    narrative: "Output 2: Improved sanitation facilities constructed in schools and communities",
    indicators: "50 school WASH blocks constructed; 3,000 household latrines installed; 100% of school WASH blocks gender-segregated",
    meansOfVerification: "Construction completion certificates; School WASH monitoring checklists; Photo documentation & engineer inspection reports",
    assumptions: "Land availability for construction confirmed; Building materials available at budgeted costs; Schools cooperate with construction schedule",
  },
  {
    level: "Output",
    narrative: "Output 3: Communities adopt improved hygiene practices through behavior change campaigns",
    indicators: "50 Community Hygiene Promoters trained and active; 200 hygiene awareness sessions conducted; 80% of session participants demonstrate improved knowledge",
    meansOfVerification: "Training attendance records & pre/post test scores; Session reports with participant lists; Follow-up knowledge assessment surveys",
    assumptions: "Cultural acceptance of hygiene messages; Community leaders support behavior change; Media materials culturally appropriate",
  },
  {
    level: "Activity",
    narrative: "A1.1: Conduct hydrogeological survey and site selection for tube wells",
    indicators: "200 sites surveyed and approved within first 6 months; Survey reports completed for each selected site",
    meansOfVerification: "Hydrogeological survey reports; Site selection committee meeting minutes; GPS coordinates of approved sites",
    assumptions: "Qualified hydrogeologists available for hire; Access to target areas not restricted",
  },
  {
    level: "Activity",
    narrative: "A1.2: Procure materials and install tube wells",
    indicators: "200 tube wells installed by Month 18; Average installation time under 5 days per well",
    meansOfVerification: "Procurement records and invoices; Installation log books; Community handover certificates",
    assumptions: "Procurement process completes on schedule; Drilling contractors perform to specification",
  },
  {
    level: "Activity",
    narrative: "A2.1: Design and construct school WASH facilities",
    indicators: "50 WASH blocks designed and constructed by Month 24; All facilities meet national standards",
    meansOfVerification: "Architectural designs and BOQs; Construction progress reports; Final inspection certificates",
    assumptions: "School management committees provide oversight; No significant construction delays due to weather",
  },
  {
    level: "Activity",
    narrative: "A3.1: Recruit and train Community Hygiene Promoters",
    indicators: "50 CHPs recruited by Month 3; All CHPs complete 10-day training program",
    meansOfVerification: "Recruitment records; Training curriculum and attendance; Post-training competency assessment",
    assumptions: "Sufficient qualified candidates available in target communities; Training venues accessible",
  },
  {
    level: "Activity",
    narrative: "A3.2: Conduct community hygiene awareness sessions and campaigns",
    indicators: "200 sessions completed across 50 villages by Month 30; At least 40 participants per session on average",
    meansOfVerification: "Session attendance registers; IEC materials distribution log; Quarterly monitoring reports",
    assumptions: "Communities willing to participate; Seasonal calendar accommodated in planning",
  },
];

function getLevelBadgeVariant(level: string): "default" | "secondary" | "outline" {
  switch (level) {
    case "Goal": return "default";
    case "Purpose": return "default";
    case "Output": return "secondary";
    case "Activity": return "outline";
    default: return "outline";
  }
}

function getLevelRowClass(level: string): string {
  switch (level) {
    case "Goal": return "bg-primary/5 font-semibold";
    case "Purpose": return "bg-primary/5";
    case "Output": return "bg-muted/30";
    case "Activity": return "";
    default: return "";
  }
}

export default async function LogframePage() {
  const t = await getTranslations('projects');
  const tc = await getTranslations('common');

  const goalCount = logframeData.filter((r) => r.level === "Goal").length;
  const purposeCount = logframeData.filter((r) => r.level === "Purpose").length;
  const outputCount = logframeData.filter((r) => r.level === "Output").length;
  const activityCount = logframeData.filter((r) => r.level === "Activity").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('logFrame.title')}
        description={t('logFrame.description')}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {tc('buttons.export')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>WASH Program - Sylhet Division</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Grant: GRT-001 | Donor: USAID | Period: Jan 2024 - Dec 2026
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{goalCount} {t('logFrame.goal')}</Badge>
              <Badge variant="outline">{purposeCount} {t('logFrame.purpose')}</Badge>
              <Badge variant="secondary">{outputCount} {t('logFrame.outputs')}</Badge>
              <Badge variant="secondary">{activityCount} {t('logFrame.activities')}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">{t('logFrame.level')}</TableHead>
                <TableHead className="w-[22%]">{t('logFrame.narrativeSummary')}</TableHead>
                <TableHead className="w-[24%]">{t('logFrame.ovi')}</TableHead>
                <TableHead className="w-[24%]">{t('logFrame.mov')}</TableHead>
                <TableHead className="w-[22%]">{t('logFrame.assumptions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logframeData.map((row, index) => (
                <TableRow key={index} className={getLevelRowClass(row.level)}>
                  <TableCell>
                    <Badge variant={getLevelBadgeVariant(row.level)}>{row.level}</Badge>
                  </TableCell>
                  <TableCell className="text-sm align-top whitespace-normal leading-relaxed">
                    {row.narrative}
                  </TableCell>
                  <TableCell className="text-sm align-top whitespace-normal leading-relaxed text-muted-foreground">
                    {row.indicators}
                  </TableCell>
                  <TableCell className="text-sm align-top whitespace-normal leading-relaxed text-muted-foreground">
                    {row.meansOfVerification}
                  </TableCell>
                  <TableCell className="text-sm align-top whitespace-normal leading-relaxed text-muted-foreground">
                    {row.assumptions}
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
