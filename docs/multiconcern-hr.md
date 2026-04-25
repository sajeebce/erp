# Multi-Concern HR Plan

> Prepared: 2026-04-24  
> Parent document: [Multi-Concern Architecture](./multiconcern.md)

---

## Goal

HR must support employees, recruitment, contracts, leave, attendance, payroll, and personnel cost reporting across multiple CSS concerns without duplicating the HR module.

The HR module should remain centralized, but every relevant HR record must know which concern, cost center, project, grant, and fund class it belongs to.

CSS concerns are not separate legal entities in the current scope. HR should therefore use `BusinessUnit` / `Concern` for assignment, payroll costing, approval routing, and reporting. Do not add a legal entity split to HR now.

---

## Current State

Based on the current codebase:

- `Employee` belongs to `Organization`.
- `Employee` has required `departmentId` and `designationId`.
- `Employee` has a free-text `costCenter`.
- `Department` belongs to `Organization`, but not to a concern.
- `EmployeeContract` supports `projectId`, `grantId`, and free-text `costCenter`.
- `EmployeeProjectAllocation` allocates salary cost to projects only.
- `PayrollBudgetAllocation` stores project-based payroll budget impact.
- Payroll processing creates employee payroll entries, but not concern-aware accounting splits.
- HR analytics and recruitment are department/project-oriented, not concern-oriented.
- No `LegalEntity` layer is required for the current CSS scope.

This is strong for a normal NGO HR module, but not enough for multi-concern HR and payroll accounting.

---

## Core HR Principle

Do not create separate HR modules per concern.

Use one HR module with concern-aware records:

```text
Employee
  -> primaryBusinessUnitId
  -> primaryCostCenterId
  -> departmentId
  -> designationId
  -> workLocationId

EmployeeCostAllocation
  -> businessUnitId
  -> costCenterId
  -> projectId
  -> grantId
  -> fundClassId
  -> percentage
```

This supports both simple and complex employees.

Examples:

- Hospital nurse: 100% Hospital / IPD
- Finance officer: 50% Head Office / Admin, 50% Hospital / Accounts
- Project coordinator: 100% Health sector / HIV/AIDS project / restricted grant
- MFP field officer: 100% Micro Finance Program / Branch 001

---

## Required HR Model Changes

### Department

Departments should be optionally scoped to a concern.

Add:

```text
businessUnitId?
costCenterId?
```

Reason:

- Some departments are organization-wide, such as central HR.
- Some departments are concern-specific, such as Hospital Pharmacy or MFP Branch Operations.

### Employee

Add:

```text
primaryBusinessUnitId
primaryCostCenterId?
workLocationId?
```

Keep `departmentId` and `designationId`.

Replace or deprecate free-text `costCenter` after migration.

### EmployeeContract

Add:

```text
businessUnitId
costCenterId?
fundClassId?
```

Keep:

```text
projectId?
grantId?
```

Reason:

- A contract can be tied to a concern and optionally a donor project.
- Project-based contracts should not be used to represent permanent concerns.

### JobPosting

Add:

```text
businessUnitId
costCenterId?
workLocationId?
projectId?
grantId?
```

Reason:

- Recruitment must show which concern is hiring.
- Public career portal can filter by concern/location.
- Hired applicant conversion can prefill employee concern assignment.

### EmployeeCostAllocation

Create a new allocation model and eventually replace `EmployeeProjectAllocation`.

Recommended fields:

```text
id
organizationId
employeeId
businessUnitId
costCenterId?
projectId?
grantId?
fundClassId?
budgetId?
budgetLineId?
percentage
startDate
endDate?
isActive
```

Validation:

- active allocations for one employee should total 100% for a payroll period, unless explicitly allowed
- `costCenterId` must belong to `businessUnitId`
- `projectId` and `grantId` must belong to the same organization
- `fundClassId` is required when grant/project funding rules require it

---

## Planned URLs

Master setup:

```text
/settings/operating-structure
```

HR pages that must consume these setup dimensions:

```text
/hr
/hr/employees/new
/hr/recruitment
/hr/contracts
/hr/payroll
/hr/cost-allocations
/hr/analytics
/hr/org-chart
```

The current project-only route can remain temporarily:

```text
/hr/project-allocations
```

But it should be superseded by:

```text
/hr/cost-allocations
```

That new page should allocate employees across business unit, cost center, project, grant, and fund class.

---

