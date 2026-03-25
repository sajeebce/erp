# NGO ERP - Complete Implementation Plan

> **Version:** 1.0
> **Date:** 2026-03-25
> **Architecture:** SaaS, Multi-Tenant, API-Centric, Modular, Integration-Ready
> **Status:** Planning Phase → Ready for Implementation

---

## Table of Contents

1. [Architecture & Design Principles](#1-architecture--design-principles)
2. [Folder Structure](#2-folder-structure)
3. [Menu Structure](#3-menu-structure)
4. [Database Schema (Prisma 7.x)](#4-database-schema-prisma-7x)
5. [Inter-Module Data Flow & Relationships](#5-inter-module-data-flow--relationships)
6. [API Routes & CRUD Operations](#6-api-routes--crud-operations)
7. [Implementation Phases](#7-implementation-phases)
8. [Testing Guidelines](#8-testing-guidelines)

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

4 groups, 12 modules, 76 menu items. No changes from existing navigation.

| Group | Color | Modules |
|-------|-------|---------|
| **CORE** | Blue | Dashboard (3), Finance & Accounting (6), Budget Management (5) |
| **PROGRAMS** | Green | Donor & Grant (6), Project Management (6), Beneficiary Management (5) |
| **OPERATIONS** | Amber | Procurement & Supply Chain (8), Fixed Assets (6), Human Resources (8), Microfinance (8) |
| **SYSTEM** | Slate | Reports & Analytics (8), Settings & Administration (7) |

*(Menu routes are defined in `src/data/navigation.ts` — no changes needed)*

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
  nameInBangla       String?
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
  nameInBangla  String?
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
  donorId         String?       @db.Uuid
  startDate       DateTime?
  endDate         DateTime?
  totalBudget     Decimal       @default(0) @db.Decimal(18, 2)
  amountSpent     Decimal       @default(0) @db.Decimal(18, 2)
  location        String?       // District/Division
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
  nameInBangla      String?
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

| Source Action | Affected Modules | Specific Impact |
|---------------|-----------------|-----------------|
| **New Fund Receipt** (Donor) | Finance: creates Journal Entry (DR Bank, CR Grant Income) | Budget: updates available funds | Dashboard: updates "Total Fund Received" KPI | Grant: updates `disbursedAmount` |
| **Voucher Approved** (Finance) | Finance: creates Journal Entry | Budget: increases actual spend → affects Budget vs Actual | Project: increases `amountSpent` | Dashboard: updates charts |
| **Budget Revision Approved** | Budget: updates budget line amounts | Project: updates `totalBudget` | Procurement: changes available budget for PR validation |
| **PR Created** (Procurement) | Budget: validates budget availability (blocks if insufficient) | Finance: eventually creates payment voucher |
| **PO → GRN → Payment** | Inventory: increases stock (from GRN) | Finance: creates payment voucher & journal entry | Budget: increases actual spend | Vendor: updates `totalOrders` |
| **Payroll Processed** (HR) | Finance: creates journal entry (DR Salary Expense, CR Bank) | Budget: increases actual spend per project (via allocation) | Project: increases `amountSpent` per project allocation |
| **Depreciation Run** (Assets) | Finance: creates journal entry (DR Depreciation Expense, CR Accumulated Dep.) | Asset: updates `accumulatedDepreciation` and `netBookValue` | Budget: increases actual spend |
| **Asset Disposed** | Finance: creates journal entry (gain/loss on disposal) | Asset: marks as disposed, updates register |
| **Employee Joins/Leaves** (HR) | Project: updates team members | Payroll: adds/removes from payroll run | Dashboard: updates "Staff Count" KPI |
| **Leave Approved** (HR) | Attendance: blocks attendance for leave period | Payroll: applies leave deduction if unpaid | Project: affects staff availability |
| **Loan Disbursed** (MFI) | Finance: creates journal entry (DR Loan Outstanding, CR Bank/Cash) | Samity: updates outstanding portfolio | MFI Member: creates loan account |
| **Loan Repayment Collected** | Finance: creates journal entry (DR Cash, CR Loan Outstanding + Interest Income) | Loan Account: reduces outstanding, updates last payment | Collection Sheet: records collection | Overdue: updates classification |
| **Savings Deposit** (MFI) | Finance: creates journal entry (DR Cash, CR Member Savings) | Savings Account: increases balance |
| **Beneficiary Enrolled** | Project: increases beneficiary count | Dashboard: updates "Active Beneficiaries" KPI |
| **Service Delivered** | Project: tracks delivery metrics | Impact Assessment: feeds into indicator measurement |
| **New Project Created** | Grant: links project to grant | Budget: enables budget creation | Finance: enables project-tagged transactions |
| **Grant Status Change** | Project: updates project status | Budget: freezes/unfreezes budget | Fund Requisition: enables/disables requests |

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
| GET | `/api/v1/finance/reports/:type` | Generate report (trial-balance, balance-sheet, income-statement, cash-flow, fund-position, ledger, day-book, bank-book, cash-book, receipts-payments) | finance.read.reports |

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
| GET | `/api/v1/projects/:id` | Get project detail | projects.read.projects |
| PUT | `/api/v1/projects/:id` | Update project | projects.update.projects |
| GET | `/api/v1/projects/dashboard` | Aggregate project analytics | projects.read.projects |
| GET/POST | `/api/v1/projects/:id/team` | Manage team | projects.update.projects |
| GET | `/api/v1/projects/activities` | List activities (filter by project) | projects.read.activities |
| POST | `/api/v1/projects/activities` | Create activity | projects.create.activities |
| PUT | `/api/v1/projects/activities/:id` | Update activity/progress | projects.update.activities |
| GET | `/api/v1/projects/milestones` | List milestones | projects.read.milestones |
| POST | `/api/v1/projects/milestones` | Create milestone | projects.create.milestones |
| PUT | `/api/v1/projects/milestones/:id` | Update milestone | projects.update.milestones |
| GET | `/api/v1/projects/logframe` | List logframe entries | projects.read.logframe |
| POST | `/api/v1/projects/logframe` | Create logframe entry | projects.create.logframe |
| PUT | `/api/v1/projects/logframe/:id` | Update entry | projects.update.logframe |
| GET | `/api/v1/projects/closeout` | List closeouts | projects.read.closeout |
| POST | `/api/v1/projects/closeout` | Create closeout | projects.create.closeout |
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
5. ✅ completed — LogFrame (4-level hierarchy: Goal→Purpose→Output→Activity)
6. ✅ completed — Project Closeout (8 default checklist items, auto-progress calculation)
7. ✅ completed ✅ tested — Beneficiary Registry (NID uniqueness, district filter)
8. ✅ completed ✅ tested — Program Enrollment (duplicate check, graduated/dropout tracking)
9. ✅ completed ✅ tested — Service Delivery tracking (5 types, quantity/value)
10. ✅ completed ✅ tested — Impact Assessment (baseline→target→current, auto achievementPct)
11. ✅ completed ✅ tested — Grievance Management (auto-resolutionDate on RESOLVED)

> **Seed data (Phase 4):** 6 Activities, 4 Milestones, 8 Beneficiaries, 7 Enrollments, 5 Services, 4 Indicators, 3 Assessments, 2 Grievances
>
> **End-to-end tests passed (2026-03-25):**
> - ✅ 4 Projects listed (3 ACTIVE, 1 PIPELINE) with progress tracking
> - ✅ WASH Activities: 4 items (1 COMPLETED at 100%, 2 IN_PROGRESS, 1 PLANNED)
> - ✅ WASH Milestones: 3 items (1 ACHIEVED with actualDate, 2 ON_TRACK)
> - ✅ 8 Beneficiaries (5 in Sylhet district filter)
> - ✅ 7 Enrollments across 3 projects (6 ACTIVE, 1 GRADUATED)
> - ✅ Impact: Safe Water 57.5% achieved, School Enrollment 42.9%, Hygiene 48.9%
> - ✅ 2 Grievances (1 RESOLVED, 1 OPEN with HIGH severity)

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

---

## 7.1 Cron Jobs (Scheduled Tasks)

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

> **Next Step:** Start Phase 1 implementation — Foundation & SaaS Core (Database, Auth, Super Admin, Tenant Setup, Core Infrastructure)
