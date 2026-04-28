# NGO ERP — Login Credentials & URLs

> **Last Updated:** 2026-03-25
> **Environment:** Development (localhost:4000)

---

## 🔑 Super Admin (Platform)

| Field | Value |
|-------|-------|
| **Login URL** | http://localhost:4000/admin/login |
| **Login API** | `POST /api/v1/admin/auth/login` |
| **Dashboard** | http://localhost:4000/admin/dashboard |
| **Email** | `admin@ngoerp.com` |
| **Password** | `SuperAdmin@2026` |
| **Token Type** | JWT (8 hour expiry) |

### Login via API:
```bash
curl -X POST http://localhost:4000/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ngoerp.com","password":"SuperAdmin@2026"}'
```

### Available Super Admin Endpoints:
- `GET /api/v1/admin/auth/me` — Profile + platform stats
- `GET /api/v1/admin/organizations` — List all tenants
- `GET /api/v1/admin/plans` — Subscription plans
- `GET /api/v1/admin/features` — Platform features
- `GET /api/v1/admin/subscriptions` — All subscriptions
- `GET /api/v1/admin/audit-log` — Super admin audit trail
- `GET /api/v1/admin/media-settings` — R2 storage config
- `POST /api/v1/admin/impersonate` — Impersonate tenant admin

---

## 🏢 Tenant Admin (CSS)

| Field | Value |
|-------|-------|
| **Login URL** | http://localhost:4000/login |
| **Register URL** | http://localhost:4000/register |
| **Dashboard URL** | http://localhost:4000/dashboard |
| **Org Slug** | `cssbd` |
| **Email** | `rahim@cssbd.org` |
| **Password** | `SecurePass@2026!` |
| **Role** | ADMIN (full access) |
| **Token Type** | JWT (15 min access + 7 day refresh) |

### Login via UI:
1. Go to http://localhost:4000/login
2. Organization: `cssbd`
3. Email: `rahim@cssbd.org`
4. Password: `SecurePass@2026!`

