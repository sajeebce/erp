# NGO ERP — Client Demo Script

> URL: http://localhost:4000
> Prepared: 2026-04-27

---

## Demo Accounts

| Role | Email | Password | কী দেখে |
|---|---|---|---|
| Admin | rahim@cssbd.org | (existing) | সব module |
| Staff | kamal@cssbd.org | Test1234! | শুধু Procurement → Requisitions |
| Store Manager | shakil@cssbd.org | Test1234! | Procurement (GRN, Inventory, Warehouse) + Assets |

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

**Login:** `kamal@cssbd.org` (STAFF)

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

**Same login:** `kamal@cssbd.org`

1. আরেকটা PR তৈরি করুন:
   - Qty: `15`, Unit Price: `100000` (= 15,00,000 > 13,00,000 budget)
2. Submit করুন
3. ⚠️ **Budget Warning** দেখাবে — তারপরও submit হবে

**Client কে দেখান:**
- System over-budget block করে না, warning দেয়
- Admin decide করবে approve করবে কিনা

---

### Step 3 — Admin PR Approve করেন

**Login:** `rahim@cssbd.org` (Admin)

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

**Same login:** `rahim@cssbd.org` (Admin)

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

**Login:** `shakil@cssbd.org` (STORE_MANAGER)

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

**Login:** `rahim@cssbd.org` (Admin)

1. GRN detail page → **"Post Accounting"** button
2. ✅ Journal Entry তৈরি:
   - DR Fixed Assets (1204) — BDT 10,00,000
   - CR Accounts Payable (2101) — BDT 10,00,000

**Client কে দেখান:**
- GRN থেকে automatic accounting
- Budget linkage through dimensions

---

### Step 8 — Chart of Accounts এ Impact দেখান

**Login:** `rahim@cssbd.org` (Admin)

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

**Login:** `rahim@cssbd.org` (Admin)

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

**Login:** `kamal@cssbd.org` (STAFF)

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

**Login:** `rahim@cssbd.org` (Admin)

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
   `http://localhost:4000/projects/extensions`
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

## HR Module — Task 1: Attendance & Movement Tracking

---

### Pre-Demo Setup (একবার করতে হবে)

#### ১. Employee–User Link করুন

Self-service attendance কাজ করতে হলে demo employee account-এ `userId` set থাকতে হবে।

Prisma Studio SQL console-এ run করুন:

```sql
-- কোন users আছে দেখুন
SELECT id, email FROM "User" LIMIT 10;

-- Employee এর সাথে link করুন (email দিয়ে match করে)
UPDATE "Employee"
SET "userId" = (SELECT id FROM "User" WHERE email = 'rahim@cssbd.org')
WHERE "fullName" = 'Rafiqul Islam';
```

> প্রতিটা demo role এর জন্য আলাদা employee–user link করুন।

#### ২. OperatingLocation ✅ আছে

| Code | Name | Address |
|---|---|---|
| LOC-001 | Khulna Head Office | CSS Head Office, Khulna |
| LOC-002 | Hospital Campus | Hospital Road, Khulna |
| LOC-003 | MFP Branch 001 | Batiaghata, Khulna |
| LOC-004 | MFP Branch 002 | Dakop, Khulna |

---

### Scenario 1: Outstation Movement During Office Hours

**Demo Story:** Senior officer ব্যাংকে যাচ্ছেন অফিস আওয়ারে।

**Login:** Employee account (যেটায় userId link করা হয়েছে)

---

#### Step 1 — সকালে Office Check-in

1. **`/self-service/attendance`** এ যান
2. **"Check In"** button click করুন
3. ✅ Today Status দেখাবে: `PRESENT — Checked in at 9:00 AM`

**Client কে দেখান:**
- Employee নিজেই check-in করছে
- Real-time status update

---

#### Step 2 — Official Movement শুরু করুন

1. একই page-এ **"Start Movement"** button click করুন
2. Form fill করুন:
   - Movement Type: `BANK_VISIT`
   - Destination: `Sonali Bank, Khulna Branch`
   - Purpose: `Cheque collection for project fund`
   - Expected Return: `01:00 PM`
3. Submit করুন → ✅ Movement started

**Client কে দেখান:**
- Movement type clearly defined (official duty)
- System জানে employee কোথায় গেছে এবং কেন

---

#### Step 3 — Supervisor Visibility দেখান

**Login:** Admin / Supervisor account

1. **`/hr/attendance/movements`** এ যান
2. **"Currently Out on Duty"** panel দেখান
3. দেখাবে:
   - Employee: Rafiqul Islam
   - Destination: Sonali Bank, Khulna Branch
   - Out since: 11:00 AM
   - Status: `OPEN`

**Client কে দেখান:**
- Supervisor real-time দেখতে পাচ্ছেন কে কোথায় আছেন
- Absence নয়, official duty হিসেবে marked

---

#### Step 4 — Return Check-in

**Login:** Employee account

1. **`/self-service/attendance`** এ ফিরে যান
2. **"End Movement"** button click করুন
3. ✅ Movement status: `RETURNED`, Return time recorded

