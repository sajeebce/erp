# Multi-Concern Accounting Plan

> Prepared: 2026-04-24  
> Last updated: 2026-04-27  
> Parent document: [Multi-Concern Architecture](./multiconcern.md)

---

## Goal

Accounting must support one central CSS group view while also producing reliable reports for every sector, concern, cost center, project, donor grant, and fund class.

The accounting module should remain one shared finance module. It should not be copied per concern.

CSS concerns are not separate legal entities in the current scope. Accounting should therefore use concern dimensions for management, segment, donor, and operational reporting, while statutory identity remains at the single `Organization` level.

---

## Current State (updated 2026-04-24)

Phase 13 backend is complete:

- `Sector`, `BusinessUnit`, `CostCenter`, `FundClass`, `OperatingLocation` models added to `prisma/schema/organization.prisma`.
- `JournalEntryLine` has `businessUnitId`, `costCenterId`, `fundClassId` as proper UUID FKs.
- `Voucher`, `BankAccount`, `PettyCashFund`, `ExpenseClaim`, `ExpenseClaimItem`, `EmployeeAdvance`, `JournalEntry`, `Account` all have `businessUnitId` FK.
- `ExpenseClaimItem` also has `costCenterId` FK.
- CSS operating structure seeded: 5 sectors, 19 BUs, 29 cost centers, 4 fund classes, 4 locations with `localizedName { en, bn }`.
- CRUD APIs live: `GET/POST/PUT/DELETE /api/v1/settings/{sectors,business-units,cost-centers,fund-classes,operating-locations}`.
- Journal entry POST accepts per-line `businessUnitId`, `costCenterId`, `fundClassId`; falls back to header `businessUnitId`.
- Voucher approve propagates `businessUnitId` to auto-generated `JournalEntry` and `JournalEntryLine`.
- Reports API (`/api/v1/finance/reports/[type]`) accepts `sectorId`, `businessUnitId`, `costCenterId`, `fundClassId`, `grantId` params; filters on `JournalEntryLine` level (sectorId joins via `businessUnit.sectorId`).
- `/settings/operating-structure` UI wired to real APIs.
- `seed-accounts.ts` org slug resolved from `CSS_ORG_SLUG` env var, falls back to `shapla-foundation`.
- Dimension validation helper at `src/lib/dimension-validation.ts`.

Remaining:

- HR Cost Allocations API wiring (`EmployeeCostAllocation` model).
- JE and Voucher form UI dimension selectors.
- Dashboard drill-down KPIs.
- Concern-first budget workflow is not complete yet:
  - `Budget.projectId` is still required, so pure concern/operating budgets cannot be created without a project.
  - `Budget` has `costCenterId`, but no `businessUnitId` or `fundClassId`.
  - `BudgetLine` has account/category amounts, but no line-level business unit, cost center, fund class, project/grant override, or procurement matching metadata.
  - Procurement PR budget warning is currently transient; it is returned at create time but not persisted on the PR.
  - Procurement accounting entries from GRN do not yet carry business unit, cost center, fund class, project, grant, or budget line dimensions.

Current `/settings/operating-structure` review:

- The page is API-backed and covers sectors, business units, cost centers, operating locations, and fund classes.
- It is suitable as the master-data source for concern budget creation and procurement dimension selection.
- Runtime check on 2026-04-27 returned page `200`, but the currently authenticated demo org had `0` sectors, `0` business units, `0` cost centers, and `0` fund classes. Before testing concern budget/procurement, seed or import the CSS operating structure into the same organization used for login.
- The next step is not more operating-structure setup; the next step is wiring these dimensions into Budget, Procurement, and auto-generated Accounting entries.

---

## Required Accounting Dimensions

Every posted financial line should be able to carry these dimensions:

```text
JournalEntryLine
  accountId
  businessUnitId
  costCenterId
  fundClassId
  projectId
  grantId
```

Recommended rule:

