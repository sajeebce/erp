# NGO ERP — Client Demo Script

> URL: http://192.168.50.128:4000
> Prepared: 2026-04-27

---

## Demo Accounts

| Role | Email | Password | কী দেখে |
|---|---|---|---|
| Admin | rahim@shapla.org | (existing) | সব module |
| Staff | kamal@test.com | Test1234! | শুধু Procurement → Requisitions |
| Store Manager | shakil@test.com | Test1234! | Procurement (GRN, Inventory, Warehouse) + Assets |

---

## Pre-Demo Setup (একবার করতে হবে)

### 1. Budget তৈরি করুন

- **Admin** login করুন
- **Budget → Create Budget**
- Fill করুন:
  - Name: `HQ Operations 2026`
  - Budget Type: `OPERATIONAL`
  - Fiscal Year: select করুন
  - Budget Line:
    - Category: `Equipment`
    - Account: `1204` (Fixed Assets)
    - Qty: `13`, Unit Cost: `1,00,000` → Total: `13,00,000`
- Save → **Send for Approval** → **Approve** → **Activate**

---

## Task 1: Requisition to Asset Receipt Workflow

**Scenario:** 10 laptop কেনার requisition, approval, PO, goods receipt, asset registration পর্যন্ত পুরো flow।

---

### Step 1 — Staff PR তৈরি করে (Role Separation দেখান)

**Login:** `kamal@test.com` (STAFF)

> Sidebar এ শুধু **Dashboard** এবং **Procurement → Purchase Requisition** দেখাবে — অন্য কিছু না।

1. **Procurement → Purchase Requisition → New Requisition**
2. Fill করুন:
   - Budget: `HQ Operations 2026`
   - Priority: `High`
   - Justification: `Office laptop procurement for IT department`
   - Line item:
     - Description: `Laptop ThinkPad T14s`
     - Unit: `pcs`
     - Qty: `10`
     - Unit Price: `100000`
3. Submit → ✅ `WITHIN_BUDGET` — PR তৈরি হবে

**Client কে দেখান:**
- Staff শুধু নিজের PR দেখতে পারে
- Budget এর মধ্যে থাকায় warning নেই

---

### Step 2 — Budget Warning দেখান (Optional)

**Same login:** `kamal@test.com`

1. আরেকটা PR তৈরি করুন:
   - Qty: `15`, Unit Price: `100000` (= 15,00,000 > 13,00,000 budget)
2. Submit করুন
3. ⚠️ **Budget Warning** দেখাবে — তারপরও submit হবে

**Client কে দেখান:**
- System over-budget block করে না, warning দেয়
- Admin decide করবে approve করবে কিনা

---

### Step 3 — Admin PR Approve করেন

**Login:** Admin

1. **Procurement → Purchase Requisition** — দুটো PR দেখাবে (Staff এর + Admin এর)
2. প্রথম PR (10 laptop) তে click করুন
3. ⚠️ Budget warning থাকলে detail page এ দেখাবে
4. **Approve** button click করুন → ✅ `APPROVED`

**Client কে দেখান:**
- Admin সব staff এর PR দেখতে পায়
- Approval hierarchy — Staff create করে, Admin approve করে
- Audit Trail card এ approval timestamp দেখাবে

---

### Step 4 — Admin PO তৈরি করেন

**Same login:** Admin

1. Approved PR detail page এ **"Create Purchase Order"** button click করুন
2. Fill করুন:
   - Vendor: list থেকে select করুন
   - Delivery Date: ১৫ দিন পরের তারিখ
3. Create → ✅ PO তৈরি, PR status → `PO_CREATED`
4. PR detail এ **"Linked Purchase Orders"** section এ PO দেখাবে

**Client কে দেখান:**
- PR → PO traceability (একটা থেকে অন্যটায় যাওয়া যায়)

---

### Step 5 — Store Manager Goods Receive করেন

**Login:** `shakil@test.com` (STORE_MANAGER)

> Sidebar এ শুধু Procurement (GRN, Inventory, Warehouse) এবং Assets দেখাবে।

1. **Procurement → Goods Receipt** — ISSUED PO দেখাবে
2. PO তে click → **"Create GRN"** button
3. Fill করুন:
   - Accepted Qty: `10`
   - Inspection Notes: `All items received in good condition`
4. Status: **ACCEPTED** করুন → GRN তৈরি ✅

**Client কে দেখান:**
- Store Manager শুধু relevant menu দেখে
- Physical receipt এর confirmation

---

### Step 6 — Store Manager Assets Register করেন

**Same login:** Store Manager

1. GRN detail page এ **"Register Assets"** button click করুন
2. Fill করুন:
   - Category: `IT Equipment`
   - Serial Numbers: `SN001, SN002, SN003, SN004, SN005, SN006, SN007, SN008, SN009, SN010`
3. **Register 10 Asset(s)** → ✅ AST-001 to AST-010 তৈরি
4. **Assets → Asset Register** এ গিয়ে নতুন assets দেখান

**Client কে দেখান:**
- Goods receive হলেই asset automatically register হয়
- Serial number tracking
- Asset register এ update

---

### Step 7 — Admin Accounting Post করেন

**Login:** Admin

1. GRN detail page → **"Post Accounting"** button
2. ✅ Journal Entry তৈরি:
   - DR Fixed Assets (1204) — BDT 10,00,000
   - CR Accounts Payable (2101) — BDT 10,00,000

**Client কে দেখান:**
- GRN থেকে automatic accounting
- Budget linkage through dimensions

---

### Step 8 — Chart of Accounts এ Impact দেখান

**Login:** Admin

