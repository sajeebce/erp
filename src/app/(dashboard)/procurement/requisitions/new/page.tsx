"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Project {
  id: string;
  projectNo: string;
  name: string;
  totalBudget: number;
  amountSpent: number;
}

interface PRLine {
  description: string;
  specification: string;
  unit: string;
  quantity: string;
  estimatedPrice: string;
}

const PRIORITY_OPTIONS = [
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
  { value: "LOW", label: "Low" },
];

const UNIT_OPTIONS = ["pcs", "set", "kg", "litre", "box", "pack", "pair", "unit", "meter", "roll"];

export default function NewRequisitionPage() {
  const router = useRouter();
  const locale = useLocale();

  const [projects, setProjects] = useState<Project[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    projectId: "",
    priority: "NORMAL",
    justification: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [lines, setLines] = useState<PRLine[]>([
    { description: "", specification: "", unit: "pcs", quantity: "1", estimatedPrice: "" },
  ]);

  useEffect(() => {
    fetch("/api/v1/projects?limit=50&status=ACTIVE")
      .then((r) => r.json())
      .then((json) => { if (json.success) setProjects(json.data); })
      .catch(() => {});
  }, []);

  function addLine() {
    setLines((prev) => [...prev, { description: "", specification: "", unit: "pcs", quantity: "1", estimatedPrice: "" }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof PRLine, value: string) {
    setLines((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }

  const totalEstimate = lines.reduce((sum, l) => {
    return sum + (Number(l.quantity) || 0) * (Number(l.estimatedPrice) || 0);
  }, 0);

  const selectedProject = projects.find((p) => p.id === form.projectId);
  const remainingBudget = selectedProject
    ? Number(selectedProject.totalBudget) - Number(selectedProject.amountSpent)
    : null;

  async function handleSubmit() {
    setError(null);
    setBudgetWarning(null);

    // Validate
    if (!lines.every((l) => l.description && l.quantity && l.estimatedPrice)) {
      setError("Please fill in all line item fields.");
      return;
    }
    if (lines.some((l) => Number(l.quantity) <= 0 || Number(l.estimatedPrice) <= 0)) {
      setError("Quantity and price must be greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/procurement/requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          projectId: form.projectId || null,
          priority: form.priority,
          justification: form.justification || null,
          notes: form.notes || null,
          lines: lines.map((l) => ({
            description: l.description,
            specification: l.specification || null,
            unit: l.unit,
            quantity: Number(l.quantity),
            estimatedPrice: Number(l.estimatedPrice),
          })),
        }),
      });
      const json = await res.json();

      if (json.success) {
        if (json.data.budgetWarning) {
          setBudgetWarning(json.data.budgetWarning);
        }
        setSuccess(true);
        setTimeout(() => router.push(`/procurement/requisitions/${json.data.id}`), 1500);
      } else {
        setError(json.error?.message ?? "Failed to create requisition.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <CheckCircle className="h-12 w-12 text-emerald-500" />
        <p className="text-lg font-medium">Purchase Requisition created!</p>
        {budgetWarning && (
          <Alert className="border-amber-500/50 bg-amber-50 max-w-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-sm">{budgetWarning}</AlertDescription>
          </Alert>
        )}
        <p className="text-muted-foreground text-sm">Redirecting to detail page...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="New Purchase Requisition"
        description="Fill in the details and add line items"
      >
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </PageHeader>

      {error && (
        <Alert className="border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      {remainingBudget !== null && totalEstimate > 0 && totalEstimate > remainingBudget && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            <strong>Budget Warning:</strong> Total estimate ({formatCurrency(totalEstimate, locale)}) exceeds
            available project budget ({formatCurrency(remainingBudget, locale)}). You can still submit — Admin will decide.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisition Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Project <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Select value={form.projectId} onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.projectNo} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject && (
              <p className="text-xs text-muted-foreground">
                Available budget: <span className="font-medium">{formatCurrency(remainingBudget!, locale)}</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Justification</Label>
            <Textarea
              value={form.justification}
              onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))}
              placeholder="Why is this purchase needed?"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-2" />
              Add Line
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="w-[80px]">Unit</TableHead>
                <TableHead className="w-[80px]">Qty</TableHead>
                <TableHead className="w-[130px]">Unit Price (BDT)</TableHead>
                <TableHead className="text-right w-[120px]">Total</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(idx, "description", e.target.value)}
                      placeholder="e.g. Laptop ThinkPad T14s"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={line.specification}
                      onChange={(e) => updateLine(idx, "specification", e.target.value)}
                      placeholder="Specification (optional)"
                      className="h-7 text-xs mt-1 text-muted-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={line.unit} onValueChange={(v) => updateLine(idx, "unit", v)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={line.estimatedPrice}
                      onChange={(e) => updateLine(idx, "estimatedPrice", e.target.value)}
                      placeholder="0"
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency((Number(line.quantity) || 0) * (Number(line.estimatedPrice) || 0), locale)}
                  </TableCell>
                  <TableCell>
                    {lines.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeLine(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Estimate</p>
              <p className="text-2xl font-bold font-mono">{formatCurrency(totalEstimate, locale)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting || lines.length === 0}>
          {submitting
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
            : "Submit Requisition"
          }
        </Button>
      </div>
    </div>
  );
}
