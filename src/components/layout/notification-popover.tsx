"use client";

import { useTranslations } from "next-intl";
import { Bell, CheckCircle2, AlertTriangle, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const notifications = [
  {
    id: 1,
    type: "success" as const,
    title: "Grant Approved",
    message: "USAID WASH Phase-3 grant of ৳4.5 Cr approved",
    time: "2 min ago",
    unread: true,
  },
  {
    id: 2,
    type: "warning" as const,
    title: "Budget Overrun Alert",
    message: "Education project Q4 budget exceeded by 12%",
    time: "15 min ago",
    unread: true,
  },
  {
    id: 3,
    type: "info" as const,
    title: "New Donor Report Due",
    message: "World Bank quarterly report due in 3 days",
    time: "1 hr ago",
    unread: true,
  },
  {
    id: 4,
    type: "info" as const,
    title: "Payroll Processed",
    message: "February 2026 payroll for 156 employees processed",
    time: "3 hrs ago",
    unread: false,
  },
  {
    id: 5,
    type: "warning" as const,
    title: "Procurement Pending",
    message: "3 purchase orders awaiting approval",
    time: "5 hrs ago",
    unread: false,
  },
];

const iconMap = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: "text-emerald-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

export function NotificationPopover() {
  const t = useTranslations("navigation");
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="text-sm font-semibold">{t("notifications")}</h4>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            {t("markAllRead")}
          </Button>
        </div>
        <Separator />
        <ScrollArea className="h-[320px]">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type];
            return (
              <div
                key={notification.id}
                className={`flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  notification.unread ? "bg-muted/30" : ""
                }`}
              >
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${colorMap[notification.type]}`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {notification.title}
                    {notification.unread && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {notification.time}
                  </p>
                </div>
              </div>
            );
          })}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            {t("viewAllNotifications")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
