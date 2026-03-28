# Local Development Setup

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 24.x LTS | `node -v` |
| pnpm | 10.x | `pnpm -v` |
| PostgreSQL | 17.x+ | `psql --version` |

> **Windows note:** PostgreSQL `bin/` might not be in PATH. Default location: `C:\Program Files\PostgreSQL\17\bin\`

---

## 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd erp
pnpm install
```

---

## 2. Environment Setup

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://<user>:<password>@127.0.0.1:5432/ngo_erp?schema=public"
```

**Example:**

```env
DATABASE_URL="postgresql://postgres:yourpassword@127.0.0.1:5432/ngo_erp?schema=public"
```

> **Important:** Use `127.0.0.1` instead of `localhost` if PostgreSQL rejects IPv6 connections on Windows.
> URL-encode special characters in the password (e.g., `@` -> `%40`, `$` -> `%24`).

---

## 3. Create Database

```bash
# Windows (adjust path if needed)
set PGPASSWORD=yourpassword
"C:\Program Files\PostgreSQL\17\bin\psql" -U postgres -h 127.0.0.1 -c "CREATE DATABASE ngo_erp;"

# Linux/Mac
PGPASSWORD=yourpassword psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE ngo_erp;"
```

---

## 4. Push Schema & Generate Client

```bash
# Set DATABASE_URL in terminal (required for standalone Prisma CLI)
# Linux/Mac:
export DATABASE_URL="postgresql://postgres:yourpassword@127.0.0.1:5432/ngo_erp?schema=public"
# Windows (PowerShell):
$env:DATABASE_URL="postgresql://postgres:yourpassword@127.0.0.1:5432/ngo_erp?schema=public"

# Push schema to database
pnpm db:push

# Generate Prisma Client
pnpm db:generate
```

> **Note:** Prisma 7.x does not auto-load `.env` for CLI commands. You must export `DATABASE_URL` in your terminal session, or use a tool like `dotenv-cli`.

---

## 5. Seed the Database

Seeding happens in multiple phases:

### Phase 1: Base seed (Super Admin, Currencies, Plans, Permissions)

```bash
pnpm db:seed
```

### Phase 2: Register demo organization (requires dev server running)

Start the dev server first:

```bash
pnpm dev
```

Then register the demo organization via API:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "orgName": "Shapla Development Foundation",
    "orgSlug": "shapla-foundation",
    "fullName": "Abdur Rahim",
    "email": "rahim@shapla.org",
    "password": "SecurePass@2026!",
    "phone": "+8801712345678"
  }'
```

Save the `accessToken` from the response, then create a fiscal year:

```bash
curl -X POST http://localhost:3000/api/v1/settings/fiscal-years \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"name":"FY 2025-2026","startDate":"2025-07-01","endDate":"2026-06-30"}'
```

### Phase 3: Donors, Grants, Projects, Budgets

```bash
pnpm tsx prisma/seed-phase3.ts
```

### Phase 4: Activities, Milestones, Beneficiaries

```bash
pnpm tsx prisma/seed-phase4.ts
```

### Phase 5: Procurement, Assets, HR, Microfinance

```bash
pnpm tsx prisma/seed-phase5.ts
```

---

## 6. Run the Dev Server

```bash
pnpm dev
```

App will be available at **http://localhost:3000**

---

## Demo Credentials

### Super Admin (Platform)

| Field | Value |
|-------|-------|
| URL | http://localhost:3000/admin/login |
| Email | `admin@ngoerp.com` |
| Password | `SuperAdmin@2026` |

### Tenant Admin (Organization)

| Field | Value |
|-------|-------|
| URL | http://localhost:3000/login |
| Organization | `shapla-foundation` |
| Email | `rahim@shapla.org` |
| Password | `SecurePass@2026!` |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm db:seed` | Run base database seed |
| `pnpm db:studio` | Open Prisma Studio (GUI) |

---

## Reset & Re-seed

```bash
# Drop and recreate database
psql -U postgres -h 127.0.0.1 -c "DROP DATABASE ngo_erp; CREATE DATABASE ngo_erp;"

# Push schema
pnpm db:push

# Run all seeds (follow steps 5.1 through 5.5 above)
```

---

## Troubleshooting

- **`psql: command not found`** - Add PostgreSQL `bin/` to your PATH
- **`password authentication failed`** - Verify your PostgreSQL password and DATABASE_URL
- **`connection refused on localhost`** - Use `127.0.0.1` instead of `localhost`
- **Prisma CLI says `datasource.url required`** - Export `DATABASE_URL` in your terminal before running Prisma commands
- **Phase 3 seed fails with "Fiscal year not found"** - Create fiscal year via API first (see step 5.2)
- **Phase 3 seed fails with "null id"** - Chart of Accounts must exist; register org via API which creates default accounts, or create them manually
