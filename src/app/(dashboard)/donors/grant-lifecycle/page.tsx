import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download, Calendar, User, ArrowRight } from "lucide-react";
import { formatBDT, formatDate } from "@/lib/formatters";

const lifecycleStages = [
  "Identification",
  "Proposal",
  "Negotiation",
  "Agreement",
  "Implementation",
  "Closeout",
] as const;

type LifecycleStage = (typeof lifecycleStages)[number];

interface GrantLifecycle {
  id: string;
  title: string;
  donor: string;
  amount: number;
  currentStage: LifecycleStage;
  stageProgress: number;
  responsiblePerson: string;
  nextAction: string;
  nextActionDate: string;
  startDate: string;
  expectedEndDate: string;
}

const grantLifecycles: GrantLifecycle[] = [
  {
    id: "GRT-008",
    title: "Women Empowerment & Livelihood Program",
    donor: "USAID",
    amount: 32000000,
    currentStage: "Negotiation",
    stageProgress: 60,
    responsiblePerson: "Tahmina Rahman",
    nextAction: "Submit revised budget to USAID Mission",
    nextActionDate: "2026-02-15",
    startDate: "2025-09-01",
    expectedEndDate: "2026-06-30",
  },
  {
    id: "GRT-001",
    title: "WASH Phase-3 - Safe Water & Sanitation",
    donor: "USAID",
    amount: 25000000,
    currentStage: "Implementation",
    stageProgress: 65,
    responsiblePerson: "Md. Rashidul Islam",
    nextAction: "Q1 2026 progress report submission",
    nextActionDate: "2026-03-15",
    startDate: "2024-01-15",
    expectedEndDate: "2026-12-31",
  },
  {
    id: "GRT-011",
    title: "Digital Literacy for Rural Youth",
    donor: "SDC",
    amount: 12000000,
    currentStage: "Proposal",
    stageProgress: 75,
    responsiblePerson: "Sharmin Akter",
    nextAction: "Finalize concept note & submit to SDC",
    nextActionDate: "2026-02-20",
    startDate: "2025-12-01",
    expectedEndDate: "2026-05-15",
  },
  {
    id: "GRT-004",
    title: "Climate Adaptation Fund - Coastal Resilience",
    donor: "DFID/FCDO",
    amount: 35000000,
    currentStage: "Implementation",
    stageProgress: 30,
    responsiblePerson: "Kamal Hossain",
    nextAction: "Mid-term evaluation preparation",
    nextActionDate: "2026-04-01",
    startDate: "2024-10-01",
    expectedEndDate: "2028-09-30",
  },
  {
    id: "GRT-012",
    title: "Renewable Energy Access for Off-Grid Communities",
    donor: "JICA",
    amount: 20000000,
    currentStage: "Identification",
    stageProgress: 40,
    responsiblePerson: "Aminul Haque",
    nextAction: "Complete needs assessment & stakeholder mapping",
    nextActionDate: "2026-03-01",
    startDate: "2026-01-15",
    expectedEndDate: "2026-08-01",
  },
  {
    id: "GRT-007",
    title: "Food Security & Nutrition Program",
    donor: "JICA",
    amount: 28000000,
    currentStage: "Closeout",
    stageProgress: 70,
    responsiblePerson: "Fatema Akhter",
    nextAction: "Submit final financial report & asset disposition plan",
    nextActionDate: "2026-02-28",
    startDate: "2022-03-01",
    expectedEndDate: "2026-04-30",
  },
];

function getStageIndex(stage: LifecycleStage): number {
  return lifecycleStages.indexOf(stage);
}

function getOverallProgress(stage: LifecycleStage, stageProgress: number): number {
  const stageIndex = getStageIndex(stage);
  const stageWeight = 100 / lifecycleStages.length;
  return Math.round(stageIndex * stageWeight + (stageProgress / 100) * stageWeight);
}

function getStageBadgeVariant(stage: LifecycleStage): "default" | "secondary" | "outline" {
  switch (stage) {
    case "Identification":
    case "Proposal": return "outline";
    case "Negotiation":
    case "Agreement": return "secondary";
    case "Implementation": return "default";
    case "Closeout": return "secondary";
    default: return "outline";
  }
}

export default function GrantLifecyclePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Grant Lifecycle Tracker"
        description="Track grants through identification, proposal, negotiation, agreement, implementation, and closeout"
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {grantLifecycles.filter((g) => ["Identification", "Proposal", "Negotiation", "Agreement"].includes(g.currentStage)).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {grantLifecycles.filter((g) => g.currentStage === "Implementation").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Closeout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {grantLifecycles.filter((g) => g.currentStage === "Closeout").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {grantLifecycles.map((grant) => {
          const currentStageIndex = getStageIndex(grant.currentStage);
          const overallProgress = getOverallProgress(grant.currentStage, grant.stageProgress);

          return (
            <Card key={grant.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{grant.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-mono">{grant.id}</span> | {grant.donor} | {formatBDT(grant.amount)}
                    </p>
                  </div>
                  <Badge variant={getStageBadgeVariant(grant.currentStage)}>
                    {grant.currentStage}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stage Progress Indicator */}
                <div className="flex items-center gap-1">
                  {lifecycleStages.map((stage, index) => (
                    <div key={stage} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`h-2 w-full rounded-full ${
                            index < currentStageIndex
                              ? "bg-primary"
                              : index === currentStageIndex
                                ? "bg-primary/60"
                                : "bg-muted"
                          }`}
                        />
                        <span
                          className={`text-[9px] mt-1 text-center leading-tight ${
                            index <= currentStageIndex
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {stage}
                        </span>
                      </div>
                      {index < lifecycleStages.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 mx-0.5" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Overall Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} />
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(grant.startDate)} - {formatDate(grant.expectedEndDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{grant.responsiblePerson}</span>
                  </div>
                </div>

                {/* Next Action */}
                <div className="bg-muted/50 rounded-md p-2.5">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Next Action</p>
                  <p className="text-sm">{grant.nextAction}</p>
                  <p className="text-xs text-muted-foreground mt-1">Due: {formatDate(grant.nextActionDate)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
