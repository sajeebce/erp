"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Shield, Users, Loader2, CheckCircle, Wand2, Trash2, Pencil, LayoutGrid, List } from "lucide-react";
import type { RoleListItem } from "@/components/settings/role-edit-form";

interface Role extends RoleListItem {
  createdAt: string;
}

function canDeleteRole(role: Role) {
  return role.name !== "ADMIN" && role.userCount === 0;
}

function getDeleteTitle(role: Role) {
  if (role.name === "ADMIN") return "ADMIN is the primary role and cannot be deleted.";
  if (role.userCount > 0) return "Reassign users before deleting this role.";
  return `Delete ${role.name}`;
}

export default function RolesPage() {
  const t = useTranslations("settings");

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  async function fetchRoles() {
    const res = await fetch("/api/v1/settings/roles");
    const json = await res.json();
    if (json.success) setRoles(json.data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRoles();
  }, []);

  async function handleCreate() {
    if (!formName.trim()) return;
    setCreating(true);
    setMsg(null);
    const res = await fetch("/api/v1/settings/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName.trim(), description: formDesc.trim() || null }),
    });
    const json = await res.json();
    if (json.success) {
      setMsg({ type: "success", text: `Role "${json.data.name}" created.` });
      setShowCreate(false);
      setFormName("");
      setFormDesc("");
      fetchRoles();
    } else {
      setMsg({ type: "error", text: json.error?.message ?? "Failed to create role." });
    }
    setCreating(false);
  }

  async function handleDelete(role: Role) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    setDeletingId(role.id);
    setMsg(null);
    const res = await fetch(`/api/v1/settings/roles/${role.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setMsg({ type: "success", text: `Role "${role.name}" deleted.` });
      fetchRoles();
    } else {
      setMsg({ type: "error", text: json.error?.message ?? "Failed to delete role." });
    }
    setDeletingId(null);
  }

  async function handleSeedRoles() {
    setSeeding(true);
    setMsg(null);
    const res = await fetch("/api/v1/settings/seed-roles", { method: "POST" });
    const json = await res.json();
    if (json.success) {
      setMsg({ type: "success", text: json.data.message });
      fetchRoles();
    } else {
      setMsg({ type: "error", text: json.error?.message ?? "Seeding failed." });
    }
    setSeeding(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("roles.title")}
        description={t("roles.description")}
      >
        <Button variant="outline" size="sm" onClick={handleSeedRoles} disabled={seeding}>
          {seeding
            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            : <Wand2 className="h-4 w-4 mr-2" />
          }
          Seed Standard Roles
        </Button>
        <Button size="sm" onClick={() => { setShowCreate(true); setMsg(null); }}>
          <Plus className="h-4 w-4 mr-2" />
          {t("roles.createRole")}
        </Button>
      </PageHeader>

      {msg && (
        <Alert className={msg.type === "success"
          ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20"
          : "border-destructive/50 bg-destructive/5"
        }>
          {msg.type === "success"
            ? <CheckCircle className="h-4 w-4 text-emerald-600" />
            : <Shield className="h-4 w-4 text-destructive" />
          }
          <AlertDescription className={msg.type === "success" ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}>
            {msg.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {roles.length} role{roles.length !== 1 ? "s" : ""} configured
        </div>
        <div className="inline-flex rounded-md border bg-background p-1">
          <Button
            type="button"
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-2"
            onClick={() => setViewMode("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
            Cards
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-2"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
            Table
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading roles...
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              No roles found. Click Seed Standard Roles to create standard CSS roles.
            </div>
          ) : (
            roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {role.name}
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-[10px]">System</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{role.userCount}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        asChild
                        title="Edit role"
                      >
                        <Link href={`/settings/roles/${role.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  {role.description && (
                    <CardDescription>{role.description}</CardDescription>
                  )}
                  {role.name !== "ADMIN" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive mt-1 disabled:opacity-40"
                      onClick={() => handleDelete(role)}
                      disabled={deletingId === role.id || !canDeleteRole(role)}
                      title={getDeleteTitle(role)}
                    >
                      {deletingId === role.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                      }
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{role.permissionCount} permissions</span>
                    <span>{role.userCount} user{role.userCount !== 1 ? "s" : ""}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Permissions</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No roles found. Click Seed Standard Roles to create standard CSS roles.
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-[10px]">System</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[360px] whitespace-normal text-muted-foreground">
                      {role.description || "No description"}
                    </TableCell>
                    <TableCell className="text-right">
                      {role.permissionCount} permission{role.permissionCount !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell className="text-right">{role.userCount}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                          title="Edit role"
                        >
                          <Link href={`/settings/roles/${role.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {role.name !== "ADMIN" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive disabled:opacity-40"
                            onClick={() => handleDelete(role)}
                            disabled={deletingId === role.id || !canDeleteRole(role)}
                            title={getDeleteTitle(role)}
                          >
                            {deletingId === role.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />
                            }
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Role Name <span className="text-destructive">*</span></Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. STORE_MANAGER"
              />
              <p className="text-xs text-muted-foreground">Use UPPERCASE_SNAKE_CASE for consistency.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="What can this role do?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !formName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
