import { type LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: NavSubItem[];
  badge?: string;
  allowedRoles?: string[]; // undefined = ADMIN only; ['*'] = all roles; specific list = those + ADMIN
}

export interface NavSubItem {
  title: string;
  url: string;
  items?: NavSubItem[];
  allowedRoles?: string[]; // same semantics as NavItem.allowedRoles
}

export interface KPICardData {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  description: string;
}
