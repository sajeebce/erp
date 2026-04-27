# Budget vs Actual Workflow Assessment and Plan

> Prepared: 2026-04-27
> Context: Client requirement review for Budget vs Actual workflow
> Scope: Current implementation assessment + recommended production workflow

## 1. Executive Verdict

`/budget/budget-vs-actual` page-ta **just UI na**. Eta **real API-backed functional page**.

But eta **fully enterprise-ready, fully governed, fully automated workflow** ekhono na.

Best one-line verdict:

- **Budget vs Actual page:** functional
- **Budget create flow:** functional
- **Budget status workflow:** functional but governance weak
- **Actual expense linkage:** functional through approved finance postings
- **Overspending alerts:** visual/analytical level-e partial
- **Role-based approval hardening:** incomplete
- **Department-wise budget reporting:** not fully modeled

So overall rating:

**Partially production-functional, strong demo-ready, but not yet fully hardened for strict enterprise controls.**

---

## 2. What I Reviewed

I reviewed:

- [CSS_MULTI_CONCERN_ARCHITECTURE_DISCUSSION.md](/E:/code/erp/docs/CSS_MULTI_CONCERN_ARCHITECTURE_DISCUSSION.md)
- [NGO_ERP_FEATURES.md](/E:/code/erp/docs/NGO_ERP_FEATURES.md)
- [budget-vs-actual page](/E:/code/erp/src/app/(dashboard)/budget/budget-vs-actual/page.tsx)
- [budget vs actual API](/E:/code/erp/src/app/api/v1/budget/[id]/vs-actual/route.ts)
- [budget API](/E:/code/erp/src/app/api/v1/budget/route.ts)
- [budget create page](/E:/code/erp/src/app/(dashboard)/budget/new/page.tsx)
- [budget detail page](/E:/code/erp/src/app/(dashboard)/budget/[id]/page.tsx)
- [budget status API](/E:/code/erp/src/app/api/v1/budget/[id]/status/route.ts)
- [voucher approval API](/E:/code/erp/src/app/api/v1/finance/vouchers/[id]/approve/route.ts)
- [budget schema](/E:/code/erp/prisma/schema/budget.prisma)

Note:

I could not directly open `http://192.168.50.128:4000/...` from this tool environment, so amar verdict code inspection-er base-e.

---

## 3. Current Functional Status

## 3.1 What is genuinely functional

### A. Budget Create

Functional.

Why:

- Budget create page live form
- projects, grants, fiscal years, accounts API theke load hoy
- submit korle `/api/v1/budget` call kore
- backend validation ache
- budget lines, account linkage, total reconciliation ache

### B. Budget Detail and Workflow Actions

Functional.

Why:

- budget detail page API theke data load kore
- draft/edit/delete ache
- submit / approve / reject / activate / close button ache
- status changes `/api/v1/budget/[id]/status` diye hoy

### C. Budget vs Actual Page

Functional.

Why:

- page mount-e `/api/v1/budget?limit=200` call kore budget list load kore
- selected budget-er jonne `/api/v1/budget/[id]/vs-actual` call kore
- summary cards real data diye populate hoy
- table, subtotals, grand total, chart, CSV export ache

### D. Actual Expense Pull Logic

Functional.

Why:

- API `approved journal entry lines` theke actual spend calculate kore
- budget line-er `accountId` and budget-er `projectId` diye matching hoy
- total actual, variance, utilization calculate hoy

### E. Finance Posting Source

Functional.

Why:

- voucher approve hole JE auto-create/post hote pare
- approved finance transactions project-er sathe linked thakte pare
- je line-gulo actual expense hisebe count hobe

---

## 3.2 What is functional but weak

### A. Budget Approval Governance

Workflow ache, but governance weak.

Problem:

- budget status API `requireAuthFromRequest` use kore
- mane authenticated user approve/activate/close action call korte parle role barrier weak
- `ADMIN` / `BUDGET_MANAGER` / `FINANCE_HEAD` style restriction ekhane enforced na

Conclusion:

- technically functional
- control perspective-e weak

### B. Overspending Alert

Partial.

What exists:

- utilization color coding
- row highlight
- `OVER_BUDGET` status
- `varianceThreshold` field schema and forms-e ache

What missing:

- threshold-driven auto alert engine
- notification
- approval block / escalation
- warning summary card

### C. Budget Analytics

Useful but mixed quality.

What is good:

- KPI cards
- utilization by project
- category pie
- burn rate

Weakness:

- monthly trend-er kichu calculation simulated distribution use kore
- pure transaction-date based actual monthly burn na

---

## 3.3 What is not fully implemented

### A. Department-wise real budget control

Not fully implemented.

Current budget model:

- project-centric
- grant optional
- no dedicated department dimension in Budget model

Implication:

- project-wise reporting strong
- department-wise client story demo kora jabe only indirect mapping diye
- true department budget later add korte hobe

### B. Full multi-level budget approval

Not fully implemented.

There is status workflow, but not:

- amount-based approval chain
- approval workflow definition binding
- approver hierarchy enforcement
- approval comments trail per step

### C. Complete actual-source normalization

Not fully implemented.

Actual spend now mostly approved JE/voucher based.

This is okay, but ideal enterprise model hobe:

- voucher
- petty cash
- expense claim
- advance settlement
- payroll allocation

