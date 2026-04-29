# Plan Name: Purchase-to-Pay Connected Control Plan

## Goal

Procurement, Budget, Inventory, Asset, Finance, and Approval menus should behave as one connected purchase-to-pay flow:

1. Staff creates a purchase requisition against an approved concern/project budget.
2. Admin reviews budget impact, then approves, rejects with reason, or returns/modifies with note.
3. Approved PR creates a PO.
4. Store Manager receives goods through GRN.
5. Accepted GRN updates the correct downstream register:
   - consumable/store item -> Inventory stock and inventory transaction
   - fixed asset item -> Asset Register
   - service/expense item -> no inventory or asset, but finance payable/expense entry
6. Finance records the correct journal/voucher impact and Budget vs Actual reflects actual cost.

## Current Status From Code Study

| Area | Current behavior | Status |
|---|---|---|
| Menu logic | Procurement, Budget, Finance, Assets, Reports, Settings are separate menus but share schema links. Navigation role filtering exists in `src/data/navigation.ts`. | Partially connected |
| PR creation | `/procurement/requisitions/new` creates a PR with concern, cost center, fund class, budget, project, and classified line items (`INVENTORY`, `FIXED_ASSET`, `SERVICE_OR_EXPENSE`) including destination/account references where applicable. API checks budget and stores warning. | Phase 3 classification done |
| PR status | Phase 1 implemented explicit draft vs submit behavior. PR create can save `DRAFT` or create `SUBMITTED`, `/submit` moves draft/returned PRs to `SUBMITTED`, `RETURNED` exists in the enum, and direct approval of `DRAFT` is blocked. | Done in Phase 1 |
| Budget control | `checkProcurementBudget()` checks approved/active budget, previous PR commitments, and approved JE actuals. It warns; it does not block. | Partial, acceptable if warning approval is audited |
| PR approval | `/api/v1/procurement/requisitions/[id]/approve` now starts/resumes a workflow instance and calls the shared approval engine. It only marks the PR `APPROVED` when the final workflow step is approved; intermediate approvals leave the PR in `REVIEWED`. | Done in Phase 2 engine/API |
| Reject/return/modify | Phase 1 added reject, return-for-correction, submit, and modify-and-approve endpoints plus PR detail UI dialogs for reason/note capture. Phase 2 wired modify-and-approve through the workflow engine, so it cannot skip a non-Admin or earlier pending step. Structured fields store rejection, return, modification, and approval notes. | Done in Phase 1/2 |
| Approval hierarchy | PR submit/approve/reject/return/modify-and-approve now uses `ApprovalWorkflowDef`, `ApprovalInstance`, `ApprovalInstanceStep`, and `ApprovalAction`. The engine snapshots steps, filters by `entityType`, and rejects out-of-order role approvals server-side. Settings > Workflows is DB-backed and has GET/POST API plus deactivate DELETE API, but the browser page is still read-only. | Phase 2 engine/API done; CRUD UI gap remains |
| PO creation | Admin can create an issued PO from an approved PR. PO lines link to PR lines via `prLineId`, copy line classification/destination/account fields, and PR becomes `PO_CREATED`. | Phase 3 classification done |
| GRN creation | PO detail can create GRN. API copies PO line classification/destination/account fields into `GoodsReceiptLine`, validates PO status (`ISSUED` / `PARTIALLY_RECEIVED` only), updates PO line `receivedQty`, and updates PO status. | Phase 4 status validation done |
| Inventory update | Accepted inventory GRN lines now create idempotent `InventoryTransaction` rows from persisted `GoodsReceiptLine` data, update `InventoryItem.stockInHand`, recalculate `totalValue`, weighted `unitPrice`, and stock status in the same DB transaction, and show linked transactions on GRN detail. | Done in Phase 4 |
| Asset registration | GRN detail registers fixed assets from accepted or partial GRNs with structured `sourceModule`, `sourceId`, `sourceLineId`, and `sourceUnitIndex` references. A unique index prevents duplicate creation beyond accepted quantity, and GRN detail reloads persisted linked assets. | Done in Phase 5 |
| Finance posting | GRN detail posts one approved, source-linked JE per GRN. Debit lines are generated per accepted GRN line and routed by item type/account (`INVENTORY` and `FIXED_ASSET` to asset accounts, `SERVICE_OR_EXPENSE` to expense accounts); AP is credited once through a liability account. A unique index prevents duplicate GRN accounting JEs. | Done in Phase 6 |
| Roles/users | The CSS org has only `rahim@cssbd.org` (created by `prisma/seed-bootstrap.ts`). `STAFF` and `STORE_MANAGER` role records are not auto-seeded; an on-demand endpoint `POST /api/v1/settings/seed-roles` (`src/app/api/v1/settings/seed-roles/route.ts`) creates them. No demo users exist for those roles. | Test prerequisite missing |

## Additional Gaps Found After Review

These are implementation blockers that should be handled before the full browser test plan is considered executable.

1. Approval workflow snapshot is missing. **Phase 2 update: closed.**
   - The test plan expects older in-flight PRs to keep their original routing after a workflow rule changes.
   - `ApprovalInstanceStep` rows now snapshot step number, name, role ID, role name, and status at submit time.

2. Approval action model is too thin for pending-step UI. **Phase 2 update: closed for status tracking.**
   - `ApprovalAction` remains the immutable action log.
   - `ApprovalInstanceStep` now stores `PENDING`, `WAITING`, `APPROVED`, `REJECTED`, and `RETURNED` status plus actor/comment/timestamp fields for the step timeline.

3. Approval engine does not enforce approver role. **Phase 2 update: closed.**
   - `processApproval()` now compares the current pending `ApprovalInstanceStep.roleId` with the actor's actual `User.roleId` and returns forbidden on mismatch.

4. Settings > Workflows is currently static. **Phase 2 update: partially closed.**
   - `src/app/(dashboard)/settings/workflows/page.tsx` now renders DB-backed workflow rows.
   - `GET/POST /api/v1/settings/workflows` can list and upsert workflow definitions and steps.
   - `DELETE /api/v1/settings/workflows/[id]` deactivates a workflow without deleting historical approval links.
   - Remaining gap: the browser page is read-only; create/edit/delete form controls still need to be added so TC7 can be executed without curl.

