# Multi-Concern Accounting Plan

> Prepared: 2026-04-24  
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

The most important table is `JournalEntryLine`. Reporting should use line-level dimensions because one voucher or journal entry can contain lines for multiple concerns or cost centers.

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

1. Add master models: `Sector`, `BusinessUnit`, `CostCenter`, `FundClass`, and `OperatingLocation` if required by the UI.
2. Add dimension FKs to `JournalEntryLine`; do not add `sectorId` to journal lines.
3. Add default/header dimension FKs to `Account`, `BankAccount`, `PettyCashFund`, `Voucher`, `ExpenseClaim`, `ExpenseClaimItem`, `EmployeeAdvance`, `Budget`, and `BudgetLine` only where the current UI/API needs them.
4. Run Prisma migration and generate the Prisma client.
5. Add idempotent CSS operating structure seed data.
6. Fix `seed-accounts.ts` to use the target organization slug dynamically.
7. Add CRUD APIs for operating structure master data.
8. Add reusable dimension validation helpers.
9. Update journal entry API to accept and persist line-level dimensions.
10. Update voucher approval so generated journal lines preserve dimensions.
11. Update expense claim, petty cash, advance, and bank account APIs where currently implemented.
12. Wire `/settings/operating-structure` from mock data to APIs.
13. Add report API filters based on line-level dimensions.
14. Add concern-wise trial balance and income statement first.
15. Add dashboard rollups.
16. Add inter-concern transfer and elimination flow after line-level posting is stable.

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