## Payroll Plan

Payroll can remain one monthly run per organization at first.

The payroll run should generate normal employee payroll entries, then split payroll cost using `EmployeeCostAllocation`.

Payroll cost output should support:

```text
PayrollEntry
  -> Employee
  -> Gross / deductions / net

PayrollCostAllocation
  -> PayrollEntry
  -> BusinessUnit
  -> CostCenter
  -> Project
  -> Grant
  -> FundClass
  -> Allocation percentage
  -> Gross amount
  -> Employer contribution
  -> Total charge
```

This should replace the current project-only `PayrollBudgetAllocation` design over time.

---

## Payroll Accounting Posting

When payroll is approved, accounting entries should be created from allocation lines.

Example:

```text
Debit: Salaries and Allowances
  businessUnitId = Hospital
  costCenterId = OPD
  projectId = HIV/AIDS Project
  grantId = Donor Grant A
  fundClassId = Restricted

Credit: Salary Payable
  businessUnitId = Hospital
  fundClassId = Restricted
```

For central liabilities such as TDS, PF, gratuity, and salary payable, define posting rules:

- expense line uses employee allocation dimensions
- liability line can use the employee allocation or a configured central business unit
- payment line uses bank/cash account business unit rules

The accounting plan is detailed in [Multi-Concern Accounting Plan](./multiconcern-accounting.md).

---

## Recruitment Flow

Recruitment should support concern-wise hiring.

Add concern fields to job postings and application conversion:

- `businessUnitId`
- `costCenterId`
- `workLocationId`
- optional `projectId`
- optional `grantId`

When a hired applicant is converted to employee:

- copy concern fields to employee
- create draft employee contract with same concern fields
- optionally create default `EmployeeCostAllocation`

---

## Leave and Attendance

Leave and attendance should remain employee-based.

Add concern filters to views and reports through employee assignment:

- team leave calendar by business unit
- attendance summary by business unit
- department-wise attendance under a business unit
- leave liability by concern if needed

No separate leave type is needed per concern unless the client has a policy difference.

---

## Organization Chart

Org chart should support multiple views:

- full organization chart
- sector chart
- business unit chart
- department chart
- project team chart

Reporting line can stay employee-to-employee, but UI filters should show concern structure clearly.

---

## HR Analytics

Add these dashboard/report dimensions:

- headcount by sector
- headcount by business unit
- headcount by cost center
- payroll cost by sector
- payroll cost by business unit
- payroll cost by project/grant
- recruitment pipeline by business unit
- turnover by business unit
- contract expiry by business unit
- training participation by business unit

---

## Migration Plan

1. Create `Sector`, `BusinessUnit`, `CostCenter`, and optional `OperatingLocation`.
2. Seed CSS sectors and concerns.
3. Add nullable concern fields to HR tables.
4. Backfill employee `primaryBusinessUnitId` from department/project/manual mapping.
5. Convert free-text employee/contract `costCenter` values into real `CostCenter` records.
6. Add `EmployeeCostAllocation` while keeping `EmployeeProjectAllocation` temporarily.
7. Update payroll budget impact to read from `EmployeeCostAllocation`.
8. Update payroll accounting posting to create dimension-aware journal lines.
9. Deprecate project-only allocation after reports are stable.

---

## Implementation Order

1. Add concern fields to employee, department, contract, and job posting.
2. Add `/settings/operating-structure` dropdown/API support for HR forms.
3. Add `/hr/cost-allocations`.
4. Update employee create/edit and recruitment conversion.
5. Add `EmployeeCostAllocation`.
6. Update payroll processing to create allocation output.
7. Update payroll budget impact report.
8. Update payroll journal posting.
9. Update HR dashboard and analytics filters.
10. Add CSS demo HR seed data.

---

## Acceptance Criteria

The HR update is acceptable when:

- every active employee has a primary concern
- every payroll cost can be reported by concern
- payroll can split one employee across multiple concerns/projects
- recruitment can be run for a specific concern
- employee contracts carry concern and funding context
- HR dashboards can filter by sector, concern, department, project, and grant
- payroll journal entries post with the same dimensions used by accounting reports

---

## Avoid Overengineering

Do not build:

- separate employee tables per concern
- separate payroll modules per concern
- separate leave systems per concern
- mandatory project assignment for every employee
- separate salary grade systems per concern unless the client has different pay policies

The practical approach is one HR module with dimension-aware records.
