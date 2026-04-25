# NGO ERP - Complete Implementation Plan

> **Version:** 1.0
> **Date:** 2026-03-25
> **Architecture:** SaaS, Multi-Tenant, API-Centric, Modular, Integration-Ready
> **Status:** Planning Phase → Ready for Implementation

---

> **MAINTENANCE RULE:** When any section is added, removed, or significantly edited in this document,
> the **Section Index (Line Ranges)** table below MUST be updated to reflect the new line numbers.
> Also update **Quick Reference — Key Rules** if a new architectural rule or convention is introduced.

---

## Quick Reference — Key Rules

1. **SaaS Multi-Tenant** — Every data table has `organizationId` (except global tables listed in §1.3). All queries filter by it.
2. **API-First** — Build REST API first, then UI consumes it. Response format: `{ success, data, meta?, error? }` (§1.2).
3. **Auth** — Custom JWT with `jose` (not NextAuth). Access token 15min, Refresh token 7 days in DB. RBAC on every endpoint (§1.4).
4. **Subscription Guard** — Write ops check plan status: ACTIVE/TRIAL=full, PAST_DUE=read-only, CANCELLED/SUSPENDED=blocked (§1.4.1).
5. **File Storage** — Adapter pattern (local disk → Cloudflare R2). Keys: `{orgId}/{module}/{year}/{month}/{uuid}-{filename}` (§1.5.1).
6. **i18n** — `next-intl` with EN + BN. Messages in `src/messages/{locale}/`. Locale from cookie → org setting → browser (§9).
7. **Server Components default** — Only add `'use client'` when strictly needed. Use `use cache` (not deprecated `unstable_cache`).
8. **Cascade rules** — Soft-delete parents, restrict if children exist, archive completed projects (§5.3).
9. **All file uploads go to Cloudflare R2** — Every module that handles file uploads (documents, receipts, photos, attachments) MUST use the centralized storage adapter. Never store files on local disk in production. Storage config is managed by Super Admin via `MediaSetting` table; tenants see read-only storage info in System Settings. Key format: `{orgId}/{module}/{year}/{month}/{uuid}-{filename}`.
10. **Bank Reconciliation** — Full workflow: (1) Select bank account + period, (2) Import CSV bank statement with column mapping, (3) Side-by-side matching UI — bank lines vs book entries (JE/vouchers), (4) Auto-match by amount + date + reference, (5) Manual match or create JE from unmatched bank lines (fees, interest), (6) Finalize when difference=0 → lock period. CSV import supports all Bangladesh banks. Every matched item links to a JournalEntry via `matchedJournalId`.
11. **Financial Reports** — Full-page dedicated report viewer (not modal). Architecture: (a) Listing page `/finance/financial-reports` — 13 report cards in 3 sections (Core/Subsidiary/NGO), click navigates to detail page; (b) Detail page `/finance/financial-reports/[type]` — filter bar (fiscal year, date range, show-zero toggle, generate button), auto-generates on fiscal year change; (c) Reusable `ReportViewer` component — company header, configurable columns (currency/number/date/text format), hierarchical rows (_isGroup, _level), pinned totals footer; (d) Print — `window.open()` popup with inline CSS, auto-print dialog, professional layout (company name, report title, period, bordered table, timestamp footer, A4 landscape); (e) CSV export — downloadable CSV with proper filename; (f) 13 report types: 5 Core (trial-balance, income-statement, balance-sheet, cash-flow, receipts-payments), 4 Subsidiary (ledger, day-book, bank-book, cash-book), 4 NGO-specific (fund-position, fund-balance-changes, grant-financial, bank-reconciliation-statement). All APIs compute data from approved JournalEntry lines in real-time.
12. **Bank & Cash Management** — Operational cash/bank visibility page. Shows all bank, cash, and mobile banking accounts with real-time balances. Features: create/edit bank accounts, view transaction history, fund transfers (auto-generates contra voucher), freeze/close accounts. Bangladesh NGO-specific: NGOAB Mother Account (FC), Project Accounts (FD-6), FDR/SDR tracking, bKash/Nagad mobile banking. Summary cards: Total Bank Balance, Total Cash, Mobile Banking Balance, Total Liquid Position. Connected to: Vouchers (payment/receipt), Fund Receipts, Bank Reconciliation, Payroll.

---

## Section Index (Line Ranges)

> **How to use:** Find your topic below, then read only the listed line range.

| # | Section | Lines | Description |
|---|---------|-------|-------------|
| **1** | **Architecture & Design Principles** | **70–366** | |
| **2** | **Folder Structure** | **368–851** | Complete src/ directory tree |
| **3** | **Menu Structure** | **853–866** | Sidebar navigation hierarchy |
| **4** | **Database Schema (Prisma 7.x)** | **868–4149** | |
| 4.1–4.12 | All Models | 870–4149 | Enums, Auth, Finance, Budget, Donor, Project, Beneficiary, Procurement, Asset, HR, Microfinance, System |
| **5** | **Inter-Module Data Flow** | **4151–4262** | Module dependency, cross-module impact, cascade rules |
| **6** | **API Routes & CRUD Operations** | **4264–4636** | 220+ endpoints by module |
| **7** | **Implementation Phases** | **4638–9838** | |
| | Phase 1: Foundation & SaaS Core | 4640–4722 | Auth, multi-tenancy, super admin, subscription |
| | Phase 2: Core Finance ✅ | 4724–4747 | Chart of Accounts, Journal Entries, Vouchers |
| | Phase 3: Budget & Donor ✅ | 4749–4770 | Budgets, Donors, Grants, Fund Receipts |
| | Phase 4: Project & Beneficiary ✅ | 4772–4814 | Projects, Activities, Beneficiaries |
| | Phase 5: Operations ✅ | 4816–4877 | Procurement, Assets, HR, Microfinance |
| | Phase 6: Reports & Dashboard ✅ | 4879–4904 | Reports, Analytics, Dashboard widgets |
| | Phase 7: UI Pages ✅ | 4906–4936 | All CRUD UI pages across modules |
| | Remaining (Deferred) | 4938–4948 | Webhooks, advanced features |
| | **Phase 8: HR & Payroll Intl Upgrade ✅** | 4950–5654 | Recruitment/ATS, Contracts, Offboarding, Holidays, Grievance, Analytics |
| | **Phase 8b: HR Fixes + Gratuity + PF ✅** | 5656–6672 | Critical HR fixes, Gratuity Fund, Provident Fund, Pension research |
| | **Phase 9: Budget Intl Upgrade** | 6674–7070 | Phasing, Commitment, Budget Check, Interactive Pages, Burn Rate, Templates, NICRA |
| | **Phase 10: Cross-Module Integration** | 7072–8101 | Procurement encumbrance, Payroll→Budget, Dashboard KPIs, Grant→Budget, NGOAB |
| | **Phase 11: Daily Expense Management** | 8103–8778 | Petty Cash, Expense Claims, Advances, Per Diem, TDS/VDS, 7 reports, fixes |
| | **Phase 12: HR Employee Profile Upgrade** | 8780–9838 | Schema expansion (7 models, ~35 fields), tabbed profile UI, 34 APIs, documents, compliance |
| | **Phase 8c: HR Deferred + Cross-Module HR** | 9841–11017 | Salary grades, payslip PDF, team leave calendar, OKR, personnel cost tracking, dashboard HR KPIs |
| | **Phase 8c-fix: HR Wiring & Bug Fixes** | 11022–11193 | Salary grades 500, dynamic compensation, avatar+filters, photo upload, tab scroll, PF URL bulk fix |
| | **Phase 8b-fix: Pension (PF + Gratuity) Fixes** | 11196–11327 | PF enrollments/dashboard/detail, Gratuity BDTNaN, pension i18n, 22 URL fixes |
| | **Phase 13: Multi-Concern Accounting & Operating Structure** | 11353+ | CSS Bangladesh multi-concern setup: Sector/BusinessUnit/CostCenter/FundClass models, dimension-aware journal posting, concern-wise reports, CSS COA |
| 7.1 | Cron Jobs | 11330–11352 | Scheduled tasks (token cleanup, depreciation, etc.) |
| **8** | **Testing Guidelines** | **11354–11645** | Testing strategy, module-wise tests, integration scenarios |
| — | **Verification Checklist** | **11647–11675** | Pre-launch validation checklist |
| — | **Critical Fixes (Post-Audit)** | **11677–11765** | Fix 1–9: journal auto-create, indexes, file upload |
| — | **Important Features** | **11767–11780** | International-grade enhancements |
| — | **New Dependencies** | **11782–11811** | Required npm packages |
| **9** | **Internationalization (i18n)** | **11814–11923** | next-intl, EN + BN, message files, locale resolution |

---

## 1. Architecture & Design Principles

### 1.1 API-Centric Design

Every feature is built as a REST API first, then consumed by the Next.js frontend. This enables:

- **Third-party integration** with accounting software (QuickBooks, Xero, Tally), marketing tools, payment gateways (bKash, Nagad, bank APIs), and government portals (NGOAB, MRA)
- **Mobile app readiness** — same APIs power a future mobile app
- **Webhook support** — external systems can subscribe to events (e.g., "new donation received")
- **Import/Export** — CSV, Excel, PDF export on every list endpoint

### 1.2 API Response Format

All APIs follow a consistent response structure:

```typescript
// Success
{
  success: true,
  data: T | T[],
  meta?: { page, limit, total, totalPages },
  message?: string
}

// Error
{
  success: false,
  error: {
    code: string,      // e.g., "VALIDATION_ERROR", "NOT_FOUND"
    message: string,
    details?: Record<string, string[]>
  }
}
```

### 1.3 SaaS Multi-Tenancy

This is a **SaaS application** — multiple NGO organizations share a single deployment.

#### Tenant Isolation Strategy: **Shared Database, Shared Schema**

- Every data table includes `organizationId` column (mandatory, NOT NULL)
- All queries are automatically filtered by the authenticated user's `organizationId`
- Tenant resolved from hostname: custom domain lookup → subdomain slug extraction → `organizationId`
- API middleware injects `organizationId` from JWT/session — no client can override
- PostgreSQL Row-Level Security (RLS) as defense-in-depth (application-level filtering is primary)
- File storage on Cloudflare R2 (configured by Super Admin), keys namespaced by org: `{organizationId}/{module}/{year}/{month}/{uuid}-{filename}`
- Redis cache keys prefixed with org: `org:{orgId}:cache:...`

#### Domain & Routing Strategy

Each tenant can be accessed via **two** methods:

1. **Platform subdomain (default):** `{slug}.ngoerp.com` — automatically available on signup
2. **Custom domain (optional):** Tenant connects their own domain (e.g., `erp.shaplango.org`)

```
Routing Resolution Order:
1. Check request hostname
2. If custom domain → lookup Organization by customDomain field
3. If subdomain of platform → extract slug, lookup Organization by slug
4. Inject organizationId into request context
5. Proceed with tenant-scoped request
```

**Custom Domain Setup (by Tenant Admin):**
1. Tenant enters their domain in Settings → Domain Configuration
2. System shows DNS instructions: "Add CNAME record pointing to `cname.ngoerp.com`"
3. Tenant adds CNAME in their DNS provider
4. System verifies DNS propagation (polling or manual verify button)
5. SSL auto-provisioned via Cloudflare (if using CF proxy) or Let's Encrypt
6. Once verified, `customDomain` is saved and `domainVerified = true`

**Super Admin can:**
- View all tenant domains
- Manually verify/revoke custom domains
- Set the platform base domain (e.g., `ngoerp.com`)

#### Tenant Onboarding Flow

```
1. User signs up at ngoerp.com/register → creates Organization + admin user
2. Organization gets slug → tenant dashboard available at {slug}.ngoerp.com
3. Org admin configures: fiscal year, currency, chart of accounts, roles
4. Org admin invites users via email
5. Each user belongs to exactly one organization
6. (Optional) Org admin connects custom domain in Settings → Domain
```

#### Tables WITHOUT organizationId (global/system-level)

These tables are shared across all tenants:
- `Organization` (the tenant itself)
- `SuperAdmin` (platform-level admins)
- `SuperAdminAuditLog` (platform admin actions)
- `ImpersonationSession` (super admin → tenant impersonation)
- `SubscriptionPlan` (pricing plans)
- `PlatformFeature` (feature registry)
- `PlanFeature` (feature inclusion per plan)
- `TenantSubscription` (per-org subscription)
- `TenantInvoice` (SaaS billing invoices)
- `PaymentTransaction` (SaaS payments)
- `MediaSetting` (R2/storage config)
- `Permission` (system-defined permission list)
- `Currency` (master currency list)
- `WebhookEvent` (event type definitions)

#### Tables WITH organizationId (tenant-scoped)

**Every other table** — User, Role, Account, JournalEntry, Voucher, Budget, Donor, Grant, Project, Employee, Beneficiary, Asset, Samity, LoanAccount, etc.

### 1.4 Authentication & Authorization

> **Pattern adopted from LMS project** — custom JWT with `jose` library instead of NextAuth (lighter, more control)

#### JWT Token Structure

```typescript
// Access Token (15 minutes TTL)
interface AccessTokenPayload {
  userId: string
  organizationId: string
  roleId: string
  roleName: string           // "SUPER_ADMIN" | "FINANCE_ADMIN" | "FIELD_OFFICER" etc.
  isImpersonating?: boolean  // Super admin impersonating tenant user
}

// Refresh Token (7 days TTL, stored in DB)
interface RefreshTokenPayload {
  userId: string
  organizationId: string
  tokenId: string            // DB record ID for revocation
}

// Super Admin Token (8 hours TTL)
interface SuperAdminTokenPayload {
  superAdminId: string
  email: string
  isSuperAdmin: true
}
```

#### Auth Flow
1. **Login:** `POST /api/v1/auth/login` with `{ email, password, orgSlug }` → returns `{ accessToken, refreshToken }`
2. **Access Token:** Short-lived (15 min), sent in `Authorization: Bearer` header or `accessToken` cookie
3. **Refresh Token:** Long-lived (7 days), stored in `RefreshToken` table, used to get new access tokens
4. **Token Refresh:** `POST /api/v1/auth/refresh` → validates DB record → issues new access token
5. **Logout:** Revokes refresh token in DB

#### Auth Helpers (Server-Side)
```typescript
// Every server action / API route uses these:
await requireRole('FINANCE_ADMIN')           // Single role check
await requireRole(['FINANCE_ADMIN', 'ED'])   // Any of these roles
const orgId = await getOrganizationId()      // Extract from JWT
const user = await getCurrentUser()          // Full user object
```

#### Key Components
- **`jose`** library for JWT signing/verification (not NextAuth — lighter, more control)
- **`bcryptjs`** for password hashing
- **RBAC** middleware — every API endpoint checks role permissions
- **Refresh tokens** stored in DB (revocable per-device/session)
- **Tenant context** — extracted from JWT, injected into every DB query
- **Impersonation** — Super admin can impersonate any tenant admin for support

### 1.4.1 Subscription Guard (Access Control by Plan Status)

> **Adopted from LMS** — middleware that controls feature access based on subscription state

```typescript
// Every write operation checks subscription status first
const access = await checkSubscriptionAccess(organizationId)

// Access levels based on subscription status:
// ACTIVE / TRIAL      → FULL access (read + write + API)
// PAST_DUE            → READ_ONLY (grace period — can view, can't create/edit)
// PAUSED              → READ_ONLY (tenant paused subscription)
// EXPIRED / CANCELLED → BLOCKED (redirect to renewal page)
// BLOCKED             → Data export allowed for 30 days, then fully blocked
```

| Feature | ACTIVE | TRIAL | PAST_DUE | EXPIRED | PAUSED | CANCELLED |
|---------|--------|-------|----------|---------|--------|-----------|
| View Dashboard | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| View Data | ✓ | ✓ | ✓ (RO) | ✗ | ✓ (RO) | ✗ |
| Create/Edit Data | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Approvals | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| API Access | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Export Data | ✓ | ✓ | ✓ | ✓ (30d) | ✓ | ✗ |
| Reports | ✓ | ✓ | ✓ (RO) | ✗ | ✓ (RO) | ✗ |

### 1.4.2 Impersonation (Super Admin → Tenant)

Super admin can impersonate any tenant admin for debugging/support:

```
1. Super Admin clicks "Impersonate" on a tenant
2. ImpersonationSession created (tracked with IP, user agent, expiry)
3. Separate impersonation_token cookie issued
4. Super admin sees tenant dashboard as if they were the tenant admin
5. All actions during impersonation are logged in audit trail
6. "End Impersonation" button returns to super admin view
7. ImpersonationSession marked as ended
```

### 1.5 Core Design Rules

| Rule | Description |
|------|-------------|
| **Multi-Tenant** | Every query includes `WHERE organizationId = ?` — enforced at middleware level, not per-endpoint |
| **Subscription Guard** | Every write operation checks subscription status (FULL/READ_ONLY/BLOCKED) |
| **Soft Deletes** | Financial records (vouchers, journal entries, fund receipts) use `deletedAt` — never hard deleted |
| **Audit Trail** | Split: `SuperAdminAuditLog` (platform actions) + `TenantAuditLog` (tenant actions) |
| **Approval Workflow** | Generic engine — any entity can have multi-level approval attached |
| **Number Sequences** | Auto-generated document numbers (DV-2026-001, PO-2026-001) per organization |
| **Multi-Currency** | Base currency configurable per org, with `ExchangeRate` table for conversion |
| **Fiscal Periods** | Support configurable fiscal year start month per organization |
| **File Storage** | Adapter pattern: Local (dev) → Cloudflare R2 (prod). Config in `MediaSetting`. Keys: `{orgId}/{module}/{year}/{month}/{uuid}-{filename}` |
| **Storage Quota** | Each org tracks `storageUsedBytes` + `bandwidthUsedBytes`. Warnings at 80%/90%. Hard limit at 100% |
| **Timezone** | All dates stored in UTC, displayed in org-configured timezone |
| **UUIDs** | All primary keys are UUIDs for API-centric design (no sequential IDs exposed) |
| **Data Isolation** | No cross-tenant data leakage — even error messages don't reveal other tenants exist |
| **Webhooks** | External systems can subscribe to ERP events (e.g., "voucher.approved", "fund.received") |

### 1.5.1 File Storage — Adapter Pattern

> **Adopted from LMS** — abstracted storage with dev/prod adapters

```
lib/storage/
├── storage-adapter.ts        # Interface definition
├── storage-factory.ts        # Creates adapter based on config
├── storage-service.ts        # Business logic (quota check, namespace, upload)
└── adapters/
    ├── local-storage.ts      # Dev: ./storage/{orgId}/...
    └── r2-storage.ts         # Prod: Cloudflare R2 via @aws-sdk/client-s3
```

```typescript
interface StorageAdapter {
  upload(params: UploadParams): Promise<UploadResult>
  download(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  deleteMany(keys: string[]): Promise<void>
  getUrl(key: string, expiresIn?: number): Promise<string>
  exists(key: string): Promise<boolean>
  list(prefix: string): Promise<StorageObject[]>
  testConnection(): Promise<{ success: boolean; error?: string }>
}
```

**Flow:**
1. `StorageFactory` reads `MediaSetting` table (Super Admin configured)
2. If R2 credentials present → `R2StorageAdapter`
3. Else → `LocalStorageAdapter` (dev fallback to `./storage/` directory)
4. Before upload: `StorageQuotaService.checkQuota(orgId, fileSize)` — rejects if over limit
5. After upload: `StorageQuotaService.incrementUsage(orgId, fileSize)` — tracks usage
6. Warnings sent at 80% and 90% of quota

### 1.5.2 Payment Gateway — Factory Pattern

> **Adopted from LMS** — pluggable payment gateways for SaaS billing

```
lib/payment/
├── gateway-factory.ts         # Creates gateway based on config
├── gateway-interface.ts       # Common interface
└── gateways/
    ├── sslcommerz-gateway.ts  # SSLCommerz (BD standard)
    ├── bkash-gateway.ts       # bKash mobile payment
    ├── stripe-gateway.ts      # Stripe (international)
    └── mock-gateway.ts        # Dev/testing
```

```typescript
interface PaymentGateway {
  initiate(params: PaymentParams): Promise<PaymentInitResult>
  verify(transactionId: string): Promise<PaymentVerifyResult>
  refund(transactionId: string, amount?: number): Promise<RefundResult>
}
```

Used for: SaaS subscription payments (tenant pays platform), NOT for NGO's internal accounting.

### 1.6 Deployment (VPS Direct)

- **Server:** Ubuntu 24.04 LTS on VPS
- **Process Manager:** PM2 for Node.js
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt (Certbot)
- **Database:** PostgreSQL 18 on same or separate VPS
- **Cache:** Redis 7 on same VPS
- **File Storage:** Cloudflare R2 (S3-compatible, configured via Super Admin → Media Settings)
- **Backup:** pg_dump daily cron → remote storage

---

## 2. Folder Structure

```
ngo-erp/
├── prisma/
│   ├── schema/                          # Split schema files (Prisma 7 multi-file)
│   │   ├── base.prisma                  # datasource, generator, enums
│   │   ├── auth.prisma                  # User, Role, Permission, Session, RefreshToken
│   │   ├── saas.prisma                  # SuperAdmin, SubscriptionPlan, PlatformFeature, TenantSubscription, TenantInvoice, PaymentTransaction, ImpersonationSession
│   │   ├── organization.prisma          # Organization, FiscalYear, SystemConfig, MediaSetting
│   │   ├── finance.prisma               # Account, JournalEntry, Voucher, BankAccount
│   │   ├── budget.prisma                # Budget, BudgetLine, Revision, CostAllocation
│   │   ├── donor.prisma                 # Donor, Grant, FundReceipt, FundRequisition
│   │   ├── project.prisma              # Project, Activity, Milestone, LogFrame
│   │   ├── beneficiary.prisma          # Beneficiary, Enrollment, ServiceDelivery
│   │   ├── procurement.prisma          # PR, PO, Tender, Vendor, Contract
│   │   ├── inventory.prisma            # InventoryItem, Warehouse, GoodsReceipt
│   │   ├── asset.prisma                # Asset, AssetCategory, Depreciation, Transfer
│   │   ├── hr.prisma                   # Employee, Attendance, Leave, Payroll
│   │   ├── microfinance.prisma         # Samity, LoanProduct, LoanAccount, Savings
│   │   └── system.prisma              # AuditLog (Super+Tenant), Notification, Attachment, Webhook, DataRetention
│   ├── seed.ts                         # Seed data (roles, permissions, chart of accounts)
│   └── migrations/
│
├── src/
│   ├── app/
│   │   ├── (auth)/                     # Public auth pages
│   │   │   ├── login/page.tsx          # Login with org slug
│   │   │   ├── register/page.tsx       # SaaS signup (create org + admin)
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (admin)/                    # Super Admin panel (SaaS management)
│   │   │   ├── layout.tsx
│   │   │   ├── organizations/page.tsx
│   │   │   ├── plans/page.tsx
│   │   │   ├── subscriptions/page.tsx
│   │   │   └── media-settings/page.tsx  # Cloudflare R2 config
│   │   │
│   │   ├── (dashboard)/                # Protected dashboard routes
│   │   │   ├── layout.tsx              # Sidebar + TopNav + Auth guard
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx            # Overview
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   └── activity-feed/page.tsx
│   │   │   ├── finance/
│   │   │   │   ├── chart-of-accounts/page.tsx
│   │   │   │   ├── journal-entries/page.tsx
│   │   │   │   ├── journal-entries/[id]/page.tsx
│   │   │   │   ├── journal-entries/new/page.tsx
│   │   │   │   ├── vouchers/page.tsx
│   │   │   │   ├── vouchers/[id]/page.tsx
│   │   │   │   ├── vouchers/new/page.tsx
│   │   │   │   ├── bank-reconciliation/page.tsx
│   │   │   │   ├── bank-cash/page.tsx
│   │   │   │   └── financial-reports/page.tsx
│   │   │   ├── budget/
│   │   │   │   ├── page.tsx            # Budget List
│   │   │   │   ├── create/page.tsx
│   │   │   │   ├── [id]/page.tsx       # Budget detail/edit
│   │   │   │   ├── budget-vs-actual/page.tsx
│   │   │   │   ├── revision/page.tsx
│   │   │   │   └── cost-allocation/page.tsx
│   │   │   ├── donors/
│   │   │   │   ├── page.tsx            # Donor Directory
│   │   │   │   ├── [id]/page.tsx       # Donor detail
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── grants/page.tsx
│   │   │   │   ├── grants/[id]/page.tsx
│   │   │   │   ├── grants/new/page.tsx
│   │   │   │   ├── fund-receipts/page.tsx
│   │   │   │   ├── fund-receipts/new/page.tsx
│   │   │   │   ├── fund-requisitions/page.tsx
│   │   │   │   ├── fund-requisitions/new/page.tsx
│   │   │   │   ├── reports/page.tsx
│   │   │   │   └── grant-lifecycle/page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx            # Project List
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── activity-planning/page.tsx
│   │   │   │   ├── milestones/page.tsx
│   │   │   │   ├── logframe/page.tsx
│   │   │   │   ├── indicators/page.tsx   # NEW: Results framework indicators
│   │   │   │   ├── risks/page.tsx        # NEW: Risk register
│   │   │   │   └── closeout/page.tsx
│   │   │   ├── beneficiaries/
│   │   │   │   ├── page.tsx            # Beneficiary Registry
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── enrollment/page.tsx
│   │   │   │   ├── service-delivery/page.tsx
│   │   │   │   ├── impact-assessment/page.tsx
│   │   │   │   └── grievances/page.tsx
│   │   │   ├── procurement/
│   │   │   │   ├── requisitions/page.tsx
│   │   │   │   ├── requisitions/[id]/page.tsx
│   │   │   │   ├── requisitions/new/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── orders/[id]/page.tsx
│   │   │   │   ├── orders/new/page.tsx
│   │   │   │   ├── etendering/page.tsx
│   │   │   │   ├── etendering/[id]/page.tsx
│   │   │   │   ├── vendors/page.tsx
│   │   │   │   ├── vendors/[id]/page.tsx
│   │   │   │   ├── vendors/new/page.tsx
│   │   │   │   ├── contracts/page.tsx
│   │   │   │   ├── contracts/[id]/page.tsx
│   │   │   │   ├── inventory/page.tsx
│   │   │   │   ├── warehouse/page.tsx
│   │   │   │   └── goods-receipt/page.tsx
│   │   │   ├── assets/
│   │   │   │   ├── page.tsx            # Asset Register
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── categories/page.tsx
│   │   │   │   ├── depreciation/page.tsx
│   │   │   │   ├── transfer/page.tsx
│   │   │   │   ├── maintenance/page.tsx
│   │   │   │   └── disposal/page.tsx
│   │   │   ├── hr/
│   │   │   │   ├── page.tsx            # Employee Directory
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── onboarding/page.tsx
│   │   │   │   ├── attendance/page.tsx
│   │   │   │   ├── leave/page.tsx
│   │   │   │   ├── payroll/page.tsx
│   │   │   │   ├── payroll/[runId]/page.tsx
│   │   │   │   ├── performance/page.tsx
│   │   │   │   ├── training/page.tsx
│   │   │   │   └── org-chart/page.tsx
│   │   │   ├── microfinance/
│   │   │   │   ├── samity/page.tsx
│   │   │   │   ├── samity/[id]/page.tsx
│   │   │   │   ├── samity/new/page.tsx
│   │   │   │   ├── loan-products/page.tsx
│   │   │   │   ├── loan-applications/page.tsx
│   │   │   │   ├── loan-applications/[id]/page.tsx
│   │   │   │   ├── disbursement/page.tsx
│   │   │   │   ├── collection/page.tsx
│   │   │   │   ├── savings/page.tsx
│   │   │   │   ├── overdue/page.tsx
│   │   │   │   └── mra-reports/page.tsx
│   │   │   ├── reports/
│   │   │   │   ├── financial/page.tsx
│   │   │   │   ├── ngoab/page.tsx
│   │   │   │   ├── donor/page.tsx
│   │   │   │   ├── project/page.tsx
│   │   │   │   ├── hr/page.tsx
│   │   │   │   ├── procurement/page.tsx
│   │   │   │   ├── custom/page.tsx
│   │   │   │   └── audit-trail/page.tsx
│   │   │   └── settings/
│   │   │       ├── organization/page.tsx
│   │   │       ├── domain/page.tsx         # Custom domain setup
│   │   │       ├── users/page.tsx
│   │   │       ├── roles/page.tsx
│   │   │       ├── workflows/page.tsx
│   │   │       ├── notifications/page.tsx
│   │   │       ├── system/page.tsx
│   │   │       └── backup-logs/page.tsx
│   │   │
│   │   ├── api/                        # REST API Routes
│   │   │   ├── v1/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/route.ts
│   │   │   │   │   ├── logout/route.ts
│   │   │   │   │   ├── me/route.ts
│   │   │   │   │   └── refresh/route.ts
│   │   │   │   ├── finance/
│   │   │   │   │   ├── accounts/route.ts          # GET (list), POST (create)
│   │   │   │   │   ├── accounts/[id]/route.ts     # GET, PUT, DELETE
│   │   │   │   │   ├── accounts/tree/route.ts     # GET (hierarchical)
│   │   │   │   │   ├── journal-entries/route.ts
│   │   │   │   │   ├── journal-entries/[id]/route.ts
│   │   │   │   │   ├── journal-entries/[id]/post/route.ts    # POST (post entry)
│   │   │   │   │   ├── vouchers/route.ts
│   │   │   │   │   ├── vouchers/[id]/route.ts
│   │   │   │   │   ├── vouchers/[id]/approve/route.ts
│   │   │   │   │   ├── bank-accounts/route.ts
│   │   │   │   │   ├── bank-accounts/[id]/route.ts
│   │   │   │   │   ├── bank-reconciliation/route.ts
│   │   │   │   │   ├── bank-reconciliation/[id]/route.ts
│   │   │   │   │   ├── bank-reconciliation/[id]/match/route.ts
│   │   │   │   │   ├── currencies/route.ts
│   │   │   │   │   ├── exchange-rates/route.ts
│   │   │   │   │   └── reports/[type]/route.ts    # GET (trial-balance, income-statement, etc.)
│   │   │   │   ├── budget/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   ├── [id]/lines/route.ts
│   │   │   │   │   ├── [id]/vs-actual/route.ts
│   │   │   │   │   ├── revisions/route.ts
│   │   │   │   │   ├── revisions/[id]/route.ts
│   │   │   │   │   ├── revisions/[id]/approve/route.ts
│   │   │   │   │   ├── cost-allocation/route.ts
│   │   │   │   │   └── cost-allocation/[id]/route.ts
│   │   │   │   ├── donors/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   ├── [id]/contacts/route.ts
│   │   │   │   │   ├── grants/route.ts
│   │   │   │   │   ├── grants/[id]/route.ts
│   │   │   │   │   ├── grants/[id]/lifecycle/route.ts
│   │   │   │   │   ├── fund-receipts/route.ts
│   │   │   │   │   ├── fund-receipts/[id]/route.ts
│   │   │   │   │   ├── fund-requisitions/route.ts
│   │   │   │   │   ├── fund-requisitions/[id]/route.ts
│   │   │   │   │   ├── fund-requisitions/[id]/approve/route.ts
│   │   │   │   │   └── reports/route.ts
│   │   │   │   ├── projects/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   ├── [id]/team/route.ts
│   │   │   │   │   ├── [id]/documents/route.ts
│   │   │   │   │   ├── activities/route.ts
│   │   │   │   │   ├── activities/[id]/route.ts
│   │   │   │   │   ├── milestones/route.ts
│   │   │   │   │   ├── milestones/[id]/route.ts
│   │   │   │   │   ├── logframe/route.ts
│   │   │   │   │   ├── logframe/[id]/route.ts
│   │   │   │   │   ├── closeout/route.ts
│   │   │   │   │   ├── closeout/[id]/route.ts
│   │   │   │   │   └── dashboard/route.ts
│   │   │   │   ├── beneficiaries/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   ├── enrollment/route.ts
│   │   │   │   │   ├── enrollment/[id]/route.ts
│   │   │   │   │   ├── service-delivery/route.ts
│   │   │   │   │   ├── service-delivery/[id]/route.ts
│   │   │   │   │   ├── impact-indicators/route.ts
│   │   │   │   │   ├── impact-assessment/route.ts
│   │   │   │   │   ├── impact-assessment/[id]/route.ts
│   │   │   │   │   ├── grievances/route.ts
│   │   │   │   │   └── grievances/[id]/route.ts
│   │   │   │   ├── procurement/
│   │   │   │   │   ├── requisitions/route.ts
│   │   │   │   │   ├── requisitions/[id]/route.ts
│   │   │   │   │   ├── requisitions/[id]/approve/route.ts
│   │   │   │   │   ├── orders/route.ts
│   │   │   │   │   ├── orders/[id]/route.ts
│   │   │   │   │   ├── tenders/route.ts
│   │   │   │   │   ├── tenders/[id]/route.ts
│   │   │   │   │   ├── tenders/[id]/bids/route.ts
│   │   │   │   │   ├── tenders/[id]/award/route.ts
│   │   │   │   │   ├── vendors/route.ts
│   │   │   │   │   ├── vendors/[id]/route.ts
│   │   │   │   │   ├── vendors/[id]/ratings/route.ts
│   │   │   │   │   ├── contracts/route.ts
│   │   │   │   │   ├── contracts/[id]/route.ts
│   │   │   │   │   ├── inventory/route.ts
│   │   │   │   │   ├── inventory/[id]/route.ts
│   │   │   │   │   ├── inventory/transactions/route.ts
│   │   │   │   │   ├── warehouses/route.ts
│   │   │   │   │   ├── warehouses/[id]/route.ts
│   │   │   │   │   ├── goods-receipt/route.ts
│   │   │   │   │   └── goods-receipt/[id]/route.ts
│   │   │   │   ├── assets/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── [id]/route.ts
│   │   │   │   │   ├── categories/route.ts
│   │   │   │   │   ├── categories/[id]/route.ts
│   │   │   │   │   ├── depreciation/route.ts
│   │   │   │   │   ├── depreciation/calculate/route.ts   # POST (run depreciation)
│   │   │   │   │   ├── transfers/route.ts
│   │   │   │   │   ├── transfers/[id]/route.ts
│   │   │   │   │   ├── maintenance/route.ts
│   │   │   │   │   ├── maintenance/[id]/route.ts
│   │   │   │   │   ├── disposal/route.ts
│   │   │   │   │   └── disposal/[id]/route.ts
│   │   │   │   ├── hr/
│   │   │   │   │   ├── employees/route.ts
│   │   │   │   │   ├── employees/[id]/route.ts
│   │   │   │   │   ├── employees/[id]/documents/route.ts
│   │   │   │   │   ├── departments/route.ts
│   │   │   │   │   ├── departments/[id]/route.ts
│   │   │   │   │   ├── designations/route.ts
│   │   │   │   │   ├── onboarding/route.ts
│   │   │   │   │   ├── onboarding/[id]/route.ts
│   │   │   │   │   ├── attendance/route.ts
│   │   │   │   │   ├── attendance/summary/route.ts
│   │   │   │   │   ├── leave-types/route.ts
│   │   │   │   │   ├── leave/route.ts
│   │   │   │   │   ├── leave/[id]/route.ts
│   │   │   │   │   ├── leave/[id]/approve/route.ts
│   │   │   │   │   ├── leave/balance/[employeeId]/route.ts
│   │   │   │   │   ├── payroll/runs/route.ts
│   │   │   │   │   ├── payroll/runs/[id]/route.ts
│   │   │   │   │   ├── payroll/runs/[id]/process/route.ts
│   │   │   │   │   ├── payroll/runs/[id]/approve/route.ts
│   │   │   │   │   ├── payroll/salary-structures/route.ts
│   │   │   │   │   ├── performance/reviews/route.ts
│   │   │   │   │   ├── performance/reviews/[id]/route.ts
│   │   │   │   │   ├── performance/kpis/route.ts
│   │   │   │   │   ├── training/route.ts
│   │   │   │   │   ├── training/[id]/route.ts
│   │   │   │   │   ├── training/[id]/participants/route.ts
│   │   │   │   │   └── org-chart/route.ts
│   │   │   │   ├── microfinance/
│   │   │   │   │   ├── branches/route.ts
│   │   │   │   │   ├── branches/[id]/route.ts
│   │   │   │   │   ├── samity/route.ts
│   │   │   │   │   ├── samity/[id]/route.ts
│   │   │   │   │   ├── samity/[id]/members/route.ts
│   │   │   │   │   ├── members/route.ts
│   │   │   │   │   ├── members/[id]/route.ts
│   │   │   │   │   ├── loan-products/route.ts
│   │   │   │   │   ├── loan-products/[id]/route.ts
│   │   │   │   │   ├── loan-applications/route.ts
│   │   │   │   │   ├── loan-applications/[id]/route.ts
│   │   │   │   │   ├── loan-applications/[id]/approve/route.ts
│   │   │   │   │   ├── loan-accounts/route.ts
│   │   │   │   │   ├── loan-accounts/[id]/route.ts
│   │   │   │   │   ├── disbursement/route.ts
│   │   │   │   │   ├── disbursement/[id]/route.ts
│   │   │   │   │   ├── collection/route.ts
│   │   │   │   │   ├── collection/[id]/route.ts
│   │   │   │   │   ├── repayments/route.ts
│   │   │   │   │   ├── savings-accounts/route.ts
│   │   │   │   │   ├── savings-accounts/[id]/route.ts
│   │   │   │   │   ├── savings-transactions/route.ts
│   │   │   │   │   ├── overdue/route.ts
│   │   │   │   │   └── mra-reports/[type]/route.ts
│   │   │   │   ├── reports/
│   │   │   │   │   ├── financial/[type]/route.ts
│   │   │   │   │   ├── ngoab/[form]/route.ts
│   │   │   │   │   ├── donor/route.ts
│   │   │   │   │   ├── project/route.ts
│   │   │   │   │   ├── hr/[type]/route.ts
│   │   │   │   │   ├── procurement/route.ts
│   │   │   │   │   ├── custom/route.ts
│   │   │   │   │   ├── custom/[id]/route.ts
│   │   │   │   │   └── audit-trail/route.ts
│   │   │   │   ├── settings/
│   │   │   │   │   ├── organization/route.ts
│   │   │   │   │   ├── users/route.ts
│   │   │   │   │   ├── users/[id]/route.ts
│   │   │   │   │   ├── roles/route.ts
│   │   │   │   │   ├── roles/[id]/route.ts
│   │   │   │   │   ├── roles/[id]/permissions/route.ts
│   │   │   │   │   ├── workflows/route.ts
│   │   │   │   │   ├── workflows/[id]/route.ts
│   │   │   │   │   ├── notifications/settings/route.ts
│   │   │   │   │   ├── system/route.ts
│   │   │   │   │   ├── number-sequences/route.ts
│   │   │   │   │   ├── backup/route.ts
│   │   │   │   │   └── backup/[id]/route.ts
│   │   │   │   ├── upload/route.ts            # File upload
│   │   │   │   └── webhooks/route.ts          # Webhook management
│   │   │   └── health/route.ts                # Health check
│   │   │
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Redirect to /dashboard or /login
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── layout/                    # Sidebar, TopNav, CommandPalette (existing)
│   │   ├── ui/                        # shadcn/ui components (existing)
│   │   ├── shared/                    # PageHeader, EmptyState, DataTable, FormDialog
│   │   │   ├── page-header.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── data-table.tsx         # Generic data table with sort/filter/pagination
│   │   │   ├── data-table-toolbar.tsx
│   │   │   ├── data-table-pagination.tsx
│   │   │   ├── form-dialog.tsx        # Generic create/edit dialog
│   │   │   ├── confirm-dialog.tsx     # Delete/action confirmation
│   │   │   ├── status-badge.tsx       # Reusable status indicator
│   │   │   ├── approval-actions.tsx   # Approve/Reject buttons with workflow
│   │   │   ├── file-upload.tsx        # File upload component
│   │   │   ├── export-button.tsx      # CSV/Excel/PDF export
│   │   │   └── filter-bar.tsx         # Generic filter component
│   │   ├── dashboard/
│   │   ├── finance/
│   │   ├── budget/
│   │   ├── donors/
│   │   ├── projects/
│   │   ├── beneficiaries/
│   │   ├── procurement/
│   │   ├── assets/
│   │   ├── hr/
│   │   ├── microfinance/
│   │   ├── reports/
│   │   └── settings/
│   │
│   ├── lib/
│   │   ├── db.ts                      # Prisma client singleton
│   │   ├── utils.ts                   # cn() utility (existing)
│   │   ├── formatters.ts              # BDT, date formatters (existing)
│   │   ├── api-response.ts            # Standardized API response helpers
│   │   ├── api-error.ts               # Custom error classes
│   │   ├── pagination.ts              # Pagination helper
│   │   ├── number-sequence.ts         # Auto-number generator
│   │   ├── approval-engine.ts         # Approval workflow engine
│   │   ├── notification.ts            # Notification dispatcher
│   │   ├── export.ts                  # CSV/Excel/PDF export utilities
│   │   │
│   │   ├── auth/                      # Auth system (custom JWT, adopted from LMS)
│   │   │   ├── jwt.ts                 # JWT sign/verify with jose
│   │   │   ├── password.ts            # bcryptjs hash/verify
│   │   │   ├── session.ts             # getCurrentUser, getOrganizationId, requireRole
│   │   │   ├── super-admin-auth.ts    # Super admin auth + audit logging
│   │   │   └── impersonation.ts       # Start/end impersonation sessions
│   │   │
│   │   ├── middleware/                # Guards & middleware (adopted from LMS)
│   │   │   ├── auth-guard.ts          # JWT validation + tenant context injection
│   │   │   ├── subscription-guard.ts  # FULL/READ_ONLY/BLOCKED access control
│   │   │   ├── permission-guard.ts    # RBAC permission check
│   │   │   └── audit-middleware.ts    # Auto-log CUD actions
│   │   │
│   │   ├── storage/                   # File storage adapter pattern (adopted from LMS)
│   │   │   ├── storage-adapter.ts     # Interface definition
│   │   │   ├── storage-factory.ts     # Creates adapter from MediaSetting config
│   │   │   ├── storage-service.ts     # Business logic (quota, namespace, upload)
│   │   │   └── adapters/
│   │   │       ├── local-storage.ts   # Dev: ./storage/{orgId}/...
│   │   │       └── r2-storage.ts      # Prod: Cloudflare R2 (@aws-sdk/client-s3)
│   │   │
│   │   ├── payment/                   # Payment gateway factory (adopted from LMS)
│   │   │   ├── gateway-factory.ts     # Creates gateway from config
│   │   │   ├── gateway-interface.ts   # Common interface
│   │   │   └── gateways/
│   │   │       ├── sslcommerz.ts      # SSLCommerz (BD standard)
│   │   │       ├── bkash.ts           # bKash mobile payment
│   │   │       ├── stripe.ts          # Stripe (international)
│   │   │       └── mock.ts            # Dev/testing
│   │   │
│   │   ├── validators/                # Zod validation schemas
│   │   │   ├── auth.ts
│   │   │   ├── finance.ts
│   │   │   ├── budget.ts
│   │   │   ├── donor.ts
│   │   │   ├── project.ts
│   │   │   ├── beneficiary.ts
│   │   │   ├── procurement.ts
│   │   │   ├── asset.ts
│   │   │   ├── hr.ts
│   │   │   ├── microfinance.ts
│   │   │   └── settings.ts
│   │   │
│   │   └── services/                  # Business logic layer
│   │       ├── finance.service.ts
│   │       ├── budget.service.ts
│   │       ├── donor.service.ts
│   │       ├── project.service.ts
│   │       ├── beneficiary.service.ts
│   │       ├── procurement.service.ts
│   │       ├── asset.service.ts
│   │       ├── hr.service.ts
│   │       ├── microfinance.service.ts
│   │       ├── report.service.ts
│   │       ├── settings.service.ts
│   │       ├── billing-cycle.service.ts     # SaaS billing cycle management
│   │       ├── storage-quota.service.ts     # Storage/bandwidth quota enforcement
│   │       ├── webhook.service.ts           # Webhook dispatch
│   │       └── data-retention.service.ts    # GDPR data retention/export
│   │
│   ├── types/
│   │   └── index.ts                   # All TypeScript interfaces/types
│   │
│   ├── hooks/
│   │   ├── use-mobile.ts              # (existing)
│   │   ├── use-api.ts                 # Generic API fetch hook (SWR/React Query)
│   │   ├── use-pagination.ts
│   │   ├── use-debounce.ts
│   │   ├── use-permissions.ts         # RBAC check hook
│   │   └── use-subscription.ts        # Subscription status check hook
│   │
│   └── data/
│       ├── navigation.ts             # (existing)
│       └── dashboard.ts              # (existing, will be replaced by API)
│
├── public/
├── CLAUDE.md
├── IMPLEMENTATION_PLAN.md
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

---

## 3. Menu Structure

4 groups, 12 modules, 97 menu items.

| Group | Color | Modules |
|-------|-------|---------|
| **CORE** | Blue | Dashboard (3), Finance & Accounting (7 + 6 sub-items under Daily Expenses), Budget Management (7) |
| **PROGRAMS** | Green | Donor & Grant (6), Project Management (8), Beneficiary Management (5) |
| **OPERATIONS** | Amber | Procurement & Supply Chain (8), Fixed Assets (6), Human Resources (16), Microfinance (8) |
| **SYSTEM** | Slate | Reports & Analytics (8), Settings & Administration (7) |

*(Menu routes are defined in `src/data/navigation.ts`)*

---

## 4. Database Schema (Prisma 7.x)

### 4.1 Enums

```prisma
// ─── base.prisma ───

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ═══════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════

enum UserStatus {
  ACTIVE
  INACTIVE
  LOCKED
  PENDING
}

enum ApprovalStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
  CANCELLED
}

enum VoucherType {
  DEBIT       // DV - Payment
  RECEIPT     // RV - Receipt
  CASH        // CV - Cash
  BANK        // BV - Bank
  JOURNAL     // JV - Journal
  CONTRA      // Contra
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  INCOME
  EXPENSE
}

enum AccountNature {
  DEBIT
  CREDIT
}

enum CurrencyCode {
  BDT
  USD
  EUR
  GBP
}

enum BankAccountType {
  CURRENT
  SAVINGS
  FIXED_DEPOSIT
  MOBILE_BANKING
  CASH
}

enum ReconciliationStatus {
  PENDING
  RECONCILED
  DISCREPANCY
}

enum BudgetStatus {
  DRAFT
  SUBMITTED
  APPROVED
  ACTIVE
  CLOSED
  REVISED
}

enum DonorType {
  BILATERAL
  MULTILATERAL
  FOUNDATION
  CORPORATE
  INDIVIDUAL
  GOVERNMENT
  INGO
}

enum GrantStatus {
  PIPELINE
  PROPOSAL
  NEGOTIATION
  ACTIVE
  SUSPENDED
  COMPLETED
  CLOSED
}

enum GrantLifecycleStage {
  IDENTIFICATION
  PROPOSAL
  NEGOTIATION
  AGREEMENT
  IMPLEMENTATION
  CLOSEOUT
}

enum FundReceiptStatus {
  PENDING
  RECEIVED
  CONFIRMED
}

enum ProjectStatus {
  PIPELINE
  ACTIVE
  ON_HOLD
  COMPLETED
  CLOSED
  CANCELLED
}

enum ActivityStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  DELAYED
  CANCELLED
}

enum MilestoneStatus {
  ON_TRACK
  ACHIEVED
  AT_RISK
  OVERDUE
  CANCELLED
}

enum LogFrameLevel {
  GOAL
  PURPOSE
  OUTPUT
  ACTIVITY
}

enum CloseoutItemStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum ProjectType {
  HUMANITARIAN
  DEVELOPMENT
  ADVOCACY
  CAPACITY_BUILDING
  RESEARCH
  EMERGENCY_RESPONSE
  CORE_OPERATIONS
  MULTI_COUNTRY
}

enum ProjectSector {
  WASH
  EDUCATION
  HEALTH
  LIVELIHOODS
  FOOD_SECURITY
  PROTECTION
  SHELTER
  NUTRITION
  AGRICULTURE
  CLIMATE_ADAPTATION
  GOVERNANCE
  GENDER_EQUALITY
  DISASTER_RISK_REDUCTION
  MULTI_SECTOR
  OTHER
}

enum RiskLikelihood {
  VERY_LOW
  LOW
  MEDIUM
  HIGH
  VERY_HIGH
}

enum RiskImpact {
  NEGLIGIBLE
  MINOR
  MODERATE
  MAJOR
  CRITICAL
}

enum RiskCategory {
  FINANCIAL
  OPERATIONAL
  SECURITY
  POLITICAL
  ENVIRONMENTAL
  REPUTATIONAL
  COMPLIANCE
  TECHNICAL
}

enum IndicatorType {
  QUANTITATIVE
  QUALITATIVE
}

enum IndicatorFrequency {
  MONTHLY
  QUARTERLY
  SEMI_ANNUALLY
  ANNUALLY
  END_OF_PROJECT
}

enum BeneficiaryStatus {
  ACTIVE
  GRADUATED
  INACTIVE
  DECEASED
}

enum EnrollmentStatus {
  ACTIVE
  GRADUATED
  DROPPED_OUT
  WAITLISTED
  SUSPENDED
}

enum ServiceDeliveryStatus {
  SCHEDULED
  DELIVERED
  CANCELLED
  NO_SHOW
}

enum GrievanceSeverity {
  HIGH
  MEDIUM
  LOW
}

enum GrievanceCategory {
  SERVICE_QUALITY
  STAFF_BEHAVIOR
  ELIGIBILITY
  DELAY
  CORRUPTION
  OTHER
}

enum GrievanceStatus {
  OPEN
  UNDER_INVESTIGATION
  RESOLVED
  CLOSED
}

enum PRPriority {
  URGENT
  HIGH
  NORMAL
  LOW
}

enum PRStatus {
  DRAFT
  SUBMITTED
  REVIEWED
  APPROVED
  REJECTED
  PO_CREATED
}

enum POStatus {
  DRAFT
  ISSUED
  PARTIALLY_RECEIVED
  COMPLETED
  CANCELLED
}

enum TenderStatus {
  DRAFT
  OPEN
  EVALUATION
  AWARDED
  CANCELLED
}

enum ContractType {
  SUPPLY
  SERVICE
  WORKS
  CONSULTANCY
}

enum ContractStatus {
  DRAFT
  ACTIVE
  EXPIRED
  UNDER_RENEWAL
  TERMINATED
}

enum StockStatus {
  IN_STOCK
  LOW_STOCK
  OUT_OF_STOCK
}

enum GRNStatus {
  PENDING_INSPECTION
  ACCEPTED
  REJECTED
  PARTIAL
}

enum DepreciationMethod {
  STRAIGHT_LINE
  DECLINING_BALANCE
}

enum AssetCondition {
  NEW
  GOOD
  FAIR
  POOR
  DAMAGED
  DISPOSED
}

enum AssetTransferStatus {
  PENDING_APPROVAL
  APPROVED
  IN_TRANSIT
  COMPLETED
  REJECTED
}

enum MaintenanceType {
  PREVENTIVE
  CORRECTIVE
  EMERGENCY
}

enum DisposalMethod {
  SALE
  AUCTION
  SCRAP
  DONATION
  WRITE_OFF
}

enum EmploymentType {
  FULL_TIME
  CONTRACT
  CONSULTANT
  INTERN
  VOLUNTEER
}

enum EmployeeStatus {
  ACTIVE
  ON_LEAVE
  PROBATION
  RESIGNED
  TERMINATED
  RETIRED
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  HALF_DAY
  ON_LEAVE
  HOLIDAY
  WEEKEND
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum PayrollRunStatus {
  DRAFT
  PROCESSING
  PROCESSED
  APPROVED
  PAID
  CANCELLED
}

enum PerformanceRating {
  OUTSTANDING
  EXCEEDS_EXPECTATIONS
  MEETS_EXPECTATIONS
  BELOW_EXPECTATIONS
  UNSATISFACTORY
}

enum TrainingType {
  INTERNAL
  EXTERNAL
  ONLINE
}

enum TrainingStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum SamityStatus {
  NEW
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum LoanCategory {
  INCOME_GENERATING
  AGRICULTURE
  EDUCATION
  HOUSING
  EMERGENCY
  SEASONAL
  ENTERPRISE
}

enum RepaymentFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
}

enum InterestMethod {
  FLAT
  DECLINING_BALANCE
}

enum LoanAppStatus {
  SUBMITTED
  UNDER_REVIEW
  RECOMMENDED
  APPROVED
  REJECTED
  DISBURSED
}

enum LoanAccountStatus {
  PENDING_DISBURSEMENT
  ACTIVE
  CLOSED
  WRITTEN_OFF
  RESTRUCTURED
}

enum DisbursementMode {
  CASH
  BANK
  MOBILE_BANKING
}

enum DisbursementStatus {
  SCHEDULED
  DISBURSED
  ON_HOLD
  CANCELLED
}

enum CollectionStatus {
  COMPLETED
  PARTIAL
  MISSED
}

enum SavingsType {
  COMPULSORY
  VOLUNTARY
  FIXED_DEPOSIT
  DPS
}

enum LoanClassification {
  REGULAR
  WATCH
  SUBSTANDARD
  DOUBTFUL
  BAD
}

enum NotificationType {
  APPROVAL_REQUEST
  APPROVAL_COMPLETED
  DEADLINE_REMINDER
  BUDGET_ALERT
  SYSTEM_ALERT
  HR_NOTIFICATION
  REPORT_DUE
}

enum NotificationChannel {
  IN_APP
  EMAIL
  SMS
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  APPROVE
  REJECT
  EXPORT
  IMPORT
}

enum DonorReportType {
  FINANCIAL
  NARRATIVE
  PROGRESS
  AUDIT
  FUND_UTILIZATION
  EXPENDITURE_STATEMENT
}

enum DonorReportStatus {
  DRAFT
  UNDER_REVIEW
  SUBMITTED
  ACCEPTED
  REVISION_REQUIRED
}
```

### 4.2 Auth & Organization Models

```prisma
// ─── auth.prisma ───

model User {
  id                String       @id @default(uuid()) @db.Uuid
  organizationId    String       @db.Uuid  // ← TENANT SCOPE
  email             String
  passwordHash      String
  fullName          String
  phone             String?
  avatar            String?
  roleId            String       @db.Uuid
  departmentId      String?      @db.Uuid
  status            UserStatus   @default(ACTIVE)
  lastLoginAt       DateTime?
  lastLoginIp       String?
  failedLoginCount  Int          @default(0)
  lockedUntil       DateTime?
  mustChangePassword Boolean     @default(true)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  deletedAt         DateTime?

  organization      Organization @relation(fields: [organizationId], references: [id])
  role              Role         @relation(fields: [roleId], references: [id])
  department        Department?  @relation(fields: [departmentId], references: [id])
  employee          Employee?

  // Relations as actor
  createdVouchers      Voucher[]          @relation("VoucherPreparedBy")
  approvedVouchers     Voucher[]          @relation("VoucherApprovedBy")
  createdJournalEntries JournalEntry[]    @relation("JECreatedBy")
  notifications        Notification[]
  notificationSettings NotificationSetting[]
  refreshTokens        RefreshToken[]
  auditLogs            TenantAuditLog[]

  @@unique([organizationId, email])  // Email unique per org (same person can be in multiple orgs)
  @@index([organizationId])
  @@index([roleId])
  @@index([status])
}

model RefreshToken {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @db.Uuid
  token       String    @unique
  ipAddress   String?
  userAgent   String?
  isRevoked   Boolean   @default(false)
  revokedAt   DateTime?
  expiresAt   DateTime
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
}

model Role {
  id              String           @id @default(uuid()) @db.Uuid
  organizationId  String           @db.Uuid  // ← TENANT SCOPE
  name            String
  description     String?
  isSystem        Boolean          @default(false) // System roles can't be deleted
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  organization    Organization     @relation(fields: [organizationId], references: [id])
  users           User[]
  permissions     RolePermission[]

  @@unique([organizationId, name])  // Role name unique per org
  @@index([organizationId])
}

model Permission {
  id          String           @id @default(uuid()) @db.Uuid
  module      String           // e.g., "finance", "hr", "procurement"
  action      String           // e.g., "read", "create", "update", "delete", "approve", "export"
  resource    String           // e.g., "vouchers", "employees", "purchase-orders"
  description String?

  roles       RolePermission[]

  @@unique([module, action, resource])
}

model RolePermission {
  roleId       String     @db.Uuid
  permissionId String     @db.Uuid

  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}
```

```prisma
// ─── organization.prisma ───

// ═══════════════════════════════════════════
// SaaS & MULTI-TENANCY
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// SaaS PLATFORM (Global — NOT tenant-scoped)
// Adopted from LMS project patterns
// ═══════════════════════════════════════════

// ─── Super Admin ───

model SuperAdmin {
  id            String   @id @default(uuid()) @db.Uuid
  email         String   @unique
  passwordHash  String
  fullName      String
  phone         String?
  isActive      Boolean  @default(true)
  lastLoginAt   DateTime?
  lastLoginIp   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  auditLogs     SuperAdminAuditLog[]
  impersonations ImpersonationSession[]
}

model SuperAdminAuditLog {
  id            String   @id @default(uuid()) @db.Uuid
  superAdminId  String   @db.Uuid
  action        String   // CREATE_TENANT, SUSPEND_TENANT, UPDATE_PLAN, IMPERSONATE, UPDATE_MEDIA_SETTINGS, etc.
  entityType    String?  // "Organization", "SubscriptionPlan", "MediaSetting"
  entityId      String?  @db.Uuid
  details       Json?    // Action-specific details
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())

  superAdmin    SuperAdmin @relation(fields: [superAdminId], references: [id])

  @@index([superAdminId])
  @@index([action])
  @@index([createdAt])
}

model ImpersonationSession {
  id            String    @id @default(uuid()) @db.Uuid
  superAdminId  String    @db.Uuid
  organizationId String   @db.Uuid
  targetUserId  String    @db.Uuid
  targetRole    String
  expiresAt     DateTime
  endedAt       DateTime?
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime  @default(now())

  superAdmin    SuperAdmin @relation(fields: [superAdminId], references: [id])

  @@index([superAdminId])
  @@index([organizationId])
}

// ─── Media Settings (Global — Super Admin configured) ───

model MediaSetting {
  id                 String   @id @default(uuid()) @db.Uuid
  provider           String   @default("cloudflare_r2") // "cloudflare_r2", "aws_s3", "local"
  bucketName         String   // e.g., "ngo-erp-media"
  region             String?  // e.g., "auto" for R2, "us-east-1" for S3
  endpoint           String   // R2: "https://<account_id>.r2.cloudflarestorage.com"
  accessKeyId        String   // Encrypted at rest
  secretAccessKey    String   // Encrypted at rest
  publicUrl          String?  // CDN URL for public access (e.g., R2 custom domain)
  maxFileSizeMb      Int      @default(50) // Max upload size per file
  allowedMimeTypes   String   @default("image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv")
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

// File key in R2: {organizationId}/{module}/{year}/{month}/{uuid}-{originalName}
// Example: "a1b2c3d4/finance/2026/03/f5e6d7c8-invoice.pdf"

// ─── Subscription Plans & Features ───

model SubscriptionPlan {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @unique  // "Free", "Starter", "Professional", "Enterprise"
  description     String?
  priceMonthly    Decimal  @db.Decimal(10, 2)
  priceQuarterly  Decimal? @db.Decimal(10, 2) // 5% discount
  priceYearly     Decimal? @db.Decimal(10, 2) // ~17% discount
  maxUsers        Int      // -1 = unlimited
  maxProjects     Int
  maxBeneficiaries Int
  storageGb       Int      @default(5) // Storage quota in GB
  bandwidthGb     Int      @default(50) // Monthly bandwidth in GB
  trialDays       Int      @default(14)
  isActive        Boolean  @default(true)
  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  features        PlanFeature[]
  subscriptions   TenantSubscription[]
}

model PlatformFeature {
  id              String   @id @default(uuid()) @db.Uuid
  code            String   @unique  // "MICROFINANCE", "CUSTOM_REPORTS", "API_ACCESS", "MULTI_CURRENCY", "ETENDERING", "ADVANCED_HR", "MRA_REPORTS"
  name            String
  description     String?
  module          String?  // Which module this feature belongs to
  isQuantifiable  Boolean  @default(false)  // true = has numeric limits
  defaultLimit    Int?     // Default limit if quantifiable
  isBeta          Boolean  @default(false)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())

  plans           PlanFeature[]
}

model PlanFeature {
  id          String           @id @default(uuid()) @db.Uuid
  planId      String           @db.Uuid
  featureId   String           @db.Uuid
  limit       Int?             // Override limit for this plan (null = unlimited)
  config      Json?            // Feature-specific config per plan

  plan        SubscriptionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  feature     PlatformFeature  @relation(fields: [featureId], references: [id])

  @@unique([planId, featureId])
}

// ─── Tenant Subscription (per Organization) ───

model TenantSubscription {
  id                   String   @id @default(uuid()) @db.Uuid
  organizationId       String   @unique @db.Uuid
  planId               String   @db.Uuid
  status               String   @default("TRIAL") // ACTIVE, TRIAL, PAST_DUE, EXPIRED, PAUSED, CANCELLED
  billingCycle         String   @default("MONTHLY") // MONTHLY, QUARTERLY, YEARLY

  // Period
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime

  // Trial
  trialStart           DateTime?
  trialEnd             DateTime?

  // Grace period (PAST_DUE state)
  graceStartDate       DateTime?
  graceDays            Int      @default(7) // Days before PAST_DUE → EXPIRED

  // Pause functionality
  pausedAt             DateTime?
  pausedUntil          DateTime? // Auto-resume date
  totalPauseDaysUsed   Int       @default(0)

  // Scheduled plan change (applied at period end)
  scheduledPlanId      String?   @db.Uuid
  scheduledChangeDate  DateTime?
  scheduledChangeType  String?   // "UPGRADE", "DOWNGRADE", "BILLING_CYCLE_CHANGE"

  // Payment
  lastPaymentDate      DateTime?
  nextPaymentDate      DateTime?

  cancelledAt          DateTime?
  cancellationReason   String?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  organization         Organization     @relation(fields: [organizationId], references: [id])
  plan                 SubscriptionPlan @relation(fields: [planId], references: [id])
  invoices             TenantInvoice[]

  @@index([organizationId])
  @@index([status])
  @@index([nextPaymentDate])
}

// ─── SaaS Billing ───

model TenantInvoice {
  id                String   @id @default(uuid()) @db.Uuid
  invoiceNo         String   @unique
  subscriptionId    String   @db.Uuid
  organizationId    String   @db.Uuid
  amount            Decimal  @db.Decimal(10, 2)
  tax               Decimal  @default(0) @db.Decimal(10, 2)
  total             Decimal  @db.Decimal(10, 2)
  currencyCode      String   @default("BDT")
  description       String?
  periodStart       DateTime
  periodEnd         DateTime
  dueDate           DateTime
  paidAt            DateTime?
  status            String   @default("PENDING") // PENDING, PAID, OVERDUE, CANCELLED, REFUNDED
  paymentMethod     String?  // "sslcommerz", "bkash", "stripe", "bank_transfer"
  transactionRef    String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  subscription      TenantSubscription @relation(fields: [subscriptionId], references: [id])
  payments          PaymentTransaction[]

  @@index([organizationId])
  @@index([status])
  @@index([dueDate])
}

model PaymentTransaction {
  id                String   @id @default(uuid()) @db.Uuid
  invoiceId         String   @db.Uuid
  gateway           String   // "sslcommerz", "bkash", "stripe", "bank_transfer", "mock"
  transactionId     String?  // Gateway's transaction ID
  amount            Decimal  @db.Decimal(10, 2)
  currency          String   @default("BDT")
  status            String   // "INITIATED", "SUCCESS", "FAILED", "REFUNDED"
  gatewayResponse   Json?    // Raw response from gateway
  ipAddress         String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  invoice           TenantInvoice @relation(fields: [invoiceId], references: [id])

  @@index([invoiceId])
  @@index([gateway])
  @@index([status])
}

model Organization {
  id                 String   @id @default(uuid()) @db.Uuid
  name               String
  slug               String   @unique  // URL-friendly: "shapla-foundation" → shapla-foundation.ngoerp.com
  customDomain       String?  @unique  // Tenant's own domain: "erp.shaplango.org"
  domainVerified     Boolean  @default(false) // DNS verification status
  localizedName      Json?    // e.g. { "en": "Shapla Foundation", "bn": "শাপলা ফাউন্ডেশন" }
  registrationNo     String?
  ngoabLicenseNo     String?
  mraLicenseNo       String?
  vatRegistrationNo  String?
  tin                String?  // Tax Identification Number
  address            String?
  district           String?
  phone              String?
  email              String?
  website            String?
  logo               String?
  baseCurrency       CurrencyCode @default(BDT)
  fiscalYearStartMonth Int    @default(7)  // July = 7
  dateFormat         String   @default("DD/MM/YYYY")
  numberFormat       String   @default("BD") // BD = 1,00,000
  timezone           String   @default("Asia/Dhaka")
  isActive           Boolean  @default(true)

  // Storage & bandwidth tracking (adopted from LMS)
  storageUsedBytes       BigInt   @default(0)
  storageWarning80Sent   Boolean  @default(false)
  storageWarning90Sent   Boolean  @default(false)
  bandwidthUsedBytes     BigInt   @default(0)
  bandwidthPeriodStart   DateTime?
  bandwidthPeriodEnd     DateTime?
  bandwidthWarning80Sent Boolean  @default(false)
  bandwidthWarning90Sent Boolean  @default(false)

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  // All tenant-scoped data
  subscription       TenantSubscription?
  users              User[]
  fiscalYears        FiscalYear[]
  roles              Role[]
  accounts           Account[]
  bankAccounts       BankAccount[]
  donors             Donor[]
  grants             Grant[]
  projects           Project[]
  employees          Employee[]
  departments        Department[]
  beneficiaries      Beneficiary[]
  vendors            Vendor[]
  warehouses         Warehouse[]
  assetCategories    AssetCategory[]
  branches           Branch[]
  numberSequences    NumberSequence[]
  systemConfigs      SystemConfig[]

  @@index([slug])
}

model FiscalYear {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @db.Uuid  // ← TENANT SCOPE
  name           String   // e.g., "FY 2025-2026"
  startDate      DateTime
  endDate        DateTime
  isCurrent      Boolean  @default(false)
  isClosed       Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  fiscalPeriods  FiscalPeriod[]
  budgets        Budget[]
  journalEntries JournalEntry[]

  @@index([organizationId, isCurrent])
  @@index([organizationId])
}

model FiscalPeriod {
  id            String     @id @default(uuid()) @db.Uuid
  fiscalYearId  String     @db.Uuid
  name          String     // e.g., "July 2025", "August 2025"
  periodNumber  Int        // 1-12
  startDate     DateTime
  endDate       DateTime
  isClosed      Boolean    @default(false)
  createdAt     DateTime   @default(now())

  fiscalYear    FiscalYear @relation(fields: [fiscalYearId], references: [id])

  @@unique([fiscalYearId, periodNumber])
}

model Currency {
  id       String       @id @default(uuid()) @db.Uuid
  code     CurrencyCode @unique
  name     String
  symbol   String
  isBase   Boolean      @default(false)
  isActive Boolean      @default(true)

  exchangeRates ExchangeRate[]
}

model ExchangeRate {
  id          String       @id @default(uuid()) @db.Uuid
  currencyId  String       @db.Uuid
  rate        Decimal      @db.Decimal(18, 6) // Rate to base currency (BDT)
  effectiveDate DateTime
  createdAt   DateTime     @default(now())

  currency    Currency     @relation(fields: [currencyId], references: [id])

  @@index([currencyId, effectiveDate])
}

model SystemConfig {
  id              String @id @default(uuid()) @db.Uuid
  organizationId  String @db.Uuid  // ← TENANT SCOPE
  key             String
  value           String
  type            String @default("string") // string, number, boolean, json

  organization    Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, key])
  @@index([organizationId])
}

model NumberSequence {
  id              String @id @default(uuid()) @db.Uuid
  organizationId  String @db.Uuid  // ← TENANT SCOPE
  entity          String // e.g., "voucher_dv", "po", "pr", "grn", "journal_entry"
  prefix          String // e.g., "DV", "PO", "PR"
  separator       String @default("-")
  includeYear     Boolean @default(true)
  currentValue    Int    @default(0)
  padLength       Int    @default(3)  // e.g., 001, 002

  organization    Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, entity])
  @@index([organizationId])
}
```

### 4.3 Finance & Accounting Models

```prisma
// ─── finance.prisma ───

model Account {
  id              String        @id @default(uuid()) @db.Uuid
  organizationId  String        @db.Uuid  // ← TENANT SCOPE
  code            String        // e.g., "1000", "1100", "1101"
  name          String
  localizedName Json?         // e.g. { "en": "Current Assets", "bn": "চলতি সম্পদ" }
  type          AccountType
  nature        AccountNature
  parentId      String?       @db.Uuid
  level         Int           @default(1) // 1-5 hierarchy depth
  isGroup       Boolean       @default(false) // Group accounts can't have transactions
  description   String?
  isActive      Boolean       @default(true)
  isBankAccount Boolean       @default(false)
  fundCode      String?       // Donor-specific fund code
  projectId     String?       @db.Uuid  // Project-specific account
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?

  organization  Organization  @relation(fields: [organizationId], references: [id])
  parent        Account?      @relation("AccountHierarchy", fields: [parentId], references: [id])
  children      Account[]     @relation("AccountHierarchy")
  project       Project?      @relation(fields: [projectId], references: [id])

  journalLines  JournalEntryLine[]
  budgetLines   BudgetLine[]

  @@unique([organizationId, code])  // Code unique per org
  @@index([organizationId])
  @@index([type])
  @@index([parentId])
  @@index([projectId])
}

model JournalEntry {
  id             String         @id @default(uuid()) @db.Uuid
  entryNo        String         @unique
  date           DateTime
  description    String
  reference      String?       // External reference (voucher no, receipt no)
  fiscalYearId   String        @db.Uuid
  projectId      String?       @db.Uuid
  grantId        String?       @db.Uuid
  currencyCode   CurrencyCode  @default(BDT)
  exchangeRate   Decimal       @default(1) @db.Decimal(18, 6)
  totalDebit     Decimal       @db.Decimal(18, 2)
  totalCredit    Decimal       @db.Decimal(18, 2)
  status         ApprovalStatus @default(DRAFT)
  isAutoGenerated Boolean      @default(false)  // e.g., from depreciation, payroll
  sourceModule   String?       // e.g., "voucher", "payroll", "depreciation"
  sourceId       String?       @db.Uuid // ID of source record
  notes          String?
  createdById    String        @db.Uuid
  approvedById   String?       @db.Uuid
  approvedAt     DateTime?
  postedAt       DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?

  fiscalYear     FiscalYear    @relation(fields: [fiscalYearId], references: [id])
  project        Project?      @relation(fields: [projectId], references: [id])
  grant          Grant?        @relation(fields: [grantId], references: [id])
  createdBy      User          @relation("JECreatedBy", fields: [createdById], references: [id])

  lines          JournalEntryLine[]
  voucher        Voucher?      // 1:1 with voucher (optional)
  attachments    Attachment[]

  @@index([entryNo])
  @@index([date])
  @@index([status])
  @@index([projectId])
  @@index([grantId])
  @@index([fiscalYearId])
}

model JournalEntryLine {
  id              String       @id @default(uuid()) @db.Uuid
  journalEntryId  String       @db.Uuid
  accountId       String       @db.Uuid
  description     String?
  debit           Decimal      @default(0) @db.Decimal(18, 2)
  credit          Decimal      @default(0) @db.Decimal(18, 2)
  projectId       String?      @db.Uuid
  costCenterId    String?

  journalEntry    JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  account         Account      @relation(fields: [accountId], references: [id])

  @@index([journalEntryId])
  @@index([accountId])
}

model Voucher {
  id              String        @id @default(uuid()) @db.Uuid
  voucherNo       String        @unique
  type            VoucherType
  date            DateTime
  description     String
  amount          Decimal       @db.Decimal(18, 2)
  payee           String?       // For debit/payment vouchers
  projectId       String?       @db.Uuid
  grantId         String?       @db.Uuid
  bankAccountId   String?       @db.Uuid
  chequeNo        String?
  chequeDate      DateTime?
  journalEntryId  String?       @unique @db.Uuid  // Links to auto-created JE
  status          ApprovalStatus @default(DRAFT)
  preparedById    String        @db.Uuid
  approvedById    String?       @db.Uuid
  approvedAt      DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  project         Project?      @relation(fields: [projectId], references: [id])
  grant           Grant?        @relation(fields: [grantId], references: [id])
  bankAccount     BankAccount?  @relation(fields: [bankAccountId], references: [id])
  journalEntry    JournalEntry? @relation(fields: [journalEntryId], references: [id])
  preparedBy      User          @relation("VoucherPreparedBy", fields: [preparedById], references: [id])
  approvedBy      User?         @relation("VoucherApprovedBy", fields: [approvedById], references: [id])
  attachments     Attachment[]

  @@index([voucherNo])
  @@index([type])
  @@index([date])
  @@index([status])
  @@index([projectId])
}

model BankAccount {
  id              String          @id @default(uuid()) @db.Uuid
  organizationId  String          @db.Uuid  // ← TENANT SCOPE
  accountCode     String
  accountName   String
  type          BankAccountType
  bankName      String?
  branchName    String?
  accountNumber String?         // Masked in API responses
  routingNumber String?
  swiftCode     String?
  currencyCode  CurrencyCode    @default(BDT)
  isMotherAccount Boolean       @default(false) // NGOAB designated
  currentBalance Decimal        @default(0) @db.Decimal(18, 2)
  isActive      Boolean         @default(true)
  description   String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  organization  Organization    @relation(fields: [organizationId], references: [id])
  vouchers      Voucher[]
  fundReceipts  FundReceipt[]
  reconciliations BankReconciliation[]

  @@unique([organizationId, accountCode])
  @@index([organizationId])
  @@index([type])
  @@index([isMotherAccount])
}

model BankReconciliation {
  id              String              @id @default(uuid()) @db.Uuid
  bankAccountId   String              @db.Uuid
  periodStart     DateTime
  periodEnd       DateTime
  bookBalance     Decimal             @db.Decimal(18, 2)
  bankBalance     Decimal             @db.Decimal(18, 2)
  difference      Decimal             @db.Decimal(18, 2)
  status          ReconciliationStatus @default(PENDING)
  reconciledById  String?             @db.Uuid
  reconciledAt    DateTime?
  notes           String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  bankAccount     BankAccount         @relation(fields: [bankAccountId], references: [id])
  items           BankReconciliationItem[]

  @@index([bankAccountId])
  @@index([periodEnd])
}

model BankReconciliationItem {
  id                String             @id @default(uuid()) @db.Uuid
  reconciliationId  String             @db.Uuid
  date              DateTime
  description       String
  reference         String?
  bookAmount        Decimal?           @db.Decimal(18, 2)
  bankAmount        Decimal?           @db.Decimal(18, 2)
  isMatched         Boolean            @default(false)
  matchedJournalId  String?            @db.Uuid
  type              String             // "outstanding_cheque", "deposit_in_transit", "bank_charge", "interest", "error"

  reconciliation    BankReconciliation @relation(fields: [reconciliationId], references: [id], onDelete: Cascade)

  @@index([reconciliationId])
}
```

### 4.4 Budget Management Models

```prisma
// ─── budget.prisma ───

model Budget {
  id           String       @id @default(uuid()) @db.Uuid
  name         String
  projectId    String       @db.Uuid
  grantId      String?      @db.Uuid
  fiscalYearId String       @db.Uuid
  totalAmount  Decimal      @db.Decimal(18, 2)
  currencyCode CurrencyCode @default(BDT)
  status       BudgetStatus @default(DRAFT)
  approvedById String?      @db.Uuid
  approvedAt   DateTime?
  notes        String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  deletedAt    DateTime?

  project      Project      @relation(fields: [projectId], references: [id])
  grant        Grant?       @relation(fields: [grantId], references: [id])
  fiscalYear   FiscalYear   @relation(fields: [fiscalYearId], references: [id])

  lines        BudgetLine[]
  revisions    BudgetRevision[]

  @@index([projectId])
  @@index([grantId])
  @@index([status])
}

model BudgetLine {
  id           String   @id @default(uuid()) @db.Uuid
  budgetId     String   @db.Uuid
  accountId    String   @db.Uuid
  category     String   // "Personnel", "Operations", "Equipment", "Travel", "Training", "Admin", "M&E", "Contingency"
  description  String
  unit         String?  // e.g., "person", "month", "unit"
  quantity     Decimal  @default(1) @db.Decimal(10, 2)
  unitCost     Decimal  @db.Decimal(18, 2)
  totalAmount  Decimal  @db.Decimal(18, 2)
  notes        String?
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  budget       Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  account      Account  @relation(fields: [accountId], references: [id])

  revisionLines BudgetRevisionLine[]

  @@index([budgetId])
  @@index([accountId])
  @@index([category])
}

model BudgetRevision {
  id              String         @id @default(uuid()) @db.Uuid
  revisionNo      String         @unique
  budgetId        String         @db.Uuid
  date            DateTime       @default(now())
  originalTotal   Decimal        @db.Decimal(18, 2)
  revisedTotal    Decimal        @db.Decimal(18, 2)
  changeAmount    Decimal        @db.Decimal(18, 2)
  changePercent   Decimal        @db.Decimal(5, 2)
  reason          String
  status          ApprovalStatus @default(DRAFT)
  approvedById    String?        @db.Uuid
  approvedAt      DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  budget          Budget         @relation(fields: [budgetId], references: [id])
  lines           BudgetRevisionLine[]

  @@index([budgetId])
  @@index([status])
}

model BudgetRevisionLine {
  id               String         @id @default(uuid()) @db.Uuid
  revisionId       String         @db.Uuid
  budgetLineId     String         @db.Uuid
  originalAmount   Decimal        @db.Decimal(18, 2)
  revisedAmount    Decimal        @db.Decimal(18, 2)
  changeAmount     Decimal        @db.Decimal(18, 2)
  reason           String?

  revision         BudgetRevision @relation(fields: [revisionId], references: [id], onDelete: Cascade)
  budgetLine       BudgetLine     @relation(fields: [budgetLineId], references: [id])

  @@index([revisionId])
}

model CostAllocationRule {
  id           String    @id @default(uuid()) @db.Uuid
  name         String    // e.g., "Office Rent", "Utilities", "Admin Staff"
  description  String?
  totalAmount  Decimal   @db.Decimal(18, 2)
  isActive     Boolean   @default(true)
  frequency    String    @default("MONTHLY") // MONTHLY, QUARTERLY, ANNUALLY
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  entries      CostAllocationEntry[]
}

model CostAllocationEntry {
  id              String             @id @default(uuid()) @db.Uuid
  ruleId          String             @db.Uuid
  projectId       String             @db.Uuid
  percentage      Decimal            @db.Decimal(5, 2) // e.g., 30.00
  allocatedAmount Decimal            @db.Decimal(18, 2)
  periodStart     DateTime
  periodEnd       DateTime
  createdAt       DateTime           @default(now())

  rule            CostAllocationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  project         Project            @relation(fields: [projectId], references: [id])

  @@index([ruleId])
  @@index([projectId])
}
```

### 4.5 Donor & Grant Management Models

```prisma
// ─── donor.prisma ───

model Donor {
  id               String     @id @default(uuid()) @db.Uuid
  organizationId   String     @db.Uuid  // ← TENANT SCOPE
  name             String
  type             DonorType
  country          String?
  address          String?
  phone            String?
  email            String?
  website          String?
  description      String?
  relationshipStatus String?  // "Active", "Prospect", "Inactive"
  totalFunded      Decimal    @default(0) @db.Decimal(18, 2)
  isActive         Boolean    @default(true)
  notes            String?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  deletedAt        DateTime?

  organization     Organization @relation(fields: [organizationId], references: [id])
  contacts         DonorContact[]
  grants           Grant[]

  @@index([organizationId])
  @@index([type])
  @@index([name])
}

model DonorContact {
  id          String  @id @default(uuid()) @db.Uuid
  donorId     String  @db.Uuid
  name        String
  designation String?
  email       String?
  phone       String?
  isPrimary   Boolean @default(false)

  donor       Donor   @relation(fields: [donorId], references: [id], onDelete: Cascade)

  @@index([donorId])
}

model Grant {
  id              String        @id @default(uuid()) @db.Uuid
  grantNo         String        @unique // e.g., "GR-001"
  title           String
  donorId         String        @db.Uuid
  projectId       String?       @db.Uuid // Links to project when active
  awardAmount     Decimal       @db.Decimal(18, 2)
  disbursedAmount Decimal       @default(0) @db.Decimal(18, 2)
  currencyCode    CurrencyCode  @default(BDT)
  startDate       DateTime?
  endDate         DateTime?
  status          GrantStatus   @default(PIPELINE)
  lifecycleStage  GrantLifecycleStage @default(IDENTIFICATION)
  ngoabFdNo       String?       // NGOAB FD-1 reference number
  agreementRef    String?
  description     String?
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  donor           Donor         @relation(fields: [donorId], references: [id])
  project         Project?      @relation(fields: [projectId], references: [id])

  fundReceipts    FundReceipt[]
  fundRequisitions FundRequisition[]
  donorReports    DonorReport[]
  journalEntries  JournalEntry[]
  vouchers        Voucher[]
  budgets         Budget[]

  @@index([donorId])
  @@index([projectId])
  @@index([status])
}

model FundReceipt {
  id             String            @id @default(uuid()) @db.Uuid
  receiptNo      String            @unique
  date           DateTime
  donorId        String            @db.Uuid
  grantId        String            @db.Uuid
  amount         Decimal           @db.Decimal(18, 2)
  currencyCode   CurrencyCode      @default(BDT)
  exchangeRate   Decimal           @default(1) @db.Decimal(18, 6)
  amountInBDT    Decimal           @db.Decimal(18, 2)
  bankAccountId  String            @db.Uuid
  bankReference  String?
  status         FundReceiptStatus @default(PENDING)
  notes          String?
  journalEntryId String?           @db.Uuid // Auto-created JE
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  deletedAt      DateTime?

  grant          Grant             @relation(fields: [grantId], references: [id])
  bankAccount    BankAccount       @relation(fields: [bankAccountId], references: [id])
  attachments    Attachment[]

  @@index([grantId])
  @@index([date])
  @@index([status])
}

model FundRequisition {
  id             String         @id @default(uuid()) @db.Uuid
  requisitionNo  String         @unique
  date           DateTime
  grantId        String         @db.Uuid
  projectId      String         @db.Uuid
  amount         Decimal        @db.Decimal(18, 2)
  purpose        String
  requestedById  String         @db.Uuid
  status         ApprovalStatus @default(DRAFT)
  approvedById   String?        @db.Uuid
  approvedAt     DateTime?
  disbursedAt    DateTime?
  notes          String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  grant          Grant          @relation(fields: [grantId], references: [id])
  project        Project        @relation(fields: [projectId], references: [id])
  attachments    Attachment[]

  @@index([grantId])
  @@index([projectId])
  @@index([status])
}

model DonorReport {
  id            String           @id @default(uuid()) @db.Uuid
  reportNo      String           @unique
  type          DonorReportType
  grantId       String           @db.Uuid
  periodStart   DateTime
  periodEnd     DateTime
  dueDate       DateTime
  submittedDate DateTime?
  status        DonorReportStatus @default(DRAFT)
  preparedById  String?          @db.Uuid
  notes         String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  grant         Grant            @relation(fields: [grantId], references: [id])
  attachments   Attachment[]

  @@index([grantId])
  @@index([dueDate])
  @@index([status])
}
```

### 4.6 Project Management Models

```prisma
// ─── project.prisma ───

model Project {
  id              String        @id @default(uuid()) @db.Uuid
  organizationId  String        @db.Uuid  // ← TENANT SCOPE
  projectNo       String
  name            String
  description     String?
  projectType     ProjectType   @default(DEVELOPMENT)    // ← NEW: humanitarian, development, etc.
  sector          ProjectSector @default(OTHER)           // ← NEW: WASH, education, health, etc.
  donorId         String?       @db.Uuid
  startDate       DateTime?
  endDate         DateTime?
  totalBudget     Decimal       @default(0) @db.Decimal(18, 2)
  amountSpent     Decimal       @default(0) @db.Decimal(18, 2)
  currency        String        @default("USD")           // ← NEW: multi-currency
  country         String?                                 // ← NEW: e.g. "Kenya"
  region          String?                                 // ← NEW: e.g. "East Africa"
  location        String?                                 // specific location
  implementingPartner String?                             // ← NEW: partner org
  status          ProjectStatus @default(PIPELINE)
  progress        Int           @default(0) // 0-100
  managerId       String?       @db.Uuid // Project Manager (Employee)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  organization    Organization  @relation(fields: [organizationId], references: [id])
  grants          Grant[]
  accounts        Account[]
  budgets         Budget[]
  activities      Activity[]
  milestones      Milestone[]
  logFrameEntries LogFrameEntry[]
  closeout        ProjectCloseout?
  teamMembers     ProjectTeamMember[]
  documents       ProjectDocument[]
  indicators      ProjectIndicator[]    // ← NEW
  risks           ProjectRisk[]         // ← NEW
  vouchers        Voucher[]
  journalEntries  JournalEntry[]
  fundRequisitions FundRequisition[]
  costAllocations CostAllocationEntry[]
  enrollments     BeneficiaryEnrollment[]
  serviceDeliveries ServiceDelivery[]
  purchaseRequisitions PurchaseRequisition[]
  assets          Asset[]
  employeeAllocations EmployeeProjectAllocation[]

  @@unique([organizationId, projectNo])
  @@index([organizationId])
  @@index([status])
  @@index([donorId])
  @@index([projectType])
  @@index([sector])
}

model ProjectTeamMember {
  id          String   @id @default(uuid()) @db.Uuid
  projectId   String   @db.Uuid
  employeeId  String   @db.Uuid
  role        String?  // e.g., "Project Manager", "Field Coordinator"
  startDate   DateTime
  endDate     DateTime?
  allocation  Int      @default(100) // % time allocated
  isActive    Boolean  @default(true)

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  employee    Employee @relation(fields: [employeeId], references: [id])

  @@index([projectId])
  @@index([employeeId])
}

model Activity {
  id            String         @id @default(uuid()) @db.Uuid
  activityNo    String         @unique
  name          String
  description   String?
  projectId     String         @db.Uuid
  responsibleId String?        @db.Uuid // Employee
  startDate     DateTime?
  endDate       DateTime?
  budget        Decimal        @default(0) @db.Decimal(18, 2)
  actualCost    Decimal        @default(0) @db.Decimal(18, 2)
  progress      Int            @default(0) // 0-100
  status        ActivityStatus @default(PLANNED)
  parentId      String?        @db.Uuid // Sub-activities
  sortOrder     Int            @default(0)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  project       Project        @relation(fields: [projectId], references: [id])
  parent        Activity?      @relation("ActivityHierarchy", fields: [parentId], references: [id])
  children      Activity[]     @relation("ActivityHierarchy")

  @@index([projectId])
  @@index([status])
}

model Milestone {
  id            String          @id @default(uuid()) @db.Uuid
  milestoneNo   String          @unique
  description   String
  projectId     String          @db.Uuid
  targetDate    DateTime
  actualDate    DateTime?
  deliverable   String?
  status        MilestoneStatus @default(ON_TRACK)
  notes         String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  project       Project         @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@index([targetDate])
}

model LogFrameEntry {
  id            String        @id @default(uuid()) @db.Uuid
  projectId     String        @db.Uuid
  level         LogFrameLevel
  narrative     String        // Narrative Summary
  indicators    String?       // Objectively Verifiable Indicators
  meansOfVerification String? // Means of Verification
  assumptions   String?
  sortOrder     Int           @default(0)
  parentId      String?       @db.Uuid
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  project       Project       @relation(fields: [projectId], references: [id])
  parent        LogFrameEntry? @relation("LogFrameHierarchy", fields: [parentId], references: [id])
  children      LogFrameEntry[] @relation("LogFrameHierarchy")

  @@index([projectId])
}

model ProjectCloseout {
  id          String                @id @default(uuid()) @db.Uuid
  projectId   String                @unique @db.Uuid
  startDate   DateTime?
  completedAt DateTime?
  progress    Int                   @default(0) // 0-100
  notes       String?
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt

  project     Project               @relation(fields: [projectId], references: [id])
  items       ProjectCloseoutItem[]
}

model ProjectCloseoutItem {
  id          String             @id @default(uuid()) @db.Uuid
  closeoutId  String             @db.Uuid
  name        String             // e.g., "Final Financial Report", "Asset Disposition Plan"
  status      CloseoutItemStatus @default(NOT_STARTED)
  assigneeId  String?            @db.Uuid
  dueDate     DateTime?
  completedAt DateTime?
  notes       String?
  sortOrder   Int                @default(0)

  closeout    ProjectCloseout    @relation(fields: [closeoutId], references: [id], onDelete: Cascade)

  @@index([closeoutId])
}

model ProjectDocument {
  id          String   @id @default(uuid()) @db.Uuid
  projectId   String   @db.Uuid
  name        String
  description String?
  filePath    String
  fileSize    Int?
  mimeType    String?
  uploadedById String  @db.Uuid
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id])

  @@index([projectId])
}

// ── NEW: Results Framework Indicators ──

model ProjectIndicator {
  id              String             @id @default(uuid()) @db.Uuid
  projectId       String             @db.Uuid
  name            String
  description     String?
  type            IndicatorType      @default(QUANTITATIVE)
  unit            String?            // e.g., "households", "percentage", "people"
  baselineValue   Decimal?           @db.Decimal(18, 2)
  baselineDate    DateTime?
  targetValue     Decimal?           @db.Decimal(18, 2)
  currentValue    Decimal?           @db.Decimal(18, 2)
  frequency       IndicatorFrequency @default(QUARTERLY)
  dataSource      String?
  responsible     String?
  disaggregation  String?            // e.g., "gender, age, disability"
  sortOrder       Int                @default(0)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  project         Project            @relation(fields: [projectId], references: [id])

  @@index([projectId])
}

// ── NEW: Risk Register ──

model ProjectRisk {
  id              String         @id @default(uuid()) @db.Uuid
  projectId       String         @db.Uuid
  title           String
  description     String?
  category        RiskCategory   @default(OPERATIONAL)
  likelihood      RiskLikelihood @default(MEDIUM)
  impact          RiskImpact     @default(MODERATE)
  riskScore       Int            @default(0) // computed: likelihood × impact (1-25)
  mitigation      String?        // Mitigation strategy
  owner           String?        // Person responsible
  status          String         @default("OPEN") // OPEN, MITIGATED, CLOSED, MATERIALIZED
  reviewDate      DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  project         Project        @relation(fields: [projectId], references: [id])

  @@index([projectId])
}
```

### 4.7 Beneficiary Management Models

```prisma
// ─── beneficiary.prisma ───

model Beneficiary {
  id              String            @id @default(uuid()) @db.Uuid
  organizationId  String            @db.Uuid  // ← TENANT SCOPE
  beneficiaryNo   String
  name            String
  fatherSpouseName String?
  dateOfBirth     DateTime?
  age             Int?
  gender          String?           // "Male", "Female", "Other"
  nidNumber       String?           @unique
  phone           String?
  division        String?
  district        String?
  upazila         String?
  union           String?
  village         String?
  address         String?
  photo           String?           // File path
  status          BeneficiaryStatus @default(ACTIVE)
  notes           String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  deletedAt       DateTime?

  organization    Organization      @relation(fields: [organizationId], references: [id])
  enrollments     BeneficiaryEnrollment[]
  serviceDeliveries ServiceDelivery[]
  grievances      Grievance[]
  mfiMembers      MFIMember[]

  @@unique([organizationId, beneficiaryNo])
  @@unique([organizationId, nidNumber])  // NID unique per org
  @@index([organizationId])
  @@index([name])
  @@index([district])
  @@index([status])
}

model BeneficiaryEnrollment {
  id              String           @id @default(uuid()) @db.Uuid
  enrollmentNo    String           @unique
  beneficiaryId   String           @db.Uuid
  projectId       String           @db.Uuid
  programName     String
  enrollmentDate  DateTime
  graduationDate  DateTime?
  servicesAssigned String?         // JSON array of services
  status          EnrollmentStatus @default(ACTIVE)
  dropoutReason   String?
  notes           String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  beneficiary     Beneficiary      @relation(fields: [beneficiaryId], references: [id])
  project         Project          @relation(fields: [projectId], references: [id])

  @@index([beneficiaryId])
  @@index([projectId])
  @@index([status])
}

model ServiceDelivery {
  id              String                @id @default(uuid()) @db.Uuid
  serviceNo       String                @unique
  beneficiaryId   String                @db.Uuid
  projectId       String                @db.Uuid
  serviceType     String                // "Health Checkup", "Training", "Asset Distribution", "Cash Transfer", "Counseling"
  date            DateTime
  location        String?
  deliveredById   String?               @db.Uuid // Employee
  quantity        Decimal?              @db.Decimal(10, 2)
  value           Decimal?              @db.Decimal(18, 2)
  status          ServiceDeliveryStatus @default(DELIVERED)
  notes           String?
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  beneficiary     Beneficiary           @relation(fields: [beneficiaryId], references: [id])
  project         Project               @relation(fields: [projectId], references: [id])

  @@index([beneficiaryId])
  @@index([projectId])
  @@index([date])
}

model ImpactIndicator {
  id          String    @id @default(uuid()) @db.Uuid
  name        String    // e.g., "Access to Safe Water", "School Enrollment Rate"
  unit        String    // e.g., "%", "count", "BDT"
  category    String?   // e.g., "Health", "Education", "WASH"
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())

  assessments ImpactAssessment[]
}

model ImpactAssessment {
  id            String          @id @default(uuid()) @db.Uuid
  indicatorId   String          @db.Uuid
  projectId     String?         @db.Uuid
  baseline      Decimal         @db.Decimal(18, 2)
  target        Decimal         @db.Decimal(18, 2)
  currentValue  Decimal         @db.Decimal(18, 2)
  achievementPct Decimal        @db.Decimal(5, 2)
  dataSource    String?
  measurementDate DateTime
  notes         String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  indicator     ImpactIndicator @relation(fields: [indicatorId], references: [id])

  @@index([indicatorId])
  @@index([projectId])
}

model Grievance {
  id              String            @id @default(uuid()) @db.Uuid
  grievanceNo     String            @unique
  date            DateTime
  beneficiaryId   String?           @db.Uuid
  complainantName String
  category        GrievanceCategory
  description     String
  severity        GrievanceSeverity @default(MEDIUM)
  assignedToId    String?           @db.Uuid // Employee
  resolutionDate  DateTime?
  resolutionNotes String?
  status          GrievanceStatus   @default(OPEN)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  beneficiary     Beneficiary?      @relation(fields: [beneficiaryId], references: [id])

  @@index([beneficiaryId])
  @@index([status])
  @@index([severity])
}
```

### 4.8 Procurement & Inventory Models

```prisma
// ─── procurement.prisma ───

model Vendor {
  id              String    @id @default(uuid()) @db.Uuid
  organizationId  String    @db.Uuid  // ← TENANT SCOPE
  vendorNo        String
  companyName   String
  category      String?   // "IT", "Construction", "Office Supplies", "Consultancy"
  contactPerson String?
  phone         String?
  email         String?
  address       String?
  tin           String?   // Tax Identification Number
  tradeLicense  String?
  rating        Decimal   @default(0) @db.Decimal(3, 1) // 0.0 - 5.0
  totalOrders   Int       @default(0)
  isApproved    Boolean   @default(false)
  isActive      Boolean   @default(true)
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  organization    Organization @relation(fields: [organizationId], references: [id])
  purchaseOrders  PurchaseOrder[]
  tenderBids      TenderBid[]
  contracts       Contract[]
  vendorRatings   VendorRating[]
  goodsReceipts   GoodsReceipt[]

  @@unique([organizationId, vendorNo])
  @@index([organizationId])
  @@index([companyName])
  @@index([category])
}

model VendorRating {
  id          String   @id @default(uuid()) @db.Uuid
  vendorId    String   @db.Uuid
  poId        String?  @db.Uuid
  quality     Int      // 1-5
  delivery    Int      // 1-5
  pricing     Int      // 1-5
  communication Int    // 1-5
  overall     Decimal  @db.Decimal(3, 1)
  comments    String?
  ratedById   String   @db.Uuid
  createdAt   DateTime @default(now())

  vendor      Vendor   @relation(fields: [vendorId], references: [id])

  @@index([vendorId])
}

model PurchaseRequisition {
  id            String     @id @default(uuid()) @db.Uuid
  prNo          String     @unique
  date          DateTime
  requestedById String     @db.Uuid
  departmentId  String?    @db.Uuid
  projectId     String?    @db.Uuid
  priority      PRPriority @default(NORMAL)
  totalEstimate Decimal    @db.Decimal(18, 2)
  justification String?
  status        PRStatus   @default(DRAFT)
  approvedById  String?    @db.Uuid
  approvedAt    DateTime?
  linkedPOId    String?    @db.Uuid
  notes         String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  deletedAt     DateTime?

  project       Project?   @relation(fields: [projectId], references: [id])
  lines         PurchaseRequisitionLine[]
  attachments   Attachment[]

  @@index([prNo])
  @@index([status])
  @@index([projectId])
}

model PurchaseRequisitionLine {
  id            String              @id @default(uuid()) @db.Uuid
  prId          String              @db.Uuid
  description   String
  specification String?
  unit          String              // "pcs", "kg", "litre", "set"
  quantity      Decimal             @db.Decimal(10, 2)
  estimatedPrice Decimal            @db.Decimal(18, 2)
  totalEstimate Decimal             @db.Decimal(18, 2)
  sortOrder     Int                 @default(0)

  requisition   PurchaseRequisition @relation(fields: [prId], references: [id], onDelete: Cascade)
  poLines       PurchaseOrderLine[]

  @@index([prId])
}

model PurchaseOrder {
  id              String     @id @default(uuid()) @db.Uuid
  poNo            String     @unique
  date            DateTime
  vendorId        String     @db.Uuid
  deliveryDate    DateTime?
  totalAmount     Decimal    @db.Decimal(18, 2)
  paymentTerms    String?
  status          POStatus   @default(DRAFT)
  notes           String?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  deletedAt       DateTime?

  vendor          Vendor     @relation(fields: [vendorId], references: [id])
  lines           PurchaseOrderLine[]
  goodsReceipts   GoodsReceipt[]
  attachments     Attachment[]

  @@index([poNo])
  @@index([vendorId])
  @@index([status])
}

model PurchaseOrderLine {
  id             String                  @id @default(uuid()) @db.Uuid
  poId           String                  @db.Uuid
  prLineId       String?                 @db.Uuid // Traceability to PR
  description    String
  unit           String
  quantity       Decimal                 @db.Decimal(10, 2)
  unitPrice      Decimal                 @db.Decimal(18, 2)
  totalPrice     Decimal                 @db.Decimal(18, 2)
  receivedQty    Decimal                 @default(0) @db.Decimal(10, 2)
  sortOrder      Int                     @default(0)

  purchaseOrder  PurchaseOrder           @relation(fields: [poId], references: [id], onDelete: Cascade)
  prLine         PurchaseRequisitionLine? @relation(fields: [prLineId], references: [id])
  grnLines       GoodsReceiptLine[]

  @@index([poId])
}

model Tender {
  id              String       @id @default(uuid()) @db.Uuid
  tenderNo        String       @unique
  title           String
  category        String?      // "Supply", "Works", "Consultancy"
  description     String?
  estimatedValue  Decimal      @db.Decimal(18, 2)
  publicationDate DateTime
  closingDate     DateTime
  status          TenderStatus @default(DRAFT)
  awardedToId     String?      @db.Uuid // Vendor
  awardDate       DateTime?
  notes           String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  bids            TenderBid[]
  attachments     Attachment[]

  @@index([status])
  @@index([closingDate])
}

model TenderBid {
  id            String   @id @default(uuid()) @db.Uuid
  tenderId      String   @db.Uuid
  vendorId      String   @db.Uuid
  bidAmount     Decimal  @db.Decimal(18, 2)
  technicalScore Decimal? @db.Decimal(5, 2)
  financialScore Decimal? @db.Decimal(5, 2)
  combinedScore Decimal? @db.Decimal(5, 2)
  isWinner      Boolean  @default(false)
  notes         String?
  submittedAt   DateTime @default(now())

  tender        Tender   @relation(fields: [tenderId], references: [id])
  vendor        Vendor   @relation(fields: [vendorId], references: [id])
  attachments   Attachment[]

  @@index([tenderId])
  @@index([vendorId])
}

model Contract {
  id            String         @id @default(uuid()) @db.Uuid
  contractNo    String         @unique
  title         String
  vendorId      String         @db.Uuid
  type          ContractType
  startDate     DateTime
  endDate       DateTime
  value         Decimal        @db.Decimal(18, 2)
  status        ContractStatus @default(DRAFT)
  description   String?
  terms         String?
  renewalDate   DateTime?
  notes         String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?

  vendor        Vendor         @relation(fields: [vendorId], references: [id])
  attachments   Attachment[]

  @@index([vendorId])
  @@index([status])
  @@index([endDate])
}
```

```prisma
// ─── inventory.prisma ───

model Warehouse {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String   @db.Uuid  // ← TENANT SCOPE
  code            String
  name         String
  location     String
  capacity     Int?     // Total item capacity
  managerId    String?  @db.Uuid // Employee
  phone        String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  inventoryItems InventoryItem[]
  assets         Asset[]

  @@unique([organizationId, code])
  @@index([organizationId])
}

model InventoryItem {
  id            String      @id @default(uuid()) @db.Uuid
  itemCode      String      @unique
  name          String
  category      String?
  unit          String      // "pcs", "kg", "litre", etc.
  warehouseId   String      @db.Uuid
  stockInHand   Decimal     @default(0) @db.Decimal(10, 2)
  reorderLevel  Decimal     @default(0) @db.Decimal(10, 2)
  unitPrice     Decimal     @default(0) @db.Decimal(18, 2)
  totalValue    Decimal     @default(0) @db.Decimal(18, 2)
  status        StockStatus @default(IN_STOCK)
  donorFunded   Boolean     @default(false)
  donorId       String?     @db.Uuid
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  warehouse     Warehouse   @relation(fields: [warehouseId], references: [id])
  transactions  InventoryTransaction[]

  @@index([itemCode])
  @@index([warehouseId])
  @@index([status])
}

model InventoryTransaction {
  id              String        @id @default(uuid()) @db.Uuid
  itemId          String        @db.Uuid
  type            String        // "IN", "OUT", "TRANSFER", "ADJUSTMENT"
  quantity        Decimal       @db.Decimal(10, 2)
  balanceAfter    Decimal       @db.Decimal(10, 2)
  reference       String?       // GRN No, PO No, etc.
  referenceId     String?       @db.Uuid
  notes           String?
  transactedById  String        @db.Uuid
  createdAt       DateTime      @default(now())

  item            InventoryItem @relation(fields: [itemId], references: [id])

  @@index([itemId])
  @@index([type])
  @@index([createdAt])
}

model GoodsReceipt {
  id              String      @id @default(uuid()) @db.Uuid
  grnNo           String      @unique
  date            DateTime
  poId            String      @db.Uuid
  vendorId        String      @db.Uuid
  receivedById    String      @db.Uuid
  status          GRNStatus   @default(PENDING_INSPECTION)
  inspectionNotes String?
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  purchaseOrder   PurchaseOrder @relation(fields: [poId], references: [id])
  vendor          Vendor        @relation(fields: [vendorId], references: [id])
  lines           GoodsReceiptLine[]

  @@index([poId])
  @@index([grnNo])
}

model GoodsReceiptLine {
  id              String       @id @default(uuid()) @db.Uuid
  grnId           String       @db.Uuid
  poLineId        String       @db.Uuid
  description     String
  quantityOrdered Decimal      @db.Decimal(10, 2)
  quantityReceived Decimal     @db.Decimal(10, 2)
  quantityAccepted Decimal     @db.Decimal(10, 2)
  quantityRejected Decimal     @default(0) @db.Decimal(10, 2)
  rejectionReason String?

  goodsReceipt    GoodsReceipt      @relation(fields: [grnId], references: [id], onDelete: Cascade)
  poLine          PurchaseOrderLine  @relation(fields: [poLineId], references: [id])

  @@index([grnId])
}
```

### 4.9 Fixed Asset Models

```prisma
// ─── asset.prisma ───

model AssetCategory {
  id                 String             @id @default(uuid()) @db.Uuid
  organizationId     String             @db.Uuid  // ← TENANT SCOPE
  code               String
  name               String
  usefulLifeYears    Int
  depreciationMethod DepreciationMethod @default(STRAIGHT_LINE)
  depreciationRate   Decimal            @db.Decimal(5, 2) // Annual %
  isActive           Boolean            @default(true)
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  organization       Organization       @relation(fields: [organizationId], references: [id])
  assets             Asset[]

  @@unique([organizationId, code])
  @@index([organizationId])
}

model Asset {
  id                    String         @id @default(uuid()) @db.Uuid
  assetNo               String         @unique
  name                  String
  description           String?
  categoryId            String         @db.Uuid
  purchaseDate          DateTime
  purchasePrice         Decimal        @db.Decimal(18, 2)
  serialNumber          String?
  barcode               String?
  warehouseId           String?        @db.Uuid  // Current location
  custodianId           String?        @db.Uuid  // Employee
  projectId             String?        @db.Uuid  // Funded by which project
  donorId               String?        @db.Uuid  // Funded by which donor
  condition             AssetCondition @default(NEW)
  accumulatedDepreciation Decimal      @default(0) @db.Decimal(18, 2)
  netBookValue          Decimal        @db.Decimal(18, 2)
  insuranceInfo         String?
  warrantyExpiry        DateTime?
  isActive              Boolean        @default(true)
  disposedAt            DateTime?
  notes                 String?
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
  deletedAt             DateTime?

  category              AssetCategory  @relation(fields: [categoryId], references: [id])
  warehouse             Warehouse?     @relation(fields: [warehouseId], references: [id])
  project               Project?       @relation(fields: [projectId], references: [id])

  depreciationRecords   AssetDepreciation[]
  transfers             AssetTransfer[]
  maintenanceRecords    AssetMaintenance[]
  disposal              AssetDisposal?
  attachments           Attachment[]

  @@index([assetNo])
  @@index([categoryId])
  @@index([warehouseId])
  @@index([projectId])
  @@index([condition])
}

model AssetDepreciation {
  id                String   @id @default(uuid()) @db.Uuid
  assetId           String   @db.Uuid
  period            DateTime // Month/Year
  openingValue      Decimal  @db.Decimal(18, 2)
  depreciationAmount Decimal @db.Decimal(18, 2)
  closingValue      Decimal  @db.Decimal(18, 2)
  journalEntryId    String?  @db.Uuid // Auto-created JE
  createdAt         DateTime @default(now())

  asset             Asset    @relation(fields: [assetId], references: [id])

  @@index([assetId])
  @@index([period])
}

model AssetTransfer {
  id              String              @id @default(uuid()) @db.Uuid
  transferNo      String              @unique
  assetId         String              @db.Uuid
  date            DateTime
  fromLocation    String
  toLocation      String
  reason          String?
  transferredById String              @db.Uuid
  approvedById    String?             @db.Uuid
  status          AssetTransferStatus @default(PENDING_APPROVAL)
  receivedAt      DateTime?
  notes           String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  asset           Asset               @relation(fields: [assetId], references: [id])

  @@index([assetId])
  @@index([status])
}

model AssetMaintenance {
  id             String          @id @default(uuid()) @db.Uuid
  maintenanceNo  String          @unique
  assetId        String          @db.Uuid
  type           MaintenanceType
  description    String
  scheduledDate  DateTime
  completionDate DateTime?
  cost           Decimal         @default(0) @db.Decimal(18, 2)
  vendorName     String?
  status         String          @default("SCHEDULED") // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  notes          String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  asset          Asset           @relation(fields: [assetId], references: [id])

  @@index([assetId])
  @@index([scheduledDate])
}

model AssetDisposal {
  id               String        @id @default(uuid()) @db.Uuid
  disposalNo       String        @unique
  assetId          String        @unique @db.Uuid
  date             DateTime
  method           DisposalMethod
  originalValue    Decimal       @db.Decimal(18, 2)
  bookValueAtDisposal Decimal   @db.Decimal(18, 2)
  recoveryAmount   Decimal       @default(0) @db.Decimal(18, 2)
  buyerInfo        String?
  approvedById     String?       @db.Uuid
  approvedAt       DateTime?
  reason           String?
  journalEntryId   String?       @db.Uuid
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  asset            Asset         @relation(fields: [assetId], references: [id])

  @@index([assetId])
}
```

### 4.10 Human Resources Models

```prisma
// ─── hr.prisma ───

model Department {
  id              String       @id @default(uuid()) @db.Uuid
  organizationId  String       @db.Uuid  // ← TENANT SCOPE
  name            String
  code            String
  headId      String?      @db.Uuid  // Department head (Employee)
  parentId    String?      @db.Uuid  // For sub-departments
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  parent      Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentHierarchy")
  employees   Employee[]
  users       User[]

  @@unique([organizationId, name])
  @@unique([organizationId, code])
  @@index([organizationId])
}

model Designation {
  id        String     @id @default(uuid()) @db.Uuid
  title     String     @unique
  level     Int?       // Hierarchy level for org chart
  isActive  Boolean    @default(true)
  createdAt DateTime   @default(now())

  employees Employee[]
}

model Employee {
  id                String         @id @default(uuid()) @db.Uuid
  organizationId    String         @db.Uuid  // ← TENANT SCOPE
  employeeNo        String
  userId            String?        @unique @db.Uuid // Links to User for system access
  fullName          String
  localizedName     Json?          // e.g. { "en": "John Doe", "bn": "জন ডো" }
  fatherName        String?
  motherName        String?
  dateOfBirth       DateTime?
  gender            String?
  maritalStatus     String?
  nidNumber         String?        @unique
  passport          String?
  phone             String?
  email             String?
  emergencyContact  String?
  presentAddress    String?
  permanentAddress  String?
  photo             String?

  departmentId      String         @db.Uuid
  designationId     String         @db.Uuid
  employmentType    EmploymentType @default(FULL_TIME)
  joiningDate       DateTime
  confirmationDate  DateTime?
  endDate           DateTime?      // For contract employees
  reportingToId     String?        @db.Uuid // Manager
  status            EmployeeStatus @default(ACTIVE)

  // Salary info
  basicSalary       Decimal?       @db.Decimal(18, 2)
  bankAccountNo     String?
  bankName          String?
  tinNumber         String?

  notes             String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  deletedAt         DateTime?

  organization      Organization   @relation(fields: [organizationId], references: [id])
  user              User?          @relation(fields: [userId], references: [id])
  department        Department     @relation(fields: [departmentId], references: [id])
  designation       Designation    @relation(fields: [designationId], references: [id])
  reportingTo       Employee?      @relation("EmployeeReporting", fields: [reportingToId], references: [id])
  directReports     Employee[]     @relation("EmployeeReporting")

  documents         EmployeeDocument[]
  onboarding        OnboardingProgress[]
  attendance        Attendance[]
  leaveApplications LeaveApplication[]
  leaveBalances     LeaveBalance[]
  payrollEntries    PayrollEntry[]
  performanceReviews PerformanceReview[]
  trainingParticipations TrainingParticipant[]
  projectTeams      ProjectTeamMember[]
  projectAllocations EmployeeProjectAllocation[]

  @@unique([organizationId, employeeNo])
  @@index([organizationId])
  @@index([departmentId])
  @@index([status])
  @@index([employmentType])
}

model EmployeeDocument {
  id          String   @id @default(uuid()) @db.Uuid
  employeeId  String   @db.Uuid
  name        String
  type        String   // "NID", "Certificate", "Contract", "Photo", "Resume"
  filePath    String
  uploadedAt  DateTime @default(now())

  employee    Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
}

model EmployeeProjectAllocation {
  id          String   @id @default(uuid()) @db.Uuid
  employeeId  String   @db.Uuid
  projectId   String   @db.Uuid
  percentage  Decimal  @db.Decimal(5, 2) // % of salary charged to this project
  startDate   DateTime
  endDate     DateTime?
  isActive    Boolean  @default(true)

  employee    Employee @relation(fields: [employeeId], references: [id])
  project     Project  @relation(fields: [projectId], references: [id])

  @@index([employeeId])
  @@index([projectId])
}

model OnboardingChecklist {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  description String?
  isRequired  Boolean  @default(true)
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  progress    OnboardingProgress[]
}

model OnboardingProgress {
  id           String              @id @default(uuid()) @db.Uuid
  employeeId   String              @db.Uuid
  checklistId  String              @db.Uuid
  isCompleted  Boolean             @default(false)
  completedAt  DateTime?
  completedById String?            @db.Uuid
  notes        String?

  employee     Employee            @relation(fields: [employeeId], references: [id])
  checklist    OnboardingChecklist @relation(fields: [checklistId], references: [id])

  @@unique([employeeId, checklistId])
  @@index([employeeId])
}

model Attendance {
  id          String           @id @default(uuid()) @db.Uuid
  employeeId  String           @db.Uuid
  date        DateTime
  status      AttendanceStatus @default(PRESENT)
  checkIn     DateTime?
  checkOut    DateTime?
  otHours     Decimal          @default(0) @db.Decimal(4, 2)
  notes       String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  employee    Employee         @relation(fields: [employeeId], references: [id])

  @@unique([employeeId, date])
  @@index([employeeId])
  @@index([date])
}

model LeaveType {
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @unique // "Annual", "Casual", "Sick", "Maternity", "Paternity", "Without Pay"
  code            String   @unique
  daysPerYear     Int
  isCarryForward  Boolean  @default(false)
  maxCarryForward Int?
  isPaid          Boolean  @default(true)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())

  applications    LeaveApplication[]
  balances        LeaveBalance[]
}

model LeaveBalance {
  id            String    @id @default(uuid()) @db.Uuid
  employeeId    String    @db.Uuid
  leaveTypeId   String    @db.Uuid
  fiscalYearId  String?   @db.Uuid
  entitled      Int
  taken         Int       @default(0)
  remaining     Int
  carriedForward Int      @default(0)

  employee      Employee  @relation(fields: [employeeId], references: [id])
  leaveType     LeaveType @relation(fields: [leaveTypeId], references: [id])

  @@unique([employeeId, leaveTypeId, fiscalYearId])
  @@index([employeeId])
}

model LeaveApplication {
  id            String      @id @default(uuid()) @db.Uuid
  applicationNo String      @unique
  employeeId    String      @db.Uuid
  leaveTypeId   String      @db.Uuid
  startDate     DateTime
  endDate       DateTime
  days          Int
  reason        String?
  status        LeaveStatus @default(PENDING)
  approvedById  String?     @db.Uuid
  approvedAt    DateTime?
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  employee      Employee    @relation(fields: [employeeId], references: [id])
  leaveType     LeaveType   @relation(fields: [leaveTypeId], references: [id])

  @@index([employeeId])
  @@index([status])
  @@index([startDate])
}

model SalaryComponent {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique // "Basic", "House Rent", "Medical", "Transport", "PF Deduction", "TDS"
  code        String   @unique
  type        String   // "EARNING" or "DEDUCTION"
  isFixed     Boolean  @default(true)
  isPercentage Boolean @default(false)
  percentageOf String? // "BASIC" — if this is a % of another component
  defaultValue Decimal @default(0) @db.Decimal(18, 2)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
}

model PayrollRun {
  id            String          @id @default(uuid()) @db.Uuid
  runNo         String          @unique
  month         Int             // 1-12
  year          Int
  totalGross    Decimal         @default(0) @db.Decimal(18, 2)
  totalDeductions Decimal       @default(0) @db.Decimal(18, 2)
  totalNet      Decimal         @default(0) @db.Decimal(18, 2)
  employeeCount Int             @default(0)
  status        PayrollRunStatus @default(DRAFT)
  processedById String?         @db.Uuid
  processedAt   DateTime?
  approvedById  String?         @db.Uuid
  approvedAt    DateTime?
  paidAt        DateTime?
  journalEntryId String?        @db.Uuid
  notes         String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  entries       PayrollEntry[]

  @@unique([month, year])
  @@index([status])
}

model PayrollEntry {
  id               String     @id @default(uuid()) @db.Uuid
  payrollRunId     String     @db.Uuid
  employeeId       String     @db.Uuid
  basicSalary      Decimal    @db.Decimal(18, 2)
  houseRent        Decimal    @default(0) @db.Decimal(18, 2)
  medicalAllowance Decimal    @default(0) @db.Decimal(18, 2)
  transportAllowance Decimal  @default(0) @db.Decimal(18, 2)
  otherEarnings    Decimal    @default(0) @db.Decimal(18, 2)
  grossSalary      Decimal    @db.Decimal(18, 2)
  pfDeduction      Decimal    @default(0) @db.Decimal(18, 2)
  tdsDeduction     Decimal    @default(0) @db.Decimal(18, 2)
  otherDeductions  Decimal    @default(0) @db.Decimal(18, 2)
  absentDeduction  Decimal    @default(0) @db.Decimal(18, 2)
  netSalary        Decimal    @db.Decimal(18, 2)
  workingDays      Int
  presentDays      Int
  absentDays       Int        @default(0)
  otHours          Decimal    @default(0) @db.Decimal(6, 2)
  otPayment        Decimal    @default(0) @db.Decimal(18, 2)
  isPaid           Boolean    @default(false)

  payrollRun       PayrollRun @relation(fields: [payrollRunId], references: [id])
  employee         Employee   @relation(fields: [employeeId], references: [id])

  @@unique([payrollRunId, employeeId])
  @@index([payrollRunId])
  @@index([employeeId])
}

model PerformanceReview {
  id              String           @id @default(uuid()) @db.Uuid
  employeeId      String           @db.Uuid
  reviewPeriod    String           // e.g., "2025-2026"
  reviewType      String           // "ANNUAL", "MID_YEAR", "PROBATION"
  selfScore       Decimal?         @db.Decimal(3, 1) // 0.0-5.0
  supervisorScore Decimal?         @db.Decimal(3, 1)
  finalScore      Decimal?         @db.Decimal(3, 1)
  rating          PerformanceRating?
  selfComments    String?
  supervisorComments String?
  developmentPlan String?
  status          String           @default("DRAFT") // DRAFT, SELF_REVIEW, SUPERVISOR_REVIEW, COMPLETED
  reviewedById    String?          @db.Uuid
  completedAt     DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  employee        Employee         @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@index([reviewPeriod])
}

model Training {
  id            String         @id @default(uuid()) @db.Uuid
  trainingNo    String         @unique
  title         String
  type          TrainingType
  facilitator   String?
  venue         String?
  startDate     DateTime
  endDate       DateTime?
  durationHours Int?
  budget        Decimal        @default(0) @db.Decimal(18, 2)
  actualCost    Decimal        @default(0) @db.Decimal(18, 2)
  status        TrainingStatus @default(PLANNED)
  description   String?
  projectId     String?        @db.Uuid
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  participants  TrainingParticipant[]

  @@index([status])
  @@index([startDate])
}

model TrainingParticipant {
  id          String   @id @default(uuid()) @db.Uuid
  trainingId  String   @db.Uuid
  employeeId  String   @db.Uuid
  attended    Boolean  @default(false)
  score       Decimal? @db.Decimal(5, 2) // Post-training assessment
  feedback    String?

  training    Training @relation(fields: [trainingId], references: [id], onDelete: Cascade)
  employee    Employee @relation(fields: [employeeId], references: [id])

  @@unique([trainingId, employeeId])
  @@index([trainingId])
}
```

### 4.11 Microfinance Models

```prisma
// ─── microfinance.prisma ───

model Branch {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String   @db.Uuid  // ← TENANT SCOPE
  code            String
  name        String
  location    String
  managerId   String?  @db.Uuid
  phone       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  samities    Samity[]

  @@unique([organizationId, code])
  @@index([organizationId])
}

model Samity {
  id                String      @id @default(uuid()) @db.Uuid
  samityNo          String      @unique
  name              String
  branchId          String      @db.Uuid
  formationDate     DateTime
  meetingDay        String      // "Saturday", "Sunday", etc.
  meetingTime       String?     // "09:00 AM"
  fieldOfficerId    String?     @db.Uuid // Employee
  totalMembers      Int         @default(0)
  status            SamityStatus @default(NEW)
  location          String?
  notes             String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  branch            Branch      @relation(fields: [branchId], references: [id])
  members           MFIMember[]
  collections       CollectionSheet[]

  @@index([branchId])
  @@index([status])
}

model MFIMember {
  id              String        @id @default(uuid()) @db.Uuid
  memberNo        String        @unique
  beneficiaryId   String        @db.Uuid  // Links to Beneficiary master
  samityId        String        @db.Uuid
  admissionDate   DateTime
  status          String        @default("ACTIVE") // ACTIVE, INACTIVE, SUSPENDED, WITHDRAWN
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  beneficiary     Beneficiary   @relation(fields: [beneficiaryId], references: [id])
  samity          Samity        @relation(fields: [samityId], references: [id])
  loanAccounts    LoanAccount[]
  savingsAccounts SavingsAccount[]

  @@index([beneficiaryId])
  @@index([samityId])
}

model LoanProduct {
  id                 String              @id @default(uuid()) @db.Uuid
  productCode        String              @unique
  name               String
  category           LoanCategory
  minAmount          Decimal             @db.Decimal(18, 2)
  maxAmount          Decimal             @db.Decimal(18, 2)
  interestRate       Decimal             @db.Decimal(5, 2) // Annual %
  interestMethod     InterestMethod      @default(DECLINING_BALANCE)
  maxDurationMonths  Int
  repaymentFrequency RepaymentFrequency  @default(WEEKLY)
  gracePeriodDays    Int                 @default(0)
  serviceCharge      Decimal             @default(0) @db.Decimal(5, 2) // %
  requiresSavings    Boolean             @default(true)
  isActive           Boolean             @default(true)
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  loanApplications   LoanApplication[]
  loanAccounts       LoanAccount[]

  @@index([productCode])
  @@index([category])
}

model LoanApplication {
  id              String        @id @default(uuid()) @db.Uuid
  applicationNo   String        @unique
  date            DateTime
  memberId        String        @db.Uuid
  productId       String        @db.Uuid
  amountRequested Decimal       @db.Decimal(18, 2)
  purpose         String
  durationMonths  Int
  fieldOfficerId  String?       @db.Uuid
  status          LoanAppStatus @default(SUBMITTED)
  approvedAmount  Decimal?      @db.Decimal(18, 2)
  approvedById    String?       @db.Uuid
  approvedAt      DateTime?
  rejectionReason String?
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  product         LoanProduct   @relation(fields: [productId], references: [id])

  @@index([memberId])
  @@index([status])
}

model LoanAccount {
  id                 String            @id @default(uuid()) @db.Uuid
  accountNo          String            @unique
  memberId           String            @db.Uuid
  productId          String            @db.Uuid
  principalAmount    Decimal           @db.Decimal(18, 2)
  interestRate       Decimal           @db.Decimal(5, 2)
  interestMethod     InterestMethod
  durationMonths     Int
  installmentAmount  Decimal           @db.Decimal(18, 2)
  totalRepayable     Decimal           @db.Decimal(18, 2)
  totalPaid          Decimal           @default(0) @db.Decimal(18, 2)
  outstandingBalance Decimal           @db.Decimal(18, 2)
  overdueAmount      Decimal           @default(0) @db.Decimal(18, 2)
  daysOverdue        Int               @default(0)
  classification     LoanClassification @default(REGULAR)
  disbursedAt        DateTime?
  maturityDate       DateTime?
  lastPaymentDate    DateTime?
  status             LoanAccountStatus @default(PENDING_DISBURSEMENT)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  member             MFIMember         @relation(fields: [memberId], references: [id])
  product            LoanProduct       @relation(fields: [productId], references: [id])
  disbursement       LoanDisbursement?
  repayments         LoanRepayment[]

  @@index([memberId])
  @@index([status])
  @@index([classification])
  @@index([accountNo])
}

model LoanDisbursement {
  id              String             @id @default(uuid()) @db.Uuid
  disbursementNo  String             @unique
  loanAccountId   String             @unique @db.Uuid
  date            DateTime
  amount          Decimal            @db.Decimal(18, 2)
  mode            DisbursementMode
  branchId        String?            @db.Uuid
  disbursedById   String             @db.Uuid
  status          DisbursementStatus @default(SCHEDULED)
  reference       String?
  journalEntryId  String?            @db.Uuid
  notes           String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  loanAccount     LoanAccount        @relation(fields: [loanAccountId], references: [id])

  @@index([loanAccountId])
  @@index([date])
}

model LoanRepayment {
  id              String      @id @default(uuid()) @db.Uuid
  repaymentNo     String      @unique
  loanAccountId   String      @db.Uuid
  date            DateTime
  principalAmount Decimal     @db.Decimal(18, 2)
  interestAmount  Decimal     @db.Decimal(18, 2)
  totalAmount     Decimal     @db.Decimal(18, 2)
  penaltyAmount   Decimal     @default(0) @db.Decimal(18, 2)
  collectedById   String      @db.Uuid
  balanceAfter    Decimal     @db.Decimal(18, 2)
  isOnTime        Boolean     @default(true)
  journalEntryId  String?     @db.Uuid
  notes           String?
  createdAt       DateTime    @default(now())

  loanAccount     LoanAccount @relation(fields: [loanAccountId], references: [id])

  @@index([loanAccountId])
  @@index([date])
}

model CollectionSheet {
  id              String           @id @default(uuid()) @db.Uuid
  collectionNo    String           @unique
  samityId        String           @db.Uuid
  date            DateTime
  membersPresent  Int
  totalCollectible Decimal         @db.Decimal(18, 2)
  amountCollected Decimal          @db.Decimal(18, 2)
  shortfall       Decimal          @default(0) @db.Decimal(18, 2)
  onTimePercent   Decimal          @default(0) @db.Decimal(5, 2)
  collectedById   String           @db.Uuid
  status          CollectionStatus @default(COMPLETED)
  depositedAt     DateTime?
  notes           String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  samity          Samity           @relation(fields: [samityId], references: [id])

  @@index([samityId])
  @@index([date])
}

model SavingsAccount {
  id              String      @id @default(uuid()) @db.Uuid
  accountNo       String      @unique
  memberId        String      @db.Uuid
  type            SavingsType
  balance         Decimal     @default(0) @db.Decimal(18, 2)
  totalDeposited  Decimal     @default(0) @db.Decimal(18, 2)
  totalWithdrawn  Decimal     @default(0) @db.Decimal(18, 2)
  interestEarned  Decimal     @default(0) @db.Decimal(18, 2)
  interestRate    Decimal     @default(0) @db.Decimal(5, 2)
  monthlyDeposit  Decimal     @default(0) @db.Decimal(18, 2) // For compulsory
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  member          MFIMember   @relation(fields: [memberId], references: [id])
  transactions    SavingsTransaction[]

  @@index([memberId])
  @@index([type])
  @@index([accountNo])
}

model SavingsTransaction {
  id              String         @id @default(uuid()) @db.Uuid
  accountId       String         @db.Uuid
  date            DateTime
  type            String         // "DEPOSIT", "WITHDRAWAL", "INTEREST"
  amount          Decimal        @db.Decimal(18, 2)
  balanceAfter    Decimal        @db.Decimal(18, 2)
  reference       String?
  transactedById  String         @db.Uuid
  journalEntryId  String?        @db.Uuid
  notes           String?
  createdAt       DateTime       @default(now())

  account         SavingsAccount @relation(fields: [accountId], references: [id])

  @@index([accountId])
  @@index([date])
}
```

### 4.12 System Models

```prisma
// ─── system.prisma ───

// ═══════════════════════════════════════════
// AUDIT TRAIL (Split: Super Admin + Tenant)
// Adopted from LMS project pattern
// ═══════════════════════════════════════════

// SuperAdminAuditLog is in saas.prisma (global, not tenant-scoped)

model TenantAuditLog {
  id              String      @id @default(uuid()) @db.Uuid
  organizationId  String      @db.Uuid  // ← TENANT SCOPE
  userId          String?     @db.Uuid
  action          AuditAction
  module          String      // e.g., "finance", "hr"
  resource        String      // e.g., "voucher", "employee"
  resourceId      String?     @db.Uuid
  description     String
  oldValues       Json?       // Previous state (for UPDATE)
  newValues       Json?       // New state (for CREATE/UPDATE)
  ipAddress       String?
  userAgent       String?
  isImpersonated  Boolean     @default(false) // Was super admin impersonating?
  status          String      @default("SUCCESS") // SUCCESS, FAILED
  createdAt       DateTime    @default(now())

  user            User?       @relation(fields: [userId], references: [id])

  @@index([organizationId, createdAt])
  @@index([organizationId, module])
  @@index([organizationId, resource])
  @@index([userId])
  @@index([action])
}

// ═══════════════════════════════════════════
// WEBHOOKS
// ═══════════════════════════════════════════

model WebhookEndpoint {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String   @db.Uuid  // ← TENANT SCOPE
  url             String   // e.g., "https://external.app/webhook"
  secret          String   // Signing secret for payload verification
  events          String[] // e.g., ["voucher.approved", "fund.received", "employee.created"]
  isActive        Boolean  @default(true)
  failureCount    Int      @default(0)
  lastDeliveredAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  deliveries      WebhookDelivery[]

  @@index([organizationId])
}

model WebhookDelivery {
  id              String   @id @default(uuid()) @db.Uuid
  endpointId      String   @db.Uuid
  event           String   // e.g., "voucher.approved"
  payload         Json     // Event data sent
  responseStatus  Int?     // HTTP status code
  responseBody    String?
  attempts        Int      @default(1)
  status          String   @default("PENDING") // PENDING, SUCCESS, FAILED
  deliveredAt     DateTime?
  createdAt       DateTime @default(now())

  endpoint        WebhookEndpoint @relation(fields: [endpointId], references: [id], onDelete: Cascade)

  @@index([endpointId])
  @@index([event])
  @@index([status])
}

// ═══════════════════════════════════════════
// DATA RETENTION & EXPORT (GDPR compliance)
// ═══════════════════════════════════════════

model DataRetentionPolicy {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String   @db.Uuid  // ← TENANT SCOPE
  entityType      String   // e.g., "audit_log", "notification", "attachment"
  retentionDays   Int      // Days to keep before auto-purge
  isActive        Boolean  @default(true)
  lastPurgedAt    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([organizationId, entityType])
}

model DataExportRequest {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String   @db.Uuid  // ← TENANT SCOPE
  requestedById   String   @db.Uuid
  exportType      String   // "FULL_EXPORT", "MODULE_EXPORT", "GDPR_REQUEST"
  modules         String[] // e.g., ["finance", "hr", "beneficiaries"]
  status          String   @default("PENDING") // PENDING, PROCESSING, COMPLETED, FAILED, EXPIRED
  filePath        String?  // R2 key of generated export file
  fileSize        BigInt?
  expiresAt       DateTime? // Auto-delete after this
  completedAt     DateTime?
  errorMessage    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([organizationId])
  @@index([status])
}

model Notification {
  id          String           @id @default(uuid()) @db.Uuid
  userId      String           @db.Uuid
  type        NotificationType
  title       String
  message     String
  link        String?          // URL to navigate to
  isRead      Boolean          @default(false)
  readAt      DateTime?
  createdAt   DateTime         @default(now())

  user        User             @relation(fields: [userId], references: [id])

  @@index([userId, isRead])
  @@index([createdAt])
}

model NotificationSetting {
  id        String              @id @default(uuid()) @db.Uuid
  userId    String              @db.Uuid
  type      NotificationType
  channel   NotificationChannel
  isEnabled Boolean             @default(true)

  user      User                @relation(fields: [userId], references: [id])

  @@unique([userId, type, channel])
}

model Attachment {
  id            String   @id @default(uuid()) @db.Uuid
  fileName      String   // UUID-based stored name
  originalName  String   // User's original file name
  storageKey    String   // R2 object key: "{orgId}/{module}/{year}/{month}/{uuid}-{name}"
  fileSize      Int      // Bytes
  mimeType      String
  entityType    String   // "voucher", "fund_receipt", "contract", "tender", etc.
  entityId      String   @db.Uuid
  uploadedById  String   @db.Uuid
  createdAt     DateTime @default(now())

  // Polymorphic relations (optional FK — entity-specific)
  journalEntry    JournalEntry?      @relation(fields: [entityId], references: [id], map: "fk_attachment_je")
  voucher         Voucher?
  fundReceipt     FundReceipt?
  fundRequisition FundRequisition?
  donorReport     DonorReport?
  purchaseRequisition PurchaseRequisition?
  purchaseOrder   PurchaseOrder?
  tender          Tender?
  tenderBid       TenderBid?
  contract        Contract?
  asset           Asset?

  @@index([entityType, entityId])
  @@index([uploadedById])
}

model ApprovalWorkflowDef {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique // e.g., "Voucher Approval", "PR Approval"
  module      String   // e.g., "finance", "procurement"
  entityType  String   // e.g., "voucher", "purchase_requisition"
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  steps       ApprovalWorkflowStep[]
  instances   ApprovalInstance[]
}

model ApprovalWorkflowStep {
  id            String              @id @default(uuid()) @db.Uuid
  workflowId    String              @db.Uuid
  stepNumber    Int
  name          String              // e.g., "Review", "Approve", "Final Approve"
  roleId        String              @db.Uuid // Which role can approve this step
  amountMin     Decimal?            @db.Decimal(18, 2) // Threshold: only if amount >= this
  amountMax     Decimal?            @db.Decimal(18, 2) // Threshold: only if amount <= this
  isRequired    Boolean             @default(true)

  workflow      ApprovalWorkflowDef @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@unique([workflowId, stepNumber])
  @@index([workflowId])
}

model ApprovalInstance {
  id            String              @id @default(uuid()) @db.Uuid
  workflowId    String              @db.Uuid
  entityType    String
  entityId      String              @db.Uuid
  currentStep   Int                 @default(1)
  status        ApprovalStatus      @default(SUBMITTED)
  requestedById String              @db.Uuid
  amount        Decimal?            @db.Decimal(18, 2)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  workflow      ApprovalWorkflowDef @relation(fields: [workflowId], references: [id])
  actions       ApprovalAction[]

  @@index([workflowId])
  @@index([entityType, entityId])
  @@index([status])
}

model ApprovalAction {
  id            String           @id @default(uuid()) @db.Uuid
  instanceId    String           @db.Uuid
  stepNumber    Int
  action        String           // "APPROVE", "REJECT", "RETURN"
  actorId       String           @db.Uuid
  comments      String?
  createdAt     DateTime         @default(now())

  instance      ApprovalInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)

  @@index([instanceId])
}

model Backup {
  id          String   @id @default(uuid()) @db.Uuid
  type        String   // "FULL", "INCREMENTAL", "DATABASE", "FILES"
  fileName    String
  filePath    String
  fileSize    BigInt?
  durationMs  Int?
  status      String   @default("IN_PROGRESS") // IN_PROGRESS, SUCCESS, FAILED
  initiatedBy String?  // "SYSTEM" or user ID
  errorLog    String?
  createdAt   DateTime @default(now())
}
```

---

## 5. Inter-Module Data Flow & Relationships

### 5.1 Master Relationship Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW OVERVIEW                               │
│                                                                          │
│  Settings & Admin ──────────────────────────────────────────────────┐    │
│  (Organization, Users, Roles, Workflows, Config)                    │    │
│       │ provides auth/config to ALL modules                         │    │
│       ▼                                                             │    │
│  ┌─────────┐   funds    ┌─────────┐   budget   ┌──────────┐       │    │
│  │  DONOR  │──────────▶│ GRANT   │──────────▶│  BUDGET  │       │    │
│  │         │           │         │           │          │       │    │
│  └────┬────┘           └────┬────┘           └─────┬────┘       │    │
│       │                     │                      │             │    │
│       │              creates│              tracks  │             │    │
│       │                     ▼              vs actual│             │    │
│       │              ┌─────────┐                   │             │    │
│       │              │ PROJECT │◀──────────────────┘             │    │
│       │              │         │                                  │    │
│       │              └────┬────┘                                  │    │
│       │                   │                                       │    │
│       │         ┌─────────┼─────────┬───────────┐                │    │
│       │         ▼         ▼         ▼           ▼                │    │
│       │    Activities  Milestones  LogFrame  Closeout            │    │
│       │         │                                                │    │
│       │         │ costs flow to                                   │    │
│       ▼         ▼                                                │    │
│  ┌──────────────────┐                                            │    │
│  │     FINANCE      │◀─── Payroll (HR)                           │    │
│  │  Journal Entries  │◀─── Depreciation (Assets)                  │    │
│  │  Vouchers        │◀─── Procurement Payments                    │    │
│  │  Bank/Cash       │◀─── Fund Receipts (Donor)                   │    │
│  │                  │◀─── Loan Disbursement/Collection (MFI)      │    │
│  │                  │──▶  Financial Reports                       │    │
│  └──────────────────┘──▶  Budget vs Actual                       │    │
│       ▲                                                          │    │
│       │                                                          │    │
│  ┌────┴───────┐  ┌────────────┐  ┌──────────────┐              │    │
│  │PROCUREMENT │  │   ASSETS   │  │     HR       │              │    │
│  │PR→PO→GRN→  │  │Register→   │  │Employee→     │              │    │
│  │  Payment   │  │Depreciation│  │Attendance→   │              │    │
│  │Inventory   │  │→Transfer→  │  │Leave→Payroll │              │    │
│  │            │  │  Disposal  │  │→Performance  │              │    │
│  └────────────┘  └────────────┘  └──────────────┘              │    │
│       ▲                                                          │    │
│       │ PR budget validation                                     │    │
│       │                                                          │    │
│  ┌────┴───────┐                  ┌──────────────┐              │    │
│  │   BUDGET   │                  │ BENEFICIARY  │              │    │
│  │(validates) │                  │Registry→     │              │    │
│  └────────────┘                  │Enrollment→   │              │    │
│                                  │Services→     │              │    │
│  ┌────────────┐                  │Impact        │              │    │
│  │MICROFINANCE│──────────────────│              │              │    │
│  │Samity→Loan │  (MFI members    │              │              │    │
│  │→Collection │   are beneficiaries)             │              │    │
│  │→Savings   │                  └──────────────┘              │    │
│  └────────────┘                                                │    │
│                                                                  │    │
│  REPORTS & ANALYTICS ◀── Aggregates data from ALL modules ──────┘    │
│  Audit Trail ◀── Logs ALL actions across ALL modules                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Detailed Cross-Module Impact Analysis

When data changes in one module, here's exactly what it affects:

| Source Action | Affected Modules | Specific Impact | Status |
|---------------|-----------------|-----------------|--------|
| **New Fund Receipt** (Donor) | Finance: creates Journal Entry (DR Bank, CR Grant Income) | Budget: updates available funds | Dashboard: updates "Total Fund Received" KPI | Grant: updates `disbursedAmount` | ✅ implemented |
| **Voucher Approved** (Finance) | Finance: auto-creates Journal Entry | Budget: actual spend tracked via JE lines → Budget vs Actual | Project: increases `amountSpent` | ✅ implemented |
| **Budget Revision Approved** | Budget: updates budget line amounts | Project: updates `totalBudget` | Procurement: changes available budget for PR validation | ✅ implemented |
| **PR Created** (Procurement) | Budget: validates budget availability (blocks if insufficient) | Finance: eventually creates payment voucher | ✅ implemented |
| **PO → GRN → Payment** | Inventory: increases `stockInHand` (from GRN) | Finance: creates payment voucher & journal entry | Budget: increases actual spend | ✅ implemented |
| **Payroll Approved** (HR) | Finance: auto-creates journal entry (DR Salary Expense, CR Bank) | Budget: actual spend tracked via JE | ✅ implemented |
| **Depreciation Run** (Assets) | Finance: auto-creates journal entry (DR Depreciation Expense, CR Accumulated Dep.) | Asset: updates `accumulatedDepreciation` and `netBookValue` | ✅ implemented |
| **Asset Disposed** | Finance: auto-creates journal entry (gain/loss on disposal) | Asset: marks as disposed, updates register | ✅ implemented |
| **Employee Joins/Leaves** (HR) | Project: updates team members | Payroll: adds/removes from payroll run | Dashboard: updates "Staff Count" KPI | ⏳ dashboard KPI pending |
| **Leave Approved** (HR) | LeaveBalance: updates taken/remaining | Payroll: applies leave deduction if unpaid | ✅ implemented |
| **Loan Disbursed** (MFI) | Finance: auto-creates journal entry (DR Loan Outstanding, CR Bank/Cash) | LoanAccount: status → ACTIVE | ✅ implemented |
| **Loan Repayment Collected** | Finance: auto-creates journal entry (DR Cash, CR Loan Outstanding + Interest Income) | Loan Account: reduces outstanding, updates last payment | ✅ implemented |
| **Savings Deposit/Withdrawal** (MFI) | Finance: auto-creates journal entry (DR/CR Cash ↔ Savings) | Savings Account: updates balance | ✅ implemented |
| **Beneficiary Enrolled** | Project: increases beneficiary count | Dashboard: updates "Active Beneficiaries" KPI | ⏳ dashboard KPI pending |
| **Service Delivered** | Project: tracks delivery metrics | Impact Assessment: feeds into indicator measurement | ⏳ dashboard KPI pending |
| **New Project Created** | Grant: links project to grant | Budget: enables budget creation | Finance: enables project-tagged transactions | ✅ implemented |
| **Grant Status Change** | Project: updates project status | Budget: freezes/unfreezes budget | Fund Requisition: enables/disables requests | ⏳ partial |

### 5.3 Cascade Rules

| Entity | On Delete Behavior | Reason |
|--------|-------------------|--------|
| **User** | Soft delete (set `deletedAt`) | Historical records reference this user |
| **Account** | Soft delete | Journal entries reference accounts |
| **Journal Entry** | Soft delete | Financial records must be retained |
| **Voucher** | Soft delete | NGOAB requires 5-year retention |
| **Project** | Soft delete | All related data must be preserved |
| **Grant** | Soft delete | Financial audit trail |
| **Employee** | Soft delete | HR records, payroll history |
| **Beneficiary** | Soft delete | Impact tracking, donor reporting |
| **Vendor** | Soft delete | Procurement history |
| **Asset** | Soft delete | Asset register, depreciation history |
| **Budget Lines** | CASCADE on Budget delete | Lines are meaningless without parent |
| **PO Lines** | CASCADE on PO delete | Same |
| **PR Lines** | CASCADE on PR delete | Same |
| **GRN Lines** | CASCADE on GRN delete | Same |
| **Approval Actions** | CASCADE on Instance delete | Workflow actions follow instance |

---

## 6. API Routes & CRUD Operations

### 6.1 Common Query Parameters (All List Endpoints)

```
GET /api/v1/{resource}?page=1&limit=20&sort=createdAt&order=desc&search=keyword&status=ACTIVE
```

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `sort` | string | Sort field |
| `order` | "asc" \| "desc" | Sort direction |
| `search` | string | Full-text search |
| `status` | string | Filter by status |
| `startDate` | ISO date | Filter date range start |
| `endDate` | ISO date | Filter date range end |
| `projectId` | UUID | Filter by project |
| `grantId` | UUID | Filter by grant |
| `export` | "csv" \| "excel" \| "pdf" | Export instead of paginate |

### 6.2 Module-wise API Endpoints

#### Auth & SaaS APIs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register new org + admin user (SaaS signup) | No |
| POST | `/api/v1/auth/login` | Login with email/password + org slug | No |
| POST | `/api/v1/auth/logout` | Invalidate session | Yes |
| GET | `/api/v1/auth/me` | Get current user profile + org context | Yes |
| POST | `/api/v1/auth/refresh` | Refresh JWT token | Yes |
| POST | `/api/v1/auth/change-password` | Change password | Yes |
| GET | `/api/v1/auth/org/:slug` | Check if org slug exists (for login page) | No |

#### Super Admin APIs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/admin/auth/login` | Super admin login (separate JWT) | No |
| GET | `/api/v1/admin/auth/me` | Get super admin profile | Super Admin |
| **Organizations** | | | |
| GET | `/api/v1/admin/organizations` | List all orgs with subscription status | Super Admin |
| POST | `/api/v1/admin/organizations` | Create organization | Super Admin |
| GET | `/api/v1/admin/organizations/:id` | Get org details + usage stats | Super Admin |
| PUT | `/api/v1/admin/organizations/:id` | Update org | Super Admin |
| POST | `/api/v1/admin/organizations/:id/suspend` | Suspend tenant | Super Admin |
| POST | `/api/v1/admin/organizations/:id/activate` | Activate tenant | Super Admin |
| **Impersonation** | | | |
| POST | `/api/v1/admin/impersonate/:orgId` | Start impersonation session | Super Admin |
| POST | `/api/v1/admin/impersonate/end` | End impersonation | Super Admin |
| **Plans & Features** | | | |
| GET | `/api/v1/admin/plans` | List subscription plans | Super Admin |
| POST | `/api/v1/admin/plans` | Create plan | Super Admin |
| PUT | `/api/v1/admin/plans/:id` | Update plan | Super Admin |
| GET | `/api/v1/admin/features` | List platform features | Super Admin |
| POST | `/api/v1/admin/features` | Create feature | Super Admin |
| PUT | `/api/v1/admin/plans/:id/features` | Assign features to plan | Super Admin |
| **Subscriptions & Billing** | | | |
| GET | `/api/v1/admin/subscriptions` | List all subscriptions | Super Admin |
| PUT | `/api/v1/admin/subscriptions/:id` | Update subscription (status, plan, cycle) | Super Admin |
| GET | `/api/v1/admin/invoices` | List all SaaS invoices | Super Admin |
| GET | `/api/v1/admin/payments` | List all payment transactions | Super Admin |
| **Domains** | | | |
| GET | `/api/v1/admin/domains` | List all tenant domains & status | Super Admin |
| PUT | `/api/v1/admin/domains/:orgId/verify` | Manually verify/revoke domain | Super Admin |
| **Media Settings** | | | |
| GET | `/api/v1/admin/media-settings` | Get current R2/storage config | Super Admin |
| PUT | `/api/v1/admin/media-settings` | Update R2 config | Super Admin |
| POST | `/api/v1/admin/media-settings/test` | Test R2 connection | Super Admin |
| **Audit** | | | |
| GET | `/api/v1/admin/audit-log` | Super admin audit trail | Super Admin |

#### Finance APIs
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/v1/finance/accounts` | List accounts (flat or tree) | finance.read.accounts |
| POST | `/api/v1/finance/accounts` | Create account | finance.create.accounts |
| GET | `/api/v1/finance/accounts/:id` | Get account details with balance | finance.read.accounts |
| PUT | `/api/v1/finance/accounts/:id` | Update account | finance.update.accounts |
| DELETE | `/api/v1/finance/accounts/:id` | Deactivate account | finance.delete.accounts |
| GET | `/api/v1/finance/accounts/tree` | Get hierarchical tree | finance.read.accounts |
| GET | `/api/v1/finance/journal-entries` | List journal entries | finance.read.journal-entries |
| POST | `/api/v1/finance/journal-entries` | Create journal entry with lines | finance.create.journal-entries |
| GET | `/api/v1/finance/journal-entries/:id` | Get entry with lines | finance.read.journal-entries |
| PUT | `/api/v1/finance/journal-entries/:id` | Update draft entry | finance.update.journal-entries |
| POST | `/api/v1/finance/journal-entries/:id/post` | Post (finalize) entry | finance.approve.journal-entries |
| GET | `/api/v1/finance/vouchers` | List vouchers | finance.read.vouchers |
| POST | `/api/v1/finance/vouchers` | Create voucher (auto-creates JE) | finance.create.vouchers |
| GET | `/api/v1/finance/vouchers/:id` | Get voucher details | finance.read.vouchers |
| PUT | `/api/v1/finance/vouchers/:id` | Update draft voucher | finance.update.vouchers |
| POST | `/api/v1/finance/vouchers/:id/approve` | Approve voucher | finance.approve.vouchers |
| POST | `/api/v1/finance/vouchers/:id/reject` | Reject voucher | finance.approve.vouchers |
| GET | `/api/v1/finance/bank-accounts` | List bank accounts | finance.read.bank-accounts |
| POST | `/api/v1/finance/bank-accounts` | Add bank account | finance.create.bank-accounts |
| GET | `/api/v1/finance/bank-accounts/:id` | Get account with balance | finance.read.bank-accounts |
| PUT | `/api/v1/finance/bank-accounts/:id` | Update bank account | finance.update.bank-accounts |
| GET | `/api/v1/finance/bank-reconciliation` | List reconciliations | finance.read.bank-reconciliation |
| POST | `/api/v1/finance/bank-reconciliation` | Start reconciliation | finance.create.bank-reconciliation |
| POST | `/api/v1/finance/bank-reconciliation/:id/match` | Match items | finance.update.bank-reconciliation |
| POST | `/api/v1/finance/bank-reconciliation/:id/import` | Import CSV bank statement | finance.create.bank-reconciliation |
| POST | `/api/v1/finance/bank-reconciliation/:id/auto-match` | Auto-match bank items with JE lines | finance.update.bank-reconciliation |
| GET | `/api/v1/finance/reports/:type` | Generate report — supported types below | finance.read.reports |
| | | **Core:** trial-balance, income-statement, balance-sheet, cash-flow, receipts-payments ✅ | |
| | | **Subsidiary:** ledger, day-book, bank-book, cash-book ✅ | |
| | | **NGO-specific:** fund-position, fund-balance-changes, grant-financial, bank-reconciliation-statement ✅ | |
| GET | `/api/v1/attachments` | List attachments by entityType + entityId | auth |
| DELETE | `/api/v1/attachments` | Delete attachment by id | auth |

#### Budget APIs
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/v1/budget` | List all budgets | budget.read.budgets |
| POST | `/api/v1/budget` | Create budget with lines | budget.create.budgets |
| GET | `/api/v1/budget/:id` | Get budget detail with lines | budget.read.budgets |
| PUT | `/api/v1/budget/:id` | Update budget | budget.update.budgets |
| DELETE | `/api/v1/budget/:id` | Delete draft budget | budget.delete.budgets |
| GET | `/api/v1/budget/:id/vs-actual` | Get budget vs actual analysis | budget.read.budgets |
| GET | `/api/v1/budget/revisions` | List budget revisions | budget.read.revisions |
| POST | `/api/v1/budget/revisions` | Create revision | budget.create.revisions |
| POST | `/api/v1/budget/revisions/:id/approve` | Approve revision | budget.approve.revisions |
| GET | `/api/v1/budget/cost-allocation` | List cost allocation rules | budget.read.cost-allocation |
| POST | `/api/v1/budget/cost-allocation` | Create allocation rule | budget.create.cost-allocation |
| POST | `/api/v1/budget/cost-allocation/:id/apply` | Run allocation for period | budget.update.cost-allocation |

#### Donor & Grant APIs
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/v1/donors` | List donors | donors.read.donors |
| POST | `/api/v1/donors` | Create donor | donors.create.donors |
| GET | `/api/v1/donors/:id` | Get donor with grants summary | donors.read.donors |
| PUT | `/api/v1/donors/:id` | Update donor | donors.update.donors |
| GET/POST | `/api/v1/donors/:id/contacts` | List/Add contacts | donors.read.donors |
| GET | `/api/v1/donors/grants` | List all grants | donors.read.grants |
| POST | `/api/v1/donors/grants` | Create grant | donors.create.grants |
| GET | `/api/v1/donors/grants/:id` | Get grant with financials | donors.read.grants |
| PUT | `/api/v1/donors/grants/:id` | Update grant | donors.update.grants |
| PUT | `/api/v1/donors/grants/:id/lifecycle` | Update lifecycle stage | donors.update.grants |
| GET | `/api/v1/donors/fund-receipts` | List fund receipts | donors.read.fund-receipts |
| POST | `/api/v1/donors/fund-receipts` | Record fund receipt (auto JE) | donors.create.fund-receipts |
| POST | `/api/v1/donors/fund-receipts/:id/confirm` | Confirm receipt | donors.approve.fund-receipts |
| GET | `/api/v1/donors/fund-requisitions` | List requisitions | donors.read.fund-requisitions |
| POST | `/api/v1/donors/fund-requisitions` | Create requisition | donors.create.fund-requisitions |
| POST | `/api/v1/donors/fund-requisitions/:id/approve` | Approve | donors.approve.fund-requisitions |
| GET | `/api/v1/donors/reports` | List donor reports | donors.read.reports |
| POST | `/api/v1/donors/reports` | Create report entry | donors.create.reports |
| PUT | `/api/v1/donors/reports/:id` | Update report status | donors.update.reports |

#### Project APIs
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/v1/projects` | List projects | projects.read.projects |
| POST | `/api/v1/projects` | Create project | projects.create.projects |
| GET | `/api/v1/projects/:id` | Get project detail (with grants, team, counts) | projects.read.projects |
| PUT | `/api/v1/projects/:id` | Update project (all fields incl. type, sector, country) | projects.update.projects |
| DELETE | `/api/v1/projects/:id` | Soft-delete project (PIPELINE only) | projects.delete.projects |
| GET | `/api/v1/projects/dashboard` | Aggregate project analytics (real data) | projects.read.projects |
| GET/POST | `/api/v1/projects/:id/team` | Manage team | projects.update.projects |
| GET | `/api/v1/projects/activities` | List activities (filter by project) | projects.read.activities |
| POST | `/api/v1/projects/activities` | Create activity | projects.create.activities |
| GET | `/api/v1/projects/activities/:id` | Get activity detail | projects.read.activities |
| PUT | `/api/v1/projects/activities/:id` | Update activity/progress | projects.update.activities |
| GET | `/api/v1/projects/milestones` | List milestones | projects.read.milestones |
| POST | `/api/v1/projects/milestones` | Create milestone | projects.create.milestones |
| PUT | `/api/v1/projects/milestones/:id` | Update milestone | projects.update.milestones |
| GET | `/api/v1/projects/logframe` | List logframe entries | projects.read.logframe |
| POST | `/api/v1/projects/logframe` | Create logframe entry | projects.create.logframe |
| PUT | `/api/v1/projects/logframe/:id` | Update entry | projects.update.logframe |
| GET | `/api/v1/projects/indicators` | List project indicators (results framework) | projects.read.indicators |
| POST | `/api/v1/projects/indicators` | Create indicator (baseline, target, current) | projects.create.indicators |
| PUT | `/api/v1/projects/indicators/:id` | Update indicator values | projects.update.indicators |
| DELETE | `/api/v1/projects/indicators/:id` | Delete indicator | projects.delete.indicators |
| GET | `/api/v1/projects/risks` | List project risks (sorted by score) | projects.read.risks |
| POST | `/api/v1/projects/risks` | Create risk (auto-compute riskScore) | projects.create.risks |
| PUT | `/api/v1/projects/risks/:id` | Update risk (re-compute score) | projects.update.risks |
| DELETE | `/api/v1/projects/risks/:id` | Delete risk | projects.delete.risks |
| GET | `/api/v1/projects/closeout` | List closeouts | projects.read.closeout |
| POST | `/api/v1/projects/closeout` | Create closeout (8 default checklist items) | projects.create.closeout |
| PUT | `/api/v1/projects/closeout/:id` | Update closeout items | projects.update.closeout |

#### Beneficiary APIs
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/v1/beneficiaries` | List/search beneficiaries | beneficiaries.read.beneficiaries |
| POST | `/api/v1/beneficiaries` | Register beneficiary | beneficiaries.create.beneficiaries |
| GET | `/api/v1/beneficiaries/:id` | Get profile with enrollments | beneficiaries.read.beneficiaries |
| PUT | `/api/v1/beneficiaries/:id` | Update beneficiary | beneficiaries.update.beneficiaries |
| GET | `/api/v1/beneficiaries/enrollment` | List enrollments | beneficiaries.read.enrollment |
| POST | `/api/v1/beneficiaries/enrollment` | Enroll in program | beneficiaries.create.enrollment |
| PUT | `/api/v1/beneficiaries/enrollment/:id` | Update status | beneficiaries.update.enrollment |
| GET | `/api/v1/beneficiaries/service-delivery` | List services | beneficiaries.read.service-delivery |
| POST | `/api/v1/beneficiaries/service-delivery` | Record service | beneficiaries.create.service-delivery |
| GET | `/api/v1/beneficiaries/impact-indicators` | List indicators | beneficiaries.read.impact |
| POST | `/api/v1/beneficiaries/impact-indicators` | Create indicator | beneficiaries.create.impact |
| GET | `/api/v1/beneficiaries/impact-assessment` | List assessments | beneficiaries.read.impact |
| POST | `/api/v1/beneficiaries/impact-assessment` | Record measurement | beneficiaries.create.impact |
| GET | `/api/v1/beneficiaries/grievances` | List grievances | beneficiaries.read.grievances |
| POST | `/api/v1/beneficiaries/grievances` | Create grievance | beneficiaries.create.grievances |
| PUT | `/api/v1/beneficiaries/grievances/:id` | Update/resolve | beneficiaries.update.grievances |

#### Procurement APIs
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/v1/procurement/requisitions` | List PRs | procurement.read.requisitions |
| POST | `/api/v1/procurement/requisitions` | Create PR (validates budget) | procurement.create.requisitions |
| PUT | `/api/v1/procurement/requisitions/:id` | Update PR | procurement.update.requisitions |
| POST | `/api/v1/procurement/requisitions/:id/approve` | Approve PR | procurement.approve.requisitions |
| GET | `/api/v1/procurement/orders` | List POs | procurement.read.orders |
| POST | `/api/v1/procurement/orders` | Create PO (from approved PR) | procurement.create.orders |
| PUT | `/api/v1/procurement/orders/:id` | Update PO | procurement.update.orders |
| GET | `/api/v1/procurement/tenders` | List tenders | procurement.read.tenders |
| POST | `/api/v1/procurement/tenders` | Create tender | procurement.create.tenders |
| POST | `/api/v1/procurement/tenders/:id/bids` | Add bid | procurement.update.tenders |
| POST | `/api/v1/procurement/tenders/:id/award` | Award tender | procurement.approve.tenders |
| GET | `/api/v1/procurement/vendors` | List vendors | procurement.read.vendors |
| POST | `/api/v1/procurement/vendors` | Create vendor | procurement.create.vendors |
| PUT | `/api/v1/procurement/vendors/:id` | Update vendor | procurement.update.vendors |
| POST | `/api/v1/procurement/vendors/:id/ratings` | Rate vendor | procurement.update.vendors |
| GET | `/api/v1/procurement/contracts` | List contracts | procurement.read.contracts |
| POST | `/api/v1/procurement/contracts` | Create contract | procurement.create.contracts |
| PUT | `/api/v1/procurement/contracts/:id` | Update contract | procurement.update.contracts |
| GET | `/api/v1/procurement/inventory` | List inventory items | procurement.read.inventory |
| POST | `/api/v1/procurement/inventory` | Add item | procurement.create.inventory |
| PUT | `/api/v1/procurement/inventory/:id` | Update item | procurement.update.inventory |
| POST | `/api/v1/procurement/inventory/transactions` | Record stock movement | procurement.update.inventory |
| GET | `/api/v1/procurement/warehouses` | List warehouses | procurement.read.warehouses |
| POST | `/api/v1/procurement/warehouses` | Create warehouse | procurement.create.warehouses |
| GET | `/api/v1/procurement/goods-receipt` | List GRNs | procurement.read.goods-receipt |
| POST | `/api/v1/procurement/goods-receipt` | Create GRN (updates stock) | procurement.create.goods-receipt |

#### Asset APIs
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/v1/assets` | List assets | assets.read.assets |
| POST | `/api/v1/assets` | Register asset | assets.create.assets |
| GET | `/api/v1/assets/:id` | Get asset with history | assets.read.assets |
| PUT | `/api/v1/assets/:id` | Update asset | assets.update.assets |
| GET | `/api/v1/assets/categories` | List categories | assets.read.categories |
| POST | `/api/v1/assets/categories` | Create category | assets.create.categories |
| PUT | `/api/v1/assets/categories/:id` | Update category | assets.update.categories |
| GET | `/api/v1/assets/depreciation` | List depreciation schedule | assets.read.depreciation |
| POST | `/api/v1/assets/depreciation/calculate` | Run depreciation (creates JEs) | assets.create.depreciation |
| GET | `/api/v1/assets/transfers` | List transfers | assets.read.transfers |
| POST | `/api/v1/assets/transfers` | Create transfer | assets.create.transfers |
| POST | `/api/v1/assets/transfers/:id/approve` | Approve transfer | assets.approve.transfers |
| POST | `/api/v1/assets/transfers/:id/receive` | Confirm receipt | assets.update.transfers |
| GET | `/api/v1/assets/maintenance` | List maintenance | assets.read.maintenance |
| POST | `/api/v1/assets/maintenance` | Schedule maintenance | assets.create.maintenance |
| PUT | `/api/v1/assets/maintenance/:id` | Update maintenance | assets.update.maintenance |
| GET | `/api/v1/assets/disposal` | List disposals | assets.read.disposal |
| POST | `/api/v1/assets/disposal` | Create disposal (creates JE) | assets.create.disposal |
| POST | `/api/v1/assets/disposal/:id/approve` | Approve disposal | assets.approve.disposal |

#### HR APIs
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/v1/hr/employees` | List employees | hr.read.employees |
| POST | `/api/v1/hr/employees` | Create employee | hr.create.employees |
| GET | `/api/v1/hr/employees/:id` | Get employee profile | hr.read.employees |
| PUT | `/api/v1/hr/employees/:id` | Update employee | hr.update.employees |
| GET | `/api/v1/hr/departments` | List departments | hr.read.departments |
| POST | `/api/v1/hr/departments` | Create department | hr.create.departments |
| GET | `/api/v1/hr/designations` | List designations | hr.read.designations |
| GET | `/api/v1/hr/onboarding` | List onboarding tasks | hr.read.onboarding |
| POST | `/api/v1/hr/onboarding` | Create checklist item | hr.create.onboarding |
| PUT | `/api/v1/hr/onboarding/:id` | Update progress | hr.update.onboarding |
| GET | `/api/v1/hr/attendance` | List attendance | hr.read.attendance |
| POST | `/api/v1/hr/attendance` | Record attendance | hr.create.attendance |
| GET | `/api/v1/hr/attendance/summary` | Monthly summary | hr.read.attendance |
| GET | `/api/v1/hr/leave-types` | List leave types | hr.read.leave |
| GET | `/api/v1/hr/leave` | List applications | hr.read.leave |
| POST | `/api/v1/hr/leave` | Apply for leave | hr.create.leave |
| POST | `/api/v1/hr/leave/:id/approve` | Approve/reject leave | hr.approve.leave |
| GET | `/api/v1/hr/leave/balance/:employeeId` | Get leave balance | hr.read.leave |
| GET | `/api/v1/hr/payroll/runs` | List payroll runs | hr.read.payroll |
| POST | `/api/v1/hr/payroll/runs` | Create payroll run | hr.create.payroll |
| POST | `/api/v1/hr/payroll/runs/:id/process` | Process payroll (calculates all) | hr.update.payroll |
| POST | `/api/v1/hr/payroll/runs/:id/approve` | Approve payroll (creates JE) | hr.approve.payroll |
| GET | `/api/v1/hr/payroll/runs/:id` | Get run with entries | hr.read.payroll |
| GET | `/api/v1/hr/performance/reviews` | List reviews | hr.read.performance |
| POST | `/api/v1/hr/performance/reviews` | Create review cycle | hr.create.performance |
| PUT | `/api/v1/hr/performance/reviews/:id` | Update scores/comments | hr.update.performance |
| GET | `/api/v1/hr/training` | List trainings | hr.read.training |
| POST | `/api/v1/hr/training` | Create training | hr.create.training |
| PUT | `/api/v1/hr/training/:id` | Update training | hr.update.training |
| POST | `/api/v1/hr/training/:id/participants` | Add participants | hr.update.training |
| GET | `/api/v1/hr/org-chart` | Get organizational tree | hr.read.employees |

#### Microfinance APIs
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/v1/microfinance/branches` | List branches | mfi.read.branches |
| POST | `/api/v1/microfinance/branches` | Create branch | mfi.create.branches |
| GET | `/api/v1/microfinance/samity` | List samities | mfi.read.samity |
| POST | `/api/v1/microfinance/samity` | Create samity | mfi.create.samity |
| GET | `/api/v1/microfinance/samity/:id` | Get with members & portfolio | mfi.read.samity |
| GET/POST | `/api/v1/microfinance/samity/:id/members` | List/Add members | mfi.update.samity |
| GET | `/api/v1/microfinance/loan-products` | List products | mfi.read.loan-products |
| POST | `/api/v1/microfinance/loan-products` | Create product | mfi.create.loan-products |
| PUT | `/api/v1/microfinance/loan-products/:id` | Update product | mfi.update.loan-products |
| GET | `/api/v1/microfinance/loan-applications` | List applications | mfi.read.loan-applications |
| POST | `/api/v1/microfinance/loan-applications` | Submit application | mfi.create.loan-applications |
| POST | `/api/v1/microfinance/loan-applications/:id/approve` | Approve (creates loan account) | mfi.approve.loan-applications |
| GET | `/api/v1/microfinance/loan-accounts` | List loan accounts | mfi.read.loan-accounts |
| GET | `/api/v1/microfinance/loan-accounts/:id` | Get with repayment history | mfi.read.loan-accounts |
| POST | `/api/v1/microfinance/disbursement` | Disburse loan (creates JE) | mfi.create.disbursement |
| GET | `/api/v1/microfinance/collection` | List collections | mfi.read.collection |
| POST | `/api/v1/microfinance/collection` | Record collection (creates JE) | mfi.create.collection |
| POST | `/api/v1/microfinance/repayments` | Record repayment | mfi.create.repayments |
| GET | `/api/v1/microfinance/savings-accounts` | List savings accounts | mfi.read.savings |
| POST | `/api/v1/microfinance/savings-transactions` | Deposit/Withdraw | mfi.create.savings |
| GET | `/api/v1/microfinance/overdue` | List overdue loans | mfi.read.overdue |
| GET | `/api/v1/microfinance/mra-reports/:type` | Generate MRA report | mfi.read.mra-reports |

#### Reports APIs
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/v1/reports/financial/:type` | Financial report by type | reports.read.financial |
| GET | `/api/v1/reports/ngoab/:form` | NGOAB form (fd-1 to fd-9) | reports.read.ngoab |
| GET | `/api/v1/reports/donor` | Donor-specific reports | reports.read.donor |
| GET | `/api/v1/reports/project` | Project reports | reports.read.project |
| GET | `/api/v1/reports/hr/:type` | HR reports by type | reports.read.hr |
| GET | `/api/v1/reports/procurement` | Procurement reports | reports.read.procurement |
| GET | `/api/v1/reports/custom` | List saved custom reports | reports.read.custom |
| POST | `/api/v1/reports/custom` | Create custom report def | reports.create.custom |
| GET | `/api/v1/reports/custom/:id` | Run custom report | reports.read.custom |
| GET | `/api/v1/reports/audit-trail` | Query audit trail | reports.read.audit-trail |

#### Settings APIs
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/v1/settings/organization` | Get org settings | settings.read.organization |
| PUT | `/api/v1/settings/organization` | Update org settings | settings.update.organization |
| GET | `/api/v1/settings/domain` | Get current domain config | settings.read.organization |
| PUT | `/api/v1/settings/domain` | Set custom domain | settings.update.organization |
| POST | `/api/v1/settings/domain/verify` | Check DNS & verify custom domain | settings.update.organization |
| DELETE | `/api/v1/settings/domain` | Remove custom domain (revert to subdomain) | settings.update.organization |
| GET | `/api/v1/settings/users` | List users | settings.read.users |
| POST | `/api/v1/settings/users` | Create user | settings.create.users |
| PUT | `/api/v1/settings/users/:id` | Update user | settings.update.users |
| DELETE | `/api/v1/settings/users/:id` | Deactivate user | settings.delete.users |
| GET | `/api/v1/settings/roles` | List roles | settings.read.roles |
| POST | `/api/v1/settings/roles` | Create role | settings.create.roles |
| PUT | `/api/v1/settings/roles/:id` | Update role | settings.update.roles |
| GET/PUT | `/api/v1/settings/roles/:id/permissions` | Manage permissions | settings.update.roles |
| GET | `/api/v1/settings/workflows` | List workflows | settings.read.workflows |
| POST | `/api/v1/settings/workflows` | Create workflow | settings.create.workflows |
| PUT | `/api/v1/settings/workflows/:id` | Update workflow | settings.update.workflows |
| GET | `/api/v1/settings/notifications/settings` | Get notification prefs | settings.read.notifications |
| PUT | `/api/v1/settings/notifications/settings` | Update prefs | settings.update.notifications |
| GET | `/api/v1/settings/system` | Get system config | settings.read.system |
| PUT | `/api/v1/settings/system` | Update config | settings.update.system |
| GET | `/api/v1/settings/number-sequences` | List sequences | settings.read.system |
| PUT | `/api/v1/settings/number-sequences` | Update sequences | settings.update.system |
| GET | `/api/v1/settings/backup` | List backups | settings.read.backup |
| POST | `/api/v1/settings/backup` | Trigger manual backup | settings.create.backup |
| **Webhooks** | | | |
| GET | `/api/v1/settings/webhooks` | List webhook endpoints | settings.read.webhooks |
| POST | `/api/v1/settings/webhooks` | Create webhook endpoint | settings.create.webhooks |
| PUT | `/api/v1/settings/webhooks/:id` | Update endpoint | settings.update.webhooks |
| DELETE | `/api/v1/settings/webhooks/:id` | Delete endpoint | settings.delete.webhooks |
| GET | `/api/v1/settings/webhooks/:id/deliveries` | View delivery history | settings.read.webhooks |
| POST | `/api/v1/settings/webhooks/:id/test` | Send test event | settings.update.webhooks |
| **Data Export** | | | |
| POST | `/api/v1/settings/data-export` | Request data export | settings.create.data-export |
| GET | `/api/v1/settings/data-export` | List export requests | settings.read.data-export |
| GET | `/api/v1/settings/data-export/:id/download` | Download export file | settings.read.data-export |
| **Data Retention** | | | |
| GET | `/api/v1/settings/data-retention` | Get retention policies | settings.read.data-retention |
| PUT | `/api/v1/settings/data-retention` | Update retention policies | settings.update.data-retention |

**Total: ~180+ API endpoints covering all 76 features with full CRUD**

---

## 7. Implementation Phases

### Phase 1: Foundation & SaaS Core (Week 1-4)
**Priority: Must-have infrastructure before any feature**

> **Architecture adopted from LMS project** — custom JWT, subscription guard, storage adapters, payment factory

**1a. Database & Core (Week 1)** ✅ completed ✅ tested
1. ✅ completed ✅ tested — Prisma schema (15 files, 116+ models, validated, db push successful)
2. ✅ completed ✅ tested — Seed data (super admin, 4 plans, 18 features, 456 permissions)
3. ✅ completed ✅ tested — Prisma client singleton (`lib/db.ts` with PG adapter for Prisma 7)

**1b. Auth System (Week 1-2)** ✅ completed ✅ tested
4. ✅ completed ✅ tested — Custom JWT auth with `jose` (access 15m, refresh 7d, super admin 8h)
5. ✅ completed ✅ tested — Password hashing with `bcryptjs` (login + wrong password rejection)
6. ✅ completed ✅ tested — `RefreshToken` DB-backed token management (revocable)
7. ✅ completed ✅ tested — Login API (org slug resolution, failed login count, account lock after 5 fails)
8. ✅ completed — Token refresh API (`/api/v1/auth/refresh`)
9. ✅ completed ✅ tested — Auth helpers: `requireRole()`, `getOrganizationId()`, `getCurrentUser()`
10. ✅ completed ✅ tested — Multi-tenant middleware (orgId from JWT, unauthorized rejection)
11. ✅ completed — Subscription Guard middleware (FULL/READ_ONLY/BLOCKED)
12. ✅ completed — Permission Guard middleware (RBAC check per route)

> **End-to-end tests passed (2026-03-25):**
> - ✅ Health check → DB connected
> - ✅ Register org (org + admin + trial subscription + 34 number sequences created)
> - ✅ Login with org slug → access + refresh tokens
> - ✅ GET /me with Bearer token → user + org + role data
> - ✅ Wrong password → "Invalid email or password"
> - ✅ Wrong org slug → "Organization not found"
> - ✅ Duplicate slug → 409 "Organization slug already taken"
> - ✅ No auth → 401 "Unauthorized"
> - ✅ Super Admin login → separate JWT (8h)
> - ✅ Super Admin /me → profile + platform stats (1 org, 1 user)

**1c. Super Admin Panel — APIs (Week 2-3)** ✅ completed ✅ tested
13. ✅ completed ✅ tested — Super Admin auth (separate JWT, 8hr expiry)
14. ✅ completed ✅ tested — Super Admin UI (login, dashboard, organizations, plans, subscriptions, media settings, domains, audit log — 8 pages, all 200 OK)
15. ✅ completed ✅ tested — Organization CRUD APIs (list/get/create/update/suspend/activate)
16. ✅ completed ✅ tested — Subscription Plan + PlatformFeature CRUD APIs
17. ✅ completed ✅ tested — TenantSubscription management API (list, get, update plan/status)
18. ✅ completed — Media Settings API (GET masked, PUT upsert, POST test connection)
19. ✅ completed — Domain management API (list domains, verify/revoke)
20. ✅ completed — Impersonation API (start/end session with JWT)
21. ✅ completed ✅ tested — Super Admin audit log API (paginated, filterable)

> **End-to-end tests passed (2026-03-25):**
> - ✅ List orgs → 1 org with subscription + plan + user count + storage stats
> - ✅ Get org by ID → full details with 34 number sequences, 0 fiscal years
> - ✅ Suspend org → isActive=false, reason logged to audit
> - ✅ Activate org → isActive=true, logged to audit
> - ✅ List plans → 4 plans (Free/Starter/Professional/Enterprise)
> - ✅ List features → 18 platform features across all modules
> - ✅ List subscriptions → 1 TRIAL subscription on Starter plan
> - ✅ Audit log → 5 entries (login, suspend, activate) with timestamps

**1d. SaaS Signup & Tenant Setup — APIs (Week 3)** ✅ completed ✅ tested
22. ✅ completed ✅ tested — Register API (org + admin + trial + 34 number sequences)
23. ✅ completed ✅ tested — Login page UI
24. ✅ completed ✅ tested — Forgot password flow (API: forgot + reset, UI: forgot-password + reset-password pages, token-based reset with 1hr expiry)
25. ✅ completed ✅ tested — Tenant Settings APIs: Organization GET/PUT, User CRUD, Role CRUD, Role Permissions
26. ✅ completed ✅ tested — Domain Configuration API (set/get/delete domain, verify stub)

> **End-to-end tests passed (2026-03-25):**
> - ✅ Get org settings → name, slug, currency, timezone
> - ✅ Update org → address, district, phone updated
> - ✅ List users → 1 admin user with role name
> - ✅ List roles → ADMIN role with 456 permissions, 1 user
> - ✅ Create role "FINANCE_OFFICER" → created with 0 permissions
> - ✅ Create user "Nasreen Akhter" with FINANCE_OFFICER role → success
> - ✅ Set custom domain "erp.shaplango.org" → domainVerified=false
> - ✅ Get domain config → shows domain and slug
> - ✅ Login as new user (nasreen@shapla.org) → JWT with FINANCE_OFFICER role

**1e. Core Infrastructure (Week 3-4)** ✅ completed (core libs)
27. ✅ completed — Tenant Audit Trail system (`lib/audit.ts` — logAudit + getAuditContext)
28. ✅ completed — Number Sequence generator (`lib/number-sequence.ts` — atomic increment, preview, reset)
29. ✅ completed — Approval Workflow engine (`lib/approval-engine.ts` — start, process, amount-based step routing)
30. ✅ completed — File storage adapter pattern (`lib/storage/` — LocalStorage + R2Storage + Factory)
31. ✅ completed — Storage quota service (`lib/storage/storage-service.ts` — upload, delete, quota check, 80%/90% warnings)
32. Payment gateway factory (deferred — needed when SaaS billing is active)
33. ✅ completed — Webhook retry via cron (`/api/v1/cron/webhook-retry`)
34. ✅ completed — API response helpers (`lib/api-response.ts`)
35. ✅ completed — Shared UI components (7 components: DataTable, StatusBadge, WorkflowStatusBar, EntityCombobox, DateRangePicker, FormStepper, ConfirmDialog)
36. ✅ completed — Cron job endpoints (8 cron jobs: subscription-check, grace-period, bandwidth-reset, storage-warnings, loan-overdue, webhook-retry, data-retention, invoice-generation)

### Phase 2: Core Finance (Week 4-6) ✅ completed ✅ tested
**Priority: Finance is the backbone — everything else builds on it**

1. ✅ completed ✅ tested — Fiscal Year & Period management (auto-creates 12 monthly periods)
2. ✅ completed ✅ tested — Chart of Accounts (hierarchical CRUD, 5-level tree, parent/child validation)
3. ✅ completed — Currency & Exchange Rates
4. ✅ completed ✅ tested — Journal Entries (multi-line, debit=credit validation, posting with approval)
5. ✅ completed — Voucher Management (DV/RV/CV/BV/JV, auto-numbering, approve/reject)
6. ✅ completed — Bank Account Management
7. ✅ completed — Bank & Cash overview (via bank-accounts list API)
8. ✅ completed — Bank Reconciliation (start, match items, reconcile)
9. ✅ completed ✅ tested — Financial Reports (Trial Balance, Income Statement, Balance Sheet, Cash Flow, Fund Position)

> **End-to-end tests passed (2026-03-25):**
> - ✅ Create fiscal year "FY 2025-2026" → 12 monthly periods auto-created, isCurrent=true
> - ✅ Create chart of accounts → 7 accounts (Assets→Bank→Sonali, Income→Grant, Expense→Salary) with hierarchy levels 1-3
> - ✅ Account tree → 3 root nodes with nested children
> - ✅ Create JE-2026-001 (Fund Receipt BDT 50,00,000) → debit=credit validated, auto-numbered
> - ✅ Create JE-2026-002 (Salary BDT 2,50,000) → auto-numbered
> - ✅ Post both JEs → status=APPROVED, postedAt set
> - ✅ Trial Balance → Debit 52,50,000 = Credit 52,50,000 (isBalanced=true)
> - ✅ Income Statement → Income 50,00,000 - Expenses 2,50,000 = Surplus 47,50,000
> - ✅ Balance Sheet → isBalanced=true
> - ✅ Unbalanced JE rejected → "Total debit (100) must equal total credit (200)"

### Phase 3: Budget & Donor (Week 7-9) ✅ completed ✅ tested
**Priority: Required for project-level tracking**

1. ✅ completed ✅ tested — Budget CRUD with line items (line total validation)
2. ✅ completed ✅ tested — Budget vs Actual (pulls from approved JE actuals, utilization %)
3. ✅ completed — Budget Revision workflow (auto-numbering, approve → apply to budget lines)
4. ✅ completed — Cost Allocation (rules + apply with % validation)
5. ✅ completed ✅ tested — Donor Directory (5 donors: USAID, World Bank, UNICEF, DFID, EU)
6. ✅ completed ✅ tested — Grant Registry & Lifecycle (4 grants, forward-only stage progression)
7. ✅ completed ✅ tested — Fund Receipts (with auto JE on confirm, exchange rate conversion)
8. ✅ completed — Fund Requisitions (with approval, grant balance check)
9. ✅ completed — Donor Report tracking (type/status/due date management)

> **Seed data (Phase 3):** 5 Donors, 4 Grants, 4 Projects, 1 Budget (5 lines, BDT 75L), 1 Bank Account, 2 Fund Receipts
>
> **End-to-end tests passed (2026-03-25):**
> - ✅ List 5 donors with type and totalFunded
> - ✅ List 4 grants (3 ACTIVE, 1 PIPELINE) with auto-generated grantNo
> - ✅ Budget "WASH Phase-3" with 5 line items totaling BDT 75,00,000
> - ✅ Budget vs Actual → 0% utilization (no expenditure JEs yet — correct)
> - ✅ 2 Fund Receipts (BDT 50L + 20L) both CONFIRMED
> - ✅ Fund Position report → working (needs grant-tagged JEs for data)

### Phase 4: Project & Beneficiary (Week 10-12) ✅ completed ✅ tested
**Priority: Core program management**

1. ✅ completed ✅ tested — Project CRUD with team management (auto-numbered, team add/remove)
2. ✅ completed ✅ tested — Project Dashboard (portfolio analytics, burnRate, activityCompletion)
3. ✅ completed ✅ tested — Activity Planning (WBS, sub-activities, auto-complete on 100% progress)
4. ✅ completed ✅ tested — Milestone Tracking (auto-actualDate on ACHIEVED)
5. ✅ completed ✅ tested — LogFrame (4-level hierarchy: Goal→Purpose→Output→Activity, full CRUD UI)
6. ✅ completed ✅ tested — Project Closeout (8 default checklist items, auto-progress calculation, full CRUD UI)
7. ✅ completed ✅ tested — Beneficiary Registry (NID uniqueness, district filter)
8. ✅ completed ✅ tested — Program Enrollment (duplicate check, graduated/dropout tracking)
9. ✅ completed ✅ tested — Service Delivery tracking (5 types, quantity/value)
10. ✅ completed ✅ tested — Impact Assessment (baseline→target→current, auto achievementPct)
11. ✅ completed ✅ tested — Grievance Management (auto-resolutionDate on RESOLVED)

#### Phase 4b: Project Management — International-Grade Upgrade (2026-03-30) ✅ completed ✅ tested

12. ✅ completed ✅ tested — Project model intl fields (projectType, sector, currency, country, region, implementingPartner)
13. ✅ completed ✅ tested — 7 new enums (ProjectType, ProjectSector, RiskLikelihood, RiskImpact, RiskCategory, IndicatorType, IndicatorFrequency)
14. ✅ completed ✅ tested — ProjectIndicator model (results framework: baseline→target→current, frequency, disaggregation)
15. ✅ completed ✅ tested — ProjectRisk model (risk register: category, likelihood×impact=score, mitigation, owner)
16. ✅ completed ✅ tested — DELETE project API (soft-delete, PIPELINE only)
17. ✅ completed ✅ tested — Indicators CRUD API (GET/POST/PUT/DELETE)
18. ✅ completed ✅ tested — Risks CRUD API (GET/POST/PUT/DELETE, auto-compute riskScore)
19. ✅ completed ✅ tested — Enhanced Dashboard API (real data: per-project burnRate, activityCompletion, milestones, team count)
20. ✅ completed ✅ tested — 9 UI pages rebuilt/created: List, Create, Detail, Dashboard, Activities, Milestones, LogFrame, Indicators (new), Risks (new), Closeout — all with full CRUD dialogs
21. ✅ completed ✅ tested — International seed data: 6 projects across Kenya, Jordan, Nepal, Niger, Bangladesh, Uganda (multi-currency USD/EUR)
22. ✅ completed ✅ tested — Sidebar nav updated: 8 sub-pages (added Indicators & Results, Risk Register)
23. ✅ completed ✅ tested — Full EN + BN translations for all new features (types, sectors, risk categories, indicator labels)

> **Seed data (Phase 4):** 6 International Projects, 6 Activities, 4 Milestones, 5 Project Indicators, 6 Project Risks, 6 LogFrame Entries, 8 Beneficiaries, 7 Enrollments, 5 Services, 4 Impact Indicators, 3 Assessments, 2 Grievances
>
> **End-to-end tests passed (2026-03-30):**
> - ✅ 6 Projects listed (5 ACTIVE, 1 PIPELINE) — multi-country (Kenya, Jordan, Nepal, Niger, Bangladesh, Uganda)
> - ✅ Dashboard: Active:5, Pipeline:1, Budget:$16.2M, Spent:$3.49M, Avg:29%, Activities:6 (done:1, delayed:1)
> - ✅ WASH Activities: 4 items (1 COMPLETED 100%, 2 IN_PROGRESS, 1 PLANNED) with actualCost tracking
> - ✅ WASH Milestones: 3 items (1 ACHIEVED with actualDate 2026-01-28, 2 ON_TRACK)
> - ✅ WASH Indicators: 3 items (HH safe water B:1200→T:5000→C:2875, Hygiene B:30→T:85→C:52, Water quality B:45→T:95→C:78)
> - ✅ WASH Risks: 3 items (Drought Score:16 OPEN, Supply chain Score:9 MITIGATED, Community resistance Score:8 OPEN)
> - ✅ WASH LogFrame: 6 entries (1 GOAL, 1 PURPOSE, 2 OUTPUT, 2 ACTIVITY)
> - ✅ Project Detail: type, sector, currency, country, region, partner, grants, team counts
> - ✅ All 9 pages render 200 OK: list, new, dashboard, activities, milestones, logframe, indicators, risks, closeout
> - ✅ 8 Beneficiaries, 7 Enrollments, 5 Services, 3 Impact Assessments, 2 Grievances

### Phase 5: Operations (Week 13-16) ✅ completed ✅ tested
**Priority: Supporting operations — Procurement, Assets, HR, Microfinance (merged Phases 5-7)**

**Procurement (20 APIs):**
1. ✅ completed ✅ tested — Vendor Management (CRUD, ratings, auto vendorNo)
2. ✅ completed — Purchase Requisition (with lines, budget validation, approve)
3. ✅ completed — Purchase Orders (with lines, linked to vendor)
4. ✅ completed — eTendering & Bid Management (bids, scoring, award)
5. ✅ completed — Contract Management (CRUD, auto contractNo)
6. ✅ completed — Goods Receipt (with lines, PO status update, stock update)
7. ✅ completed ✅ tested — Inventory Management (stock levels, IN_STOCK/LOW_STOCK/OUT_OF_STOCK)
8. ✅ completed ✅ tested — Warehouse Management (multi-location)

**Fixed Assets (13 APIs):**
9. ✅ completed ✅ tested — Asset Categories & Depreciation config (SL/DB methods)
10. ✅ completed ✅ tested — Asset Register (CRUD, condition, donor/project tracking)
11. ✅ completed — Asset Depreciation (monthly calculation, NBV update)
12. ✅ completed — Asset Transfer (approve + receive flow)
13. ✅ completed — Asset Maintenance (preventive/corrective/emergency)
14. ✅ completed — Asset Disposal (approve, mark DISPOSED)

**Human Resources (21 APIs):**
15. ✅ completed ✅ tested — Department & Designation (hierarchy, employee count)
16. ✅ completed ✅ tested — Employee Directory (auto employeeNo, salary, reporting)
17. ✅ completed — Onboarding Checklist
18. ✅ completed — Attendance Management (daily + monthly summary)
19. ✅ completed ✅ tested — Leave Types & Leave Balance (BLA 2006 compliant)
20. ✅ completed — Leave Application (balance check + approve)
21. ✅ completed — Payroll Processing (gross/deductions/net + approve)
22. ✅ completed — Performance Reviews (self + supervisor score, rating)
23. ✅ completed — Training Management (participants)
24. ✅ completed — Org Chart (department hierarchy tree)

**Microfinance (21 APIs):**
25. ✅ completed — Branch Management
26. ✅ completed ✅ tested — Samity/Group Management (meeting schedule, member count)
27. ✅ completed — Member Management (links to Beneficiary)
28. ✅ completed ✅ tested — Loan Product Configuration (MRA ≤24% rate validation)
29. ✅ completed — Loan Applications (approve → create account with EMI calculation)
30. ✅ completed ✅ tested — Loan Accounts (principal, outstanding, installment tracking)
31. ✅ completed — Loan Disbursement (status update)
32. ✅ completed — Repayment Collection (balance update, auto-close on full payment)
33. ✅ completed — Collection Sheet
34. ✅ completed ✅ tested — Savings Accounts & Transactions (deposit/withdraw, balance check)
35. ✅ completed — Overdue Management (classification: Regular→Watch→Substandard→Doubtful→Bad)
36. ✅ completed — MRA Reports (CDF-1 monthly return, portfolio quality PAR analysis)

> **Seed data (Phase 5):** 3 Vendors, 2 Warehouses, 3 Inventory Items, 3 Asset Categories, 4 Assets, 5 Departments, 7 Designations, 6 Employees, 5 Leave Types, 2 Branches, 2 Samities, 5 MFI Members, 2 Loan Products, 1 Loan Account, 3 Savings Accounts
>
> **End-to-end tests passed (2026-03-25):**
> - ✅ 3 Vendors (TechBD 4.5★, Bengal Scientific 4.2★, Rahman Construction 3.8★)
> - ✅ 2 Warehouses (Dhaka HQ + Sylhet Field)
> - ✅ Inventory: 3 items (IN_STOCK, LOW_STOCK, OUT_OF_STOCK)
> - ✅ Asset Categories: Vehicles 20%, IT 33.33%, Furniture 10%
> - ✅ 4 Assets (Toyota Hilux NBV 15L, 2 Laptops, Conference Table)
> - ✅ 5 Departments with employee counts
> - ✅ 6 Employees (salary 40K-85K, FT + Contract)
> - ✅ 5 Leave Types (AL 15d, CL 10d, SL 14d, ML 112d, WP)
> - ✅ 2 Samities (Shapla 3 members, Padma 2 members)
> - ✅ 2 Loan Products (Jagoron IGA 20%, Krishi 18%)
> - ✅ 1 Active Loan (50K principal, 46.35K outstanding)
> - ✅ 3 Savings Accounts (2 compulsory, 1 voluntary)

### Phase 6 (was 8): Reports & Dashboard (Week 23-25) ✅ completed ✅ tested
**Priority: Analytics and compliance**

1. ✅ completed ✅ tested — Dashboard Overview (8 KPIs, 6 charts, recent transactions, upcoming deadlines)
2. ✅ completed — Dashboard Analytics (year-over-year, top projects, budget utilization)
3. ✅ completed ✅ tested — Activity Feed (from TenantAuditLog, paginated, filterable)
4. ✅ completed ✅ tested — NGOAB Reports (FD-1 to FD-6: project registration, fund release, progress, personnel, assets, audit)
5. ✅ completed ✅ tested — Donor Reports (per-donor, per-grant, portfolio summary)
6. ✅ completed — Project Reports (per-project detail, portfolio summary)
7. ✅ completed — HR Reports (staff-list, attendance-summary, leave-balance, payroll-register, training, turnover)
8. ✅ completed ✅ tested — Procurement Reports (PO summary, vendor performance, contracts, inventory valuation)
9. ✅ completed ✅ tested — Custom Reports (available reports listing)
10. ✅ completed ✅ tested — Audit Trail viewer (Fix 9)
11. Notification system (deferred — email integration needed)
12. Notification Settings (deferred)

> **End-to-end tests passed (2026-03-25):**
> - ✅ Dashboard KPIs: Fund received BDT 70L, utilized BDT 50K (0.71%), 3 active projects, 6 beneficiaries, 6 staff
> - ✅ Fund by Project chart: 4 projects with budget data
> - ✅ Donor Contributions: USAID 1.5Cr, UNICEF 1.2Cr, WB 85L
> - ✅ Activity Feed: 3 entries (voucher approve, create, JE create)
> - ✅ NGOAB FD-1: 4 grants listed with NGOAB reference numbers
> - ✅ NGOAB FD-5: 4 assets with values
> - ✅ Donor Report: 5 donors with totalFunded and activeGrants
> - ✅ Procurement: 3 vendors ranked by rating, inventory valuation BDT 7.95L (1 in-stock, 1 low, 1 out)
> - ✅ Custom Reports: 6 report categories listed

### Phase 7 (was 9): UI Pages ✅ completed ✅ tested
**Priority: User-facing interface**

**Shared Components (7):** ✅ completed
- DataTable (TanStack React Table — search, sort, paginate, row click)
- StatusBadge (60+ statuses with semantic colors)
- WorkflowStatusBar (Odoo-style pipeline)
- EntityCombobox (searchable entity linker)
- DateRangePicker (with presets: This Month, Last Quarter, etc.)
- FormStepper (multi-step form wizard)
- ConfirmDialog (destructive action confirmation)

**Auth Pages (2):** ✅ completed ✅ tested (200 OK)
- Login (org slug + email + password, show/hide toggle, error display)
- Register (2-step: org info → admin user, auto-slug, password policy errors)

**Module Pages (19):** ✅ completed ✅ tested (all 200 OK)
- Dashboard (live KPIs, 4 charts, recent transactions, upcoming deadlines)
- Finance: Chart of Accounts (tree view), Journal Entries (DataTable), Vouchers (DataTable)
- Budget List (with utilization progress bar)
- Donors Directory + Grants Registry
- Projects (DataTable with inline progress bar)
- Beneficiaries (with enrollment count)
- Procurement: Vendors (with rating), Inventory (stock status)
- Assets (with NBV and condition)
- HR: Employees (with department/designation), Leave Management
- Microfinance: Samity, Loan Applications
- Reports: Financial (5 report cards), NGOAB (FD-1 to FD-6 cards)
- Settings: Organization (read/edit toggle)

> **All 21 pages verified rendering 200 OK (2026-03-25)**

### Remaining (Deferred to Post-Launch)

1. Backup & Logs management UI
2. Export to CSV/Excel/PDF across all modules
3. Breadcrumb navigation (dynamic from pathname)
4. ✅ completed — Error pages (404 not-found + 500 error with retry)
5. Performance optimization (caching)
6. Deployment to VPS (PM2, Nginx, SSL)
7. Email notification system
8. PDF report generation
9. i18n (Bangla/English)

### Phase 8: HR & Payroll — International-Grade Upgrade ✅ completed ✅ seeded

> **Priority: Transform basic HR into a world-class NGO HR & Payroll system**
> **Benchmarks: BambooHR, SAP SuccessFactors, OrangeHRM, Odoo HR, Unit4 ERP for nonprofits**
> **Built:** 12 Prisma models, 37 API routes (34 auth + 3 public), 22 UI pages, full i18n (EN+BN), seed data

#### 8.1 Recruitment & Talent Acquisition (ATS) ✅ completed

**New Prisma Models:**

```prisma
// ─── recruitment.prisma ───

enum JobPostingStatus {
  DRAFT
  PUBLISHED
  CLOSED
  CANCELLED
  ON_HOLD
}

enum ApplicationStatus {
  APPLIED
  SCREENED
  SHORTLISTED
  TECHNICAL_TEST
  INTERVIEW
  REFERENCE_CHECK
  OFFER
  HIRED
  REJECTED
  WITHDRAWN
}

enum InterviewStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
  NO_SHOW
}

model JobPosting {
  id              String           @id @default(uuid()) @db.Uuid
  organizationId  String           @db.Uuid
  postingNo       String           @unique // auto: "JOB-001"
  title           String
  slug            String           @unique // URL-friendly: "senior-program-officer-dhaka"
  departmentId    String           @db.Uuid
  designationId   String?          @db.Uuid
  reportingToId   String?          @db.Uuid // Hiring manager
  employmentType  EmploymentType   @default(FULL_TIME)
  location        String           // Duty station
  isRemote        Boolean          @default(false)
  vacancies       Int              @default(1)

  // Compensation
  salaryMin       Decimal?         @db.Decimal(18, 2)
  salaryMax       Decimal?         @db.Decimal(18, 2)
  currency        String           @default("BDT")
  showSalary      Boolean          @default(false) // Show salary range publicly

  // Description
  description     String           // Rich text - job overview
  responsibilities String          // Rich text - key responsibilities
  qualifications  String           // Rich text - required qualifications
  preferredSkills String?          // Rich text - nice-to-have
  benefits        String?          // Rich text - benefits/perks

  // Requirements (structured for auto-scoring)
  minEducation    String?          // "Masters", "Bachelors", etc.
  minExperience   Int?             // Minimum years of experience
  requiredSkills  Json?            // ["project-management", "M&E", "report-writing"]
  requiredLanguages Json?          // [{"language": "English", "level": "Fluent"}, {"language": "Bangla", "level": "Native"}]
  certifications  Json?            // ["PMP", "CPA"] - required certifications

  // Funding
  projectId       String?          @db.Uuid // Donor-funded position
  grantId         String?          @db.Uuid // Linked grant

  // Dates
  publishedAt     DateTime?
  applicationDeadline DateTime
  expectedStartDate DateTime?

  // Settings
  status          JobPostingStatus @default(DRAFT)
  isInternal      Boolean          @default(false) // Internal-only posting
  allowInternalApplicants Boolean  @default(true)
  requireCoverLetter Boolean      @default(false)
  customQuestions  Json?            // [{question, type: "text"|"select"|"yesno", required, options}]

  createdById     String           @db.Uuid
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  organization    Organization     @relation(fields: [organizationId], references: [id])
  department      Department       @relation(fields: [departmentId], references: [id])
  applications    JobApplication[]

  @@unique([organizationId, postingNo])
  @@index([organizationId])
  @@index([status])
  @@index([slug])
  @@index([applicationDeadline])
}

model JobApplication {
  id              String            @id @default(uuid()) @db.Uuid
  applicationNo   String            @unique // auto: "APP-001"
  jobPostingId    String            @db.Uuid
  organizationId  String            @db.Uuid

  // Applicant info (external applicants don't have Employee record)
  applicantName   String
  applicantEmail  String
  applicantPhone  String?
  applicantAddress String?

  // Internal applicant
  isInternal      Boolean           @default(false)
  employeeId      String?           @db.Uuid // If internal applicant

  // CV & Documents
  cvFilePath      String?           // Uploaded CV/resume
  coverLetterPath String?           // Uploaded cover letter
  additionalDocs  Json?             // [{name, filePath}]

  // Parsed CV data (AI-extracted)
  parsedEducation Json?             // [{degree, institution, year, field}]
  parsedExperience Json?            // [{title, organization, startDate, endDate, description}]
  parsedSkills    Json?             // ["skill1", "skill2"]
  parsedLanguages Json?             // [{language, level}]
  parsedCertifications Json?        // ["cert1", "cert2"]
  totalExperienceYears Decimal?     @db.Decimal(4, 1)

  // Custom question responses
  customResponses Json?             // [{questionId, answer}]

  // Scoring
  autoScore       Decimal?          @db.Decimal(5, 2) // 0-100 auto-calculated score
  manualScore     Decimal?          @db.Decimal(5, 2) // HR manual score
  finalScore      Decimal?          @db.Decimal(5, 2) // Weighted final score
  scoreBreakdown  Json?             // {education: 25, experience: 30, skills: 20, languages: 15, certifications: 10}

  // Pipeline
  status          ApplicationStatus @default(APPLIED)
  stage           String            @default("APPLIED") // Current pipeline stage
  rejectionReason String?
  notes           String?           // Internal notes

  // Offer
  offeredSalary   Decimal?          @db.Decimal(18, 2)
  offerLetterPath String?
  offerAcceptedAt DateTime?
  offerDeclinedAt DateTime?

  appliedAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  jobPosting      JobPosting        @relation(fields: [jobPostingId], references: [id])
  interviews      Interview[]
  evaluations     ApplicationEvaluation[]

  @@unique([jobPostingId, applicantEmail]) // One application per email per job
  @@index([organizationId])
  @@index([jobPostingId])
  @@index([status])
  @@index([autoScore])
}

model Interview {
  id              String          @id @default(uuid()) @db.Uuid
  applicationId   String          @db.Uuid
  interviewType   String          // "PHONE_SCREEN", "TECHNICAL", "HR", "PANEL", "FINAL"
  scheduledAt     DateTime
  durationMinutes Int             @default(60)
  location        String?         // Physical location or video link
  isVirtual       Boolean         @default(false)
  meetingLink     String?         // Zoom/Teams link

  status          InterviewStatus @default(SCHEDULED)
  interviewerNotes String?
  overallRating   Decimal?        @db.Decimal(3, 1) // 1.0-5.0
  recommendation  String?         // "STRONG_YES", "YES", "MAYBE", "NO", "STRONG_NO"
  completedAt     DateTime?

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  application     JobApplication  @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  panelMembers    InterviewPanel[]

  @@index([applicationId])
  @@index([scheduledAt])
}

model InterviewPanel {
  id            String    @id @default(uuid()) @db.Uuid
  interviewId   String    @db.Uuid
  interviewerId String    @db.Uuid // Employee ID
  role          String    // "LEAD", "TECHNICAL", "HR", "OBSERVER"
  score         Decimal?  @db.Decimal(3, 1)
  feedback      String?
  submittedAt   DateTime?

  interview     Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)

  @@unique([interviewId, interviewerId])
  @@index([interviewId])
}

model ApplicationEvaluation {
  id            String    @id @default(uuid()) @db.Uuid
  applicationId String    @db.Uuid
  evaluatorId   String    @db.Uuid // Employee ID
  criteria      String    // "technical_skills", "communication", "experience_fit", "cultural_fit"
  score         Decimal   @db.Decimal(3, 1) // 1.0-5.0
  comments      String?
  createdAt     DateTime  @default(now())

  application   JobApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@unique([applicationId, evaluatorId, criteria])
  @@index([applicationId])
}
```

**API Endpoints (Recruitment — 18 APIs):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/recruitment/jobs` | List job postings (filter: status, department, type) |
| POST | `/api/v1/hr/recruitment/jobs` | Create job posting (auto postingNo, slug generation) |
| GET | `/api/v1/hr/recruitment/jobs/:id` | Job posting detail |
| PATCH | `/api/v1/hr/recruitment/jobs/:id` | Update job posting |
| POST | `/api/v1/hr/recruitment/jobs/:id/publish` | Publish job (set status=PUBLISHED, publishedAt=now) |
| POST | `/api/v1/hr/recruitment/jobs/:id/close` | Close job posting |
| GET | `/api/v1/hr/recruitment/jobs/:id/applications` | List applications for a job (sort by score) |
| POST | `/api/v1/hr/recruitment/applications` | Submit application (internal) |
| GET | `/api/v1/hr/recruitment/applications/:id` | Application detail with parsed CV data |
| PATCH | `/api/v1/hr/recruitment/applications/:id` | Update application (status, notes, score) |
| POST | `/api/v1/hr/recruitment/applications/:id/score` | Auto-score application against job requirements |
| POST | `/api/v1/hr/recruitment/applications/:id/advance` | Advance to next pipeline stage |
| POST | `/api/v1/hr/recruitment/applications/:id/reject` | Reject application with reason |
| POST | `/api/v1/hr/recruitment/applications/:id/offer` | Generate offer for applicant |
| GET | `/api/v1/hr/recruitment/interviews` | List interviews (filter: date range, status) |
| POST | `/api/v1/hr/recruitment/interviews` | Schedule interview |
| PATCH | `/api/v1/hr/recruitment/interviews/:id` | Update interview (score, notes, status) |
| GET | `/api/v1/hr/recruitment/analytics` | Recruitment analytics (time-to-hire, source, pipeline funnel) |

**Public Career Page (No Auth Required):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/careers/:orgSlug` | Public career page — lists all PUBLISHED jobs for org |
| GET | `/careers/:orgSlug/:jobSlug` | Public job detail with apply button |
| POST | `/api/v1/public/careers/:orgSlug/:jobSlug/apply` | Public application submission (with CV upload) |

**UI Pages:**

| Page | Route | Description |
|------|-------|-------------|
| Job Postings List | `/hr/recruitment` | All job postings with status filter, pipeline stats |
| Create Job Posting | `/hr/recruitment/new` | Form: title, description, requirements, scoring criteria |
| Job Posting Detail | `/hr/recruitment/:id` | View posting with application pipeline Kanban board |
| Application Detail | `/hr/recruitment/applications/:id` | Applicant profile, CV viewer, score breakdown, interview history |
| Interview Calendar | `/hr/recruitment/interviews` | Calendar view of scheduled interviews |
| Recruitment Dashboard | `/hr/recruitment/dashboard` | Analytics: time-to-fill, pipeline funnel, source effectiveness |
| Public Career Page | `/careers/:orgSlug` | Branded career portal (public, no auth) |
| Public Job Detail | `/careers/:orgSlug/:jobSlug` | Job detail + application form (public) |

#### 8.2 Contract Management ✅ completed

**New Prisma Models:**

```prisma
enum ContractStatus {
  DRAFT
  ACTIVE
  EXPIRING_SOON // Auto-set when within 30 days of end
  EXPIRED
  RENEWED
  TERMINATED
}

model EmployeeContract {
  id              String         @id @default(uuid()) @db.Uuid
  organizationId  String         @db.Uuid
  contractNo      String         @unique // auto: "CTR-001"
  employeeId      String         @db.Uuid
  contractType    EmploymentType // FULL_TIME, CONTRACT, CONSULTANT, INTERN, VOLUNTEER
  title           String         // "Senior Program Officer - Contract Extension"
  startDate       DateTime
  endDate         DateTime?      // Null for permanent
  probationEndDate DateTime?

  // Compensation
  basicSalary     Decimal        @db.Decimal(18, 2)
  currency        String         @default("BDT")
  salaryComponents Json?         // [{component, amount, isPercentage}]

  // Funding
  projectId       String?        @db.Uuid
  grantId         String?        @db.Uuid
  costCenter      String?

  // Documents
  contractFilePath String?       // Uploaded signed contract
  amendments      Json?          // [{date, description, filePath}]

  // Renewal
  isRenewable     Boolean        @default(true)
  renewalNotice   Int            @default(30) // Days before end to notify
  previousContractId String?     @db.Uuid // Chain of renewals

  // Termination
  terminatedAt    DateTime?
  terminationReason String?
  noticePeriodDays Int           @default(30)

  status          ContractStatus @default(DRAFT)
  notes           String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  employee        Employee       @relation(fields: [employeeId], references: [id])

  @@index([organizationId])
  @@index([employeeId])
  @@index([status])
  @@index([endDate])
}
```

**API Endpoints (Contract — 8 APIs):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/contracts` | List contracts (filter: status, expiring-soon, employee) |
| POST | `/api/v1/hr/contracts` | Create contract |
| GET | `/api/v1/hr/contracts/:id` | Contract detail |
| PATCH | `/api/v1/hr/contracts/:id` | Update contract |
| POST | `/api/v1/hr/contracts/:id/renew` | Renew contract (creates new, links previous) |
| POST | `/api/v1/hr/contracts/:id/terminate` | Terminate contract |
| GET | `/api/v1/hr/contracts/expiring` | Contracts expiring within N days |
| GET | `/api/v1/hr/contracts/employee/:employeeId` | Contract history for employee |

**UI Pages:**

| Page | Route | Description |
|------|-------|-------------|
| Contracts List | `/hr/contracts` | All contracts with expiry alerts, status filter |
| Contract Detail | `/hr/contracts/:id` | Full contract view, amendment history, renewal chain |
| Create/Renew Contract | `/hr/contracts/new` | Contract form with salary components |

#### 8.3 Offboarding & Exit Management ✅ completed

**New Prisma Models:**

```prisma
enum OffboardingStatus {
  INITIATED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum SeparationType {
  RESIGNATION
  TERMINATION
  END_OF_CONTRACT
  RETIREMENT
  REDUNDANCY
  MUTUAL_SEPARATION
  DEATH_IN_SERVICE
}

model Offboarding {
  id              String             @id @default(uuid()) @db.Uuid
  organizationId  String             @db.Uuid
  offboardingNo   String             @unique // auto: "EXIT-001"
  employeeId      String             @db.Uuid
  separationType  SeparationType
  initiatedDate   DateTime           @default(now())
  lastWorkingDay  DateTime
  noticeDate      DateTime?          // When notice was given
  noticePeriodDays Int               @default(30)

  // Exit Interview
  exitInterviewDate DateTime?
  exitInterviewerId String?          @db.Uuid
  exitInterviewNotes String?
  exitReason      String?            // Primary reason for leaving
  wouldRehire     Boolean?

  // Final Settlement
  unusedLeaveDays Decimal?           @db.Decimal(5, 1)
  leaveEncashment Decimal?           @db.Decimal(18, 2)
  gratuity        Decimal?           @db.Decimal(18, 2)
  otherPayments   Decimal?           @db.Decimal(18, 2)
  deductions      Decimal?           @db.Decimal(18, 2) // Advances, loans, etc.
  finalSettlement Decimal?           @db.Decimal(18, 2) // Net amount
  settlementPaidAt DateTime?

  // Certificate
  experienceCertPath String?         // Generated experience certificate

  status          OffboardingStatus  @default(INITIATED)
  completedAt     DateTime?
  notes           String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  employee        Employee           @relation(fields: [employeeId], references: [id])
  tasks           OffboardingTask[]

  @@index([organizationId])
  @@index([employeeId])
  @@index([status])
}

model OffboardingTask {
  id              String    @id @default(uuid()) @db.Uuid
  offboardingId   String    @db.Uuid
  taskName        String    // "Return Laptop", "Revoke Email Access", "Return ID Badge", etc.
  category        String    // "IT", "FINANCE", "HR", "ADMIN", "SECURITY"
  assignedToId    String?   @db.Uuid
  isCompleted     Boolean   @default(false)
  completedAt     DateTime?
  completedById   String?   @db.Uuid
  notes           String?
  sortOrder       Int       @default(0)

  offboarding     Offboarding @relation(fields: [offboardingId], references: [id], onDelete: Cascade)

  @@index([offboardingId])
}
```

**API Endpoints (Offboarding — 8 APIs):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/offboarding` | List offboarding cases |
| POST | `/api/v1/hr/offboarding` | Initiate offboarding (auto-creates checklist tasks) |
| GET | `/api/v1/hr/offboarding/:id` | Offboarding detail with task progress |
| PATCH | `/api/v1/hr/offboarding/:id` | Update offboarding (exit interview, settlement) |
| POST | `/api/v1/hr/offboarding/:id/complete` | Complete offboarding → mark employee RESIGNED/TERMINATED |
| PATCH | `/api/v1/hr/offboarding/:id/tasks/:taskId` | Update task completion |
| POST | `/api/v1/hr/offboarding/:id/settlement` | Calculate final settlement |
| POST | `/api/v1/hr/offboarding/:id/certificate` | Generate experience certificate |

**UI Pages:**

| Page | Route | Description |
|------|-------|-------------|
| Offboarding List | `/hr/offboarding` | Active/completed offboardings |
| Offboarding Detail | `/hr/offboarding/:id` | Task checklist, exit interview, settlement calc |
| Initiate Offboarding | `/hr/offboarding/new` | Form: employee, separation type, last working day |

#### 8.4 Holiday Calendar ✅ completed

**New Prisma Models:**

```prisma
model HolidayCalendar {
  id              String    @id @default(uuid()) @db.Uuid
  organizationId  String    @db.Uuid
  name            String    // "Bangladesh 2026", "Nepal Office 2026"
  year            Int
  isDefault       Boolean   @default(false)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  holidays        Holiday[]

  @@unique([organizationId, name, year])
  @@index([organizationId])
}

model Holiday {
  id              String          @id @default(uuid()) @db.Uuid
  calendarId      String          @db.Uuid
  name            String          // "Eid ul-Fitr", "Victory Day", etc.
  localizedName   Json?           // {"bn": "ঈদুল ফিতর"}
  date            DateTime
  endDate         DateTime?       // Multi-day holidays
  type            String          // "PUBLIC", "ORGANIZATIONAL", "RESTRICTED", "OPTIONAL"
  isRecurring     Boolean         @default(false)
  description     String?

  calendar        HolidayCalendar @relation(fields: [calendarId], references: [id], onDelete: Cascade)

  @@index([calendarId])
  @@index([date])
}
```

**API Endpoints (Holiday Calendar — 6 APIs):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/holiday-calendars` | List calendars |
| POST | `/api/v1/hr/holiday-calendars` | Create calendar |
| GET | `/api/v1/hr/holiday-calendars/:id` | Calendar with holidays |
| POST | `/api/v1/hr/holiday-calendars/:id/holidays` | Add holiday to calendar |
| PATCH | `/api/v1/hr/holiday-calendars/:id/holidays/:holidayId` | Update holiday |
| DELETE | `/api/v1/hr/holiday-calendars/:id/holidays/:holidayId` | Remove holiday |

**UI Pages:**

| Page | Route | Description |
|------|-------|-------------|
| Holiday Calendars | `/hr/holidays` | Calendar view with all holidays, year selector |
| Manage Calendar | `/hr/holidays/:id` | Add/edit/remove holidays for a calendar |

#### 8.5 Grievance & Disciplinary Management ✅ completed

**New Prisma Models:**

```prisma
enum GrievanceStatus {
  SUBMITTED
  UNDER_REVIEW
  INVESTIGATING
  RESOLVED
  CLOSED
  ESCALATED
}

enum DisciplinaryAction {
  VERBAL_WARNING
  WRITTEN_WARNING
  FINAL_WARNING
  SUSPENSION
  TERMINATION
}

model EmployeeGrievance {
  id              String          @id @default(uuid()) @db.Uuid
  organizationId  String          @db.Uuid
  grievanceNo     String          @unique // auto: "GRV-001"
  employeeId      String?         @db.Uuid // Null if anonymous
  isAnonymous     Boolean         @default(false)
  category        String          // "HARASSMENT", "DISCRIMINATION", "SAFETY", "POLICY_VIOLATION", "INTERPERSONAL", "PSEA", "OTHER"
  subject         String
  description     String
  evidencePaths   Json?           // [{name, filePath}]

  // Investigation
  assignedToId    String?         @db.Uuid // Investigating officer
  investigationNotes String?
  resolution      String?
  resolutionDate  DateTime?

  // Escalation
  escalatedToId   String?         @db.Uuid
  escalationReason String?

  severity        String          @default("MEDIUM") // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  status          GrievanceStatus @default(SUBMITTED)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([organizationId])
  @@index([employeeId])
  @@index([status])
}

model DisciplinaryCase {
  id              String             @id @default(uuid()) @db.Uuid
  organizationId  String             @db.Uuid
  caseNo          String             @unique // auto: "DISC-001"
  employeeId      String             @db.Uuid
  action          DisciplinaryAction
  reason          String
  description     String
  evidencePaths   Json?              // [{name, filePath}]

  // Dates
  incidentDate    DateTime
  actionDate      DateTime
  expiryDate      DateTime?          // Warning expiry

  // Suspension details
  suspensionStart DateTime?
  suspensionEnd   DateTime?
  withPay         Boolean            @default(true)

  // Appeal
  appealFiled     Boolean            @default(false)
  appealDate      DateTime?
  appealOutcome   String?            // "UPHELD", "REDUCED", "OVERTURNED"

  issuedById      String             @db.Uuid
  acknowledgedAt  DateTime?          // Employee acknowledged
  notes           String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@index([organizationId])
  @@index([employeeId])
}
```

**API Endpoints (Grievance & Disciplinary — 10 APIs):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/grievances` | List grievances |
| POST | `/api/v1/hr/grievances` | Submit grievance (with anonymous option) |
| GET | `/api/v1/hr/grievances/:id` | Grievance detail |
| PATCH | `/api/v1/hr/grievances/:id` | Update grievance (assign, investigate, resolve) |
| POST | `/api/v1/hr/grievances/:id/escalate` | Escalate grievance |
| GET | `/api/v1/hr/disciplinary` | List disciplinary cases |
| POST | `/api/v1/hr/disciplinary` | Create disciplinary case |
| GET | `/api/v1/hr/disciplinary/:id` | Case detail |
| PATCH | `/api/v1/hr/disciplinary/:id` | Update case |
| POST | `/api/v1/hr/disciplinary/:id/appeal` | File appeal |

**UI Pages:**

| Page | Route | Description |
|------|-------|-------------|
| Grievances List | `/hr/grievances` | All grievances with severity/status filter |
| Submit Grievance | `/hr/grievances/new` | Grievance form with anonymous option |
| Grievance Detail | `/hr/grievances/:id` | Investigation timeline, resolution |
| Disciplinary Cases | `/hr/disciplinary` | All disciplinary cases |
| Create Disciplinary | `/hr/disciplinary/new` | Form: employee, action, evidence |
| Case Detail | `/hr/disciplinary/:id` | Case details, appeal history |

#### 8.6 HR Analytics Dashboard ✅ completed

**API Endpoints (Analytics — 4 APIs):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/analytics/overview` | KPIs: headcount, turnover, avg tenure, gender ratio, dept distribution |
| GET | `/api/v1/hr/analytics/recruitment` | Recruitment funnel, time-to-hire, cost-per-hire, source effectiveness |
| GET | `/api/v1/hr/analytics/workforce` | Workforce composition by type, department, gender, age band, tenure |
| GET | `/api/v1/hr/analytics/attrition` | Attrition trends, reasons, voluntary vs involuntary, by department |

**UI Pages:**

| Page | Route | Description |
|------|-------|-------------|
| HR Analytics | `/hr/analytics` | Full analytics dashboard with charts: headcount trends, turnover rate, gender diversity pie, department breakdown, recruitment pipeline funnel, leave utilization, training hours/employee |

#### 8.7 Enhanced Existing Features ⬜ DEFERRED (Phase 8c — future)

**Salary Structure Enhancements:**
- Salary grade/step matrix (UN-style)
- Multi-component salary definition per employee
- Salary revision history with effective dates
- Donor/project cost allocation per salary component

**Payroll Enhancements:**
- Payslip PDF generation with detailed breakdown
- Bank transfer file generation (CSV/BACS format)
- Payroll variance report (month-over-month)
- Donor-wise payroll cost report

**Leave Enhancements:**
- Team leave calendar (visual calendar view)
- Leave conflict detection (minimum coverage rules)
- Half-day leave support
- Document attachment for sick leave

**Performance Enhancements:**
- Competency framework with weighted criteria
- 360-degree feedback collection
- PIP (Performance Improvement Plan) workflow
- Goal setting and tracking (OKR framework)

#### 8.8 Summary — Phase 8 Totals

| Sub-module | New Models | New APIs | New Pages |
|------------|-----------|----------|-----------|
| Recruitment & ATS | 5 | 18 + 3 public | 8 (incl. 2 public) |
| Contract Management | 1 | 8 | 3 |
| Offboarding | 2 | 8 | 3 |
| Holiday Calendar | 2 | 6 | 2 |
| Grievance & Disciplinary | 2 | 10 | 6 |
| HR Analytics | — | 4 | 1 |
| **TOTAL** | **12** | **57** | **23** |

**Updated Navigation (sidebar):**
```
HR & Payroll
├── Employee Directory     (existing)
├── Recruitment            ★ NEW
├── Onboarding             (existing)
├── Contracts              ★ NEW
├── Attendance             (existing)
├── Leave Management       (existing)
├── Holiday Calendar       ★ NEW
├── Payroll                (existing)
├── Performance            (existing)
├── Training               (existing)
├── Offboarding            ★ NEW
├── Grievances             ★ NEW
├── Org Chart              (existing)
├── HR Analytics           ★ NEW
```

### Phase 8b: HR Module — Critical Fixes, Gratuity Fund & Provident Fund ✅ completed ✅ seeded ✅ tested

> **Priority: Fix broken flows, add missing BLA 2006 compliance features, complete HR as production-grade**
> **Status:** ✅ Implemented, seeded, API tested (17/17 PASS), pushed to GitHub (commit 9cf14d4)
> **Dependencies:** Phase 8 (completed), Phase 5 HR basics (completed)

---

#### 8b.1 Critical Fixes — Broken Flows & Missing Features ✅ completed

> These are bugs/gaps in Phase 8 that MUST be fixed before any new features.

##### Fix A: Onboarding Page Rebuild (Static → API-Connected)

**Current Problem:** `src/app/(dashboard)/hr/onboarding/page.tsx` uses hardcoded dummy data — not connected to any API. The `OnboardingChecklist` and `OnboardingProgress` Prisma models exist but are unused by the UI.

**Fix:**
- Rebuild onboarding page as `'use client'` with API calls to `/api/v1/hr/onboarding/`
- New APIs needed:
  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | GET | `/api/v1/hr/onboarding` | List all active onboardings (employees with incomplete checklists) |
  | GET | `/api/v1/hr/onboarding/:employeeId` | Get onboarding progress for specific employee |
  | POST | `/api/v1/hr/onboarding/:employeeId/start` | Start onboarding for employee (creates all checklist tasks) |
  | PATCH | `/api/v1/hr/onboarding/:employeeId/tasks/:checklistId` | Mark task complete/incomplete, upload document |
  | GET | `/api/v1/hr/onboarding/checklists` | List all checklist template items (admin-configurable) |
  | POST | `/api/v1/hr/onboarding/checklists` | Create new checklist template item |
  | PATCH | `/api/v1/hr/onboarding/checklists/:id` | Update checklist item |
  | DELETE | `/api/v1/hr/onboarding/checklists/:id` | Delete checklist item |

- Onboarding page shows: employee list with progress bars, click to expand task checklist
- Each task: checkbox + document upload slot + notes + completion date
- KPI cards: New Employees, Completed, In Progress, Overdue (calculated from DB)

##### Fix B: Employee Form — Document Collection Section

**Current Problem:** `employees/new/page.tsx` has no document upload. Employee detail page has generic FileUpload but no structured document requirements.

**Fix:**
- Add "Required Documents" card to employee create form AND employee detail page
- Documents tied to `EmployeeDocument` model (already exists with type field)
- Required document types for Bangladesh NGO:

| Document Type | Required | BLA 2006 Reference | Notes |
|---------------|----------|-------------------|-------|
| NID_COPY | ✅ Yes | Section 4 | National ID or Birth Certificate |
| PHOTO | ✅ Yes | — | 2 passport-size photos |
| EDUCATIONAL_CERT | ✅ Yes | — | Highest degree attested copy |
| EXPERIENCE_CERT | Conditional | — | From previous employer(s) |
| TIN_CERTIFICATE | ✅ Yes | Income Tax | Mandatory for salaried employees |
| MEDICAL_FITNESS | Recommended | Section 38 | Medical certificate |
| BANK_ACCOUNT | ✅ Yes | Section 123 | For salary payment |
| NOMINEE_FORM | ✅ Yes | Section 28(4) | For PF/gratuity/death benefits |
| EMERGENCY_CONTACT | ✅ Yes | — | Next-of-kin declaration |
| SIGNED_CONTRACT | ✅ Yes | Section 5 | Appointment letter signed by both parties |
| POLICY_ACKNOWLEDGMENT | ✅ Yes | — | Code of conduct, safeguarding, PSEA, anti-fraud |
| NGOAB_FD4_NOTIFICATION | For NGOs | NGOAB rules | Personnel notification to NGOAB |
| PASSPORT_COPY | For intl staff | — | For expatriate/international hires |
| WORK_PERMIT | For intl staff | — | Required for non-Bangladeshi nationals |

- Employee detail page: "Documents" tab showing checklist of required docs with upload status (✅ uploaded / ⚠️ missing)
- Document upload stores to `EmployeeDocument` with type, filePath, uploadedAt
- Onboarding checklist task completion can require document upload (e.g. "NID Copy" task → must upload NID before marking complete)

##### Fix C: Recruitment → Employee → Contract → Onboarding Flow

**Current Problem:** Recruitment HIRED status doesn't create Employee record. Employee creation doesn't trigger Contract or Onboarding.

**Fix — Three integration points:**

**C1. Recruitment HIRED → Convert to Employee**
- New API: `POST /api/v1/hr/recruitment/applications/:id/convert-to-employee`
- Pre-fills Employee form with applicant data (name, email, phone, education from parsed CV)
- UI: "Convert to Employee" button on Application Detail page (visible only when status=HIRED)
- Click opens pre-filled employee creation form at `/hr/employees/new?fromApplication={id}`
- Employee create form detects `fromApplication` query param → fetches application data → pre-fills fields
- After employee created, application gets `convertedEmployeeId` reference

**C2. Employee Created → Auto-create Contract**
- When POST `/api/v1/hr/employees` succeeds, API checks if `createContract: true` in body
- If yes, auto-creates `EmployeeContract` with data from employee (type, salary, dates)
- Default: `createContract: true` for both paths (recruitment + direct add)
- Contract status: DRAFT (HR reviews and activates)

**C3. Employee Created → Auto-start Onboarding**
- When POST `/api/v1/hr/employees` succeeds, API auto-creates `OnboardingProgress` records for all active `OnboardingChecklist` items
- Employee appears in `/hr/onboarding` immediately with 0% progress
- Default checklist items (configurable by admin in Settings):
  1. NID/Birth Certificate copy — category: DOCUMENT, required: true
  2. Passport-size photos — category: DOCUMENT, required: true
  3. Educational certificates — category: DOCUMENT, required: true
  4. TIN certificate — category: DOCUMENT, required: true
  5. Medical fitness certificate — category: DOCUMENT, required: false
  6. Nominee declaration form — category: DOCUMENT, required: true
  7. Bank account setup — category: FINANCE, required: true
  8. Employment contract signing — category: LEGAL, required: true
  9. Policy handbook acknowledgment — category: COMPLIANCE, required: true
  10. Safeguarding & PSEA training — category: COMPLIANCE, required: true
  11. IT access setup (email, system) — category: IT, required: true
  12. ID card issuance — category: ADMIN, required: true
  13. Orientation/induction — category: HR, required: true
  14. Supervisor introduction — category: HR, required: true
  15. Probation goals setting — category: HR, required: false
  16. NGOAB FD-4 notification — category: COMPLIANCE, required: true (for NGOs)
  17. Security briefing — category: SECURITY, required: false (for field staff)

**Complete Flow Diagram:**
```
PATH A: Recruitment Flow
══════════════════════════════════════════════════════════
Job Post (DRAFT) → Publish (PUBLISHED) → Career Page (Public URL)
    ↓
Applications come in (from career page OR HR adds internally)
    ↓
Auto-Score CVs (software-based, no AI)
  → Education match (25 pts)
  → Experience years match (30 pts)
  → Skills keyword match (20 pts)
  → Language match (15 pts)
  → Certification match (10 pts)
    ↓
Pipeline: APPLIED → SCREENED → SHORTLISTED → TECHNICAL_TEST → INTERVIEW → REFERENCE_CHECK → OFFER → HIRED
    ↓
HR clicks "Convert to Employee" on HIRED applicant
    ↓
Pre-filled Employee Form opens (name, email, phone, education from application)
    ↓
HR completes remaining fields → Saves
    ↓
System auto-creates:
  ├── Employee record (EMP-xxx)
  ├── Contract (CTR-xxx, status: DRAFT)
  └── Onboarding (17 checklist tasks, 0% complete)
    ↓
HR goes to /hr/onboarding → sees new employee → works through checklist
  ├── Upload documents (NID, TIN, certificates...)
  ├── Complete admin tasks (IT access, ID card...)
  ├── Compliance tasks (policy acknowledgment, PSEA training...)
  └── Mark each task complete with evidence/upload
    ↓
All required tasks complete → Onboarding marked COMPLETED
    ↓
HR activates Contract (DRAFT → ACTIVE)
    ↓
Employee fully onboarded ✅

PATH B: Direct Admin Onboarding (no recruitment)
══════════════════════════════════════════════════════════
HR clicks "Add Employee" on Employee Directory
    ↓
Full Employee Form (fill manually — no pre-fill)
    ↓
HR fills all fields → Saves
    ↓
System auto-creates:
  ├── Employee record (EMP-xxx)
  ├── Contract (CTR-xxx, status: DRAFT)
  └── Onboarding (17 checklist tasks, 0% complete)
    ↓
Same onboarding flow as above...
```

##### Fix D: CV Auto-Scoring Improvements (Software-Only, No AI/ML)

**Current:** Manual trigger per applicant, fixed weights, no comparison view.

**Improvements (no AI):**
1. **Auto-trigger on application submit** — score calculated immediately when application created (both public career page and internal), no manual "Score CV" button needed
2. **Customizable weights per job** — HR can set weight for each criteria when creating job posting:
   ```
   Job Posting form → "Scoring Weights" section:
   Education:     [___25___] pts (0-100 slider)
   Experience:    [___30___] pts
   Skills:        [___20___] pts
   Languages:     [___15___] pts
   Certifications:[___10___] pts
   Total must = 100
   ```
3. **Comparison view** — New "Compare Candidates" view on Job Posting detail page:
   - Side-by-side table of top N applicants
   - Score breakdown bars per criteria
   - Sort by total score, individual criteria
4. **Structured application form (no AI parsing needed):**
   - Instead of uploading CV and parsing it with AI, applicants fill structured form:
     - Education: Add rows (degree, institution, year, field)
     - Experience: Add rows (title, organization, start, end)
     - Skills: Select from predefined skill tags + add custom
     - Languages: Select language + proficiency level
     - Certifications: Add rows (name, issuer, year)
   - CV file upload is OPTIONAL (for HR reference), not for parsing
   - This structured data goes directly into `parsedEducation`, `parsedSkills` etc. fields
   - Scoring uses this structured data — no AI/NLP needed

**New API:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/hr/recruitment/applications/:id/convert-to-employee` | Convert hired applicant to employee |
| GET | `/api/v1/hr/recruitment/jobs/:id/compare` | Side-by-side candidate comparison |

**UI Changes:**
- Application form (public career page): Structured education/experience/skills sections
- Job posting form: Scoring weights customization section
- Job detail page: "Compare Candidates" tab
- Application detail page: "Convert to Employee" button (when HIRED)

##### Fix Summary — 8b.1 Totals

| Fix | New APIs | UI Changes | Priority |
|-----|----------|-----------|----------|
| A: Onboarding Rebuild | 8 | 1 page rebuild + admin config | CRITICAL |
| B: Document Collection | 0 (uses existing) | Employee form + detail update | CRITICAL |
| C: Flow Integration | 2 | Pre-fill form + auto-triggers | CRITICAL |
| D: CV Scoring Improvements | 2 | Career page form + comparison view + weights | HIGH |
| **TOTAL** | **12** | **4 page updates + 1 new view** | |

---

#### 8b.2 Gratuity Fund Management ✅ completed

> **Legal basis:** Bangladesh Labour Act 2006, Section 26 — employees with 5+ years continuous service entitled to gratuity at 30 days' wages per completed year. International NGOs typically offer from day 1 at 1 month/year rate.
> **NGOAB requirement:** FD-4 form requires gratuity liability reporting.

##### Prisma Models (6 new models)

```prisma
// ─── gratuity.prisma ───

model GratuityPolicy {
  id               String   @id @default(uuid()) @db.Uuid
  organizationId   String   @db.Uuid
  name             String   // "Standard BLA Policy", "NGO Enhanced Policy"
  isDefault        Boolean  @default(false)

  // Eligibility
  vestingPeriodMonths Int   @default(60) // 60 months = 5 years (BLA default)
  minServiceMonths Int      @default(0)  // 0 = from day 1 (NGO style)

  // Calculation
  formulaType      String   @default("MONTHS_PER_YEAR") // MONTHS_PER_YEAR, FIXED_RATE, CUSTOM
  ratePerYear      Decimal  @db.Decimal(5, 2) @default(1.00) // 1 month salary per year
  calculationBase  String   @default("LAST_BASIC") // LAST_BASIC, AVERAGE_BASIC, GROSS

  // Rate bands (for progressive rates)
  rateBands        Json?    // [{fromYear: 1, toYear: 5, rate: 0.5}, {fromYear: 6, toYear: 99, rate: 1.0}]

  // Fund management
  accrualFrequency String   @default("MONTHLY") // MONTHLY, QUARTERLY, ANNUAL
  fundBankAccountId String? @db.Uuid // Separate bank account for gratuity fund
  maintainFund     Boolean  @default(true) // Whether to maintain separate fund

  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([organizationId, name])
  @@index([organizationId])
}

model GratuityLedger {
  id               String   @id @default(uuid()) @db.Uuid
  organizationId   String   @db.Uuid
  employeeId       String   @db.Uuid
  policyId         String   @db.Uuid

  // Running totals
  totalAccrued     Decimal  @default(0) @db.Decimal(18, 2) // Total provision
  totalPaid        Decimal  @default(0) @db.Decimal(18, 2) // Total paid out
  currentBalance   Decimal  @default(0) @db.Decimal(18, 2) // Accrued - Paid

  // Service calculation
  serviceStartDate DateTime // Usually joiningDate
  lastAccrualDate  DateTime?
  isVested         Boolean  @default(false) // Crossed vesting period?

  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([organizationId, employeeId])
  @@index([organizationId])
  @@index([employeeId])
}

model GratuityAccrual {
  id               String   @id @default(uuid()) @db.Uuid
  organizationId   String   @db.Uuid
  ledgerId         String   @db.Uuid
  employeeId       String   @db.Uuid

  accrualMonth     Int      // 1-12
  accrualYear      Int
  basicSalary      Decimal  @db.Decimal(18, 2) // Salary used for calculation
  accrualAmount    Decimal  @db.Decimal(18, 2) // Monthly accrual amount
  serviceMonths    Int      // Total service months at time of accrual

  // Project allocation
  projectAllocations Json?  // [{projectId, percentage, amount}]

  journalEntryId   String?  @db.Uuid // Auto-generated JE (DR Gratuity Expense, CR Gratuity Provision)
  createdAt        DateTime @default(now())

  @@unique([ledgerId, accrualMonth, accrualYear])
  @@index([organizationId])
  @@index([employeeId])
}

model GratuityPayment {
  id               String   @id @default(uuid()) @db.Uuid
  organizationId   String   @db.Uuid
  paymentNo        String   @unique // auto: "GRT-PAY-001"
  ledgerId         String   @db.Uuid
  employeeId       String   @db.Uuid

  paymentType      String   // "FINAL_SETTLEMENT", "INTERIM", "PARTIAL"
  amount           Decimal  @db.Decimal(18, 2)
  calculationBase  Decimal  @db.Decimal(18, 2) // Salary used
  serviceYears     Decimal  @db.Decimal(5, 2)  // Years of service
  serviceDays      Int

  // Approval
  status           String   @default("PENDING") // PENDING, APPROVED, PAID, CANCELLED
  approvedById     String?  @db.Uuid
  approvedAt       DateTime?
  paidAt           DateTime?
  paymentMethod    String?  // "BANK_TRANSFER", "CHEQUE", "CASH"
  referenceNo      String?  // Cheque/transaction number

  // Linked to offboarding if final settlement
  offboardingId    String?  @db.Uuid

  journalEntryId   String?  @db.Uuid // Auto-generated JE
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([organizationId])
  @@index([employeeId])
}

model GratuityFund {
  id               String   @id @default(uuid()) @db.Uuid
  organizationId   String   @db.Uuid
  name             String   // "Main Gratuity Fund"
  bankAccountId    String?  @db.Uuid // Linked bank account
  currentBalance   Decimal  @default(0) @db.Decimal(18, 2)

  // FDR tracking
  fdrDetails       Json?    // [{bank, accountNo, amount, maturityDate, interestRate}]
  totalFdr         Decimal  @default(0) @db.Decimal(18, 2)

  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  transactions     GratuityFundTransaction[]

  @@unique([organizationId, name])
  @@index([organizationId])
}

model GratuityFundTransaction {
  id               String   @id @default(uuid()) @db.Uuid
  fundId           String   @db.Uuid
  transactionNo    String   @unique // auto: "GFT-001"
  type             String   // "DEPOSIT", "WITHDRAWAL", "INTEREST", "FDR_MATURITY", "FDR_INVESTMENT"
  amount           Decimal  @db.Decimal(18, 2)
  balance          Decimal  @db.Decimal(18, 2) // Running balance after transaction
  description      String?
  referenceNo      String?
  transactionDate  DateTime
  journalEntryId   String?  @db.Uuid
  createdAt        DateTime @default(now())

  fund             GratuityFund @relation(fields: [fundId], references: [id])

  @@index([fundId])
}
```

##### API Endpoints (18)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Policy** | | |
| GET | `/api/v1/hr/gratuity/policies` | List gratuity policies |
| POST | `/api/v1/hr/gratuity/policies` | Create policy |
| GET | `/api/v1/hr/gratuity/policies/:id` | Policy detail |
| PATCH | `/api/v1/hr/gratuity/policies/:id` | Update policy |
| **Ledger** | | |
| GET | `/api/v1/hr/gratuity/ledgers` | List all employee gratuity ledgers |
| GET | `/api/v1/hr/gratuity/ledgers/:employeeId` | Employee gratuity statement (all accruals + payments) |
| POST | `/api/v1/hr/gratuity/ledgers/enroll` | Enroll employee in gratuity (create ledger) |
| **Accrual** | | |
| POST | `/api/v1/hr/gratuity/accruals/run` | Run monthly accrual for all eligible employees |
| GET | `/api/v1/hr/gratuity/accruals` | List accruals (filter: month, year, employee) |
| GET | `/api/v1/hr/gratuity/accruals/preview` | Preview accrual before running (dry run) |
| **Payment** | | |
| GET | `/api/v1/hr/gratuity/payments` | List all payments |
| POST | `/api/v1/hr/gratuity/payments` | Create payment (manual or from offboarding) |
| POST | `/api/v1/hr/gratuity/payments/:id/approve` | Approve payment |
| POST | `/api/v1/hr/gratuity/payments/:id/pay` | Mark as paid |
| **Fund** | | |
| GET | `/api/v1/hr/gratuity/fund` | Fund dashboard (balance, FDR, transactions) |
| POST | `/api/v1/hr/gratuity/fund/transactions` | Record fund transaction (deposit/withdrawal) |
| **Reports** | | |
| GET | `/api/v1/hr/gratuity/reports/liability` | Total liability report (for NGOAB FD-4) |
| GET | `/api/v1/hr/gratuity/reports/employee-statement` | Individual employee statement |

##### UI Pages (11)

| Page | Route | Description |
|------|-------|-------------|
| Gratuity Dashboard | `/hr/gratuity` | KPIs: total liability, monthly accrual, fund balance, vested employees |
| Policies | `/hr/gratuity/policies` | List/create/edit gratuity policies |
| Policy Detail | `/hr/gratuity/policies/:id` | Policy configuration with rate bands |
| Employee Ledgers | `/hr/gratuity/ledgers` | All employees with gratuity balance, service years |
| Ledger Detail | `/hr/gratuity/ledgers/:employeeId` | Employee statement: monthly accruals, payments, running balance |
| Run Accrual | `/hr/gratuity/accruals` | Monthly accrual run with preview, history |
| Payments | `/hr/gratuity/payments` | Payment list with approval workflow |
| Create Payment | `/hr/gratuity/payments/new` | Payment form (manual or linked to offboarding) |
| Fund Management | `/hr/gratuity/fund` | Fund balance, FDR tracking, deposit/withdraw |
| Liability Report | `/hr/gratuity/reports/liability` | Total organization liability |
| Employee Statement | `/hr/gratuity/reports/statement` | Printable employee gratuity statement |

##### Cross-Module Integration

| From | To | Trigger | Action |
|------|-----|---------|--------|
| Payroll → Gratuity | Monthly payroll processed | Auto-run gratuity accrual for all active employees |
| Gratuity → Finance | Accrual run | Auto-create JE: DR Gratuity Expense (per project), CR Gratuity Provision |
| Gratuity → Finance | Payment approved | Auto-create JE: DR Gratuity Provision, CR Bank |
| Offboarding → Gratuity | Exit initiated | Auto-calculate final gratuity, create payment draft |
| Gratuity → Budget | Accrual | Personnel cost line in project budgets |
| Gratuity → NGOAB | FD-4 report | Gratuity liability data for FD-4 |

---

#### 8b.3 Provident Fund Management ✅ completed

> **Legal basis:** Bangladesh Labour Act 2006, Chapter XVII (Sections 264-269) — mandatory if 75%+ employees demand. NBR recognition makes it tax-exempt.
> **International NGO practice:** Typically voluntary, 10% employee + 10% employer contribution.

##### Prisma Models (14 new models)

```prisma
// ─── provident-fund.prisma ───

model PFPolicy {
  id                    String   @id @default(uuid()) @db.Uuid
  organizationId        String   @db.Uuid
  name                  String   // "Standard PF Policy"
  isDefault             Boolean  @default(false)

  // Contribution rates
  employeeContribRate   Decimal  @db.Decimal(5, 2) @default(10.00) // 10%
  employerContribRate   Decimal  @db.Decimal(5, 2) @default(10.00) // 10%
  contributionBase      String   @default("BASIC") // BASIC, GROSS

  // Eligibility
  eligibilityMonths     Int      @default(0) // Months of service before eligible (0 = immediate)
  eligibilityTypes      Json?    // ["FULL_TIME", "CONTRACT"] — which employment types

  // Vesting
  vestingSchedule       Json     // [{months: 12, percentage: 25}, {months: 24, percentage: 50}, {months: 36, percentage: 75}, {months: 48, percentage: 100}]

  // Interest
  interestRate          Decimal  @db.Decimal(5, 2) @default(9.00) // Annual interest rate
  interestCalcMethod    String   @default("MONTHLY_BALANCE") // MONTHLY_BALANCE, ANNUAL_BALANCE
  interestPostingFreq   String   @default("ANNUAL") // ANNUAL, SEMI_ANNUAL

  // Withdrawal rules
  allowPartialWithdraw  Boolean  @default(true)
  maxWithdrawPercent    Decimal? @db.Decimal(5, 2) // Max % of own contribution
  withdrawalReasons     Json?    // ["MEDICAL", "HOUSING", "EDUCATION", "MARRIAGE"]
  minServiceForWithdraw Int      @default(12) // Months of service before withdrawal allowed

  // Loan rules
  allowLoan             Boolean  @default(true)
  maxLoanPercent        Decimal? @db.Decimal(5, 2) @default(80.00) // Max % of own balance
  loanInterestRate      Decimal? @db.Decimal(5, 2) @default(5.00) // Annual
  maxLoanRepayMonths    Int      @default(36) // Max repayment period
  maxActiveLoans        Int      @default(1)

  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([organizationId, name])
  @@index([organizationId])
}

model PFTrust {
  id                String   @id @default(uuid()) @db.Uuid
  organizationId    String   @db.Uuid
  name              String   // "Shapla Foundation PF Trust"
  registrationNo    String?  // NBR registration number
  registrationDate  DateTime?
  bankAccountId     String?  @db.Uuid // Trust's bank account
  currentBalance    Decimal  @default(0) @db.Decimal(18, 2)

  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  trustees          PFTrustee[]
  transactions      PFTrustTransaction[]
  investments       PFInvestment[]

  @@unique([organizationId, name])
  @@index([organizationId])
}

model PFTrustee {
  id            String   @id @default(uuid()) @db.Uuid
  trustId       String   @db.Uuid
  employeeId    String?  @db.Uuid // May be external person
  name          String
  role          String   // "CHAIRMAN", "SECRETARY", "MEMBER", "EMPLOYER_REP", "EMPLOYEE_REP"
  appointedDate DateTime
  isActive      Boolean  @default(true)

  trust         PFTrust  @relation(fields: [trustId], references: [id])

  @@index([trustId])
}

model PFEnrollment {
  id                String   @id @default(uuid()) @db.Uuid
  organizationId    String   @db.Uuid
  employeeId        String   @db.Uuid
  policyId          String   @db.Uuid
  enrollmentDate    DateTime
  effectiveDate     DateTime // Contributions start from this date

  // Rates (may override policy for individual)
  employeeRate      Decimal  @db.Decimal(5, 2) // e.g. 10.00%
  employerRate      Decimal  @db.Decimal(5, 2)

  // Running balances
  totalEmployeeContrib  Decimal @default(0) @db.Decimal(18, 2)
  totalEmployerContrib  Decimal @default(0) @db.Decimal(18, 2)
  totalInterest         Decimal @default(0) @db.Decimal(18, 2)
  totalWithdrawals      Decimal @default(0) @db.Decimal(18, 2)
  totalLoanOutstanding  Decimal @default(0) @db.Decimal(18, 2)
  currentBalance        Decimal @default(0) @db.Decimal(18, 2) // Employee+Employer+Interest-Withdrawals-Loans

  status            String   @default("ACTIVE") // ACTIVE, FROZEN, SETTLED
  settledAt         DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  nominees          PFNominee[]

  @@unique([organizationId, employeeId])
  @@index([organizationId])
  @@index([employeeId])
}

model PFNominee {
  id            String   @id @default(uuid()) @db.Uuid
  enrollmentId  String   @db.Uuid
  name          String
  relationship  String   // "SPOUSE", "CHILD", "PARENT", "SIBLING", "OTHER"
  percentage    Decimal  @db.Decimal(5, 2) // Share % (all nominees must total 100%)
  nidNumber     String?
  phone         String?
  address       String?

  enrollment    PFEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)

  @@index([enrollmentId])
}

model PFContribution {
  id                String   @id @default(uuid()) @db.Uuid
  organizationId    String   @db.Uuid
  enrollmentId      String   @db.Uuid
  employeeId        String   @db.Uuid

  month             Int
  year              Int
  basicSalary       Decimal  @db.Decimal(18, 2)
  employeeAmount    Decimal  @db.Decimal(18, 2)
  employerAmount    Decimal  @db.Decimal(18, 2)
  totalAmount       Decimal  @db.Decimal(18, 2)

  // Project allocation (same as salary)
  projectAllocations Json?   // [{projectId, percentage, amount}]

  payrollRunId      String?  @db.Uuid // Linked to payroll run
  journalEntryId    String?  @db.Uuid
  createdAt         DateTime @default(now())

  @@unique([enrollmentId, month, year])
  @@index([organizationId])
  @@index([employeeId])
}

model PFInterestPosting {
  id                String   @id @default(uuid()) @db.Uuid
  organizationId    String   @db.Uuid
  enrollmentId      String   @db.Uuid
  employeeId        String   @db.Uuid

  periodStart       DateTime
  periodEnd         DateTime
  openingBalance    Decimal  @db.Decimal(18, 2)
  interestRate      Decimal  @db.Decimal(5, 2)
  interestAmount    Decimal  @db.Decimal(18, 2)
  closingBalance    Decimal  @db.Decimal(18, 2)

  journalEntryId    String?  @db.Uuid
  createdAt         DateTime @default(now())

  @@index([organizationId])
  @@index([enrollmentId])
}

model PFWithdrawal {
  id                String   @id @default(uuid()) @db.Uuid
  organizationId    String   @db.Uuid
  withdrawalNo      String   @unique // auto: "PFW-001"
  enrollmentId      String   @db.Uuid
  employeeId        String   @db.Uuid

  amount            Decimal  @db.Decimal(18, 2)
  reason            String   // "MEDICAL", "HOUSING", "EDUCATION", "MARRIAGE", "HARDSHIP"
  description       String?
  supportingDocs    Json?    // [{name, filePath}]

  status            String   @default("PENDING") // PENDING, APPROVED, PAID, REJECTED
  approvedById      String?  @db.Uuid
  approvedAt        DateTime?
  paidAt            DateTime?

  journalEntryId    String?  @db.Uuid
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId])
  @@index([enrollmentId])
}

model PFLoan {
  id                String   @id @default(uuid()) @db.Uuid
  organizationId    String   @db.Uuid
  loanNo            String   @unique // auto: "PFL-001"
  enrollmentId      String   @db.Uuid
  employeeId        String   @db.Uuid

  principalAmount   Decimal  @db.Decimal(18, 2)
  interestRate      Decimal  @db.Decimal(5, 2) // Annual
  repaymentMonths   Int
  monthlyInstallment Decimal @db.Decimal(18, 2)
  totalRepayable    Decimal  @db.Decimal(18, 2)
  outstandingBalance Decimal @db.Decimal(18, 2)

  disbursedAt       DateTime?
  status            String   @default("PENDING") // PENDING, APPROVED, ACTIVE, COMPLETED, DEFAULTED
  approvedById      String?  @db.Uuid
  approvedAt        DateTime?

  journalEntryId    String?  @db.Uuid
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  repayments        PFLoanRepayment[]

  @@index([organizationId])
  @@index([enrollmentId])
}

model PFLoanRepayment {
  id                String   @id @default(uuid()) @db.Uuid
  loanId            String   @db.Uuid
  installmentNo     Int
  dueDate           DateTime
  principalPortion  Decimal  @db.Decimal(18, 2)
  interestPortion   Decimal  @db.Decimal(18, 2)
  totalAmount       Decimal  @db.Decimal(18, 2)
  paidAmount        Decimal  @default(0) @db.Decimal(18, 2)
  paidAt            DateTime?
  payrollRunId      String?  @db.Uuid // Auto-deducted from salary
  status            String   @default("PENDING") // PENDING, PAID, OVERDUE

  loan              PFLoan   @relation(fields: [loanId], references: [id])

  @@unique([loanId, installmentNo])
  @@index([loanId])
}

model PFSettlement {
  id                String   @id @default(uuid()) @db.Uuid
  organizationId    String   @db.Uuid
  settlementNo      String   @unique // auto: "PFS-001"
  enrollmentId      String   @db.Uuid
  employeeId        String   @db.Uuid

  // Balances at settlement
  employeeContrib   Decimal  @db.Decimal(18, 2)
  employerContrib   Decimal  @db.Decimal(18, 2)
  interestEarned    Decimal  @db.Decimal(18, 2)
  vestedPercent     Decimal  @db.Decimal(5, 2) // Based on vesting schedule
  vestedEmployer    Decimal  @db.Decimal(18, 2) // Employer portion after vesting
  forfeited         Decimal  @db.Decimal(18, 2) // Unvested employer portion
  loanDeduction     Decimal  @db.Decimal(18, 2) // Outstanding loan deducted
  netPayable        Decimal  @db.Decimal(18, 2) // Final amount

  status            String   @default("CALCULATED") // CALCULATED, APPROVED, PAID
  offboardingId     String?  @db.Uuid
  approvedById      String?  @db.Uuid
  paidAt            DateTime?

  journalEntryId    String?  @db.Uuid
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId])
  @@index([employeeId])
}

model PFInvestment {
  id                String   @id @default(uuid()) @db.Uuid
  trustId           String   @db.Uuid
  type              String   // "FDR", "GOVT_SECURITIES", "ICB_UNIT", "BANK_DEPOSIT"
  institutionName   String   // Bank/institution name
  accountNo         String?
  amount            Decimal  @db.Decimal(18, 2)
  interestRate      Decimal  @db.Decimal(5, 2)
  startDate         DateTime
  maturityDate      DateTime?
  currentValue      Decimal  @db.Decimal(18, 2)
  status            String   @default("ACTIVE") // ACTIVE, MATURED, ENCASHED

  trust             PFTrust  @relation(fields: [trustId], references: [id])

  @@index([trustId])
}

model PFInvestmentIncome {
  id                String   @id @default(uuid()) @db.Uuid
  investmentId      String   @db.Uuid
  incomeType        String   // "INTEREST", "DIVIDEND", "CAPITAL_GAIN"
  amount            Decimal  @db.Decimal(18, 2)
  receivedDate      DateTime
  journalEntryId    String?  @db.Uuid
  createdAt         DateTime @default(now())

  @@index([investmentId])
}

model PFTrustTransaction {
  id                String   @id @default(uuid()) @db.Uuid
  trustId           String   @db.Uuid
  transactionNo     String   @unique // auto: "PFT-001"
  type              String   // "CONTRIBUTION_RECEIVED", "WITHDRAWAL_PAID", "LOAN_DISBURSED", "LOAN_REPAID", "INTEREST_CREDITED", "INVESTMENT_MADE", "INVESTMENT_MATURED", "INCOME_RECEIVED"
  amount            Decimal  @db.Decimal(18, 2)
  balance           Decimal  @db.Decimal(18, 2) // Running balance
  description       String?
  referenceNo       String?
  transactionDate   DateTime
  journalEntryId    String?  @db.Uuid
  createdAt         DateTime @default(now())

  trust             PFTrust  @relation(fields: [trustId], references: [id])

  @@index([trustId])
}
```

##### API Endpoints (45)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Policy** (4) | | |
| GET | `/api/v1/hr/pf/policies` | List PF policies |
| POST | `/api/v1/hr/pf/policies` | Create policy |
| GET | `/api/v1/hr/pf/policies/:id` | Policy detail |
| PATCH | `/api/v1/hr/pf/policies/:id` | Update policy |
| **Trust** (6) | | |
| GET | `/api/v1/hr/pf/trust` | Trust dashboard (balance, investments) |
| POST | `/api/v1/hr/pf/trust` | Create trust |
| PATCH | `/api/v1/hr/pf/trust/:id` | Update trust |
| GET | `/api/v1/hr/pf/trust/:id/trustees` | List trustees |
| POST | `/api/v1/hr/pf/trust/:id/trustees` | Add trustee |
| PATCH | `/api/v1/hr/pf/trust/:id/trustees/:tid` | Update/remove trustee |
| **Enrollment** (6) | | |
| GET | `/api/v1/hr/pf/enrollments` | List enrolled employees |
| POST | `/api/v1/hr/pf/enrollments` | Enroll employee |
| GET | `/api/v1/hr/pf/enrollments/:id` | Enrollment detail with nominees |
| PATCH | `/api/v1/hr/pf/enrollments/:id` | Update enrollment |
| POST | `/api/v1/hr/pf/enrollments/:id/nominees` | Add/update nominees |
| DELETE | `/api/v1/hr/pf/enrollments/:id/nominees/:nid` | Remove nominee |
| **Contributions** (4) | | |
| POST | `/api/v1/hr/pf/contributions/run` | Process monthly contributions (linked to payroll) |
| GET | `/api/v1/hr/pf/contributions` | List contributions (filter: month, year, employee) |
| GET | `/api/v1/hr/pf/contributions/preview` | Preview before running |
| GET | `/api/v1/hr/pf/contributions/employee/:id` | Employee contribution history |
| **Interest** (3) | | |
| POST | `/api/v1/hr/pf/interest/calculate` | Calculate annual interest for all members |
| GET | `/api/v1/hr/pf/interest` | Interest posting history |
| GET | `/api/v1/hr/pf/interest/preview` | Preview interest calculation |
| **Withdrawals** (5) | | |
| GET | `/api/v1/hr/pf/withdrawals` | List withdrawal requests |
| POST | `/api/v1/hr/pf/withdrawals` | Submit withdrawal request |
| GET | `/api/v1/hr/pf/withdrawals/:id` | Withdrawal detail |
| POST | `/api/v1/hr/pf/withdrawals/:id/approve` | Approve/reject |
| POST | `/api/v1/hr/pf/withdrawals/:id/pay` | Mark as paid |
| **Loans** (7) | | |
| GET | `/api/v1/hr/pf/loans` | List PF loans |
| POST | `/api/v1/hr/pf/loans` | Apply for PF loan |
| GET | `/api/v1/hr/pf/loans/:id` | Loan detail with repayment schedule |
| POST | `/api/v1/hr/pf/loans/:id/approve` | Approve loan |
| POST | `/api/v1/hr/pf/loans/:id/disburse` | Disburse loan |
| GET | `/api/v1/hr/pf/loans/:id/repayments` | Repayment history |
| POST | `/api/v1/hr/pf/loans/:id/repayments` | Record repayment |
| **Settlement** (4) | | |
| POST | `/api/v1/hr/pf/settlements/calculate` | Calculate final settlement for employee |
| GET | `/api/v1/hr/pf/settlements` | List settlements |
| POST | `/api/v1/hr/pf/settlements/:id/approve` | Approve settlement |
| POST | `/api/v1/hr/pf/settlements/:id/pay` | Mark as paid |
| **Investments** (3) | | |
| GET | `/api/v1/hr/pf/investments` | List investments |
| POST | `/api/v1/hr/pf/investments` | Create investment |
| PATCH | `/api/v1/hr/pf/investments/:id` | Update (matured/encashed) |
| **Reports** (3) | | |
| GET | `/api/v1/hr/pf/reports/register` | PF register (all members) |
| GET | `/api/v1/hr/pf/reports/statement/:employeeId` | Employee PF statement |
| GET | `/api/v1/hr/pf/reports/trust-balance` | Trust balance sheet |

##### UI Pages (26)

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/hr/provident-fund` | KPIs: total fund, members, monthly contribution, investment returns |
| **Policy** | | |
| Policies | `/hr/provident-fund/policies` | List/manage PF policies |
| Policy Detail | `/hr/provident-fund/policies/:id` | Policy config (rates, vesting, loan rules) |
| **Enrollment** | | |
| Enrollments | `/hr/provident-fund/enrollments` | Member list with balances |
| Enrollment Detail | `/hr/provident-fund/enrollments/:id` | Employee PF profile, nominees, history |
| Enroll Employee | `/hr/provident-fund/enrollments/new` | Enrollment form |
| Manage Nominees | `/hr/provident-fund/enrollments/:id/nominees` | Add/edit nominees (must total 100%) |
| **Contributions** | | |
| Monthly Run | `/hr/provident-fund/contributions` | Run/preview monthly contributions, history |
| Employee History | `/hr/provident-fund/contributions/:employeeId` | Individual contribution history |
| **Interest** | | |
| Interest Posting | `/hr/provident-fund/interest` | Annual interest calculation, posting history |
| **Withdrawals** | | |
| Withdrawal List | `/hr/provident-fund/withdrawals` | All withdrawal requests with approval status |
| New Withdrawal | `/hr/provident-fund/withdrawals/new` | Withdrawal application form |
| Withdrawal Detail | `/hr/provident-fund/withdrawals/:id` | Detail with supporting docs, approval |
| **Loans** | | |
| Loan List | `/hr/provident-fund/loans` | All PF loans with status |
| Apply Loan | `/hr/provident-fund/loans/new` | Loan application with EMI calculator |
| Loan Detail | `/hr/provident-fund/loans/:id` | Loan detail, repayment schedule, payments |
| **Settlements** | | |
| Settlement List | `/hr/provident-fund/settlements` | All settlements |
| Settlement Detail | `/hr/provident-fund/settlements/:id` | Breakdown: employee, employer, interest, vesting, loans, net |
| **Trust Fund** | | |
| Trust Dashboard | `/hr/provident-fund/trust` | Trust overview, board, balance |
| Trustees | `/hr/provident-fund/trust/trustees` | Manage board of trustees |
| Trust Transactions | `/hr/provident-fund/trust/transactions` | All trust transactions |
| **Investments** | | |
| Investment Portfolio | `/hr/provident-fund/investments` | FDR, govt securities, ICB units |
| New Investment | `/hr/provident-fund/investments/new` | Create investment |
| **Reports** | | |
| PF Register | `/hr/provident-fund/reports/register` | All members register |
| Employee Statement | `/hr/provident-fund/reports/statement` | Printable employee PF statement |
| Trust Balance Sheet | `/hr/provident-fund/reports/trust-balance` | Trust financial position |

##### Cross-Module Integration

| From | To | Trigger | Action |
|------|-----|---------|--------|
| Payroll → PF | Monthly payroll | Auto-deduct employee PF from salary, add employer contribution |
| PF → Finance | Contribution run | Auto-create JE: DR PF Expense (employer), DR Employee Salary (employee), CR PF Trust |
| PF → Finance | Withdrawal paid | Auto-create JE: DR PF Trust, CR Bank |
| PF → Finance | Loan disbursed | Auto-create JE: DR PF Loan Receivable, CR PF Trust |
| PF → Payroll | Loan active | Auto-deduct EMI from monthly salary |
| Offboarding → PF | Exit initiated | Auto-calculate PF settlement with vesting |
| PF Trust → Finance | Investment | Auto-create JE for investment transactions |
| Employee → PF | Employee created | Option to auto-enroll based on policy eligibility |

---

#### 8b.3b Pension Management — NOT NEEDED (Research Conclusion)

> **Research finding:** A separate Pension module is NOT required for Bangladesh NGOs.
> **Reason:** Bangladesh has no mandatory pension law for private/NGO sector. The government pension system covers only public servants (Public Servants Retirement Act 1974). The Universal Pension Management Act 2023 is in early stages and voluntary for private sector.

**Bangladesh NGO retirement benefits = PF + Gratuity only.** Even the largest NGOs (BRAC with 100,000+ staff, Grameen Bank, ASA) use only PF + Gratuity — none operate a pension scheme.

| Organization | PF | Gratuity | Pension |
|---|---|---|---|
| BRAC | ✅ (Staff Benefit Trust) | ✅ | ❌ |
| Grameen Bank | ✅ (PF Trust) | ✅ | ❌ |
| Save the Children BD | ✅ | ✅ | ❌ (intl staff via HQ) |
| CARE Bangladesh | ✅ | ✅ | ❌ (intl staff via CARE USA 403b) |
| UN Agencies | Own scheme (UNJSPF) | N/A | ✅ DB Pension (global, not local ERP) |

**Why PF IS the pension equivalent:**
- Provident Fund is a Defined Contribution (DC) retirement savings scheme
- Monthly contributions (employee + employer) accumulate
- Lump-sum payout at separation/retirement
- Employee can use PF balance to purchase annuity privately
- Combined with Gratuity lump-sum, this covers retirement needs

**WPPF (Workers Profit Participation Fund):** Does NOT apply to NGOs (non-profit entities exempt under BLA §232-234).

**Future-proofing:** If Universal Pension Act becomes mandatory for NGOs, it would be a simple monthly contribution (similar to PF) — can be added as an extension to existing Payroll module, not a separate module.

**Decision: PF (8b.3) + Gratuity (8b.2) = Complete retirement benefits coverage for Bangladesh NGOs.**
**Client-facing:** Menu shows "Pension Management" as parent — PF + Gratuity grouped underneath with combined Overview Dashboard + Retirement Summary. See §8b.4 for nav structure.

---

#### 8b.4 Updated Navigation (Final HR Sidebar)

```
👤 HR & Payroll
├── Employee Directory      (existing)
├── Recruitment             (Phase 8 ✅ + 8b.1 fixes)
├── Onboarding              (Phase 5 ✅ → 8b.1 REBUILD)
├── Contracts               (Phase 8 ✅)
├── Attendance              (existing)
├── Leave Management        (existing)
├── Holiday Calendar        (Phase 8 ✅)
├── Payroll                 (existing)
├── Pension Management      ★ NEW — Client-facing name for PF + Gratuity combined
│   ├── Overview Dashboard  ★ NEW — Combined PF+Gratuity retirement KPIs
│   ├── Provident Fund      (8b.3)
│   │   ├── PF Dashboard
│   │   ├── Policies
│   │   ├── Enrollments
│   │   ├── Contributions
│   │   ├── Withdrawals & Loans
│   │   ├── Trust Fund
│   │   └── PF Reports
│   ├── Gratuity Fund       (8b.2)
│   │   ├── Gratuity Dashboard
│   │   ├── Policies
│   │   ├── Employee Ledgers
│   │   ├── Payments
│   │   ├── Fund Management
│   │   └── Gratuity Reports
│   └── Retirement Summary  ★ NEW — Per-employee combined PF+Gratuity statement
├── Performance             (existing)
├── Training                (existing)
├── Offboarding             (Phase 8 ✅)
├── Grievances              (Phase 8 ✅)
├── Disciplinary            (Phase 8 ✅)
├── Org Chart               (existing)
├── HR Analytics            (Phase 8 ✅)
```

> **"Pension Management" naming rationale:** Client expects "Pension Management" in the menu.
> Technically Bangladesh NGOs don't have pension schemes (BLA 2006 has no pension for private/NGO sector).
> However PF + Gratuity together serve as the retirement benefit system.
> We label the parent menu "Pension Management" and group PF + Gratuity under it,
> plus add a combined Overview Dashboard and Retirement Summary for the unified view.

**Additional pages for the "Pension Management" wrapper:**

| Page | Route | Description |
|------|-------|-------------|
| Pension Overview | `/hr/pension` | Combined dashboard: Total retirement liability (PF + Gratuity), total fund balance, enrolled employees, monthly contribution total, upcoming settlements. Charts: liability trend, fund vs provision gap |
| Retirement Summary | `/hr/pension/retirement-summary` | Per-employee table: name, service years, PF balance, gratuity balance, total retirement benefit, vesting status. Click row → employee detail with PF statement + gratuity ledger combined |

**API for combined view:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/pension/overview` | Combined KPIs: total PF balance + gratuity liability, enrolled count, monthly contribution, fund adequacy ratio |
| GET | `/api/v1/hr/pension/retirement-summary` | Per-employee combined PF + Gratuity balances with service years and vesting |

**Route structure:**
```
/hr/pension                          → Overview Dashboard (combined)
/hr/pension/retirement-summary       → Per-employee combined statement
/hr/pension/provident-fund/...       → All PF sub-pages (8b.3)
/hr/pension/gratuity/...             → All Gratuity sub-pages (8b.2)
```

---

#### 8b.5 Summary — Phase 8b Totals

| Sub-module | New Models | New APIs | New/Rebuilt Pages |
|------------|-----------|----------|-------------------|
| 8b.1 Critical Fixes | 0 (uses existing) | 12 | 4 rebuilt + 1 new |
| 8b.2 Gratuity Fund | 6 | 18 | 11 |
| 8b.3 Provident Fund | 14 | 45 | 26 |
| Pension Management wrapper | 0 | 2 | 2 (overview + retirement summary) |
| **TOTAL** | **20** | **77** | **44** |

#### 8b.6 Implementation Order

| Step | What | Priority | Depends On |
|------|------|----------|------------|
| 1 | Fix A: Onboarding rebuild (static → API) | CRITICAL | — |
| 2 | Fix B: Employee document collection | CRITICAL | — |
| 3 | Fix C: Recruitment → Employee → Onboarding flow | CRITICAL | Fix A, Fix B |
| 4 | Fix D: CV scoring improvements (structured form, weights, comparison) | HIGH | — |
| 5 | Gratuity: Prisma models + policies + ledger APIs | HIGH | — |
| 6 | Gratuity: Accrual engine + payments + fund | HIGH | Step 5 |
| 7 | Gratuity: UI pages (11) | HIGH | Step 6 |
| 8 | Gratuity: Cross-module (Payroll, Finance JE, Offboarding) | HIGH | Step 7 |
| 9 | PF: Prisma models + policies + trust + enrollment | MEDIUM | — |
| 10 | PF: Contributions + interest + withdrawal + loan APIs | MEDIUM | Step 9 |
| 11 | PF: Settlement + investment APIs | MEDIUM | Step 10 |
| 12 | PF: UI pages (26) | MEDIUM | Step 11 |
| 13 | PF: Cross-module (Payroll deduction, Finance JE, Offboarding) | MEDIUM | Step 12 |
| 14 | Seed data for all new features | MEDIUM | Steps 1-13 |
| 15 | i18n (EN + BN) for all new features | MEDIUM | Steps 1-13 |

---

### Phase 9: Budget Management — International-Grade Upgrade

> **Priority: Transform basic budget into a world-class NGO financial planning & control system**
> **Benchmarks: SAP for Nonprofits, Sage Intacct Nonprofits, Unit4 ERP, NetSuite SocialImpact, Blackbaud Financial Edge NXT**
> **Compliance: USAID 2 CFR 200, EU FPA, DFID/FCDO, UNICEF HACT, Bangladesh NGOAB FD-6**

#### 9.0 Immediate Fixes (Pre-requisites)

1. ⏳ — Fix sidebar navigation: `/budget/create` → `/budget/new`
2. ⏳ — Ensure seed data pipeline works: seed-finance → seed-phase3 → seed-budget
3. ⏳ — Add loading states + error display on `/budget/new` dropdown fetches
4. ⏳ — Replace static pages (budget-vs-actual, revision, cost-allocation) with interactive API-driven pages

#### 9.1 Budget Phasing & Period Distribution

**New Prisma Models:**

```prisma
// ─── budget.prisma (additions) ───

model BudgetPeriodAllocation {
  id             String       @id @default(uuid()) @db.Uuid
  budgetLineId   String       @db.Uuid
  fiscalPeriodId String       @db.Uuid
  amount         Decimal      @db.Decimal(18, 2)
  notes          String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  budgetLine     BudgetLine   @relation(fields: [budgetLineId], references: [id], onDelete: Cascade)
  fiscalPeriod   FiscalPeriod @relation(fields: [fiscalPeriodId], references: [id])

  @@unique([budgetLineId, fiscalPeriodId])
  @@index([budgetLineId])
  @@index([fiscalPeriodId])
}
```

**Features:**
- Distribute each budget line across fiscal periods (months/quarters)
- Auto-spread options: equal distribution, front-loaded, back-loaded, custom
- Period allocation grid UI (Excel-like) with inline editing
- Validation: sum of period allocations = budget line total
- Cash flow forecast based on phased budget
- Compare phased budget vs actual spend per period

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/budget/:id/phasing` | Get period allocations for all lines |
| PUT | `/api/v1/budget/:id/phasing` | Save/update period allocations (bulk) |
| POST | `/api/v1/budget/:id/phasing/auto-spread` | Auto-distribute by method (equal/front/back) |

**UI Page:** `/budget/[id]/phasing` — Period allocation grid with spreadsheet-style editing

#### 9.2 Commitment / Encumbrance Tracking

**New Prisma Models:**

```prisma
model BudgetCommitment {
  id             String             @id @default(uuid()) @db.Uuid
  budgetId       String             @db.Uuid
  budgetLineId   String?            @db.Uuid
  sourceType     CommitmentSource   // PR, PO, CONTRACT
  sourceId       String             @db.Uuid
  sourceRef      String             // PR-2026-001, PO-2026-001
  amount         Decimal            @db.Decimal(18, 2)
  committedDate  DateTime
  releasedDate   DateTime?
  releasedAmount Decimal?           @db.Decimal(18, 2)
  status         CommitmentStatus   @default(COMMITTED)
  notes          String?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  budget         Budget             @relation(fields: [budgetId], references: [id])
  budgetLine     BudgetLine?        @relation(fields: [budgetLineId], references: [id])

  @@index([budgetId])
  @@index([sourceType, sourceId])
  @@index([status])
}

enum CommitmentSource {
  PURCHASE_REQUISITION
  PURCHASE_ORDER
  CONTRACT
}

enum CommitmentStatus {
  COMMITTED    // Reserved, not yet spent
  PARTIALLY_RELEASED  // Some amount converted to actual
  RELEASED     // Fully converted to actual expense
  CANCELLED    // PR/PO cancelled, budget released
}
```

**Cross-Module Integration:**
- **Procurement PR approval** → creates BudgetCommitment (COMMITTED)
- **PO creation from PR** → updates commitment source to PO
- **Voucher approval** → releases commitment (COMMITTED → RELEASED), creates actual
- **PR/PO cancellation** → cancels commitment (budget released back)

**Budget Available Balance Formula:**
```
Available = Budget Total - Committed - Actual Spent
```

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/budget/:id/commitments` | List all commitments for a budget |
| GET | `/api/v1/budget/:id/available` | Get available balance (total - committed - actual) |

**UI:** Commitment column added to Budget vs Actual page, commitment drill-down on click

#### 9.3 Budget Check Enforcement at Transaction Level

**Enhancement to existing APIs (no new models):**

**Where budget checks are enforced:**
| Transaction | Check Point | Hard/Soft | Action |
|-------------|-------------|-----------|--------|
| Purchase Requisition (POST) | On creation | Hard stop | Reject if insufficient budget |
| Purchase Order (POST) | On creation from PR | Hard stop | Re-validate budget availability |
| Voucher Approval (POST) | On approve | Configurable | Warn or reject based on org setting |
| Journal Entry (POST) | On posting | Soft warning | Flag over-budget, allow with override |
| Payroll Approval (POST) | On approve | Soft warning | Flag if salary exceeds personnel budget |

**New System Setting:**
```
budget_check_mode: 'HARD' | 'SOFT' | 'OFF'
  - HARD: Reject transactions exceeding budget
  - SOFT: Allow with warning + audit log
  - OFF: No budget check (for non-grant funded operations)
```

**Cross-Module Changes:**
- `POST /api/v1/procurement/requisitions` — already has budget check, enhance with commitment
- `POST /api/v1/finance/vouchers/:id/approve` — add budget line-level check before approval
- `POST /api/v1/hr/payroll/runs/:id/approve` — add personnel budget check
- `POST /api/v1/finance/journal-entries` — add budget warning on project-tagged entries

#### 9.4 Interactive Budget vs Actual Page

**Replace static page with full API-driven interactive page**

**Features:**
- Select budget from dropdown (or navigate from budget detail)
- Filter by: period, category, account, status
- Table columns: Budget Line | Category | Budgeted | Committed | Actual | Available | Variance | Utilization %
- Color-coded rows: green (< 80%), yellow (80-95%), red (> 95%), dark red (> 100%)
- Drill-down: click any actual/committed amount → see individual transactions
- Chart: stacked bar chart (budgeted vs committed vs actual) per category
- Period comparison: side-by-side monthly/quarterly breakdown
- Export: CSV + Print

**API Enhancement:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/budget/:id/vs-actual` | Enhanced: includes commitments, period breakdown, drill-down links |
| GET | `/api/v1/budget/:id/vs-actual/transactions` | Drill-down: list transactions for a budget line |

**UI Page:** `/budget/budget-vs-actual` — Full interactive page (replaces static demo)

#### 9.5 Interactive Budget Revision Page

**Replace static page with full API-driven interactive page**

**Features:**
- List all revisions for the organization (filterable by budget, status, date)
- Create new revision: select budget → shows current lines → edit amounts → provide justification per line
- Revision comparison: side-by-side original vs proposed with change % highlighted
- Approval workflow: Submit → Review → Approve/Reject with comments
- Cumulative revision history: Original → Rev 1 → Rev 2 → Current
- Impact analysis: show how revision affects ICR, cost share, donor amount
- Auto-check: does reallocation exceed donor flexibility rules (configurable % threshold)

**API Enhancement:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/budget/revisions` | List revisions (already exists, enhance filters) |
| POST | `/api/v1/budget/revisions` | Create revision (already exists) |
| GET | `/api/v1/budget/revisions/:id` | Get revision detail with line changes |
| PUT | `/api/v1/budget/revisions/:id` | Update draft revision |
| POST | `/api/v1/budget/revisions/:id/approve` | Approve (already exists, add comments) |
| POST | `/api/v1/budget/revisions/:id/reject` | Reject with reason |

**UI Page:** `/budget/revision` — Full interactive page (replaces static demo)

#### 9.6 Interactive Cost Allocation Page

**Replace static page with full API-driven interactive page**

**Features:**
- List all allocation rules with status (active/inactive)
- Create rule: name, description, total amount, frequency (monthly/quarterly/annually)
- Allocation entries: distribute across projects by percentage (must total 100%)
- Apply allocation: select period → generates journal entries for allocated amounts
- History: view past allocations with JE references
- Integration: allocated amounts show in Budget vs Actual as indirect costs

**API Enhancement:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/budget/cost-allocation` | List rules (already exists) |
| POST | `/api/v1/budget/cost-allocation` | Create rule (already exists) |
| GET | `/api/v1/budget/cost-allocation/:id` | Get rule detail with entries |
| PUT | `/api/v1/budget/cost-allocation/:id` | Update rule |
| DELETE | `/api/v1/budget/cost-allocation/:id` | Deactivate rule |
| POST | `/api/v1/budget/cost-allocation/:id/apply` | Apply for period (already exists, enhance with JE generation) |
| GET | `/api/v1/budget/cost-allocation/:id/history` | View past allocations |

**UI Page:** `/budget/cost-allocation` — Full interactive page (replaces static demo)

#### 9.7 Burn Rate Analysis & Forecasting

**Features:**
- Monthly burn rate: actual spend / months elapsed
- Projected burn rate: remaining budget / remaining months
- Runway calculation: at current burn rate, when will budget be exhausted?
- Underspend detection: if utilization < expected % for elapsed time, flag
- Trend chart: monthly spend over time with trendline
- Forecast: projected final cost (Estimate at Completion — EAC)
- Comparison: planned phased budget vs actual cumulative spend (S-curve)

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/budget/:id/burn-rate` | Monthly/cumulative burn rate analysis |
| GET | `/api/v1/budget/:id/forecast` | Projected spend, EAC, runway |

**UI Page:** Section within Budget detail page + standalone `/budget/analytics` dashboard

#### 9.8 Budget Cloning & Templates

**Features:**
- Clone budget: copy from existing budget → new budget with same structure, reset amounts
- Clone with escalation: apply % increase to all lines (e.g., 5% salary increase Year 2)
- Donor templates: pre-configured budget categories per donor format
  - USAID: Object Class Categories (Personnel, Fringe, Travel, Equipment, Supplies, Contractual, Other, IDC)
  - EU: Annex III format (Human Resources, Travel, Equipment, Local Office, Other Costs, Other Services)
  - DFID: Logframe-linked categories
  - Generic: Standard NGO format (Personnel, Operations, Equipment, Travel, Training, Admin, M&E)
- Template management: create/edit/delete templates

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/budget/:id/clone` | Clone budget with optional escalation |
| GET | `/api/v1/budget/templates` | List available templates |
| POST | `/api/v1/budget/templates` | Create template |
| GET | `/api/v1/budget/templates/:id` | Get template detail |
| PUT | `/api/v1/budget/templates/:id` | Update template |
| DELETE | `/api/v1/budget/templates/:id` | Delete template |
| POST | `/api/v1/budget/from-template` | Create budget from template |

**New Prisma Model:**
```prisma
model BudgetTemplate {
  id             String              @id @default(uuid()) @db.Uuid
  name           String
  description    String?
  donorFormat    String?             // USAID, EU, DFID, GENERIC
  categories     Json                // Array of {category, subCategories[], defaultAccountCode}
  includeICR     Boolean             @default(false)
  defaultICRRate Decimal?            @db.Decimal(5, 2)
  defaultICRBase IndirectCostBase?
  isGlobal       Boolean             @default(false) // System-wide vs org-specific
  organizationId String?             @db.Uuid
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  organization   Organization?       @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
}
```

#### 9.9 Budget Alerts & Notifications

**Features:**
- Configurable thresholds per budget: alert at 75%, 90%, 100% utilization
- Alert types: in-app notification + email (when email system implemented)
- Alert recipients: budget creator, project manager, finance admin
- Auto-check: daily cron job scans all ACTIVE budgets
- Line-level alerts: individual budget lines exceeding threshold
- Underspend alerts: utilization below expected % for elapsed time period

**Cross-Module:**
- Voucher approval → check budget utilization → trigger alert if threshold crossed
- Budget vs Actual page → visual indicators for alert status

**Cron Job:**
```
budget-threshold-alert: Daily 09:00 — Check all ACTIVE budgets against thresholds
```

#### 9.10 Enhanced NICRA Management

**Enhancement to existing fields:**
- Provisional vs final NICRA rate tracking per fiscal year
- MTDC base exclusion rules: auto-exclude equipment > $5,000, subawards > $25,000
- De minimis 10% option (2 CFR 200.414(f)) as alternative to negotiated NICRA
- ICR true-up calculation at year-end (provisional rate vs final rate)
- Fringe benefit rate as separate pool (optional)

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/budget/nicra` | Get org's NICRA settings |
| PUT | `/api/v1/budget/nicra` | Update NICRA rates (provisional/final) |
| GET | `/api/v1/budget/:id/icr-analysis` | ICR calculation detail with MTDC exclusions |

#### 9.11 Cross-Module Integration Fixes

**9.11.1 Procurement → Budget (Encumbrance)**
- `POST /api/v1/procurement/requisitions/[id]/approve` — create BudgetCommitment on approval
- `POST /api/v1/procurement/purchase-orders` — update commitment source PR → PO
- `DELETE/CANCEL /api/v1/procurement/requisitions/[id]` — release commitment

**9.11.2 Finance → Budget (Line-Level Actuals)**
- `POST /api/v1/finance/vouchers/[id]/approve` — match expense to budget line by accountId + projectId
- `GET /api/v1/budget/[id]/vs-actual` — include commitment column, period breakdown

**9.11.3 HR/Payroll → Budget (Personnel Cost Tracking)**
- `POST /api/v1/hr/payroll/runs/[id]/approve` — allocate salary to project based on employee LoE
- Personnel budget lines → compare with actual payroll charges per project

**9.11.4 Dashboard → Budget**
- Dashboard KPIs use Budget records (not just Project.totalBudget)
- Add budget utilization chart to dashboard
- Add over-budget project alerts

**9.11.5 Grant Lifecycle → Budget**
- Grant CLOSEOUT → auto-transition linked budgets to CLOSED
- Grant IMPLEMENTATION → enable budget activation
- Grant freeze → budget freeze

**9.11.6 Project ↔ Budget Reconciliation**
- Auto-sync: Project.totalBudget = sum(APPROVED/ACTIVE Budget.totalAmount)
- Prevent budget total exceeding project total (configurable)

#### 9.12 Budget Export & Reporting

**Features:**
- Export budget to Excel (internal format + donor-specific templates)
- Export Budget vs Actual to Excel/CSV
- Print-optimized budget summary (A4 portrait/landscape)
- Donor financial report generation:
  - USAID SF-425 format
  - EU Annex VI format
  - Generic donor report
- NGOAB FD-6 budget section auto-generation
- Cost share / matching report (required vs actual by period)

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/budget/:id/export` | Export budget (format=xlsx\|csv\|pdf) |
| GET | `/api/v1/budget/:id/donor-report` | Generate donor-specific financial report |
| GET | `/api/v1/budget/:id/cost-share-report` | Cost share verification report |

#### 9.13 Updated Navigation

```
📊 BUDGET MANAGEMENT
├── Budget List        (/budget)
├── Create Budget      (/budget/new)          ★ FIX: was /budget/create
├── Budget vs Actual   (/budget/budget-vs-actual)  ★ INTERACTIVE
├── Budget Revision    (/budget/revision)      ★ INTERACTIVE
├── Cost Allocation    (/budget/cost-allocation)   ★ INTERACTIVE
├── Budget Analytics   (/budget/analytics)     ★ NEW — burn rate, forecasting
├── Budget Templates   (/budget/templates)     ★ NEW — donor format templates
```

#### 9.14 Implementation Order

| Step | Task | Dependencies | Cross-Module Impact |
|------|------|-------------|---------------------|
| 9.0 | Immediate fixes (nav, seed, loading states) | None | Navigation, seed data |
| 9.1 | Budget phasing + period allocation | FiscalPeriod model exists | None |
| 9.2 | Commitment/encumbrance model | None | Procurement (PR approve) |
| 9.3 | Budget check enforcement | 9.2 | Procurement, Finance, HR |
| 9.4 | Interactive Budget vs Actual page | 9.2 | Finance JE data |
| 9.5 | Interactive Budget Revision page | None | Budget status workflow |
| 9.6 | Interactive Cost Allocation page | None | Finance JE generation |
| 9.7 | Burn rate & forecasting | 9.1, 9.4 | Dashboard |
| 9.8 | Budget cloning & templates | None | None |
| 9.9 | Budget alerts | 9.3 | Notification system |
| 9.10 | Enhanced NICRA | None | Finance reporting |
| 9.11 | Cross-module integration | 9.2, 9.3 | Procurement, Finance, HR, Dashboard, Grants |
| 9.12 | Export & reporting | 9.4 | NGOAB reports |
| 9.13 | Navigation update | All above | Sidebar |

> **Seed data (Phase 9):** 3 budgets with period allocations, 5 commitments (2 from PR, 2 from PO, 1 from contract), 2 budget revisions (1 approved, 1 draft), 3 cost allocation rules, 2 budget templates (USAID, EU)

### Phase 10: Cross-Module Integration (Week 30-36)

> **Priority: Wire up the 12 modules into a cohesive, fully integrated ERP where actions in one module automatically propagate to all relevant modules**
> **Benchmarks: Oracle ERP Cloud Budgetary Control & Encumbrance Accounting, SAP S/4HANA Budget Control, Sage Intacct Nonprofit Grant Lifecycle, Unit4 ERP for NGOs, NetSuite SocialImpact**
> **Compliance: USAID 2 CFR 200, NGOAB FD-6/FD-2/FD-3, Bangladesh FDRA 1978, EU FPA Annex III/VI**

Phase 9 defined the budget models and cross-module integration _points_ (9.2 commitments, 9.3 budget checks, 9.11 integration stubs). Phase 10 **implements all cross-module wiring end-to-end** with full API logic, UI changes, dashboard integration, NGOAB compliance reports, and automated tests.

---

#### 10.1 Procurement --> Budget Encumbrance (Full Implementation)

**Context:** Oracle ERP Cloud creates encumbrances at each stage of the procure-to-pay lifecycle: requisition creates a pre-encumbrance, PO creates an encumbrance, and invoice/payment relieves it. We adopt this three-stage model adapted for NGO procurement.

**New Prisma Model Additions (budget.prisma):**

```prisma
// Add to BudgetLine model
model BudgetLine {
  // ... existing fields ...
  commitments    BudgetCommitment[]
}

// Enhance BudgetCommitment (defined in Phase 9.2, add missing fields)
model BudgetCommitment {
  id                 String             @id @default(uuid()) @db.Uuid
  organizationId     String             @db.Uuid
  budgetId           String             @db.Uuid
  budgetLineId       String?            @db.Uuid
  sourceType         CommitmentSource   // PURCHASE_REQUISITION, PURCHASE_ORDER, CONTRACT
  sourceId           String             @db.Uuid
  sourceRef          String             // PR-2026-001, PO-2026-001
  description        String?
  amount             Decimal            @db.Decimal(18, 2)
  releasedAmount     Decimal            @default(0) @db.Decimal(18, 2)
  committedDate      DateTime
  releasedDate       DateTime?
  status             CommitmentStatus   @default(COMMITTED)
  // Lifecycle tracking
  parentCommitmentId String?            @db.Uuid  // PR commitment → PO commitment chain
  voucherIds         Json?              // Array of voucher IDs that released portions
  notes              String?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  organization       Organization       @relation(fields: [organizationId], references: [id])
  budget             Budget             @relation(fields: [budgetId], references: [id])
  budgetLine         BudgetLine?        @relation(fields: [budgetLineId], references: [id])
  parentCommitment   BudgetCommitment?  @relation("CommitmentChain", fields: [parentCommitmentId], references: [id])
  childCommitments   BudgetCommitment[] @relation("CommitmentChain")

  @@index([organizationId])
  @@index([budgetId])
  @@index([budgetLineId])
  @@index([sourceType, sourceId])
  @@index([status])
}
```

**Procurement Model Changes (procurement.prisma):**

```prisma
// Add to PurchaseRequisition
model PurchaseRequisition {
  // ... existing fields ...
  budgetId          String?    @db.Uuid   // Linked budget
  budgetLineId      String?    @db.Uuid   // Specific budget line (optional)
  budgetCheckResult Json?                  // {available, committed, actual, sufficient}

  @@index([budgetId])
}

// Add to PurchaseRequisitionLine
model PurchaseRequisitionLine {
  // ... existing fields ...
  accountId         String?    @db.Uuid   // GL account for budget line matching
}

// Add to PurchaseOrder
model PurchaseOrder {
  // ... existing fields ...
  projectId         String?    @db.Uuid   // Inherit from PR
  budgetId          String?    @db.Uuid   // Inherit from PR

  project           Project?   @relation(fields: [projectId], references: [id])

  @@index([projectId])
  @@index([budgetId])
}
```

**Encumbrance Lifecycle:**

```
Stage 1: PR Approved
  └─ budgetCheckAvailability(budgetId, amount)
  └─ If HARD mode: reject if available < amount
  └─ createCommitment(sourceType=PURCHASE_REQUISITION, status=COMMITTED)
  └─ Available balance reduced by committed amount

Stage 2: PO Created from PR
  └─ Original PR commitment → status=RELEASED
  └─ New PO commitment created (sourceType=PURCHASE_ORDER, parentCommitmentId=PR commitment)
  └─ If PO amount differs from PR, available balance adjusted

Stage 3: Voucher Approved (Payment)
  └─ PO commitment → partialRelease(voucherAmount)
  └─ When releasedAmount >= amount → status=RELEASED
  └─ Actual expense recorded in JE lines (tagged to budgetLineId via accountId+projectId)

Stage 4: PR/PO Cancelled
  └─ commitment.status → CANCELLED
  └─ Available balance restored
```

**Budget Available Balance Formula:**
```
Available = BudgetLine.totalAmount - sum(COMMITTED commitments) - sum(actual JE debits for accountId+projectId)
```

**New/Modified API Endpoints:**

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/v1/budget/:id/available` | Get available balance per line (total - committed - actual) | New |
| GET | `/api/v1/budget/:id/commitments` | List all commitments for a budget with status filter | New |
| GET | `/api/v1/budget/:id/commitments/:commitmentId` | Commitment detail with lifecycle chain | New |
| POST | `/api/v1/budget/check-availability` | Pre-check: `{budgetId, budgetLineId?, amount}` → `{sufficient, available, committed, actual}` | New |
| PUT | `/api/v1/procurement/requisitions/:id/approve` | **Modify**: After approval, call `createBudgetCommitment()` | Modify |
| POST | `/api/v1/procurement/orders` | **Modify**: When creating PO from PR, transfer commitment | Modify |
| PUT | `/api/v1/finance/vouchers/:id/approve` | **Modify**: On payment voucher for PO, release commitment | Modify |
| DELETE | `/api/v1/procurement/requisitions/:id` | **Modify**: On PR cancellation, cancel linked commitment | Modify |
| DELETE | `/api/v1/procurement/orders/:id` | **Modify**: On PO cancellation, cancel linked commitment | Modify |

**UI Changes:**

| Page | Change |
|------|--------|
| `/procurement/requisitions` (create/edit form) | Add budget selector dropdown; show available balance in real-time as user enters amounts; red warning if amount exceeds available; block submit if budget_check_mode=HARD |
| `/procurement/requisitions` (list) | Add "Budget Status" column (indicator: green checkmark if within budget, red X if over) |
| `/procurement/orders` (create from PR) | Show commitment transfer summary: "PR commitment of X will transfer to PO" |
| `/budget/budget-vs-actual` | Add "Committed" column between Budgeted and Actual; formula: Available = Budgeted - Committed - Actual; color code committed amounts in blue |
| `/budget/[id]` (detail page) | Add "Commitments" tab showing all active/released commitments with drill-down to source PR/PO |

**Shared Library — `lib/budget-check.ts`:**

```typescript
// Core functions used across modules
export async function checkBudgetAvailability(params: {
  budgetId: string;
  budgetLineId?: string;
  amount: Decimal;
  organizationId: string;
}): Promise<BudgetCheckResult>

export async function createBudgetCommitment(params: {
  organizationId: string;
  budgetId: string;
  budgetLineId?: string;
  sourceType: CommitmentSource;
  sourceId: string;
  sourceRef: string;
  amount: Decimal;
  description?: string;
}): Promise<BudgetCommitment>

export async function releaseCommitment(params: {
  commitmentId: string;
  releaseAmount: Decimal;
  voucherId?: string;
}): Promise<BudgetCommitment>

export async function transferCommitment(params: {
  fromCommitmentId: string;
  newSourceType: CommitmentSource;
  newSourceId: string;
  newSourceRef: string;
  newAmount?: Decimal; // If PO amount differs from PR
}): Promise<BudgetCommitment>

export async function cancelCommitment(commitmentId: string): Promise<void>
```

---

#### 10.2 HR/Payroll --> Budget Personnel Cost Tracking

**Context:** Nonprofit ERPs like Sage Intacct and Workday link grant data to payroll, time collection, and other cost-related business areas. Personnel costs are typically 60-70% of NGO budgets. The system must track employee level-of-effort (LoE) per project and allocate salary costs to project budgets accordingly.

**Existing Model (already in schema):**
- `EmployeeProjectAllocation` — has `employeeId`, `projectId`, `percentage`, `startDate`, `endDate`, `isActive`
- `PayrollEntry` — has per-employee salary breakdown
- `PayrollRun` — has `journalEntryId` for auto-generated JE

**New Prisma Model:**

```prisma
// Track payroll charges per project per employee per payroll run
model PayrollBudgetAllocation {
  id              String      @id @default(uuid()) @db.Uuid
  organizationId  String      @db.Uuid
  payrollRunId    String      @db.Uuid
  payrollEntryId  String      @db.Uuid
  employeeId      String      @db.Uuid
  projectId       String      @db.Uuid
  budgetId        String?     @db.Uuid
  budgetLineId    String?     @db.Uuid
  allocationPct   Decimal     @db.Decimal(5, 2)  // % of salary charged to this project
  grossAmount     Decimal     @db.Decimal(18, 2)  // Gross salary portion
  netAmount       Decimal     @db.Decimal(18, 2)  // Net salary portion (after deductions)
  fringeAmount    Decimal     @default(0) @db.Decimal(18, 2)  // Benefits/fringe portion
  totalCharge     Decimal     @db.Decimal(18, 2)  // gross + fringe
  period          String      // "2026-03" (YYYY-MM)
  createdAt       DateTime    @default(now())

  payrollRun      PayrollRun  @relation(fields: [payrollRunId], references: [id])
  payrollEntry    PayrollEntry @relation(fields: [payrollEntryId], references: [id])
  project         Project     @relation(fields: [projectId], references: [id])
  budget          Budget?     @relation(fields: [budgetId], references: [id])
  budgetLine      BudgetLine? @relation(fields: [budgetLineId], references: [id])

  @@unique([payrollEntryId, projectId])
  @@index([organizationId])
  @@index([payrollRunId])
  @@index([projectId])
  @@index([budgetId])
  @@index([period])
}
```

**Payroll Approval --> Budget Charge Flow:**

```
1. PayrollRun is PROCESSED (entries calculated)
2. Before approval, system calculates budget impact:
   For each PayrollEntry:
     a. Lookup EmployeeProjectAllocation records (active, date-overlapping)
     b. For each allocation:
        - grossPortion = entry.grossSalary * (allocation.percentage / 100)
        - fringePortion = (entry.pfDeduction + entry.medicalAllowance) * (allocation.percentage / 100)
        - totalCharge = grossPortion + fringePortion
     c. Find matching BudgetLine: category="Personnel" AND budget.projectId = allocation.projectId
     d. checkBudgetAvailability(budgetId, budgetLineId, totalCharge)
3. Show budget impact summary on approval screen
4. On approval:
   a. Create PayrollBudgetAllocation records
   b. Auto-generated JE lines tagged with projectId (already exists)
   c. Budget line actuals updated via JE line → accountId + projectId matching
5. Budget vs Actual → Personnel lines show actual payroll charges
```

**New/Modified API Endpoints:**

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/v1/hr/employees/:id/project-allocations` | Get employee's project allocation history | New |
| POST | `/api/v1/hr/employees/:id/project-allocations` | Create/update project allocation (validate total <= 100%) | New |
| PUT | `/api/v1/hr/employees/:id/project-allocations/:allocId` | Update allocation percentage/dates | New |
| DELETE | `/api/v1/hr/employees/:id/project-allocations/:allocId` | Deactivate allocation | New |
| GET | `/api/v1/hr/payroll/runs/:id/budget-impact` | Preview budget impact before approval | New |
| PUT | `/api/v1/hr/payroll/runs/:id/approve` | **Modify**: Create PayrollBudgetAllocation records, check personnel budget | Modify |
| GET | `/api/v1/budget/:id/personnel-summary` | Personnel budget vs actual summary (by employee, by period) | New |
| GET | `/api/v1/projects/:id/personnel-costs` | Project-level personnel cost breakdown (by employee, by month) | New |

**UI Changes:**

| Page | Change |
|------|--------|
| `/hr/employees/[id]` (detail page) | Add "Project Allocations" tab — table of project assignments with % allocation, date range, status; inline edit; validation: total active % <= 100% |
| `/hr/employees/new` and `/hr/employees/[id]/edit` | Add "Project Allocation" section in form with multi-row project + percentage input |
| `/hr/payroll/runs/[id]` (detail/approve page) | Add "Budget Impact" panel before approve button — table: Employee | Project | Budget | Allocated % | Gross Charge | Budget Available | Status (green/yellow/red) |
| `/budget/budget-vs-actual` | Personnel category lines show drill-down to individual employee charges when clicked |
| `/projects/[id]` (detail page) | Add "Personnel Costs" tab — monthly breakdown of salary charges by employee with LoE % |

**New Page:**

| Path | Description |
|------|-------------|
| `/hr/project-allocations` | Organization-wide employee project allocation matrix — rows=employees, columns=projects, cells=% allocation. Filter by department, project, status. Export CSV. |

---

#### 10.3 Dashboard --> Budget KPIs

**Context:** Nonprofit dashboards must connect spending data to budget data so leaders see cost per impact achieved, not just raw numbers. Key KPIs include budget utilization rate by program, burn rate, runway, and over-budget alerts.

**Current Dashboard State:**
- KPIs: Total Fund Received, Fund Utilized, Active Projects, Active Beneficiaries, Pending Actions
- Charts: Monthly income/expense, top donors, project progress, beneficiary trend
- Missing: All budget-related KPIs

**New Dashboard KPI Cards:**

| KPI | Source | Calculation |
|-----|--------|-------------|
| Total Budget (All Active) | `Budget WHERE status=ACTIVE` | `sum(totalAmount)` |
| Budget Utilization Rate | Budget + JE actuals | `(totalActual / totalBudget) * 100%` |
| Total Committed | BudgetCommitment WHERE status=COMMITTED | `sum(amount - releasedAmount)` |
| Budget Burn Rate | Monthly actuals trend | `avgMonthlySpend = totalActual / monthsElapsed` |
| Projected Runway | Burn rate + remaining | `remainingBudget / avgMonthlySpend` (months) |
| Over-Budget Projects | Budget lines where actual > budgeted | Count of projects with any line > 100% |

**New Dashboard Widgets:**

| Widget | Type | Description |
|--------|------|-------------|
| Budget Utilization Gauge | Gauge chart (Recharts) | Overall utilization % with color zones: green 0-75%, yellow 75-90%, red 90-100%, dark red >100% |
| Budget vs Actual Mini-Chart | Stacked bar chart | Top 5 active budgets: budgeted (gray) vs committed (blue) vs actual (green/red) |
| Burn Rate Trend | Line chart | Monthly actual spend for last 6 months with projected trendline |
| Over-Budget Alerts | Alert list | List of budget lines exceeding threshold with project name, budget name, utilization %, link to budget detail |
| Grant Budget Status | Table | Active grants with columns: Grant | Budget | Utilized % | Remaining | Status indicator |

**New/Modified API Endpoints:**

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/v1/dashboard` | **Modify**: Add budget KPIs to existing response | Modify |
| GET | `/api/v1/dashboard/budget-kpis` | Dedicated budget KPI endpoint (for lazy loading) | New |
| GET | `/api/v1/dashboard/budget-chart` | Budget vs actual chart data for top N budgets | New |
| GET | `/api/v1/dashboard/burn-rate` | Monthly burn rate trend (last 6-12 months) | New |
| GET | `/api/v1/dashboard/budget-alerts` | Over-budget and under-spend alerts | New |

**UI Changes:**

| Page | Change |
|------|--------|
| `/dashboard` | Add second row of KPI cards (Budget Utilization, Committed, Burn Rate, Runway) below existing row |
| `/dashboard` | Add Budget vs Actual mini-chart widget in charts section |
| `/dashboard` | Add "Budget Alerts" widget — collapsible alert panel showing over-budget warnings with links |
| `/dashboard` | Add Burn Rate trend line chart |

---

#### 10.4 Grant Lifecycle --> Budget Freeze/Close

**Context:** Sage Intacct manages grants through the entire lifecycle from application to closeout, automatically controlling what financial operations are permitted at each stage. When a grant enters closeout, all linked budgets should be frozen to prevent new charges.

**Existing State:**
- `Grant.lifecycleStage` enum: `IDENTIFICATION | PROPOSAL | NEGOTIATION | AGREEMENT | IMPLEMENTATION | CLOSEOUT`
- `Grant.status` enum: `PIPELINE | PROPOSAL | NEGOTIATION | ACTIVE | SUSPENDED | COMPLETED | CLOSED`
- `Budget.status` enum: `DRAFT | SUBMITTED | APPROVED | ACTIVE | CLOSED | REVISED`
- Grant lifecycle API exists at `PUT /api/v1/donors/grants/:id/lifecycle`

**New Enum Values (base.prisma):**

```prisma
enum BudgetStatus {
  DRAFT
  SUBMITTED
  APPROVED
  ACTIVE
  FROZEN       // NEW — No new transactions allowed, existing commitments honored
  CLOSED
  REVISED
}
```

**Grant --> Budget Lifecycle Mapping:**

| Grant Lifecycle Change | Budget Action | Automatic |
|----------------------|---------------|-----------|
| `AGREEMENT` → `IMPLEMENTATION` | Linked budgets eligible for ACTIVE status | Manual activation |
| `IMPLEMENTATION` → `CLOSEOUT` | All linked ACTIVE budgets → `FROZEN` | **Automatic** |
| Grant `status` → `SUSPENDED` | All linked ACTIVE budgets → `FROZEN` | **Automatic** |
| Grant `status` → `ACTIVE` (unsuspend) | All linked FROZEN budgets → `ACTIVE` | **Automatic** |
| Grant `status` → `CLOSED` | All linked budgets → `CLOSED` | **Automatic** |
| Grant `status` → `COMPLETED` | All linked budgets → `CLOSED`, generate final report | **Automatic** |

**FROZEN Budget Rules:**
- No new Purchase Requisitions against this budget
- No new Vouchers against this budget
- No new Payroll charges against this budget
- Existing COMMITTED encumbrances remain (can be released/cancelled)
- Budget vs Actual read access continues
- Budget revision NOT allowed
- Manual override: Finance Admin can unfreeze with audit trail

**New/Modified API Endpoints:**

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| PUT | `/api/v1/donors/grants/:id/lifecycle` | **Modify**: On CLOSEOUT, auto-freeze linked budgets; on CLOSED, auto-close budgets | Modify |
| PUT | `/api/v1/donors/grants/:id` | **Modify**: On status=SUSPENDED, freeze budgets; on status=ACTIVE, unfreeze | Modify |
| POST | `/api/v1/budget/:id/freeze` | Manual freeze with reason (Finance Admin only) | New |
| POST | `/api/v1/budget/:id/unfreeze` | Manual unfreeze with reason (Finance Admin only) | New |
| GET | `/api/v1/donors/grants/:id/budget-summary` | Grant-level budget summary: total budgeted, committed, actual, available across all linked budgets | New |

**UI Changes:**

| Page | Change |
|------|--------|
| `/donors/grants/[id]` (detail page) | Add "Budget Status" section — table of linked budgets with status badges (ACTIVE=green, FROZEN=blue/ice, CLOSED=gray); total budget summary; link to each budget detail |
| `/donors/grants/[id]` (detail page) | Lifecycle stage change modal shows warning: "Changing to CLOSEOUT will freeze X linked budgets" with confirmation |
| `/donors/grant-lifecycle` | Add "Budget Impact" column showing count of affected budgets per grant |
| `/budget` (list page) | FROZEN budgets show ice/snowflake icon with tooltip "Frozen due to grant closeout/suspension" |
| `/budget/[id]` (detail page) | Frozen banner: "This budget is frozen. Grant [GrantNo] is in CLOSEOUT stage. No new transactions allowed." with unfreeze button for Finance Admin |

---

#### 10.5 Project <--> Budget Reconciliation

**Context:** Project.totalBudget must always reflect the sum of linked active budgets. This prevents data drift where project and budget records disagree.

**Reconciliation Rules:**

```
Rule 1: Project.totalBudget = sum(Budget.totalAmount WHERE projectId=X AND status IN (APPROVED, ACTIVE))
Rule 2: Budget creation validates: sum(existing budgets) + new budget <= Project.totalBudget (if ceiling enforced)
Rule 3: Budget revision auto-updates Project.totalBudget
Rule 4: Project detail page shows budget breakdown
```

**System Setting:**
```
project_budget_ceiling_mode: 'ENFORCE' | 'WARN' | 'OFF'
  - ENFORCE: Budget total cannot exceed project total (reject)
  - WARN: Allow with warning + audit log
  - OFF: No validation
```

**New/Modified API Endpoints:**

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/v1/budget` | **Modify**: After budget creation with status APPROVED/ACTIVE, auto-update Project.totalBudget | Modify |
| PUT | `/api/v1/budget/:id` | **Modify**: On budget amount change, re-sync Project.totalBudget | Modify |
| PUT | `/api/v1/budget/:id/status` | **Modify**: On status change to ACTIVE/CLOSED, re-sync Project.totalBudget | Modify |
| POST | `/api/v1/budget/revisions/:id/approve` | **Modify**: On revision approval, update budget totals and re-sync Project.totalBudget | Modify |
| GET | `/api/v1/projects/:id/budget-breakdown` | Budget breakdown: list of budgets, per-budget amount, combined totals, variance from Project.totalBudget | New |
| POST | `/api/v1/projects/reconcile-budgets` | Batch reconciliation: scan all active projects, detect mismatches, auto-fix | New |

**Shared Library — `lib/project-budget-sync.ts`:**

```typescript
export async function syncProjectBudgetTotal(projectId: string): Promise<{
  previousTotal: Decimal;
  newTotal: Decimal;
  budgetCount: number;
}>

export async function validateBudgetAgainstProject(params: {
  projectId: string;
  newBudgetAmount: Decimal;
  excludeBudgetId?: string; // For edits, exclude self
}): Promise<{ allowed: boolean; currentTotal: Decimal; projectCeiling: Decimal; }>
```

**UI Changes:**

| Page | Change |
|------|--------|
| `/projects/[id]` (detail page) | Add "Budget Breakdown" section — table of linked budgets: Budget Name | Grant | Status | Amount | Utilization % | quick-link to budget detail. Summary row: Total Budgeted | Total Committed | Total Actual | Total Available |
| `/budget/new` | After selecting project, show: "Project total budget: X | Already budgeted: Y | Remaining: Z". If project_budget_ceiling_mode=ENFORCE, cap max amount at Z |
| `/projects/dashboard` | Add budget column to project listing with utilization mini-bar |

---

#### 10.6 Finance --> Budget Line-Level Tracking

**Context:** Voucher approval must map expenses to specific budget lines. Oracle ERP accomplishes this through dimension tagging on every transaction (account + project + fund). We use `accountId + projectId` as the composite key to match JE lines to budget lines.

**Matching Logic:**

```
When a JournalEntryLine is posted (via voucher approval or direct JE posting):
  1. If JELine has accountId AND journalEntry has projectId:
     a. Find BudgetLine WHERE budgetLine.accountId = JELine.accountId
        AND budgetLine.budget.projectId = JE.projectId
        AND budgetLine.budget.status IN (ACTIVE)
     b. If found: this JELine contributes to that budget line's actual spend
     c. If not found: JELine is "unbudgeted" (flagged in Budget vs Actual as "Unallocated")
  2. Budget vs Actual API aggregates actuals from matched JE lines
```

**New Field on JournalEntryLine (finance.prisma):**

```prisma
model JournalEntryLine {
  // ... existing fields ...
  budgetLineId    String?      @db.Uuid  // Auto-matched or manually tagged
  budgetLine      BudgetLine?  @relation(fields: [budgetLineId], references: [id])

  @@index([budgetLineId])
}
```

**New/Modified API Endpoints:**

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| PUT | `/api/v1/finance/vouchers/:id/approve` | **Modify**: On approval, auto-match each JE line to budget line by accountId + projectId. Set `budgetLineId` on JELine. Log warning if no match found. | Modify |
| POST | `/api/v1/finance/journal-entries` | **Modify**: On project-tagged JE creation, attempt budget line matching. Show soft warning if over budget (when budget_check_mode=SOFT). | Modify |
| GET | `/api/v1/budget/:id/vs-actual` | **Modify**: Compute actuals from `JournalEntryLine WHERE budgetLineId=X AND journalEntry.status=APPROVED`. Include unmatched line totals. | Modify |
| GET | `/api/v1/budget/:id/vs-actual/transactions` | Drill-down: list individual JE lines matched to a specific budget line | New |
| GET | `/api/v1/budget/:id/unmatched-transactions` | List JE lines for this budget's project that could not be matched to any budget line | New |
| POST | `/api/v1/budget/:id/rematch-transactions` | Re-run matching algorithm for all JE lines in budget period (admin utility) | New |

**UI Changes:**

| Page | Change |
|------|--------|
| `/budget/budget-vs-actual` | Click on any "Actual" amount cell → slide-over panel showing individual JE lines (date, voucher no, description, amount). Click JE line → navigate to voucher/JE detail. |
| `/budget/budget-vs-actual` | "Unmatched" row at bottom: total of JE lines tagged to this project but not matching any budget line. Click to see list. |
| `/finance/vouchers/[id]` (detail page) | Show "Budget Line" tag on each voucher line item (auto-matched). Badge: "Matched to BUD-2026-001 / Personnel" |
| `/finance/journal-entries` (create form) | When project is selected, show budget status tooltip next to amount field |

---

#### 10.7 NGOAB Compliance Reports

**Context:** Bangladesh NGOs receiving foreign donations must submit reports to NGOAB in prescribed formats. Key forms: FD-6 (project proposal with budget), FD-2 (request for next fund installment with expenditure statement), FD-3 (annual statement of foreign donations received and spent). The system auto-generates these from existing budget and financial data.

**NGOAB FD-6 Budget Categories:**

The FD-6 budget section follows a prescribed format with these standard categories:
1. Personnel (Foreign Nationals, Bangladeshi Nationals — salary, benefits, allowances)
2. Travel (International, Local)
3. Equipment & Materials (Office Equipment, Vehicles, Machinery)
4. Civil Construction / Infrastructure
5. Training, Seminars, Workshops & Conferences
6. Operational Costs (Office Rent, Utilities, Communication)
7. Monitoring & Evaluation
8. Administrative Overhead (capped at 7.5% or as approved)
9. Contingency
10. Others

**NGOAB FD-2 Expenditure Statement Sections:**
1. Organization Details (name, registration no, FD-1 reference)
2. Project Details (name, approval date, FD-6 reference)
3. Fund Receipt Summary (date, amount, exchange rate, bank)
4. Budget vs Expenditure Comparison (NGOAB category-wise)
5. Personnel Expenditure Detail (by nationality, by position)
6. Remaining Balance and Justification for Next Installment

**New Prisma Model:**

```prisma
model NgoabReport {
  id              String           @id @default(uuid()) @db.Uuid
  organizationId  String           @db.Uuid
  reportType      NgoabReportType  // FD6_BUDGET, FD2_EXPENDITURE, FD3_ANNUAL, COST_SHARE
  grantId         String           @db.Uuid
  projectId       String           @db.Uuid
  budgetId        String?          @db.Uuid
  periodStart     DateTime?
  periodEnd       DateTime?
  generatedData   Json             // Full report data (structured for template rendering)
  status          ApprovalStatus   @default(DRAFT)
  generatedById   String           @db.Uuid
  approvedById    String?          @db.Uuid
  approvedAt      DateTime?
  submittedAt     DateTime?
  ngoabRef        String?          // NGOAB acknowledgment reference
  notes           String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  organization    Organization     @relation(fields: [organizationId], references: [id])
  grant           Grant            @relation(fields: [grantId], references: [id])
  project         Project          @relation(fields: [projectId], references: [id])
  budget          Budget?          @relation(fields: [budgetId], references: [id])

  @@index([organizationId])
  @@index([grantId])
  @@index([reportType])
  @@index([status])
}

enum NgoabReportType {
  FD6_BUDGET             // Project proposal budget
  FD2_EXPENDITURE        // Expenditure statement for next installment
  FD3_ANNUAL             // Annual foreign donation statement
  COST_SHARE             // Cost share/matching verification
}

// Mapping table: BudgetLine categories → NGOAB FD-6 categories
model NgoabCategoryMapping {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String   @db.Uuid
  budgetCategory  String   // Internal category (e.g., "Personnel", "Operations")
  budgetSubCategory String? // Internal sub-category
  ngoabCategory   String   // NGOAB FD-6 category name
  ngoabCategoryNo Int      // NGOAB category number (1-10)
  sortOrder       Int      @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())

  @@unique([organizationId, budgetCategory, budgetSubCategory])
  @@index([organizationId])
}
```

**New API Endpoints:**

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/v1/reports/ngoab/fd6/:grantId` | Generate FD-6 budget section from budget data (auto-maps categories) | New |
| GET | `/api/v1/reports/ngoab/fd2/:grantId` | Generate FD-2 expenditure statement (budget vs actual by NGOAB categories) | New |
| GET | `/api/v1/reports/ngoab/fd3/:grantId` | Generate FD-3 annual statement (fund receipts + expenditure) | New |
| GET | `/api/v1/reports/ngoab/cost-share/:budgetId` | Cost share verification report (required vs actual matching) | New |
| POST | `/api/v1/reports/ngoab` | Save generated report as NgoabReport record | New |
| GET | `/api/v1/reports/ngoab` | List NGOAB reports (filter by type, grant, status) | New |
| GET | `/api/v1/reports/ngoab/:id` | Get report detail | New |
| PUT | `/api/v1/reports/ngoab/:id/approve` | Approve report for submission | New |
| GET | `/api/v1/settings/ngoab-category-mapping` | Get category mappings | New |
| PUT | `/api/v1/settings/ngoab-category-mapping` | Update category mappings (bulk) | New |

**UI Pages:**

| Path | Description |
|------|-------------|
| `/reports/ngoab` | NGOAB Reports hub — cards for each report type (FD-6, FD-2, FD-3, Cost Share). Click to generate. List of previously generated reports with status. |
| `/reports/ngoab/generate` | Report generation wizard: Step 1 — Select report type + grant + period; Step 2 — Preview generated data (editable before save); Step 3 — Save/Approve/Export |
| `/reports/ngoab/[id]` | Report detail — full report view with print-optimized layout matching NGOAB prescribed format. Actions: Edit, Approve, Export (PDF/Excel), Mark Submitted |
| `/settings/ngoab-mapping` | NGOAB Category Mapping — table: Internal Budget Category → NGOAB Category. Drag-and-drop reorder. Bulk edit. |

**Report Templates:**

The FD-6 budget export produces a table with columns:
```
| Sl. | Head of Expenditure | Year 1 (BDT) | Year 2 (BDT) | ... | Total (BDT) | Total (USD) |
```

The FD-2 expenditure export produces:
```
| Sl. | Head of Expenditure | Approved Budget | Previous Expenditure | Current Period | Cumulative | Balance |
```

---

#### 10.8 Implementation Order & Dependencies

| Step | Task | Dependencies | Cross-Module Impact | Estimated Effort |
|------|------|-------------|---------------------|-----------------|
| **10.1a** | `lib/budget-check.ts` — shared budget checking library | Phase 9.2 (BudgetCommitment model) | Foundation for all integration | 1 day |
| **10.1b** | Budget availability & commitment APIs | 10.1a | Budget module | 1 day |
| **10.1c** | PR approve → create commitment | 10.1a, 10.1b | Procurement | 1 day |
| **10.1d** | PO create → transfer commitment | 10.1c | Procurement | 0.5 day |
| **10.1e** | Voucher approve → release commitment | 10.1a | Finance | 1 day |
| **10.1f** | PR/PO cancel → cancel commitment | 10.1c | Procurement | 0.5 day |
| **10.1g** | Procurement UI (budget selector, availability display) | 10.1b | Procurement pages | 1 day |
| **10.1h** | Budget vs Actual — committed column | 10.1b | Budget pages | 0.5 day |
| **10.2a** | Employee project allocation CRUD APIs | None | HR module | 1 day |
| **10.2b** | Employee project allocation UI (employee detail tab) | 10.2a | HR pages | 1 day |
| **10.2c** | PayrollBudgetAllocation model + payroll approval integration | 10.2a | HR + Budget | 1.5 days |
| **10.2d** | Payroll budget impact preview API + UI | 10.2c | HR payroll pages | 1 day |
| **10.2e** | Personnel cost summary APIs + project detail UI | 10.2c | Project + Budget pages | 1 day |
| **10.2f** | Organization-wide project allocation matrix page | 10.2a | New HR page | 1 day |
| **10.3a** | Dashboard budget KPI APIs | 10.1b | Dashboard API | 1 day |
| **10.3b** | Dashboard budget widgets UI | 10.3a | Dashboard page | 1.5 days |
| **10.3c** | Dashboard budget alerts widget | 10.3a, Phase 9.9 | Dashboard page | 0.5 day |
| **10.4a** | Grant lifecycle → budget freeze/close logic | None | Donor + Budget | 1 day |
| **10.4b** | Budget freeze/unfreeze APIs | 10.4a | Budget module | 0.5 day |
| **10.4c** | Grant detail → budget summary UI | 10.4a | Donor pages | 1 day |
| **10.4d** | Budget frozen state UI (banners, icons, form disabling) | 10.4b | Budget pages | 0.5 day |
| **10.5a** | Project-budget sync library + APIs | None | Project + Budget | 1 day |
| **10.5b** | Budget creation → project ceiling validation | 10.5a | Budget create page | 0.5 day |
| **10.5c** | Project detail → budget breakdown UI | 10.5a | Project pages | 1 day |
| **10.5d** | Batch reconciliation API | 10.5a | Admin utility | 0.5 day |
| **10.6a** | JE line → budget line matching logic | 10.1a | Finance + Budget | 1 day |
| **10.6b** | Voucher approve → auto-tag budget line | 10.6a | Finance API | 0.5 day |
| **10.6c** | Budget vs Actual → transaction drill-down | 10.6a | Budget pages | 1 day |
| **10.6d** | Unmatched transactions UI | 10.6c | Budget pages | 0.5 day |
| **10.7a** | NGOAB category mapping model + settings API | None | Settings | 0.5 day |
| **10.7b** | FD-6 budget report generation API | 10.7a | Reports | 1.5 days |
| **10.7c** | FD-2 expenditure report generation API | 10.7a, 10.6a | Reports | 1.5 days |
| **10.7d** | FD-3 annual statement API | 10.7a | Reports | 1 day |
| **10.7e** | Cost share verification report API | 10.7a | Reports | 0.5 day |
| **10.7f** | NGOAB reports UI (hub + generation wizard + detail view) | 10.7b, 10.7c, 10.7d | New pages | 2 days |
| **10.7g** | NGOAB category mapping settings UI | 10.7a | Settings page | 0.5 day |

**Total estimated effort: ~30 days (6 weeks at 5 days/week)**

**Recommended parallel tracks:**
- **Track A (Budget Core):** 10.1a → 10.1b → 10.1c → 10.1d → 10.1e → 10.1f → 10.6a → 10.6b
- **Track B (HR/Payroll):** 10.2a → 10.2b → 10.2c → 10.2d → 10.2e → 10.2f
- **Track C (Grant/Project):** 10.4a → 10.4b → 10.5a → 10.5b → 10.5c → 10.5d
- **Track D (Dashboard):** 10.3a → 10.3b → 10.3c (after Track A reaches 10.1b)
- **Track E (NGOAB):** 10.7a → 10.7b → 10.7c → 10.7d → 10.7e → 10.7f → 10.7g (after Track A reaches 10.6a)
- **Track F (UI Polish):** 10.1g → 10.1h → 10.4c → 10.4d → 10.6c → 10.6d (after respective APIs)

---

#### 10.9 i18n Keys

**New message keys to add across `src/messages/{en,bn}/` files:**

**`budget.json` additions:**
```json
{
  "committed": "Committed",
  "available": "Available",
  "frozen": "Frozen",
  "frozenBanner": "This budget is frozen. No new transactions are allowed.",
  "frozenReason": "Frozen due to grant {grantNo} entering {stage} stage.",
  "unfreezeButton": "Unfreeze Budget",
  "freezeButton": "Freeze Budget",
  "freezeConfirm": "Are you sure you want to freeze this budget? No new transactions will be allowed.",
  "unfreezeConfirm": "Are you sure you want to unfreeze this budget? New transactions will be allowed.",
  "commitments": "Commitments",
  "commitmentSource": "Source",
  "commitmentAmount": "Committed Amount",
  "commitmentReleased": "Released Amount",
  "commitmentStatus": "Commitment Status",
  "budgetCheck": "Budget Check",
  "budgetCheckPassed": "Budget available: sufficient funds",
  "budgetCheckFailed": "Insufficient budget. Available: {available}, Required: {required}",
  "budgetCheckWarning": "Budget will be {percent}% utilized after this transaction",
  "budgetAvailable": "Available Balance",
  "budgetUtilization": "Budget Utilization",
  "burnRate": "Burn Rate",
  "projectedRunway": "Projected Runway",
  "monthsRemaining": "{count} months remaining",
  "overBudget": "Over Budget",
  "underSpend": "Under Spend",
  "unmatchedTransactions": "Unmatched Transactions",
  "personnelSummary": "Personnel Cost Summary",
  "budgetBreakdown": "Budget Breakdown",
  "reconcile": "Reconcile with Project",
  "reconciledSuccess": "Project budget reconciled successfully",
  "ceilingExceeded": "Budget total exceeds project ceiling by {amount}",
  "lineActuals": "Line-Level Actuals",
  "drillDown": "View Transactions",
  "matchedTo": "Matched to {budgetLineDescription}"
}
```

**`hr.json` additions:**
```json
{
  "projectAllocations": "Project Allocations",
  "allocationPercent": "Allocation %",
  "totalAllocation": "Total Allocation",
  "allocationExceeds": "Total allocation cannot exceed 100%",
  "addAllocation": "Add Project Allocation",
  "noAllocations": "No project allocations configured",
  "budgetImpact": "Budget Impact",
  "budgetImpactPreview": "Payroll Budget Impact Preview",
  "personnelCharge": "Personnel Charge",
  "grossCharge": "Gross Charge to Project",
  "fringeCharge": "Fringe Charge",
  "allocationMatrix": "Project Allocation Matrix",
  "unallocated": "Unallocated"
}
```

**`dashboard.json` additions:**
```json
{
  "totalBudget": "Total Active Budget",
  "budgetUtilization": "Budget Utilization",
  "totalCommitted": "Total Committed",
  "burnRate": "Monthly Burn Rate",
  "projectedRunway": "Projected Runway",
  "overBudgetProjects": "Over-Budget Projects",
  "budgetVsActualChart": "Budget vs Actual",
  "burnRateTrend": "Burn Rate Trend",
  "budgetAlerts": "Budget Alerts",
  "grantBudgetStatus": "Grant Budget Status",
  "noAlerts": "All budgets within threshold"
}
```

**`donors.json` additions:**
```json
{
  "budgetStatus": "Budget Status",
  "budgetSummary": "Budget Summary",
  "linkedBudgets": "Linked Budgets",
  "freezeWarning": "Changing to {stage} will freeze {count} linked budget(s)",
  "grantBudgetTotal": "Total Budgeted (All Linked)",
  "grantBudgetActual": "Total Actual Spend",
  "grantBudgetAvailable": "Total Available"
}
```

**`procurement.json` additions:**
```json
{
  "budgetSelector": "Select Budget",
  "budgetAvailability": "Budget Availability",
  "budgetLine": "Budget Line",
  "insufficientBudget": "Insufficient budget for this requisition",
  "commitmentCreated": "Budget commitment created",
  "commitmentTransferred": "Commitment transferred from PR to PO",
  "commitmentReleased": "Budget commitment released"
}
```

**`reports.json` additions:**
```json
{
  "ngoabReports": "NGOAB Reports",
  "fd6Budget": "FD-6 Project Budget",
  "fd6Description": "Auto-generate FD-6 budget section from budget data",
  "fd2Expenditure": "FD-2 Expenditure Statement",
  "fd2Description": "Budget vs actual expenditure by NGOAB categories for fund installment request",
  "fd3Annual": "FD-3 Annual Statement",
  "fd3Description": "Annual statement of foreign donations received and spent",
  "costShareReport": "Cost Share Verification",
  "costShareDescription": "Verify required vs actual matching/cost-share contributions",
  "ngoabCategoryMapping": "NGOAB Category Mapping",
  "headOfExpenditure": "Head of Expenditure",
  "approvedBudget": "Approved Budget",
  "previousExpenditure": "Previous Expenditure",
  "currentPeriod": "Current Period Expenditure",
  "cumulativeExpenditure": "Cumulative Expenditure",
  "generateReport": "Generate Report",
  "reportGenerated": "Report generated successfully",
  "markSubmitted": "Mark as Submitted to NGOAB"
}
```

**`settings.json` additions:**
```json
{
  "budgetCheckMode": "Budget Check Mode",
  "budgetCheckModeHard": "Hard — Reject transactions exceeding budget",
  "budgetCheckModeSoft": "Soft — Allow with warning and audit log",
  "budgetCheckModeOff": "Off — No budget checking",
  "projectBudgetCeiling": "Project Budget Ceiling",
  "projectBudgetCeilingEnforce": "Enforce — Budget total cannot exceed project total",
  "projectBudgetCeilingWarn": "Warn — Allow with warning",
  "projectBudgetCeilingOff": "Off — No ceiling validation",
  "ngoabSettings": "NGOAB Settings",
  "ngoabRegistrationNo": "NGOAB Registration No",
  "ngoabFd1Reference": "FD-1 Reference No"
}
```

---

#### 10.10 Testing Scenarios

**10.10.1 Procurement --> Budget Encumbrance Tests**

| Test Case | Input | Expected | Cross-Module Impact |
|-----------|-------|----------|---------------------|
| PR approval creates commitment | Approve PR with budgetId, amount=50000 | BudgetCommitment created (status=COMMITTED, amount=50000). Budget available reduced by 50000. | Budget: available balance changes |
| PR approval blocked (HARD mode) | PR amount=100000, budget available=80000, mode=HARD | 400 error: "Insufficient budget" | None (rejected) |
| PR approval warned (SOFT mode) | PR amount=100000, budget available=80000, mode=SOFT | PR approved + commitment created + audit log warning | Budget: commitment created |
| PO from PR transfers commitment | Create PO from approved PR | PR commitment → RELEASED. New PO commitment created with parentCommitmentId. | Budget: same available |
| PO amount differs from PR | PO amount=45000, PR commitment=50000 | PR commitment RELEASED. PO commitment=45000. Available increases by 5000. | Budget: available adjusted |
| Voucher releases commitment | Approve payment voucher for PO | PO commitment.releasedAmount += voucher amount. If fully released → status=RELEASED. | Budget: committed decreases, actual increases (net zero on available) |
| Partial payment | Voucher=30000 on PO commitment=50000 | commitment.releasedAmount=30000, status=PARTIALLY_RELEASED | Budget: committed-30K, actual+30K |
| PR cancelled | Cancel PR with active commitment | Commitment status=CANCELLED. Budget available restored. | Budget: available increases |
| PO cancelled after partial payment | Cancel PO, releasedAmount=30000, amount=50000 | Commitment CANCELLED. Remaining 20000 released back. Actual 30000 stays. | Budget: committed decreases |

**10.10.2 HR/Payroll --> Budget Tests**

| Test Case | Input | Expected | Cross-Module Impact |
|-----------|-------|----------|---------------------|
| Employee allocation total validation | Set 60% Project A + 50% Project B | 400 error: "Total allocation exceeds 100%" | None |
| Valid allocation | 60% Project A + 40% Project B | Two EmployeeProjectAllocation records created | None |
| Payroll budget impact preview | GET payroll budget-impact for run with 3 employees, mixed allocations | Returns per-employee, per-project charge breakdown with budget availability | None (read-only) |
| Payroll approval creates allocations | Approve payroll run with allocated employees | PayrollBudgetAllocation records created. JE lines tagged with projectId. | Budget: actuals increase in personnel lines |
| Personnel budget warning | Employee salary charge exceeds personnel budget line | Warning in budget impact preview (yellow). If HARD mode, approval blocked. | Budget: potential block |
| Unallocated employee | Employee has no project allocation | Salary charged to core/unrestricted budget (if exists) or flagged as "unallocated" | Budget: core budget charged |

**10.10.3 Dashboard --> Budget KPI Tests**

| Test Case | Input | Expected | Cross-Module Impact |
|-----------|-------|----------|---------------------|
| Budget utilization KPI | 3 active budgets: 100K each, actuals 30K+50K+80K | Utilization: 53.3% (160K/300K). Over-budget count: 0 (none over 100%) | None (read) |
| Burn rate calculation | 6 months elapsed, 160K actual | Burn rate: 26.7K/month. Runway: (300K-160K)/26.7K = 5.2 months | None (read) |
| Over-budget alert | Budget line at 105% utilization | Appears in budget alerts widget with red indicator | None (read) |
| Dashboard with no budgets | New org, no budgets created | Budget KPI cards show "N/A" or "0", no errors | None |

**10.10.4 Grant Lifecycle --> Budget Freeze Tests**

| Test Case | Input | Expected | Cross-Module Impact |
|-----------|-------|----------|---------------------|
| Grant closeout freezes budgets | Grant lifecycle → CLOSEOUT, 2 linked ACTIVE budgets | Both budgets → FROZEN. Audit log entries. | Budget: status change |
| PR against frozen budget | Create PR with budgetId pointing to FROZEN budget | 400 error: "Budget is frozen" | Procurement: blocked |
| Voucher against frozen budget | Approve voucher tagged to frozen budget's project | 400 error: "Budget is frozen for this project" | Finance: blocked |
| Grant unsuspend unfreezes | Grant status ACTIVE after SUSPENDED | Linked FROZEN budgets → ACTIVE | Budget: status restored |
| Grant close closes budgets | Grant status → CLOSED | All linked budgets → CLOSED (permanent) | Budget: closed |
| Manual unfreeze | Finance Admin unfreezes budget | Budget FROZEN → ACTIVE + audit log with reason | Budget: status change |

**10.10.5 Project <--> Budget Reconciliation Tests**

| Test Case | Input | Expected | Cross-Module Impact |
|-----------|-------|----------|---------------------|
| Budget creation syncs project | Create budget (amount=50000) for project (totalBudget=0) | After budget ACTIVE, Project.totalBudget = 50000 | Project: totalBudget updated |
| Multiple budgets sync | Project has budget A=50K (active) + budget B=30K (active) | Project.totalBudget = 80000 | Project: totalBudget updated |
| Budget exceeds ceiling (ENFORCE) | Project.totalBudget=100K, existing budget=80K, new budget=30K | 400 error: "Budget total 110K exceeds project ceiling 100K" | None (rejected) |
| Revision syncs project | Budget revision changes 50K → 60K, approved | Project.totalBudget increases by 10K | Project: totalBudget updated |
| Batch reconciliation | 3 projects with stale totalBudget | All 3 recalculated. Returns mismatch report. | Project: totalBudget fixed |

**10.10.6 Finance --> Budget Line Tracking Tests**

| Test Case | Input | Expected | Cross-Module Impact |
|-----------|-------|----------|---------------------|
| Voucher approval auto-matches | Voucher JE has line: accountId=4100, projectId=P1. Budget has line: accountId=4100, projectId=P1 | JELine.budgetLineId set. Budget vs Actual shows actual. | Budget: actuals tracked |
| No matching budget line | JE line has accountId=9999, no budget line exists | JELine.budgetLineId=null. Appears in "unmatched" list. | Budget: unmatched flagged |
| Drill-down shows transactions | Click actual amount in Budget vs Actual | Shows list of JE lines with date, voucher no, description, amount | None (read) |
| Rematch after budget creation | Budget created after transactions posted | Run rematch → previously unmatched lines now matched | Budget: actuals populated |

**10.10.7 NGOAB Report Tests**

| Test Case | Input | Expected | Cross-Module Impact |
|-----------|-------|----------|---------------------|
| FD-6 generation | Select grant with 1 active budget, 15 budget lines | FD-6 table generated: 10 NGOAB categories, year-wise breakdown, totals match budget total | None (report) |
| FD-2 generation | Grant with 6 months of expenditure data | FD-2 table: approved budget, previous expenditure, current period, cumulative, balance per NGOAB category | None (report) |
| Category mapping | Budget category "Personnel" → NGOAB "1. Personnel (Bangladeshi)" | Mapping applied during FD-6/FD-2 generation | None (config) |
| Overhead cap check | Admin overhead = 10% of total (NGOAB cap = 7.5%) | Warning: "Administrative overhead exceeds NGOAB cap of 7.5%" | None (report) |
| Cost share verification | Budget requires 20% cost share. Actual cost share = 15%. | Report shows shortfall of 5% with line-by-line detail. | None (report) |

---

#### 10.11 New System Settings

| Setting Key | Type | Default | Description |
|-------------|------|---------|-------------|
| `budget_check_mode` | Enum | `SOFT` | HARD (reject) / SOFT (warn) / OFF for budget enforcement |
| `project_budget_ceiling_mode` | Enum | `WARN` | ENFORCE / WARN / OFF for project-level budget ceiling |
| `payroll_budget_check` | Boolean | `true` | Enable/disable payroll → budget check on approval |
| `auto_freeze_on_grant_closeout` | Boolean | `true` | Auto-freeze budgets when grant enters CLOSEOUT |
| `auto_sync_project_budget` | Boolean | `true` | Auto-sync Project.totalBudget when budget changes |
| `ngoab_registration_no` | String | `null` | Organization's NGOAB registration number (for reports) |
| `ngoab_overhead_cap_percent` | Decimal | `7.50` | NGOAB administrative overhead cap (%) |
| `commitment_auto_cancel_days` | Int | `90` | Auto-cancel uncommitted PR commitments after N days |

---

#### 10.12 Seed Data (Phase 10)

```
- 5 BudgetCommitment records:
  - 2 from approved PRs (status=COMMITTED)
  - 2 from POs created from PRs (status=COMMITTED, parentCommitmentId links to PR commitment which is RELEASED)
  - 1 from contract (status=PARTIALLY_RELEASED, releasedAmount > 0)
- 3 EmployeeProjectAllocation records:
  - Employee 1: 60% Project A + 40% Project B
  - Employee 2: 100% Project A
  - Employee 3: 50% Project C + 50% unallocated (core)
- 2 PayrollBudgetAllocation records (from approved payroll run)
- 1 NgoabReport (FD-6, status=APPROVED)
- 1 NgoabReport (FD-2, status=DRAFT)
- NgoabCategoryMapping: 10 rows mapping standard NGO categories to NGOAB FD-6 categories
- System settings: budget_check_mode=SOFT, project_budget_ceiling_mode=WARN, all auto flags=true
- 1 Grant in CLOSEOUT stage with 1 FROZEN budget (to demonstrate lifecycle integration)
```

---

#### 10.13 Updated Navigation

```
Existing pages with cross-module additions (no new sidebar items for 10.1-10.6):

📊 BUDGET MANAGEMENT
├── Budget List        (/budget)              — FROZEN status icon added
├── Budget vs Actual   (/budget/budget-vs-actual)  — Committed column + drill-down
├── [Budget Detail]    (/budget/[id])         — Commitments tab, freeze banner

👥 HR & PAYROLL
├── [Employee Detail]  (/hr/employees/[id])   — Project Allocations tab
├── Project Allocations (/hr/project-allocations)  ★ NEW PAGE
├── [Payroll Detail]   (/hr/payroll/runs/[id])     — Budget Impact panel

🏢 PROCUREMENT
├── Requisitions       (/procurement/requisitions)  — Budget selector + availability

💰 DONORS & GRANTS
├── [Grant Detail]     (/donors/grants/[id])  — Budget Status section

📋 PROJECTS
├── [Project Detail]   (/projects/[id])       — Budget Breakdown + Personnel Costs tabs

📊 REPORTS
├── NGOAB Reports      (/reports/ngoab)       ★ NEW PAGE
├── NGOAB Generate     (/reports/ngoab/generate)   ★ NEW PAGE
├── NGOAB Detail       (/reports/ngoab/[id])       ★ NEW PAGE

⚙️ SETTINGS
├── NGOAB Mapping      (/settings/ngoab-mapping)   ★ NEW PAGE
```

---

#### 10.14 Cron Job Additions

| Cron Job | Schedule | Description |
|----------|----------|-------------|
| `commitment-auto-cancel` | Daily 07:00 | Cancel BudgetCommitment records where sourceType=PURCHASE_REQUISITION AND status=COMMITTED AND createdAt > commitment_auto_cancel_days ago AND linked PR has no PO |
| `project-budget-reconcile` | Weekly Mon 06:00 | Scan all active projects, detect Project.totalBudget != sum(active Budget.totalAmount), auto-fix and log discrepancies |

---

> **Seed data (Phase 10):** 5 commitments (2 PR, 2 PO, 1 contract), 3 employee project allocations, 2 payroll budget allocations, 2 NGOAB reports (1 FD-6 approved, 1 FD-2 draft), 10 category mappings, 1 frozen budget with closeout grant, system settings configured

---

That is the complete Phase 10 section. Here is a summary of what it covers:

**7 integration areas across 12 sections (10.1-10.14):**

1. **Procurement --> Budget Encumbrance (10.1):** Three-stage commitment lifecycle (PR→PO→Payment), shared `lib/budget-check.ts`, 9 API endpoints (3 new, 6 modified), 5 UI changes.

2. **HR/Payroll --> Budget Personnel Tracking (10.2):** Employee project allocation CRUD, payroll budget impact preview, `PayrollBudgetAllocation` model, 8 API endpoints (6 new, 2 modified), 6 UI changes, 1 new page.

3. **Dashboard --> Budget KPIs (10.3):** 6 new KPI cards, 5 new widgets (gauge, bar, line, alerts, table), 5 API endpoints (1 modified, 4 new), 4 UI changes.

4. **Grant Lifecycle --> Budget Freeze (10.4):** New FROZEN budget status, auto-freeze on grant closeout/suspension, manual freeze/unfreeze, 5 API endpoints (2 modified, 3 new), 5 UI changes.

5. **Project <--> Budget Reconciliation (10.5):** Auto-sync Project.totalBudget, ceiling validation, batch reconciliation, 6 API endpoints (4 modified, 2 new), 3 UI changes.

6. **Finance --> Budget Line-Level Tracking (10.6):** Auto-match JE lines to budget lines via accountId+projectId, unmatched transaction detection, drill-down, 6 API endpoints (2 modified, 4 new), 4 UI changes.

7. **NGOAB Compliance (10.7):** FD-6, FD-2, FD-3 auto-generation, category mapping, `NgoabReport` + `NgoabCategoryMapping` models, 10 API endpoints (all new), 4 new pages.

**Total: ~45 new/modified API endpoints, 5 new pages, ~30 UI modifications, 3 new Prisma models, 2 new cron jobs, ~30 days estimated effort.**

Sources:
- [Oracle Budgetary Control and Encumbrance Accounting](https://docs.oracle.com/en/cloud/saas/project-management/25d/oapjc/how-can-i-perform-budgetary-control-and-encumbrance-accounting.html)
- [Oracle Work with Commitments and Encumbrances](https://docs.oracle.com/cd/E26228_01/doc.93/e21561/ww_commit_encum.htm)
- [Oracle Budgetary Control Data Sheet](https://www.oracle.com/a/ocom/docs/applications/erp/oracle-budgetary-control-and-encumbrance-accounting-ds.pdf)
- [JD Edwards Commitment Processing](https://docs.oracle.com/en/applications/jd-edwards/supply-management/9.2/eoapr/understanding-commitment-processing.html)
- [Sage Intacct Nonprofit Fund Accounting](https://www.sage.com/en-us/industry/nonprofit/)
- [Sage Intacct Grant Tracking](https://www.sage.com/en-us/sage-business-cloud/intacct/product-capabilities/extended-capabilities/grants-tracking-billing/)
- [Nonprofit Payroll Guide - Araize](https://araize.com/nonprofit-payroll-guide/)
- [True Program Costs Allocation Template](https://nonprofitfinancials.org/resources/true-program-costs-program-budget-and-allocation-template-and-resource/)
- [Workday Nonprofit Solutions](https://www.workday.com/en-us/solutions/industries/nonprofit.html)
- [NGOAB FD-6 Form](https://ngoab.portal.gov.bd/sites/default/files/files/ngoab.portal.gov.bd/forms/d9baae9f_273a_44f9_af3c_a55a73041859/FORM%20FD-6.pdf)
- [NGOAB FD-6/FD-7/FC-1 Process Map](https://rohingyaresponse.org/wp-content/uploads/2023/06/Access_Process-Map_NGOAB_FD6_FD7_FC1.pdf)
- [NGOAB Note on FD Forms](https://accountsworks.wordpress.com/2015/04/05/note-on-fd/)
- [Nonprofit Dashboard KPIs - SoPact](https://www.sopact.com/use-case/nonprofit-dashboard)
- [Grant Management Dashboard KPIs](https://www.inetsoft.com/business/bi/kpis-in-grant-management-dashboards/)
- [Nonprofit Financial Metrics](https://www.ensync-corp.com/blog/financial-metrics-for-nonprofits)

### Phase 11: Daily Expense Management (Week 37-42)

> **Priority: Complete operational expense lifecycle — petty cash, expense claims, advances, per diem, TDS/VDS**
> **Benchmarks: SAP Concur, Oracle NetSuite Expense, Sage Intacct Expense, Zoho Expense**
> **Compliance: USAID 2 CFR 200 Subpart E, Bangladesh VAT & Supplementary Duty Act 2012, Income Tax Act 2023, NGOAB FD-4/FD-6**
> **Module Placement: Finance (`/finance/expenses/`) — Expense Reports inside Financial Reports**

---

#### 11.1 Chart of Accounts Impact

**New GL accounts to add (via seed-accounts.ts update):**

| Code | Name | Type | Nature | Purpose |
|------|------|------|--------|---------|
| `1131` | Advance Receivable - Travel | ASSET | DEBIT | Travel advances issued to staff |
| `1132` | Advance Receivable - Activity | ASSET | DEBIT | Activity/program advances |
| `2107` | Expense Claims Payable | LIABILITY | CREDIT | Approved claims pending payment |
| `2108` | VDS Payable | LIABILITY | CREDIT | VAT Deducted at Source — govt deposit |
| `2109` | TDS Payable | LIABILITY | CREDIT | Tax Deducted at Source — govt deposit |

**Existing accounts used:**
- `1101` Cash in Hand — direct expense payments
- `1102` Petty Cash — petty cash fund operations (multiple sub-funds via PettyCashFund model)
- `1111-1114` Bank accounts — reimbursements, advance disbursements
- `1130` Advances to Staff — general staff advances (existing, kept for non-travel/activity)
- `5201-5205` Travel expenses — per diem, transport, fuel
- `5301-5304` Training expenses — workshop, venue, materials
- `5401-5404` Equipment & supplies — office supplies, program supplies
- `5501-5508` Admin expenses — rent, utilities, communications, bank charges
- `5601-5604` Program activities — community mobilization, service delivery

---

#### 11.2 Journal Entry Auto-Generation

**Every expense event creates a JournalEntry with `sourceModule: 'expense'`:**

| Event | DR Account(s) | CR Account(s) | Trigger |
|-------|--------------|---------------|---------|
| Advance Issued (travel) | 1131 Advance Receivable - Travel | 1111 Bank / 1101 Cash | `POST /advances/:id/disburse` |
| Advance Issued (activity) | 1132 Advance Receivable - Activity | 1111 Bank / 1101 Cash | `POST /advances/:id/disburse` |
| Advance Settled (actual < advance) | 5xxx Expense accounts + 1101 Cash (refund) | 1131/1132 Advance Receivable | `POST /advances/:id/settle` |
| Advance Settled (actual > advance) | 5xxx Expense accounts | 1131/1132 Advance Receivable + 1111 Bank (extra paid) | `POST /advances/:id/settle` |
| Expense Claim Approved | 5xxx Expense accounts (per item) | 2107 Claims Payable | `POST /expense-claims/:id/approve` (finance level) |
| Expense Claim Paid | 2107 Claims Payable | 1111 Bank / 1101 Cash | `POST /expense-claims/:id/pay` |
| Petty Cash Expense | 5xxx Expense accounts | 1102 Petty Cash (via PettyCashFund.bankAccountId) | `POST /petty-cash/:id/transactions` |
| Petty Cash Replenishment | 1102 Petty Cash | 1111 Bank | `POST /petty-cash/:id/replenish` |
| TDS Deduction on Payment | 5xxx Expense (gross amount) | 2109 TDS Payable + 1111 Bank (net) | When TDS applicable on vendor payment |
| VDS Deduction on Payment | 5xxx Expense (gross amount) | 2108 VDS Payable + 1111 Bank (net) | When VDS applicable on purchase |
| TDS/VDS Govt Deposit | 2109/2108 TDS/VDS Payable | 1111 Bank | `POST /tax-deposits` |

**Multi-line JE support:** Expense claims with multiple items across different expense accounts create multi-line JEs (not single-line like current vouchers). Each JE line carries `projectId` and `costCenterId` for dimensional reporting.

**JE ↔ Expense linking:** `JournalEntry.sourceModule = 'expense'`, `JournalEntry.sourceId = expenseClaimId | advanceId | pettyCashTransactionId`

---

#### 11.3 Voucher Integration

**How expenses connect to vouchers:**

| Expense Event | Voucher Type | Auto-Created? | Details |
|--------------|-------------|---------------|---------|
| Petty cash expense | CASH | Yes | `sourceModule: 'petty_cash'` |
| Expense claim payment (bank) | BANK | Yes | `sourceModule: 'expense_claim'` |
| Expense claim payment (cash) | CASH | Yes | `sourceModule: 'expense_claim'` |
| Advance disbursement (bank) | BANK | Yes | `sourceModule: 'advance'` |
| Advance disbursement (cash) | CASH | Yes | `sourceModule: 'advance'` |
| Petty cash replenishment | CONTRA | Yes | DR Petty Cash, CR Bank |

**Voucher model additions:**
```prisma
// Add to Voucher model
expenseClaimId  String?  @db.Uuid  // FK to ExpenseClaim
advanceId       String?  @db.Uuid  // FK to EmployeeAdvance
pettyCashTxId   String?  @db.Uuid  // FK to PettyCashTransaction
```

**Segregation of duty maintained:** Expense claim submitter ≠ finance approver ≠ payment processor.

---

#### 11.4 Bank Reconciliation Impact

**Expense transactions in bank reconciliation:**

| Transaction | Bank Statement | Book Entry | Matching Strategy |
|------------|---------------|------------|-------------------|
| EFT reimbursement to staff | Individual debit | DR Claims Payable, CR Bank | Auto-match: amount + date + reference (claim no) |
| Batch reimbursement | Single debit | Multiple JE lines summing to batch | Manual match: 1 bank → N book entries |
| Petty cash replenishment check | Debit when cashed | DR Petty Cash, CR Bank | Match by cheque number |
| Advance disbursement (EFT) | Debit | DR Advance Receivable, CR Bank | Auto-match: amount + date |
| Staff refund deposit | Credit | DR Bank, CR Advance Receivable | Auto-match as deposit |
| TDS/VDS govt deposit | Debit (treasury challan) | DR TDS/VDS Payable, CR Bank | Match by challan reference |
| bKash/Nagad payment | Mobile banking statement | DR Expense, CR Mobile Banking | Separate reconciliation cycle |

**Auto-match enhancement:** Bank reconciliation auto-match algorithm will use `reference` field matching (expense claim number, advance number, challan number) in addition to existing amount + date matching.

---

#### 11.5 Bank & Cash Page Impact

**Changes to `/finance/bank-cash` page:**

1. **Petty Cash Funds display:** Each `PettyCashFund` creates a `BankAccount` record (type=CASH) with `glAccountId → 1102`. Multiple petty cash funds show as separate cash accounts.
2. **Imprest indicator:** Each petty cash fund shows: imprest amount, current balance, replenishment needed (if balance < 25% of imprest).
3. **Summary cards update:** "Total Cash" card includes all petty cash fund balances. New card: "Petty Cash Funds" count.
4. **Quick actions:** "Record Expense" and "Request Replenishment" buttons on each petty cash fund card.
5. **Balance tracking:** `BankAccount.currentBalance` auto-updated on every petty cash transaction.

---

#### 11.6 Financial Reports — New Expense Reports (Inside Existing Section)

**Reports added to `/finance/financial-reports` page as 4th section "Expense & Compliance":**

| Report | Category | API Type | Data Source | Description |
|--------|----------|----------|-------------|-------------|
| Expense Summary | Expense & Compliance | `expense-summary` | JE lines where sourceModule='expense' | Daily/monthly expense breakdown by category, project, department |
| Advance Aging | Expense & Compliance | `advance-aging` | EmployeeAdvance where status ∉ [SETTLED, CANCELLED] | Outstanding advances grouped by 0-30, 31-60, 61-90, 90+ days |
| Petty Cash Statement | Expense & Compliance | `petty-cash-statement` | PettyCashTransaction per fund | Per-fund opening balance, transactions, closing balance |
| Per Diem Utilization | Expense & Compliance | `per-diem-utilization` | ExpenseClaimItem where category='PER_DIEM' | Staff-wise per diem claims vs budget, location analysis |
| Receipt Compliance | Expense & Compliance | `receipt-compliance` | ExpenseClaimItem.hasReceipt statistics | % expenses with receipts, missing receipt list, category breakdown |
| TDS/VDS Register | Expense & Compliance | `tax-register` | JE lines where accountId ∈ [2108, 2109] | Monthly deduction register, Mushak 6.3 compatible format |
| Donor Expense Report | Expense & Compliance | `donor-expense` | JE lines filtered by grantId + expense accounts | Grant-wise expense breakdown (USAID SF-425 format compatible) |

**API pattern:** All use existing `GET /api/v1/finance/reports/[type]` route — new type values added to the switch/case. Same fiscalYearId, dateRange, projectId filters.

**Financial Reports page UI update:**
```
Core Statements (5 cards, blue)
Subsidiary Books (4 cards, emerald)
NGO Reports (4 cards, purple)
Expense & Compliance (7 cards, amber) ★ NEW
```

---

#### 11.7 Budget Module Connection

**Budget check on expense submission:**
- `POST /expense-claims` → check budget availability for each line item's budget category
- `budget_check_mode` system setting applies (HARD block / SOFT warning / OFF)
- Budget check uses: `Available = Budget Total - Committed - Actual`

**Commitment lifecycle:**
- Expense claim APPROVED → creates `BudgetCommitment` (status: COMMITTED, sourceType: EXPENSE_CLAIM)
- Expense claim PAID → releases commitment (COMMITTED → RELEASED), records actual
- Expense claim CANCELLED → cancels commitment (COMMITTED → CANCELLED)

**Budget vs Actual page enhancement:**
- "Committed" column includes expense claim commitments
- Drill-down on actual amount shows individual expense transactions

**New enum value:** Add `EXPENSE_CLAIM` to `CommitmentSource` enum (alongside PURCHASE_REQUISITION, PURCHASE_ORDER, CONTRACT)

---

#### 11.8 HR Module Connection

**Employee model additions:**
```prisma
// Add relations to Employee model
expenseClaims    ExpenseClaim[]
advances         EmployeeAdvance[]
```

**Payroll integration:**
- Outstanding advances > 90 days → option to auto-deduct from salary (`PayrollEntry.advanceDeduction` field)
- Expense reimbursement → option to add to next payroll (`PayrollEntry.expenseReimbursement` field)

**Employee profile page:** New tab "Expenses & Advances" showing:
- Active advances with balances
- Recent expense claims
- Total claimed this fiscal year

---

#### 11.9 New Prisma Models

```prisma
// ─── finance.prisma additions ───

model PettyCashFund {
  id              String           @id @default(uuid()) @db.Uuid
  organizationId  String           @db.Uuid
  name            String
  code            String
  imprestAmount   Decimal          @db.Decimal(18, 2)
  currentBalance  Decimal          @default(0) @db.Decimal(18, 2)
  currencyCode    CurrencyCode     @default(BDT)
  custodianId     String           @db.Uuid
  bankAccountId   String?          @db.Uuid
  projectId       String?          @db.Uuid
  location        String?
  isActive        Boolean          @default(true)
  lastReconciledAt DateTime?
  notes           String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  organization    Organization     @relation(fields: [organizationId], references: [id])
  bankAccount     BankAccount?     @relation(fields: [bankAccountId], references: [id])
  transactions    PettyCashTransaction[]

  @@unique([organizationId, code])
  @@index([organizationId])
  @@index([custodianId])
}

model PettyCashTransaction {
  id              String           @id @default(uuid()) @db.Uuid
  fundId          String           @db.Uuid
  transactionNo   String           @unique
  date            DateTime
  action          PettyCashAction
  amount          Decimal          @db.Decimal(18, 2)
  balanceAfter    Decimal          @db.Decimal(18, 2)
  description     String
  category        String?
  receiptPath     String?
  projectId       String?          @db.Uuid
  budgetLineId    String?          @db.Uuid
  accountId       String?          @db.Uuid
  voucherId       String?          @db.Uuid
  journalEntryId  String?          @db.Uuid
  recordedById    String           @db.Uuid
  approvedById    String?          @db.Uuid
  notes           String?
  createdAt       DateTime         @default(now())

  fund            PettyCashFund    @relation(fields: [fundId], references: [id])

  @@index([fundId])
  @@index([date])
  @@index([projectId])
}

model ExpenseClaim {
  id              String             @id @default(uuid()) @db.Uuid
  organizationId  String             @db.Uuid
  claimNo         String             @unique
  employeeId      String             @db.Uuid
  claimDate       DateTime           @default(now())
  totalAmount     Decimal            @db.Decimal(18, 2)
  approvedAmount  Decimal?           @db.Decimal(18, 2)
  currencyCode    CurrencyCode       @default(BDT)
  purpose         String
  projectId       String?            @db.Uuid
  grantId         String?            @db.Uuid
  travelStartDate DateTime?
  travelEndDate   DateTime?
  status          ExpenseClaimStatus @default(DRAFT)
  supervisorId    String?            @db.Uuid
  supervisorApprovedAt DateTime?
  financeApprovedById  String?       @db.Uuid
  financeApprovedAt    DateTime?
  rejectionReason      String?
  paymentMethod   String?
  paidAt          DateTime?
  voucherId       String?            @db.Uuid
  journalEntryId  String?            @db.Uuid
  advanceId       String?            @db.Uuid
  advanceDeducted Decimal?           @db.Decimal(18, 2)
  netPayable      Decimal?           @db.Decimal(18, 2)
  notes           String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  organization    Organization       @relation(fields: [organizationId], references: [id])
  employee        Employee           @relation(fields: [employeeId], references: [id])
  items           ExpenseClaimItem[]

  @@index([organizationId])
  @@index([employeeId])
  @@index([status])
  @@index([projectId])
}

model ExpenseClaimItem {
  id              String       @id @default(uuid()) @db.Uuid
  claimId         String       @db.Uuid
  date            DateTime
  category        String
  description     String
  amount          Decimal      @db.Decimal(18, 2)
  approvedAmount  Decimal?     @db.Decimal(18, 2)
  receiptPath     String?
  hasReceipt      Boolean      @default(false)
  noReceiptReason String?
  accountId       String?      @db.Uuid
  projectId       String?      @db.Uuid
  budgetLineId    String?      @db.Uuid
  tdsRate         Decimal?     @db.Decimal(5, 2)
  tdsAmount       Decimal?     @db.Decimal(18, 2)
  vdsRate         Decimal?     @db.Decimal(5, 2)
  vdsAmount       Decimal?     @db.Decimal(18, 2)
  location        String?
  notes           String?
  sortOrder       Int          @default(0)

  claim           ExpenseClaim @relation(fields: [claimId], references: [id], onDelete: Cascade)

  @@index([claimId])
}

model EmployeeAdvance {
  id              String         @id @default(uuid()) @db.Uuid
  organizationId  String         @db.Uuid
  advanceNo       String         @unique
  employeeId      String         @db.Uuid
  requestDate     DateTime       @default(now())
  purpose         String
  advanceType     AdvanceType    @default(TRAVEL)
  estimatedAmount Decimal        @db.Decimal(18, 2)
  approvedAmount  Decimal?       @db.Decimal(18, 2)
  projectId       String?        @db.Uuid
  grantId         String?        @db.Uuid
  travelStartDate DateTime?
  travelEndDate   DateTime?
  expectedSettlementDate DateTime?
  disbursedAmount Decimal?       @db.Decimal(18, 2)
  disbursedAt     DateTime?
  disbursementMethod String?
  bankAccountId   String?        @db.Uuid
  disbursementVoucherId String?  @db.Uuid
  disbursementJournalId String?  @db.Uuid
  settledAmount   Decimal?       @db.Decimal(18, 2)
  refundAmount    Decimal?       @db.Decimal(18, 2)
  additionalPaid  Decimal?       @db.Decimal(18, 2)
  settledAt       DateTime?
  status          AdvanceStatus  @default(REQUESTED)
  approvedById    String?        @db.Uuid
  approvedAt      DateTime?
  rejectionReason String?
  notes           String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  organization    Organization   @relation(fields: [organizationId], references: [id])
  employee        Employee       @relation(fields: [employeeId], references: [id])

  @@index([organizationId])
  @@index([employeeId])
  @@index([status])
}

model PerDiemRate {
  id              String         @id @default(uuid()) @db.Uuid
  organizationId  String         @db.Uuid
  name            String
  location        String
  locationType    String         @default("DISTRICT")
  donorId         String?        @db.Uuid
  fullDayRate     Decimal        @db.Decimal(18, 2)
  halfDayRate     Decimal?       @db.Decimal(18, 2)
  overnightRate   Decimal?       @db.Decimal(18, 2)
  mealsOnlyRate   Decimal?       @db.Decimal(18, 2)
  currencyCode    CurrencyCode   @default(BDT)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
  isActive        Boolean        @default(true)
  notes           String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  organization    Organization   @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([location])
  @@index([donorId])
}

model ExpenseCategory {
  id              String       @id @default(uuid()) @db.Uuid
  organizationId  String       @db.Uuid
  name            String
  code            String
  glAccountId     String?      @db.Uuid
  budgetCategory  String?
  maxAmountPerItem Decimal?    @db.Decimal(18, 2)
  requiresReceipt Boolean      @default(true)
  tdsApplicable   Boolean      @default(false)
  defaultTdsRate  Decimal?     @db.Decimal(5, 2)
  vdsApplicable   Boolean      @default(false)
  defaultVdsRate  Decimal?     @db.Decimal(5, 2)
  isActive        Boolean      @default(true)
  sortOrder       Int          @default(0)
  createdAt       DateTime     @default(now())

  organization    Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, code])
  @@index([organizationId])
}
```

**New enums (in base.prisma):**
```prisma
enum ExpenseClaimStatus {
  DRAFT
  SUBMITTED
  SUPERVISOR_APPROVED
  FINANCE_APPROVED
  REJECTED
  PAID
  CANCELLED
}

enum AdvanceStatus {
  REQUESTED
  APPROVED
  DISBURSED
  PARTIALLY_SETTLED
  SETTLED
  OVERDUE
  CANCELLED
}

enum AdvanceType {
  TRAVEL
  ACTIVITY
  OPERATIONAL
}

enum PettyCashAction {
  OPENING_BALANCE
  EXPENSE
  REPLENISHMENT
  ADJUSTMENT
  CLOSING
}
```

---

#### 11.10 API Endpoints

**Petty Cash (8 endpoints):**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/finance/petty-cash` | List all petty cash funds |
| POST | `/api/v1/finance/petty-cash` | Create fund (auto-creates BankAccount type=CASH) |
| GET | `/api/v1/finance/petty-cash/:id` | Fund detail with recent transactions |
| PUT | `/api/v1/finance/petty-cash/:id` | Update fund (name, imprest, custodian) |
| GET | `/api/v1/finance/petty-cash/:id/transactions` | Transaction history (paginated) |
| POST | `/api/v1/finance/petty-cash/:id/transactions` | Record expense (auto-creates CASH voucher + JE) |
| POST | `/api/v1/finance/petty-cash/:id/replenish` | Request replenishment (auto-creates CONTRA voucher) |
| POST | `/api/v1/finance/petty-cash/:id/reconcile` | Physical count reconciliation |

**Expense Claims (12 endpoints):**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/finance/expense-claims` | List all claims (filterable by status, employee, project, date) |
| POST | `/api/v1/finance/expense-claims` | Create claim with items (budget check on submit) |
| GET | `/api/v1/finance/expense-claims/:id` | Claim detail with items, approval history |
| PUT | `/api/v1/finance/expense-claims/:id` | Update draft claim |
| DELETE | `/api/v1/finance/expense-claims/:id` | Delete draft claim |
| POST | `/api/v1/finance/expense-claims/:id/submit` | Submit for approval (status: DRAFT → SUBMITTED) |
| POST | `/api/v1/finance/expense-claims/:id/supervisor-approve` | Supervisor approval (SUBMITTED → SUPERVISOR_APPROVED) |
| POST | `/api/v1/finance/expense-claims/:id/finance-approve` | Finance approval (→ FINANCE_APPROVED, auto JE: DR Expense, CR Claims Payable) |
| POST | `/api/v1/finance/expense-claims/:id/reject` | Reject with reason |
| POST | `/api/v1/finance/expense-claims/:id/pay` | Process payment (auto voucher, JE: DR Claims Payable, CR Bank) |
| GET | `/api/v1/finance/expense-claims/my-claims` | Current user's claims |
| POST | `/api/v1/finance/expense-claims/:id/items/:itemId/receipt` | Upload receipt image |

**Advances (10 endpoints):**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/finance/advances` | List all advances |
| POST | `/api/v1/finance/advances` | Request advance (checks: no outstanding advance for this employee) |
| GET | `/api/v1/finance/advances/:id` | Advance detail |
| PUT | `/api/v1/finance/advances/:id` | Update pending advance |
| POST | `/api/v1/finance/advances/:id/approve` | Approve advance request |
| POST | `/api/v1/finance/advances/:id/disburse` | Disburse (auto BANK voucher + JE: DR Advance Receivable, CR Bank) |
| POST | `/api/v1/finance/advances/:id/settle` | Settle with expense claim linkage |
| GET | `/api/v1/finance/advances/outstanding` | Outstanding/overdue advances with aging |
| GET | `/api/v1/finance/advances/employee/:employeeId` | Employee advance history |
| POST | `/api/v1/finance/advances/:id/cancel` | Cancel pending advance |

**Per Diem & Categories (7 endpoints):**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/finance/per-diem-rates` | List all rates |
| POST | `/api/v1/finance/per-diem-rates` | Create rate |
| PUT | `/api/v1/finance/per-diem-rates/:id` | Update rate |
| DELETE | `/api/v1/finance/per-diem-rates/:id` | Delete rate |
| POST | `/api/v1/finance/per-diem-rates/calculate` | Calculate per diem for a trip (startDate, endDate, location) |
| GET | `/api/v1/finance/expense-categories` | List expense categories with GL mapping |
| POST | `/api/v1/finance/expense-categories` | Create/update category |

**Reports (7 new report types added to existing `/api/v1/finance/reports/[type]`):**

| Type | Description |
|------|-------------|
| `expense-summary` | Category/project/department expense breakdown |
| `advance-aging` | Outstanding advances 0-30/31-60/61-90/90+ days |
| `petty-cash-statement` | Per-fund opening, transactions, closing balance |
| `per-diem-utilization` | Staff-wise per diem claims vs budget |
| `receipt-compliance` | % expenses with receipts, missing receipt audit list |
| `tax-register` | Monthly TDS/VDS register (Mushak 6.3 compatible) |
| `donor-expense` | Grant-wise expense (USAID SF-425 format) |

**Total: 37 new API endpoints + 7 new report types**

---

#### 11.11 UI Pages

**Under `/finance/expenses/` (6 pages):**

| Page | Path | Features |
|------|------|----------|
| **Expense Dashboard** | `/finance/expenses` | KPI cards (today's expenses, pending claims, outstanding advances, petty cash balances), recent claims, budget utilization donut chart |
| **Petty Cash** | `/finance/expenses/petty-cash` | Fund cards with imprest vs balance, create fund, record transaction dialog, replenishment request, reconciliation (physical count vs book) |
| **Expense Claims** | `/finance/expenses/claims` | DataTable (all/my-claims/pending-approval tabs), create claim form with line items + receipt upload, multi-level approval buttons, payment processing |
| **Advances** | `/finance/expenses/advances` | DataTable with status filters, new advance form, approve/disburse/settle workflow, outstanding aging report inline |
| **Per Diem Rates** | `/finance/expenses/per-diem` | Rate table by location/donor, create/edit rates, per diem calculator (trip dates + location → auto-calculate) |
| **Expense Categories** | `/finance/expenses/categories` | Category list with GL account mapping, TDS/VDS settings, receipt requirement toggle |

**Financial Reports page update (`/finance/financial-reports`):**
- Add 4th section "Expense & Compliance" with 7 report cards (amber-colored)
- Each card links to existing `/finance/financial-reports/[type]` detail page
- Report viewer component reused — same filter bar, table, export, print

**Other page modifications:**

| Page | Change |
|------|--------|
| `/finance/bank-cash` | Show petty cash funds as CASH-type accounts with imprest indicator |
| `/finance/vouchers/[id]` | Show linked expense claim/advance if `expenseClaimId`/`advanceId` exists |
| `/hr/employees/[id]` | New "Expenses & Advances" tab (active advances, recent claims, fiscal year totals) |
| `/budget/budget-vs-actual` | Committed column includes expense claim commitments |

---

#### 11.12 Updated Navigation

```
📊 Finance
├── Chart of Accounts
├── Journal Entries
├── Vouchers
├── Bank Reconciliation
├── Bank & Cash
├── Financial Reports          (includes new Expense & Compliance section)
├── Daily Expenses ★ NEW
│   ├── Expense Dashboard
│   ├── Petty Cash
│   ├── Expense Claims
│   ├── Advances
│   ├── Per Diem Rates
│   └── Expense Categories
```

---

#### 11.13 Implementation Order & Dependencies

| Step | Task | Dependencies | Cross-Module Impact |
|------|------|-------------|---------------------|
| 11.0 | New GL accounts (seed-accounts.ts update) | None | Chart of Accounts |
| 11.1 | New enums + Prisma models + db:push | None | Schema |
| 11.2 | Expense categories API + UI | 11.1 | None |
| 11.3 | Per diem rates API + UI | 11.1 | None |
| 11.4 | Petty cash fund CRUD + transaction recording | 11.1 | Bank & Cash (auto-create BankAccount), Voucher (auto CASH voucher), JE (auto-generate) |
| 11.5 | Expense claims CRUD + multi-level approval | 11.1, 11.2 | JE (auto on approve), Budget (commitment), Voucher (auto on pay) |
| 11.6 | Advance management + settlement | 11.1 | JE (auto on disburse/settle), Voucher (auto), Budget |
| 11.7 | TDS/VDS calculation on expense items | 11.5 | JE (tax liability lines), Financial Reports (tax register) |
| 11.8 | Financial Reports — 7 new report types | 11.4, 11.5, 11.6 | Financial Reports page UI update |
| 11.9 | Budget integration (commitment, check) | 11.5, Phase 9.2 | Budget vs Actual, BudgetCommitment |
| 11.10 | Bank reconciliation enhancement | 11.4, 11.5, 11.6 | Reference-based matching |
| 11.11 | HR integration (employee profile, payroll deduction) | 11.6 | Employee page, PayrollEntry |
| 11.12 | Navigation update + i18n | All above | Sidebar, messages |

---

#### 11.14 Seed Data

> **Seed data (Phase 11):**
> - 5 new GL accounts (1131, 1132, 2107, 2108, 2109)
> - 10 expense categories (Transport, Meals, Accommodation, Office Supplies, Communication, Fuel, Stationery, Courier, Refreshments, Miscellaneous)
> - 8 per diem rates (Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, District HQ, Upazila, Rural — for national staff)
> - 3 petty cash funds (HQ Dhaka, Sylhet Field Office, Cox's Bazar Field Office)
> - 5 sample expense claims (2 approved+paid, 1 pending approval, 1 draft, 1 rejected)
> - 3 sample advances (1 settled, 1 disbursed, 1 overdue)
> - 15 petty cash transactions across 3 funds

---

#### 11.15 Testing Scenarios

| Test | Expected Result | Cross-Module Check |
|------|-----------------|-------------------|
| Create petty cash fund | BankAccount (type=CASH) auto-created, linked via bankAccountId | Bank & Cash page shows new fund |
| Record petty cash expense BDT 500 | CASH voucher auto-created, JE auto-created (DR 5403, CR 1102), fund balance decreased | Cash Book report shows transaction, Budget actual updated |
| Replenish petty cash | CONTRA voucher (DR 1102, CR 1111), fund balance restored to imprest | Bank reconciliation shows check/EFT |
| Submit expense claim BDT 15,000 | Budget availability checked, claim status → SUBMITTED | Budget commitment NOT created yet (only on finance approve) |
| Finance approve expense claim | JE created (DR 5xxx, CR 2107), BudgetCommitment created | Income Statement shows expense, Balance Sheet shows liability |
| Pay expense claim via bank | BANK voucher created, JE (DR 2107, CR 1111), commitment released | Bank balance decreased, bank reconciliation matchable |
| Issue travel advance BDT 20,000 | BANK voucher, JE (DR 1131, CR 1111) | Balance Sheet shows receivable |
| Settle advance (actual BDT 18,000) | JE (DR 5xxx 18K, DR 1101 2K refund, CR 1131 20K) | Advance receivable cleared, expense recorded |
| Advance overdue > 90 days | Payroll deduction option enabled | PayrollEntry.advanceDeduction available |
| TDS 10% on consultancy BDT 50,000 | JE: DR 5103 50K, CR 2109 5K, CR 1111 45K | Tax register report shows TDS, TDS Payable in Balance Sheet |
| Generate Expense Summary report | Groups by category, matches JE totals | Cross-verify with Income Statement expense totals |
| Petty cash physical count reconciliation | Difference logged, adjustment JE if needed | Cash Book matches reconciled balance |

---

#### 11.16 Cron Jobs

| Cron Job | Schedule | Description |
|----------|----------|-------------|
| `advance-overdue-check` | Daily 08:00 | Mark advances as OVERDUE if disbursed and expectedSettlementDate passed. Send notification to employee + supervisor |
| `petty-cash-low-balance` | Daily 09:00 | Alert custodian if fund balance < 25% of imprest amount |
| `expense-claim-reminder` | Daily 10:00 | Remind approvers of pending claims older than 3 days |
| `tds-vds-deposit-reminder` | Monthly 1st, 08:00 | Remind finance of TDS/VDS deposit deadline (15th of month) |

---

> **Summary — Phase 11 Totals:**
> - **7 new models** (PettyCashFund, PettyCashTransaction, ExpenseClaim, ExpenseClaimItem, EmployeeAdvance, PerDiemRate, ExpenseCategory)
> - **4 new enums** (ExpenseClaimStatus, AdvanceStatus, AdvanceType, PettyCashAction)
> - **37 new API endpoints + 7 new report types**
> - **6 new pages + 4 page modifications + 7 report cards**
> - **5 new GL accounts**
> - **4 cron jobs**
> - **Cross-module: Finance (JE, Voucher, Bank Recon, Bank & Cash, Reports), Budget (commitment, check), HR (employee profile, payroll), Projects (allocation)**

#### 11.17 Critical Fixes (Post-Implementation Audit)

**Fix 11-A: Petty Cash transactions not showing in expanded fund card**
- **Root cause**: List API (`GET /petty-cash`) doesn't include transactions; fund detail API does but UI only calls list
- **Fix**: When fund card expands, fetch `GET /petty-cash/{id}` to get transactions
- **Impact**: Petty Cash page UI only

**Fix 11-B: Expense Claim seed data — JE not created for PAID/APPROVED claims**
- **Root cause**: Seed script set status directly without going through approval flow, so no JE auto-generated
- **Fix**: Re-seed with proper JE creation for FINANCE_APPROVED and PAID claims, linked to vouchers
- **Impact**: Seed data only, API logic is correct

**Fix 11-C: Per Diem calculator response field mismatch**
- **Root cause**: API returns different field names than what UI expects (e.g., `days` vs `totalDays`)
- **Fix**: Align API response field names with UI expectations
- **Impact**: Per Diem calculator API + UI

**Fix 11-D: 7 new report types not implemented in Financial Reports API**
- **Root cause**: Report types added to UI (cards visible) but not in `reports/[type]/route.ts` switch/case
- **Fix**: Implement all 7 report generators following existing pattern:
  - `expense-summary` — Expense claims grouped by category/project (from ExpenseClaim + ExpenseClaimItem)
  - `advance-aging` — Outstanding advances bucketed 0-30/31-60/61-90/90+ days (from EmployeeAdvance)
  - `petty-cash-statement` — Per-fund opening→transactions→closing (from PettyCashTransaction)
  - `per-diem-utilization` — Per diem claims vs approved rates (from ExpenseClaimItem where category matches)
  - `receipt-compliance` — Receipt attachment rate audit (from ExpenseClaimItem.hasReceipt)
  - `tds-vds-register` — Tax deduction register NBR format (from ExpenseClaimItem.tdsAmount/vdsAmount)
  - `donor-expense` — Grant-wise budget vs actual (from JE lines + Grant + Budget)
- **Data sources**: Domain models (ExpenseClaim, EmployeeAdvance, PettyCashTransaction) NOT just JournalEntryLine
- **UI columns**: Add to `getColumns()` switch/case in report viewer page
- **Impact**: Financial Reports API (`reports/[type]/route.ts`), Report viewer page, i18n

**Fix 11-E: Petty Cash fund GL account linking in seed data**
- **Root cause**: Seed created BankAccount (type=CASH) without `glAccountId` → JE creation silently skipped
- **Fix**: Seed links all CASH BankAccounts to GL 1102
- **Impact**: Seed data, already fixed in DB

**Fix 11-F: SearchableSelect dropdown scroll/overlap issues**
- **Root cause**: Radix Popover inside Dialog conflicts with focus trap and z-index
- **Fix**: Replaced Popover with plain CSS absolute dropdown, z-200, overscroll-contain
- **Impact**: Global SearchableSelect component (all pages benefit)

---

### Phase 12: HR Employee Profile — International-Grade Upgrade ⬜ TODO

> **Priority: Transform basic employee detail page into a world-class NGO HRIS employee profile**
> **Benchmarks: Odoo 19 HR, BambooHR, SAP SuccessFactors People Profile, OrangeHRM PIM, Unit4 ERP**
> **Compliance: Bangladesh Labour Act 2006, NGOAB FD-4/FD-6, USAID PSEA/MDS, Income Tax Ordinance 1984**
> **Dependencies:** Phase 8 (✅), Phase 8b (✅), Phase 5 HR basics (✅)
> **Scope:** Employee data model expansion, employee detail page rebuild (tabbed UI), edit form completion, seed data fix, cross-module data surfacing

---

#### 12.0 Bug Fixes — Critical Issues in Current Employee Module

##### Fix 12-A: Gender Display Bug (Translation Key Mismatch)

**Root Cause:** Seed data stores gender as `'Male'` (Title Case) but i18n translation keys are `MALE`, `FEMALE`, `OTHER` (UPPERCASE). `t('form.genders.Male')` returns raw key path `hr.form.genders.Male` because key doesn't exist.

**Impact:** Employee detail page shows raw translation key instead of translated value for gender and potentially marital status.

**Fix:**
1. Update all seed files (`seed-phase5.ts`, `seed-phase8-hr.ts`) to use UPPERCASE: `gender: 'MALE'` instead of `gender: 'Male'`
2. Verify `employees/new/page.tsx` already uses `['MALE', 'FEMALE', 'OTHER']` (✅ confirmed)
3. Add data migration script to fix existing DB records: `UPDATE "Employee" SET gender = UPPER(gender) WHERE gender IS NOT NULL`
4. Same check for `maritalStatus` — ensure seed uses `SINGLE`, `MARRIED`, etc. (UPPERCASE)
5. Same check for `Beneficiary.gender` in `seed-phase4.ts` — ensure consistency

**Files affected:**
- `prisma/seed-phase5.ts` — Employee gender values
- `prisma/seed-phase8-hr.ts` — Employee gender values
- `prisma/seed-phase4.ts` — Beneficiary gender values (if applicable)
- New: `prisma/migration-fix-gender-case.ts` — One-time data fix script

##### Fix 12-B: Employee Edit Form — Missing Fields

**Root Cause:** Edit mode in `employees/[id]/page.tsx` only exposes 10 fields (fullName, email, phone, emergencyContact, department, designation, employmentType, status, basicSalary, presentAddress, notes). Many fields visible in view mode are not editable, and several schema fields are completely hidden.

**Fix:** Rebuild edit form to include ALL employee fields grouped by section:

| Section | Fields to Add to Edit Form | Currently in Edit? |
|---------|---------------------------|-------------------|
| **Personal** | localizedName, dateOfBirth, gender, maritalStatus, nidNumber, fatherName, motherName, passport, photo (upload) | ❌ All missing |
| **Employment** | joiningDate, confirmationDate, endDate, reportingTo (SearchableSelect) | ❌ All missing |
| **Contact** | permanentAddress, bankName, bankAccountNo, tinNumber | ❌ All missing |
| **New fields** | (See 12.1 schema expansion below) | N/A — new |

**Files affected:**
- `src/app/(dashboard)/hr/employees/[id]/page.tsx` — Edit form section rebuild

##### Fix 12-C: Employee Detail View — Hidden Schema Fields

**Root Cause:** Several fields that exist in Prisma schema are not shown in view mode.

**Missing from view:**
- `fatherName`, `motherName` — exist in schema, not rendered
- `passport` — exists in schema, not rendered
- `tinNumber` — exists in schema, not rendered
- `confirmationDate`, `endDate` — exist in schema, not rendered
- `photo` — exists in schema, not rendered as avatar
- `convertedFromApplicationId` — exists, could show recruitment origin link

**Fix:** Add all missing fields to their respective view cards. Show `photo` as profile avatar in page header.

**Files affected:**
- `src/app/(dashboard)/hr/employees/[id]/page.tsx` — View mode sections

---

#### 12.1 Schema Expansion — New Employee Fields & Related Models

> **Context:** International-grade HRIS (Odoo, BambooHR, SAP SF) require structured data for emergency contacts, education, work history, dependents, skills, and compliance tracking. Current `Employee` model has basic fields only.

##### 12.1a New Fields on Existing `Employee` Model

Add to `prisma/schema/hr.prisma` → `Employee` model:

```prisma
// ── Personal (new fields) ──
spouseName        String?
numberOfDependents Int?
nationality       String?        @default("Bangladeshi")
religion          String?
bloodGroup        String?        // A+, A-, B+, B-, AB+, AB-, O+, O-
birthPlace        String?
disability        String?        // null = no disability, else description

// ── Employment (new fields) ──
dutyStation       String?        // Work location / field office name
probationEndDate  DateTime?
gradeLevel        String?        // Pay grade / band
costCenter        String?        // Financial cost allocation
workingHoursPerWeek Decimal?     @db.Decimal(4, 1) @default(40)
noticePeriodDays  Int?           @default(30)
isExpatriate      Boolean        @default(false)
shiftSchedule     String?        // Day / Night / Rotational

// ── Bank (new fields) ──
bankBranch        String?
bankRoutingNo     String?
mobileBankingProvider String?    // bKash, Nagad, Rocket
mobileBankingNumber   String?
paymentMethod     String?        @default("BANK_TRANSFER") // BANK_TRANSFER, MOBILE_BANKING, CHECK, CASH
taxCircle         String?
taxZone           String?

// ── Compensation (new fields) ──
houseRentAllowance    Decimal?   @db.Decimal(18, 2)
medicalAllowance      Decimal?   @db.Decimal(18, 2)
transportAllowance    Decimal?   @db.Decimal(18, 2)
otherAllowances       Json?      // [{name: "Food", amount: 3000}, ...]
grossSalary           Decimal?   @db.Decimal(18, 2) // Computed: basic + all allowances
payFrequency          String?    @default("MONTHLY") // MONTHLY, BI_WEEKLY, WEEKLY

// ── NGOAB Compliance (new fields) ──
ngoabNotified         Boolean    @default(false)
fd4ReferenceNo        String?
fd4SubmissionDate     DateTime?
fd4ApprovalStatus     String?    // PENDING, APPROVED, REJECTED

// ── Safeguarding (new fields) ──
codeOfConductSigned   Boolean    @default(false)
codeOfConductDate     DateTime?
pseaDeclarationSigned Boolean    @default(false)
safeguardingTrainingDate    DateTime?
safeguardingTrainingExpiry  DateTime?
backgroundCheckStatus String?    // PENDING, CLEARED, FLAGGED
backgroundCheckDate   DateTime?
mdsCheckCompleted     Boolean    @default(false) // Misconduct Disclosure Scheme (USAID/DFID)

// ── Relations (new) ──
emergencyContacts     EmployeeEmergencyContact[]
educationHistory      EmployeeEducation[]
workHistory           EmployeeWorkHistory[]
dependents            EmployeeDependent[]
skills                EmployeeSkill[]
languages             EmployeeLanguage[]
certifications        EmployeeCertification[]
```

##### 12.1b New Model: `EmployeeEmergencyContact`

```prisma
model EmployeeEmergencyContact {
  id             String   @id @default(uuid()) @db.Uuid
  employeeId     String   @db.Uuid
  contactName    String
  relationship   String   // SPOUSE, PARENT, SIBLING, CHILD, FRIEND, OTHER
  phone          String
  alternatePhone String?
  email          String?
  address        String?
  isPrimary      Boolean  @default(false)
  createdAt      DateTime @default(now())

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([employeeId])
}
```

##### 12.1c New Model: `EmployeeEducation`

```prisma
model EmployeeEducation {
  id            String   @id @default(uuid()) @db.Uuid
  employeeId    String   @db.Uuid
  degree        String   // SSC, HSC, Bachelor's, Master's, PhD, Diploma, Certificate
  institution   String
  fieldOfStudy  String?
  startYear     Int?
  endYear       Int?
  grade         String?  // GPA, Class, Division
  country       String?  @default("Bangladesh")
  createdAt     DateTime @default(now())

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([employeeId])
}
```

##### 12.1d New Model: `EmployeeWorkHistory`

```prisma
model EmployeeWorkHistory {
  id             String    @id @default(uuid()) @db.Uuid
  employeeId     String    @db.Uuid
  employer       String
  jobTitle       String
  department     String?
  startDate      DateTime
  endDate        DateTime?
  reasonForLeaving String?
  responsibilities String?
  location       String?
  isCurrent      Boolean   @default(false)
  createdAt      DateTime  @default(now())

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([employeeId])
}
```

##### 12.1e New Model: `EmployeeDependent`

```prisma
model EmployeeDependent {
  id             String   @id @default(uuid()) @db.Uuid
  employeeId     String   @db.Uuid
  name           String
  relationship   String   // SPOUSE, CHILD, PARENT, SIBLING, OTHER
  dateOfBirth    DateTime?
  gender         String?  // MALE, FEMALE, OTHER
  nidNumber      String?
  occupation     String?
  isNominee      Boolean  @default(false) // For PF/Gratuity
  nomineePercentage Decimal? @db.Decimal(5, 2)
  nomineeFor     String?  // PF, GRATUITY, INSURANCE, DEATH_BENEFIT
  isInsuranceBeneficiary Boolean @default(false)
  createdAt      DateTime @default(now())

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([employeeId])
}
```

##### 12.1f New Model: `EmployeeSkill`

```prisma
model EmployeeSkill {
  id          String   @id @default(uuid()) @db.Uuid
  employeeId  String   @db.Uuid
  skillName   String
  proficiency String   // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
  yearsOfExp  Int?
  createdAt   DateTime @default(now())

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@unique([employeeId, skillName])
  @@index([employeeId])
}
```

##### 12.1g New Model: `EmployeeLanguage`

```prisma
model EmployeeLanguage {
  id          String   @id @default(uuid()) @db.Uuid
  employeeId  String   @db.Uuid
  language    String   // Bengali, English, Arabic, Hindi, Urdu, etc.
  readLevel   String?  // NONE, BASIC, FLUENT, NATIVE
  writeLevel  String?
  speakLevel  String?
  createdAt   DateTime @default(now())

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@unique([employeeId, language])
  @@index([employeeId])
}
```

##### 12.1h New Model: `EmployeeCertification`

```prisma
model EmployeeCertification {
  id            String    @id @default(uuid()) @db.Uuid
  employeeId    String    @db.Uuid
  name          String
  issuingOrg    String
  issueDate     DateTime?
  expiryDate    DateTime?
  certificateNo String?
  filePath      String?   // Uploaded certificate file
  createdAt     DateTime  @default(now())

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([employeeId])
}
```

##### 12.1i Enhanced `EmployeeDocument` Model

Current model is very basic. Enhance with metadata:

```prisma
model EmployeeDocument {
  id                String    @id @default(uuid()) @db.Uuid
  employeeId        String    @db.Uuid
  name              String
  type              String    // NID_COPY, PHOTO, EDUCATIONAL_CERT, TIN_CERTIFICATE, etc.
  filePath          String
  uploadedAt        DateTime  @default(now())

  // ── New fields ──
  documentNumber    String?   // Reference number on the document
  issuedDate        DateTime?
  expiryDate        DateTime?
  issuingAuthority  String?
  verifiedBy        String?   @db.Uuid // User who verified
  verifiedAt        DateTime?
  verificationStatus String?  @default("PENDING") // PENDING, VERIFIED, REJECTED
  notes             String?

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([employeeId])
  @@index([type])
  @@index([expiryDate]) // For expiry alert cron job
}
```

**Schema Summary — 12.1 Total:**

| Item | Count | Type |
|------|-------|------|
| New fields on Employee | ~35 | Fields |
| New models | 7 | EmployeeEmergencyContact, EmployeeEducation, EmployeeWorkHistory, EmployeeDependent, EmployeeSkill, EmployeeLanguage, EmployeeCertification |
| Enhanced models | 1 | EmployeeDocument (6 new fields) |
| New indexes | 9 | On new models + document expiry |

---

#### 12.2 API Endpoints — Employee Sub-Resource CRUD

> **Pattern:** Each new model gets standard CRUD under `/api/v1/hr/employees/:employeeId/[resource]`

##### 12.2a Emergency Contacts API (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/employees/:employeeId/emergency-contacts` | List all emergency contacts |
| POST | `/api/v1/hr/employees/:employeeId/emergency-contacts` | Add emergency contact |
| PATCH | `/api/v1/hr/employees/:employeeId/emergency-contacts/:id` | Update contact |
| DELETE | `/api/v1/hr/employees/:employeeId/emergency-contacts/:id` | Remove contact |

##### 12.2b Education History API (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/employees/:employeeId/education` | List education records |
| POST | `/api/v1/hr/employees/:employeeId/education` | Add education record |
| PATCH | `/api/v1/hr/employees/:employeeId/education/:id` | Update record |
| DELETE | `/api/v1/hr/employees/:employeeId/education/:id` | Remove record |

##### 12.2c Work History API (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/employees/:employeeId/work-history` | List work history |
| POST | `/api/v1/hr/employees/:employeeId/work-history` | Add work history |
| PATCH | `/api/v1/hr/employees/:employeeId/work-history/:id` | Update entry |
| DELETE | `/api/v1/hr/employees/:employeeId/work-history/:id` | Remove entry |

##### 12.2d Dependents API (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/employees/:employeeId/dependents` | List dependents |
| POST | `/api/v1/hr/employees/:employeeId/dependents` | Add dependent |
| PATCH | `/api/v1/hr/employees/:employeeId/dependents/:id` | Update dependent |
| DELETE | `/api/v1/hr/employees/:employeeId/dependents/:id` | Remove dependent |

##### 12.2e Skills API (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/employees/:employeeId/skills` | List skills |
| POST | `/api/v1/hr/employees/:employeeId/skills` | Add skill |
| PATCH | `/api/v1/hr/employees/:employeeId/skills/:id` | Update skill |
| DELETE | `/api/v1/hr/employees/:employeeId/skills/:id` | Remove skill |

##### 12.2f Languages API (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/employees/:employeeId/languages` | List languages |
| POST | `/api/v1/hr/employees/:employeeId/languages` | Add language |
| PATCH | `/api/v1/hr/employees/:employeeId/languages/:id` | Update language |
| DELETE | `/api/v1/hr/employees/:employeeId/languages/:id` | Remove language |

##### 12.2g Certifications API (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/employees/:employeeId/certifications` | List certifications |
| POST | `/api/v1/hr/employees/:employeeId/certifications` | Add certification (with file upload) |
| PATCH | `/api/v1/hr/employees/:employeeId/certifications/:id` | Update certification |
| DELETE | `/api/v1/hr/employees/:employeeId/certifications/:id` | Remove certification |

##### 12.2h Employee Document Enhancement API (3 new endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/v1/hr/employees/:employeeId/documents/:id` | Update document metadata (number, dates, authority) |
| POST | `/api/v1/hr/employees/:employeeId/documents/:id/verify` | Mark document as verified/rejected |
| GET | `/api/v1/hr/employees/:employeeId/documents/expiring` | List documents expiring within N days |

##### 12.2i Employee Profile Summary API (1 endpoint)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/employees/:employeeId/profile-summary` | Aggregated summary: leave balance, attendance stats, contract status, PF balance, gratuity accrual, training hours, project allocations, onboarding progress — single API call for profile smart buttons |

**API Summary — 12.2 Total:**

| Resource | Endpoints | Auth |
|----------|-----------|------|
| Emergency Contacts | 4 | Authenticated |
| Education | 4 | Authenticated |
| Work History | 4 | Authenticated |
| Dependents | 4 | Authenticated |
| Skills | 4 | Authenticated |
| Languages | 4 | Authenticated |
| Certifications | 4 | Authenticated |
| Document Enhancement | 3 | Authenticated |
| Profile Summary | 1 | Authenticated |
| **Total** | **32** | |

---

#### 12.3 Employee Detail Page — Tabbed UI Rebuild

> **Context:** Current page is a single-scroll layout with 3 cards + documents + attachments. International-grade HRIS (Odoo, SAP SF, BambooHR) all use tabbed layouts with smart buttons. This rebuild transforms the page into a professional employee profile.

##### 12.3a Page Header (Always Visible)

**UI/UX Research Reference:** Odoo Employee Profile header, BambooHR Employee Profile top bar

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Photo/Avatar]  Imran Hossain (ইমরান হোসাইন)                   │
│                 EMP-007 · Field Coordinator · Field Operations   │
│                 📧 imran@shapla.org  📱 01413777888              │
│                 [ACTIVE] [CONTRACT] [EXPATRIATE]                │
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│ │ 12 days  │ │ Contract │ │ PF Bal   │ │ 3 Active │ │Onboard │ │
│ │ Leave    │ │ 89 days  │ │ ৳45,200  │ │ Projects │ │ 76%    │ │
│ │ Remaining│ │ left     │ │          │ │          │ │        │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                   [← Back][Edit]│
│ [Personal][Employment][Compensation][Documents][Leave][Projects] │
│ [Training][Performance][Compliance][Contracts][Timeline]         │
└─────────────────────────────────────────────────────────────────┘
```

**Smart Buttons** (data from `/profile-summary` API):
1. **Leave Remaining** — Total annual leave balance → links to `/hr/leave?employee={id}`
2. **Contract Days Left** — Active contract days until expiry → links to `/hr/contracts?employee={id}`
3. **PF Balance** — Current PF balance (if enrolled) → links to `/hr/pension/provident-fund/enrollments/{id}`
4. **Active Projects** — Count of current project allocations → scrolls to Projects tab
5. **Onboarding %** — Onboarding progress (only if < 100%) → links to `/hr/onboarding/{id}`

##### 12.3b Tab 1: Personal Information

**Data source:** Employee model fields

**Layout (2-column grid):**

| Left Column | Right Column |
|-------------|-------------|
| Full Name | Localized Name (Bangla) |
| Father's Name | Mother's Name |
| Spouse Name | Date of Birth (age calculated) |
| Gender | Marital Status |
| Blood Group | Religion |
| Nationality | Birth Place |
| NID Number | Passport Number |
| Disability Status | |

**Emergency Contacts Sub-section** (inline table):
| Contact Name | Relationship | Phone | Alt Phone | Primary? | Actions |
|---|---|---|---|---|---|
| Fatema Begum | SPOUSE | 01712... | — | ✅ | Edit / Delete |
| Nurul Islam | FATHER | 01819... | 01612... | — | Edit / Delete |
+ [Add Contact] button

**Edit mode:** All fields become editable inline. Emergency contacts have add/edit/delete within the tab.

##### 12.3c Tab 2: Employment Information

**Data source:** Employee model + Department + Designation + Employee (reportingTo)

**Layout (2-column grid):**

| Left Column | Right Column |
|-------------|-------------|
| Employee No | Status (badge) |
| Department | Designation |
| Employment Type (badge) | Grade/Pay Level |
| Joining Date | Confirmation Date |
| Probation End Date | End Date (contract) |
| Duty Station | Cost Center |
| Reporting To (link) | Shift Schedule |
| Working Hours/Week | Notice Period (days) |
| Is Expatriate (badge) | Converted From (recruitment link) |

**Direct Reports Sub-section** (if any):
- List of direct reports with name, designation, department → clickable to their profile

##### 12.3d Tab 3: Compensation & Benefits

**Data source:** Employee salary fields + Payroll summary + PF/Gratuity

**Layout:**

**Salary Breakdown Card:**
| Component | Monthly (BDT) |
|-----------|--------------|
| Basic Salary | ৳38,000 |
| House Rent Allowance | ৳15,200 |
| Medical Allowance | ৳5,000 |
| Transport Allowance | ৳3,000 |
| Other Allowances | ৳2,000 |
| **Gross Salary** | **৳63,200** |

**Payment Details Card:**
| Field | Value |
|-------|-------|
| Pay Frequency | Monthly |
| Payment Method | Bank Transfer |
| Bank Name | Dutch-Bangla Bank |
| Bank Branch | Motijheel |
| Account No | 123-456-7890 |
| Routing No | 090261234 |
| Mobile Banking | bKash — 01712345678 |
| TIN Number | 123456789012 |
| Tax Circle | Circle-12, Zone-6 |

**Retirement Benefits Summary Card:**
| Benefit | Status | Balance |
|---------|--------|---------|
| Provident Fund | Enrolled (since Jan 2023) | ৳45,200 |
| Gratuity | Eligible (3.2 years) | ৳121,600 accrued |

**Latest Payslip Link** → `/hr/payroll/payslips?employee={id}`

##### 12.3e Tab 4: Documents

**Data source:** EmployeeDocument model + REQUIRED_DOCUMENTS config

**Layout:**

**Required Documents Checklist (with upload):**

| Document | Required | Status | Uploaded | Expiry | Verified | Actions |
|----------|----------|--------|----------|--------|----------|---------|
| NID / Birth Certificate | ✅ | ✅ Uploaded | 15 Jan 2023 | — | ✅ Verified | View / Replace |
| Passport-size Photos | ✅ | ⚠️ Missing | — | — | — | Upload |
| Educational Certificates | ✅ | ✅ Uploaded | 15 Jan 2023 | — | ⏳ Pending | View / Replace |
| TIN Certificate | ✅ | ✅ Uploaded | 20 Jan 2023 | — | ✅ Verified | View / Replace |
| Work Permit | For expat | ⚠️ Missing | — | — | — | Upload |
| Passport Copy | For expat | ⚠️ Expiring | 10 Mar 2023 | 2026-05-15 | ✅ Verified | View / Replace |

**Key features:**
- Upload button directly on each document row (NOT only in onboarding page)
- Document metadata form on upload: document number, issue date, expiry date, issuing authority
- Expiry date color coding: green (>90 days), yellow (30-90 days), red (<30 days)
- Verification workflow: Admin can mark Verified/Rejected with notes
- View document opens in modal/new tab
- Replace document keeps history (old version archived)
- Conditional rows: "Work Permit" and "Passport Copy" only shown if `isExpatriate = true`

**Additional Documents Section:**
- Generic file upload for any other documents not in required list
- Drag & drop area (existing FileUpload component)

##### 12.3f Tab 5: Leave & Attendance (Summary)

**Data source:** LeaveBalance, LeaveApplication, Attendance (existing models — no new schema needed)

**Layout:**

**Leave Balance Cards (current fiscal year):**
| Leave Type | Entitled | Taken | Remaining |
|------------|----------|-------|-----------|
| Annual Leave | 15 | 3 | 12 |
| Casual Leave | 10 | 5 | 5 |
| Sick Leave | 14 | 2 | 12 |
| Maternity Leave | 112 | 0 | 112 |

**Recent Leave Applications (last 5):**
| Type | From | To | Days | Status |
|------|------|----|------|--------|
| Casual | 15 Mar | 16 Mar | 2 | ✅ Approved |
| Sick | 28 Feb | 28 Feb | 1 | ✅ Approved |

**Attendance Summary (current month):**
| Metric | Value |
|--------|-------|
| Working Days | 22 |
| Present | 18 |
| Absent | 1 |
| Late | 2 |
| On Leave | 1 |

**Links:** "View Full Leave History" → `/hr/leave?employee={id}`, "View Attendance" → `/hr/attendance?employee={id}`

**No new API needed** — uses existing `/api/v1/hr/leave/balances?employeeId=` and `/api/v1/hr/attendance?employeeId=`

##### 12.3g Tab 6: Projects & Allocations (NGO-Specific)

**Data source:** EmployeeProjectAllocation, ProjectTeamMember (existing models)

**Layout:**

**Current Project Assignments:**
| Project | Role | Allocation % | Grant/Donor | Period | Budget Line |
|---------|------|-------------|-------------|--------|-------------|
| WASH Phase-II | Field Coordinator | 60% | UNICEF | Jan-Dec 2026 | 5.1.2 |
| Education for All | M&E Support | 40% | Save the Children | Mar-Jun 2026 | 3.2.1 |
| **Total Allocation** | | **100%** | | | |

**Allocation History:**
- Past project assignments with dates

**Cost Allocation Pie Chart** (Recharts):
- Visual breakdown of salary cost across projects/grants
- Unfunded portion highlighted in red if total < 100%

**Links:** Click project name → `/projects/{id}`, "View Timesheet" → `/hr/timesheet?employee={id}`

**No new API needed** — uses existing `/api/v1/projects/team-members?employeeId=` and `/api/v1/projects/allocations?employeeId=`

##### 12.3h Tab 7: Education, Skills & Training

**Data source:** EmployeeEducation (new), EmployeeSkill (new), EmployeeLanguage (new), EmployeeCertification (new), TrainingParticipant (existing)

**Layout:**

**Education History (inline editable table):**
| Degree | Institution | Field | Year | Grade | Country | Actions |
|--------|------------|-------|------|-------|---------|---------|
| Master's | University of Dhaka | Development Studies | 2018 | 3.45 GPA | Bangladesh | Edit / Delete |
| Bachelor's | Chittagong University | Sociology | 2016 | 3.12 GPA | Bangladesh | Edit / Delete |
+ [Add Education] button

**Work Experience (inline editable table):**
| Employer | Title | Period | Location | Actions |
|----------|-------|--------|----------|---------|
| BRAC | Field Officer | 2018-2022 | Sylhet | Edit / Delete |
| ASA | Program Assistant | 2016-2018 | Dhaka | Edit / Delete |
+ [Add Work Experience] button

**Skills (tag-style display):**
`WASH Programming [Expert]` `M&E [Advanced]` `Report Writing [Advanced]` `GIS [Intermediate]`
+ [Add Skill] button

**Languages:**
| Language | Read | Write | Speak |
|----------|------|-------|-------|
| Bengali | Native | Native | Native |
| English | Fluent | Fluent | Fluent |
| Hindi | Basic | None | Basic |
+ [Add Language] button

**Certifications:**
| Name | Issuer | Date | Expiry | File | Actions |
|------|--------|------|--------|------|---------|
| PMP | PMI | 2024-06 | 2027-06 | 📄 View | Edit / Delete |
| WASH Specialist | UNICEF | 2023-01 | — | 📄 View | Edit / Delete |
+ [Add Certification] button

**Training History** (from existing TrainingParticipant):
| Training | Date | Score | Status |
|----------|------|-------|--------|
| Safeguarding & PSEA | 15 Jan 2026 | 92% | ✅ Completed |
| First Aid | 10 Dec 2025 | Pass | ✅ Completed |

##### 12.3i Tab 8: Performance (Summary)

**Data source:** PerformanceReview (existing model)

**Layout:**

**Current Review Cycle:**
| Field | Value |
|-------|-------|
| Period | Jan-Dec 2026 |
| Status | Self-Review Pending |
| Reviewer | Karim Ahmed (Finance Head) |

**Performance History Chart** (Recharts line/bar):
- X-axis: Review periods, Y-axis: Score
- Shows trend over time

**Recent Reviews:**
| Period | Rating | Score | Reviewer |
|--------|--------|-------|----------|
| 2025 | Meets Expectations | 3.5/5 | Karim Ahmed |
| 2024 | Exceeds Expectations | 4.2/5 | Fatema Begum |

**Links:** "View Full Performance History" → `/hr/performance?employee={id}`

**No new API needed** — uses existing `/api/v1/hr/performance?employeeId=`

##### 12.3j Tab 9: Compliance & Legal

**Data source:** New Employee fields (12.1a compliance/safeguarding fields)

**Layout:**

**NGOAB Compliance Card:**
| Field | Value | Status |
|-------|-------|--------|
| NGOAB Notified | Yes | ✅ |
| FD-4 Reference No | FD4-2023-1234 | — |
| FD-4 Submission Date | 15 Jan 2023 | — |
| FD-4 Approval Status | Approved | ✅ |

**Safeguarding & PSEA Card:**
| Field | Value | Status |
|-------|-------|--------|
| Code of Conduct Signed | Yes | ✅ |
| Code of Conduct Date | 15 Jan 2023 | — |
| PSEA Declaration | Yes | ✅ |
| Safeguarding Training | 15 Jan 2026 | ✅ Current |
| Training Expiry | 15 Jan 2027 | 🟢 289 days |
| Background Check | Cleared | ✅ |
| MDS Check | Completed | ✅ |

**Expatriate Compliance Card** (only if `isExpatriate = true`):
| Field | Value |
|-------|-------|
| Work Permit No | WP-2023-5678 |
| Work Permit Expiry | 2026-12-31 |
| Visa Type | E-Visa (Employment) |
| BIDA Registration | BIDA-REG-1234 |
| Security Clearance | Cleared |

##### 12.3k Tab 10: Contracts

**Data source:** EmployeeContract (existing model)

**Layout:**

**Active Contract** (highlighted card):
```
┌──────────────────────────────────────────────────┐
│ CTR-2023-005  ·  CONTRACT  ·  🟢 ACTIVE          │
│ 01 Jun 2023 → 31 May 2025  (730 days, 89 left)  │
│ Basic: ৳38,000  ·  Funded by: UNICEF WASH-II     │
│ [View Contract] [Download PDF]                    │
└──────────────────────────────────────────────────┘
```

**Contract Timeline:**
| # | Type | Period | Salary | Status | Funding Source |
|---|------|--------|--------|--------|----------------|
| CTR-003 | Contract | Jun 2023 - May 2025 | ৳38,000 | 🟢 Active | UNICEF WASH-II |
| CTR-002 | Contract | Jun 2021 - May 2023 | ৳32,000 | Completed | DFID Education |
| CTR-001 | Contract | Jun 2020 - May 2021 | ৳28,000 | Completed | Core Fund |

**Links:** Click contract → `/hr/contracts/{id}`, "Create Renewal" → `/hr/contracts/new?renewalOf={id}`

**No new API needed** — uses existing `/api/v1/hr/contracts?employeeId=`

##### 12.3l Tab 11: Activity Timeline

**Data source:** Aggregated from multiple models (onboarding, contracts, leave, performance, disciplinary, grievance)

**Layout (reverse chronological):**
```
📅 2026-03-15 — Leave approved: Casual Leave (15-16 Mar 2026)
📅 2026-03-01 — Performance review cycle started (2026 Annual)
📅 2026-01-15 — Training completed: Safeguarding & PSEA (Score: 92%)
📅 2025-12-01 — Salary revised: ৳35,000 → ৳38,000 (+8.6%)
📅 2025-06-01 — Contract renewed: CTR-003 (Jun 2023 - May 2025)
📅 2025-01-15 — Onboarding completed: All 17 tasks done ✅
📅 2023-06-01 — Employee joined: EMP-007 (converted from recruitment)
```

**No new model needed** — API aggregates from existing models, sorted by date.

**New API:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hr/employees/:employeeId/timeline` | Aggregated activity timeline (paginated, filterable by type) |

---

#### 12.4 Employee Edit Form Rebuild

> **Context:** The edit form needs to support ALL fields across all tabs, not just the basic 10 fields currently available.

##### 12.4a Edit Mode Architecture

**Approach:** Each tab has its own edit capability (inline editing within the tab, not a separate page).

**Pattern:**
1. Tab header shows [Edit] button
2. Click [Edit] → fields in that tab become editable
3. [Save] / [Cancel] buttons appear at tab footer
4. Save calls the appropriate API (PUT for Employee fields, POST/PATCH/DELETE for sub-resources)
5. Sub-resources (education, skills, contacts, etc.) use inline add/edit/delete — no separate page

**Edit APIs by tab:**

| Tab | API | Method |
|-----|-----|--------|
| Personal | `/api/v1/hr/employees/:id` | PUT (employee fields) |
| Personal → Emergency Contacts | `/api/v1/hr/employees/:id/emergency-contacts` | POST/PATCH/DELETE |
| Employment | `/api/v1/hr/employees/:id` | PUT (employee fields) |
| Compensation | `/api/v1/hr/employees/:id` | PUT (employee fields) |
| Documents | `/api/v1/hr/employees/:id/documents` | POST (upload) / PATCH (metadata) |
| Education & Skills | Sub-resource APIs | POST/PATCH/DELETE per resource |
| Compliance | `/api/v1/hr/employees/:id` | PUT (compliance fields) |

##### 12.4b Employee Create Form Update (`employees/new/page.tsx`)

Add new fields to the create form, organized by section:

**Section 1: Personal Information** (existing + new fields)
- fullName*, localizedName, fatherName, motherName, dateOfBirth, gender, maritalStatus, nidNumber, passport
- NEW: spouseName, nationality, bloodGroup, religion, disability

**Section 2: Employment Information** (existing + new fields)
- department*, designation*, employmentType*, joiningDate*, basicSalary
- NEW: dutyStation, gradeLevel, costCenter, isExpatriate, shiftSchedule, workingHoursPerWeek, noticePeriodDays

**Section 3: Contact & Bank** (existing + new fields)
- email, phone, emergencyContact, presentAddress, permanentAddress, bankName, bankAccountNo
- NEW: bankBranch, bankRoutingNo, mobileBankingProvider, mobileBankingNumber, paymentMethod, tinNumber, taxCircle, taxZone

**Section 4: Compensation** (all new)
- houseRentAllowance, medicalAllowance, transportAllowance, otherAllowances, payFrequency

**Section 5: Emergency Contacts** (new — inline table)
- Add at least 1 emergency contact during creation

**Note:** Education, skills, work history, dependents, certifications, compliance — these are added AFTER employee creation via the detail page tabs (not in create form, to keep creation simple).

---

#### 12.5 i18n — Translation Keys

> All new fields, tabs, labels, and messages need EN + BN translations.

**New translation keys needed (estimated ~200 keys):**

**Namespace: `hr` (add to existing `src/messages/en/hr.json` and `bn/hr.json`)**

```
hr.profile.tabs.personal
hr.profile.tabs.employment
hr.profile.tabs.compensation
hr.profile.tabs.documents
hr.profile.tabs.leave
hr.profile.tabs.projects
hr.profile.tabs.educationSkills
hr.profile.tabs.performance
hr.profile.tabs.compliance
hr.profile.tabs.contracts
hr.profile.tabs.timeline

hr.profile.smartButtons.leaveRemaining
hr.profile.smartButtons.contractDaysLeft
hr.profile.smartButtons.pfBalance
hr.profile.smartButtons.activeProjects
hr.profile.smartButtons.onboardingProgress

hr.form.spouseName
hr.form.nationality
hr.form.bloodGroup
hr.form.religion
hr.form.birthPlace
hr.form.disability
hr.form.dutyStation
hr.form.probationEndDate
hr.form.gradeLevel
hr.form.costCenter
hr.form.workingHours
hr.form.noticePeriod
hr.form.isExpatriate
hr.form.shiftSchedule
hr.form.bankBranch
hr.form.bankRoutingNo
hr.form.mobileBankingProvider
hr.form.mobileBankingNumber
hr.form.paymentMethod
hr.form.taxCircle
hr.form.taxZone
hr.form.houseRentAllowance
hr.form.medicalAllowance
hr.form.transportAllowance
hr.form.otherAllowances
hr.form.grossSalary
hr.form.payFrequency

hr.form.bloodGroups.A_POSITIVE ... (8 types)
hr.form.religions.ISLAM, HINDUISM, BUDDHISM, CHRISTIANITY, OTHER
hr.form.paymentMethods.BANK_TRANSFER, MOBILE_BANKING, CHECK, CASH
hr.form.payFrequencies.MONTHLY, BI_WEEKLY, WEEKLY
hr.form.proficiencyLevels.BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
hr.form.languageLevels.NONE, BASIC, FLUENT, NATIVE
hr.form.relationships.SPOUSE, PARENT, SIBLING, CHILD, FRIEND, OTHER
hr.form.verificationStatuses.PENDING, VERIFIED, REJECTED

hr.emergencyContacts.title, .add, .edit, .delete, .primary, .noPrimary
hr.education.title, .add, .degree, .institution, .field, .year, .grade
hr.workHistory.title, .add, .employer, .jobTitle, .period, .current
hr.dependents.title, .add, .name, .relationship, .nominee, .percentage
hr.skills.title, .add, .skillName, .proficiency, .years
hr.languages.title, .add, .language, .read, .write, .speak
hr.certifications.title, .add, .name, .issuer, .issueDate, .expiry
hr.compliance.ngoab, .fd4, .safeguarding, .psea, .backgroundCheck, .mds
hr.timeline.title, .noActivity

... (~200 total keys)
```

---

#### 12.6 Seed Data Update

> **Context:** Fix existing gender casing bug + add rich demo data for all new models.

##### 12.6a Gender/MaritalStatus Casing Fix

Update all seed files to use UPPERCASE enum values:
- `gender: 'MALE'` (not `'Male'`)
- `gender: 'FEMALE'` (not `'Female'`)
- `maritalStatus: 'MARRIED'` (not `'Married'`)

##### 12.6b New Seed: `prisma/seed-phase12-hr-profile.ts`

**Demo data to create:**

| Model | Records | Example Data |
|-------|---------|-------------|
| EmployeeEmergencyContact | 10 (2 per employee for 5 employees) | Spouse, parent contacts with BD phone numbers |
| EmployeeEducation | 12 (2-3 per employee) | SSC/HSC/Bachelor's/Master's from BD universities |
| EmployeeWorkHistory | 10 (2 per employee) | Previous NGO employment (BRAC, ASA, Grameen) |
| EmployeeDependent | 8 (1-2 per employee) | Spouse, children with nominee info for PF |
| EmployeeSkill | 15 (3 per employee) | WASH, M&E, GIS, Report Writing, Data Analysis |
| EmployeeLanguage | 12 (2-3 per employee) | Bengali (native), English (fluent), Hindi/Arabic (basic) |
| EmployeeCertification | 6 (1-2 per employee) | PMP, WASH Specialist, First Aid, CPA |

**Update existing employee records** with new fields:
- Karim Ahmed: dutyStation="Dhaka HQ", gradeLevel="G-7", nationality="Bangladeshi", bloodGroup="O+", isExpatriate=false
- Fatema Begum: dutyStation="Dhaka HQ", gradeLevel="G-6", nationality="Bangladeshi", bloodGroup="A+", maritalStatus="MARRIED"
- Imran Hossain: dutyStation="Sylhet Field", gradeLevel="G-4", isExpatriate=false, ngoabNotified=true, fd4ReferenceNo="FD4-2023-1234"
- (all 6 employees get new fields populated)

---

#### 12.7 Cross-Module Connections

> **Context:** The employee profile must surface data from other modules. These connections use EXISTING APIs — no new backend work needed except the profile-summary endpoint.

| Tab | Connected Module | API Used | Notes |
|-----|-----------------|----------|-------|
| Leave & Attendance | HR Leave | `GET /api/v1/hr/leave/balances?employeeId=` | Existing |
| Leave & Attendance | HR Attendance | `GET /api/v1/hr/attendance?employeeId=` | Existing |
| Projects | Project Management | `GET /api/v1/projects/allocations?employeeId=` | Existing |
| Performance | HR Performance | `GET /api/v1/hr/performance?employeeId=` | Existing |
| Contracts | HR Contracts | `GET /api/v1/hr/contracts?employeeId=` | Existing |
| Training | HR Training | `GET /api/v1/hr/training/participants?employeeId=` | Existing |
| Compensation → PF | HR Pension | `GET /api/v1/hr/pf/enrollments?employeeId=` | Existing |
| Compensation → Gratuity | HR Pension | `GET /api/v1/hr/gratuity/ledgers?employeeId=` | Existing |
| Smart Buttons | Aggregated | `GET /api/v1/hr/employees/:id/profile-summary` | **New (12.2i)** |
| Timeline | Aggregated | `GET /api/v1/hr/employees/:id/timeline` | **New (12.3l)** |
| Documents → Onboarding | HR Onboarding | `GET /api/v1/hr/onboarding/:employeeId` | Existing — link from Documents tab |

---

#### 12.8 Implementation Order

> **Dependencies mapped to avoid conflicts. Each step depends on the previous unless noted.**

| Step | Task | Dependencies | Estimated Scope |
|------|------|-------------|-----------------|
| **12.0** | Bug fixes (gender casing, seed updates) | None | 3 files + migration script |
| **12.1** | Prisma schema expansion (Employee fields + 7 new models + EmployeeDocument enhancement) | None | `hr.prisma` + `db:push` |
| **12.2a-g** | Sub-resource CRUD APIs (7 × 4 = 28 endpoints) | 12.1 | 7 API route directories |
| **12.2h** | Document enhancement APIs (3 endpoints) | 12.1 | 1 API route directory |
| **12.2i** | Profile summary API | 12.1 | 1 API route |
| **12.3a** | Page header + smart buttons | 12.2i | Employee detail page rebuild start |
| **12.3b-c** | Tabs 1-2: Personal + Employment | 12.2a (emergency contacts), 12.1 | Tab components |
| **12.3d** | Tab 3: Compensation | 12.1 | Tab component |
| **12.3e** | Tab 4: Documents (with inline upload) | 12.2h | Tab component |
| **12.3f** | Tab 5: Leave & Attendance | None (uses existing APIs) | Tab component |
| **12.3g** | Tab 6: Projects & Allocations | None (uses existing APIs) | Tab component |
| **12.3h** | Tab 7: Education, Skills & Training | 12.2b, 12.2e, 12.2f, 12.2g | Tab component |
| **12.3i** | Tab 8: Performance | None (uses existing APIs) | Tab component |
| **12.3j** | Tab 9: Compliance | 12.1 | Tab component |
| **12.3k** | Tab 10: Contracts | None (uses existing APIs) | Tab component |
| **12.3l** | Tab 11: Timeline + API | 12.1 | Tab component + 1 API |
| **12.4a** | Edit mode per-tab architecture | 12.3b-k | Edit functionality |
| **12.4b** | Employee create form update | 12.1 | `employees/new/page.tsx` |
| **12.5** | i18n translations (EN + BN) | 12.3, 12.4 | 2 JSON files |
| **12.6** | Seed data (new models + fix gender casing) | 12.1 | 1 new seed file + fix existing |
| **12.7** | Cross-module integration testing | All above | Verify all tab data loads |

**Parallel tracks possible:**
- **Track A (Schema + APIs):** Steps 12.0 → 12.1 → 12.2a-i (can run in parallel with Track B research)
- **Track B (UI/UX Research):** Research Odoo/BambooHR profile UI patterns before starting 12.3
- **Track C (UI Build):** Steps 12.3a → 12.3b-k → 12.4 (depends on Track A completion)
- **Track D (i18n + Seed):** Steps 12.5 + 12.6 (can run after Track A, parallel with Track C)

---

#### 12.9 Testing Scenarios

| # | Scenario | Steps |
|---|----------|-------|
| 1 | Gender displays correctly | Create employee with MALE gender → view detail → shows "Male" (translated) |
| 2 | Edit form saves all fields | Edit every field in every tab → save → refresh → all values persisted |
| 3 | Emergency contact CRUD | Add 2 contacts → set primary → delete 1 → verify list |
| 4 | Education history CRUD | Add degree → edit grade → delete → verify list |
| 5 | Document upload with metadata | Upload NID → fill document number, expiry → verify shown in Documents tab |
| 6 | Document verification workflow | Upload doc → admin verifies → status changes to VERIFIED |
| 7 | Document expiry alerts | Upload doc with expiry in 20 days → check expiring endpoint returns it |
| 8 | Profile summary API | Call summary → verify leave balance, contract days, PF balance all returned |
| 9 | Smart buttons render | Open employee profile → verify 5 smart buttons show correct data |
| 10 | Tab navigation | Click through all 11 tabs → verify data loads in each |
| 11 | Projects tab allocation total | Add 2 project allocations (60% + 40%) → verify 100% total shown |
| 12 | Compliance tab NGOAB fields | Set fd4ReferenceNo, ngoabNotified → verify shown in Compliance tab |
| 13 | Timeline aggregation | Employee with contract, leave, training → timeline shows all events sorted |
| 14 | Create form new fields | Create employee with new fields (nationality, bloodGroup, etc.) → verify saved |
| 15 | Seed data integrity | Run seed → verify all 6 employees have emergency contacts, education, skills |
| 16 | Cross-module data display | Employee with PF enrollment → Compensation tab shows PF balance |
| 17 | Expatriate conditional fields | Set isExpatriate=true → work permit, passport, BIDA fields appear |
| 18 | Dependent nominee validation | Add dependent as PF nominee → verify percentages sum to 100% |
| 19 | Inline edit per tab | Edit Personal tab → save → edit Employment tab → save → no data loss between tabs |
| 20 | i18n switching | Switch to Bengali → all new labels show Bengali translations |

---

#### 12.10 Phase Summary

| Item | Count |
|------|-------|
| Bug fixes | 3 (gender casing, edit form, hidden fields) |
| New Employee fields | ~35 |
| New Prisma models | 7 |
| Enhanced Prisma models | 1 (EmployeeDocument) |
| New API endpoints | 34 (32 sub-resource CRUD + profile-summary + timeline) |
| UI tabs (detail page rebuild) | 11 |
| Smart buttons | 5 |
| i18n keys (estimated) | ~200 (EN + BN) |
| Seed records | ~73 new records + 6 employee updates |
| Test scenarios | 20 |

**Files affected (estimated):**
- `prisma/schema/hr.prisma` — Schema expansion
- `src/app/(dashboard)/hr/employees/[id]/page.tsx` — Full page rebuild (tabbed UI)
- `src/app/(dashboard)/hr/employees/new/page.tsx` — Create form expansion
- `src/app/api/v1/hr/employees/[employeeId]/` — 9 new API route directories
- `src/messages/en/hr.json` + `src/messages/bn/hr.json` — i18n
- `prisma/seed-phase12-hr-profile.ts` — New seed file
- `prisma/seed-phase5.ts`, `prisma/seed-phase8-hr.ts` — Gender casing fix
- `prisma/migration-fix-gender-case.ts` — Data migration script

---

### Phase 8c: HR Deferred Features + Cross-Module HR Integration ⬜ TODO

> **Priority: Complete all deferred 8.7 features (salary structure, payslip PDF, team leave calendar, OKR) + implement Phase 10.2 (HR/Payroll→Budget) + Dashboard HR KPIs**
> **Benchmarks: UNDP ICSC Salary Scale, SAP SuccessFactors Compensation, BambooHR Team Calendar, Lattice OKR, Sage Intacct Nonprofit Payroll Allocation, Oracle HCM Payslip**
> **Compliance: Bangladesh Labour Act 2006, USAID 2 CFR 200 (personnel cost allocation), ILO Payslip Standards, NGOAB FD-6 Personnel Budget**
> **Dependencies:** Phase 8 (✅), Phase 8b (✅), Phase 12 (✅), Phase 5 HR basics (✅)
> **Scope:** 6 major features — salary grades, dynamic payroll lines, payslip PDF, team leave calendar, OKR framework, personnel cost tracking, dashboard HR KPIs

---

#### 8c.0 Overview — Feature Map

| # | Feature | New Models | New APIs | New Pages | Seed Records |
|---|---------|-----------|----------|-----------|-------------|
| 8c.1 | Salary Grade/Step Matrix | 4 | 14 | 3 | ~50 |
| 8c.2 | Dynamic PayrollEntryLine + Payslip PDF | 3 | 8 | 2 | ~80 |
| 8c.3 | Team Leave Calendar | 1 | 3 | 1 | ~20 |
| 8c.4 | OKR Framework | 5 | 16 | 5 | ~60 |
| 8c.5 | HR/Payroll → Budget Personnel Cost Tracking | 1 | 8 | 1 | ~30 |
| 8c.6 | Dashboard KPI — Employee Join/Leave/Turnover | 0 | 3 | 0 (dashboard update) | — |
| **Total** | | **14** | **52** | **12** | **~240** |

---

#### 8c.1 Salary Grade/Step Matrix (UN-Style)

**Context:** International NGOs (UNDP, UNICEF, Save the Children, BRAC) use structured salary grade systems. The UN system uses ICSC scales with Professional (P-1 to P-5) and General Service (G-1 to G-7) tracks, each with 10-15 steps representing annual increments. Large INGOs use Hay Group/Korn Ferry job evaluation with 8-12 grades, min/mid/max ranges, and 3-5 steps per band.

**Current Problem:** `Employee.gradeLevel` is a plain string. `SalaryComponent` exists but isn't linked to grades. Salary is stored as flat fields on `Employee` (basicSalary, houseRentAllowance, etc.) with no structure, no revision history, and no grade-step progression logic.

##### 8c.1a New Enums (base.prisma)

```prisma
enum SalaryComponentCalculationType {
  FIXED              // Fixed amount
  PERCENT_OF_BASIC   // Percentage of basic salary
  PERCENT_OF_GROSS   // Percentage of gross salary
}

enum SalaryRevisionType {
  INITIAL            // First assignment
  STEP_INCREMENT     // Annual step progression
  GRADE_PROMOTION    // Grade change (promotion)
  COLA               // Cost of Living Adjustment
  MARKET_ADJUSTMENT  // Market benchmarking
  CORRECTION         // Data correction
  DEMOTION           // Grade downgrade
}
```

##### 8c.1b New Model: `SalaryGrade`

```prisma
model SalaryGrade {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String   @db.Uuid
  code            String   // "G-1", "P-3", "Band-A"
  name            String   // "General Service Level 1", "Professional Level 3"
  level           Int      // Numeric level for sorting (1, 2, 3...)
  description     String?
  minSalary       Decimal  @db.Decimal(18, 2)  // Range minimum
  midSalary       Decimal  @db.Decimal(18, 2)  // Range midpoint
  maxSalary       Decimal  @db.Decimal(18, 2)  // Range maximum
  currency        String   @default("BDT")
  effectiveFrom   DateTime
  effectiveTo     DateTime?  // null = current
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id])
  steps           SalaryGradeStep[]
  structures      SalaryStructure[]
  employees       Employee[]  // Employees in this grade
  revisions       SalaryRevisionHistory[]  // as previousGrade/newGrade

  @@unique([organizationId, code])
  @@index([organizationId])
  @@index([isActive])
  @@index([level])
}
```

##### 8c.1c New Model: `SalaryGradeStep`

```prisma
model SalaryGradeStep {
  id           String   @id @default(uuid()) @db.Uuid
  gradeId      String   @db.Uuid
  stepNumber   Int      // 1, 2, 3... within the grade
  basicSalary  Decimal  @db.Decimal(18, 2)  // Basic salary at this step
  effectiveFrom DateTime
  effectiveTo  DateTime?
  createdAt    DateTime @default(now())

  grade        SalaryGrade @relation(fields: [gradeId], references: [id], onDelete: Cascade)

  @@unique([gradeId, stepNumber])
  @@index([gradeId])
}
```

##### 8c.1d New Model: `SalaryStructure` (Allowance Template)

```prisma
model SalaryStructure {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String   @db.Uuid
  name            String   // "Standard Bangladesh", "Expatriate Package", "Field Staff"
  gradeId         String?  @db.Uuid  // Optional: grade-specific structure
  description     String?
  isDefault       Boolean  @default(false)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id])
  grade           SalaryGrade? @relation(fields: [gradeId], references: [id])
  lines           SalaryStructureLine[]

  @@index([organizationId])
  @@index([gradeId])
}

model SalaryStructureLine {
  id               String   @id @default(uuid()) @db.Uuid
  structureId      String   @db.Uuid
  componentId      String   @db.Uuid  // FK to SalaryComponent
  calculationType  SalaryComponentCalculationType  // FIXED, PERCENT_OF_BASIC, PERCENT_OF_GROSS
  amount           Decimal? @db.Decimal(18, 2)     // Used when FIXED
  percentage       Decimal? @db.Decimal(5, 2)      // Used when PERCENT_*
  sortOrder        Int      @default(0)
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())

  structure        SalaryStructure @relation(fields: [structureId], references: [id], onDelete: Cascade)
  component        SalaryComponent @relation(fields: [componentId], references: [id])

  @@unique([structureId, componentId])
  @@index([structureId])
}
```

##### 8c.1e New Model: `SalaryRevisionHistory`

```prisma
model SalaryRevisionHistory {
  id              String   @id @default(uuid()) @db.Uuid
  organizationId  String   @db.Uuid
  employeeId      String   @db.Uuid
  revisionDate    DateTime
  effectiveDate   DateTime
  revisionType    SalaryRevisionType
  previousGradeId String?  @db.Uuid
  newGradeId      String?  @db.Uuid
  previousStepNo  Int?
  newStepNo       Int?
  previousBasic   Decimal? @db.Decimal(18, 2)
  newBasic        Decimal  @db.Decimal(18, 2)
  previousGross   Decimal? @db.Decimal(18, 2)
  newGross        Decimal  @db.Decimal(18, 2)
  reason          String?
  remarks         String?
  approvedById    String?  @db.Uuid
  approvedAt      DateTime?
  createdAt       DateTime @default(now())

  employee        Employee @relation(fields: [employeeId], references: [id])
  previousGrade   SalaryGrade? @relation("PreviousGrade", fields: [previousGradeId], references: [id])
  newGrade        SalaryGrade? @relation("NewGrade", fields: [newGradeId], references: [id])

  @@index([employeeId])
  @@index([organizationId])
  @@index([revisionDate])
}
```

##### 8c.1f Employee Model Changes

```prisma
model Employee {
  // ... existing fields ...

  // CHANGE: gradeLevel String? → salaryGradeId (FK)
  salaryGradeId     String?  @db.Uuid
  salaryStepNo      Int?     // Current step within grade
  salaryStructureId String?  @db.Uuid  // Assigned allowance template

  salaryGrade       SalaryGrade?     @relation(fields: [salaryGradeId], references: [id])
  salaryStructure   SalaryStructure? @relation(fields: [salaryStructureId], references: [id])
  salaryRevisions   SalaryRevisionHistory[]
}
```

**Migration note:** Existing `gradeLevel` string field is kept temporarily for backward compatibility. A data migration script maps existing gradeLevel strings to new SalaryGrade records.

##### 8c.1g SalaryComponent Model Enhancement

Add relation to SalaryStructureLine:

```prisma
model SalaryComponent {
  // ... existing fields ...
  structureLines  SalaryStructureLine[]
}
```

##### 8c.1h API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/hr/salary-grades` | List all salary grades (with steps) |
| POST | `/api/v1/hr/salary-grades` | Create salary grade |
| GET | `/api/v1/hr/salary-grades/:id` | Get grade detail with steps |
| PUT | `/api/v1/hr/salary-grades/:id` | Update grade |
| DELETE | `/api/v1/hr/salary-grades/:id` | Deactivate grade |
| POST | `/api/v1/hr/salary-grades/:id/steps` | Add/update steps (bulk) |
| GET | `/api/v1/hr/salary-structures` | List salary structures |
| POST | `/api/v1/hr/salary-structures` | Create structure with lines |
| GET | `/api/v1/hr/salary-structures/:id` | Get structure with component lines |
| PUT | `/api/v1/hr/salary-structures/:id` | Update structure + lines |
| DELETE | `/api/v1/hr/salary-structures/:id` | Deactivate structure |
| GET | `/api/v1/hr/employees/:id/salary-history` | Get employee salary revision timeline |
| POST | `/api/v1/hr/employees/:id/salary-revision` | Create salary revision (grade/step change) |
| POST | `/api/v1/hr/salary-grades/bulk-increment` | Apply annual increment to all eligible employees |

##### 8c.1i UI Pages

| Path | Description |
|------|-------------|
| `/hr/salary-grades` | **Salary Grade Matrix** — spreadsheet-style view: grades as rows, steps as columns, each cell = basic salary. Color-coded ranges (below mid = green, near max = amber). CRUD actions. |
| `/hr/salary-structures` | **Salary Structure Templates** — list of templates with component breakdown. Create/edit wizard: name, grade link, add component lines with calculation type. |
| `/hr/employees/[id]` → Compensation Tab | **Enhanced:** Show current grade + step, structure breakdown (earnings/deductions table), gross/net calculation, revision history timeline. "Revise Salary" button opens modal. |

---

#### 8c.2 Dynamic PayrollEntryLine + Payslip PDF Generation

**Context:** Current `PayrollEntry` uses flat columns (houseRent, medicalAllowance, transportAllowance, etc.) which is inflexible — adding a new component requires schema change. International-standard ERPs use a line-item approach where each payroll entry has dynamic component lines. This also enables proper payslip generation with variable components.

##### 8c.2a New Model: `PayrollEntryLine`

```prisma
model PayrollEntryLine {
  id              String   @id @default(uuid()) @db.Uuid
  payrollEntryId  String   @db.Uuid
  componentId     String   @db.Uuid   // FK to SalaryComponent
  componentName   String   // Denormalized for payslip display
  componentCode   String   // Denormalized for payslip display
  lineType        String   // "EARNING", "DEDUCTION", "EMPLOYER_CONTRIBUTION"
  calculationType SalaryComponentCalculationType
  percentage      Decimal? @db.Decimal(5, 2)  // If percentage-based
  amount          Decimal  @db.Decimal(18, 2)  // Calculated amount
  ytdAmount       Decimal  @default(0) @db.Decimal(18, 2)  // Year-to-date
  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now())

  payrollEntry    PayrollEntry @relation(fields: [payrollEntryId], references: [id], onDelete: Cascade)
  component       SalaryComponent @relation(fields: [componentId], references: [id])

  @@index([payrollEntryId])
  @@index([componentId])
}
```

##### 8c.2b New Model: `PayslipTemplate`

```prisma
model PayslipTemplate {
  id                      String   @id @default(uuid()) @db.Uuid
  organizationId          String   @db.Uuid
  name                    String   // "Default", "Bangladesh Office", "Field Staff"
  headerText              String?  // Custom header (org name override)
  footerText              String?  // Custom footer
  logoPath                String?  // Path to organization logo
  showYTD                 Boolean  @default(true)
  showEmployerContributions Boolean @default(false)
  showAttendanceSummary   Boolean  @default(true)
  showNetPayInWords       Boolean  @default(true)
  paperSize               String   @default("A4")  // A4, LETTER
  isDefault               Boolean  @default(true)
  isActive                Boolean  @default(true)
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  organization            Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
}
```

##### 8c.2c New Model: `PayslipDistribution`

```prisma
model PayslipDistribution {
  id              String   @id @default(uuid()) @db.Uuid
  payrollEntryId  String   @db.Uuid
  method          String   // "PORTAL", "EMAIL", "DOWNLOAD"
  sentTo          String?  // Email address if method=EMAIL
  sentAt          DateTime?
  downloadedAt    DateTime?
  createdAt       DateTime @default(now())

  payrollEntry    PayrollEntry @relation(fields: [payrollEntryId], references: [id])

  @@index([payrollEntryId])
}
```

##### 8c.2d PayrollEntry Model Enhancement

```prisma
model PayrollEntry {
  // ... existing flat fields KEPT for backward compatibility during transition ...
  // New relations:
  lines           PayrollEntryLine[]
  distributions   PayslipDistribution[]
}
```

**Migration strategy:** Existing flat columns (houseRent, medicalAllowance, etc.) are kept. The payroll processing API is updated to ALSO create `PayrollEntryLine` records. New payslip generation reads from `lines`. Over time, flat columns become derived/redundant.

##### 8c.2e Payroll Processing Changes

The `/api/v1/hr/payroll/runs/[id]/process` endpoint is **rewritten** to:

1. For each active employee:
   a. Lookup `Employee.salaryGradeId` + `salaryStepNo` → get basic salary from `SalaryGradeStep`
   b. Lookup `Employee.salaryStructureId` → get `SalaryStructureLine[]` with components
   c. For each structure line, calculate amount:
      - FIXED → use `line.amount`
      - PERCENT_OF_BASIC → `basicSalary * (line.percentage / 100)`
      - PERCENT_OF_GROSS → calculated after all earnings
   d. Create `PayrollEntryLine` for each component (earnings + deductions)
   e. Also populate flat columns for backward compatibility
   f. Calculate YTD by summing previous `PayrollEntryLine` amounts for same component in fiscal year

2. Fallback: If employee has no grade/structure assigned, use legacy flat calculation (current behavior)

##### 8c.2f Payslip Generation

**Payslip content (international standard):**

| Section | Content |
|---------|---------|
| **Header** | Org name, logo, pay period, payment date, payslip reference |
| **Employee** | ID, name, department, designation, grade/step, bank (last 4 digits), TIN, PF no |
| **Earnings** | Each earning component as a line (from PayrollEntryLine WHERE lineType=EARNING) |
| **Deductions** | Each deduction component as a line (from PayrollEntryLine WHERE lineType=DEDUCTION) |
| **Summary** | Gross Pay, Total Deductions, **Net Pay** (prominent), Net pay in words |
| **YTD** | Cumulative earnings, deductions, tax for fiscal year |
| **Employer** | PF employer share, gratuity provision (from PayrollEntryLine WHERE lineType=EMPLOYER_CONTRIBUTION) |
| **Attendance** | Working days, present, absent, OT hours (from PayrollEntry) |

**PDF generation approach:** Server-side HTML→PDF using the existing `window.open()` print pattern (consistent with financial reports). A dedicated payslip HTML template is rendered server-side and opened in a print-optimized popup. For bulk download, generate individual HTML pages and bundle. No new npm dependency needed — uses existing `report-viewer` pattern with `@media print` CSS.

##### 8c.2g API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/hr/payroll/entries/:entryId/payslip` | Get payslip data (structured JSON for rendering) |
| GET | `/api/v1/hr/payroll/runs/:id/payslips` | Get all payslips for a run (bulk) |
| GET | `/api/v1/hr/payroll/runs/:id/payslips/download` | Bulk payslip download (HTML bundle) |
| GET | `/api/v1/hr/employees/:id/payslips` | Employee's payslip history (all months) |
| GET | `/api/v1/hr/payslip-templates` | List payslip templates |
| POST | `/api/v1/hr/payslip-templates` | Create template |
| PUT | `/api/v1/hr/payslip-templates/:id` | Update template |
| POST | `/api/v1/hr/payroll/entries/:entryId/payslip/distribute` | Mark payslip as distributed (email/portal) |

##### 8c.2h UI Pages

| Path | Description |
|------|-------------|
| `/hr/payroll` (enhanced) | **Rebuild from mock → API-connected.** Payroll register shows dynamic component columns from PayrollEntryLine. "View Payslip" button per employee. Bulk "Download All Payslips" button. |
| `/hr/payroll/payslip/[entryId]` | **Payslip Viewer** — print-optimized page. Professional layout matching international standard (earnings left, deductions right, net pay prominent). Download PDF button (window.print()). |
| `/hr/payslip-templates` | **Template Management** — configure payslip layout options (show/hide sections, logo, header/footer text). |

---

#### 8c.3 Team Leave Calendar

**Context:** Modern HR systems (BambooHR, Personio, Bob) display team absence as a horizontal Gantt-style timeline with color-coded leave bars, holiday overlays, and coverage indicators. This enables managers to make informed leave approval decisions.

##### 8c.3a New Model: `TeamCoverageRule`

```prisma
model TeamCoverageRule {
  id                    String   @id @default(uuid()) @db.Uuid
  organizationId        String   @db.Uuid
  departmentId          String?  @db.Uuid  // null = org-wide default
  minimumPresencePercent Decimal @db.Decimal(5, 2) @default(60)  // 60% minimum
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  organization          Organization @relation(fields: [organizationId], references: [id])
  department            Department?  @relation(fields: [departmentId], references: [id])

  @@unique([organizationId, departmentId])
  @@index([organizationId])
}
```

##### 8c.3b LeaveApplication Enhancement

```prisma
model LeaveApplication {
  // ... existing fields ...
  isHalfDay       Boolean  @default(false)
  halfDaySession  String?  // "MORNING" or "AFTERNOON"
}
```

##### 8c.3c API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/hr/leave/calendar` | Team leave calendar data: `?month=3&year=2026&departmentId=X` → returns employees with their leave bars + holidays + coverage per day |
| GET | `/api/v1/hr/leave/coverage` | Coverage check: `?departmentId=X&startDate=Y&endDate=Z` → returns daily team presence %, warns if below threshold |
| GET | `/api/v1/hr/leave/coverage-rules` | List coverage rules |
| POST | `/api/v1/hr/leave/coverage-rules` | Create/update coverage rule |

**Calendar API Response Structure:**

```typescript
{
  month: number,
  year: number,
  holidays: [{ date, name, type }],
  employees: [{
    id, fullName, department, designation, avatar,
    leaves: [{ id, startDate, endDate, leaveType, leaveTypeName, color, status, isHalfDay, halfDaySession }]
  }],
  coverage: [{  // One entry per calendar day
    date: string,
    totalEmployees: number,
    onLeave: number,
    present: number,
    presencePercent: number,
    status: "GOOD" | "WARNING" | "CRITICAL"  // based on coverage rule
  }]
}
```

##### 8c.3d UI Page

| Path | Description |
|------|-------------|
| `/hr/leave/calendar` | **Team Leave Calendar** — Gantt-style horizontal timeline |

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ Team Leave Calendar                              [◀ Mar 2026 ▶]    │
│ Department: [All ▾]  Leave Type: [All ▾]  [My Team] [All]         │
├──────────────┬──────────────────────────────────────────────────────┤
│ Coverage %   │ 92% | 85% | 85% | ... | 62% | 77% | ... | 88%     │
│              │  🟢    🟢    🟢   ...    🟡    🟢   ...    🟢      │
├──────────────┼──────────────────────────────────────────────────────┤
│              │  1  2  3  4  5  6  7  8  9 10 11 12 13 14 ...  31  │
│              │  Sa Su Mo Tu We Th Fr Sa Su Mo Tu We Th Fr ...  Tu  │
│              │  ██    ░░ ░░ ░░ ░░    ██       ░░ ░░ ░░        ░░  │
├──────────────┼──────────────────────────────────────────────────────┤
│ Ahmed Khan   │        ████████████                                 │
│ Sr. Manager  │        (Annual Leave - Approved)                    │
├──────────────┼──────────────────────────────────────────────────────┤
│ Fatima Ali   │                          ██████                     │
│ Coordinator  │                          (Sick Leave - Pending)     │
├──────────────┼──────────────────────────────────────────────────────┤
│ ...          │                                                     │
└──────────────┴──────────────────────────────────────────────────────┘
 Legend: ██ Weekend  ░░ Holiday  ████ Annual  ████ Sick  ████ Casual
```

**Features:**
- Horizontal scroll for dates, fixed employee column
- Color-coded bars by leave type (Annual=blue, Sick=red, Casual=green, etc.)
- Weekends and holidays as shaded columns
- Coverage heat map row at top (green >80%, amber 50-80%, red <50%)
- Hover on leave bar → tooltip with details
- Click empty cell → pre-fill leave application form
- Department and leave type filters
- "My Team" toggle for managers (shows direct reports only)
- Monthly navigation (prev/next arrows)

---

#### 8c.4 OKR Framework (Objectives & Key Results)

**Context:** International NGOs use Results-Based Management (RBM) aligned to strategic plans. OKR provides a structured framework for cascading organizational goals → department → team → individual. This EXTENDS the existing `PerformanceReview` model — OKR scores feed into performance reviews as one dimension alongside competency assessments and supervisor evaluation.

**Design Decision:** OKR extends (not replaces) PerformanceReview. The review pulls the employee's OKR achievement score as one input. This is the long-term scalable approach because:
1. Not all roles use OKRs (field staff may only have supervisor evaluation)
2. Performance dimensions vary (OKR + competency + behavior + peer feedback)
3. OKR cycles (quarterly) and review cycles (annual/mid-year) have different cadences

##### 8c.4a New Enums (base.prisma)

```prisma
enum OKRCycleStatus {
  PLANNING    // OKRs being drafted
  ACTIVE      // Cycle in progress, check-ins happening
  SCORING     // Cycle ended, scoring in progress
  CLOSED      // All scores finalized
}

enum OKROwnerType {
  ORGANIZATION
  DEPARTMENT
  TEAM
  INDIVIDUAL
}

enum OKRObjectiveStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}

enum KeyResultType {
  METRIC      // Quantitative: start value → target value
  MILESTONE   // Binary or stage-based
  PERCENTAGE  // 0% → 100%
}

enum OKRScoreType {
  SELF
  MANAGER
  PEER
}
```

##### 8c.4b New Model: `OKRCycle`

```prisma
model OKRCycle {
  id              String          @id @default(uuid()) @db.Uuid
  organizationId  String          @db.Uuid
  name            String          // "Q1 2026", "Annual 2026"
  cycleType       String          // "QUARTERLY", "ANNUAL"
  startDate       DateTime
  endDate         DateTime
  status          OKRCycleStatus  @default(PLANNING)
  checkInFrequency String         @default("BIWEEKLY") // "WEEKLY", "BIWEEKLY", "MONTHLY"
  createdById     String          @db.Uuid
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  organization    Organization    @relation(fields: [organizationId], references: [id])
  objectives      OKRObjective[]

  @@unique([organizationId, name])
  @@index([organizationId])
  @@index([status])
}
```

##### 8c.4c New Model: `OKRObjective`

```prisma
model OKRObjective {
  id                  String              @id @default(uuid()) @db.Uuid
  organizationId      String              @db.Uuid
  cycleId             String              @db.Uuid
  ownerType           OKROwnerType        // ORGANIZATION, DEPARTMENT, TEAM, INDIVIDUAL
  ownerId             String              @db.Uuid  // departmentId or employeeId depending on ownerType
  parentObjectiveId   String?             @db.Uuid  // Cascade: org → dept → team → individual
  title               String
  description         String?
  weight              Decimal             @default(1) @db.Decimal(3, 2)  // Weight within the cycle (0.00-1.00)
  progress            Decimal             @default(0) @db.Decimal(5, 2)  // 0-100 auto-calculated from KRs
  score               Decimal?            @db.Decimal(3, 2)  // 0.00-1.00 (Google-style: 0.7 = on track)
  status              OKRObjectiveStatus  @default(DRAFT)
  createdById         String              @db.Uuid
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  cycle               OKRCycle            @relation(fields: [cycleId], references: [id])
  parentObjective     OKRObjective?       @relation("ObjectiveCascade", fields: [parentObjectiveId], references: [id])
  childObjectives     OKRObjective[]      @relation("ObjectiveCascade")
  keyResults          OKRKeyResult[]
  scores              OKRScore[]

  @@index([organizationId])
  @@index([cycleId])
  @@index([ownerType, ownerId])
  @@index([parentObjectiveId])
}
```

##### 8c.4d New Model: `OKRKeyResult`

```prisma
model OKRKeyResult {
  id              String          @id @default(uuid()) @db.Uuid
  objectiveId     String          @db.Uuid
  title           String
  description     String?
  resultType      KeyResultType   // METRIC, MILESTONE, PERCENTAGE
  startValue      Decimal         @default(0) @db.Decimal(18, 2)
  targetValue     Decimal         @db.Decimal(18, 2)
  currentValue    Decimal         @default(0) @db.Decimal(18, 2)
  unit            String?         // "beneficiaries", "reports", "%", "BDT"
  progress        Decimal         @default(0) @db.Decimal(5, 2)  // 0-100
  score           Decimal?        @db.Decimal(3, 2)  // 0.00-1.00
  dueDate         DateTime?
  status          OKRObjectiveStatus @default(DRAFT)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  objective       OKRObjective    @relation(fields: [objectiveId], references: [id], onDelete: Cascade)
  checkIns        OKRCheckIn[]

  @@index([objectiveId])
}
```

##### 8c.4e New Model: `OKRCheckIn`

```prisma
model OKRCheckIn {
  id              String   @id @default(uuid()) @db.Uuid
  keyResultId     String   @db.Uuid
  checkInDate     DateTime @default(now())
  previousValue   Decimal  @db.Decimal(18, 2)
  newValue        Decimal  @db.Decimal(18, 2)
  progress        Decimal  @db.Decimal(5, 2)  // 0-100 at time of check-in
  note            String?
  blockers        String?  // Any impediments
  createdById     String   @db.Uuid
  createdAt       DateTime @default(now())

  keyResult       OKRKeyResult @relation(fields: [keyResultId], references: [id], onDelete: Cascade)

  @@index([keyResultId])
  @@index([checkInDate])
}
```

##### 8c.4f New Model: `OKRScore`

```prisma
model OKRScore {
  id            String       @id @default(uuid()) @db.Uuid
  objectiveId   String       @db.Uuid
  scorerId      String       @db.Uuid
  scoreType     OKRScoreType // SELF, MANAGER, PEER
  score         Decimal      @db.Decimal(3, 2)  // 0.00-1.00
  comments      String?
  scoredAt      DateTime     @default(now())

  objective     OKRObjective @relation(fields: [objectiveId], references: [id], onDelete: Cascade)

  @@unique([objectiveId, scorerId, scoreType])
  @@index([objectiveId])
}
```

##### 8c.4g PerformanceReview Enhancement

```prisma
model PerformanceReview {
  // ... existing fields ...
  okrCycleId       String?  @db.Uuid   // Link to OKR cycle
  okrScore         Decimal? @db.Decimal(3, 2)  // Auto-pulled from employee's OKR achievement (0.00-1.00)
  competencyScore  Decimal? @db.Decimal(3, 2)  // Separate competency assessment
  okrWeight        Decimal  @default(0.4) @db.Decimal(3, 2)  // 40% OKR weight in final score
  competencyWeight Decimal  @default(0.3) @db.Decimal(3, 2)  // 30% competency weight
  supervisorWeight Decimal  @default(0.3) @db.Decimal(3, 2)  // 30% supervisor weight

  // finalScore recalculated: (okrScore * okrWeight) + (competencyScore * competencyWeight) + (supervisorScore * supervisorWeight)
}
```

##### 8c.4h API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/hr/okr/cycles` | List OKR cycles |
| POST | `/api/v1/hr/okr/cycles` | Create cycle |
| GET | `/api/v1/hr/okr/cycles/:id` | Get cycle with objectives tree |
| PUT | `/api/v1/hr/okr/cycles/:id` | Update cycle (status transitions) |
| GET | `/api/v1/hr/okr/objectives` | List objectives (filter by cycle, owner, status) |
| POST | `/api/v1/hr/okr/objectives` | Create objective with key results |
| GET | `/api/v1/hr/okr/objectives/:id` | Get objective with KRs, check-ins, scores |
| PUT | `/api/v1/hr/okr/objectives/:id` | Update objective |
| DELETE | `/api/v1/hr/okr/objectives/:id` | Cancel objective |
| POST | `/api/v1/hr/okr/key-results/:krId/check-in` | Submit check-in (update progress) |
| PUT | `/api/v1/hr/okr/key-results/:krId` | Update key result |
| POST | `/api/v1/hr/okr/objectives/:id/score` | Submit score (self/manager/peer) |
| GET | `/api/v1/hr/okr/my-okrs` | Current user's objectives across active cycles |
| GET | `/api/v1/hr/okr/team-okrs` | Manager's team objectives |
| GET | `/api/v1/hr/okr/alignment-tree` | Full cascade tree: org → dept → team → individual |
| GET | `/api/v1/hr/okr/analytics` | OKR health metrics: % on track, completion rates, adoption |

##### 8c.4i UI Pages

| Path | Description |
|------|-------------|
| `/hr/okr` | **OKR Dashboard** — current cycle summary, My OKRs cards with progress bars, team OKRs overview, quick check-in action |
| `/hr/okr/cycles` | **Cycle Management** — list of cycles with status. Create new cycle. Transition status (Planning → Active → Scoring → Closed) |
| `/hr/okr/alignment` | **Alignment Tree View** — expandable tree: org objectives → department → team → individual. Each node: title, progress %, status color. Click to expand key results. |
| `/hr/okr/objectives/new` | **Create Objective** — form: title, description, parent alignment (optional), weight. Add key results inline (title, type, target value, unit, due date). |
| `/hr/okr/objectives/[id]` | **Objective Detail** — KR progress cards, check-in timeline, score inputs (self/manager/peer), comments. "Check In" button opens quick-update form. |

**OKR Dashboard Layout:**

```
┌───────────────────────────────────────────────────────────────┐
│ Objectives & Key Results          Cycle: [Q1 2026 ▾] (ACTIVE)│
├───────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│ │ Total   │ │On Track │ │At Risk  │ │Behind   │             │
│ │   12    │ │   8     │ │   3     │ │   1     │             │
│ │objectives│ │  67%   │ │  25%    │ │   8%    │             │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
├───────────────────────────────────────────────────────────────┤
│ My Objectives                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ○ Increase beneficiary reach in Cox's Bazar    72% ████░│   │
│ │   KR1: Enroll 500 new beneficiaries           80% ████░ │   │
│ │   KR2: Complete 12 field assessments          58% ███░░ │   │
│ │   KR3: Submit quarterly report to USAID       100% █████│   │
│ │   [Check In]  Last check-in: 3 days ago                 │   │
│ └─────────────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ○ Improve team capacity building               45% ██░░░│   │
│ │   KR1: 3 training workshops completed          33% ██░░░│   │
│ │   KR2: All team members certified in PSEA     60% ███░░ │   │
│ │   [Check In]  Last check-in: 7 days ago ⚠️              │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

#### 8c.5 HR/Payroll → Budget Personnel Cost Tracking

**Context:** Personnel costs = 60-80% of NGO budgets. USAID (2 CFR 200), EU, and DFID require detailed cost allocation by grant/project. This implements Phase 10.2 as defined in the implementation plan, connecting payroll to budget through employee project allocations.

**Note:** This section implements the design already specified in Phase 10.2 (lines 7258-7352). Refer to Phase 10.2 for the `PayrollBudgetAllocation` model, API endpoints, and UI changes. Key additions beyond 10.2:

##### 8c.5a PayrollBudgetAllocation Model

(As defined in Phase 10.2 — `PayrollBudgetAllocation` with payrollRunId, payrollEntryId, employeeId, projectId, budgetId, budgetLineId, allocationPct, grossAmount, netAmount, fringeAmount, totalCharge, period)

##### 8c.5b Integration with Salary Grade System

Enhancement over Phase 10.2 spec — now that we have dynamic PayrollEntryLine:

```
Payroll Approval Flow (enhanced):
1. PayrollRun PROCESSED → entries have PayrollEntryLines from salary structure
2. For each PayrollEntry:
   a. Get EmployeeProjectAllocation records (active, date-overlapping)
   b. For each allocation:
      - Split EACH PayrollEntryLine amount by allocation percentage
      - Track earnings, deductions, employer contributions separately
      - grossCharge = sum(earning lines) * allocation%
      - fringeCharge = sum(employer contribution lines) * allocation%
      - totalCharge = grossCharge + fringeCharge
   c. Match to BudgetLine: category="Personnel" AND budget.projectId = allocation.projectId
   d. Budget availability check per project
3. Show detailed budget impact (per component, per project) on approval screen
4. On approval: create PayrollBudgetAllocation records with component-level breakdown
```

##### 8c.5c API Endpoints

(As defined in Phase 10.2 — 8 endpoints for project allocation CRUD, budget impact preview, personnel cost summary, plus the new `/hr/project-allocations` matrix page)

##### 8c.5d UI Changes

(As defined in Phase 10.2 — employee detail Project Allocations tab, payroll approval Budget Impact panel, budget-vs-actual personnel drill-down, project detail Personnel Costs tab, plus new `/hr/project-allocations` matrix page)

---

#### 8c.6 Dashboard KPI — Employee Join/Leave/Turnover Metrics

**Context:** HR dashboards in international NGO ERPs show headcount trends, turnover rates, and workforce composition. Current dashboard only shows `staffCount` — no join/leave counts, no trends, no turnover analysis.

##### 8c.6a New Dashboard API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/dashboard/hr-kpis` | HR-specific KPI data (lazy-loaded on dashboard) |
| GET | `/api/v1/dashboard/hr-headcount-trend` | Monthly headcount for last 12 months (line chart data) |
| GET | `/api/v1/hr/analytics/turnover` | Detailed turnover analysis (for HR analytics page) |

##### 8c.6b HR KPI Response Structure

```typescript
// GET /api/v1/dashboard/hr-kpis
{
  totalHeadcount: number,
  headcountDelta: number,         // vs last month (+5, -2)
  newJoinersThisMonth: number,
  separationsThisMonth: number,
  turnoverRate: number,           // Trailing 12 months: (separations / avg headcount) × 100
  openPositions: number,          // PUBLISHED job postings vacancy count
  expiringContracts: number,      // Contracts ending in next 30 days
  genderRatio: { male: number, female: number, other: number },
  departmentBreakdown: [{ department: string, count: number, joiners: number, leavers: number }],
  employmentTypeBreakdown: [{ type: string, count: number }],
  turnoverByDepartment: [{ department: string, rate: number }],
  separationReasons: [{ reason: string, count: number }]  // From Offboarding.separationType
}

// GET /api/v1/dashboard/hr-headcount-trend
{
  months: [{
    month: "2026-03",
    activeCount: number,
    joinedCount: number,
    leftCount: number,
    netChange: number
  }]  // Last 12 months
}
```

##### 8c.6c Dashboard UI Updates

**New KPI Cards Row (below existing financial KPIs):**

```
┌──────────────────────────────────────────────────────────────────┐
│ HR Workforce Overview                                            │
├─────────┬─────────┬─────────┬─────────┬─────────┬──────────────┤
│ Total   │ New     │ Separa- │ Turnover│ Open    │ Expiring     │
│ Staff   │ Joiners │ tions   │ Rate    │ Positions│ Contracts   │
│   47    │    3    │    1    │  8.5%   │    5    │     2        │
│  ↑5     │this mo. │this mo. │  12mo   │ hiring  │  next 30d    │
└─────────┴─────────┴─────────┴─────────┴─────────┴──────────────┘
```

**New Chart — Headcount Trend:**

```
Headcount Trend (12 Months)
60 ┤
50 ┤                               ████
45 ┤                     ████ ████ ████ ████
40 ┤          ████ ████ ████ ████ ████ ████ ████
35 ┤████ ████ ████ ████ ████
30 ┤────┴────┴────┴────┴────┴────┴────┴────┴──→
     Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  ...
     ── Headcount   ▓▓ Joiners   ░░ Leavers
```

- Recharts ComposedChart: Line for headcount, Bars for joiners (green) and leavers (red)
- Click any month bar → drill-down list of actual employees

**New Chart — Turnover by Department (on HR Analytics page):**
- Horizontal BarChart: departments on Y-axis, turnover rate on X-axis
- Color-coded: green (<10%), amber (10-20%), red (>20%)

---

#### 8c.7 Navigation Updates

**New sidebar items under HR & Payroll:**

```
HR & Payroll
├── Employee Directory     (existing)
├── Recruitment            (existing)
├── Onboarding             (existing)
├── Contracts              (existing)
├── Attendance             (existing)
├── Leave Management       (existing)
│   └── Team Calendar      ★ NEW (8c.3)
├── Holiday Calendar       (existing)
├── Payroll                (existing)
│   └── Payslip Templates  ★ NEW (8c.2)
├── Salary Grades          ★ NEW (8c.1)
├── Salary Structures      ★ NEW (8c.1)
├── Pension Management     (existing)
├── Performance            (existing)
├── OKR                    ★ NEW (8c.4)
├── Training               (existing)
├── Project Allocations    ★ NEW (8c.5)
├── Offboarding            (existing)
├── Grievances             (existing)
├── Disciplinary           (existing)
├── Org Chart              (existing)
├── HR Analytics           (existing)
```

---

#### 8c.8 i18n Keys

**New message keys to add across `src/messages/{en,bn}/hr.json`:**

```json
{
  "salaryGrades": {
    "title": "Salary Grades",
    "code": "Grade Code",
    "name": "Grade Name",
    "level": "Level",
    "minSalary": "Minimum",
    "midSalary": "Midpoint",
    "maxSalary": "Maximum",
    "steps": "Steps",
    "stepNumber": "Step",
    "basicSalary": "Basic Salary",
    "addStep": "Add Step",
    "gradeMatrix": "Grade Matrix",
    "effectiveFrom": "Effective From",
    "noGrades": "No salary grades configured"
  },
  "salaryStructures": {
    "title": "Salary Structures",
    "name": "Structure Name",
    "description": "Description",
    "linkedGrade": "Linked Grade",
    "components": "Components",
    "calculationType": "Calculation Type",
    "fixed": "Fixed Amount",
    "percentOfBasic": "% of Basic",
    "percentOfGross": "% of Gross",
    "addComponent": "Add Component",
    "isDefault": "Default Structure",
    "noStructures": "No salary structures configured"
  },
  "salaryRevision": {
    "title": "Salary Revision",
    "currentGrade": "Current Grade",
    "newGrade": "New Grade",
    "currentStep": "Current Step",
    "newStep": "New Step",
    "revisionType": "Revision Type",
    "effectiveDate": "Effective Date",
    "reason": "Reason",
    "history": "Salary History",
    "bulkIncrement": "Bulk Annual Increment",
    "noHistory": "No salary revision history"
  },
  "payslip": {
    "title": "Payslip",
    "payslips": "Payslips",
    "viewPayslip": "View Payslip",
    "downloadPayslip": "Download Payslip",
    "downloadAll": "Download All Payslips",
    "payPeriod": "Pay Period",
    "paymentDate": "Payment Date",
    "earnings": "Earnings",
    "deductions": "Deductions",
    "grossPay": "Gross Pay",
    "totalDeductions": "Total Deductions",
    "netPay": "Net Pay",
    "netPayInWords": "Net Pay (in words)",
    "ytd": "Year-to-Date",
    "employerContributions": "Employer Contributions",
    "attendanceSummary": "Attendance Summary",
    "workingDays": "Working Days",
    "presentDays": "Days Present",
    "absentDays": "Days Absent",
    "templates": "Payslip Templates",
    "templateName": "Template Name",
    "noPayslips": "No payslips available"
  },
  "leaveCalendar": {
    "title": "Team Leave Calendar",
    "coverage": "Team Coverage",
    "coverageGood": "Good Coverage",
    "coverageWarning": "Low Coverage",
    "coverageCritical": "Critical Coverage",
    "myTeam": "My Team",
    "allTeams": "All Teams",
    "halfDay": "Half Day",
    "morning": "Morning",
    "afternoon": "Afternoon",
    "coverageRules": "Coverage Rules",
    "minimumPresence": "Minimum Presence %",
    "legend": "Legend"
  },
  "okr": {
    "title": "Objectives & Key Results",
    "cycles": "OKR Cycles",
    "cycleName": "Cycle Name",
    "cycleType": "Cycle Type",
    "quarterly": "Quarterly",
    "annual": "Annual",
    "planning": "Planning",
    "active": "Active",
    "scoring": "Scoring",
    "closed": "Closed",
    "objectives": "Objectives",
    "objectiveTitle": "Objective Title",
    "keyResults": "Key Results",
    "keyResultTitle": "Key Result Title",
    "resultType": "Result Type",
    "metric": "Metric",
    "milestone": "Milestone",
    "percentage": "Percentage",
    "startValue": "Start Value",
    "targetValue": "Target Value",
    "currentValue": "Current Value",
    "progress": "Progress",
    "score": "Score",
    "weight": "Weight",
    "checkIn": "Check In",
    "checkInHistory": "Check-in History",
    "lastCheckIn": "Last Check-in",
    "alignment": "Alignment",
    "alignmentTree": "Alignment Tree",
    "parentObjective": "Parent Objective",
    "ownerType": "Owner Type",
    "organization": "Organization",
    "department": "Department",
    "team": "Team",
    "individual": "Individual",
    "onTrack": "On Track",
    "atRisk": "At Risk",
    "behind": "Behind",
    "myOKRs": "My OKRs",
    "teamOKRs": "Team OKRs",
    "noObjectives": "No objectives found",
    "noCycles": "No OKR cycles created",
    "scoreObjective": "Score Objective",
    "selfScore": "Self Score",
    "managerScore": "Manager Score",
    "peerScore": "Peer Score",
    "analytics": "OKR Analytics",
    "completionRate": "Completion Rate",
    "adoptionRate": "Adoption Rate"
  },
  "projectAllocations": {
    "title": "Project Allocations",
    "matrix": "Allocation Matrix",
    "allocationPercent": "Allocation %",
    "totalAllocation": "Total Allocation",
    "allocationExceeds": "Total allocation cannot exceed 100%",
    "addAllocation": "Add Project Allocation",
    "noAllocations": "No project allocations configured",
    "budgetImpact": "Budget Impact",
    "budgetImpactPreview": "Payroll Budget Impact Preview",
    "personnelCharge": "Personnel Charge",
    "grossCharge": "Gross Charge to Project",
    "fringeCharge": "Fringe Charge",
    "unallocated": "Unallocated"
  },
  "dashboardKpi": {
    "hrOverview": "HR Workforce Overview",
    "totalHeadcount": "Total Headcount",
    "newJoiners": "New Joiners",
    "separations": "Separations",
    "turnoverRate": "Turnover Rate",
    "openPositions": "Open Positions",
    "expiringContracts": "Expiring Contracts",
    "headcountTrend": "Headcount Trend",
    "turnoverByDept": "Turnover by Department",
    "separationReasons": "Separation Reasons",
    "thisMonth": "This Month",
    "trailing12mo": "Trailing 12 Months",
    "next30days": "Next 30 Days"
  }
}
```

---

#### 8c.9 Seed Data Plan

| Feature | Seed Records | Details |
|---------|-------------|---------|
| Salary Grades | 6 grades × 5 steps = 30 | G-1 to G-6 with progressive salaries |
| Salary Structures | 2 structures × 6 lines = 12 | "Standard Bangladesh" + "Field Staff" with HRA, Medical, Transport, PF, TDS |
| Employee Grade Assignments | 6 employees updated | Assign grades/steps/structures to existing employees |
| Salary Revisions | 6 records | Initial assignments + 2 step increments + 1 promotion |
| PayrollEntryLines | ~12 per employee × 6 = 72 | For processed payroll run (6 components per entry) |
| Payslip Template | 1 default | "Default NGO Payslip" |
| Leave Calendar Data | 10 leave applications | Spread across departments for calendar view |
| Half-Day Leaves | 3 records | Test half-day support |
| Coverage Rules | 2 records | Org-wide 60% + Finance dept 80% |
| OKR Cycle | 1 quarterly cycle | "Q1 2026" (ACTIVE status) |
| OKR Objectives | 8 records | 2 org + 3 dept + 3 individual (cascade) |
| Key Results | 16 records | 2 per objective (mix of METRIC, MILESTONE, PERCENTAGE) |
| Check-Ins | 12 records | 3-4 check-ins per active KR |
| OKR Scores | 6 records | Self + manager scores for completed objectives |
| PerformanceReview Updates | 3 records | Link existing reviews to OKR cycle with okrScore |
| Project Allocations | 8 records | 6 employees split across 3 projects |
| PayrollBudgetAllocation | 18 records | 6 employees × 3 projects for current month |

**Seed file:** `prisma/seed-phase8c.ts`

---

#### 8c.10 Implementation Order & Dependencies

| Step | Task | Dependencies | Estimated Effort |
|------|------|-------------|-----------------|
| **8c.1a** | Schema: new enums + SalaryGrade + SalaryGradeStep + SalaryStructure + SalaryStructureLine + SalaryRevisionHistory | None | 1 day |
| **8c.1b** | Schema: Employee model changes (gradeId FK, structureId FK) | 8c.1a | 0.5 day |
| **8c.1c** | Schema: PayrollEntryLine + PayslipTemplate + PayslipDistribution | 8c.1a | 0.5 day |
| **8c.1d** | Schema: TeamCoverageRule + LeaveApplication half-day fields | None | 0.5 day |
| **8c.1e** | Schema: OKR models (5 tables) + PerformanceReview enhancement | None | 1 day |
| **8c.1f** | Schema: PayrollBudgetAllocation | None | 0.5 day |
| **8c.2a** | Prisma migration (all schema changes) | 8c.1a–8c.1f | 0.5 day |
| **8c.2b** | Salary Grade CRUD APIs (6 endpoints) | 8c.2a | 1 day |
| **8c.2c** | Salary Structure CRUD APIs (5 endpoints) | 8c.2a | 1 day |
| **8c.2d** | Salary Revision API + Employee salary history | 8c.2b, 8c.2c | 1 day |
| **8c.2e** | Payroll processing rewrite (dynamic lines) | 8c.2a | 1.5 days |
| **8c.2f** | Payslip APIs (4 endpoints) | 8c.2e | 1 day |
| **8c.2g** | Leave Calendar API + Coverage API | 8c.2a | 1 day |
| **8c.2h** | OKR CRUD APIs (12 endpoints) | 8c.2a | 2 days |
| **8c.2i** | OKR Check-in + Scoring APIs (4 endpoints) | 8c.2h | 1 day |
| **8c.2j** | Project Allocation + Budget Impact APIs (8 endpoints) | 8c.2a | 1.5 days |
| **8c.2k** | Dashboard HR KPI APIs (3 endpoints) | 8c.2a | 1 day |
| **8c.3a** | UI: Salary Grade Matrix page | 8c.2b | 1 day |
| **8c.3b** | UI: Salary Structure page | 8c.2c | 1 day |
| **8c.3c** | UI: Employee Compensation tab enhancement | 8c.2d | 1 day |
| **8c.3d** | UI: Payroll page rebuild (mock → API, dynamic columns) | 8c.2e | 1.5 days |
| **8c.3e** | UI: Payslip viewer page | 8c.2f | 1 day |
| **8c.3f** | UI: Team Leave Calendar page | 8c.2g | 1.5 days |
| **8c.3g** | UI: OKR Dashboard + Cycles page | 8c.2h | 1.5 days |
| **8c.3h** | UI: OKR Alignment Tree + Objective Detail page | 8c.2i | 1.5 days |
| **8c.3i** | UI: Project Allocations matrix page | 8c.2j | 1 day |
| **8c.3j** | UI: Dashboard HR KPI cards + charts | 8c.2k | 1 day |
| **8c.4a** | Seed data (all features) | All APIs | 1 day |
| **8c.4b** | i18n messages (EN + BN) | All UI | 0.5 day |
| **8c.4c** | Navigation sidebar updates | All UI pages | 0.5 day |
| **8c.4d** | End-to-end testing | All | 1 day |

**Total estimated effort: ~28 days**

---

#### 8c.11 Summary — Phase 8c Totals

| Metric | Count |
|--------|-------|
| New Prisma models | 14 |
| Enhanced Prisma models | 4 (Employee, PayrollEntry, SalaryComponent, PerformanceReview) |
| New enums | 8 |
| New API endpoints | 52 |
| New UI pages | 12 |
| Enhanced UI pages | 4 (payroll, employee detail, dashboard, HR analytics) |
| New sidebar items | 6 |
| i18n keys (estimated) | ~300 (EN + BN) |
| Seed records | ~240 |

**Files affected:**
- `prisma/schema/hr.prisma` — 14 new models + 4 model enhancements
- `prisma/schema/base.prisma` — 8 new enums
- `prisma/schema/budget.prisma` — PayrollBudgetAllocation model
- `src/app/api/v1/hr/salary-grades/` — 6 new API routes
- `src/app/api/v1/hr/salary-structures/` — 5 new API routes
- `src/app/api/v1/hr/payroll/` — 4 new + 2 modified API routes
- `src/app/api/v1/hr/leave/calendar/` — 3 new API routes
- `src/app/api/v1/hr/okr/` — 16 new API routes
- `src/app/api/v1/hr/employees/[employeeId]/project-allocations/` — 4 new API routes
- `src/app/api/v1/dashboard/` — 3 new API routes
- `src/app/(dashboard)/hr/salary-grades/page.tsx` — New page
- `src/app/(dashboard)/hr/salary-structures/page.tsx` — New page
- `src/app/(dashboard)/hr/payroll/page.tsx` — Rebuild
- `src/app/(dashboard)/hr/payroll/payslip/[entryId]/page.tsx` — New page
- `src/app/(dashboard)/hr/payslip-templates/page.tsx` — New page
- `src/app/(dashboard)/hr/leave/calendar/page.tsx` — New page
- `src/app/(dashboard)/hr/okr/page.tsx` — New page
- `src/app/(dashboard)/hr/okr/cycles/page.tsx` — New page
- `src/app/(dashboard)/hr/okr/alignment/page.tsx` — New page
- `src/app/(dashboard)/hr/okr/objectives/new/page.tsx` — New page
- `src/app/(dashboard)/hr/okr/objectives/[id]/page.tsx` — New page
- `src/app/(dashboard)/hr/project-allocations/page.tsx` — New page
- `src/app/(dashboard)/hr/employees/[id]/page.tsx` — Enhanced (compensation tab, project allocations tab)
- `src/app/(dashboard)/dashboard/page.tsx` — Enhanced (HR KPI row + chart)
- `src/app/(dashboard)/hr/analytics/page.tsx` — Enhanced (turnover chart)
- `src/data/navigation.ts` — 6 new items
- `src/messages/en/hr.json` + `src/messages/bn/hr.json` — ~300 new keys
- `prisma/seed-phase8c.ts` — New seed file

---

### Phase 8c-fix: HR Cross-Module Wiring & Bug Fixes ⬜ TODO

> **Priority: Fix broken connections between Salary Grades ↔ Salary Structures ↔ Employee Compensation ↔ Payroll. Ensure all HR data flows dynamically end-to-end.**
> **Root cause: Phase 8c implemented models + APIs + UI independently but did not wire them together. Flat employee salary fields duplicate what salary structures already define.**

---

#### 8c-fix.1 Salary Grades Page 500 Error

**Problem:** `GET /api/v1/hr/salary-grades` returns only `_count: { steps: N }` but the page expects `steps: SalaryGradeStep[]` array. Also returns `isActive` (boolean) but page expects `status` (string).

**Fix (API):**
- Change `select` → `include` to return full `steps` array
- Map `isActive` → `status: 'ACTIVE' | 'INACTIVE'` in response

**File:** `src/app/api/v1/hr/salary-grades/route.ts`

---

#### 8c-fix.2 Compensation Tab — Static → Dynamic

**Problem:** Employee detail page Compensation & Benefits tab shows hardcoded flat fields (`Employee.basicSalary`, `houseRentAllowance`, `medicalAllowance`, `transportAllowance`). These are duplicates of what `SalaryGradeStep` + `SalaryStructureLine` already define. Changes to salary structures don't reflect on the employee.

**Current (static):**
```
Employee.basicSalary        → "BDT 22,000"
Employee.houseRentAllowance → "BDT 20,000" (where does 20,000 come from?)
Employee.grossSalary        → "BDT 78,500"
```

**Expected (dynamic):**
```
SalaryGradeStep.basicSalary (via Employee.salaryGradeId + salaryStepNo) → Basic: 55,000
SalaryStructureLine[HRA] = 40% of Basic → HRA: 22,000
SalaryStructureLine[MEDICAL] = 15% of Basic → Medical: 8,250
SalaryStructureLine[TRANSPORT] = Fixed 5,000 → Transport: 5,000
Gross = Basic + Earnings = 90,250
Deductions (PF 10%, TDS 5%) from structure lines
Net = Gross - Deductions
```

**Fix (UI):**
- If `employee.salaryGradeId` && `employee.salaryStructureId` exist:
  - Fetch grade step → get `basicSalary`
  - Fetch structure lines → compute each component (PERCENT_OF_BASIC, FIXED, PERCENT_OF_GROSS)
  - Show dynamic breakdown with component names from `SalaryComponent`
  - Show "Salary Grade: G-5, Step: 3" header with link to `/hr/salary-grades`
- Fallback: if no grade/structure assigned, show legacy flat fields (backward compatible)

**Cross-module impact:**
- Employee detail page → reads from SalaryGrade + SalaryStructure
- Payroll process → already reads from structures (Phase 8c implemented this)
- Salary revision API → already creates revision history

**Files:**
- `src/app/(dashboard)/hr/employees/[id]/page.tsx` — Compensation tab section
- `src/app/api/v1/hr/employees/[id]/route.ts` — Include salaryGrade + salaryStructure in GET

---

#### 8c-fix.3 Employment Information View/Edit Parity

**Problem:** View mode shows 10 fields but Edit mode shows 15 fields in different order. Key mismatches:
- `Employee No` — in View, missing from Edit (should show as disabled)
- `Joining Date` — in View, missing from Edit (should be editable)
- `Reporting To` — missing from both View and Edit
- Fields in Edit but hidden in View when null: Confirmation Date, Probation End Date, End Date, Cost Center, Shift Schedule, Expatriate

**Fix:**
- View mode: Show all fields (use "—" for empty instead of hiding)
- Edit mode: Add Employee No (disabled), Joining Date, Reporting To dropdown
- Both modes: Same field order
- Reporting To: Fetch employees list for dropdown

**File:** `src/app/(dashboard)/hr/employees/[id]/page.tsx` — Employment tab

---

#### 8c-fix.4 i18n Key Mismatches

**Problem:** 3 pages use `tc('actions.cancel')` / `tc('actions.save')` but `common.json` has these under `buttons`, not `actions`.

**Affected files:**
| File | Wrong Key | Correct Key |
|------|-----------|-------------|
| `src/app/(dashboard)/hr/salary-structures/page.tsx` | `tc('actions.cancel')`, `tc('actions.save')` | `tc('buttons.cancel')`, `tc('buttons.save')` |
| `src/app/(dashboard)/hr/payslip-templates/page.tsx` | `tc('actions.create')`, `tc('actions.cancel')`, `tc('actions.save')` | `tc('buttons.create')`, `tc('buttons.cancel')`, `tc('buttons.save')` |
| `src/app/(dashboard)/hr/project-allocations/page.tsx` | `tc('actions.cancel')`, `tc('actions.save')` | `tc('buttons.cancel')`, `tc('buttons.save')` |

**Fix:** Replace `actions.X` → `buttons.X` in all 3 files.

---

#### 8c-fix.5 Leave & Attendance Tab — API Route Mismatch ✅ DONE

**Problem:** Frontend called `/api/v1/hr/leave/balances?employeeId=X` and `/api/v1/hr/leave/applications?employeeId=X` but routes didn't exist.

**Fix:** Created:
- `src/app/api/v1/hr/leave/balances/route.ts` — returns flat array with `leaveType` as string name
- `src/app/api/v1/hr/leave/applications/route.ts` — returns flat array with `leaveType` as string name
- `prisma/seed-leave-balances.ts` — 21 leave balances + 13 leave applications

---

#### 8c-fix.6 Projects Tab — Missing Include ✅ DONE

**Problem:** Employee GET API didn't include `projectAllocations` relation.

**Fix:** Added `projectAllocations: { include: { project: { select: { id, name, projectNo } } } }` to employee GET.

---

#### 8c-fix.7 Employee Profile Document Upload ✅ DONE

**Problem:** Education, Work History, Certifications, and Compliance tabs had no document upload capability.

**Fix:**
- Added `filePath` to `EmployeeEducation` and `EmployeeWorkHistory` models
- Added 5 compliance document fields to `Employee` model
- Added Document column with upload/view/remove to Education, Work, Cert tables
- Added compliance document upload buttons
- Performance tab: replaced empty placeholder with actual reviews table

---

#### 8c-fix.8 PUT/PATCH Method Mismatch ✅ DONE

**Problem:** Frontend sends `PUT` but APIs only export `PATCH`, causing silent 405 errors on edit.

**Fix:** Added `export { PATCH as PUT }` to 6 sub-resource route files.

---

#### 8c-fix Implementation Order

| Step | Task | Status |
|------|------|--------|
| 8c-fix.1 | Salary Grades API — steps include + status mapping | ✅ DONE |
| 8c-fix.2 | Compensation tab — dynamic salary structure display | ✅ DONE |
| 8c-fix.3 | Employment Info — view/edit field parity | ✅ DONE |
| 8c-fix.4 | i18n key fixes (3 pages) | ✅ DONE |
| 8c-fix.5 | Leave tab — API route + seed data | ✅ DONE |
| 8c-fix.6 | Projects tab — missing include | ✅ DONE |
| 8c-fix.7 | Document upload — education/work/cert/compliance | ✅ DONE |
| 8c-fix.8 | PUT/PATCH method mismatch (6 routes) | ✅ DONE |
| 8c-fix.9 | Employee list page — avatar column + 4 filters | ✅ DONE |
| 8c-fix.10 | Employee profile photo upload (avatar hover) | ✅ DONE |
| 8c-fix.11 | PF Nominee — photo + document upload (3 new schema fields) | ✅ DONE |
| 8c-fix.12 | Scrollable tab bar — wheel scroll fix (passive listener) | ✅ DONE |
| 8c-fix.13 | PF pages — bulk URL fix (22 files: /provident-fund/ → /pf/) | ✅ DONE |
| 8c-fix.14 | PF Member Detail — enriched API (policy, balanceBreakdown, contributions) | ✅ DONE |

---

#### 8c-fix.9 Employee List Page — Avatar + Filters

**Enhancement to `/hr` employee directory page:**

**New avatar column:** First column shows employee photo (if uploaded) or initials circle. API updated to return `photo` and `dutyStation` fields.

**4 new filter dropdowns:**
| Filter | Source | Type |
|--------|--------|------|
| Department | `/api/v1/hr/departments` | Dynamic dropdown |
| Status | ACTIVE, INACTIVE, ON_LEAVE, SUSPENDED | Static dropdown |
| Employment Type | FULL_TIME, PART_TIME, CONTRACT, etc. | Static dropdown |
| Duty Station | Derived from employee data | Dynamic dropdown |

**Also added:** Duty Station column, filter count badge, clear filters button.

**Files:** `src/app/(dashboard)/hr/page.tsx`, `src/app/api/v1/hr/employees/route.ts`

---

### Phase 8b-fix: Pension Management (PF + Gratuity) Bug Fixes ⬜ TODO

> **Priority: Fix broken Provident Fund and Gratuity pages — wrong API URLs, missing endpoints, field mismatches, NaN values**
> **Root cause: Phase 8b implemented PF/Gratuity models and APIs under `/api/v1/hr/pf/` and `/api/v1/hr/gratuity/` but pages call different URL paths (e.g., `/api/v1/hr/provident-fund/`). Multiple API response field names don't match page interfaces.**
> **Reference: Bangladesh Provident Fund Rules 2023, Labour Act 2006 §§27-28 (Gratuity), ILO Social Security Standards**

---

#### 8b-fix.1 PF Enrollments Page — Wrong API URL + Field Mismatch

**Problem:** Page at `/hr/pension/provident-fund/enrollments` calls:
- `GET /api/v1/hr/provident-fund/enrollments` — but API exists at `/api/v1/hr/pf/enrollments`

Page expects `employeeContribRate` / `employerContribRate` / `currentBalance` — but API returns `employeeRate` / `employerRate` / `totalBalance`.

**Fix:**
- Change API URL in page from `/api/v1/hr/provident-fund/enrollments` → `/api/v1/hr/pf/enrollments`
- Map API response fields to page interface OR update page interface

**File:** `src/app/(dashboard)/hr/pension/provident-fund/enrollments/page.tsx`

---

#### 8b-fix.2 PF Dashboard — Missing API Endpoint

**Problem:** PF main page at `/hr/pension/provident-fund` calls `GET /api/v1/hr/provident-fund/dashboard` — endpoint doesn't exist.

**Expected response:**
```typescript
{
  totalFundBalance: number    // From PFTrust.currentBalance
  enrolledMembers: number     // Count of active PFEnrollment
  monthlyContribution: number // Sum of latest month's PFContribution
  activeLoans: number         // Count of PFLoan with status=ACTIVE
  investmentReturns: number   // Sum of PFInvestmentIncome (current FY)
  recentContributions: Array<{
    id: string; employeeName: string; month: string
    employeeAmount: number; employerAmount: number; total: number
  }>
}
```

**Fix:** Create API at `src/app/api/v1/hr/pf/dashboard/route.ts` — aggregate from PFTrust, PFEnrollment, PFContribution, PFLoan, PFInvestmentIncome.

---

#### 8b-fix.3 Gratuity Page — Missing Fields (BDTNaN)

**Problem:** Gratuity page at `/hr/pension/gratuity` calls `GET /api/v1/hr/gratuity/reports/liability` which returns:
```
{ totalLiability, totalAccrued, totalPaid, employeeCount, vestedCount, employees[] }
```
But page expects:
```
{ totalLiability, monthlyAccrual, fundBalance, vestedEmployees, recentAccruals[], recentPayments[] }
```

Missing `monthlyAccrual` and `fundBalance` → passed as `undefined` to `formatCurrency()` → "BDTNaN"

**Fix:**
- Add `monthlyAccrual`: Calculate from `GratuityAccrual` for current month
- Add `fundBalance`: Get from `GratuityFund.currentBalance`
- Rename `vestedCount` → `vestedEmployees`
- Replace `employees[]` with `recentAccruals[]` (last 10 GratuityAccrual) and `recentPayments[]` (last 10 GratuityPayment)

**File:** `src/app/api/v1/hr/gratuity/reports/liability/route.ts`

---

#### 8b-fix.4 Pension Overview — i18n Missing Keys

**Problem:** Page shows raw keys: `common.labels.summary`, `common.labels.average`

**Fix:** Add to `src/messages/en/common.json` → `labels`:
```json
"summary": "Summary",
"average": "Average"
```
And to `src/messages/bn/common.json` → `labels`:
```json
"summary": "সারসংক্ষেপ",
"average": "গড়"
```

---

#### 8b-fix.5 Pension Calculation Accuracy

**PF Monthly Flow (correct):**
```
1. Employee monthly contribution = basicSalary × employeeRate%
2. Employer monthly contribution = basicSalary × employerRate%
3. Both deposited into PF Trust
4. Interest declared annually (rate from PFPolicy.interestRate)
5. Balance = employeeContrib + employerContrib + interestAccrued - withdrawals - loans
```

**Gratuity Monthly Accrual (correct per Bangladesh Labour Act 2006 §27):**
```
Monthly accrual = (lastBasicSalary × 1) / 12
Annual gratuity = lastBasicSalary × completedYears × 1
Vesting: minimum 5 years continuous service
Payment: on separation (resignation after 5yr, retirement, death, retrenchment)
```

**Fund Adequacy Ratio:**
```
FAR = (PFTrust.currentBalance + GratuityFund.currentBalance) / (totalPFLiability + totalGratuityLiability) × 100%
Target: >100% means fully funded
```

**Pension Overview KPIs (should show):**
- Total Retirement Liability = sum(PFEnrollment.totalBalance) + sum(GratuityLedger.accruedAmount)
- PF Balance = PFTrust.currentBalance (fund-level, not individual)
- Gratuity Liability = sum(GratuityLedger.accruedAmount)
- Monthly Contribution = sum of latest PFContribution (employee + employer)
- Fund Adequacy = (PFTrust.currentBalance + GratuityFund.currentBalance) / totalLiability × 100%

---

#### 8b-fix Implementation Order

| Step | Task | Status |
|------|------|--------|
| 8b-fix.1 | PF enrollments — fix API URL + field mapping | ✅ DONE |
| 8b-fix.2 | PF dashboard — create missing API | ✅ DONE |
| 8b-fix.3 | Gratuity page — fix missing fields (BDTNaN) | ✅ DONE |
| 8b-fix.4 | Pension i18n — add missing keys | ✅ DONE |
| 8b-fix.5 | Pension overview — fix API field mapping | ✅ DONE |
| 8b-fix.6 | PF bulk URL fix — 22 pages /provident-fund/ → /pf/ | ✅ DONE |
| 8b-fix.7 | PF Member Detail — enriched API + schema relation fix | ✅ DONE |

---

### Phase 13: Multi-Concern Accounting & Operating Structure ✅ BACKEND COMPLETE

> **Goal:** CSS Bangladesh has 5 sectors, 19 concerns, 29+ cost centers. All financial transactions must be tagged with business unit, cost center, fund class, project, and grant dimensions so that consolidated and per-concern reports can be generated from one shared ledger.

#### Status Summary

| Task | Status |
|------|--------|
| 13.1 `/settings/operating-structure` UI page (5 tabs: Sectors, Business Units, Cost Centers, Locations, Fund Classes) | ✅ DONE |
| 13.2 CSS demo data in Operating Structure page (5 sectors, 19 BUs, 29 cost centers, 4 locations, 4 fund classes) | ✅ DONE |
| 13.3 HR Cost Allocations page `/hr/cost-allocations` (replaces project-allocations) | ✅ UI DONE |
| 13.4 Finance dimension filter bar on `/finance/financial-reports` (Sector → BU → CC → FundClass → Project → Grant) | ✅ UI DONE |
| 13.5 CSS COA seed (`seed-accounts.ts`) — 346 accounts from `docs/data/CSS_COA.docx` | ✅ SEEDED |
| 13.6 Prisma schema: Add `Sector`, `BusinessUnit`, `CostCenter`, `FundClass`, `OperatingLocation` models | ✅ DONE |
| 13.7 Prisma schema: Add dimension FKs to `JournalEntryLine`, `Voucher`, `BankAccount`, `PettyCashFund`, `ExpenseClaim`, `ExpenseClaimItem`, `EmployeeAdvance`, `Account`, `JournalEntry` | ✅ DONE |
| 13.8 Prisma schema applied: `pnpm db:push` — DB in sync, `PRISMA_CLIENT_VERSION` bumped to 4 | ✅ DONE |
| 13.9 API: CRUD endpoints for sectors, business-units, cost-centers, fund-classes, operating-locations (5×2 routes = 10 files) | ✅ DONE |
| 13.10 API: Update `JournalEntry` + `JournalEntryLine` POST/PUT to accept dimension fields | ✅ DONE |
| 13.11 API: Update `Voucher` (POST + approve) to accept and propagate `businessUnitId` | ✅ DONE |
| 13.12 Seed: CSS sector/BU/cost-center/fund-class/location data (`seed-css-operating-structure.ts`) | ✅ DONE |
| 13.13 UI: Wire Operating Structure tabs to real APIs (removed static mock data, loading/saving states) | ✅ DONE |
| 13.14 UI: Wire HR Cost Allocations to real `EmployeeCostAllocation` API | ⬜ TODO |
| 13.15 UI: Add dimension selectors to Journal Entry create/edit form | ⬜ TODO |
| 13.16 UI: Add dimension selectors to Voucher create/edit form | ⬜ TODO |
| 13.17 Reports API: Add dimension filters (`sectorId`, `businessUnitId`, `costCenterId`, `fundClassId`, `grantId`) to trial balance, income statement, and all reports via `getAccountBalances` | ✅ DONE |
| 13.18 Report: Concern-wise Trial Balance (use `?businessUnitId=` or `?sectorId=` param) | ✅ DONE (via filter params) |
| 13.19 Report: Concern-wise Income Statement (use `?businessUnitId=` or `?sectorId=` param) | ✅ DONE (via filter params) |
| 13.20 Dashboard: Sector → BU → CostCenter drill-down KPIs | ⬜ TODO |
| 13.21 Documentation: update this Phase 13 table | ✅ DONE |

#### Phase 13 Verification Results (2026-04-24)

**DB query results:**
```
Sectors:             5  (SEC-001 Health … SEC-005 Special Development)
Business Units:      19 (BU-001 Hospital … BU-019 CLTP)
Cost Centers:        29 (CC-OPD … CC-CLP-FLD)
Fund Classes:        4  (FC-UNR, FC-RES, FC-TMP, FC-END)
Operating Locations: 4  (LOC-001…LOC-004)
JournalEntryLine.businessUnitId: nullable FK added, existing 28 pre-migration lines = null (expected)
```

**TypeScript check:** `npx tsc --noEmit --skipLibCheck` → 0 errors

**Dev server note:** After `pnpm db:generate` + `PRISMA_CLIENT_VERSION = 4`, the dev server must be restarted once to pick up the new Prisma client models (`sector`, `businessUnit`, `costCenter`, `fundClass`). The operating structure CRUD APIs will return 400 until after the restart.

**API endpoints created:**
- `GET/POST /api/v1/settings/sectors` + `GET/PUT/DELETE /api/v1/settings/sectors/[id]`
- Same pattern for `business-units`, `cost-centers`, `fund-classes`, `operating-locations`

**Report dimension filter usage:**
```
GET /api/v1/finance/reports/trial-balance?fiscalYearId=<id>&businessUnitId=<BU_ID>
GET /api/v1/finance/reports/income-statement?fiscalYearId=<id>&sectorId=<SECTOR_ID>
GET /api/v1/finance/reports/trial-balance?fiscalYearId=<id>&fundClassId=<FC_ID>
```
All filter through `JournalEntryLine.businessUnitId` / `JournalEntryLine.costCenterId` / `JournalEntryLine.fundClassId`. `sectorId` joins via `businessUnit.sectorId`.

#### Remaining Gaps
- 13.14: HR Cost Allocations API wiring (needs `EmployeeCostAllocation` model + routes)
- 13.15–13.16: Dimension selectors on JE and Voucher UI forms
- 13.20: Dashboard drill-down KPIs

#### Phase 13 Implementation Guardrails

- CSS concerns are not separate legal entities. Do not add `LegalEntity`, separate tenants, or separate ledgers per concern.
- Use one organization-level chart of accounts. Use dimensions for concern-wise reporting.
- `sectorId` is derived from `BusinessUnit.sectorId`; do not store `sectorId` on `JournalEntryLine`.
- The source-of-truth line dimensions are `businessUnitId`, `costCenterId`, `fundClassId`, `projectId`, and `grantId`.
- All new master data shown in UI must support English and Bangla through `localizedName Json?` and message files.
- No Phase 13 task can be marked done until it has a database query, curl/API test, or UI verification note.
- After each completed task, update this section and `docs/multiconcern-accounting.md` if behavior or implementation order changes.

#### Required Prisma Schema Additions

```prisma
model Sector {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @db.Uuid
  code           String
  name           String
  localizedName  Json?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  organization   Organization @relation(fields: [organizationId], references: [id])
  businessUnits  BusinessUnit[]
  @@unique([organizationId, code])
  @@index([organizationId])
}

model BusinessUnit {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @db.Uuid
  sectorId       String   @db.Uuid
  sector         Sector   @relation(fields: [sectorId], references: [id])
  code           String
  name           String
  shortName      String?
  localizedName  Json?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  organization   Organization @relation(fields: [organizationId], references: [id])
  costCenters    CostCenter[]
  operatingLocations OperatingLocation[]
  journalLines   JournalEntryLine[]
  @@unique([organizationId, code])
  @@index([organizationId])
  @@index([sectorId])
}

model CostCenter {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @db.Uuid
  businessUnitId String       @db.Uuid
  businessUnit   BusinessUnit @relation(fields: [businessUnitId], references: [id])
  code           String
  name           String
  localizedName  Json?
  description    String?
  isActive       Boolean      @default(true)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  organization   Organization @relation(fields: [organizationId], references: [id])
  journalLines   JournalEntryLine[]
  @@unique([organizationId, code])
  @@index([organizationId])
  @@index([businessUnitId])
}

model FundClass {
  id             String  @id @default(uuid()) @db.Uuid
  organizationId String  @db.Uuid
  code           String
  name           String
  localizedName  Json?
  restriction    String  // UNRESTRICTED | RESTRICTED | TEMPORARILY_RESTRICTED | ENDOWMENT
  isActive       Boolean @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  organization   Organization @relation(fields: [organizationId], references: [id])
  journalLines   JournalEntryLine[]
  @@unique([organizationId, code])
  @@index([organizationId])
}

model OperatingLocation {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @db.Uuid
  businessUnitId String?  @db.Uuid
  code           String
  name           String
  localizedName  Json?
  address        String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  organization   Organization @relation(fields: [organizationId], references: [id])
  businessUnit   BusinessUnit? @relation(fields: [businessUnitId], references: [id])
  @@unique([organizationId, code])
  @@index([organizationId])
  @@index([businessUnitId])
}
```

#### JournalEntryLine dimension fields to add

```prisma
// Add to existing JournalEntryLine model:
businessUnitId  String?  @db.Uuid
costCenterId    String?  @db.Uuid
fundClassId     String?  @db.Uuid
// sectorId derived via businessUnit.sectorId — do NOT store separately

businessUnit    BusinessUnit? @relation(fields: [businessUnitId], references: [id])
costCenter      CostCenter?   @relation(fields: [costCenterId], references: [id])
fundClass       FundClass?    @relation(fields: [fundClassId], references: [id])

@@index([businessUnitId])
@@index([costCenterId])
@@index([fundClassId])
```

Also add reverse relation arrays on `Organization`:

```prisma
sectors           Sector[]
businessUnits     BusinessUnit[]
costCenters       CostCenter[]
fundClasses       FundClass[]
operatingLocations OperatingLocation[]
```

#### Phase 13 Backend Execution Order

1. Inspect the current Prisma models and API route patterns before editing.
2. Add schema models and relations in the split schema files:
   - `prisma/schema/organization.prisma` for operating structure models.
   - `prisma/schema/finance.prisma` for finance dimensions and relations.
   - `prisma/schema/budget.prisma` only where budget dimensions are required by current reports.
3. Run `pnpm db:generate`; fix type errors before moving to API work.
4. Run `pnpm prisma migrate dev --name phase13_multi_concern_dimensions` or the repo's current migration command.
5. Create `prisma/seed-css-operating-structure.ts` with idempotent `upsert` data for 5 sectors, 19 business units, 29+ cost centers, locations, and 4 fund classes.
6. Update `prisma/seed.ts` to call the CSS operating structure seed only if that matches the repo's seed composition pattern.
7. Fix `prisma/seed-accounts.ts` so CSS account seeding resolves the organization by env/config instead of hard-coded `shapla-foundation`.
8. Implement CRUD APIs:
   - `GET/POST /api/v1/settings/sectors`
   - `GET/PUT/DELETE /api/v1/settings/sectors/[id]`
   - `GET/POST /api/v1/settings/business-units`
   - `GET/PUT/DELETE /api/v1/settings/business-units/[id]`
   - `GET/POST /api/v1/settings/cost-centers`
   - `GET/PUT/DELETE /api/v1/settings/cost-centers/[id]`
   - `GET/POST /api/v1/settings/fund-classes`
   - `GET/PUT/DELETE /api/v1/settings/fund-classes/[id]`
   - same pattern for `operating-locations` if the UI tab is kept.
9. Add a reusable dimension validation helper for organization ownership and cost-center-to-business-unit consistency.
10. Update journal entry create/update APIs to accept line-level `businessUnitId`, `costCenterId`, and `fundClassId`.
11. Update voucher create/approve flow so generated journal lines copy final dimensions.
12. Update bank account, petty cash, expense claim, employee advance, and budget APIs only where current routes already exist and can persist the new fields safely.
13. Wire `/settings/operating-structure` to real APIs and remove static mock mutation behavior.
14. Update `/finance/financial-reports` labels to use `next-intl` for both English and Bangla.
15. Add dimension filters to financial report APIs. `sectorId` must filter by joining through `BusinessUnit`.
16. Add concern-wise trial balance and concern-wise income statement.
17. Run lint/build where feasible. If full repo lint has unrelated existing failures, record focused checks and exact remaining failures.

#### Phase 13 Required Verification

Run and document these after implementation:

```bash
pnpm db:generate
pnpm prisma migrate dev --name phase13_multi_concern_dimensions
pnpm tsx prisma/seed-css-operating-structure.ts
pnpm tsx prisma/seed-accounts.ts
```

Run DB checks and paste summarized results into this section:

```sql
select count(*) from "Sector";
select count(*) from "BusinessUnit";
select count(*) from "CostCenter";
select count(*) from "FundClass";
select code, name, "localizedName" from "BusinessUnit" order by code limit 5;
select "businessUnitId", "costCenterId", "fundClassId", count(*)
from "JournalEntryLine"
group by "businessUnitId", "costCenterId", "fundClassId";
```

Run curl/API checks and document response status plus key data:

```bash
curl -s http://localhost:4000/api/v1/settings/sectors
curl -s http://localhost:4000/api/v1/settings/business-units
curl -s http://localhost:4000/api/v1/settings/cost-centers
curl -s http://localhost:4000/api/v1/settings/fund-classes
curl -s "http://localhost:4000/api/v1/finance/reports/trial-balance?businessUnitId=<BUSINESS_UNIT_ID>"
curl -s "http://localhost:4000/api/v1/finance/reports/income-statement?sectorId=<SECTOR_ID>"
```

If auth is required, use the existing login/auth pattern and document the exact cookie/token setup used for curl.

#### COA Summary (seeded 2026-04-24)

| Section | Accounts |
|---------|---------|
| Capital Fund (101xxx) | 6 |
| Current Liabilities (201xxx) | 29 |
| Current Assets — Cash/Bank/Loans/Stock (303xxx–309xxx) | 46 |
| Fixed Assets (401xxx) | 15 |
| Income (501xxx–509xxx) | 89 |
| Expenses (601xxx–614xxx) | 137 |
| Accumulated Depreciation (701xxx) | 15 |
| Synthetic root nodes | 9 |
| **Total** | **346** |

Key income accounts for concern-wise reporting:
- `503000` Income from Health (Hospital + Nursing)
- `504000` Income from Education Home, HTI & HPI
- `507000` Income from CSS Ava Center
- `508000` Income from CSS Printing Press
- `509000` Income from Nursing Institute
- `502000` Income From Microcredit (MFP)

Key expense accounts for concern-wise reporting:
- `601000` Personal Cost (shared across all concerns via cost allocation dimensions)
- `607000` Education Expenses
- `608000` Health Expenses
- `605000` CSS Ava Center Expenses
- `614000` Printing Press Expenses
- `606000` Credit Expense (MFP)
- `613000` HRM Expenses

---

> **Adopted from LMS** — background tasks for SaaS operations

| Cron Job | Schedule | Description |
|----------|----------|-------------|
| `subscription-check` | Daily 00:00 | Move TRIAL past trial end → EXPIRED. Move PAST_DUE past grace → EXPIRED. Auto-resume PAUSED subscriptions past `pausedUntil` |
| `invoice-generation` | Daily 01:00 | Generate `TenantInvoice` for subscriptions approaching `nextPaymentDate` |
| `grace-period-check` | Daily 02:00 | Check PAST_DUE subscriptions — send reminder on day 1, 3, 5. Expire on day 7 |
| `bandwidth-reset` | 1st of month 00:00 | Reset `bandwidthUsedBytes` for all orgs. Update `bandwidthPeriodStart/End` |
| `storage-warnings` | Daily 06:00 | Check storage/bandwidth at 80%/90%. Send email warnings if not already sent |
| `scheduled-plan-changes` | Daily 00:30 | Apply deferred plan upgrades/downgrades at `scheduledChangeDate` |
| `overdue-invoice-check` | Daily 03:00 | Mark invoices past `dueDate` as OVERDUE. Move subscription to PAST_DUE |
| `data-retention-purge` | Weekly Sun 03:00 | Purge expired data per `DataRetentionPolicy` (old audit logs, notifications, etc.) |
| `data-export-cleanup` | Daily 04:00 | Delete expired `DataExportRequest` files from R2 |
| `webhook-retry` | Every 15 min | Retry FAILED webhook deliveries (max 5 attempts with exponential backoff) |
| `backup-daily` | Daily 02:00 | pg_dump → R2 backup. Log in `Backup` table |
| `contract-expiry-alert` | Daily 08:00 | Notify about contracts expiring within 30 days |
| `budget-threshold-alert` | Daily 09:00 | Check budget utilization at 80%, 90%, 100%. Send alerts |
| `loan-overdue-classification` | Daily 00:00 | Reclassify loans: REGULAR → WATCH (1d) → SUBSTANDARD (31d) → DOUBTFUL (181d) → BAD (366d) |
| `depreciation-monthly` | 1st of month 01:00 | Auto-run monthly depreciation for all orgs with active assets |

**Implementation:** Next.js API routes at `/api/v1/cron/{job-name}` + external cron service (cron-job.org, Upstash, or system crontab) to trigger them.

---

## 8. Testing Guidelines

### 8.1 Testing Strategy

Each feature must be tested with:
1. **Input validation** — What happens with invalid/edge-case data?
2. **Expected output** — What should the API return?
3. **Cross-module impact** — What changes in other modules?
4. **Permission check** — Can unauthorized users access this?

### 8.2 Module-wise Testing Guidelines

---

#### TEST: Finance - Chart of Accounts

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Create root account | `{code: "1000", name: "Assets", type: "ASSET", level: 1, isGroup: true}` | Account created, code unique | None (master data) |
| Create child account | `{code: "1100", name: "Current Assets", parentId: "1000's UUID"}` | Account created under parent, level=2 | None |
| Duplicate code | `{code: "1000", ...}` | Error: "Account code already exists" | None |
| Delete account with transactions | DELETE `/accounts/:id` | Error: "Cannot delete account with existing transactions" | None |
| Deactivate account | PUT with `isActive: false` | Account hidden from dropdowns, transactions preserved | Budget: can't use for new budget lines. JE: can't use for new entries |

---

#### TEST: Finance - Journal Entries

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Create balanced JE | `{lines: [{accountId: A, debit: 50000}, {accountId: B, credit: 50000}]}` | JE created, status=DRAFT, entryNo auto-generated | None until posted |
| Unbalanced JE | Debit ≠ Credit | Error: "Total debit must equal total credit" | None |
| Post JE | POST `/journal-entries/:id/post` | Status=APPROVED, account balances updated | **Finance**: Account balances change. **Budget**: Actual spend increases if project-tagged. **Dashboard**: KPI updates |
| Post JE tagged to project | Include `projectId` | Same + project `amountSpent` increases | **Project**: `amountSpent` increases. **Budget**: Budget vs Actual changes |
| Post JE tagged to grant | Include `grantId` | Same + grant financials update | **Donor**: Grant `disbursedAmount` tracking |
| Edit posted JE | PUT on APPROVED entry | Error: "Cannot edit posted journal entry" | None |

---

#### TEST: Finance - Vouchers

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Create DV (Debit Voucher) | `{type: "DEBIT", amount: 25000, payee: "Vendor X", projectId: ...}` | Voucher created as DRAFT, voucherNo auto | None until approved |
| Approve voucher | POST `/vouchers/:id/approve` | Status=APPROVED, auto JE created and posted | **Finance**: JE posted, account balances change. **Budget**: Actual spend increases. **Project**: `amountSpent` increases |
| Approve by same person who prepared | `preparedById == approvedById` | Error: "Preparer cannot approve own voucher" (segregation of duty) | None |
| Approve without permission | User without `finance.approve.vouchers` | 403 Forbidden | None |
| Reject voucher | POST `/vouchers/:id/reject` with reason | Status=REJECTED, no JE created | None |

---

#### TEST: Finance - Bank Reconciliation

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Start reconciliation | `{bankAccountId, periodStart, periodEnd, bankBalance}` | Reconciliation created with book balance auto-calculated, difference shown | None |
| Match items | Match outstanding cheques and deposits in transit | Items marked `isMatched`, difference reduces | None until finalized |
| Unrecorded bank charge | Add bank charge as reconciliation item | Creates adjusting JE | **Finance**: New JE for bank charges |
| Complete reconciliation | All items matched, difference = 0 | Status=RECONCILED | **Finance**: BankAccount balance confirmed |

---

#### TEST: Budget Management

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Create budget | `{name, projectId, totalAmount, lines: [...]}` | Budget created as DRAFT | None |
| Sum of lines ≠ totalAmount | Lines total 500000 but totalAmount = 600000 | Error: "Budget lines must sum to total amount" | None |
| Budget vs Actual | GET `/budget/:id/vs-actual` | Returns each line with budget, actual (from JEs), variance, % | None (read-only) |
| Budget revision | Create revision with changed line amounts | Revision created as DRAFT | None until approved |
| Approve revision | POST `/revisions/:id/approve` | Budget lines updated to revised amounts | **Budget**: Budget amounts change. **Procurement**: New budget limits for PR validation |
| Cost allocation | Apply allocation rule to period | CostAllocationEntries created, allocates shared costs to projects | **Finance**: Allocation JEs created. **Project**: Shared cost increases `amountSpent` |

---

#### TEST: Donor & Grant Management

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Create donor | `{name: "USAID", type: "BILATERAL", country: "USA"}` | Donor created | None |
| Create grant under donor | `{title: "WASH Phase 3", donorId, awardAmount: 15000000}` | Grant created, status=PIPELINE | None |
| Record fund receipt (BDT) | `{grantId, amount: 5000000, currencyCode: "BDT", bankAccountId: motherAccountId}` | Receipt created, status=PENDING | None until confirmed |
| Confirm fund receipt | POST `/fund-receipts/:id/confirm` | Status=CONFIRMED, auto JE created (DR Bank, CR Grant Income) | **Finance**: JE posted, bank balance increases. **Grant**: `disbursedAmount` increases. **Dashboard**: "Total Fund Received" KPI increases |
| Record fund receipt (USD) | `{amount: 50000, currencyCode: "USD", exchangeRate: 118.50}` | Receipt created, `amountInBDT = 50000 × 118.50 = 59,25,000` | Same as above, in BDT equivalent |
| Fund requisition | `{grantId, projectId, amount: 1200000, purpose: "Q2 activities"}` | Requisition created as DRAFT | None |
| Approve requisition | Check remaining grant balance >= requested amount | If sufficient: APPROVED. If insufficient: Error | **Grant**: Tracks committed funds |
| Grant lifecycle update | Move from IMPLEMENTATION to CLOSEOUT | Grant stage updates | **Project**: Should trigger closeout process |

---

#### TEST: Project Management

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Create project | `{name: "WASH Phase 3", donorId, startDate, endDate, totalBudget}` | Project created, status=PIPELINE, projectNo auto | None |
| Add team member | `{projectId, employeeId, role: "Project Manager", allocation: 100}` | Team member added | **HR**: Employee shows as allocated to project. **Payroll**: Salary allocation split |
| Create activity | `{name: "Install 50 tubewells", projectId, budget: 1500000}` | Activity created, status=PLANNED | **Project**: Activity count increases |
| Update activity progress | `{progress: 75, status: "IN_PROGRESS"}` | Activity updated | **Project**: Overall `progress` recalculated. **Dashboard**: Project progress updates |
| Mark milestone achieved | `{status: "ACHIEVED", actualDate: "2026-03-15"}` | Milestone status updated | **Project**: Milestone tracking. **Reports**: Progress report data |
| Activity budget > project budget | Activity total exceeds project budget | Warning (not error — activities can be planned beyond budget) | None |
| Project closeout | Create closeout with checklist items | Closeout created with items | **Project**: Status should be checked |

---

#### TEST: Beneficiary Management

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Register beneficiary | `{name: "Halima Begum", nidNumber: "1234567890", district: "Sylhet"}` | Beneficiary created, beneficiaryNo auto | **Dashboard**: Potential beneficiary count |
| Duplicate NID | Same NID as existing | Error: "A beneficiary with this NID already exists" | None |
| Enroll in program | `{beneficiaryId, projectId, programName: "WASH"}` | Enrollment created, status=ACTIVE | **Project**: Beneficiary count increases. **Dashboard**: "Active Beneficiaries" KPI increases |
| Graduate from program | `{status: "GRADUATED"}` | Enrollment status updated | **Dashboard**: Active count decreases, graduated count increases |
| Record service delivery | `{beneficiaryId, projectId, serviceType: "Health Checkup", date, deliveredById}` | Service record created | **Impact**: Feeds into indicator data. **Reports**: Service delivery counts |
| Record impact measurement | `{indicatorId, baseline: 45, target: 85, currentValue: 78}` | Assessment created, `achievementPct = (78-45)/(85-45)*100 = 82.5%` | **Reports**: Impact reporting data |
| File grievance | `{complainantName, category: "DELAY", severity: "MEDIUM", description}` | Grievance created, status=OPEN | **Dashboard**: Pending grievance count |
| Resolve grievance | `{status: "RESOLVED", resolutionNotes: "..."}` | Status updated, resolution date set | **Reports**: Resolution metrics (avg time) |

---

#### TEST: Procurement

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Create PR with budget check | `{projectId, items: [{description: "Laptops", quantity: 10, estimatedPrice: 80000}]}` | System checks budget availability. If available: PR created. If not: Error "Insufficient budget" | **Budget**: Budget availability check |
| Approve PR → Create PO | After PR approved, create PO to vendor | PO created, linked to PR. PR status → PO_CREATED | **Procurement**: PO in pipeline |
| GRN for PO | Receive goods, enter quantities | GRN created. PO status updates (PARTIALLY_RECEIVED or COMPLETED) | **Inventory**: Stock increases for received items. **PO**: Received qty updated |
| GRN partial delivery | Received 480 of 500 ordered | PO status = PARTIALLY_RECEIVED, PO line `receivedQty = 480` | **Inventory**: Stock increases by 480 |
| Tender evaluation | Score bids technically and financially | Combined scores calculated, winner identified | **Procurement**: Award decision documented |
| Vendor rating after delivery | Rate quality, delivery, pricing, communication | Overall rating calculated, vendor `rating` updated | **Vendor**: Rating history for future selection |
| Contract expiry alert | Contract `endDate` within 30 days | Notification sent to contract owner | **Notifications**: Alert triggered |

---

#### TEST: Fixed Assets

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Register asset | `{name: "Toyota Hilux", categoryId, purchasePrice: 2500000, purchaseDate}` | Asset created, `netBookValue = purchasePrice` | **Asset Register**: New entry |
| Run monthly depreciation | POST `/depreciation/calculate` for month=3, year=2026 | For each active asset: depreciation amount calculated based on category method/rate. `accumulatedDepreciation` increases, `netBookValue` decreases | **Finance**: Auto JE created (DR Depreciation Expense, CR Accumulated Depreciation). **Budget**: Actual spend increases. **Asset**: NBV updated |
| Straight-line calc | Purchase: 2500000, useful life: 5 years, rate: 20% | Monthly depreciation = 2500000 × 20% / 12 = 41,667 | Verified against expected amount |
| Transfer asset | `{assetId, fromLocation: "Dhaka HQ", toLocation: "Sylhet Office"}` | Transfer record created, status=PENDING_APPROVAL | None until approved |
| Approve & receive transfer | Approve then confirm receipt | Asset `warehouseId` updated to new location | **Asset Register**: Location change reflected |
| Dispose asset | `{assetId, method: "AUCTION", recoveryAmount: 50000}` | Disposal record created | **Finance**: JE for gain/loss on disposal. **Asset**: Marked as disposed |
| Dispose with gain | `bookValue=0, recoveryAmount=50000` → Gain of 50000 | JE: DR Cash 50000, CR Gain on Disposal 50000 | **Finance**: Income recognized |
| Dispose with loss | `bookValue=120000, recoveryAmount=0` (theft) | JE: DR Loss on Disposal 120000, CR Asset 120000 | **Finance**: Loss recognized |

---

#### TEST: Human Resources

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Create employee | `{fullName, departmentId, designationId, joiningDate, basicSalary}` | Employee created, employeeNo auto, status=PROBATION | **Dashboard**: "Staff Count" KPI increases |
| Apply leave | `{employeeId, leaveTypeId: "annual", startDate, endDate, days: 5}` | Application created. System checks balance: if `remaining >= 5` → PENDING, else Error | None until approved |
| Approve leave | POST `/leave/:id/approve` | Status=APPROVED, `leaveBalance.taken += 5, remaining -= 5` | **Attendance**: Days blocked as ON_LEAVE. **Payroll**: If unpaid leave, deduction applies |
| Reject leave (balance=0) | Employee has 0 remaining annual leave | Error: "Insufficient leave balance" | None |
| Record attendance | `{employeeId, date, status: "PRESENT", checkIn: "09:00", checkOut: "18:00"}` | Attendance recorded | **Payroll**: Working days counted |
| Process payroll | POST `/payroll/runs/:id/process` | For each active employee: Basic + HRA + Medical + Transport = Gross. Gross - PF - TDS - Absent deduction = Net. All entries calculated | **Payroll**: Entries populated |
| Approve payroll | POST `/payroll/runs/:id/approve` | Status=APPROVED, auto JE created. Per project allocation: DR Salary Expense (Project A) X, DR Salary Expense (Project B) Y, CR Bank Z | **Finance**: Salary JE posted. **Budget**: Actual spend increases per project. **Bank**: Balance decreases |
| Performance review cycle | Create review, employee self-scores, supervisor scores | Final score calculated as weighted average, rating assigned | **HR**: Performance data for increment decisions |
| Salary allocation 60/40 split | Employee allocated 60% to Project A, 40% to Project B. Gross salary 100000 | Project A charged 60000, Project B charged 40000 | **Budget**: Each project budget actual increases proportionally |

---

#### TEST: Microfinance

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Create samity | `{name: "Shapla Mohila", branchId, meetingDay: "Saturday", meetingTime: "09:00"}` | Samity created, samityNo auto | None |
| Add member | `{beneficiaryId, samityId}` | MFIMember created, memberNo auto. Samity `totalMembers` increments | **Beneficiary**: Linked as MFI member |
| Configure loan product | `{name: "Jagoron", category: "INCOME_GENERATING", minAmount: 10000, maxAmount: 100000, interestRate: 20, interestMethod: "DECLINING_BALANCE"}` | Product created | None (config) |
| Submit loan application | `{memberId, productId, amountRequested: 50000, purpose: "Sewing machine"}` | Application created, status=SUBMITTED | None |
| Approve & disburse | Approve → LoanAccount created → Disburse | Loan account: principal=50000, installment calculated, status=ACTIVE. Disbursement recorded | **Finance**: JE (DR Loan Portfolio Outstanding, CR Cash/Bank). **Samity**: Outstanding portfolio increases |
| Declining balance installment | Principal: 50000, Rate: 20% annual, Duration: 12 months | Monthly installment ≈ 4635 (EMI formula). Total repayable ≈ 55620 | Verified against expected EMI |
| Record repayment | `{loanAccountId, principalAmount: 3500, interestAmount: 833, totalAmount: 4333}` | Repayment recorded. `outstandingBalance` decreases. `totalPaid` increases | **Finance**: JE (DR Cash, CR Loan Outstanding + CR Interest Income). **Loan**: Balance updated |
| Missed repayment → Overdue | Loan has no payment for 15 days past due | Classification changes: REGULAR → WATCH. `daysOverdue` updated. `overdueAmount` calculated | **Overdue**: Loan appears in overdue list. **MRA Reports**: PAR calculation affected |
| 31 days overdue | No payment for 31 days | Classification: WATCH → SUBSTANDARD. Provision: 25% | **Finance**: Provision JE may be required. **MRA**: Portfolio quality report |
| Savings deposit | `{accountId, type: "DEPOSIT", amount: 200}` | Balance increases by 200, transaction recorded | **Finance**: JE (DR Cash, CR Member Savings Liability) |
| Savings withdrawal | `{accountId, type: "WITHDRAWAL", amount: 5000}`. Balance is 12000 | Balance decreases to 7000, transaction recorded | **Finance**: JE (DR Member Savings, CR Cash) |
| Withdrawal exceeds balance | Withdraw 15000 but balance is 12000 | Error: "Insufficient savings balance" | None |
| MRA Monthly Return | GET `/mra-reports/cdf-1` for month=January | Auto-populated: Total borrowers, outstanding portfolio, savings portfolio, recovery rate, PAR>30 | **Compliance**: Data matches operational records |

---

#### TEST: Reports & Analytics

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Trial Balance | GET `/reports/financial/trial-balance?fiscalYearId=...` | All accounts with balances. Total Debit = Total Credit | None (read-only). **Verify**: Matches sum of all posted JEs |
| Balance Sheet | GET `/reports/financial/balance-sheet` | Assets = Liabilities + Equity. Fund balances per donor | **Verify**: Assets match account balances, Liabilities match |
| Income Statement | GET `/reports/financial/income-statement` | Income - Expenses = Surplus/Deficit. Project-wise and consolidated | **Verify**: Matches journal entries in the period |
| NGOAB FD-6 | GET `/reports/ngoab/fd-6` | Annual audit data: income, expenditure, assets, liabilities, project-wise | **Verify**: Matches financial statements |
| Audit Trail query | GET `/reports/audit-trail?userId=X&action=APPROVE&module=finance` | List of matching audit records with timestamps, IPs | None |
| Custom report | POST with cross-module columns | Returns data from multiple tables joined | None |
| Dashboard KPIs | GET `/dashboard` | Live KPIs: Total Fund Received (from FundReceipts), Fund Utilized (from JEs), Active Projects (from Projects), etc. | **Verify**: Each KPI matches source module's data |

---

#### TEST: Settings & Admin

| Test Case | Input | Expected Output | Impact |
|-----------|-------|-----------------|--------|
| Create role | `{name: "Finance Officer", permissions: ["finance.read.*", "finance.create.vouchers"]}` | Role created with permissions | **Auth**: Users with this role get these permissions |
| Assign role to user | `{userId, roleId: "Finance Officer"}` | User role updated | **Auth**: User's accessible modules change immediately |
| Configure workflow | `{name: "Voucher Approval", steps: [{role: "Finance Officer", amountMax: 50000}, {role: "Finance Head", amountMax: 500000}, {role: "ED"}]}` | Workflow created | **All approvals**: Vouchers follow this workflow |
| Amount-based routing | Voucher amount=25000 → only 1 approval needed (Finance Officer). Amount=200000 → 2 approvals. Amount=800000 → 3 approvals (up to ED) | Correct number of approval steps triggered | **Approval**: Right people approve right amounts |
| Update number sequence | Change voucher format from "DV-2026-001" to "DV/26/001" | Next voucher uses new format | **Finance**: Voucher numbering changes |
| Backup | POST `/backup` | pg_dump runs, backup file created, record logged | **System**: Backup available for restore |

---

### 8.3 Integration Test Scenarios

These test end-to-end flows spanning multiple modules:

#### Scenario 1: Complete Grant-to-Expenditure Flow
```
1. Create Donor (USAID) → Donor ID
2. Create Grant (GR-001, Award: 1 Crore) → Grant ID
3. Create Project (WASH Phase 3) linked to Grant → Project ID
4. Create Budget (50 lakh for Phase 3) with line items → Budget ID
5. Receive Fund (50 lakh from USAID) → Fund Receipt → Auto JE posted
   ✓ Verify: Grant disbursedAmount = 50 lakh
   ✓ Verify: Bank balance increased by 50 lakh
   ✓ Verify: Dashboard "Total Fund Received" increased
6. Create Purchase Requisition (5 lakh for water kits) → PR approved
   ✓ Verify: Budget availability checked (sufficient)
7. Create Purchase Order to Vendor → PO issued
8. Receive Goods (GRN) → Inventory stock increased
9. Create Payment Voucher → Approved → Auto JE posted
   ✓ Verify: Bank balance decreased by 5 lakh
   ✓ Verify: Budget actual spend increased by 5 lakh
   ✓ Verify: Project amountSpent increased by 5 lakh
   ✓ Verify: Budget vs Actual shows 5 lakh spent of 50 lakh budget
```

#### Scenario 2: Complete Payroll Cycle
```
1. Record Attendance for month (23 working days, Employee A: 22 present + 1 CL)
2. Approve Leave Application for Employee B (2 days unpaid)
3. Create Payroll Run for month
4. Process Payroll:
   ✓ Employee A: Full salary (CL is paid)
   ✓ Employee B: Salary - 2 days deduction
   ✓ Each employee's salary split across projects per allocation %
5. Approve Payroll → Auto JE created
   ✓ Verify: JE debits = sum of all gross salaries by project
   ✓ Verify: JE credits = bank account for net total + PF payable + TDS payable
   ✓ Verify: Each project's amountSpent increased by its share
   ✓ Verify: Budget vs Actual updated for each project
```

#### Scenario 3: Complete Microfinance Loan Cycle
```
1. Create Branch → Samity → Add 3 Members
2. Configure Loan Product (Jagoron, 20% declining, 12 months, weekly)
3. Member Reshma applies for 50,000 → Approved → Loan Account created
4. Disburse 50,000 cash at samity meeting
   ✓ Verify: JE (DR Loan Outstanding 50000, CR Cash 50000)
   ✓ Verify: Samity outstanding portfolio increased
5. Weekly Collection: Reshma pays installment 1135 (principal 833 + interest 302)
   ✓ Verify: JE (DR Cash 1135, CR Loan Outstanding 833, CR Interest Income 302)
   ✓ Verify: Loan outstandingBalance = 49167
   ✓ Verify: Collection sheet recorded
6. Reshma misses 2 consecutive payments (15+ days overdue)
   ✓ Verify: Classification changes to WATCH
   ✓ Verify: Appears in Overdue Management
7. Reshma resumes payments and clears overdue
   ✓ Verify: Classification returns to REGULAR
8. After 12 months, final payment made
   ✓ Verify: Loan status = CLOSED
   ✓ Verify: outstandingBalance = 0
```

#### Scenario 4: Asset Lifecycle
```
1. Procure laptop via PR → PO → GRN → Payment
2. Register as Asset (category: IT Equipment, 3-year life, 33%/yr)
   ✓ Asset Register shows new laptop
3. Run monthly depreciation for 3 months
   ✓ Month 1: NBV = Purchase - (Purchase × 33% / 12)
   ✓ Verify: 3 depreciation JEs created
   ✓ Verify: Asset NBV matches expected
4. Transfer asset from Dhaka HQ to Sylhet Office
   ✓ Approve transfer → Asset location updated
5. After 3 years, dispose by auction
   ✓ Recovery amount = 5000, NBV = 0
   ✓ JE: DR Cash 5000, CR Gain on Disposal 5000
   ✓ Asset marked as DISPOSED
```

---

## Verification Checklist

Before starting implementation, this plan has been verified for:

- [x] **Every menu item (76) has corresponding API endpoints** — All 12 modules fully covered with ~180+ endpoints
- [x] **Every feature has database tables** — 70+ tables covering all entities
- [x] **All CRUD operations defined** — Create, Read, Update, Delete (or Deactivate) for every entity
- [x] **Inter-module relationships mapped** — Section 5 details every cross-module data flow
- [x] **Cascade/impact rules defined** — What happens in Module B when Module A changes
- [x] **Approval workflows identified** — Vouchers, PRs, Budget Revisions, Leave, Payroll, Fund Requisitions, Asset Transfers/Disposals, Loan Applications
- [x] **Auto-generated documents identified** — Journal Entries from vouchers, fund receipts, payroll, depreciation, loan disbursement/repayment, disposal
- [x] **Number sequences needed** — Voucher, JE, PR, PO, GRN, Asset, Employee, Beneficiary, Enrollment, Loan, Grant, Fund Receipt, Tender, Contract, etc.
- [x] **Financial integrity rules** — Double-entry balance (Debit=Credit), segregation of duties, soft deletes for audit trail
- [x] **Testing guidelines per feature** — Input/Output/Impact documented for all modules
- [x] **Integration test scenarios** — 4 end-to-end flows covering the most critical business processes
- [x] **SaaS multi-tenancy** — `organizationId` on all tenant-scoped tables, SubscriptionPlan/TenantSubscription/PlatformFeature models, tenant isolation middleware
- [x] **Auth system** — Custom JWT with `jose` (adopted from LMS), RefreshToken DB-backed, impersonation support
- [x] **Subscription Guard** — FULL/READ_ONLY/BLOCKED access matrix based on 6 subscription states
- [x] **Storage adapter** — Local (dev) → R2 (prod) with quota tracking (adopted from LMS)
- [x] **Payment gateways** — Factory pattern: SSLCommerz, bKash, Stripe, Mock (adopted from LMS)
- [x] **Audit trail split** — SuperAdminAuditLog (platform) + TenantAuditLog (tenant) with impersonation flag
- [x] **Webhooks** — WebhookEndpoint + WebhookDelivery with retry mechanism
- [x] **Data retention** — DataRetentionPolicy + DataExportRequest for GDPR compliance
- [x] **Cron jobs** — 15 scheduled tasks for billing, quota, classification, backup, alerts
- [x] **No Docker/clustering** — Direct VPS deployment as specified
- [x] **API-centric** — All features accessible via REST APIs for third-party integration
- [x] **Standard practices** — UUIDs, pagination, consistent response format, Zod validation, RBAC, audit trail

---

## Critical Fixes (Post-Audit, Pre-Production)

> **Audit Date:** 2026-03-25
> **Audited:** Schema, APIs, security, business logic, inter-module consistency

### Fix 1: Auto Journal Entry Creation on Approvals ✅ completed ✅ tested
**Severity:** CRITICAL — Double-entry accounting broken without this

These operations MUST auto-create posted JournalEntries (like Fund Receipt Confirm already does):

| Operation | Debit Account | Credit Account | Status |
|-----------|--------------|----------------|--------|
| **Voucher Approve (DV)** | Expense Account (from voucher context) | Bank/Cash Account | ⬜ TODO |
| **Voucher Approve (RV)** | Bank/Cash Account | Income Account | ⬜ TODO |
| **Payroll Approve** | Salary Expense (per project allocation) | Bank Account + PF Payable + TDS Payable | ⬜ TODO |
| **Depreciation Calculate** | Depreciation Expense | Accumulated Depreciation | ⬜ TODO |
| **Loan Disburse** | Loan Portfolio Outstanding (Asset) | Cash/Bank | ⬜ TODO |
| **Loan Repayment** | Cash/Bank | Loan Outstanding + Interest Income | ⬜ TODO |
| **Asset Disposal** | Cash (recovery) + Loss (if any) | Asset Account + Gain (if any) | ⬜ TODO |
| **Fund Receipt Confirm** | Bank Account | Grant Income | ✅ DONE |

> **Test (2026-03-25):** Voucher DV-2026-004 approved → JE auto-posted → Trial Balance Debit 50K = Credit 50K ✅

### Fix 2: Add organizationId to FundReceipt & Voucher ✅ completed ✅ tested
**Severity:** CRITICAL — Tenant isolation risk

- Add `organizationId String @db.Uuid` to `FundReceipt` and `Voucher` models
- Add `@@index([organizationId])` and `@@unique([organizationId, receiptNo/voucherNo])`
- Update ALL related API routes to filter by `organizationId` directly
- Run migration

### Fix 3: Next.js Middleware (Rate Limiting, CORS, Tenant Resolution) ✅ completed ✅ tested
**Severity:** CRITICAL — Security vulnerability

Create `src/middleware.ts`:
- Rate limiting: Login 5/15min/IP, Register 10/hr/IP, General 1000/hr/org
- CORS headers for cross-origin requests
- Tenant resolution from hostname (subdomain → slug, custom domain → lookup)
- Inject `x-organization-id` header into request context

### Fix 4: Zod Input Validation Schemas ✅ completed
**Severity:** CRITICAL — Invalid data can enter database

- Create Zod schemas in `src/lib/validators/` for each module
- Apply validation on ALL POST/PUT routes
- Return standardized error format with field-level details

### Fix 5: Password Policy Enhancement ✅ completed ✅ tested
**Severity:** HIGH — Security

- Min 8 chars + 1 uppercase + 1 lowercase + 1 digit + 1 special char
- Common password blacklist check
- Enforce `mustChangePassword` on first login

### Fix 6: BeneficiaryEnrollment Unique Constraint ✅ completed
**Severity:** HIGH — Data integrity

- Add `@@unique([beneficiaryId, projectId])` to schema
- Prevents same beneficiary enrolled twice in same project

### Fix 7: Missing Database Indexes ✅ completed
**Severity:** MEDIUM — Performance

Add indexes to:
- `BeneficiaryEnrollment(projectId)`
- `Activity(parentId)`
- `JournalEntry(fiscalYearId, projectId, date)` composite
- `ServiceDelivery(projectId, date)`
- `FundReceipt(donorId)`
- `LoanAccount(memberId, status)`
- `Attendance(employeeId, date)`

### Fix 8: File Upload Endpoint ✅ completed
**Severity:** HIGH — Core feature missing

- Create `POST /api/v1/upload` endpoint
- Uses storage adapter (local/R2)
- Validates file size, MIME type
- Creates Attachment record
- Returns storageKey + URL

### Fix 9: Tenant Audit Log Query API ✅ completed ✅ tested
**Severity:** MEDIUM — Compliance

- Create `GET /api/v1/reports/audit-trail` for tenant users
- Filter by: userId, action, module, resource, dateFrom, dateTo
- Paginated

---

## Important Features (For International Grade — After Critical Fixes)

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| 1 | Email notification system (approval alerts, deadline reminders) | ⬜ TODO | HIGH |
| 2 | PDF export (reports, vouchers, payslips, NGOAB forms) | ⬜ TODO | HIGH |
| 3 | i18n multi-language (Bangla/English) | ⬜ TODO | MEDIUM |
| 4 | Error logging & monitoring (Sentry) | ⬜ TODO | MEDIUM |
| 5 | CSV/Excel data export on all list endpoints | ⬜ TODO | MEDIUM |
| 6 | CSV/Excel data import | ⬜ TODO | LOW |
| 7 | Webhook dispatch logic (event → delivery → retry) | ⬜ TODO | LOW |
| 8 | Global search across modules | ⬜ TODO | LOW |

---

## New Dependencies Required (Phase 1)

```
# Auth (replacing NextAuth)
jose                    # JWT signing/verification
bcryptjs                # Password hashing

# Storage
@aws-sdk/client-s3      # Cloudflare R2 (S3-compatible)

# Validation
zod                     # Schema validation

# Database
prisma                  # Already in project (upgrade to 7.x)
@prisma/client          # Already in project

# Export
xlsx                    # Excel export
pdfkit / @react-pdf/renderer  # PDF generation

# Email
nodemailer              # Email sending (or Resend)

# Existing (keep)
next, react, react-dom, tailwindcss, shadcn, recharts, lucide-react, next-themes
```

---

---

## 9. Internationalization (i18n)

### 9.1 Architecture

Full 3-layer internationalization using `next-intl` (cookie-based, no URL prefix):

| Layer | Library/Approach | Description |
|-------|-----------------|-------------|
| **App-level i18n** | `next-intl` | All UI strings (labels, buttons, headers, status, errors) translatable |
| **Data-level localization** | JSON column (`localizedName`) | User-generated content stored as `{"en": "...", "bn": "..."}` |
| **Locale-aware display** | `Intl` API + `date-fns` locale | Dates, numbers, currency respect user locale |

### 9.2 Supported Locales

| Code | Language | Status |
|------|----------|--------|
| `en` | English | Default, complete |
| `bn` | Bengali (বাংলা) | Complete |

### 9.3 Message File Structure

```
src/messages/
  en/                        # English translations
    common.json              # ~150 keys: buttons, statuses, pagination, errors
    navigation.json          # ~90 keys: sidebar labels, app name
    auth.json                # Login, register, forgot/reset password
    dashboard.json           # KPIs, charts, analytics
    finance.json             # Chart of accounts, vouchers, JE
    budget.json, donors.json, projects.json, beneficiaries.json,
    procurement.json, assets.json, hr.json, microfinance.json,
    reports.json, settings.json, admin.json
  bn/                        # Bengali translations (mirror structure)
```

**Total: ~2,200 translation keys across 16 namespaces per locale.**

### 9.4 Key Files

| File | Purpose |
|------|---------|
| `src/i18n/config.ts` | Locale constants, display names |
| `src/i18n/request.ts` | Server-side locale resolution (reads `NEXT_LOCALE` cookie) |
| `src/hooks/use-formatters.ts` | Locale-aware currency/date/number formatting hook |
| `src/lib/formatters.ts` | Formatting functions (accept locale parameter) |
| `src/lib/localized-name.ts` | `getLocalizedName()` helper for data-level localization |
| `src/components/shared/language-switcher.tsx` | Globe dropdown: English ↔ বাংলা |
| `src/components/shared/localized-name-input.tsx` | Dual-locale (EN/BN) name input |

### 9.5 Locale Resolution Priority

1. **User** `preferredLanguage` (from User model)
2. **Organization** `defaultLanguage` (from Organization model)
3. **Default** `en`

Resolved locale is stored in `NEXT_LOCALE` cookie (set on login, register, and language switch).

### 9.6 Usage Patterns

**Server Components:**
```tsx
import { getTranslations, getLocale } from 'next-intl/server'

export default async function Page() {
  const t = await getTranslations('finance')
  const locale = await getLocale()
  return <h1>{t('title')}</h1>
}
```

**Client Components:**
```tsx
'use client'
import { useTranslations } from 'next-intl'
import { useFormatters } from '@/hooks/use-formatters'

export default function Page() {
  const t = useTranslations('finance')
  const { formatCurrency, formatDate } = useFormatters()
  return <span>{formatCurrency(50000)}</span>
}
```

**Data-level localization:**
```tsx
import { getLocalizedName } from '@/lib/localized-name'
const displayName = getLocalizedName(account.localizedName, account.name, locale)
```

### 9.7 Database Fields

| Model | Field | Type | Purpose |
|-------|-------|------|---------|
| Organization | `defaultLanguage` | `String @default("en")` | Org-level default locale |
| Organization | `localizedName` | `Json?` | `{"en": "...", "bn": "..."}` |
| User | `preferredLanguage` | `String?` | User-level locale override |
| Account | `localizedName` | `Json?` | Chart of accounts name localization |
| Employee | `localizedName` | `Json?` | Employee name localization |

### 9.8 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `PUT` | `/api/v1/settings/language` | Update user language preference + set cookie |

Login/Register APIs automatically set `NEXT_LOCALE` cookie based on user/org preferences.

---

> **Next Step:** Start Phase 1 implementation — Foundation & SaaS Core (Database, Auth, Super Admin, Tenant Setup, Core Infrastructure)