- `businessUnitId` should be mandatory for operating revenue and expense lines.
- `sectorId` must be derived from `businessUnitId`; do not store `sectorId` on `JournalEntryLine`.
- `costCenterId` should be mandatory when the selected business unit has configured cost centers.
- `projectId` and `grantId` should be optional, but mandatory when a transaction is donor/project funded.
- `fundClassId` should be mandatory for fund accounting reports.
- Budget-controlled procurement must carry the same dimension set from budget -> PR -> PO -> GRN -> JournalEntryLine.

Do not add `legalEntityId` unless the client later confirms separate statutory entities.

---

## Data Model Changes

Add shared dimension models:

```prisma
model Sector {
  id             String @id @default(uuid()) @db.Uuid
  organizationId String @db.Uuid
  code           String
  name           String
  localizedName  Json?
  isActive       Boolean @default(true)
}

model BusinessUnit {
  id             String @id @default(uuid()) @db.Uuid
  organizationId String @db.Uuid
  sectorId       String @db.Uuid
  parentId       String? @db.Uuid
  code           String
  name           String
  shortName      String?
  localizedName  Json?
  isActive       Boolean @default(true)
}

model CostCenter {
  id             String @id @default(uuid()) @db.Uuid
  organizationId String @db.Uuid
  businessUnitId String @db.Uuid
  code           String
  name           String
  localizedName  Json?
  description    String?
  isActive       Boolean @default(true)
}

model FundClass {
  id             String @id @default(uuid()) @db.Uuid
  organizationId String @db.Uuid
  code           String
  name           String
  localizedName  Json?
  restriction    String // UNRESTRICTED | RESTRICTED | TEMPORARILY_RESTRICTED | ENDOWMENT
  isActive       Boolean @default(true)
}
```

Then add FKs to financial records:

- `Account.businessUnitId?` only if an account is concern-specific
- `BankAccount.businessUnitId?`
- `PettyCashFund.businessUnitId?`
- `Voucher.businessUnitId?`
- `JournalEntry.businessUnitId?` as a default header value
- `JournalEntryLine.businessUnitId`
- `JournalEntryLine.costCenterId?`
- `JournalEntryLine.fundClassId`
- `ExpenseClaim.businessUnitId?`
- `ExpenseClaimItem.businessUnitId?`
- `EmployeeAdvance.businessUnitId?`
- `Budget.businessUnitId?`
- `BudgetLine.businessUnitId?`
- `Budget.fundClassId?`
- `BudgetLine.costCenterId?`
- `BudgetLine.fundClassId?`
- `BudgetLine.projectId?`
- `BudgetLine.grantId?`

The most important table is `JournalEntryLine`. Reporting should use line-level dimensions because one voucher or journal entry can contain lines for multiple concerns or cost centers.

### Budget Dimension Changes Required

The budget module must support two valid budget scopes:

```text
Concern operating budget:
  businessUnitId required
  projectId optional
  costCenterId optional
  fundClassId required when fund reporting applies

Project / donor budget:
  projectId required
  grantId optional or required by donor rules
  businessUnitId required when the project belongs to a concern
  fundClassId required
```

Schema changes:

- Make `Budget.projectId` nullable, because CSS can create annual operating budgets for a concern that are not donor-project budgets.
- Add `Budget.businessUnitId`.
- Add `Budget.fundClassId`.
- Keep `Budget.costCenterId`, but validate it belongs to `Budget.businessUnitId` when both are provided.
- Add `BudgetLine.businessUnitId`, `BudgetLine.costCenterId`, `BudgetLine.fundClassId`, `BudgetLine.projectId`, and `BudgetLine.grantId` as optional overrides.
- Add `BudgetLine.procurementCategory?` if account-only matching is not enough for procurement controls, for example `FIXED_ASSET`, `SUPPLIES`, `SERVICES`, `TRAVEL`.
- Add indexes for `businessUnitId`, `fundClassId`, and combined matching fields used by budget checks.

Budget matching priority:

1. Exact `budgetLineId` selected on procurement line.
2. Matching active/approved budget line by account + business unit + cost center + fund class + project/grant.
3. Matching active/approved budget header by business unit + cost center + fund class + project/grant.
4. No match means a warning, not a hard block.

Budget status rule:

- Procurement budget checks use only `APPROVED` and `ACTIVE` budgets.
- `DRAFT`, `SUBMITTED`, `REJECTED`, and `CLOSED` budgets must not authorize procurement spend.

---

## Budget -> Procurement -> Accounting Flow

This is required for the procurement flow in [Procurement to Asset Receipt Workflow Plan](./PROCUREMENT_ASSET_RECEIPT_WORKFLOW_PLAN.md).

### Business Rule

The intended client flow is:

```text
Operating Structure
  -> Concern / Cost Center / Fund Class setup
  -> Concern budget creation and approval
  -> Purchase requisition within that budget
  -> Admin approval with warning if over budget
  -> PO
  -> GRN / asset registration
  -> Accounting entry
  -> Budget vs actual and financial reports reflect the spend
```

### Budget Control Behavior

Budget controls must warn, not block.

- If PR amount is within available budget: allow normal approval and store `budgetCheckStatus = WITHIN_BUDGET`.
- If PR amount exceeds available budget: show warning during create and approval, allow admin approval, and persist `budgetCheckStatus = WARNING`.
- If no approved/active matching budget exists: show warning, allow admin approval, and persist `budgetCheckStatus = NO_BUDGET`.
- If admin approves with a warning, the warning status must remain visible on PR, PO, GRN/accounting trace, and audit trail.

Recommended persistent fields:

```text
PurchaseRequisition
  businessUnitId
  costCenterId
  fundClassId
  budgetId?
  budgetCheckStatus      // WITHIN_BUDGET | WARNING | NO_BUDGET | NOT_CHECKED
  budgetWarningMessage?
  budgetCheckedAt?
  approvedWithBudgetWarning Boolean
  warningApprovedById?
  warningApprovedAt?

PurchaseRequisitionLine
  accountId?
  budgetLineId?
  businessUnitId?
  costCenterId?
  fundClassId?
  projectId?
  grantId?
  budgetAvailableAtCheck?
  budgetVarianceAtCheck?

PurchaseOrderLine
  budgetLineId?
  businessUnitId?
  costCenterId?
  fundClassId?
  projectId?
  grantId?
```

Do not store only a UI-only warning response. The warning must be persisted because approval after warning is an audit decision.

### Commitment and Actual Treatment

Use two layers:

- Commitment view: PR/PO amounts reserve or show pending budget utilization before accounting is posted.
- Actual view: approved journal entry lines drive official actuals.

Recommended calculation:

```text
Available budget for PR approval =
  approved/active budget line amount
  - approved actual journal debits for same dimensions/account
  - open PO commitments for same dimensions/account
  - approved PRs not yet converted to PO for same dimensions/account
```

For demo readiness, minimum acceptable check:

```text
Available budget =
  active/approved budget amount
  - existing approved/PO_CREATED PR commitments for the same scope
  - approved accounting actuals for the same scope
```

### Accounting Reflection

Procurement accounting must preserve dimensions.

When GRN accounting is posted:

- Debit fixed asset or expense account with PR/PO line dimensions.
- Credit accounts payable with the same business unit/fund class or a configured central payable business unit.
- `JournalEntryLine.businessUnitId`, `costCenterId`, `fundClassId`, `projectId`, and `budgetLineId` should be populated from the originating PR/PO line.
- `JournalEntry.sourceModule = PROCUREMENT_GRN` and `sourceId = grn.id` must remain.

For asset purchases:

- Accounting actual should hit fixed asset account.
- Budget actual/reporting should still include the capital purchase against the equipment/capital budget line.
- If necessary, budget-vs-actual should match by `budgetLineId` first instead of only expense accounts.

### Budget vs Actual Reporting Changes

