# Procurement to Asset Receipt Workflow Plan

> Prepared: 2026-04-27
> Context: Client requirement for requisition -> approval -> PO -> receipt -> asset registration -> stock/accounting update
> Scenario: 10 laptops, total value BDT 10,00,000

## 1. Objective

Client-er requirement hocche office equipment procurement-er full lifecycle dekhano:

1. Purchase Requisition create
2. Approval workflow
3. Approved requisition theke Purchase Order
4. Vendor assignment and purchase execution
5. Warehouse/Store receipt
6. Asset registration
7. Store confirmation
8. Inventory / asset register / accounting update

Demo-te 5 ta business control clear dekhate hobe:

- approval hierarchy control
- audit trail visibility
- budget warning (over-budget hole warning, block na)
- stock or asset update after receiving
- role-based restricted access

---

## 2. Roles

Demo-r jonne 3 ta role diye full flow dekhano jabe:

| Role | Responsibility |
|---|---|
| `Requester` | PR raise korbe |
| `Admin` | PR approve, PO create, vendor assign, accounting post |
| `Store Manager` | Goods receive, physical verification, asset confirmation |

---

## 3. Role-Based Menu

### Store Manager only sees

- Procurement > Goods Receipt
- Procurement > Inventory
- Assets > Asset Register
- Assets > Categories

### Admin sees

- Procurement (full)
- Assets (full)
- Finance
- Reports

### Requester sees

- Procurement > Requisitions (only own)

---

## 4. End-to-End Workflow

### Step 1: Purchase Requisition

Requester fills:

- item: Laptop
- quantity: 10
- estimated unit price: BDT 100,000
- total estimate: BDT 10,00,000
- justification
- project / cost center

System checks:

- required fields validation
- **budget check: jodi estimated amount project budget exceed kore, warning show korbe — submit block hobe na**
- audit log create

Status: `DRAFT` -> `SUBMITTED`

### Step 2: Approval

Admin checks and approves.

- PR detail + budget warning (if any) visible thakbe approval screen-e
- Admin approve or reject korte parbe with comment

Status: `SUBMITTED` -> `APPROVED`

Audit: who approved, when, comment.

### Step 3: Purchase Order

Admin:

- approved PR theke PO create korbe
- vendor select korbe
- delivery date, payment terms dibe

Status: PR -> `PO_CREATED`, PO -> `ISSUED`

### Step 4: Goods Receipt

Store Manager:

- delivered quantity receive korbe
- accepted / rejected qty dibe
- inspection notes dibe
- serial number capture (laptop-er jonne)

Status: PO -> `PARTIALLY_RECEIVED` or `COMPLETED`, GRN -> `ACCEPTED`

### Step 5: Asset Registration

Laptop = fixed asset, inventory stock na.

1. GRN accepted hole system asset draft create korbe (10 ta entry)
2. Store Manager serial number verify korbe
3. Each laptop individual asset record pabe: `AST-001` to `AST-010`

Each asset record-e thakbe:

- asset no, serial number
- purchase date, purchase price
- location, custodian
- linked PO / GRN reference

Status: GRN line -> `ASSET_PENDING_REGISTRATION` -> `REGISTERED`

### Step 6: Store Confirmation

Store Manager confirms:

- goods physically received
- serial matched, no damage
- ready for department issue

Status: `RECEIVED_VERIFIED`, asset active in register

### Step 7: Accounting Update

Admin posts:

- Fixed Asset DR
- Accounts Payable / Cash CR

Finance screen-e linked voucher / journal reference visible thakbe.

---

## 5. Budget Warning Logic

- PR create-r somoy project-er remaining budget check hobe
- Estimated amount > remaining budget hole **yellow warning banner** show korbe
- Warning message: "This requisition exceeds available budget. Proceed with approval at your discretion."
- Submit ba approval block hobe na — decision Admin-er hobe
- Audit log-e budget warning flag record hobe

---

## 6. Stock vs Asset Treatment

| Item type | Flow |
|---|---|
| Consumable (paper, toner) | GRN -> inventory stock increase |
| Fixed asset (laptop, printer) | GRN -> asset staging -> asset register |

---

## 7. Audit Trail

Audit trail-e dekhabe:

- who created PR
- who approved PR
- who created PO
- who received goods
- who registered asset
- who posted accounting entry

Drill-down: `PR -> PO -> GRN -> Asset -> Voucher`

---

## 8. Demo Script for Client

1. `Requester` login — PR create (budget warning visible hobe)
2. `Admin` login — PR approve (warning note sathe)
3. Admin — vendor assign, PO create
4. `Store Manager` login — only relevant menu visible
5. Store Manager — GRN create, serial capture
6. Laptops asset register-e 10 ta entry show
7. Audit trail report dekhabe full chain
8. Finance side-e related journal reference dekhabe

---

## 9. Build Plan (Phase A — Demo Readiness)

1. `STORE_MANAGER` role create + permission set assign
2. Sidebar/menu permission-based filter
3. Procurement pages API-backed (no static data)
4. Budget warning on PR create / approval screen
5. PR -> PO traceability visible
6. GRN -> asset registration trigger (bulk draft create)
7. Audit trail page-e linked references (PR/PO/GRN/Asset/Voucher)

---

## 10. Future Scope (Post Demo)

- Multi-level approval workflow engine
- Department Approver role
- Amount-based approval routing
- Budget encumbrance / commitment at PO stage
- Invoice matching
- Asset depreciation
- Budget vs actual analytics
