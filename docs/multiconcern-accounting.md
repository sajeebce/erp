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
- `seed-accounts.ts` org slug resolved from `CSS_ORG_SLUG` env var, falls back to `css`.
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

- `prisma/seed-accounts.ts` must not hard-code `css` for CSS seeding. Use `CSS_ORG_SLUG` env var with a safe fallback, or resolve by known CSS organization name only when needed.
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

---

## Browser Test Plan: JE / Voucher Dimension UI

These tests cover the manual JE form + Voucher form dimension selectors and the
filters they enable on the JE / Voucher list pages and Budget vs Actual report.
The Phase 13 backend already accepts these dimensions; this UI work makes them
reachable from the browser.

> Common preconditions (apply to every sub-test):
> - Dev server running at `http://localhost:3000` (`pnpm exec next dev --webpack --port 3000`).
> - Login URL: `http://localhost:3000/login`. Org slug: `cssbd`. Admin: `rahim@cssbd.org` / `SecurePass@2026!`.
> - Operating structure seeded (`pnpm tsx --env-file=.env prisma/seed-css-operating-structure.ts`) so 19 BUs / 29 CCs / 4 FCs exist.
> - Backend smoke: `pnpm tsx --env-file=.env prisma/smoke-dimensions.ts` should report `15 passed, 0 failed` before starting browser tests.

### TC-DIM-1: Manual JE saves header + per-line dimensions

Goal: confirm the new form actually writes `businessUnitId/costCenterId/fundClassId` into JournalEntryLine.

1. Login as Admin. Open `http://localhost:3000/finance/journal-entries/new`.
2. Fill header:
   - Date: today.
   - Narration: `Dimension UI test entry`.
   - Default Dimensions card → Business Unit: `BU-001 · Reverend Abdul Wadud Memorial Hospital`. Fund Class: `FC-RES · Restricted`. Project: any one.
3. Line 1: Account = any expense, Debit = `600000000`, click **Edit** under Dimensions on this line. Override Cost Center to `CC-OPD · OPD` (auto-filtered to BU-001). Click **Hide**.
4. Line 2: Account = any liability/income, Credit = `600000000`. Leave Dimensions unedited; the chips should read `BU (from header)` and `FC (from header)`.
5. Click **Save as Draft**.
6. Browser navigates to the new JE detail page.
7. Expected:
   - Status badge `DRAFT`.
   - Dimensions column on each line shows the BU and FC chips with the codes (`BU-001`, `FC-RES`, `CC-OPD` for line 1).
8. DB sanity: `pnpm tsx --env-file=.env -e "import {prisma} from './src/lib/db'; (async()=>{const lines = await prisma.journalEntryLine.findMany({where:{journalEntry:{description:'Dimension UI test entry'}}, select:{businessUnitId:true,costCenterId:true,fundClassId:true,debit:true,credit:true}}); console.log(lines); await prisma.\$disconnect();})()"`. Expected: both lines have `businessUnitId` set; line 1 also has `costCenterId` and `fundClassId`.

### TC-DIM-2: Cost Center dropdown is filtered by Business Unit

1. Open `/finance/journal-entries/new`. On Line 1, click **Edit** under Dimensions.
2. Set Business Unit = `BU-001 · Hospital`. Open Cost Center dropdown.
3. Expected: list contains only cost centers under BU-001 (e.g. `CC-OPD`, `CC-IPD`, etc.); BU-002 cost centers are hidden.
4. Change Business Unit to `BU-006 · ...` (any other BU). The Cost Center field auto-clears, and reopening shows only that BU's cost centers.
5. Clear Business Unit completely. Cost Center becomes disabled with placeholder "Pick BU first".

### TC-DIM-3: Server rejects Cost Center without Business Unit

1. Open `/finance/journal-entries/new`. Fill the form so it would otherwise save (DR + CR balance, accounts selected, narration set).
2. Skip header BU. On Line 1 click **Edit** → leave BU blank but pick a Cost Center via the dropdown is impossible (the field is disabled — see TC-DIM-2). The client-side guard kicks in.
3. To exercise the SERVER guard, post directly:
   ```bash
   curl -sb /tmp/cookies.txt -X POST 'http://localhost:3000/api/v1/finance/journal-entries' \
     -H 'Content-Type: application/json' \
     -d '{"date":"2026-05-05","description":"bad","fiscalYearId":"<fy-id>","lines":[{"accountId":"<a1>","debit":100,"credit":0,"costCenterId":"<cc-id>"},{"accountId":"<a2>","debit":0,"credit":100}]}'
   ```