The current budget-vs-actual logic must move from project/header-only matching to line-level dimension matching.

Required behavior:

- Budget actuals should aggregate approved `JournalEntryLine` records.
- Match by `budgetLineId` when available.
- Otherwise match by `accountId` plus dimensions:
  - `businessUnitId`
  - `costCenterId`
  - `fundClassId`
  - `projectId`
  - `grantId`
- Concern budget report must work without `projectId`.
- Sector filter should derive through `BusinessUnit.sectorId`.

---

### Final Storage Rule

Store these fields on `JournalEntryLine`:

```text
businessUnitId
costCenterId
fundClassId
projectId
grantId
```

Do not store `sectorId` on `JournalEntryLine`. Reports should join:

```text
JournalEntryLine.businessUnitId -> BusinessUnit.sectorId -> Sector
```

This avoids mismatched data such as a Health business unit accidentally tagged with an Education sector.

### Implementation File Ownership

Use the existing split Prisma schema structure:

- Add `Sector`, `BusinessUnit`, `CostCenter`, `FundClass`, and optional `OperatingLocation` in `prisma/schema/organization.prisma`.
- Add finance dimension FKs in `prisma/schema/finance.prisma`.
- Add budget dimension FKs in `prisma/schema/budget.prisma` only if the current implementation touches budget posting or budget-vs-actual.
- Do not add a `LegalEntity` model.
- Keep all new models scoped by `organizationId`.
- Add `localizedName Json?` for master data that appears in UI because the product supports English and Bangla.

### Seed Rules

- `prisma/seed-accounts.ts` must not hard-code `shapla-foundation` for CSS seeding. Use `CSS_ORG_SLUG` env var with a safe fallback, or resolve by known CSS organization name only when needed.
- Add `prisma/seed-css-operating-structure.ts` for sectors, business units, cost centers, fund classes, and locations.
- Seed scripts must be idempotent with `upsert`.
- Seeded master data must include `localizedName: { en, bn }` where Bangla labels are available.
- The COA remains one organization-level chart; concern-specific reporting comes from dimensions.

---

## Planned URLs

Master setup:

```text
/settings/operating-structure
```

Accounting pages that must consume these setup dimensions:

```text
/finance/chart-of-accounts
/finance/journal-entries
/finance/vouchers
/finance/bank-cash
/finance/expenses
/finance/financial-reports
/reports/financial
```

The first implemented financial report filters should be:

```text
sectorId
businessUnitId
costCenterId
fundClassId
projectId
grantId
```

---

## Chart of Accounts Strategy

Use one unified chart of accounts at organization level.

Recommended:

- Do not duplicate the full chart of accounts per concern.
- Use dimensions for concern-wise reporting.
- Create concern-specific accounts only when truly required, such as a separate bank account, receivable, payable, or statutory liability.

Example:

```text
6010 Salaries and Allowances
  businessUnitId = Hospital
  costCenterId = OPD
  projectId = HIV/AIDS Project
  fundClassId = Restricted
```

This is better than creating many duplicated accounts such as:

```text
6010-HOSP-OPD Salaries
6010-HOSP-IPD Salaries
6010-EDU-HTI Salaries
```

---

## Posting Rules

### Manual Journal

Journal form should allow line-level dimensions.

Required validation:

- debit total must equal credit total
- selected business unit must belong to current organization
- selected cost center must belong to selected business unit
- selected project and grant must belong to current organization
- selected grant should match project/donor rules if project is donor-funded
- selected fund class must belong to current organization
- if `costCenterId` is provided, `businessUnitId` is required

### Voucher

Voucher header can provide default dimensions. Voucher lines or generated journal lines must store final dimensions.

Voucher approval must copy final dimensions into generated `JournalEntryLine` records. Reports must never depend only on voucher header dimensions.

### Procurement Auto-Posting

Procurement-generated accounting entries must follow the same rule as vouchers.

Required validation:

- PR and PR lines must carry enough dimensions to identify the budget scope.
- PO lines must copy dimensions and `budgetLineId` from PR lines.
- GRN posting must copy dimensions and `budgetLineId` from PO lines to `JournalEntryLine`.
- If dimensions are missing during GRN accounting post, the API should return a clear validation error instead of posting undimensioned accounting data.

### Expense Claim

Expense claim header can hold default dimensions, but item-level dimensions must override when needed.

Example:

- claim header: Hospital
- item 1: OPD medicine expense
- item 2: Training project travel expense

### Payroll

Payroll posting must use HR allocation lines.

Payroll should post salary expense by:

- business unit
- cost center
- project
- grant
- fund class

See [Multi-Concern HR Plan](./multiconcern-hr.md).

---

## Reporting Requirements

Add common filters to financial report APIs:

- `sectorId`
- `businessUnitId`
- `costCenterId`
- `fundClassId`
- `projectId`
- `grantId`
- `dateFrom`
- `dateTo`
- `fiscalYearId`

Filter behavior:

- `sectorId` filters through `BusinessUnit.sectorId`.
- `businessUnitId`, `costCenterId`, and `fundClassId` filter directly on `JournalEntryLine`.
- `projectId` and `grantId` should use line-level values first. If an older record has only header values, support a temporary fallback only during migration.
- All report calculations must include approved/posted journal entries only.
- Trial balance, income statement, and balance sheet should continue to work with no dimension filter.

Required reports:

- Consolidated trial balance
- Sector-wise trial balance
- Concern-wise trial balance
- Concern-wise income statement
- Concern-wise balance sheet
- Fund position by fund class
- Project/donor financial report
- Cost center expense report
- Bank and cash position by concern
- Inter-concern transaction report
- Segment disclosure report
- Concern budget vs actual
- Procurement commitment by budget
- PRs approved with budget warning
- PO/GRN/accounting trace by budget line

---

## Consolidation Plan

Do this after transaction dimensions are stable.

### Step 1: Consolidated Reports Without Elimination

Group all approved `JournalEntryLine` records by account and dimension.

### Step 2: Inter-Concern Transfer Tagging

Add an `InterUnitTransaction` model or a transaction type flag to identify internal transfers.

Recommended fields:

```text
sourceBusinessUnitId
targetBusinessUnitId
journalEntryId
amount
status
eliminationRequired
```

### Step 3: Elimination Entries

At consolidated reporting time, eliminate internal receivables, payables, income, and expenses where required.

Keep elimination entries auditable. Do not silently hide source transactions.

---

## Dashboard Requirements

Central finance dashboard should support:

```text
CSS Group
  -> Sector
      -> BusinessUnit
          -> CostCenter
              -> Project / Grant
```

KPIs:

- revenue / fund received
- expenses
- surplus or deficit
- budget vs actual
- cash and bank balance
- restricted vs unrestricted fund balance
- top concerns by expense
- top concerns by revenue
- pending approvals by concern
- inter-concern fund movements

---

## Implementation Order

1. Add master models: `Sector`, `BusinessUnit`, `CostCenter`, `FundClass`, and `OperatingLocation` if required by the UI. Done in Phase 13.
2. Add dimension FKs to `JournalEntryLine`; do not add `sectorId` to journal lines. Done in Phase 13.
3. Add default/header dimension FKs to finance records where the current UI/API needs them. Mostly done for finance header records.
4. Run Prisma migration and generate the Prisma client. Done for Phase 13 dimensions.
5. Add idempotent CSS operating structure seed data. Done for current demo set.
6. Fix `seed-accounts.ts` to use the target organization slug dynamically. Done.
7. Add CRUD APIs for operating structure master data. Done.
8. Add reusable dimension validation helpers. Done.
9. Update journal entry API to accept and persist line-level dimensions. Backend done; UI selectors still required.
10. Update voucher approval so generated journal lines preserve dimensions. Backend done.
11. Update expense claim, petty cash, advance, and bank account APIs where currently implemented.
12. Wire `/settings/operating-structure` from mock data to APIs. Done.
13. Add report API filters based on line-level dimensions. Backend filtering exists; report UI filters and more report types still required.
14. Upgrade budget schema for concern-first budgeting:
    - make `Budget.projectId` nullable
    - add `Budget.businessUnitId`
    - add `Budget.fundClassId`
    - add BudgetLine dimension overrides
    - add `budgetLineId` support for actual matching