1. **Finance → Chart of Accounts** এ যান
2. Account `1204` (Fixed Assets) খুঁজুন → click করুন
3. দেখাবে:
   - **Balance বেড়েছে** — BDT 10,00,000 debit (laptop purchase)
   - Journal Entry reference: JE-XXXX
4. Account `2101` (Accounts Payable) খুঁজুন → click করুন
5. দেখাবে:
   - **Balance বেড়েছে** — BDT 10,00,000 credit (vendor কে দেওয়া বাকি)

**What accurate data দেখাবে:**

| Account | Code | Movement | Amount |
|---|---|---|---|
| Fixed Assets | 1204 | DR (বেড়েছে) | BDT 10,00,000 |
| Accounts Payable | 2101 | CR (বেড়েছে) | BDT 10,00,000 |

**Client কে দেখান:**
- Procurement থেকে Finance module এ automatically data গেছে
- Manual journal entry করতে হয়নি
- Double-entry accounting সঠিকভাবে হয়েছে
- Audit trail — GRN number reference দেখা যাচ্ছে

---

### Task 1 Key Points Summary

| Feature | দেখানো হয়েছে |
|---|---|
| Approval hierarchy (Staff → Admin) | ✅ |
| Role-based menu restriction | ✅ |
| Budget warning (over-budget) | ✅ |
| PR → PO traceability | ✅ |
| Stock/Asset update after receiving | ✅ |
| Audit trail visibility | ✅ |
| Chart of Accounts — automatic accounting impact | ✅ |

---

## Task 2: Budget vs Actual Comparison

**Scenario:** Budget তৈরি, procurement এর পর actual expense budget এ reflect করা।

---

### Step 1 — Budget দেখান

**Login:** Admin

1. **Budget → Budget List** → `HQ Operations 2026` তে click করুন
2. Budget details দেখান:
   - Total: BDT 13,00,000
   - Status: Active
   - Budget Lines (account 1204)

---

### Step 2 — Budget vs Actual দেখান

1. **Budget → Budget vs Actual**
2. Budget select করুন: `HQ Operations 2026`
3. দেখাবে:
   - Total Budget: BDT 13,00,000
   - Total Actual: BDT 10,00,000 (Task 1 এর JE থেকে)
   - Variance: BDT 3,00,000
   - Utilization: 76.9%
4. Chart এ Equipment category এর bar দেখান

**Client কে দেখান:**
- Real-time variance tracking
- Procurement expense budget এ reflect করছে
- Visual chart

---

### Step 3 — Over-budget Warning দেখান

**Login:** `kamal@test.com` (STAFF)

1. New Requisition → same budget → Qty: `15`, Price: `100000`
2. Submit → ⚠️ Budget warning দেখাবে

**Client কে দেখান:**
- Overspending alert কাজ করছে

---

### Task 2 Key Points Summary

| Feature | দেখানো হয়েছে |
|---|---|
| Real-time variance tracking | ✅ |
| Overspending alert | ✅ |
| Visual dashboard (chart) | ✅ |
| Procurement → Accounting → Budget linkage | ✅ |

---

## Task 3: No-Cost Project Extension

**Scenario:** একটা project এর duration extend করা — budget না বাড়িয়ে।

---

### Step 1 — Project Select করুন

**Login:** Admin

1. **Projects → Project List** এ যান
2. যেকোনো **ACTIVE** project এ click করুন
3. Project detail এ current **End Date** এবং **Budget** দেখান

---

### Step 2 — Extension Request করুন

1. Detail page এ নিচে **"No-Cost Extension & Timeline"** card দেখান
2. **"Request No-Cost Extension"** button click করুন
3. Fill করুন:
   - Proposed End Date: ৬ মাস পরের তারিখ
   - Reason: `Project activities delayed due to field access constraints`
   - Impact Notes: `All deliverables will be completed within extended timeline`
4. Submit → Status: `PENDING_APPROVAL`

**Client কে দেখান:**
- Budget field locked — change করা যাচ্ছে না
- System validation: propose করা date current date এর পরে হতে হবে

---

### Step 3 — Admin Approve করেন

1. **Projects → Extensions** এ যান
   `http://192.168.50.128:4000/projects/extensions`
2. Pending request দেখাবে
3. **Approve** click করুন → ✅ Approved

---

### Step 4 — Timeline Update দেখান

1. Project detail page এ ফিরে যান
2. দেখান:
   - **End Date** updated হয়েছে
   - **Budget** unchanged আছে
   - Extension history card এ record আছে

**Client কে দেখান:**
- Budget integrity: budget বাড়েনি
- Timeline updated: নতুন end date দেখাচ্ছে
- Audit trail: কে approve করেছে, কখন

---

### Task 3 Key Points Summary

| Feature | দেখানো হয়েছে |
|---|---|
| Budget integrity enforcement | ✅ |
| Extension approval process | ✅ |
| Updated project timeline visibility | ✅ |
| Audit trail | ✅ |

---

## Demo Tips

- **Browser:** দুটো browser বা incognito window use করুন — একটায় Admin, অন্যটায় Staff/Store Manager
- **Role switch দেখানোর সময়:** Sidebar এর পার্থক্য highlight করুন
- **Budget warning:** amount বড় দিন (14+ lakh) যেন warning clearly দেখা যায়
- **Audit Trail:** PR detail page এ "View full audit trail" link দেখান — কে কখন কী করেছে

---

## Quick Login Reference

```
Admin:         rahim@shapla.org   / (existing password)
Staff:         kamal@test.com     / Test1234!
Store Manager: shakil@test.com    / Test1234!
Organization:  shapla-foundation
```
