"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Users, UserCheck, UserX, Clock, Loader2, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  role: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "ACTIVE": return "default";
    case "INACTIVE": return "secondary";
    case "LOCKED": return "destructive";
    default: return "outline";
  }
}

export default function UsersPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    roleId: "",
  });

  async function fetchData() {
    const [usersRes, rolesRes] = await Promise.all([
      fetch("/api/v1/settings/users?limit=50"),
      fetch("/api/v1/settings/roles"),
    ]);
    const usersJson = await usersRes.json();
    const rolesJson = await rolesRes.json();
    if (usersJson.success) {
      setUsers(usersJson.data);
      setTotal(usersJson.meta?.total ?? usersJson.data.length);
    }
    if (rolesJson.success) setRoles(rolesJson.data);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleCreate() {
    if (!form.fullName || !form.email || !form.password || !form.roleId) return;
    setCreating(true);
    setMsg(null);
    const res = await fetch("/api/v1/settings/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.success) {
      setMsg({ type: "success", text: `User "${json.data.fullName}" created successfully.` });
      setShowCreate(false);
      setForm({ fullName: "", email: "", password: "", roleId: "" });
      fetchData();
    } else {
      setMsg({ type: "error", text: json.error?.message ?? "Failed to create user." });
    }
    setCreating(false);
  }

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const inactiveCount = users.filter((u) => u.status === "INACTIVE").length;
  const lockedCount = users.filter((u) => u.status === "LOCKED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.title")}
        description={t("users.description")}
      >
        <Button size="sm" onClick={() => { setShowCreate(true); setMsg(null); }}>
          <Plus className="h-4 w-4 mr-2" />
          {t("users.addUser")}
        </Button>
      </PageHeader>

      {msg && (
        <Alert className={msg.type === "success"
          ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20"
          : "border-destructive/50 bg-destructive/5"
        }>
          {msg.type === "success"
            ? <CheckCircle className="h-4 w-4 text-emerald-600" />
            : <UserX className="h-4 w-4 text-destructive" />
          }
          <AlertDescription className={msg.type === "success" ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}>
            {msg.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("users.totalUsers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{loading ? "—" : total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("users.active")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">{loading ? "—" : activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("users.inactive")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              <p className="text-2xl font-bold">{loading ? "—" : inactiveCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("users.pendingActivation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold">{loading ? "—" : lockedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("users.userAccounts")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("users.fullName")}</TableHead>
                  <TableHead>{t("users.email")}</TableHead>
                  <TableHead>{t("users.role")}</TableHead>
                  <TableHead>{t("users.lastLogin")}</TableHead>
                  <TableHead>{t("users.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {user.role?.name ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt, locale) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="e.g. Shakil Ahmed"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="shakil@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select
                value={form.roleId}
                onValueChange={(v) => setForm((f) => ({ ...f, roleId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roles.length === 0 && (
                <p className="text-xs text-amber-600">
                  No roles found. Go to Roles page and click "Seed Standard Roles" first.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !form.fullName || !form.email || !form.password || !form.roleId}
            >
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
