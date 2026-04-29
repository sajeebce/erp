# VPS Deployment And Seed Runbook

This document is for installing this ERP project on a fresh VPS and understanding exactly what seed data is created.

## Runtime Requirements

- Node.js: `>=20.9.0` because `next@16.1.6` requires it.
- Package manager: `pnpm`.
- Database: PostgreSQL.
- Process manager: `pm2` or `systemd` is recommended for production.
- Reverse proxy: Nginx/Caddy/Apache in front of the Next.js server.

## Environment

Create `.env` on the VPS. Do not commit it.

```env
NODE_ENV=production
DATABASE_URL="postgresql://<db_user>:<db_password>@127.0.0.1:5432/ngo_erp?schema=public"
ACCESS_TOKEN_SECRET="<strong-random-secret>"
REFRESH_TOKEN_SECRET="<strong-random-secret>"
SUPER_ADMIN_TOKEN_SECRET="<strong-random-secret>"
```

Notes:

- `DATABASE_URL` is required by `prisma.config.ts`.
- The app has fallback JWT secrets in code, but production must set the three token secrets above.
- The default local database name used by seed fallbacks is `ngo_erp`.
- Default app port from `package.json` is `4000` for `pnpm dev`. Production `next start` uses port `3000` unless `PORT` is set.

## Fresh VPS Install Commands