4. Expected: HTTP 400, body `{"success":false,"error":{"code":"BAD_REQUEST","message":"businessUnitId is required when costCenterId is provided"}}`.

### TC-DIM-4: Voucher header BU cascades into the auto-posted JE on approval

1. Login as Admin (preparer). Open `/finance/vouchers/new`.
2. Fill: Type = `JOURNAL`, Date = today, Description = `Dim cascade test`, Amount = `5000`.
3. Dimensions card → Business Unit: `BU-006 · Education Sector` (or any other), leave Fund Class / Project / Grant blank.
4. Click **Save as Draft**. Browser navigates to voucher detail.
5. The voucher detail Info card shows a "Business Unit" row — confirm.
6. Login as a different ADMIN/FINANCE_ADMIN (segregation of duty). Open the voucher, click **Approve**.
7. Open the linked Journal Entry from the voucher detail.
8. Expected: the JE header `businessUnitId` and BOTH JE line `businessUnitId` columns equal `BU-006`. Verify in DB:
   ```bash
   pnpm tsx --env-file=.env -e "import {prisma} from './src/lib/db'; (async()=>{const v=await prisma.voucher.findFirst({where:{description:'Dim cascade test'}}); const je=await prisma.journalEntry.findFirst({where:{sourceModule:'voucher',sourceId:v.id},include:{lines:true}}); console.log({je_bu:je.businessUnitId, line_bus: je.lines.map(l=>l.businessUnitId)}); await prisma.\$disconnect();})()"
   ```

### TC-DIM-5: Voucher line override (current limitation note)

Voucher lines are not stored as a separate model in this codebase — a voucher generates two JE lines on approval (one DR, one CR), and they currently both inherit the voucher header dimensions. So a true "line override" is not supported through the voucher form. To override one leg's dimension, post the matching manual JE directly via `/finance/journal-entries/new` (TC-DIM-1).

This is documented as an outstanding follow-up: extend the voucher schema with `VoucherLine` to support per-leg overrides.

### TC-DIM-6: Budget vs Actual picks up dimensioned manual JE

Pre-condition: an APPROVED budget exists for some `(businessUnitId, costCenterId, fundClassId)` combination. If none exists, create one via `/budget/new` with BU=BU-001, CC=CC-OPD, FC=FC-RES and a budget line on (e.g.) the Salary GL account for BDT 100,000.

1. Open `/finance/journal-entries/new` and create a JE matching the budget's dimensions:
   - Header BU = BU-001, FC = FC-RES.
   - Line 1: DR Salary account `50000`, CC = `CC-OPD` (override).
   - Line 2: CR Cash/Bank `50000` (let it inherit BU and FC from header).
2. Save as Draft, then click **Post Entry** on the JE detail. Status becomes `APPROVED`.
3. Open `/budget/budget-vs-actual` (or `/budget/{id}/vs-actual`) and select the matching budget.
4. Expected: the line item that matched on `(BU=BU-001, CC=CC-OPD, FC=FC-RES, account=Salary)` shows an **Actual** value of `50,000` (or increased by 50,000 if there were prior actuals).

### TC-DIM-7: Concern-wise filter on JE list

1. Open `/finance/journal-entries`.
2. In the filter row at the top, select Business Unit = `BU-001`.
3. Expected: only JEs whose **header** `businessUnitId = BU-001` are listed. The `Dimensions` column on each row shows the BU chip.
4. Also try Project and Grant filters. Combine with the Status filter — all four should compose correctly.
5. Clear all filters → full list returns.

### TC-DIM-8: Existing dimensionless JEs still display

Pre-condition: the DB has 139 pre-existing JE lines with NULL dimensions (verified by smoke).

1. Open `/finance/journal-entries`. Don't apply any filter.
2. Expected: the page renders without errors. Old JEs whose header has no BU/project show the "Unassigned" pill in the Dimensions column. Click into one — its read-only lines table shows "Unassigned" or "—" per line.
3. The same applies on `/finance/vouchers` for old vouchers without `businessUnitId`.