5. PR enum/status model needs a decision. **Phase 1 update:** `RETURNED` has been added and the draft/submit/return path is implemented.
   - The target flow needs at least `DRAFT`, `SUBMITTED`, `UNDER_REVIEW` or `REVIEWED`, `RETURNED`, `APPROVED`, `REJECTED`, `PO_CREATED`.
   - Remaining Phase 2 decision: whether workflow status should introduce a separate PR-level `UNDER_REVIEW` state or keep that state only inside `ApprovalInstance`.

6. PR notes/reasons need structured fields. **Phase 1/2 update:** `submittedAt`, rejection, return, approval, and modify-approval fields have been added to `PurchaseRequisition`; per-step workflow history is stored in `ApprovalInstanceStep`.
   - Remaining UI work: show the per-step workflow history on PR detail as an approval timeline.

7. Admin modify-and-approve needs controlled editing rules. **Phase 1/2 update:** a separate admin correction endpoint/UI now preserves existing-line dimensions, validates submitted line IDs belong to the current PR, writes old/new values to audit, recalculates totals, reruns budget check, and approves through the workflow engine.
   - Remaining hardening: consider an upsert pattern later if PO-line traceability ever needs to survive admin edits before approval. New lines without an existing line ID still receive only PR-level default dimensions.

8. GRN creation is not role-restricted enough. **Phase 6 follow-up update: closed.**
   - `POST /api/v1/procurement/goods-receipt` now uses `requireRoleFromRequest(request, ['STORE_MANAGER'])`.
   - `ADMIN` still passes through the shared role helper, but a normal `STAFF` token is rejected server-side.

9. PO creation does not enforce approved vendor. **Phase 6 follow-up update: closed.**
   - `POST /api/v1/procurement/orders` now rejects inactive vendors.
   - It also rejects unapproved vendors, so the API matches the PR detail UI approved-vendor filter.

10. Partial GRN asset registration is blocked. **Phase 5 update: closed.**
    - `register-assets` only allows GRN status `ACCEPTED`.
    - A partial GRN may still have accepted fixed-asset quantities; the asset registration rule should work per accepted line quantity.

11. Inventory idempotency requires schema support. **Phase 4 update: closed.**
    - `InventoryTransaction` now has `sourceModule`, `sourceId`, `sourceLineId`, `unitCost`, and `totalCost`.
    - A unique constraint on `(sourceModule, sourceLineId)` blocks duplicate stock posting for the same GRN line.
    - PostgreSQL allows multiple `(NULL, NULL)` rows under this unique constraint, so manual/non-procurement inventory transactions remain backward-compatible.
    - GRN posting reads persisted `GoodsReceiptLine.inventoryItemId` and removes the old request-body-only `line.inventoryItemId` stock increment path.
    - The posting code first checks for an existing source-line transaction and skips it on the normal idempotent path; the unique constraint is the DB safety net.
    - Verified on 2026-04-29 with `GRN-2026-003`: direct duplicate insert attempt returned Prisma `P2002` and the source-line transaction count stayed `1`.

12. Full purchase-to-pay needs vendor invoice/payment.
    - The current plan covers GRN -> AP journal entry, but not vendor invoice matching, payment voucher, AP settlement, and bank/cash impact.
    - If the goal is complete purchase-to-pay, add a later phase for invoice and payment: PO/GRN match -> AP invoice -> payment voucher -> bank/cash -> bank reconciliation.

13. PR detail page reject/return/modify action UI. **Phase 1/2 update:** submit, approve, reject, return, and modify-and-approve actions now exist on PR detail with dialogs for the required notes/reasons. API execution is now workflow-step enforced.
    - Remaining UI work: action visibility should be driven by the current workflow step, not only by role/status display assumptions.

14. PR detail has no approval timeline component.
    - Once hierarchy lands, users need to see "Step 1 of 3 — Pending Program Coordinator", "Step 2 — Approved by Finance Manager on 2026-04-28", etc.
    - No such component exists today; status is shown only as a single badge.
    - Add a timeline that reads from `ApprovalInstance`, `ApprovalInstanceStep`, and `ApprovalAction`.

15. Approval engine ignores `entityType` when picking a workflow. **Phase 2 update: closed.**
    - `ApprovalWorkflowDef` has an `entityType` column (`prisma/schema/system.prisma`), but `startApproval()` queries with only `(organizationId, name, isActive)`.
    - If two modules share a workflow name, the wrong workflow could be matched.
    - Engine query now includes `entityType: params.entityType`.
    - Remaining optional schema hardening: widen the unique constraint to `(organizationId, entityType, name)` if name reuse across modules is required.

16. GRN creation does not validate PO status. **Phase 4 update: closed.**
    - `POST /api/v1/procurement/goods-receipt` now rejects any PO that is not `ISSUED` or `PARTIALLY_RECEIVED`.
    - Verified on 2026-04-29: a second GRN attempt against completed `PO-2026-003` returned `BAD_REQUEST` with current status `COMPLETED`.

17. Finance posting check-then-write is not atomic. **Phase 6 update: closed for GRN accounting.**
    - GRN creation now creates the receipt, updates PO received quantity/status, posts inventory transactions, and updates inventory stock/value/status inside one Prisma transaction.
    - This closes the atomicity risk for the GRN -> inventory side.
    - `post-accounting/route.ts` now performs duplicate check and JE creation in a Prisma transaction.
    - `JournalEntry` also has a unique DB index on `(sourceModule, sourceId)`, so concurrent duplicate posting fails fast.

18. `GoodsReceipt` has no `deletedAt` column.
    - `PurchaseRequisition`, `PurchaseOrder`, `Vendor`, `Contract`, etc. all use soft delete; `GoodsReceipt` does not.
    - Pick one model (soft delete or hard delete) and apply it consistently — currently a misposted GRN cannot be soft-deleted, only fully removed (which loses audit links).

