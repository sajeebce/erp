# Prompt for Sonnet: Complete Multi-Concern Accounting Implementation

You are working in `K:\projects\erp`. Complete the multi-concern accounting backend and verification work step by step. Do not skip verification, and update documentation after every completed step.

## Read First

Before editing code, read these files:

- `docs/multiconcern.md`
- `docs/multiconcern-accounting.md`
- `docs/multiconcern-hr.md`
- `docs/IMPLEMENTATION_PLAN.md`, Phase 13
- `docs/CSS_MULTI_CONCERN_ARCHITECTURE_DISCUSSION.md` only as background; newer docs override it

Core decisions:

- CSS is one `Organization` / tenant.
- CSS concerns are not separate legal entities.
- Do not add `LegalEntity`.
- Do not create separate ledgers or separate tenants per concern.
- Use one organization-level COA.
- Use line-level dimensions for accounting reports.
- Do not store `sectorId` on `JournalEntryLine`; derive it from `JournalEntryLine.businessUnitId -> BusinessUnit.sectorId`.
- Maintain English and Bangla UI/message support for new visible labels and master data where available.

## Work Rules

- Work incrementally. Finish one step, verify it, update docs, then move to the next step.
- After every completed step, update Phase 13 in `docs/IMPLEMENTATION_PLAN.md` with status and verification notes.
- If behavior or sequence changes, update `docs/multiconcern-accounting.md`.
- Do not mark a task done unless database queries, curl/API checks, or focused UI verification prove it.
- Preserve existing project patterns. Inspect current API response helpers, auth helpers, Prisma client usage, route structure, and i18n pattern before adding new code.
- Do not revert unrelated user changes.
- If full repo lint fails because of existing unrelated errors, document that and run focused checks for the files you changed.

## Step 1: Prisma Schema

Inspect `prisma/schema/*.prisma`. Add operating structure models in `prisma/schema/organization.prisma`:

- `Sector`
- `BusinessUnit`
- `CostCenter`
- `FundClass`
- `OperatingLocation` if required by the existing `/settings/operating-structure` UI

Requirements:

- All models must include `organizationId`.
- Add relations back to `Organization`.
- Add useful indexes and `@@unique([organizationId, code])`.
- Add `localizedName Json?`.
- `BusinessUnit` belongs to `Sector`.
- `CostCenter` belongs to `BusinessUnit`.
- `OperatingLocation` optionally belongs to `BusinessUnit`.

Update finance models in `prisma/schema/finance.prisma`:

- `JournalEntryLine.businessUnitId?`
- `JournalEntryLine.costCenterId?`
- `JournalEntryLine.fundClassId?`
- relation fields to `BusinessUnit`, `CostCenter`, `FundClass`
- indexes for those fields
- optional default/header `businessUnitId?`, `costCenterId?`, `fundClassId?` on `Voucher`, `BankAccount`, `PettyCashFund`, `ExpenseClaim`, `ExpenseClaimItem`, and `EmployeeAdvance` only where API/UI work will persist them now
- optional `Account.businessUnitId?` only for concern-specific account mapping

Update `prisma/schema/budget.prisma` only if current report/budget code needs budget dimensions in this implementation.

Run:

```bash
pnpm db:generate
pnpm prisma migrate dev --name phase13_multi_concern_dimensions
```

Verify:

- Prisma generates successfully.
- Migration is created.
- No `sectorId` exists on `JournalEntryLine`.

Update docs before moving on.

## Step 2: Seed CSS Operating Structure

Create `prisma/seed-css-operating-structure.ts`.

Seed idempotently with `upsert`:

- 5 sectors
- 19 business units / concerns
- 29+ cost centers
- 4 fund classes
- operating locations used by the UI

Include `localizedName: { en, bn }` where labels are available.

Fix `prisma/seed-accounts.ts`:

- keep the 346 CSS COA accounts
- remove hard-coded `shapla-foundation`
- resolve org slug from `CSS_ORG_SLUG` or a clear fallback documented in code
- keep `localizedName` for account names

Run:

```bash
pnpm tsx prisma/seed-css-operating-structure.ts
pnpm tsx prisma/seed-accounts.ts
```

Verify with SQL:

```sql
select count(*) from "Sector";
select count(*) from "BusinessUnit";
select count(*) from "CostCenter";
select count(*) from "FundClass";
select code, name, "localizedName" from "BusinessUnit" order by code limit 5;
```

Update docs before moving on.

## Step 3: Operating Structure APIs

Implement CRUD API routes using existing project API conventions:

