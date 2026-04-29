"use client";

import { useCallback, useEffect, useState } from "react";
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

interface BusinessUnit {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
}

interface CostCenter {
  id: string;
  code: string;
  name: string;
  businessUnitId: string;
}

interface FundClass {
  id: string;
  code: string;
  name: string;
}

interface Budget {
  id: string;
  budgetCode: string;
  name: string;
  totalAmount: number;
  status: string;
  businessUnitId: string | null;
  costCenterId: string | null;
  fundClassId: string | null;
}

interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  unit: string;
  warehouseId: string;
  unitPrice?: number | string | null;
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
}

interface AssetCategory {
  id: string;
  code: string;
  name: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface PRLine {
  description: string;
  specification: string;
  itemType: "INVENTORY" | "FIXED_ASSET" | "SERVICE_OR_EXPENSE";
  inventoryItemId: string;
  warehouseId: string;
  assetCategoryId: string;
  accountId: string;
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

const ITEM_TYPE_OPTIONS = [
  { value: "INVENTORY", label: "Inventory" },
  { value: "FIXED_ASSET", label: "Fixed Asset" },
  { value: "SERVICE_OR_EXPENSE", label: "Service/Expense" },
] as const;

const blankLine = (): PRLine => ({
  description: "",
  specification: "",
  itemType: "SERVICE_OR_EXPENSE",
  inventoryItemId: "",
  warehouseId: "",
  assetCategoryId: "",
  accountId: "",
  unit: "pcs",
  quantity: "1",
  estimatedPrice: "",
});

export default function NewRequisitionPage() {
  const router = useRouter();
  const locale = useLocale();

  const [projects, setProjects] = useState<Project[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [fundClasses, setFundClasses] = useState<FundClass[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdStatus, setCreatedStatus] = useState<"DRAFT" | "SUBMITTED">("SUBMITTED");

  const [form, setForm] = useState({
    projectId: "",
    businessUnitId: "",
    costCenterId: "",
    fundClassId: "",
    budgetId: "",
    priority: "NORMAL",
    justification: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [lines, setLines] = useState<PRLine[]>([blankLine()]);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/projects?limit=50&status=ACTIVE").then((r) => r.json()).then((json) => { if (json.success) setProjects(json.data); }),
      fetch("/api/v1/settings/business-units?limit=200").then((r) => r.json()).then((json) => { if (json.success) setBusinessUnits(json.data); }),
      fetch("/api/v1/settings/cost-centers?limit=200").then((r) => r.json()).then((json) => { if (json.success) setCostCenters(json.data); }),
      fetch("/api/v1/settings/fund-classes?limit=50").then((r) => r.json()).then((json) => { if (json.success) setFundClasses(json.data); }),
      fetch("/api/v1/budget?limit=200").then((r) => r.json()).then((json) => { if (json.success) setBudgets(json.data); }),
      fetch("/api/v1/procurement/requisitions/lookups").then((r) => r.json()).then((json) => {
        if (json.success) {
          setInventoryItems(json.data.inventoryItems);
          setWarehouses(json.data.warehouses);
          setAssetCategories(json.data.assetCategories);
        }
      }),
      fetch("/api/v1/finance/accounts?limit=300&isActive=true&isGroup=false").then((r) => r.json()).then((json) => { if (json.success) setAccounts(json.data); }),
    ]).catch(() => {});
  }, []);

  const applyInventoryItem = useCallback((line: PRLine, item: InventoryItem) => {
    line.inventoryItemId = item.id;
    line.warehouseId = item.warehouseId || line.warehouseId;
    line.unit = item.unit || line.unit;

    const unitPrice = Number(item.unitPrice || 0);
    if (unitPrice > 0 && (!line.estimatedPrice || Number(line.estimatedPrice) === 0)) {
      line.estimatedPrice = String(unitPrice);
    }

    if (!line.description.trim()) {
      line.description = item.name;
    }
  }, []);

  const findDefaultInventoryItem = useCallback((line: PRLine) => {
    const description = line.description.trim().toLowerCase();
    const matchingItem = description
      ? inventoryItems.find((item) => {
          const name = item.name.toLowerCase();
          const code = item.itemCode.toLowerCase();
          return name.includes(description) || description.includes(name) || code.includes(description);
        })
      : null;

    return matchingItem || inventoryItems[0] || null;
  }, [inventoryItems]);

  useEffect(() => {
    if (inventoryItems.length === 0) return;

    setLines((prev) => prev.map((line) => {
      if (line.itemType !== "INVENTORY" || line.inventoryItemId) return line;

      const defaultItem = findDefaultInventoryItem(line);
      if (!defaultItem) return line;

      const updatedLine = { ...line };
      applyInventoryItem(updatedLine, defaultItem);
      return updatedLine;
    }));
  }, [applyInventoryItem, findDefaultInventoryItem, inventoryItems]);

  function addLine() {
    setLines((prev) => [...prev, blankLine()]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof PRLine, value: string) {
    setLines((prev) => {
      const updated = [...prev];
      const current = { ...updated[idx], [field]: value };
      if (field === "itemType") {
        current.inventoryItemId = "";
        current.warehouseId = "";
        current.assetCategoryId = "";

        if (value === "INVENTORY") {
          const defaultItem = findDefaultInventoryItem(current);
          if (defaultItem) applyInventoryItem(current, defaultItem);
        }
      }
      if (field === "inventoryItemId") {
        const selectedItem = inventoryItems.find((item) => item.id === value);
        if (selectedItem) {
          applyInventoryItem(current, selectedItem);
        }
      }
      updated[idx] = current;
      return updated;
    });
  }

  const totalEstimate = lines.reduce((sum, l) => {
    return sum + (Number(l.quantity) || 0) * (Number(l.estimatedPrice) || 0);
  }, 0);

  const selectedProject = projects.find((p) => p.id === form.projectId);
  const matchingBudgets = budgets.filter((budget) =>
    ["APPROVED", "ACTIVE"].includes(budget.status) &&
    (!form.businessUnitId || budget.businessUnitId === form.businessUnitId) &&
    (!form.costCenterId || !budget.costCenterId || budget.costCenterId === form.costCenterId) &&
    (!form.fundClassId || !budget.fundClassId || budget.fundClassId === form.fundClassId)
  );
  const remainingBudget = selectedProject
    ? Number(selectedProject.totalBudget) - Number(selectedProject.amountSpent)
    : null;

  async function handleSubmit(submit: boolean) {
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
    if (lines.some((l) => l.itemType === "INVENTORY" && !l.inventoryItemId)) {
      setError("Inventory lines require an inventory item.");
      return;
    }
    if (lines.some((l) => l.itemType === "FIXED_ASSET" && !l.assetCategoryId)) {
      setError("Fixed asset lines require an asset category.");
      return;
    }

    setSubmitting(submit);
    setSavingDraft(!submit);
    try {
      const res = await fetch("/api/v1/procurement/requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          projectId: form.projectId || null,
          businessUnitId: form.businessUnitId || null,
          costCenterId: form.costCenterId || null,
          fundClassId: form.fundClassId || null,
          budgetId: form.budgetId || null,
          priority: form.priority,
          justification: form.justification || null,
          notes: form.notes || null,
          submit,
          lines: lines.map((l) => ({
            description: l.description,
            specification: l.specification || null,
            itemType: l.itemType,
            inventoryItemId: l.inventoryItemId || null,
            warehouseId: l.warehouseId || null,
            assetCategoryId: l.assetCategoryId || null,
            accountId: l.accountId || null,
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
        setCreatedStatus(submit ? "SUBMITTED" : "DRAFT");
        setSuccess(true);
        setTimeout(() => router.push(`/procurement/requisitions/${json.data.id}`), 1500);
      } else {
        setError(json.error?.message ?? "Failed to create requisition.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
      setSavingDraft(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <CheckCircle className="h-12 w-12 text-emerald-500" />
        <p className="text-lg font-medium">
          Purchase Requisition {createdStatus === "SUBMITTED" ? "submitted" : "saved as draft"}!
        </p>
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
            <Label>Concern / Business Unit</Label>
            <Select
              value={form.businessUnitId}
              onValueChange={(v) => setForm((f) => ({ ...f, businessUnitId: v, costCenterId: "", budgetId: "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select concern" />
              </SelectTrigger>
              <SelectContent>
                {businessUnits.map((bu) => (
                  <SelectItem key={bu.id} value={bu.id}>
                    {bu.code} - {bu.shortName ?? bu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cost Center</Label>
            <Select
              value={form.costCenterId}
              onValueChange={(v) => setForm((f) => ({ ...f, costCenterId: v, budgetId: "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cost center" />
              </SelectTrigger>
              <SelectContent>
                {costCenters
                  .filter((cc) => !form.businessUnitId || cc.businessUnitId === form.businessUnitId)
                  .map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.code} - {cc.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fund Class</Label>
            <Select
              value={form.fundClassId}
              onValueChange={(v) => setForm((f) => ({ ...f, fundClassId: v, budgetId: "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fund class" />
              </SelectTrigger>
              <SelectContent>
                {fundClasses.map((fc) => (
                  <SelectItem key={fc.id} value={fc.id}>
                    {fc.code} - {fc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Approved Budget</Label>
            <Select value={form.budgetId} onValueChange={(v) => setForm((f) => ({ ...f, budgetId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select approved concern budget" />
              </SelectTrigger>
              <SelectContent>
                {matchingBudgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.budgetCode} - {budget.name} ({formatCurrency(Number(budget.totalAmount), locale)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.businessUnitId && matchingBudgets.length === 0 && (
              <p className="text-xs text-amber-600">No approved/active matching budget found. Submission will carry a budget warning.</p>
            )}
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
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Description</TableHead>
                <TableHead className="min-w-[180px]">Specification</TableHead>
                <TableHead className="w-[200px]">Classification</TableHead>
                <TableHead className="w-[80px]">GL Account</TableHead>
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
                  <TableCell className="align-top">
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(idx, "description", e.target.value)}
                      placeholder="e.g. Laptop ThinkPad T14s"
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <Input
                      value={line.specification}
                      onChange={(e) => updateLine(idx, "specification", e.target.value)}
                      placeholder="Specification (optional)"
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <Select value={line.itemType} onValueChange={(v) => updateLine(idx, "itemType", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEM_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {line.itemType === "INVENTORY" && (
                        <>
                          <Select value={line.inventoryItemId} onValueChange={(v) => updateLine(idx, "inventoryItemId", v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Inventory item" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventoryItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.itemCode} - {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={line.warehouseId} onValueChange={(v) => updateLine(idx, "warehouseId", v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses.map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                  {warehouse.code} - {warehouse.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                      {line.itemType === "FIXED_ASSET" && (
                        <>
                          <Select value={line.assetCategoryId} onValueChange={(v) => updateLine(idx, "assetCategoryId", v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Asset category" />
                            </SelectTrigger>
                            <SelectContent>
                              {assetCategories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.code} - {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={line.warehouseId} onValueChange={(v) => updateLine(idx, "warehouseId", v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Optional warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses.map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                  {warehouse.code} - {warehouse.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Select value={line.accountId} onValueChange={(v) => updateLine(idx, "accountId", v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="GL account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="align-top">
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
                  <TableCell className="align-top">
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <Input
                      type="number"
                      min="0"
                      value={line.estimatedPrice}
                      onChange={(e) => updateLine(idx, "estimatedPrice", e.target.value)}
                      placeholder="0"
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm align-top pt-3">
                    {formatCurrency((Number(line.quantity) || 0) * (Number(line.estimatedPrice) || 0), locale)}
                  </TableCell>
                  <TableCell className="align-top">
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
          </div>

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
        <Button variant="outline" onClick={() => handleSubmit(false)} disabled={submitting || savingDraft || lines.length === 0}>
          {savingDraft
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            : "Save Draft"
          }
        </Button>
        <Button onClick={() => handleSubmit(true)} disabled={submitting || savingDraft || lines.length === 0}>
          {submitting
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
            : "Submit Requisition"
          }
        </Button>
      </div>
    </div>
  );
}