19. PR/PO/GRN line classification. **Phase 3 update: closed.**
    - `ProcurementItemType` now exists with `INVENTORY`, `FIXED_ASSET`, and `SERVICE_OR_EXPENSE`.
    - `PurchaseRequisitionLine`, `PurchaseOrderLine`, and `GoodsReceiptLine` now persist item type, inventory item, warehouse, asset category, and GL account references.
    - PR create UI exposes item type and the relevant destination/account selectors.
    - API validation checks inventory items, warehouses, asset categories, and accounts belong to the current organization.
    - Verified with curl + DB query: PR `PR-2026-015` -> PO `PO-2026-002` -> GRN `GRN-2026-002` retained item type, inventory reference, and account reference through all three line tables.
    - Existing historical rows default to `SERVICE_OR_EXPENSE`; browser tests for inventory/asset paths should use fresh PRs created after Phase 3.
    - Phase 4 hardening completed: explicit warehouse mismatch with the selected inventory item is rejected by the shared line-classification helper.
    - Phase 6 hardening completed: GRN accounting validates debit account type by item type, so fixed asset/inventory lines cannot post to expense accounts and service/expense lines cannot post to asset accounts unless the model is explicitly changed later.

## Correct Target Flow

### A. Budget -> PR

- Staff selects concern/business unit, cost center, fund class, optional project, approved budget, and item lines.
- Each line should include:
  - item type: `INVENTORY`, `FIXED_ASSET`, `SERVICE_OR_EXPENSE`
  - account/GL account
  - optional budget line
  - quantity, unit price, specification
- System should calculate:
  - total estimate
  - available budget
  - committed amount from open PR/PO
  - actual amount from posted finance entries
- If over budget, Staff can submit, but Admin must see warning and approve with explicit note.

### B. PR Approval

- Staff can save draft and submit.
- Admin can:
  - approve
  - reject with required reason
  - return for correction with note
  - modify allowed fields with change note, then approve
- All approval actions must create audit trail entries.
- Settings > Approval Workflows should control hierarchy, e.g.:
  - up to BDT 50,000: Admin approval
  - BDT 50,001-500,000: Program/Finance/Admin steps
  - above BDT 500,000: Executive/Admin steps

### C. PR -> PO

- Only approved PR can create PO.
- PO should copy PR line dimensions: budget line, account, concern, cost center, fund class, project/grant.
- PO should reserve/commit budget until GRN/accounting is posted.
- PO should not be manually edited in a way that loses PR traceability.

### D. PO -> GRN

- Store Manager receives against issued/partially received PO.
- For each PO line, Store Manager records accepted and rejected quantity.
- GRN should store item type and destination:
  - inventory item and warehouse for consumables
  - asset category and optional warehouse/custodian for fixed assets
  - no stock destination for service/expense

### E. GRN -> Inventory/Asset/Finance

- Inventory item:
  - increment `InventoryItem.stockInHand`
  - update `InventoryItem.totalValue`
  - update `InventoryItem.status`
  - create `InventoryTransaction` with reference GRN No and GRN line ID
- Fixed asset:
  - create one asset per accepted unit, or one grouped asset if policy allows
  - store source GRN/GRN line/PO line reference to prevent duplicates
  - asset appears in Assets > Asset Register
- Finance:
  - inventory item: DR Inventory, CR Accounts Payable
  - fixed asset: DR Fixed Assets, CR Accounts Payable
  - service/expense: DR Expense account, CR Accounts Payable
  - every JE line carries budget line, concern, cost center, fund class, project/grant where available
- Budget vs Actual should increase after JE posting, not at PR creation.

## Implementation Plan

### Phase 1: Make PR lifecycle explicit

Status: implemented. Verified with API/curl and DB queries against the CSS demo organization on 2026-04-29. One hardening item was added after review: modify-and-approve must reject foreign line IDs instead of treating them as new lines.

1. Add `/api/v1/procurement/requisitions/[id]/submit`.
2. Change PR create UI to offer `Save Draft` and `Submit`.
3. Restrict approval to `SUBMITTED` or `REVIEWED`, not `DRAFT`.
4. Add reject endpoint:
   - `POST /api/v1/procurement/requisitions/[id]/reject`
   - required `reason`
   - status `REJECTED`
   - audit log
5. Add return endpoint:
   - `POST /api/v1/procurement/requisitions/[id]/return`
   - required `note`
   - status `DRAFT` or `RETURNED` if enum is added
6. Add admin approval dialog with note, warning acknowledgement, reject reason, and return note.

### Phase 2: Connect approval hierarchy

Status: engine/API implemented. Verified with curl and DB queries against the CSS demo organization on 2026-04-29: workflow step snapshots are created, role mismatch returns 403, modify-and-approve respects the current workflow step, workflow deactivation works through API, and in-flight PRs keep their original pending role after the workflow definition is changed. Remaining browser gap: Settings > Workflows is DB-backed but still read-only, so workflow create/edit/deactivate still requires API/curl.

1. Decide whether to reuse `ApprovalWorkflowDef`, `ApprovalInstance`, and `ApprovalAction`.
2. Start approval instance when PR is submitted.
3. Use workflow amount thresholds based on PR total.
4. Enforce current approver role in API, not only UI.
5. Show current approval step on PR detail.
   - Remaining UI gap: add full per-step timeline component using `ApprovalInstanceStep`.
6. Settings > Workflows must create/edit the rules used by PR approval.
   - API exists for list/upsert/deactivate.
   - Remaining UI gap: create/edit/deactivate form controls on the browser page.

### Phase 3: Classify procurement lines

Status: implemented. Verified with curl and DB queries against the CSS demo organization on 2026-04-29: classified PR lines copied into PO lines and then GRN lines, including inventory/account references.

1. Add item classification to PR/PO/GRN lines:
   - `itemType`
   - `inventoryItemId`
   - `warehouseId`
   - `assetCategoryId`
   - `expenseAccountId` or `accountId`
2. Update PR create UI to choose item type and GL/budget line.
3. Copy line classification from PR to PO.
4. Copy receiving destination from PO to GRN, while allowing Store Manager to adjust warehouse/serial info.

### Phase 4: Fix inventory posting from GRN

Status: implemented. Verified with curl/API, DB queries, and browser smoke against the CSS demo organization on 2026-04-29: `PR-2026-016` -> `PO-2026-003` -> `GRN-2026-003` created one `IN` inventory transaction for qty `3`, set stock balance to `3`, recalculated total value to BDT `2,100`, and showed the transaction on GRN detail.

1. In GRN create API, direct stock increment was replaced with persisted-GRN-line inventory posting.
2. `InventoryTransaction` is created for every accepted inventory line.
3. Stock, total value, weighted unit price, and stock status are updated in one DB transaction.
4. GRN line source reference is stored and uniquely constrained so duplicate inventory posting is blocked.
5. GRN detail now shows linked inventory posting transactions.

