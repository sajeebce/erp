"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, Building, ChevronsUpDown, LogOut, User, Settings } from "lucide-react";
import { navigation } from "@/data/navigation";
import { type NavItem, type NavSubItem } from "@/types";
import { cn } from "@/lib/utils";

function canSee(allowedRoles: string[] | undefined, roleName: string): boolean {
  if (roleName === "ADMIN") return true;
  if (allowedRoles === undefined) return false;
  if (allowedRoles.includes("*")) return true;
  return allowedRoles.includes(roleName);
}

function filterSubItems(items: NavSubItem[], roleName: string): NavSubItem[] {
  return items
    .filter((item) => canSee(item.allowedRoles, roleName))
    .map((item) => ({
      ...item,
      items: item.items ? filterSubItems(item.items, roleName) : undefined,
    }));
}

function filterNavigation(items: NavItem[], roleName: string): NavItem[] {
  return items
    .filter((item) => canSee(item.allowedRoles, roleName))
    .map((item) => ({
      ...item,
      items: item.items ? filterSubItems(item.items, roleName) : undefined,
    }));
}

const navGroups = [
  {
    labelKey: "groups.core" as const,
    borderClass: "border-l-blue-500/40",
    dotClass: "bg-blue-500",
    urls: ["/dashboard", "/finance", "/budget"],
  },
  {
    labelKey: "groups.programs" as const,
    borderClass: "border-l-emerald-500/40",
    dotClass: "bg-emerald-500",
    urls: ["/donors", "/projects", "/beneficiaries"],
  },
  {
    labelKey: "groups.operations" as const,
    borderClass: "border-l-amber-500/40",
    dotClass: "bg-amber-500",
    urls: ["/procurement", "/assets", "/hr", "/microfinance"],
  },
  {
    labelKey: "groups.system" as const,
    borderClass: "border-l-slate-400/40",
    dotClass: "bg-slate-400",
    urls: ["/reports", "/settings"],
  },
];

interface UserInfo {
  fullName: string;
  email: string;
  roleName: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("navigation");
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setUser({
            fullName: json.data.fullName,
            email: json.data.email,
            roleName: json.data.role?.name ?? "ADMIN",
          });
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    router.push("/login");
    router.refresh();
  }

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const roleName = user?.roleName ?? "ADMIN";
  const filteredNav = filterNavigation(navigation, roleName);

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: filteredNav.filter((n) => group.urls.includes(n.url)),
    }))
    .filter((group) => group.items.length > 0);

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
                  <span className="truncate font-semibold">{t("appName")}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t("appDesc")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {visibleGroups.map((group, groupIndex) => (
          <div key={group.labelKey}>
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
                {t(group.labelKey)}
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
                          tooltip={t(item.title)}
                          isActive={
                            pathname === item.url ||
                            pathname.startsWith(item.url + "/")
                          }
                        >
                          {item.icon && <item.icon />}
                          <span>{t(item.title)}</span>
                          {item.items && item.items.length > 0 && (
                            <ChevronRight className="ml-auto transition-transform duration-200 ease-in-out group-data-[state=open]/collapsible:rotate-90" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {item.items && item.items.length > 0 && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) =>
                              subItem.items && subItem.items.length > 0 ? (
                                <Collapsible
                                  key={subItem.url}
                                  asChild
                                  defaultOpen={pathname.startsWith(subItem.url)}
                                >
                                  <SidebarMenuSubItem>
                                    <CollapsibleTrigger asChild>
                                      <SidebarMenuSubButton
                                        isActive={pathname.startsWith(subItem.url)}
                                        className="cursor-pointer"
                                      >
                                        <span>{t(subItem.title)}</span>
                                        <ChevronRight className="ml-auto h-3 w-3 transition-transform duration-200 ease-in-out group-data-[state=open]/collapsible:rotate-90" />
                                      </SidebarMenuSubButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <SidebarMenuSub>
                                        {subItem.items.map((nestedItem) => (
                                          <SidebarMenuSubItem key={nestedItem.url}>
                                            <SidebarMenuSubButton
                                              asChild
                                              isActive={pathname === nestedItem.url}
                                            >
                                              <Link href={nestedItem.url}>
                                                <span>{t(nestedItem.title)}</span>
                                              </Link>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        ))}
                                      </SidebarMenuSub>
                                    </CollapsibleContent>
                                  </SidebarMenuSubItem>
                                </Collapsible>
                              ) : (
                                <SidebarMenuSubItem key={subItem.url}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname === subItem.url}
                                  >
                                    <Link href={subItem.url}>
                                      <span>{t(subItem.title)}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            )}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.fullName || "..."}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || ""}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuItem onClick={() => router.push("/settings/organization")}>
                  <User className="mr-2 h-4 w-4" />
                  {t("userMenu.profile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("userMenu.settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("userMenu.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
