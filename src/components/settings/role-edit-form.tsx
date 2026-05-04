"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Lock,
  Search,
  Copy,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Users,
  AlertTriangle,
  CheckCircle2,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface RoleListItem {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
  updatedAt?: string;
}

interface Permission {
  id: string;
  module: string;
  action: string;
  resource: string;
  description: string | null;
}

interface RoleDetails extends RoleListItem {
  permissions: Permission[];
}

interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  status: string;
  role: { id: string; name: string } | null;
}

const MODULE_GROUPS: Array<{ id: string; label: string; modules: string[] }> = [
  { id: "OPERATIONS", label: "Operations", modules: ["procurement", "assets", "beneficiaries", "projects"] },
  { id: "FINANCE", label: "Finance & Budget", modules: ["finance", "budget", "donors", "microfinance"] },
  { id: "PEOPLE", label: "People", modules: ["hr"] },
  { id: "ADMIN", label: "Admin", modules: ["settings", "reports"] },
];

const ACTION_ORDER = ["read", "create", "update", "delete", "approve", "export"];
const ACTION_LABELS: Record<string, string> = {
  read: "Read",
  create: "Create",
  update: "Update",
  delete: "Delete",
  approve: "Approve",
  export: "Export",
};

interface Props {
  roleId: string;
  backHref?: string;
}

