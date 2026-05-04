"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { SearchableSelect } from "@/components/shared/searchable-select";
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
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
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

const STOCK_ACCOUNT_CODES = new Set(["309001", "309002", "309007", "309008", "309009", "309010"]);

function accountOptionsForLine(accounts: Account[], itemType: PRLine["itemType"]) {
  const typeFiltered = accounts.filter((account) => {
    if (itemType === "SERVICE_OR_EXPENSE") return account.type === "EXPENSE";
    return account.type === "ASSET";
  });

  if (itemType === "INVENTORY") {
    return [...typeFiltered].sort((a, b) => {
      const aStock = STOCK_ACCOUNT_CODES.has(a.code) || a.name.toLowerCase().includes("stock");
      const bStock = STOCK_ACCOUNT_CODES.has(b.code) || b.name.toLowerCase().includes("stock");
      if (aStock !== bStock) return aStock ? -1 : 1;
      return a.code.localeCompare(b.code);
    });
  }

  if (itemType === "FIXED_ASSET") {
    return [...typeFiltered].sort((a, b) => {
      const aFixed = a.code.startsWith("401");
      const bFixed = b.code.startsWith("401");
      if (aFixed !== bFixed) return aFixed ? -1 : 1;
      return a.code.localeCompare(b.code);
    });
  }

  return [...typeFiltered].sort((a, b) => a.code.localeCompare(b.code));
}

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
      fetch("/api/v1/finance/accounts?limit=300&isActive=true&isGroup=false&sort=code&order=asc").then((r) => r.json()).then((json) => { if (json.success) setAccounts(json.data); }),
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

  const businessUnitOptions = useMemo(
    () => businessUnits.map((bu) => ({ value: bu.id, label: `${bu.code} - ${bu.shortName ?? bu.name}` })),
    [businessUnits],
  );
  const costCenterOptions = useMemo(
    () =>
      costCenters
        .filter((cc) => !form.businessUnitId || cc.businessUnitId === form.businessUnitId)
        .map((cc) => ({ value: cc.id, label: `${cc.code} - ${cc.name}` })),
    [costCenters, form.businessUnitId],
  );
  const fundClassOptions = useMemo(
    () => fundClasses.map((fc) => ({ value: fc.id, label: `${fc.code} - ${fc.name}` })),
    [fundClasses],
  );
  const budgetOptions = useMemo(
    () =>
      matchingBudgets.map((budget) => ({
        value: budget.id,
        label: `${budget.budgetCode} - ${budget.name}`,
        description: formatCurrency(Number(budget.totalAmount), locale),
      })),
    [matchingBudgets, locale],
  );
  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: `${p.projectNo} — ${p.name}` })),
    [projects],
  );
  const inventoryOptions = useMemo(
    () => inventoryItems.map((item) => ({ value: item.id, label: `${item.itemCode} - ${item.name}` })),
    [inventoryItems],
  );
  const warehouseOptions = useMemo(
    () => warehouses.map((wh) => ({ value: wh.id, label: `${wh.code} - ${wh.name}` })),
    [warehouses],
  );
  const assetCategoryOptions = useMemo(
    () => assetCategories.map((cat) => ({ value: cat.id, label: `${cat.code} - ${cat.name}` })),
    [assetCategories],
  );

  function accountOptionsFor(itemType: PRLine["itemType"]) {
    return accountOptionsForLine(accounts, itemType).map((account) => ({
      value: account.id,
      label: `${account.code} - ${account.name}`,
    }));
  }

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
    <div className="space-y-6">
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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pr-date">Date</Label>
            <Input
              id="pr-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-priority">Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
              <SelectTrigger id="pr-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-bu">Concern / Business Unit</Label>
            <SearchableSelect
              id="pr-bu"
              options={businessUnitOptions}
              value={form.businessUnitId}
              onValueChange={(v) => setForm((f) => ({ ...f, businessUnitId: v, costCenterId: "", budgetId: "" }))}
              placeholder="Select concern"
              searchPlaceholder="Search business units…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-cc">Cost Center</Label>
            <SearchableSelect
              id="pr-cc"
              options={costCenterOptions}
              value={form.costCenterId}
              onValueChange={(v) => setForm((f) => ({ ...f, costCenterId: v, budgetId: "" }))}
              placeholder="Select cost center"
              searchPlaceholder="Search cost centers…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-fc">Fund Class</Label>
            <SearchableSelect
              id="pr-fc"
              options={fundClassOptions}
              value={form.fundClassId}
              onValueChange={(v) => setForm((f) => ({ ...f, fundClassId: v, budgetId: "" }))}
              placeholder="Select fund class"
              searchPlaceholder="Search fund classes…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-budget">Approved Budget</Label>
            <SearchableSelect
              id="pr-budget"
              options={budgetOptions}
              value={form.budgetId}
              onValueChange={(v) => setForm((f) => ({ ...f, budgetId: v }))}
              placeholder="Select approved concern budget"
              searchPlaceholder="Search budgets…"
              emptyMessage={form.businessUnitId ? "No matching approved budget" : "Pick a concern first"}
            />
            {form.businessUnitId && matchingBudgets.length === 0 && (
              <p className="text-xs text-amber-600">No approved/active matching budget found. Submission will carry a budget warning.</p>
            )}
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="pr-project">
              Project <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <SearchableSelect
              id="pr-project"
              options={projectOptions}
              value={form.projectId}
              onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}
              placeholder="Select project"
              searchPlaceholder="Search projects…"
            />
            {selectedProject && remainingBudget !== null && (
              <p className="text-xs text-muted-foreground">
                Available budget:{" "}
                <span className="font-medium">{formatCurrency(remainingBudget, locale)}</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
            <Label htmlFor="pr-justification">Justification</Label>
            <Textarea
              id="pr-justification"
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
        <CardContent className="space-y-3">
          {lines.map((line, idx) => {
            const lineTotal =
              (Number(line.quantity) || 0) * (Number(line.estimatedPrice) || 0);
            return (
              <div
                key={idx}
                className="rounded-lg border bg-card p-4 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Line {idx + 1}
                  </span>
                  {lines.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeLine(idx)}
                      aria-label={`Remove line ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`line-${idx}-desc`}>Description</Label>
                    <Input
                      id={`line-${idx}-desc`}
                      value={line.description}
                      onChange={(e) => updateLine(idx, "description", e.target.value)}
                      placeholder="e.g. Laptop ThinkPad T14s"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`line-${idx}-spec`}>
                      Specification <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Input
                      id={`line-${idx}-spec`}
                      value={line.specification}
                      onChange={(e) => updateLine(idx, "specification", e.target.value)}
                      placeholder="Specification details"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`line-${idx}-itemType`}>Item Type</Label>
                    <Select
                      value={line.itemType}
                      onValueChange={(v) => updateLine(idx, "itemType", v)}
                    >
                      <SelectTrigger id={`line-${idx}-itemType`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor={`line-${idx}-account`}>GL Account</Label>
                    <SearchableSelect
                      id={`line-${idx}-account`}
                      options={accountOptionsFor(line.itemType)}
                      value={line.accountId}
                      onValueChange={(v) => updateLine(idx, "accountId", v)}
                      placeholder="Select GL account"
                      searchPlaceholder="Search accounts…"
                    />
                  </div>

                  {line.itemType === "INVENTORY" && (
                    <>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor={`line-${idx}-inv`}>Inventory Item</Label>
                        <SearchableSelect
                          id={`line-${idx}-inv`}
                          options={inventoryOptions}
                          value={line.inventoryItemId}
                          onValueChange={(v) => updateLine(idx, "inventoryItemId", v)}
                          placeholder="Select inventory item"
                          searchPlaceholder="Search inventory…"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`line-${idx}-wh`}>Warehouse</Label>
                        <SearchableSelect
                          id={`line-${idx}-wh`}
                          options={warehouseOptions}
                          value={line.warehouseId}
                          onValueChange={(v) => updateLine(idx, "warehouseId", v)}
                          placeholder="Select warehouse"
                          searchPlaceholder="Search warehouses…"
                        />
                      </div>
                    </>
                  )}

                  {line.itemType === "FIXED_ASSET" && (
                    <>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor={`line-${idx}-cat`}>Asset Category</Label>
                        <SearchableSelect
                          id={`line-${idx}-cat`}
                          options={assetCategoryOptions}
                          value={line.assetCategoryId}
                          onValueChange={(v) => updateLine(idx, "assetCategoryId", v)}
                          placeholder="Select asset category"
                          searchPlaceholder="Search categories…"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`line-${idx}-wh-fa`}>
                          Warehouse <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <SearchableSelect
                          id={`line-${idx}-wh-fa`}
                          options={warehouseOptions}
                          value={line.warehouseId}
                          onValueChange={(v) => updateLine(idx, "warehouseId", v)}
                          placeholder="Optional warehouse"
                          searchPlaceholder="Search warehouses…"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                  <div className="space-y-1.5">
                    <Label htmlFor={`line-${idx}-unit`}>Unit</Label>
                    <Select
                      value={line.unit}
                      onValueChange={(v) => updateLine(idx, "unit", v)}
                    >
                      <SelectTrigger id={`line-${idx}-unit`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`line-${idx}-qty`}>Quantity</Label>
                    <Input
                      id={`line-${idx}-qty`}
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`line-${idx}-price`}>Unit Price (BDT)</Label>
                    <Input
                      id={`line-${idx}-price`}
                      type="number"
                      min="0"
                      value={line.estimatedPrice}
                      onChange={(e) => updateLine(idx, "estimatedPrice", e.target.value)}
                      placeholder="0"
                      className="tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Line Total</Label>
                    <div className="h-9 flex items-center px-3 rounded-md border bg-muted/30 font-mono text-sm tabular-nums">
                      {formatCurrency(lineTotal, locale)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-2" />
              Add another line
            </Button>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Estimate</p>
              <p className="text-2xl font-bold font-mono tabular-nums">
                {formatCurrency(totalEstimate, locale)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
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
