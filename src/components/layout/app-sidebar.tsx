"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Building } from "lucide-react";
import { navigation } from "@/data/navigation";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Core",
    borderClass: "border-l-blue-500/40",
    dotClass: "bg-blue-500",
    urls: ["/dashboard", "/finance", "/budget"],
  },
  {
    label: "Programs",
    borderClass: "border-l-emerald-500/40",
    dotClass: "bg-emerald-500",
    urls: ["/donors", "/projects", "/beneficiaries"],
  },
  {
    label: "Operations",
    borderClass: "border-l-amber-500/40",
    dotClass: "bg-amber-500",
    urls: ["/procurement", "/assets", "/hr", "/microfinance"],
  },
  {
    label: "System",
    borderClass: "border-l-slate-400/40",
    dotClass: "bg-slate-400",
    urls: ["/reports", "/settings"],
  },
].map((group) => ({
  ...group,
  items: navigation.filter((n) => group.urls.includes(n.url)),
}));

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">NGO ERP</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Management System
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group, groupIndex) => (
          <div key={group.label}>
            {groupIndex > 0 && <SidebarSeparator className="mx-3" />}
            <SidebarGroup
              className={cn(
                "border-l-2 transition-[border-color] duration-200",
                group.borderClass,
                "group-data-[collapsible=icon]:border-l-0"
              )}
            >
              <SidebarGroupLabel className="uppercase tracking-wider text-[10px]">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full mr-2 shrink-0",
                    group.dotClass
                  )}
                />
                {group.label}
              </SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={pathname.startsWith(item.url)}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={
                            pathname === item.url ||
                            pathname.startsWith(item.url + "/")
                          }
                        >
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          {item.items && item.items.length > 0 && (
                            <ChevronRight className="ml-auto transition-transform duration-200 ease-in-out group-data-[state=open]/collapsible:rotate-90" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {item.items && item.items.length > 0 && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.url}
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Admin User</span>
                <span className="truncate text-xs text-muted-foreground">
                  admin@ngo-erp.org
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