### Login via API:
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rahim@cssbd.org","password":"SecurePass@2026!","orgSlug":"cssbd"}'
```

---

## 👤 Tenant User (Finance Head)

| Field | Value |
|-------|-------|
| **Login URL** | http://localhost:4000/login |
| **Org Slug** | `cssbd` |
| **Email** | `fin@cssbd.org` |
| **Password** | `Finance@2026!` |
| **Role** | ADMIN (created during testing) |

---

## 📋 All UI Pages

### Auth (Public)
| Page | URL |
|------|-----|
| Login | http://localhost:4000/login |
| Register | http://localhost:4000/register |

### Dashboard (Requires Login)
| Page | URL |
|------|-----|
| Dashboard Overview | http://localhost:4000/dashboard |

### Finance
| Page | URL |
|------|-----|
| Chart of Accounts | http://localhost:4000/finance/chart-of-accounts |
| Journal Entries | http://localhost:4000/finance/journal-entries |
| Vouchers | http://localhost:4000/finance/vouchers |

### Budget
| Page | URL |
|------|-----|
| Budget List | http://localhost:4000/budget |

### Donors & Grants
| Page | URL |
|------|-----|
| Donor Directory | http://localhost:4000/donors |
| Grant Registry | http://localhost:4000/donors/grants |

### Projects
| Page | URL |
|------|-----|
| Project List | http://localhost:4000/projects |

### Beneficiaries
| Page | URL |
|------|-----|
| Beneficiary Registry | http://localhost:4000/beneficiaries |

### Procurement
| Page | URL |
|------|-----|
| Vendors | http://localhost:4000/procurement/vendors |
| Inventory | http://localhost:4000/procurement/inventory |

### Fixed Assets
| Page | URL |
|------|-----|
| Asset Register | http://localhost:4000/assets |

### Human Resources
| Page | URL |
|------|-----|
| Employee Directory | http://localhost:4000/hr |
| Leave Management | http://localhost:4000/hr/leave |

### Microfinance
| Page | URL |
|------|-----|
| Samity Management | http://localhost:4000/microfinance/samity |
| Loan Applications | http://localhost:4000/microfinance/loan-applications |

### Reports
| Page | URL |
|------|-----|
| Financial Reports | http://localhost:4000/reports/financial |
| NGOAB Reports | http://localhost:4000/reports/ngoab |

### Settings
| Page | URL |
|------|-----|
| Organization Setup | http://localhost:4000/settings/organization |

---

## 🔧 Seed Data Summary

| Entity | Count | Source |
|--------|-------|--------|
| Super Admin | 1 | `prisma/seed.ts` |
| Subscription Plans | 4 (Free, Starter, Professional, Enterprise) | `prisma/seed.ts` |
| Platform Features | 18 | `prisma/seed.ts` |
| Permissions | 456 | `prisma/seed.ts` |
| Currencies | 4 (BDT, USD, EUR, GBP) | `prisma/seed.ts` |
| Organization | 1 (CSS) | API register |
| Fiscal Year | 1 (FY 2025-2026, 12 periods) | API |
| Chart of Accounts | 11 accounts (3-level hierarchy) | API + seed |
| Donors | 5 (USAID, World Bank, UNICEF, DFID, EU) | `prisma/seed-phase3.ts` |
| Grants | 4 | `prisma/seed-phase3.ts` |
| Projects | 4 (WASH, Education, Climate, Food Security) | `prisma/seed-phase3.ts` |
| Budget | 1 with 5 line items (BDT 75L) | `prisma/seed-phase3.ts` |
| Fund Receipts | 2 (BDT 70L total) | `prisma/seed-phase3.ts` |
| Bank Account | 1 (Sonali Bank Mother Account) | `prisma/seed-phase3.ts` |
| Activities | 6 | `prisma/seed-phase4.ts` |
| Milestones | 4 | `prisma/seed-phase4.ts` |
| Beneficiaries | 8 | `prisma/seed-phase4.ts` |
| Enrollments | 7 | `prisma/seed-phase4.ts` |
| Service Deliveries | 5 | `prisma/seed-phase4.ts` |
| Impact Indicators | 4 | `prisma/seed-phase4.ts` |
| Impact Assessments | 3 | `prisma/seed-phase4.ts` |
| Grievances | 2 | `prisma/seed-phase4.ts` |
| Vendors | 3 | `prisma/seed-phase5.ts` |
| Warehouses | 2 | `prisma/seed-phase5.ts` |
| Inventory Items | 3 | `prisma/seed-phase5.ts` |
| Asset Categories | 3 | `prisma/seed-phase5.ts` |
| Assets | 4 | `prisma/seed-phase5.ts` |
| Departments | 5 | `prisma/seed-phase5.ts` |
| Designations | 7 | `prisma/seed-phase5.ts` |
| Employees | 6 | `prisma/seed-phase5.ts` |
| Leave Types | 5 | `prisma/seed-phase5.ts` |
| MFI Branches | 2 | `prisma/seed-phase5.ts` |
| Samities | 2 | `prisma/seed-phase5.ts` |
| MFI Members | 5 | `prisma/seed-phase5.ts` |
| Loan Products | 2 | `prisma/seed-phase5.ts` |
| Loan Accounts | 1 | `prisma/seed-phase5.ts` |
| Savings Accounts | 3 | `prisma/seed-phase5.ts` |

---

## 🔄 How to Reset & Re-seed

```bash
# 1. Reset database
psql -U postgres -c "DROP DATABASE ngo_erp; CREATE DATABASE ngo_erp;"

# 2. Push schema
npx prisma db push --url "postgresql://postgres:postgres@localhost:5432/ngo_erp?schema=public"

# 3. Run base seed
npx tsx prisma/seed.ts

# 4. Register org + create accounts (via running dev server on port 4000)
# ... (or use the curl commands from the test scripts)

# 5. Run phase seeds
npx tsx prisma/seed-phase3.ts
npx tsx prisma/seed-phase4.ts
npx tsx prisma/seed-phase5.ts
```

---

## 🔐 Password Policy

All passwords must meet:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 digit (0-9)
- At least 1 special character (!@#$%^&* etc.)
- Not a common password (password123, admin123, etc.)
