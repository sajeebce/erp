import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KPICardData } from "@/types";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export function KPICard({ title, value, change, changeType, icon: Icon, description }: KPICardData) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs">
          {changeType === "positive" && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
          {changeType === "negative" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
          {changeType === "neutral" && <Minus className="h-3 w-3 text-amber-500" />}
          <span className={cn(
            "font-medium",
            changeType === "positive" && "text-emerald-500",
            changeType === "negative" && "text-red-500",
            changeType === "neutral" && "text-amber-500",
          )}>
            {change}
          </span>
          <span className="text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}