Additional Phase 4 controls implemented:

- GRN creation validates quantities server-side: accepted/rejected/received must be non-negative, accepted + rejected cannot exceed received, and accepted quantity cannot exceed the PO line's remaining quantity.
- GRN creation trusts PO line data for ordered quantity and classification instead of trusting the request body.
- GRN creation validates PO status and rejects completed/cancelled/draft POs.
- Inventory posting performs a defense-in-depth warehouse check before mutating stock.
- `InventoryTransaction.unitCost` and `InventoryTransaction.totalCost` preserve costing audit data.

Non-blocking Phase 4 observations:

- Inventory lines are posted sequentially inside the DB transaction. This is acceptable for normal GRN sizes; if large bulk GRNs become common, this can be optimized later.
- Inventory transaction rows are the per-line stock audit record. The separate audit trail currently records one GRN create entry, not one audit row per inventory line.

### Phase 5: Fix asset registration from GRN

Status: implemented. Verified with curl/API, DB queries, and GRN detail page smoke against the CSS demo organization on 2026-04-29: `PO-2026-005` -> `GRN-2026-005` registered two fixed assets (`AST-2026-005`, `AST-2026-006`) with structured `PROCUREMENT_GRN` source references, page refresh returned both linked assets, and a duplicate registration attempt returned HTTP 400 with zero remaining units.

1. Add source references to Asset:
   - `sourceModule = PROCUREMENT_GRN`
   - `sourceId = grnId`
   - `sourceLineId = grnLineId`
   - `sourceUnitIndex = accepted unit index`
2. Block duplicate asset creation for the same accepted quantity.
   - A unique index on `(sourceModule, sourceLineId, sourceUnitIndex)` is the DB safety net.
   - Registration plans all assets first and creates them in one DB transaction, so a failed batch does not leave partial asset rows.
3. Require asset category for fixed asset lines.
   - The GRN line must be classified as `FIXED_ASSET`.
   - The registration API still accepts `categoryId` so Store Manager/Admin can refine the final asset category at registration time.
4. Optional but recommended: require warehouse or custodian before final registration.
   - Current implementation validates warehouse when supplied, but does not require warehouse/custodian.
5. Show created assets after page refresh, not only in temporary UI state.
   - `GET /api/v1/procurement/goods-receipt/[id]` now returns persisted `registeredAssets`.

Deployment note: the local development DB was non-empty and not migration-baselined, so `prisma migrate deploy` returned `P3005` during verification. The Phase 5 migration SQL is additive and was applied directly for local testing. Production/staging migration history should be baselined before the next cutover.

### Phase 6: Fix finance posting logic

Status: implemented. Verified with curl/API and DB queries against the CSS demo organization on 2026-04-29: mixed `PO-2026-008` -> `GRN-2026-008` posted `JE-2026-104` with total debit/credit BDT `89,400`, three debit lines routed by item type (`ASSET`, `ASSET`, `EXPENSE`), one Accounts Payable credit line (`LIABILITY`), one source-linked JE for the GRN, and duplicate posting blocked on repeat request.

1. Replace hard-coded fixed asset posting with line-wise posting:
   - inventory -> Inventory account
   - fixed asset -> Fixed asset account
   - service/expense -> selected expense account
2. Keep AP credit per vendor.
3. Create one balanced JE per GRN, with source `PROCUREMENT_GRN`.
4. Prevent duplicate posting using source module/source ID.
   - A unique DB index on `(sourceModule, sourceId)` prevents concurrent duplicate JEs for the same GRN.
5. Vendor payment / AP settlement is covered by Phase 8 — including TDS/VDS withholding splits where applicable. GRN posting must only recognise AP; it must not touch Bank/Cash or Reconciliation directly.

### Phase 7: Role and permission hardening

Status: implemented for the procurement-to-GRN operational API surface. Verified with curl and DB queries against the local CSS demo organization on 2026-04-29: Staff can create/view their own PR, Staff cannot view an Admin-created PR, Store Manager cannot create PRs, Staff direct access to PO/Inventory/Warehouse/Assets APIs returns 403, Store Manager can access PO/Inventory/Warehouse/Assets operational APIs, and Staff cannot post GRN accounting.

1. Create/seed demo users:
   - Staff: `kamal@cssbd.org`
   - Store Manager: `shakil@cssbd.org`
   - Admin: `rahim@cssbd.org`
2. Enforce API roles consistently:
   - STAFF: create/view own PR, submit own PR
   - ADMIN: approve/reject/return PR, create PO, post accounting
   - STORE_MANAGER: create GRN, manage inventory, register assets
   - Phase 7 update: PR creation now requires `STAFF` (Admin still passes through the shared role helper), PR detail no longer exposes another user's PR to non-Admin users, PO list/detail requires Store Manager/Admin, inventory and warehouse APIs require Store Manager/Admin, and main asset register/category APIs require Store Manager/Admin.
3. Use role permissions or workflow approver rules server-side. Sidebar hiding is not enough.
4. Add tests for forbidden actions.
   - Phase 7 update: forbidden curl checks cover Store Manager PR create, Staff PO list, Staff inventory list, Staff warehouse list, Staff asset list, Staff GRN accounting post, and Staff access to an Admin-created PR.

### Phase 8: Vendor invoice, payment, and AP settlement

This phase closes the purchase-to-pay loop after GRN accounting. Without it, the system proves procurement-to-AP, but not full payment control.

Status: implemented for the backend vendor invoice and AP payment settlement flow on 2026-04-29. The local CSS demo flow now supports invoice matching against accepted GRNs, invoice approval/rejection, partial payments, bank voucher creation, payment journal posting with optional TDS/VDS withholding, bank balance reduction, duplicate invoice controls, and outstanding amount controls.

1. Add vendor invoice/AP invoice support:
   - invoice number, invoice date, vendor, PO, one or more GRNs
   - invoice amount, tax/VAT/TDS/VDS fields if applicable
   - status: `DRAFT`, `SUBMITTED`, `MATCHED`, `APPROVED`, `PARTIALLY_PAID`, `PAID`, `REJECTED`, `CANCELLED`
