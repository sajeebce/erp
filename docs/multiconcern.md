# Multi-Concern Accounting Architecture

> **Prepared:** 2026-04-20
> **Context:** CSS (Christian Service Society) Bangladesh — ERP client
> **Purpose:** Core architecture for multi-concern accounting, central dashboard, IFRS/IPSAS compliance
> **Decision:** Option B — Multi-Dimensional Accounting (confirmed)

---

## সংক্ষিপ্ত উত্তর

**Current architecture দিয়ে possible, কিন্তু partial** — কাজ চালাতে পারবে না proper segment reporting এর জন্য। IFRS/IPSAS compliant করতে হলে **schema extension** লাগবে।

---

## 🔍 Current State — কী আছে, কী নেই

| ক্ষেত্র | অবস্থা | মন্তব্য |
|---|---|---|
| SaaS Tenant (Organization) | ✅ Ready | CSS পুরোটা একটাই tenant |
| Project/Grant tagging on JournalEntry | ✅ Works | প্রতি transaction project-এ ট্যাগ হয় |
| Project-specific Chart of Accounts | ✅ Works | COA-তে `projectId` field আছে |
| **Concern/BusinessUnit model** | ❌ **নেই** | হাসপাতাল/ইনস্টিটিউট আলাদা entity হিসেবে নেই |
| **Sector grouping** | ❌ **নেই** | ৫টা sector-এ roll-up করার model নেই |
| **CostCenter** | ⚠ Placeholder field আছে, logic নেই | `costCenterId` field exists কিন্তু unused |
| **Per-concern report filter** | ❌ **নেই** | Balance Sheet / Income Statement কে একটা concern-এর জন্য filter করা যাচ্ছে না |
| **Consolidation / Elimination** | ❌ **নেই** | Inter-concern transfer elimination logic নেই |
| **Segment Reporting (IFRS 8 / IPSAS 18)** | ❌ **নেই** | Standard-compliant segment disclosure impossible |

---

## 🚫 Project field দিয়ে চালালে যেসব সমস্যা হবে

CSS-এর concern-গুলো (Hospital, Nursing Institute, Hope Technical, Polytechnic, MFP, AVA Center, Press ইত্যাদি) **Project নয়** — এগুলো **permanent operating units** (profit/cost centers)। Project সাধারণত temporary (start/end date, donor-funded)।

এখন "Project" field দিয়ে চালালে:
1. একটা হাসপাতাল-এ একাধিক donor-funded project চলতে পারে — যেমন HIV/AIDS project + TLMIB project + general hospital operation। তখন **concern vs project** আলাদা dimension হিসেবে দরকার।
2. MFP-এর ২২২ branch আছে — branch-wise accounting লাগবে, concern-এর under।
3. IFRS-এ **Segment ≠ Project**। Segment হলো business line (Hospital, Education, MFP), Project হলো funded initiative। এই দুটো mix করা standards violation।

---

## ✅ Proposed Architecture

### Core Concept: **Multi-Dimensional Accounting** (Odoo / SAP / NetSuite-এর মতো)

প্রতিটা `JournalEntryLine`-এ একসাথে একাধিক dimension ট্যাগ হবে:

```
JournalEntryLine
├── accountId        (COA — এটা already আছে)
├── projectId        (যদি donor-funded কাজ হয় — already আছে)
├── grantId          (donor grant — already আছে)
├── businessUnitId   🆕 (কোন concern? Hospital/Institute/MFP Branch)
├── sectorId         🆕 (কোন sector? Health/Education/EDS)
├── costCenterId     🆕 (বিভাগ — OPD, IPD, Pharmacy, Admin)
├── fundClassId      🆕 (Restricted/Unrestricted/Endowment — IPSAS)
└── donorId          (implicit via grantId)
```

### 🆕 New Models Needed

```
Sector                          (Health, Education, EDS, Enterprise, Special)
  └── parentId, name, code, organizationId

BusinessUnit (Concern)          (Hospital, Nursing Institute, Hope Technical...)
  ├── sectorId                  FK → Sector
  ├── type                      (HOSPITAL | INSTITUTE | PROGRAM | ENTERPRISE)
  ├── code, name, address, head
  └── consolidationParent       (roll-up target)

CostCenter                      (OPD, IPD, Pharmacy, Admin — under BusinessUnit)
  └── businessUnitId

FundClass                       (IPSAS: Restricted | Unrestricted | Temporarily Restricted | Endowment)

InterUnitTransaction            (Hospital → Head Office fund transfer; for elimination)
```

---

## কীভাবে কাজ করবে

### Input Configuration (Client কীভাবে setup করবে)

1. **Settings → Sector Setup** এ ৫টা sector input (Health, Education, Economic Dev, Enterprise Dev, Special Dev)
2. **Settings → Business Units** এ ১৪+ concern input, প্রতিটা sector-এ attached
3. **Settings → Cost Centers** — প্রতি business unit-এর under sub-department (Hospital-এর জন্য OPD, IPD, Pharmacy, Lab)
4. **Chart of Accounts** একটাই — CSS group-level (unified COA across all concerns)
5. **Journal Entry form**-এ BusinessUnit + CostCenter dropdown যোগ হবে — mandatory
6. **Voucher form**-এও একই

### Dashboard / Report Strategy

**Central Dashboard (CSS Group)**
- সব concern-এর Consolidated P&L, Balance Sheet
- Sector-wise roll-up: Health sector কত খরচ/আয়, Education কত
- Top/bottom performing concerns
- Inter-concern fund flow

**Drill-down:**
```
CSS Group  →  Sector (Health)  →  BusinessUnit (Hospital)  →  CostCenter (OPD)
```

**Per-concern Report:**
- প্রতিটা hospital/institute-এর নিজস্ব Trial Balance, P&L, Balance Sheet
- এটা হাসপাতাল manager নিজে দেখতে পারবে (role-based)
- Group management সব দেখবে consolidated view-তে

---

## 📚 International Standards Compliance

| Standard | Relevance | Our Coverage Plan |
|---|---|---|
| **IPSAS 18** — Segment Reporting (for public sector/NGO) | প্রতিটা segment-এর আলাদা revenue/expense disclosure | BusinessUnit + Sector dimension দিয়ে auto-generate |
| **IFRS 8** — Operating Segments | Segment-wise P&L disclosure | একই dimension থেকে |
| **IPSAS 23** — Revenue from Non-Exchange (Donor grants) | Restricted vs unrestricted recognition | FundClass dimension |
| **IPSAS 1** — Presentation of Financial Statements | Fund-based presentation | COA structure ঠিক রাখলে হবে |
| **IAS 24** — Related Party (Inter-concern) | Inter-unit transaction disclosure | InterUnitTransaction model |

Accounting equation (debit = credit) ঠিক রাখার পাশাপাশি **fund accounting** মানতে হবে — প্রতি fund class-এ debit/credit balance hold করবে।

---

## Option Comparison

**Option A** (দ্রুত, compromise): Project field-কেই concern হিসেবে use করো — ১-২ দিনে চালু হবে, কিন্তু IFRS/IPSAS standard মানবে না, audit firm accept করবে না।

**Option B** (Proper, recommended — ✅ chosen): উপরে proposed multi-dimensional architecture implement করো — client project পাবার জন্য এটাই winning strategy, কারণ:
- Audit-ready (যেকোনো NGOAB-enlisted audit firm accept করবে)
- CSS scale-এ (৫ sector, ১৪+ concern, ২২২ MFP branch) proper fit
- Future: CSS-এর মতো আরো group NGO (World Vision, Caritas) sell করা যাবে — reusable architecture