export function RoleEditForm({ roleId, backHref = "/settings/roles" }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [details, setDetails] = useState<RoleDetails | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [otherRoles, setOtherRoles] = useState<RoleListItem[]>([]);
  const [members, setMembers] = useState<UserListItem[]>([]);

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<"permissions" | "members">("permissions");
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    void loadAll(roleId);
  }, [roleId]);

  async function loadAll(id: string) {
    setLoading(true);
    setNotFound(false);
    try {
      const [roleRes, permsRes, allRolesRes, usersRes] = await Promise.all([
        fetch(`/api/v1/settings/roles/${id}`),
        fetch("/api/v1/settings/permissions"),
        fetch("/api/v1/settings/roles"),
        fetch("/api/v1/settings/users?limit=200"),
      ]);
      const [roleJson, permsJson, allRolesJson, usersJson] = await Promise.all([
        roleRes.json(),
        permsRes.json(),
        allRolesRes.json(),
        usersRes.json(),
      ]);

      if (!roleJson.success) {
        setNotFound(true);
        return;
      }
      const det: RoleDetails = roleJson.data;
      setDetails(det);
      setEditName(det.name);
      setEditDesc(det.description ?? "");
      const ids = new Set(det.permissions.map((p) => p.id));
      setSelectedIds(ids);
      setInitialIds(new Set(ids));

      if (permsJson.success) setAllPermissions(permsJson.data as Permission[]);
      if (allRolesJson.success) {
        setOtherRoles((allRolesJson.data as RoleListItem[]).filter((r) => r.id !== id));
      }
      if (usersJson.success) {
        const all = usersJson.data as UserListItem[];
        setMembers(all.filter((u) => u.role?.id === id));
      }

      const firstWithPerms =
        MODULE_GROUPS.flatMap((g) => g.modules).find((m) =>
          (permsJson.data as Permission[]).some((p) => p.module === m)
        ) ?? null;
      setActiveModule(firstWithPerms);
    } finally {
      setLoading(false);
    }
  }

  // --- derived ---
  const permissionById = useMemo(
    () => new Map(allPermissions.map((p) => [p.id, p])),
    [allPermissions]
  );

  const permissionsByModule = useMemo(() => {
    const acc: Record<string, Permission[]> = {};
    for (const p of allPermissions) {
      acc[p.module] ??= [];
      acc[p.module].push(p);
    }
    return acc;
  }, [allPermissions]);

  const moduleStats = useMemo(() => {
    const stats: Record<string, { selected: number; total: number }> = {};
    for (const [m, perms] of Object.entries(permissionsByModule)) {
      stats[m] = {
        selected: perms.filter((p) => selectedIds.has(p.id)).length,
        total: perms.length,
      };
    }
    return stats;
  }, [permissionsByModule, selectedIds]);

  const activeModulePerms = useMemo(() => {
    if (!activeModule) return [] as Permission[];
    let perms = permissionsByModule[activeModule] ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      perms = perms.filter(
        (p) =>
          p.resource.toLowerCase().includes(q) ||
          p.action.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
      );
    }
    if (actionFilter) {
      perms = perms.filter((p) => p.action === actionFilter);
    }
    return perms;
  }, [permissionsByModule, activeModule, search, actionFilter]);

  const resourceGroupsInActiveModule = useMemo(() => {
    const acc: Record<string, Permission[]> = {};
    for (const p of activeModulePerms) {
      acc[p.resource] ??= [];
      acc[p.resource].push(p);
    }
    return acc;
  }, [activeModulePerms]);

  const diff = useMemo(() => {
    const added: string[] = [];
    const removed: string[] = [];
    for (const id of selectedIds) if (!initialIds.has(id)) added.push(id);
    for (const id of initialIds) if (!selectedIds.has(id)) removed.push(id);
    return { added, removed };
  }, [selectedIds, initialIds]);

  const hasChanges =
    diff.added.length > 0 ||
    diff.removed.length > 0 ||
    editName !== (details?.name ?? "") ||
    (editDesc || "") !== (details?.description ?? "");

  const userImpact = useMemo(() => {
    if (diff.removed.length === 0) return 0;
    return members.length;
  }, [diff.removed.length, members.length]);

  // --- mutators ---
  function togglePermission(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function bulkToggle(ids: string[], select: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (select) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }
  function toggleGroup(groupId: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }
  function revokeAll() {
    setSelectedIds(new Set());
    setShowConfirmReset(false);
  }
  async function copyFromRole(otherRoleId: string) {
    const res = await fetch(`/api/v1/settings/roles/${otherRoleId}`);
    const json = await res.json();
    if (json.success) {
      const det: RoleDetails = json.data;
      setSelectedIds(new Set(det.permissions.map((p) => p.id)));
    } else {
      setErrorMsg(json.error?.message ?? "Failed to copy permissions.");
    }
  }

  async function handleSave() {
    if (!details) return;
    if (!details.isSystem && !editName.trim()) {
      setErrorMsg("Role name is required.");
      return;
    }
    setSaving(true);
    setErrorMsg(null);

    const updatePayload: { name?: string; description: string | null } = {
      description: editDesc.trim() || null,
    };
    if (!details.isSystem) updatePayload.name = editName.trim();

    const [roleRes, permRes] = await Promise.all([
      fetch(`/api/v1/settings/roles/${details.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      }),
      fetch(`/api/v1/settings/roles/${details.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: Array.from(selectedIds) }),
      }),
    ]);
    const roleJson = await roleRes.json();
    const permJson = await permRes.json();

    if (roleJson.success && permJson.success) {
      router.push(backHref);
      router.refresh();
    } else {
      setErrorMsg(
        roleJson.error?.message ?? permJson.error?.message ?? "Failed to save changes."
      );
      setSaving(false);
    }
  }

  function cellState(perms: Permission[]): "all" | "some" | "none" {
    const sel = perms.filter((p) => selectedIds.has(p.id)).length;
    if (sel === 0) return "none";
    if (sel === perms.length) return "all";
    return "some";
  }

  // --- partials ---
  function renderModuleRail() {
    const totalSelected = selectedIds.size;
    const totalAll = allPermissions.length;
    return (
      <aside className="w-60 shrink-0 border-r overflow-y-auto bg-muted/20">
        <div className="px-3 pt-3 pb-2 text-xs font-medium text-muted-foreground">Modules</div>
        {MODULE_GROUPS.map((group) => {
          const collapsed = collapsedGroups.has(group.id);
          const visibleModules = group.modules.filter((m) => permissionsByModule[m]);
          if (visibleModules.length === 0) return null;
          return (
            <div key={group.id} className="mb-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/40"
              >
                {collapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {group.label}
              </button>
              {!collapsed &&
                visibleModules.map((moduleName) => {
                  const stat = moduleStats[moduleName] ?? { selected: 0, total: 0 };
                  const fully = stat.total > 0 && stat.selected === stat.total;
                  const partial = stat.selected > 0 && !fully;
                  const isActive = activeModule === moduleName;
                  return (
                    <button
                      key={moduleName}
                      onClick={() => setActiveModule(moduleName)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 border-l-2",
                        isActive
                          ? "bg-background border-l-primary font-medium"
                          : "border-l-transparent"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full border shrink-0",
                          fully
                            ? "bg-emerald-500 border-emerald-500"
                            : partial
                              ? "bg-amber-400 border-amber-400"
                              : "border-muted-foreground/40"
                        )}
                      />
                      <span className="capitalize flex-1 text-left truncate">{moduleName}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                        {stat.selected}/{stat.total}
                      </span>
                    </button>
                  );
                })}
            </div>
          );
        })}

        <div className="border-t mt-2 px-3 py-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="tabular-nums font-medium">
              {totalSelected} / {totalAll}
            </span>
          </div>
          <Progress value={totalAll > 0 ? (totalSelected / totalAll) * 100 : 0} className="h-1" />
        </div>
      </aside>
    );
  }

  function renderMatrix() {
    if (!activeModule) {
      return (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-12">
          Select a module from the left to view permissions.
        </div>
      );
    }
    const resourceEntries = Object.entries(resourceGroupsInActiveModule).sort(
      ([a], [b]) => a.localeCompare(b)
    );
    if (resourceEntries.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground py-12">
          No permissions match the current search.
        </div>
      );
    }
    const allModulePerms = permissionsByModule[activeModule] ?? [];

    return (
      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b">
              <th className="text-left px-4 py-3 font-medium w-[44%]">Resource</th>
              {ACTION_ORDER.map((action) => {
                const cellPerms = allModulePerms.filter((p) => p.action === action);
                if (cellPerms.length === 0) return <th key={action} />;
                return (
                  <th key={action} className="px-2 py-2 text-center align-bottom">
                    <button
                      onClick={() =>
                        bulkToggle(
                          cellPerms.map((p) => p.id),
                          cellState(cellPerms) !== "all"
                        )
                      }
                      className="flex flex-col items-center gap-0.5 mx-auto group"
                      title={`Toggle all ${ACTION_LABELS[action]} in ${activeModule}`}
                    >
                      <span className="text-[11px] font-medium">{ACTION_LABELS[action]}</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                    </button>
                  </th>
                );
              })}
            </tr>
            <tr className="border-b bg-muted/40">
              <td className="px-4 py-2 text-xs font-medium text-muted-foreground">
                ▣ Select all in {activeModule}
              </td>
              {ACTION_ORDER.map((action) => {
                const cellPerms = allModulePerms.filter((p) => p.action === action);
                if (cellPerms.length === 0)
                  return (
                    <td key={action} className="px-2 py-2 text-center text-xs text-muted-foreground">
                      —
                    </td>
                  );
                const state = cellState(cellPerms);
                return (
                  <td key={action} className="px-2 py-2 text-center">
                    <Checkbox
                      checked={state === "all" ? true : state === "some" ? "indeterminate" : false}
                      onCheckedChange={() =>
                        bulkToggle(
                          cellPerms.map((p) => p.id),
                          state !== "all"
                        )
                      }
                    />
                  </td>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {resourceEntries.map(([resource, perms]) => {
              const rowState = cellState(perms);
              const description = perms.find((p) => p.description)?.description;
              return (
                <tr key={resource} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2 align-top">
                    <button
                      onClick={() =>
                        bulkToggle(
                          perms.map((p) => p.id),
                          rowState !== "all"
                        )
                      }
                      className="flex items-start gap-2 text-left"
                      title={`Toggle all actions for ${resource}`}
                    >
                      <span
                        className={cn(
                          "mt-1 inline-block h-2 w-2 rounded-full border shrink-0",
                          rowState === "all"
                            ? "bg-emerald-500 border-emerald-500"
                            : rowState === "some"
                              ? "bg-amber-400 border-amber-400"
                              : "border-muted-foreground/40"
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block font-medium capitalize">{resource}</span>
                        {description && (
                          <span className="block text-xs text-muted-foreground">{description}</span>
                        )}
                      </span>
                    </button>
                  </td>
                  {ACTION_ORDER.map((action) => {
                    const perm = perms.find((p) => p.action === action);
                    if (!perm)
                      return (
                        <td
                          key={action}
                          className="px-2 py-2 text-center text-xs text-muted-foreground/50"
                        >
                          —
                        </td>
                      );
                    return (
                      <td key={action} className="px-2 py-2 text-center">
                        <Checkbox
                          checked={selectedIds.has(perm.id)}
                          onCheckedChange={(c) => togglePermission(perm.id, c === true)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderDiffPanel() {
    if (!hasChanges) {
      return (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Showing {activeModulePerms.length} permissions
          </span>
          <span className="text-xs text-muted-foreground">No unsaved changes</span>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-medium">✏️ Changes:</span>
          {diff.added.length > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">+{diff.added.length} added</span>
          )}
          {diff.removed.length > 0 && (
            <span className="text-amber-600 dark:text-amber-400">−{diff.removed.length} removed</span>
          )}
          {(editName !== (details?.name ?? "") ||
            (editDesc || "") !== (details?.description ?? "")) && (
            <span className="text-blue-600 dark:text-blue-400">role info edited</span>
          )}
          <button
            onClick={() => setShowDiff((s) => !s)}
            className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            {showDiff ? (
              <>
                hide diff <ChevronDown className="h-3 w-3" />
              </>
            ) : (
              <>
                show diff <ChevronRight className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
        {showDiff && (
          <div className="rounded border bg-muted/30 max-h-32 overflow-y-auto p-2 space-y-0.5">
            {diff.added.map((id) => {
              const p = permissionById.get(id);
              if (!p) return null;
              return (
                <div
                  key={`a-${id}`}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono"
                >
                  + {p.module} / {p.resource} / {p.action}
                </div>
              );
            })}
            {diff.removed.map((id) => {
              const p = permissionById.get(id);
              if (!p) return null;
              return (
                <div
                  key={`r-${id}`}
                  className="text-[11px] text-amber-700 dark:text-amber-400 font-mono"
                >
                  − {p.module} / {p.resource} / {p.action}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderMembersTab() {
    if (members.length === 0) {
      return (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No users assigned to this role yet.
          <div className="mt-3">
            <Link href="/settings/users" className="text-primary hover:underline">
              Manage users →
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-md border">
        {members.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-3 border-b last:border-b-0 px-4 py-2.5"
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {u.fullName.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{u.fullName}</div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
            <Badge
              variant={u.status === "ACTIVE" ? "secondary" : "outline"}
              className="text-[10px]"
            >
              {u.status}
            </Badge>
          </div>
        ))}
        <div className="px-4 py-2 text-xs text-muted-foreground">
          <Link href="/settings/users" className="text-primary hover:underline">
            Manage users →
          </Link>
        </div>
      </div>
    );
  }

  // --- render ---
  if (notFound) {
    return (
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to roles
        </Link>
        <Alert className="border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">Role not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || !details) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading role...
      </div>
    );
  }

  const saveLabel = hasChanges
    ? `Save Changes (${diff.added.length + diff.removed.length}${
        editName !== details.name || (editDesc || "") !== (details.description ?? "")
          ? " + info"
          : ""
      })`
    : "Save Changes";

  return (
    <div className="space-y-4">
      {/* Sticky top action bar */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/95 backdrop-blur border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Roles
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-mono text-sm truncate">{details.name}</span>
          {details.isSystem && (
            <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
              <Lock className="h-3 w-3" />
              System
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges || (!details.isSystem && !editName.trim())}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saveLabel}
          </Button>
        </div>
      </div>

      {/* Page title + meta */}
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Role: {details.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {details.userCount} user{details.userCount !== 1 ? "s" : ""}
            </span>
            {details.updatedAt && (
              <span>
                Last edited{" "}
                {new Date(details.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Identity card */}
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          <div className="space-y-1.5">
            <Label className="text-xs">
              Role Name {!details.isSystem && <span className="text-destructive">*</span>}
            </Label>
            <div className="relative">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={details.isSystem}
                className={cn(details.isSystem && "pr-9")}
              />
              {details.isSystem && (
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {details.isSystem
                ? "System role name is locked because route guards depend on it."
                : "Renaming a custom role updates assigned users automatically."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="What can this role do?"
              rows={2}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs container */}
      <Card className="overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "permissions" | "members")}
        >
          <div className="px-4 pt-3 border-b">
            <TabsList className="h-9">
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="members" className="gap-1.5">
                Members
                {members.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {members.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="permissions" className="m-0">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-50">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search permissions..."
                  className="pl-8 h-8 text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5">
                    <Filter className="h-3.5 w-3.5" />
                    {actionFilter ? `Action: ${ACTION_LABELS[actionFilter]}` : "Filter"}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">By action</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setActionFilter(null)}>All actions</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {ACTION_ORDER.map((a) => (
                    <DropdownMenuItem key={a} onClick={() => setActionFilter(a)}>
                      {actionFilter === a && (
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-primary" />
                      )}
                      {ACTION_LABELS[a]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5">
                    <Copy className="h-3.5 w-3.5" />
                    Copy from role
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">
                    Replace current selection with...
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {otherRoles.length === 0 ? (
                    <DropdownMenuItem disabled>No other roles</DropdownMenuItem>
                  ) : (
                    otherRoles.map((r) => (
                      <DropdownMenuItem key={r.id} onClick={() => copyFromRole(r.id)}>
                        <span className="flex-1">{r.name}</span>
                        <span className="text-xs text-muted-foreground ml-3">
                          {r.permissionCount}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {showConfirmReset ? (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="destructive" className="h-8" onClick={revokeAll}>
                    Confirm revoke
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => setShowConfirmReset(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => setShowConfirmReset(true)}
                  disabled={selectedIds.size === 0}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Revoke all
                </Button>
              )}
            </div>

            {/* Diff bar */}
            <div className="px-4 py-2 border-b bg-muted/20">{renderDiffPanel()}</div>

            {/* Master / detail */}
            <div className="flex min-h-120 max-h-[70vh]">
              {renderModuleRail()}
              <section className="flex-1 min-w-0 overflow-auto">{renderMatrix()}</section>
            </div>
          </TabsContent>

          <TabsContent value="members" className="m-0 p-4">
            {renderMembersTab()}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Footer feedback strips */}
      {errorMsg && (
        <Alert className="border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">{errorMsg}</AlertDescription>
        </Alert>
      )}
      {userImpact > 0 && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400 flex flex-wrap items-center gap-2">
            Removing {diff.removed.length} permission{diff.removed.length !== 1 ? "s" : ""} will
            affect {userImpact} active user{userImpact !== 1 ? "s" : ""}.
            <button
              onClick={() => setActiveTab("members")}
              className="ml-auto hover:underline"
            >
              view affected →
            </button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