**Client কে দেখান:**
- Movement duration automatically calculated
- Attendance এখনও `PRESENT` — absence deduction নেই

---

#### Step 5 — Movement Report দেখান

**Login:** Admin

1. **`/hr/attendance/movements`** এ যান
2. Movement register এ দেখাবে:
   - Employee name
   - Movement type: BANK_VISIT
   - Destination
   - Check-out time, Return time
   - Duration (e.g., 2h 15m)

**Scenario 1 Key Points:**

| Focus Point | দেখানো হয়েছে |
|---|---|
| Absence vs Official Duty differentiation | ✅ Attendance PRESENT থাকে |
| Time tracking | ✅ Duration calculated |
| Supervisor visibility | ✅ Live "Out on Duty" panel |
| Reporting | ✅ Movement register |

---

### Scenario 2: Field Worker Attendance Tracking

**Demo Story:** Field worker মাঠ থেকে GPS দিয়ে attendance দিচ্ছেন।

**Login:** Employee account (field worker)

---

#### Step 1 — Mobile Page খুলুন

1. **`/self-service/attendance/mobile`** এ যান
2. Page টা mobile-optimized — client কে phone-এ দেখান অথবা browser-এ mobile view করুন

---

#### Step 2 — Attendance Mode Select করুন

1. Mode dropdown থেকে **`FIELD`** select করুন
2. **"Capture Location"** button click করুন
3. Browser location permission দিন → ✅ GPS coordinates captured
4. দেখাবে: `Location: 22.84561, 89.54231 — VALID`

**Client কে দেখান:**
- GPS automatically capture হচ্ছে
- Location permission ছাড়াও কাজ করে (PENDING status)

---

#### Step 3 — Field Check-in করুন

1. **"Check In"** button click করুন
2. ✅ Attendance তৈরি:
   - Mode: `FIELD`
   - Source: `MOBILE`
   - GPS: coordinates stored
   - Validation: `VALID`

---

#### Step 4 — Offline Sync দেখান (Optional)

1. Browser-এ Network offline করুন (DevTools → Network → Offline)
2. Check-out করার চেষ্টা করুন
3. ✅ দেখাবে: `"Check-out queued for sync"` — locally saved
4. Network online করুন
5. **"Sync Queued Events"** button click করুন → ✅ Server-এ sync হবে

**Client কে দেখান:**
- Network না থাকলেও attendance নষ্ট হয় না
- পরে sync হয়ে যায়

---

#### Step 5 — Field Attendance Report

**Login:** Admin

1. **`/hr/attendance`** এ যান
2. Filter: **Mode = FIELD** select করুন
3. দেখাবে field attendance records with GPS validation status

**Scenario 2 Key Points:**

| Focus Point | দেখানো হয়েছে |
|---|---|
| Mobile-based attendance | ✅ Mobile-optimized page |
| GPS location capture | ✅ Browser Geolocation API |
| Location-based validation | ✅ VALID / PENDING status |
| Real-time logging | ✅ Instant API record |
| Offline-to-online sync | ✅ LocalStorage queue + sync |

---

### Scenario 3: Cross-Branch Attendance (HQ to Branch Visit)

**Demo Story:** HQ-র employee অন্য branch-এ গিয়ে attendance দিচ্ছেন।

**Login:** Employee account (HQ employee)

---

#### Step 1 — Mobile Page খুলুন

1. **`/self-service/attendance/mobile`** এ যান

---

#### Step 2 — Branch Visit Mode Select করুন

1. Mode dropdown থেকে **`BRANCH_VISIT`** select করুন
2. ✅ Branch Location dropdown appear করবে
3. Dropdown থেকে select করুন: **`MFP Branch 001 — Batiaghata, Khulna`**

**Client কে দেখান:**
- System-এ registered branches automatically দেখাচ্ছে
- Home location (HQ) ভিন্ন, visiting location আলাদা

---

#### Step 3 — Branch Check-in করুন

1. **"Check In"** button click করুন
2. ✅ Attendance তৈরি:
   - Mode: `BRANCH_VISIT`
   - Operating Location: MFP Branch 001
   - Employee home: Khulna Head Office

---

#### Step 4 — Centralized HQ Report দেখান

**Login:** Admin

1. **`/hr/attendance`** এ যান
2. Filter: **Operating Location = MFP Branch 001** select করুন
3. দেখাবে — HQ employee branch-এ check-in করেছেন
4. Mode filter: **`BRANCH_VISIT`** দিয়ে সব cross-branch visits দেখান

**Client কে দেখান:**
- HQ থেকে centralized visibility
- কোন employee কোন branch-এ গিয়েছেন — সব record-এ আছে
- Home location vs visited location clearly different

**Scenario 3 Key Points:**

| Focus Point | দেখানো হয়েছে |
|---|---|
| Multi-location flexibility | ✅ OFFICE / FIELD / BRANCH_VISIT mode |
| System recognizes location | ✅ OperatingLocation validated |
| Centralized tracking from HQ | ✅ Filter by location in HR report |
| Visit logs & reporting | ✅ Mode + location in attendance log |

---

### HR Task 1 — Overall Summary