- `GET/POST /api/v1/settings/sectors`
- `GET/PUT/DELETE /api/v1/settings/sectors/[id]`
- `GET/POST /api/v1/settings/business-units`
- `GET/PUT/DELETE /api/v1/settings/business-units/[id]`
- `GET/POST /api/v1/settings/cost-centers`
- `GET/PUT/DELETE /api/v1/settings/cost-centers/[id]`
- `GET/POST /api/v1/settings/fund-classes`
- `GET/PUT/DELETE /api/v1/settings/fund-classes/[id]`
- same route pattern for `operating-locations` if the UI tab remains

Validation:

- code unique per organization
- business unit sector must belong to same organization
- cost center business unit must belong to same organization
- inactive records should not be hard-deleted if already referenced

Run curl tests for list/create/update. Use the repo's existing auth pattern if routes require auth.

Update docs before moving on.

## Step 4: Dimension Validation Helper

Add a reusable helper for accounting dimensions.

It must validate:

- `businessUnitId` belongs to organization
- `costCenterId` belongs to selected `businessUnitId`
- `fundClassId` belongs to organization
- `projectId` and `grantId` belong to organization
- if `costCenterId` is provided, `businessUnitId` is required

Use this helper in journal entry and voucher flows first.

Update docs before moving on.

## Step 5: Journal Entry API

Update journal entry create/update APIs to accept line-level:

- `businessUnitId`
- `costCenterId`
- `fundClassId`
- existing `projectId`
- existing `grantId` if supported by current model/API

Rules:

- debit total must equal credit total
- dimensions are stored on `JournalEntryLine`
- header dimensions can be defaults only; reports must use line dimensions
- approved/posted entries cannot be edited if existing behavior prohibits it

Create a test journal entry with at least two lines and dimensions.

Verify with SQL:

```sql
select id, "businessUnitId", "costCenterId", "fundClassId"
from "JournalEntryLine"
where "businessUnitId" is not null
limit 10;
```

Update docs before moving on.

## Step 6: Voucher and Related Finance APIs

Update voucher create/approve flow:

- accept default dimensions on voucher
- generated journal lines must store final dimensions
- do not rely only on voucher header dimensions for reporting

Update bank account, petty cash, expense claim, and employee advance APIs only where current routes already exist and can safely persist the new fields.

Verify by approving a voucher and checking generated `JournalEntryLine` dimensions.

Update docs before moving on.

## Step 7: Wire UI to Real APIs

Wire `/settings/operating-structure` to real APIs:

- remove static mock mutation behavior
- keep loading, error, create, edit, and inactive states
- keep English and Bangla labels through `next-intl`

Fix multilingual gaps:

- translate finance dimension filter labels
- translate `Active` / `Inactive`
- avoid hardcoded visible English labels where message keys should be used

Fix non-standard Tailwind classes such as `w-27.5`, `w-22.5`, `w-45`, `max-w-55` if they are not supported by the repo's theme.

Update docs before moving on.

## Step 8: Financial Reports API Filters

Update financial reports APIs:

- trial balance
- income statement
- balance sheet if current route supports it

Filters:

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

- `sectorId` filters by joining `JournalEntryLine.businessUnitId -> BusinessUnit.sectorId`
- `businessUnitId`, `costCenterId`, `fundClassId` filter directly on journal lines
- only approved/posted entries count
- no-filter reports must still work

Add concern-wise trial balance and income statement if no dedicated endpoint exists yet.

Run curl tests:

```bash
curl -s "http://localhost:4000/api/v1/finance/reports/trial-balance?businessUnitId=<BUSINESS_UNIT_ID>"
curl -s "http://localhost:4000/api/v1/finance/reports/income-statement?sectorId=<SECTOR_ID>"
curl -s "http://localhost:4000/api/v1/finance/reports/trial-balance?fundClassId=<FUND_CLASS_ID>"
```

Compare filtered and unfiltered totals and document the difference.

Update docs before moving on.

## Step 9: Final Verification

Run:

```bash
pnpm db:generate
pnpm lint
pnpm build
```

If `pnpm lint` or `pnpm build` fails due unrelated existing issues:

- record exact unrelated failures
- run focused checks for changed files
- do not claim full verification passed

Run final DB checks:

```sql
select count(*) from "Sector";
select count(*) from "BusinessUnit";
select count(*) from "CostCenter";
select count(*) from "FundClass";
select "businessUnitId", "costCenterId", "fundClassId", count(*)
from "JournalEntryLine"
group by "businessUnitId", "costCenterId", "fundClassId";
```

Final documentation update:

- mark completed Phase 13 tasks in `docs/IMPLEMENTATION_PLAN.md`
- add verification summary under Phase 13
- update `docs/multiconcern-accounting.md` if final implementation differs from the plan
- list remaining gaps clearly instead of hiding them

Final response must include:

- files changed
- migration name
- seed command results
- curl test summary
- DB query summary
- lint/build result
- remaining gaps, if any