15. Update budget create/edit/list/detail UI/API so a user can create an approved budget for a concern before procurement starts.
16. Update procurement PR schema/API/UI with business unit, cost center, fund class, budget, and budget line fields.
17. Persist PR budget check result and warning metadata.
18. Re-run budget check during PR approval, show warning to admin, allow approval, and persist `approvedWithBudgetWarning` when applicable.
19. Copy PR dimensions and `budgetLineId` to PO lines.
20. Copy PO line dimensions and `budgetLineId` to GRN accounting journal lines.
21. Update budget-vs-actual to read actuals from `JournalEntryLine` by `budgetLineId` first, then dimension/account fallback.
22. Add concern budget vs actual and procurement commitment reports.
23. Add concern-wise trial balance and income statement first.
24. Add dashboard rollups.
25. Add inter-concern transfer and elimination flow after line-level posting is stable.

### Step Completion Rule

After each numbered step:

- run the smallest useful verification command
- update this document or `docs/IMPLEMENTATION_PLAN.md` with current status
- mention files changed and test result in the work log
- do not mark a step done unless database/API behavior has been verified

---

## Acceptance Criteria

The accounting update is acceptable when:

- one transaction can be posted to a specific concern and cost center
- one transaction can contain lines for multiple concerns
- reports can filter by sector, concern, cost center, project, grant, and fund class
- an approved/active concern budget can be created without forcing a project
- procurement PR creation checks against concern budget
- PR approval preserves warning status when approved outside budget
- PO and GRN preserve budget and dimension traceability
- GRN accounting lines contain the same dimensions as the originating PR/PO lines
- budget-vs-actual reflects procurement accounting data from `JournalEntryLine`
- CSS group consolidated report works from the same journal data
- hospital, institute, MFP, AVA Center, and Press reports can be generated separately
- donor reports remain project/grant accurate
- internal transfers can be identified separately from external income/expense
- Bangla and English labels exist for new master-data UI text
- curl tests prove create/list/update flows for operating structure APIs
- curl or direct DB checks prove journal lines store `businessUnitId`, `costCenterId`, and `fundClassId`
- curl or direct DB checks prove report filters change totals correctly

---

## Required Verification

Minimum database checks:

```sql
select count(*) from "Sector";
select count(*) from "BusinessUnit";
select count(*) from "CostCenter";
select count(*) from "FundClass";
select code, "localizedName" from "BusinessUnit" order by code limit 5;
select "businessUnitId", "costCenterId", "fundClassId", count(*)
from "JournalEntryLine"
group by "businessUnitId", "costCenterId", "fundClassId";
```

Minimum curl checks:

```bash
curl -s http://localhost:4000/api/v1/settings/sectors
curl -s http://localhost:4000/api/v1/settings/business-units
curl -s http://localhost:4000/api/v1/settings/cost-centers
curl -s http://localhost:4000/api/v1/settings/fund-classes
curl -s "http://localhost:4000/api/v1/finance/reports/trial-balance?businessUnitId=<BUSINESS_UNIT_ID>"
curl -s "http://localhost:4000/api/v1/finance/reports/income-statement?sectorId=<SECTOR_ID>"
```

Use the repository's existing auth pattern for curl. If auth cookies or tokens are required, obtain them through the existing login endpoint or document why manual browser verification was needed.

---

## Avoid Overengineering

Do not build:

- separate ledger systems per concern
- separate tenants per concern
- duplicated COA per concern by default
- a full consolidation engine before line-level dimensions work
- CSS-only hard-coded report logic

The priority is correct line-level dimensions first.