2. Add three-way matching:
   - PO ordered quantity and price
   - GRN accepted quantity
   - vendor invoice quantity and price
   - block or warn on over-invoicing, duplicate invoice number, or invoice without accepted GRN
3. Add invoice approval workflow:
   - Finance verifies invoice after Store Manager GRN
   - Admin or configured approver approves payment
   - rejection requires reason
4. Add payment voucher/AP settlement:
   - payment method: bank, cash, mobile banking, cheque
   - selected bank/cash account
   - partial payment support
   - payment reference/cheque number
5. Post payment accounting (Bangladesh NGO context — TDS/VDS withholding):
   - DR Accounts Payable (full invoice gross amount)
   - CR Bank/Cash (net amount actually disbursed to the vendor)
   - CR TDS Payable (income tax withheld at source per NBR rate, posted as liability — later remitted to NBR via separate payment)
   - CR VDS Payable (VAT deducted at source, same liability + remit pattern)
   - For invoices with no withholding, the TDS/VDS legs are zero and the JE collapses to DR AP / CR Bank
   - Withholding rates should come from a configurable rate table (vendor type, service category) — not hard-coded
   - link JE/voucher/payment to vendor invoice and original GRN/PO
6. Update cash/bank state:
   - reduce selected bank/cash balance after approved payment
   - show transaction in Finance > Bank & Cash
   - expose it for Finance > Bank Reconciliation matching
7. Add audit trail and duplicate controls:
   - prevent duplicate payment for the same invoice beyond outstanding amount
   - prevent duplicate vendor invoice number per vendor
   - audit invoice approval, rejection, payment creation, and payment posting

Phase 8 implementation update:

- Added `VendorInvoice`, `VendorInvoiceGrn`, and `VendorPayment` finance tables plus migration `20260429090000_phase8_vendor_invoice_payment`.
- Added Admin-only APIs under `/api/v1/finance/vendor-invoices` for listing, matching/creating invoices, detail view, approval, rejection, and payments.
- Three-way matching blocks duplicate vendor invoice numbers, invoices without accepted GRNs, GRNs that are already linked to another active invoice, and invoice gross amounts above the accepted GRN value calculated from PO unit prices.
- Payment posting creates approved journal entries and bank/cash vouchers, supports partial settlement, reduces selected bank account balance by the net paid amount, and posts optional TDS/VDS payable lines.
- Verified with curl and DB queries against local CSS demo data: Staff invoice access returned 403, over-invoicing was rejected, duplicate invoice number was rejected, invoice `INV-PH8-084657` moved from `MATCHED` to `APPROVED` to `PARTIALLY_PAID` to `PAID`, payments `VP-2026-0001` and `VP-2026-0002` created balanced journal entries `JE-2026-015` and `JE-2026-016`, bank vouchers `BV-2026-002` and `BV-2026-003` were linked, and SB-MOTHER balance reduced by the net disbursement.

## Browser Test Plan

> Note: The expected outputs below describe the **target** flow after Phases 1–8 are implemented (e.g. PR landing in `SUBMITTED` after submit, inventory and asset register updating from GRN, line-wise finance posting, and vendor payment settlement). On the current code, several of these expectations will fail — see the Current Status From Code Study table for which gaps must be closed first.

### Prerequisite Setup

1. Login at `http://localhost:4000/login` (the dev server runs on port 4000 — see `package.json` `dev` script).
2. Organization: `cssbd`.
3. Admin email: `rahim@cssbd.org`.
4. Password: `SecurePass@2026!`.
5. Go to Settings > Roles.
6. Confirm roles exist:
   - ADMIN
   - STAFF
   - STORE_MANAGER
   - If `STAFF` or `STORE_MANAGER` are missing, call `POST /api/v1/settings/seed-roles` (or use the equivalent UI button on Settings > Roles) to create them.
7. Go to Settings > Users.
8. Create or confirm:
   - `kamal@cssbd.org` with role STAFF
   - `shakil@cssbd.org` with role STORE_MANAGER
   - These users are not in any seed file; create them manually before running the test cases.
9. Go to Budget > Budget List.
10. Confirm at least one approved/active budget exists for the concern/cost center/fund class you will use.
11. Go to Procurement > Vendor Management.
12. Confirm at least one active approved vendor exists.
13. Go to Procurement > Warehouse.
14. Confirm at least one active warehouse exists.
15. Go to Assets > Asset Categories.
16. Confirm one category exists for equipment, for example `IT Equipment`.

### Test Case 1: Within-budget consumable purchase

Example:

- Item: Printer toner
- Type: Inventory
- Qty: 5
- Unit price: BDT 2,000
- Total: BDT 10,000
- Expected budget: within budget

Steps:

1. Login as Staff.
2. Open Procurement > Purchase Requisition.
3. Click New Requisition.
4. Select concern/business unit, cost center, fund class, and approved budget.
5. Add line:
   - Description: `Tarpaulin Sheet`
   - Type: `Inventory`
   - Unit: `pcs`
   - Quantity: `5`
   - Unit Price: `2000`
   - Inventory item: `TRP-001 - Tarpaulin Sheet`
   - Warehouse: `WH-DHK - Dhaka HQ Warehouse` (auto-filled after selecting the inventory item)
6. Submit PR.
7. Expected output:
   - PR number generated.
   - Status should be `SUBMITTED`.
   - Budget check should be `WITHIN_BUDGET`.
   - Staff should not see Approve or Create PO buttons.
8. Login as Admin.
9. Open Procurement > Purchase Requisition.
10. Open the new PR.
11. Click Approve.
12. Expected output:
   - Status becomes `APPROVED`.
   - Approved timestamp appears.
   - Audit trail records approval.
13. Click Create PO.
14. Select vendor and delivery date.
15. Expected output:
   - PO number generated.
   - PR status becomes `PO_CREATED`.
   - PO status is `ISSUED`.
16. Login as Store Manager.
17. Open Procurement > Goods Receipt.
18. Open the PO awaiting receipt.
19. Click Create GRN.
20. Accept quantity `5`, reject `0`.
21. Expected output:
   - GRN number generated.
   - GRN status `ACCEPTED`.
   - PO status `COMPLETED`.
22. Check Procurement > Inventory.
23. Expected inventory output:
   - Toner stock increased by `5`.
   - Total value increased by `10000`.
   - Stock status recalculated.
