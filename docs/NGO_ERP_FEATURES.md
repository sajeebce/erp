# NGO ERP System - Feature Analysis & Planning Document

> **Prepared:** February 2026
> **Target:** Bangladeshi NGO Organizations
> **Type:** UI Mockup Dashboard with Demo Data
> **Source:** NGO_ERP_Proposal.pptx Analysis + Online Research

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Target Users & Context](#target-users--context)
3. [Module-wise Feature Breakdown](#module-wise-feature-breakdown)
4. [Tech Stack (2026 Latest Stable)](#tech-stack-2026-latest-stable)
5. [UI/UX Design Direction](#uiux-design-direction)
6. [Menu Structure & Navigation](#menu-structure--navigation)
7. [Dashboard Overview](#dashboard-overview)

---

## Executive Summary

This document outlines the complete feature set for a **Bangladeshi NGO-specific ERP system**. The system is designed to address the unique challenges faced by NGOs operating in Bangladesh, including:

- **NGOAB (NGO Affairs Bureau) compliance** and reporting
- **Foreign Donations (Voluntary Activities) Regulation Act, 2016 (FDRA)** adherence
- **Microcredit Regulatory Authority (MRA)** compliance for microfinance NGOs
- Multi-project donor fund tracking with restricted/unrestricted fund separation
- Field office operations with offline capability
- Beneficiary management and impact tracking

---

## Target Users & Context

### Bangladeshi NGO Regulatory Requirements
- Annual reports submission to **NGO Affairs Bureau (NGOAB)**
- Audited financial statements by NGOAB-enlisted audit firms
- Foreign donations deposited into designated "mother account"
- Fund release only with NGOAB approval
- Project Proposal submission for foreign donation approval
- Expenditure vouchers retained for 5 years
- **FD-1 to FD-9 forms** for foreign donation reporting

### Target NGO Types
- Development NGOs (BRAC, ASA, Proshika type)
- Microfinance Institutions (MFIs)
- International NGOs operating in Bangladesh
- Community-based organizations
- Disaster relief organizations
- Health & education focused NGOs

---

## Module-wise Feature Breakdown

### 1. Dashboard (Main Overview)

| Feature | Description | Demo Data |
|---------|-------------|-----------|
| Key Metrics Cards | Total Fund Received, Fund Utilized, Active Projects, Active Beneficiaries | BDT 15.5 Cr received, 12.3 Cr utilized |
| Fund Utilization Chart | Pie/Donut chart showing fund allocation by project | 5 projects with different allocations |
| Project Timeline | Gantt-style view of active projects | 8 active projects |
| Recent Activities | Latest transactions, approvals, notifications | 20 recent items |
| Donor-wise Fund Status | Bar chart of top donors and their fund status | 10 donors |
| Compliance Alerts | Upcoming NGOAB deadlines, audit schedules | 3 upcoming deadlines |
| Budget vs Actual | Comparison chart across all projects | Monthly comparison |
| Quick Actions | Common tasks shortcuts | 6 quick action buttons |

---

### 2. Finance & Accounting Module

#### 2.1 Chart of Accounts
| Feature | Description |
|---------|-------------|
| Multi-level Account Taxonomy | Up to 5-level hierarchical account structure |
| Donor-specific Fund Codes | Separate fund codes per donor/project |
| Account Groups | Assets, Liabilities, Income, Expense, Equity |
| Account Templates | Pre-configured NGO-standard chart of accounts |
| Custom Account Creation | Add/edit/deactivate accounts |

#### 2.2 General Ledger
| Feature | Description |
|---------|-------------|
| Journal Entries | Debit/Credit entries with narration |
| Multi-currency Support | BDT, USD, EUR, GBP with auto-conversion |
| Inter-fund Transfers | Transfer between restricted/unrestricted funds |
| Bank Reconciliation | Automated matching with bank statements |
| Voucher Management | Payment, Receipt, Journal, Contra vouchers |
| Voucher Approval Workflow | Multi-level approval with role-based access |

#### 2.3 Financial Reporting
| Feature | Description |
|---------|-------------|
| Balance Sheet | Standard & donor-specific balance sheets |
| Income & Expenditure Statement | Project-wise and consolidated |
| Cash Flow Statement | Direct & indirect method |
| Trial Balance | Period-wise trial balance |
| Receipts & Payments Account | NGO-standard format |
| Fund Flow Statement | Donor fund flow tracking |
| Custom Report Builder | Drag-and-drop report designer |
| NGOAB Report Format (FD-1 to FD-9) | Auto-generated compliance reports |

#### 2.4 Bank & Cash Management
| Feature | Description |
|---------|-------------|
| Mother Account Tracking | NGOAB-required main account monitoring |
| Multi-bank Account Management | Track all organizational bank accounts |
| Cheque Management | Issue, track, reconcile cheques |
| Petty Cash | Field office petty cash management |
| Bank Statement Import | CSV/Excel import for reconciliation |

---

### 3. Budget Management Module

| Feature | Description |
|---------|-------------|
| Project-wise Budgeting | Create budgets per project/donor |
| Budget Line Items | Detailed line-item budgeting |
| Budget Revision | Track budget amendments with audit trail |
| Budget vs Actual | Real-time variance analysis |
| Budget Approval Workflow | Multi-level approval process |
| Donor Budget Format | Generate budgets in donor-required formats |
| Cost Allocation | Overhead cost distribution across projects |
| Budget Forecasting | Projected spending analysis |
| Budget Alerts | Notifications when budget thresholds reached (80%, 90%, 100%) |

---

### 4. Donor & Grant Management Module

| Feature | Description |
|---------|-------------|
| Donor Database | Complete donor profiles with contact info |
| Grant/Project Registration | Register new grants with terms & conditions |
| Fund Requisition | Request fund release from donors |
| Fund Receipt Tracking | Track incoming funds with reference numbers |
| Donor Reporting | Auto-generate donor-specific financial reports |
| Grant Lifecycle Tracking | Proposal > Approval > Implementation > Closeout |
| Donor Communication Log | Track all communications with donors |
| Compliance Checklist | Donor-specific compliance requirements |
| Donor Dashboard | Individual donor portal view |
| Restricted Fund Tracking | Track restricted vs unrestricted donations |
| In-kind Donation Tracking | Non-monetary donation management |

---

### 5. Project Management Module

| Feature | Description |
|---------|-------------|
| Project Registration | Create projects with goals, timeline, budget |
| Project Dashboard | Individual project overview with KPIs |
| Activity Planning | Work breakdown structure (WBS) |
| Milestone Tracking | Key deliverables and deadlines |
| Logical Framework (LogFrame) | Standard NGO logical framework matrix |
| Progress Monitoring | Activity completion tracking |
| Project Timeline (Gantt) | Visual timeline with dependencies |
| Project Team Management | Assign staff to projects |
| Project Documents | Document repository per project |
| Project Closeout | Formal project closure process |
| Multi-location Projects | Track activities across field offices |

---

### 6. Beneficiary Management Module

| Feature | Description |
|---------|-------------|
| Beneficiary Registration | Demographic data, photos, NID |
| Beneficiary Database | Searchable registry with filters |
| Program Enrollment | Enroll beneficiaries in programs |
| Service Delivery Tracking | Track services provided |
| Impact Assessment | Measure outcomes and impact indicators |
| Beneficiary Groups | Village/ward/union-level grouping |
| Beneficiary Cards | Generate ID cards |
| Follow-up Tracking | Schedule and track follow-ups |
| Grievance Management | Complaint registration and resolution |
| Data Privacy & Consent | GDPR-like consent management |

---

### 7. Supply Chain & Procurement Module

#### 7.1 Procurement
| Feature | Description |
|---------|-------------|
| Purchase Requisition | Request creation with budget validation |
| Purchase Order | PO generation with approval workflow |
| eTendering | Digital tender creation and bid management |
| Bid Evaluation | Comparative statement and scoring |
| Vendor Registration | Supplier onboarding with documentation |
| Vendor Performance | Supplier rating and evaluation |
| Contract Management | Track contracts, renewals, amendments |
| Procurement Committee | Committee formation and approval tracking |

#### 7.2 Inventory & Warehouse
| Feature | Description |
|---------|-------------|
| Stock Management | Real-time stock levels across locations |
| Multi-warehouse | Track inventory across field offices |
| Stock Transfer | Inter-warehouse transfer with tracking |
| Stock Valuation | FIFO, LIFO, Weighted Average |
| Reorder Alerts | Automated alerts for low stock |
| Asset Tagging | QR/Barcode-based asset tracking |
| Goods Receipt Note (GRN) | Receipt verification and documentation |
| Stock Audit | Physical count and reconciliation |

---

### 8. Fixed Asset Management Module

| Feature | Description |
|---------|-------------|
| Asset Register | Complete asset database with details |
| Asset Categories | Vehicle, Furniture, Equipment, IT, Land |
| Depreciation | Auto-calculate (Straight-line, WDV) |
| Asset Transfer | Track asset movement between locations |
| Asset Maintenance | Scheduled maintenance tracking |
| Asset Disposal | Disposal process with approval |
| Asset Insurance | Insurance tracking and renewal alerts |
| Asset Report | Category-wise, location-wise reports |
| Donor-wise Asset Tracking | Which donor funded which asset |

---

### 9. Human Resource Management Module

#### 9.1 Employee Management
| Feature | Description |
|---------|-------------|
| Employee Database | Complete personnel records |
| Employee Onboarding | Checklist-based onboarding process |
| Organization Chart | Visual hierarchy display |
| Employee Documents | Store certificates, NID, photos |
| Employee Portal (Self-service) | Personal info, payslips, leave requests |
| Project-wise Staff Allocation | Track staff across projects |

#### 9.2 Payroll & Benefits
| Feature | Description |
|---------|-------------|
| Salary Structure | Configure salary components |
| Payroll Processing | Monthly payroll calculation |
| Tax Calculation | Bangladesh income tax rules |
| Provident Fund | PF contribution tracking |
| Gratuity Calculation | Service-based gratuity |
| Salary Disbursement | Bank transfer file generation |
| Payslip Generation | Monthly payslip with breakdown |
| Project-wise Salary Allocation | Distribute salary cost across projects |

#### 9.3 Leave Management
| Feature | Description |
|---------|-------------|
| Leave Types | Annual, Sick, Casual, Maternity, etc. |
| Leave Application | Online application with approval |
| Leave Balance | Real-time balance tracking |
| Leave Calendar | Team-wise leave overview |
| Holiday Calendar | Bangladesh public holidays |
| Leave Policy | Configurable leave rules |

#### 9.4 Attendance & Time
| Feature | Description |
|---------|-------------|
| Daily Attendance | Check-in/check-out tracking |
| Field Visit Log | GPS-based field visit recording |
| Timesheet | Project-wise time allocation |
| Overtime Tracking | OT calculation and approval |
| Attendance Report | Monthly attendance summary |

#### 9.5 Performance Management (ePMS)
| Feature | Description |
|---------|-------------|
| KPI Setting | Define KPIs per role/project |
| Self-assessment | Employee self-review |
| 360-degree Feedback | Multi-rater evaluation |
| Mid-year Review | Half-yearly assessment |
| Annual Appraisal | Year-end performance review |
| Performance Report | Individual and team analytics |
| Development Plans | Training needs identification |

#### 9.6 Training & Development
| Feature | Description |
|---------|-------------|
| Training Calendar | Schedule training programs |
| Training Registration | Enroll employees in programs |
| Training Evaluation | Post-training assessment |
| Skill Matrix | Employee skill inventory |
| Certification Tracking | Track professional certifications |

---

### 10. Reports & Analytics Module

| Feature | Description |
|---------|-------------|
| Dashboard Analytics | Interactive charts and KPIs |
| Financial Reports | All standard financial statements |
| Donor Reports | Donor-specific fund utilization reports |
| NGOAB Compliance Reports | FD-1 to FD-9 forms auto-generation |
| Project Reports | Progress, budget, activity reports |
| HR Reports | Headcount, payroll, attendance analytics |
| Procurement Reports | Purchase analysis, vendor performance |
| Custom Report Builder | User-defined report templates |
| Export Options | PDF, Excel, CSV, Word export |
| Scheduled Reports | Auto-generate and email reports |
| Audit Trail | Complete system activity log |

---

### 11. Microfinance Module (for MFI-NGOs)

| Feature | Description |
|---------|-------------|
| Samity/Group Management | Create and manage borrower groups |
| Loan Product Configuration | Define loan types, rates, terms |
| Loan Application | Online application with approval workflow |
| Loan Disbursement | Disbursement tracking and documentation |
| Repayment Collection | Weekly/Monthly collection tracking |
| Collection Sheet | Digital collection sheet (replaces paper) |
| Savings Management | Member savings account tracking |
| Interest Calculation | Flat/Declining balance methods |
| Overdue Management | Aging analysis and follow-up |
| MRA Reports | Regulatory reports for MRA submission |
| Portfolio at Risk (PAR) | PAR-1, PAR-30, PAR-90 analysis |
| Branch-wise Dashboard | Performance by branch/area |

---

### 12. Settings & Administration Module

| Feature | Description |
|---------|-------------|
| Organization Setup | Company info, logo, fiscal year |
| User Management | Create/manage users with roles |
| Role & Permission | Granular role-based access control |
| Approval Workflow | Configure multi-level approvals |
| Email/SMS Templates | Communication template management |
| System Configuration | Currency, date format, language |
| Audit Log | System access and activity log |
| Data Backup | Scheduled backup management |
| Integration Settings | API keys, third-party connections |
| Multi-language Support | Bangla and English interface |
| Notification Settings | Configure alerts and notifications |

---

## Tech Stack (2026 Latest Stable)

### Frontend Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.1.x | React framework with App Router, Turbopack |
| **React** | 19.2.x | UI library with React Compiler |
| **TypeScript** | 6.0.x | Type-safe development (latest stable, bridge to TS 7 native) |

### UI & Styling
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Tailwind CSS** | 4.1.x | Utility-first CSS framework (Oxide engine) |
| **shadcn/ui** | Latest (Feb 2026) | Component library (unified Radix UI + Tailwind) |
| **Lucide React** | Latest | Icon library |
| **Recharts** | 3.x | Chart/graph library for dashboards |
| **Tremor** | Latest | Dashboard-specific data visualization |

### Backend & Database
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 24.x LTS | Server runtime |
| **PostgreSQL** | 18.x | Primary relational database |
| **Prisma** | 7.x | Type-safe ORM & migrations |
| **Redis** | 7.x | Caching, sessions, rate limiting |

### Monorepo & Build
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Turborepo** | 2.x | Monorepo task orchestration (uses `tasks` key) |
| **pnpm** | 10.x | Package manager (fast, disk-efficient) |

### Development Tools
| Technology | Version | Purpose |
|-----------|---------|---------|
| **ESLint** | 10.x | Code linting (flat config) |
| **Prettier** | Latest | Code formatting |

---

## UI/UX Design Direction

### 2026 Design Trends Applied

1. **Clean Minimalism** - Uncluttered layouts with ample whitespace
2. **Soft Color Palette** - Professional pastels with accent colors
3. **Dark/Light Mode** - Toggle between themes
4. **Glassmorphism Accents** - Subtle frosted glass effects on cards
5. **Smooth Animations** - Framer Motion for transitions
6. **Data-first Design** - Charts and metrics prominently displayed
7. **Responsive** - Desktop-first but fully mobile-responsive
8. **Accessibility** - WCAG 2.1 AA compliant

### Color Scheme

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Primary | `#2563EB` (Blue 600) | `#3B82F6` (Blue 500) |
| Secondary | `#059669` (Emerald 600) | `#10B981` (Emerald 500) |
| Accent | `#7C3AED` (Violet 600) | `#8B5CF6` (Violet 500) |
| Background | `#F8FAFC` (Slate 50) | `#0F172A` (Slate 900) |
| Surface | `#FFFFFF` | `#1E293B` (Slate 800) |
| Text Primary | `#0F172A` (Slate 900) | `#F1F5F9` (Slate 100) |
| Text Secondary | `#64748B` (Slate 500) | `#94A3B8` (Slate 400) |
| Success | `#16A34A` (Green 600) | `#22C55E` (Green 500) |
| Warning | `#D97706` (Amber 600) | `#F59E0B` (Amber 500) |
| Danger | `#DC2626` (Red 600) | `#EF4444` (Red 500) |

### Layout Structure

```
+--------------------------------------------------+
|  Top Navbar (Logo, Search, Notifications, User)  |
+--------+-----------------------------------------+
|        |                                         |
| Side   |  Main Content Area                      |
| bar    |                                         |
|        |  +-----------------------------------+  |
| Menu   |  | Breadcrumb                        |  |
|        |  +-----------------------------------+  |
|        |  |                                   |  |
|        |  |  Page Content                     |  |
|        |  |  (Cards, Tables, Charts, Forms)   |  |
|        |  |                                   |  |
|        |  +-----------------------------------+  |
|        |                                         |
+--------+-----------------------------------------+
```

---

## Menu Structure & Navigation

### Sidebar Menu

```
Dashboard
  ├── Overview
  ├── Analytics
  └── Activity Feed

Finance & Accounting
  ├── Chart of Accounts
  ├── Journal Entries
  ├── Vouchers (Payment/Receipt/Journal)
  ├── Bank Reconciliation
  ├── Bank & Cash Management
  └── Financial Reports

Budget Management
  ├── Budget List
  ├── Create Budget
  ├── Budget vs Actual
  ├── Budget Revision
  └── Cost Allocation

Donor & Grant Management
  ├── Donor Directory
  ├── Grant/Project Registry
  ├── Fund Receipts
  ├── Fund Requisitions
  ├── Donor Reports
  └── Grant Lifecycle

Project Management
  ├── Project List
  ├── Project Dashboard
  ├── Activity Planning
  ├── Milestone Tracking
  ├── LogFrame
  └── Project Closeout

Beneficiary Management
  ├── Beneficiary Registry
  ├── Program Enrollment
  ├── Service Delivery
  ├── Impact Assessment
  └── Grievance Management

Procurement & Supply Chain
  ├── Purchase Requisition
  ├── Purchase Orders
  ├── eTendering
  ├── Vendor Management
  ├── Contracts
  ├── Inventory
  ├── Warehouse Management
  └── Goods Receipt

Fixed Assets
  ├── Asset Register
  ├── Asset Categories
  ├── Depreciation Schedule
  ├── Asset Transfer
  ├── Maintenance
  └── Disposal

Human Resources
  ├── Employee Directory
  ├── Onboarding
  ├── Attendance
  ├── Leave Management
  ├── Payroll
  ├── Performance (ePMS)
  ├── Training
  └── Organization Chart

Microfinance (MFI)
  ├── Samity/Group Management
  ├── Loan Products
  ├── Loan Applications
  ├── Disbursement
  ├── Collection/Repayment
  ├── Savings
  ├── Overdue Management
  └── MRA Reports

Reports & Analytics
  ├── Financial Reports
  ├── NGOAB Reports (FD Forms)
  ├── Donor Reports
  ├── Project Reports
  ├── HR Reports
  ├── Procurement Reports
  ├── Custom Reports
  └── Audit Trail

Settings & Administration
  ├── Organization Setup
  ├── User Management
  ├── Roles & Permissions
  ├── Approval Workflows
  ├── Notification Settings
  ├── System Configuration
  └── Backup & Logs
```

---

## Dashboard Overview

### Main Dashboard Cards (KPIs)

| Card | Demo Value | Icon | Trend |
|------|-----------|------|-------|
| Total Fund Received | BDT 15,50,00,000 | Wallet | +12% from last year |
| Fund Utilized | BDT 12,30,00,000 | TrendingUp | 79.4% utilization |
| Active Projects | 8 | FolderOpen | 2 new this quarter |
| Active Beneficiaries | 45,230 | Users | +8% growth |
| Pending Approvals | 12 | Clock | 3 urgent |
| Staff Count | 285 | UserCheck | 15 field offices |
| Procurement in Progress | 5 | ShoppingCart | BDT 2.1 Cr value |
| Compliance Status | 95% | Shield | 1 pending report |

### Dashboard Charts

1. **Fund Utilization by Project** - Horizontal bar chart
2. **Monthly Income vs Expense** - Line chart (12 months)
3. **Donor Contribution Breakdown** - Donut chart
4. **Project Progress Overview** - Progress bars
5. **Budget vs Actual (Current Quarter)** - Grouped bar chart
6. **Beneficiary Growth Trend** - Area chart
7. **Upcoming Deadlines** - Timeline list
8. **Recent Transactions** - Table with latest 10 entries

---

## Research Sources

- [Leading ERP System in Bangladesh 2026 - AKIJ iBOS](https://ibos.io/leading-erp-system-in-bangladesh-2026-updated-guide/)
- [Top 10 ERP Software Companies in Bangladesh 2026 - Jibika Plexus](https://jibikaplexus.com/erp-software-in-bd/)
- [ERP for NGOs & Trusts 2026 - SysGenPro](https://sysgenpro.com/resources/erp-for-ngos-trusts)
- [What Is ERP for Nonprofits 2026 - Matiyas](https://www.matiyas.com/blog/best-erp-for-nonprofit-organizations/)
- [Nonprofit ERP Consulting - Panorama](https://www.panorama-consulting.com/government-solutions/nonprofit-organizations/)
- [Best Open-Source ERP for NGOs - NestorBird](https://nestorbird.com/erp-for-nonprofit-organizations/)
- [NGO Registration in Bangladesh 2025 - LegalSeba](https://legalseba.com/bd-services/ngo-registration-in-bangladesh/)
- [Next.js 16.1 - Official Blog](https://nextjs.org/blog/next-16-1)
- [React 19.2 - Official Blog](https://react.dev/blog/2025/10/01/react-19-2)
- [Best React UI Component Libraries 2026 - Untitled UI](https://www.untitledui.com/blog/react-component-libraries)
- [Dashboard Design Trends 2026 - Muzli](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/)
- [Best Dashboard Designs 2026 - WrapPixel](https://www.wrappixel.com/best-dashboard-designs/)
- [shadcn/ui - Official Site](https://www.shadcn.io)
- [United IT MicroFinance ERP](https://uniteditbd.com/united_it_microfinance.php)
- [ERPNext for Non-Profits](https://frappe.io/erpnext/for-non-profits)

---

> **Next Step:** User approval er por UI mockup implementation shuru hobe Next.js 16 + shadcn/ui + Tailwind CSS 4 diye. Prottek menu er jonno page toiri hobe demo data sahit.
