# Multi-Concern Architecture

> Prepared: 2026-04-24
> Client context: CSS Bangladesh / group NGO with multiple sectors, concerns, programs, branches, and donor-funded projects
> Decision: Use one tenant with multi-dimensional operating and accounting dimensions. Do not create one tenant, legal entity, or ERP instance per concern.

---

## Purpose

This document is the master plan for making the ERP support a client that runs multiple permanent operating units, such as hospitals, institutes, microfinance operations, training centers, and social development programs.

Detailed module plans are kept separately:

- [Multi-Concern Accounting Plan](./multiconcern-accounting.md)
- [Multi-Concern HR Plan](./multiconcern-hr.md)

Implementation status and task-level verification rules are tracked in [Phase 13 of the Implementation Plan](./IMPLEMENTATION_PLAN.md#phase-13-multi-concern-accounting--operating-structure--in-progress).

Future module-specific plans can follow the same naming pattern, for example `multiconcern-procurement.md`, `multiconcern-assets.md`, and `multiconcern-microfinance.md`.

---

## Core Decision

CSS Bangladesh should be configured as one `Organization` / tenant.

Inside that tenant, the ERP must support multiple operating dimensions:

```text
Organization
  -> Sector
      -> BusinessUnit / Concern
          -> CostCenter
          -> Location / Branch
```

This keeps shared organization data centralized while allowing concern-wise HR, payroll, accounting, budget, project, donor, and dashboard reporting.

### Legal Entity Decision

CSS concerns are not separate legal entities for this implementation.

Therefore:

- do not add a separate `LegalEntity` model now
- do not create separate tenants per concern
- do not create separate statutory books per concern
- use `BusinessUnit` / `Concern` for operational and segment reporting
- keep statutory organization-level identity on `Organization`

If the client later confirms a concern has its own registration, TIN, VAT, bank compliance, or statutory audit requirement, a `LegalEntity` layer can be added above `BusinessUnit`. That is out of scope for the current plan.

---

## Why Project Is Not Enough

The existing system already supports `Project` and `Grant` in many modules. That is useful, but it is not enough for CSS-style operations.

A project is usually temporary and donor-funded. A concern is a permanent operating unit.

Examples:

- Reverend Abdul Wadud Memorial Hospital is a concern, not a project.
- CSS Nursing Institute is a concern, not a project.
- Micro Finance Program is a concern with many branches.
- HIV/AIDS Prevention can be a donor-funded project running under the Health sector.
- Hospital OPD, IPD, Pharmacy, and Lab are cost centers under a concern.

If concern and project are mixed into one field, reporting will be weak:

- Segment reporting becomes inaccurate.
- Payroll cost cannot be split properly.
- Donor reporting and concern performance reporting conflict.
- Branch or department reports become hard to audit.
- Consolidated dashboard cannot drill down cleanly.

---

## Target Master Data

### Sector

Top-level operating segment.

Examples:

- Health
- Education
- Economic Development
- Enterprise Development
- Special Development

### BusinessUnit / Concern

Permanent operating unit under a sector.

Examples:

- Reverend Abdul Wadud Memorial Hospital
- CSS Nursing Institute
- Hope Technical Institute
- Hope Polytechnic Institute
- Micro Finance Program
- CSS AVA Center
- CSS Press

### CostCenter

Operational department or cost/profit center under a concern.

Examples:

- OPD
- IPD
- Pharmacy
- Lab
- Admin
- Accounts
- Training
- Field Operations

### Location / Branch

Physical branch, office, clinic, school campus, or MFI branch.

Examples:

- Khulna Head Office
- Hospital Campus
- MFP Branch 001
- MFP Branch 002

### FundClass

Funding restriction class for NGO/fund accounting.

Examples:

- Unrestricted
- Restricted
- Temporarily Restricted
- Endowment

---

## Planned Setup URLs

The current application does not yet have multi-concern setup screens. The target setup entry point should be:

```text
/settings/operating-structure
```

Use tabs inside this page:

```text
Sectors
Business Units / Concerns
Cost Centers
Locations / Branches
Fund Classes
```

Optional direct URLs can be added later if the setup grows:

```text
/settings/sectors
/settings/business-units
/settings/cost-centers
/settings/locations
/settings/fund-classes
```

Recommended first-time setup order:

1. `/settings/organization` - create or confirm CSS organization profile.
2. `/settings/operating-structure` - create sectors, concerns, cost centers, locations, and fund classes.
3. `/finance/chart-of-accounts` - configure unified chart of accounts.
4. `/finance/bank-cash` - map bank and petty cash accounts to concern/fund context where needed.
5. `/donors` and `/donors/grants` - configure donor and grant master data.
6. `/projects` - create donor-funded projects and attach them to concern/fund context.
7. `/hr` - assign employees to primary concern, department, cost center, and location.
8. `/hr/cost-allocations` - allocate payroll cost across concern, cost center, project, grant, and fund class.

`/hr/cost-allocations` should replace or supersede the current project-only `/hr/project-allocations` flow.

---

## Shared vs Concern-Specific Data

Keep these shared at organization level:

- User accounts and role framework
- Chart of accounts template
- Fiscal years
- Salary components
- Leave types
- Designations
- Approval workflow engine
- Donor and grant master data
- Report builder framework

Make these concern-aware:

- Employees
- Departments
- Cost centers
- Job postings
- Employee contracts
- Payroll cost allocation
- Journal entry lines
- Vouchers and expense claims
- Bank accounts and petty cash funds
- Budgets and budget lines
- Procurement requests
- Assets
- Dashboards and reports

---

## Current Gap Summary

Based on the current codebase:

| Area | Current state | Required change |
| --- | --- | --- |
| Tenant | `Organization` exists | Keep CSS as one tenant |
| Project / Grant | Available in finance, budget, HR allocation | Keep, but do not use as concern |
| Sector | Project enum exists, no master operating sector | Add `Sector` master model |
| Concern | No `BusinessUnit` / `Concern` model | Add `BusinessUnit` model |
| Cost center | Some free-text / placeholder fields exist | Add real `CostCenter` model and FKs |
| Fund class | No fund restriction master model | Add `FundClass` model |
| Location / branch | MFI `Branch` exists, but no generic operating location | Add `OperatingLocation` or generalize `Branch` carefully |
| HR | Department and payroll are project-centric | Add concern-aware employee and payroll allocation |
| Accounting | Reports mostly filter by project | Add dimension filters and consolidated reports |
| Consolidation | Not implemented | Add after core dimension posting works |
| Legal entity | Not needed for CSS current scope | Keep one `Organization`; do not add `LegalEntity` |

---

## Gap Closure Checklist

These are the minimum gaps that must be closed before the multi-concern plan can be considered implemented.

### Foundation

- Add `Sector`, `BusinessUnit`, `CostCenter`, and `FundClass` models.
- Add either `OperatingLocation` or extend the current branch concept into a generic location model.
- Add `/settings/operating-structure` page with tabs.
- Add API endpoints for sectors, business units, cost centers, locations, and fund classes.
- Add CSS seed data for sectors, concerns, and initial cost centers.

### Accounting

- Add dimension FKs to `JournalEntryLine`.
- Add default dimension fields to voucher, petty cash, expense claim, advance, bank account, and budget records where useful.
- Update financial report APIs to filter by sector, business unit, cost center, fund class, project, and grant.
- Add concern-wise trial balance and income statement first.
- Add inter-concern transaction tracking after dimension posting is stable.

### HR

- Add primary concern/cost center/location fields to `Employee`.
- Add optional concern/cost center fields to `Department`, `EmployeeContract`, and `JobPosting`.
- Add `EmployeeCostAllocation`.
- Update payroll processing and budget impact to use `EmployeeCostAllocation`.
- Update payroll journal posting to create dimension-aware accounting lines.
- Rename or supersede project allocation UX with cost allocation UX.

### Navigation

- Add `Operating Structure` under Settings.
- Replace or supplement `HR -> Project Allocations` with `HR -> Cost Allocations`.
- Add report filters in Finance, Reports, HR Analytics, and Dashboard pages.

---

## Recommended Implementation Phases

### Phase 1: Core Dimension Foundation

Add shared operating-dimension models:

- `Sector`
- `BusinessUnit`
- `CostCenter`
- `FundClass`
- optional `OperatingLocation` or extend current `Branch` into a generic location model

Add settings pages and seed CSS demo structure.

### Phase 2: Accounting Dimension Posting

Update finance models, forms, APIs, reports, and dashboards so every relevant financial line can carry:

- `businessUnitId`
- `sectorId` derived from business unit
- `costCenterId`
- `fundClassId`
- `projectId`
- `grantId`

See [Multi-Concern Accounting Plan](./multiconcern-accounting.md).

### Phase 3: HR and Payroll Alignment

Update employee, department, recruitment, contract, payroll, and personnel cost tracking to use the same concern dimensions.

See [Multi-Concern HR Plan](./multiconcern-hr.md).

### Phase 4: Cross-Module Alignment

Apply the same dimensions to:

- Budget
- Procurement
- Assets
- Inventory
- Microfinance branches
- Beneficiary service delivery where relevant

### Phase 5: Consolidation and Elimination

After transaction posting is dimension-aware, add:

- consolidated reporting
- sector-wise rollups
- per-concern reports
- inter-concern transaction tracking
- elimination entries for internal transfers

---

## Reporting Goal

The dashboard and reports must support this drill-down:

```text
CSS Group
  -> Sector
      -> BusinessUnit / Concern
          -> CostCenter
              -> Project / Grant
```

Required report views:

- Group consolidated view
- Sector-wise view
- Concern-wise P&L, balance sheet, trial balance, cash/bank position
- Cost-center view
- Project/donor fund utilization
- Fund-class view
- HR/payroll cost by concern, department, project, and grant

---

## Accounting Standards Direction

The system should not claim automatic IFRS/IPSAS compliance only because dimensions exist. The dimensions are the required data foundation.

The architecture supports:

- segment reporting through `Sector` and `BusinessUnit`
- fund accounting through `FundClass`
- donor reporting through `Grant` and `Project`
- related-party / inter-unit disclosure through inter-concern transaction tracking
- consolidated reporting through group-level rollups and elimination entries

The actual report formats should be reviewed with the client's auditor before final acceptance.

---

## Non-Goals

Do not create:

- a separate tenant for each concern
- duplicate HR modules per concern
- duplicate chart of accounts per concern unless a legal/audit requirement demands it
- project records just to represent permanent concerns
- hard-coded CSS-only logic

The same design must work for other NGO groups later.

---

## Final Position

The project should move from project-only tagging to multi-dimensional operations.

The minimum winning architecture is:

```text
Organization + Sector + BusinessUnit + CostCenter + FundClass + Project + Grant
```

This is enough to meet CSS's multi-concern requirement without overengineering the ERP into separate systems.