24. Open inventory item detail/transactions.
25. Expected transaction output:
   - IN transaction exists.
   - Reference is the GRN number.
   - Source line reference is unique, so the same GRN line cannot post stock twice.
   - Phase 4 verification example: `PR-2026-016` -> `PO-2026-003` -> `GRN-2026-003` posted one IN transaction for qty `3`; `TONER-001` ended with stock `3`, total value BDT `2,100`, unit price BDT `700`, and status `LOW_STOCK`.
26. Login as Admin.
27. Open GRN detail and click Post Accounting.
28. Open Finance > Journal Entries.
29. Expected finance output:
   - Auto JE exists with source/reference GRN.
   - Debit Inventory account BDT 10,000.
   - Credit Accounts Payable BDT 10,000.
   - JE lines carry concern/cost center/fund class/budget line.
30. Open Budget > Budget vs Actual.
31. Expected budget output:
   - Actual amount for the selected budget/account increases by BDT 10,000 after JE posting.

### Test Case 2: Fixed asset purchase

Example:

- Item: Laptop
- Type: Fixed Asset
- Qty: 2
- Unit price: BDT 85,000
- Total: BDT 170,000

Steps:

1. Staff creates PR for `Laptop ThinkPad T14s`, quantity `2`, unit price `85000`.
2. Select item type `Fixed Asset`.
3. Select budget/account line for equipment/fixed asset.
4. Submit PR.
5. Admin approves.
6. Admin creates PO from PR.
7. Store Manager creates GRN and accepts quantity `2`.
8. On GRN detail, click Register Assets.
9. Select category `IT Equipment`.
10. Enter serial numbers: `LT-001, LT-002`.
11. Submit asset registration.
12. Expected asset output:
   - Two asset numbers are created.
   - Assets appear in Assets > Asset Register.
   - Each asset has purchase price BDT 85,000 and net book value BDT 85,000.
   - Asset notes/source show GRN number.
   - Refreshing GRN detail still shows linked assets and does not allow duplicate registration beyond accepted quantity.
13. Admin posts accounting from GRN.
14. Expected finance output:
   - Debit Fixed Assets BDT 170,000.
   - Credit Accounts Payable BDT 170,000.
   - Finance > Financial Reports should include the asset value in balance sheet asset side.
15. Expected inventory output:
   - No consumable inventory stock should increase for this laptop line unless the organization intentionally tracks assets in warehouse inventory too.

### Test Case 3: Over-budget PR warning approval

Example:

- Item: Generator
- Type: Fixed Asset
- Qty: 1
- Unit price: greater than selected budget available amount

Steps:

1. Staff creates PR with amount higher than available budget.
2. Expected output:
   - PR can be submitted.
   - Budget warning is visible.
   - Status is `SUBMITTED`.
3. Admin opens PR.
4. Expected output:
   - Budget warning is clearly visible before approval.
5. Admin approves with warning note, for example:
   - `Approved due to emergency power requirement; budget revision will be initiated.`
6. Expected output:
   - PR status `APPROVED`.
   - `approvedWithBudgetWarning = true`.
   - Warning approval user/time/note appear in audit trail.
7. Check Budget > Budget Revision.
8. Expected next control:
   - A budget revision may be created if policy requires covering the variance.

### Test Case 4: Reject with reason

Example reason:

- `Vendor quotation missing and specification incomplete.`

Steps:

1. Staff submits PR.
2. Admin opens PR.
3. Admin clicks Reject.
4. Admin enters reason.
5. Expected output:
   - PR status `REJECTED`.
   - Staff can see rejection reason.
   - PO creation is blocked.
   - Audit trail records reject action and reason.
6. Login as Staff.
7. Open PR list/detail.
8. Expected output:
   - Rejected PR visible with reason.
   - Staff can duplicate/create corrected PR, or edit if returned instead of rejected.

### Test Case 5: Return for correction

Example note:

- `Please split laptop and toner into separate lines and select correct item type.`

Steps:

1. Staff submits PR.
2. Admin opens PR.
3. Admin clicks Return/Request Changes.
4. Admin enters note.
5. Expected output:
   - PR status returns to editable state.
   - Staff sees note.
   - Staff edits and resubmits.
   - Approval history keeps both return and resubmit actions.

### Test Case 6: Modify with admin note, then approve

Scenario: Admin needs to fix small issues on a submitted PR (typo, unit price correction, vendor preference) without bouncing it back to Staff. This is the fourth admin action listed in section B (`approve` / `reject` / `return for correction` / `modify with change note then approve`).

Example modification note:

- `Adjusted unit price from BDT 2,200 to BDT 2,000 per current rate contract; corrected description spelling.`

Steps:

1. Login as Staff.
2. Submit a PR with intentional minor issues:
   - Description: `Toner cartrige` (typo)
   - Type: `Inventory`
   - Quantity: `5`
   - Unit Price: `2200`
   - Total: BDT 11,000
3. Expected output:
   - PR created with status `SUBMITTED`.
4. Login as Admin.
5. Open Procurement > Purchase Requisition and open the new PR.
6. Click `Modify & Approve` (or open the line in edit mode from the approval dialog).
7. Edit the line:
   - Fix description to `Toner cartridge`.
   - Update unit price to `2000`.
8. Enter modification note (required): `Adjusted unit price from BDT 2,200 to BDT 2,000 per current rate contract; corrected description spelling.`
9. Click Approve.
10. Expected output:
    - If this is the final/current Admin workflow step, PR status `APPROVED`.
    - If another workflow step remains after the Admin correction, PR status stays `REVIEWED` and the next `ApprovalInstanceStep` becomes `PENDING`.
    - PR `totalEstimate` recalculated to BDT 10,000.
    - On final approval, `approvedById` = Admin user and `approvedAt` is recorded.
    - Audit trail records two entries: a `MODIFY` action with the note and the diff (old vs new values), then an `APPROVE` action — both timestamped, both linked to the same Admin.
    - PR detail page shows current (modified) values; previous values visible in audit trail.
11. Login as Staff.
12. Open the PR.
13. Expected output:
    - Staff sees the corrected description and unit price.
    - Modification note is visible to Staff so the change is transparent.
    - Staff cannot edit the PR after approval; only the audit trail and read-only detail are available.