### TC-DIM-9: Procurement auto-posted JE preserves dimensions

Pre-condition: complete one full P2P cycle (TC1 of `docs/purchase.md`) so a `PROCUREMENT_GRN`-sourced JE is created.

1. Run a fresh PR with Business Unit + Cost Center + Fund Class set on its lines (the PR new form already supports this since the procurement-classification phase).
2. Approve PR → create PO → Store Manager creates GRN → ACCEPTED → Admin clicks **Post Accounting**.
3. Open the auto-posted JE at `/finance/journal-entries/{id}`.
4. Expected: every line's Dimensions column shows the BU + CC + FC chips inherited from the originating PR/PO line. The header also shows the BU. The procurement-driven JE flow is unchanged after the UI work.

### TC-DIM-10: Bangla labels visible (i18n smoke)

1. With the dev server up, switch the UI language to Bangla via the language switcher in the top bar.
2. Open `/finance/journal-entries`.
3. Expected: list page filter labels and column headers translate where translations exist (e.g. status, debit, credit). The DimensionSelector `BU · code` chips remain English-coded because the **codes** are not localized — but the master data's `localizedName.bn` (e.g. `রেভ. আবদুল ওয়াদুদ মেমোরিয়াল হাসপাতাল` for BU-001) appears wherever the page joins to BU/CC/FC name fields. Confirm at least the BU dropdown options in the new JE form display Bangla short names where seeded.
4. Switch back to English to confirm parity.

### Smoke verification command

The dimension flow is also covered by a non-HTTP smoke test that exercises the
exact DB calls the API routes do:

```bash
pnpm tsx --env-file=.env prisma/smoke-dimensions.ts
# Expected: "Done. 15 passed, 0 failed."
```

This script validates: header + line dimension persistence, `validateDimensions`
helper rejecting CC-without-BU and CC-mismatched-with-BU, voucher → JE BU
cascade, line-level BU filter on the list, NULL dimension rows still queryable,
and procurement-sourced JE lines unchanged by the refactor.

### Outstanding follow-ups

1. **Voucher schema extension for line-level dimensions** (TC-DIM-5 limitation).
   Add a `VoucherLine` table so a single voucher can post multiple JE legs with
   different `businessUnitId/costCenterId/fundClassId` per leg. Today the
   voucher generates exactly two JE lines on approval, both inheriting the
   single voucher-header BU.
2. **Reports** (`/finance/financial-reports`, trial balance, income statement)
   should expose BU/CC/FC filters in their UI; the API already accepts them.
3. **Backfill** a one-off script to fill in `businessUnitId` on the 139 legacy
   JE lines that have NULL dimensions, if the org wants its concern-wise
   reports to reflect prior periods. Today those 139 lines silently fall under
   "Unassigned" in concern-filtered reports.

---

## Concern-wise Report UI — Test Cases

These tests cover the shared `<ReportFilterBar>` wired into the existing financial
report renderer, plus the seven dedicated routes added under `/reports/`.

> Common preconditions:
> - Dev server at `http://localhost:3000` (`pnpm exec next dev --webpack --port 3000`).
> - Login: `rahim@cssbd.org` / `SecurePass@2026!` / orgSlug `cssbd`.
> - Operating structure seed loaded (`pnpm tsx --env-file=.env prisma/seed-css-operating-structure.ts`) so the org has 19 BUs / 29 CCs / 4 FCs / 5 Sectors.
> - At least one APPROVED journal entry exists in the current fiscal year. If none, run TC-DIM-1 from the dimension UI test plan first to create one.

### TCR1 — Filter by single Business Unit on Trial Balance