sob-e standardized budget consumption layer-e aggregate kora.

---

## 4. Actual Workflow That Exists Today

Current system-e realistically nicher workflow cholte pare:

1. User budget create kore
2. Budget `DRAFT` thake
3. User submit kore
4. Kono authenticated user approve korte pare
5. Approved budget activate hoy
6. Finance voucher/journal approve/post kore
7. Project-linked JE lines actual spend hisebe count hoy
8. Budget vs Actual report oi approved actual tule dekhay

This is a working workflow.

But audit-grade ideal workflow ekhono na.

---

## 5. Recommended Proper Workflow

Client-er jonne ami nicher workflow recommend korbo.

## 5.1 Planning stage

1. Budget Manager budget create korbe
2. Mandatory fields:
   - budget name
   - project or business unit
   - fiscal year
   - line items
   - linked expense accounts
   - variance threshold

## 5.2 Approval stage

1. Budget Manager submit korbe
2. Department Head / Program Manager review korbe
3. Finance Head approve korbe
4. Admin or Finance activate korbe

Statuses:

- `DRAFT`
- `SUBMITTED`
- `APPROVED`
- `ACTIVE`
- `CLOSED`

## 5.3 Transaction stage

1. Actual expenses voucher / journal / petty cash / expense claim diye record hobe
2. Expense-er correct GL account thakte hobe
3. Expense-er correct project or future department/cost center tag thakte hobe
4. Transaction approve/post hole budget actual update hobe

## 5.4 Monitoring stage

1. Budget vs Actual report monthly review
2. Line-wise variance analysis
3. Category-wise trend analysis
4. Budget Analytics dashboard management use korbe

## 5.5 Exception stage

1. 80% utilization -> warning
2. 90% utilization -> critical review
3. 100%+ -> over-budget escalation
4. Need hole budget revision

## 5.6 Revision stage

1. Budget revision create
2. Reason document korte hobe
3. Approver approve korbe
4. Approved revision budget line update korbe

---

## 6. Best Client Demo Workflow

Client demo-r jonne safest and strongest flow:

1. Create project: `HQ Operations`
2. Create budget: `IT Equipment Budget FY2026`
3. Add 3 lines:
   - IT Equipment
   - Installation
   - Training
4. Submit budget
5. Approve budget
6. Activate budget
7. Create approved voucher(s) against same project and correct accounts
8. Open Budget vs Actual
9. Show:
   - total budget
   - total actual
   - total variance
   - overall utilization
10. Open Budget Analytics
11. Show burn rate and charts

---

## 7. Sample Scenario for Demo

### Budget

- Budget Name: `HQ IT Equipment Budget FY2026`
- Project: `HQ Operations`
- Total Budget: BDT 12,00,000

### Budget Lines

1. IT Equipment - BDT 10,00,000
2. Installation & Setup - BDT 1,00,000
3. Training & Orientation - BDT 1,00,000

### Actual Expense Entries

1. Laptop procurement voucher - BDT 9,50,000
2. Setup cost voucher - BDT 80,000
3. Training cost voucher - BDT 30,000

### Expected report result

- Budget: 12,00,000
- Actual: 10,60,000
- Variance: 1,40,000 favorable
- Utilization: 88.33%

This creates a very clean client story.

---

## 8. What to Tell the Client Honestly

### You can confidently say

- budget module is live, not mock-only
- budget vs actual report is generated from actual approved finance data
- project-wise tracking works
- line-wise variance analysis works
- chart-based dashboard exists

### You should not overclaim

- fully automated overspend alerts
- strict role-controlled budget approval
- true department/cost-center-wise budget control
- fully workflow-driven approval engine

### Correct positioning

"The module is functionally working and demo-ready. For enterprise-grade internal control, we should harden approval permissions, alerts, and department-level reporting."

---

## 9. Gaps to Fix Before Calling It Fully Functional

## Priority 1

1. Restrict budget status actions by role
2. Add approval comment trail
3. Ensure only approved/active budgets show in operational reporting where needed
4. Add warning summary for near-threshold budgets

## Priority 2

1. Add threshold alert logic
2. Add in-app/email notifications
3. Add dashboard card for over-budget budgets
4. Add drill-down from report row to source vouchers/JEs

## Priority 3

1. Add department / cost center dimension to budget model
2. Make monthly trend use actual posting dates
3. Bind budget workflow to approval workflow engine

---

## 10. Final Recommendation

For current client presentation:

- Use this as a **working module demo**
- Position it as **functional and strong for project-wise budget control**
- Avoid claiming fully hardened governance

Best implementation direction:

1. Keep project-wise workflow as immediate base
2. Harden approval permissions
3. Add alerting
4. Add department/cost-center dimension later

---

## 11. Final Workflow Plan

### Short-term production-worthy workflow

1. Budget Manager creates budget
2. Finance/Admin submits and approves budget
3. Budget becomes active
4. Actual expenses are recorded through approved vouchers/JEs
5. Budget vs Actual report is reviewed monthly
6. Over-budget items trigger manual management action
7. Budget revision is created if needed

### Long-term world-class workflow

1. Budget create by owner
2. multi-level approval
3. activation
4. live transaction-to-budget sync
5. threshold alerting
6. dashboard escalation
7. revision governance
8. project + department + business unit reporting

This is the workflow I recommend writing into the client solution plan.