From the project root:

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm exec prisma migrate deploy
pnpm build
```

If migrations are not being used for a fresh staging/demo database, this repo has also been tested with:

```bash
pnpm exec prisma db push --accept-data-loss
```

Use `migrate deploy` for production whenever possible. Use `db push` only for controlled staging/demo installs or when intentionally syncing schema directly.

## Start Commands

Development:

```bash
pnpm dev
```

Production:

```bash
PORT=4000 pnpm start
```

Example PM2:

```bash
pm2 start "pnpm start" --name ngo-erp --time
pm2 save
```

## Seed Files

Total seed files in `prisma/`: **20**.

| # | File | Main purpose |
|---|---|---|
| 1 | `seed.ts` | Platform seed: super admin, currencies, subscription plans, platform features, permissions. This is what `pnpm db:seed` runs. |
| 2 | `seed-bootstrap.ts` | CSS tenant seed: organization, standard roles, admin user, fiscal year. Must run before tenant demo seeds. |
| 3 | `seed-css-operating-structure.ts` | CSS sectors, business units, cost centers, fund classes, operating locations. |
| 4 | `seed-accounts.ts` | CSS Bangladesh chart of accounts. |
| 5 | `seed-phase3.ts` | Donors, grants, projects, fund receipts, project finance starter data. |
| 6 | `seed-finance.ts` | Bank accounts, journal entries, vouchers, finance number sequences. |
| 7 | `seed-budget.ts` | Budgets and budget lines. Cleans/recreates budget demo data. |
| 8 | `seed-budget-extras.ts` | Budget revisions and cost allocation demo data. |
| 9 | `seed-phase4.ts` | Activities, milestones, beneficiaries, enrollments, services, impact. |
| 10 | `seed-phase5.ts` | Procurement, vendors, warehouses, inventory, assets, HR starter data, microfinance starter data. |
| 11 | `seed-phase8-hr.ts` | HR upgrade demo: recruitment, contracts, holidays, offboarding, grievances, disciplinary. |
| 12 | `seed-leave-balances.ts` | Leave balances and additional leave applications. |
| 13 | `seed-phase8b.ts` | Pension, gratuity, provident fund, onboarding checklists. |
| 14 | `seed-phase8c.ts` | Salary grades, salary structures, OKR, leave calendar, payroll lines, allocations. |
| 15 | `seed-phase12-hr-profile.ts` | Employee profile enhancements: emergency contacts, education, work history, dependents, skills, languages, certifications. |
| 16 | `seed-phase12b-employee-tabs.ts` | Employee tab demo data, documents, additional HR profile related data. |
| 17 | `seed-expenses.ts` | Daily expense management, categories, per diem, petty cash, expense claims, advances. |
| 18 | `seed-reconciliation.ts` | Bank reconciliation demo data. |
| 19 | `seed-training-demo.ts` | Training demo scenarios. |
| 20 | `seed-user-employee-link.ts` | Optional helper to link existing users to employee records in order. |

## Recommended Seed Order For Full Demo VPS

Run this on a fresh/demo database after schema setup:

```bash
pnpm db:seed
pnpm exec tsx prisma/seed-bootstrap.ts
pnpm exec tsx prisma/seed-css-operating-structure.ts
pnpm exec tsx prisma/seed-accounts.ts
pnpm exec tsx prisma/seed-phase3.ts
pnpm exec tsx prisma/seed-finance.ts
pnpm exec tsx prisma/seed-budget.ts
pnpm exec tsx prisma/seed-budget-extras.ts
pnpm exec tsx prisma/seed-phase4.ts
pnpm exec tsx prisma/seed-phase5.ts
pnpm exec tsx prisma/seed-phase8-hr.ts
pnpm exec tsx prisma/seed-leave-balances.ts
pnpm exec tsx prisma/seed-phase8b.ts
pnpm exec tsx prisma/seed-phase8c.ts
pnpm exec tsx prisma/seed-phase12-hr-profile.ts
pnpm exec tsx prisma/seed-phase12b-employee-tabs.ts
pnpm exec tsx prisma/seed-expenses.ts
pnpm exec tsx prisma/seed-reconciliation.ts
pnpm exec tsx prisma/seed-training-demo.ts
pnpm exec tsx prisma/seed-user-employee-link.ts
```

Important:

- Several demo seeds use `create`, not only `upsert`. Run the full sequence once on a fresh demo DB to avoid duplicates.
- `seed-bootstrap.ts`, `seed-css-operating-structure.ts`, and `seed-accounts.ts` are designed to be safer to rerun than many later demo seeds.
- `pnpm db:seed` does not run every seed file. It only runs `prisma/seed.ts`.

## Users Created By Seeds

### Platform Super Admin

Created by `prisma/seed.ts`.

| Email | Password | Purpose |
|---|---|---|
| `admin@ngoerp.com` | `SuperAdmin@2026` | Platform/super admin login. |

### CSS Tenant Admin

Created by `prisma/seed-bootstrap.ts`.

| Org slug | Email | Password | Role |
|---|---|---|---|
| `css` | `rahim@cssbd.org` | `SecurePass@2026!` | `ADMIN` |

### Purchase Workflow Demo Users

These users are expected by `docs/purchase.md`, but are not currently created automatically by `seed-bootstrap.ts`.

| Email | Intended role | Status |
|---|---|---|
| `kamal@cssbd.org` | `STAFF` | Create manually/API if the VPS must run purchase browser tests. |
| `shakil@cssbd.org` | `STORE_MANAGER` | Create manually/API if the VPS must run purchase browser tests. |
| `program@cssbd.org` | `PROGRAM_COORDINATOR` | Create manually/API for multi-step approval tests. |
| `finance@cssbd.org` | `FINANCE_MANAGER` | Create manually/API for multi-step approval tests. |
| `ed@cssbd.org` | `EXECUTIVE_DIRECTOR` | Create manually/API for high-value approval tests. |

Recommended password for demo/test-only users: `SecurePass@2026!`.

## Roles Created By Seeds

`prisma/seed-bootstrap.ts` and `POST /api/v1/settings/seed-roles` create or ensure these standard roles for the CSS tenant:

| Role | System role | Purpose |
|---|---:|---|
| `ADMIN` | Yes | Full tenant administration, purchase approval, PO creation, accounting posting. |
| `STAFF` | No | Create and track own purchase requisitions. |
| `STORE_MANAGER` | No | Goods receipt, inventory, warehouse, asset registration. |
| `PROGRAM_COORDINATOR` | No | Program coordination approval workflow step. |
| `FINANCE_MANAGER` | No | Finance approval workflow step. |
| `EXECUTIVE_DIRECTOR` | No | High-value executive approval workflow step. |

## Organization Created By Seeds

`prisma/seed-bootstrap.ts` creates the default demo tenant:

| Field | Value |
|---|---|
| Name | `CSS` |
| Slug | `css` |
| Email | `info@cssbd.org` |
| Base currency | `BDT` |
| Fiscal year start month | `7` |
| Languages | `en`, `bn` |

Note: Some older docs mention org slug `cssbd`, but the actual seed slug is `css`.

## Important Seeded Procurement Data

After the recommended full seed sequence:

- Vendors are created by `seed-phase5.ts`, including approved vendors such as `TechBD Solutions`, `Bengal Scientific Supplies`, and `Rahman Construction Ltd`.
- Warehouses are created by `seed-phase5.ts`, including `WH-DHK` and `WH-SYL`.
- Inventory items are created by `seed-phase5.ts`, including `WTK-001`, `TRP-001`, and `ORS-001`.
- Asset categories are created by `seed-phase5.ts`, including categories such as IT/equipment style asset categories depending on current seed data.
- Finance accounts are created by `seed-accounts.ts`.
- Bank/cash accounts are created by `seed-finance.ts`.
- Budgets are created by `seed-budget.ts`.

## Post-Install Verification

Check seed roles:

```bash
pnpm exec tsx -e "import { PrismaClient } from '@prisma/client'; import { PrismaPg } from '@prisma/adapter-pg'; import pg from 'pg'; const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }); const prisma = new PrismaClient({ adapter: new PrismaPg(pool) }); const org = await prisma.organization.findFirst({ where: { slug: 'css' } }); console.log(await prisma.role.findMany({ where: { organizationId: org?.id }, select: { name: true, isSystem: true }, orderBy: { name: 'asc' } })); await prisma.$disconnect(); await pool.end();"
```

Check seeded users:

```bash
pnpm exec tsx -e "import { PrismaClient } from '@prisma/client'; import { PrismaPg } from '@prisma/adapter-pg'; import pg from 'pg'; const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }); const prisma = new PrismaClient({ adapter: new PrismaPg(pool) }); const org = await prisma.organization.findFirst({ where: { slug: 'css' } }); console.log(await prisma.user.findMany({ where: { organizationId: org?.id }, select: { email: true, fullName: true, status: true, role: { select: { name: true } } }, orderBy: { email: 'asc' } })); await prisma.$disconnect(); await pool.end();"
```

Health checks:

```bash
pnpm lint
pnpm build
```

Known note: repo-wide TypeScript/build health can depend on in-progress module work. If deployment build fails, inspect the exact TypeScript errors before running production.