| Scenario | Key Feature | Status |
|---|---|---|
| Outstation Movement | Absence vs Duty differentiation, supervisor visibility | ✅ |
| Field Worker GPS | Mobile check-in, GPS capture, offline sync | ✅ |
| Cross-Branch | Branch recognition, centralized HQ report | ✅ |

---

### HR Demo Tips

- **Scenario 1:** Check-in আগে করতে হবে, তারপর Start Movement — এই sequence ভুললে error আসবে
- **Scenario 2:** GPS দেখাতে HTTPS বা localhost দরকার — `http://192.168.50.128:4000` এ কাজ নাও করতে পারে, সেক্ষেত্রে PENDING status দেখান
- **Scenario 3:** Branch Visit-এ dropdown-এ LOC-001 থেকে LOC-004 দেখাবে
- **Browser:** Employee আর Admin দুটো আলাদা browser-এ রাখুন

---

## HR Module — Task 2: Training Participation Control (No Overlap Rule)

---

### Pre-Demo Setup ✅ (আগেই করা হয়েছে)

DB-তে ৪টা training আছে:

| Training No | Title | Date | Status |
|---|---|---|---|
| TRN-2026-001 | Financial Management for NGOs | Mar 10–12 | COMPLETED |
| TRN-2026-002 | Project Cycle Management | May 10–12 | PLANNED |
| TRN-2026-003 | Field Data Collection & MIS | May 11–13 | PLANNED |
| TRN-2026-004 | HR Policies & Staff Conduct | Jun 5 | PLANNED |

> TRN-2026-002 এবং TRN-2026-003 overlap করে (May 11-12 shared) — demo-র জন্য।

---

### Step 1 — Training Page খুলুন

**Login:** `rahim@cssbd.org` (Admin)

1. **`/hr/training`** এ যান
2. ৪টা training list-এ দেখাবে
3. TRN-2026-002 row-এ click করুন → right panel-এ details দেখাবে

**Client কে দেখান:**
- Live training schedule
- Status badges (PLANNED, COMPLETED)
- Participant count per training

---

### Step 2 — Successful Nomination (1st assignment)

1. **Training dropdown** থেকে `TRN-2026-002 - Project Cycle Management` select করুন
2. **Employee dropdown** থেকে `Karim Ahmed` select করুন
3. **Assign** button click করুন
4. ✅ দেখাবে: `Participant assigned successfully`
5. Participant table-এ Karim Ahmed দেখাবে

**Client কে দেখান:**
- Employee successfully enrolled
- Training history tracking — participant table updated

---

### Step 3 — Duplicate Rejection দেখান

1. Same training: `TRN-2026-002`
2. Same employee: `Karim Ahmed`
3. **Assign** আবার click করুন
4. ❌ দেখাবে: `Employee is already a participant`

**Client কে দেখান:**
- System duplicate nomination block করছে
- Validation rules enforcement

---

### Step 4 — Overlap Rejection দেখান (Core Demo)

1. **Training dropdown** থেকে `TRN-2026-003 - Field Data Collection & MIS` select করুন
   > (May 11-13 — TRN-2026-002 এর May 10-12 এর সাথে overlap)
2. Same employee: `Karim Ahmed`
3. **Assign** click করুন
4. ❌ দেখাবে:
   ```
   Conflict with TRN-2026-002 - Project Cycle Management (10 May 2026 to 12 May 2026)
   ```

**Client কে দেখান:**
- System automatically conflict detect করেছে
- কোন training এর সাথে conflict, কোন date range — সব clearly দেখাচ্ছে
- Automated conflict detection কাজ করছে

---

### Step 5 — Non-Overlapping Training (Validation passes)

1. **Training dropdown** থেকে `TRN-2026-004 - HR Policies & Staff Conduct` select করুন
   > (June 5 — কোনো overlap নেই)
2. Same employee: `Karim Ahmed`
3. **Assign** click করুন
4. ✅ দেখাবে: `Participant assigned successfully`

**Client কে দেখান:**
- Same employee, আলাদা date → allowed
- System intelligent — date overlap না থাকলে block করে না

---

### Task 2 Key Points Summary

| Client Focus Point | দেখানো হয়েছে |
|---|---|
| Validation rules enforcement | ✅ Duplicate + overlap block |
| Training history tracking | ✅ Participant table per training |
| Automated conflict detection | ✅ Date range overlap query |
| Clear conflict reason | ✅ Conflicting training info সহ |

---

## Demo Tips

- **Browser:** দুটো browser বা incognito window use করুন — একটায় Admin, অন্যটায় Staff/Store Manager
- **Role switch দেখানোর সময়:** Sidebar এর পার্থক্য highlight করুন
- **Budget warning:** amount বড় দিন (14+ lakh) যেন warning clearly দেখা যায়
- **Audit Trail:** PR detail page এ "View full audit trail" link দেখান — কে কখন কী করেছে

---

## Quick Login Reference

```
Admin:         rahim@cssbd.org    / (existing password)
Staff:         kamal@cssbd.org    / Test1234!
Store Manager: shakil@cssbd.org   / Test1234!
Organization:  cssbd
```