14. Continue the flow: Admin creates PO from the modified PR.
15. Expected output:
    - PO line carries the **modified** values (description `Toner cartridge`, unit price `2000`), not the original Staff input.

### Test Case 7: Approval hierarchy threshold (Settings > Workflows)

Phase 2 note: workflow routing is now executable through API/curl and visible in the DB-backed workflow list; the browser create/edit/deactivate workflow form is still pending.

Scenario: Verify that the approval routing is actually driven by Settings > Approval Workflows, not by hard-coded `requireRoleFromRequest(request, 'ADMIN')`. Phase 2 engine/API is implemented; the remaining limitation is that workflow creation/editing/deactivation still needs API/curl until the browser form is built.

Workflow setup (one-time):

1. Login as Admin.
2. Go to Settings > Approval Workflows.
3. Confirm the workflow definition in the DB-backed workflow list. Until the CRUD form is added, create or update it with `POST /api/v1/settings/workflows` for entity `PURCHASE_REQUISITION` with three amount tiers:
   - Tier 1: `<= 50,000` → single step `ADMIN`.
   - Tier 2: `50,001 - 500,000` → Program Coordinator → Finance Manager → Admin (3 steps).
   - Tier 3: `> 500,000` → Executive Director → Finance Manager → Admin (3 steps).
4. Go to Settings > Roles and confirm the additional roles (`PROGRAM_COORDINATOR`, `FINANCE_MANAGER`, `EXECUTIVE_DIRECTOR`) exist; create them via `POST /api/v1/settings/seed-roles` or the Settings > Roles UI if missing.
5. Go to Settings > Users and create demo users:
   - `program@cssbd.org` — role `PROGRAM_COORDINATOR`.
   - `finance@cssbd.org` — role `FINANCE_MANAGER`.
   - `ed@cssbd.org` — role `EXECUTIVE_DIRECTOR`.

Test 7a: Below threshold (single-step admin approval)

1. Login as Staff.
2. Submit a PR for total BDT 30,000 (Tier 1).
3. Expected output:
   - PR created `SUBMITTED`.
   - One `ApprovalInstance` row created against the PR with one `ApprovalInstanceStep` targeting role `ADMIN`.
   - Current step shown on PR detail: `Pending Admin Approval`.
4. Login as Admin and click Approve.
5. Expected output:
   - PR status `APPROVED`.
   - `ApprovalInstance.status` = `APPROVED`.
   - All other roles cannot approve via API (returns forbidden).

Test 7b: Mid threshold (3 steps in order)

1. Staff submits a PR for total BDT 200,000 (Tier 2).
2. Expected output:
   - `ApprovalInstance` has 3 `ApprovalInstanceStep` rows in order: Program Coordinator → Finance Manager → Admin.
   - Current step: Program Coordinator.
3. Login as Admin and try to approve via UI button or `POST /api/v1/procurement/requisitions/[id]/approve` directly.
4. Expected output:
   - API returns `403 Forbidden` (current approver is not Admin yet).
   - PR remains in pre-approval state — proves hierarchy is server-enforced, not just UI-hidden.
5. Login as Program Coordinator (`program@cssbd.org`) and approve.
6. Expected output:
   - Step 1 status `APPROVED` with timestamp and approver.
   - Current step advances to Finance Manager.
7. Login as Finance Manager (`finance@cssbd.org`) and approve.
8. Expected output:
   - Step 2 `APPROVED`.
   - Current step advances to Admin.
9. Login as Admin and approve.
10. Expected output:
    - PR status `APPROVED`.
    - All 3 `ApprovalInstanceStep` rows are `APPROVED` with distinct approvers and timestamps; `ApprovalAction` keeps the immutable action log.
    - Audit trail shows all 3 step approvals plus the final PR approval.
    - Only after this can the PR be turned into a PO (try Create PO button from PR detail — it should now be enabled).

Test 7c: Above threshold (different routing path)

1. Staff submits a PR for total BDT 600,000 (Tier 3).
2. Expected output:
   - `ApprovalInstance` routes through Executive Director → Finance Manager → Admin (Program Coordinator is **not** in the chain).
3. Verify each step requires the correct user and out-of-order approvals are rejected with 403.
4. After all three approve, PR moves to `APPROVED` and PO creation is enabled.

Test 7d: Workflow change reflects immediately

1. Admin updates the workflow rule: raise Tier 1 ceiling from `50,000` to `75,000`.
2. Staff submits a new PR for BDT 60,000.
3. Expected output:
   - The new PR's `ApprovalInstance` is created as **single-step Admin** (because BDT 60,000 is now below the updated Tier 1 ceiling).
   - Confirms Settings > Workflows actually drives routing — change in Workflows immediately changes how PRs are routed; routing is not hard-coded in API code.
4. Older PRs that were already in flight under the old rule should keep their original routing (workflow snapshot at instance creation, not live re-evaluation).

### Test Case 8: Role access control

Steps:

1. Login as Staff.
2. Open Procurement.
3. Expected menu:
   - Purchase Requisition visible.
   - Inventory, Warehouse, Goods Receipt hidden unless Staff has those permissions.
4. Try direct URL `/procurement/orders`.
5. Expected output:
   - Server should forbid if Staff is not allowed to view/create PO.
6. Try direct POST to approve PR as Staff.
7. Expected output:
   - API returns forbidden.
8. Login as Store Manager.
9. Expected menu:
   - Inventory, Warehouse, Goods Receipt, Assets visible.
   - PR may be visible if allowed.
   - Admin approval buttons hidden.
10. Try direct POST to post accounting as Store Manager.
11. Expected output:
   - API returns forbidden.

### Test Case 9: Vendor invoice, payment, and AP settlement

Scenario: Verify the purchase is financially closed after GRN posting. These tests should run after Test Case 1 or Test Case 2 has produced an accepted GRN and a GRN accounting entry.

Test 9a: Happy-path full payment

Example:

- Vendor invoice: `INV-CSS-001`
- Related PO: the PO created from the approved PR
- Related GRN: the accepted GRN
- Invoice amount: same as accepted GRN amount
- Payment method: bank transfer

Steps:

1. Login as Finance/Admin.
2. Open Finance > Vouchers or the future Vendor Invoices/AP Invoices page.
3. Create vendor invoice:
   - Vendor: same vendor from PO
   - PO: selected PO
   - GRN: selected accepted GRN
   - Invoice No: `INV-CSS-001`
   - Invoice Date: today
   - Invoice Amount: accepted GRN amount
4. Expected invoice matching output:
   - PO quantity/price, GRN accepted quantity, and invoice amount match.
   - Invoice status becomes `MATCHED` or `SUBMITTED`, depending on final workflow.
5. Approve the invoice/payment request through the configured workflow.
6. Expected approval output:
   - Invoice status becomes `APPROVED`.
   - Audit trail records approver, timestamp, and notes.
7. Create payment voucher:
   - Payment method: bank transfer
   - Bank account: selected active bank account
   - Amount: full outstanding invoice amount
   - Reference: `BANK-TXN-001`
   - Withholding: select applicable TDS/VDS rate from rate table (or 0% if exempt)
8. Post/approve payment.
9. Expected payment accounting output:
   - A payment JE or voucher-linked JE is created.
   - Debit Accounts Payable for the full invoice amount (gross).
   - Credit selected Bank/Cash account for the **net** amount disbursed.
   - Credit TDS Payable / VDS Payable for any withheld tax (zero legs allowed when withholding rate is 0).
   - JE balances: DR AP = CR Bank + CR TDS + CR VDS.
   - Invoice status becomes `PAID`.
   - Outstanding payable becomes `0`.
10. Open Finance > Bank & Cash.
11. Expected bank/cash output:
    - Selected bank account balance decreases by the **net paid** amount, not the gross invoice amount.
    - Payment transaction is visible with vendor/invoice reference.
12. Open Finance > Bank Reconciliation.
13. Expected reconciliation output:
    - Payment (net amount) is available for matching against bank statement/import.
14. Open Finance > Financial Reports.
15. Expected report output:
    - Accounts Payable created at GRN posting is cleared by payment.
    - Bank/Cash decreases by net.
    - TDS Payable / VDS Payable liability appears on balance sheet (cleared later when remitted to NBR).
    - Expense/Inventory/Asset recognition remains from the GRN accounting entry, not duplicated by payment.

Test 9b: Over-invoice rejection (three-way matching)

1. Repeat steps 1–2 of Test 9a.
2. Create a vendor invoice for the same PO/GRN, but enter Invoice Amount **higher** than the accepted GRN amount (e.g. GRN accepted BDT 10,000 but invoice claims BDT 12,000).
3. Expected output:
   - System rejects the invoice or marks it `OVER_INVOICED` and blocks approval.
   - Error message names the variance and the relevant GRN/PO line.
   - No `MATCHED` status is allowed until the variance is resolved (credit note, additional GRN, or invoice correction).

Test 9c: Duplicate invoice number rejection

1. Successfully create invoice `INV-CSS-001` for vendor V1 (Test 9a).
2. Try to create another invoice with the **same number** `INV-CSS-001` for the **same vendor V1**.
3. Expected output:
   - System rejects the second invoice with a duplicate-number error.
   - Audit log records the rejected attempt.
4. Create another invoice with the same number `INV-CSS-001` for a **different vendor V2**.
5. Expected output:
   - This is allowed — duplicate-number rule scopes to `(vendorId, invoiceNo)`, not globally.

Test 9d: Partial payment

Example:

- Invoice amount: BDT 100,000
- First payment: BDT 60,000
- Second payment: BDT 40,000

Steps:

1. Approve a vendor invoice for BDT 100,000 (Test 9a steps 1–6).
2. Create a payment voucher for BDT 60,000.
3. Post the payment.
4. Expected output after first payment:
   - Invoice status becomes `PARTIALLY_PAID`.
   - Outstanding payable = BDT 40,000.
   - JE: DR AP 60,000 / CR Bank ~60,000 (less withholding).
   - Bank balance decreases by net of first payment only.
5. Create a second payment voucher for BDT 40,000 against the same invoice.
6. Post the second payment.
7. Expected output after second payment:
   - Invoice status becomes `PAID`.
   - Outstanding payable = `0`.
   - Two separate payment JEs exist, both linked to the same invoice.
   - Bank Reconciliation shows two distinct transactions.
8. Try to create a third payment of BDT 1 against the same invoice.
9. Expected output:
   - System rejects with "invoice fully paid, cannot exceed outstanding amount".

## Quick Answer To The Menu Question

Yes, these menus are logically connected and should affect each other:

- Purchase Requisition affects Budget commitments.
- Approved PR enables Purchase Order.
- PO enables Goods Receipt.
- GRN affects Inventory or Asset Register depending on item type.
- GRN/accounting posting affects Finance Journal Entries and Budget vs Actual.
- Payment later affects Vouchers, Bank & Cash, and Bank Reconciliation.
- Roles and Approval Workflow should control who can do each step.

Current implementation now has the PR lifecycle, workflow engine/API, PR/PO/GRN line classification, and GRN-to-inventory posting connected. Finance account classification, asset source idempotency, workflow CRUD UI, stricter role restrictions, and demo role users still need work before the full purchase-to-pay flow can be called complete.

## Definition Of Done

The flow is complete when the browser test plan can prove all of this in sequence:

1. Staff submits a budget-linked PR.
2. Admin can approve, reject with reason, return for correction with note, or modify with change note then approve — all four actions captured in the audit trail.
3. Approval hierarchy is driven by Settings > Approval Workflows; changing the workflow changes routing for new PRs, and out-of-order approvals are rejected with 403 by the API (not just hidden in the UI).
4. Approved PR creates exactly one PO that carries the modified line values where the admin edited them.
5. Store Manager receives goods through GRN.
6. Inventory (with `InventoryTransaction` row) **or** Asset Register (with structured GRN source reference, no duplicates on refresh) updates exactly once.
7. Finance JE posts line-wise to the correct accounts (inventory account / fixed asset account / expense account) per item type, not a single hard-coded `1204`.
8. Vendor invoice/payment flow clears Accounts Payable through a voucher or payment JE: DR AP, CR Bank/Cash.
9. Bank & Cash and Bank Reconciliation show the payment impact after settlement.
10. Budget vs Actual changes only after the finance posting, not at PR creation.
11. Unauthorized roles cannot perform restricted actions even through direct API calls.