1. Login as Admin. Open `http://localhost:3000/finance/financial-reports/trial-balance`.
2. The new "Filters" card appears above the fiscal year row.
3. Pick **Business Unit** = `BU-001 · Reverend Abdul Wadud Memorial Hospital`.
4. The URL updates to `?...&businessUnitId=<uuid>` and the report auto-refreshes.
5. Expected: rows show only accounts that have at least one approved JE line tagged to BU-001 in the current fiscal year. Period debit total equals period credit total (balanced).
6. Verify in DB:
   ```
   pnpm tsx --env-file=.env -e "import {prisma} from './src/lib/db';(async()=>{const lines=await prisma.journalEntryLine.findMany({where:{businessUnitId:'<bu-uuid>',journalEntry:{status:'APPROVED'}}});const dr=lines.reduce((s,l)=>s+Number(l.debit),0);const cr=lines.reduce((s,l)=>s+Number(l.credit),0);console.log({dr,cr});await prisma.\$disconnect();})()"
   ```
   The numbers should match the periodDebit/periodCredit totals on screen.

### TCR2 — Filter by Fund Class + Project on Income Statement

1. Open `/reports/concern-income-statement`.
2. Filters: Fund Class = `FC-RES · Restricted`, Project = any project tagged restricted.
3. Expected: only income/expense accounts with lines matching BOTH dimensions appear. The Net Surplus / (Deficit) row at the bottom equals total income − total expenses computed for that filtered scope.

### TCR3 — Sector-wise Trial Balance grand total equals unfiltered TB grand total

1. Open `/reports/sector-trial-balance` with no filters. Note the bottom Grand Total `periodDebit` and `periodCredit`.
2. Open `/finance/financial-reports/trial-balance` with no filters.
3. Expected: the unfiltered trial balance's totals match the sector-trial-balance grand total to within rounding tolerance. The sector report may include a "Sector unassigned" group that holds rows whose BU has no `sectorId`.

### TCR4 — Date range filter excludes JEs outside the range

1. Open `/finance/financial-reports/day-book`.
2. Filters: From = a future date (e.g. `2099-01-01`), To = `2099-12-31`.
3. Expected: empty result and "No data" message; no JEs appear.
4. Clear the From date. Expected: rows return.

### TCR5 — Clear-filters button restores unfiltered view

1. On `/finance/financial-reports/trial-balance`, apply BU + FC + Project filters.
2. Click **Clear** in the filter card.
3. Expected: all dropdowns reset to "All …", URL drops the dimension query params, and the report re-fetches the unfiltered data set.

### TCR6 — Inter-Concern Transactions report

1. Open `/reports/inter-concern-transactions` with no filters. The current seed produces zero cross-BU JEs (see API summary `crossBuCount: 0`).
2. Expected: the page renders without crashing and shows the empty-state message "No journal entries spanning multiple Business Units or Fund Classes for the selected period."
3. To populate: post a manual JE with Line 1 BU=A, Line 2 BU=B (TC-DIM-1 in the dimension UI test plan does this). Refresh the report; the new JE appears with `businessUnits` showing both BU codes.

### TCR7 — CSV export downloads filtered rows

1. On `/reports/cost-center-expenses`, apply Business Unit = any BU.
2. Click the **CSV** button in the ReportViewer toolbar.
3. Expected: a `.csv` file downloads with the same column headers and rows shown on screen, restricted to the filtered set. Open in Excel/LibreOffice — totals row at the bottom matches the on-screen Grand Total.

### TCR8 — URL-based deep link pre-applies the filter

1. Copy the URL after applying a BU filter on `/finance/financial-reports/trial-balance` (it should look like `…/trial-balance?businessUnitId=<uuid>`).
2. Open the URL in an incognito window. Login.
3. Expected: the BU filter is **already** applied (the dropdown shows the selected BU and the report shows the filtered totals immediately). Sharing the URL produces the same filtered view for the recipient.

### Outstanding follow-ups

1. **Multi-select** filters — today each dimension picks exactly one value. The
   spec hinted "multi-select if convenient"; defer until a real demand surfaces
   (the API would need `IN`-clause expansion).
2. **Sector-wise income statement / balance sheet** as separate routes — the
   existing `/reports/concern-income-statement` and `/reports/concern-balance-sheet`
   accept the `sectorId` filter so a sector view is reachable today; dedicated
   "by sector" group-by could be added later with an extra `groupBy=sector`
   query param on the income-statement / balance-sheet APIs.
3. **Voucher line override** dimension overrides cascading into the auto-posted
   JE on approval — same gap noted in TC-DIM-5; relevant when reports want to
   distinguish per-leg dimensions on voucher-sourced JEs.

