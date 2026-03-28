# NGO ERP System - Complete Module & Feature Report

> **Document Type:** Client Presentation & Feature Overview
> **Prepared:** February 2026
> **Version:** 2.0
> **Total Modules:** 12 | **Total Pages/Screens:** 84 | **Navigation Menu Items:** 76
> **Target:** NGO Organizations Operating in Bangladesh
> **Compliance:** NGOAB, FDRA 2016, MRA, Bangladesh Labour Act

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Module-wise Feature Details with Use Cases](#2-module-wise-feature-details-with-use-cases)
   - 2.1 [Dashboard](#21-dashboard)
   - 2.2 [Finance & Accounting](#22-finance--accounting)
   - 2.3 [Budget Management](#23-budget-management)
   - 2.4 [Donor & Grant Management](#24-donor--grant-management)
   - 2.5 [Project Management](#25-project-management)
   - 2.6 [Beneficiary Management](#26-beneficiary-management)
   - 2.7 [Procurement & Supply Chain](#27-procurement--supply-chain)
   - 2.8 [Fixed Assets](#28-fixed-assets)
   - 2.9 [Human Resources](#29-human-resources)
   - 2.10 [Microfinance (MFI)](#210-microfinance-mfi)
   - 2.11 [Reports & Analytics](#211-reports--analytics)
   - 2.12 [Settings & Administration](#212-settings--administration)
3. [Regulatory Compliance Summary](#3-regulatory-compliance-summary)
4. [Technology Stack](#4-technology-stack)
5. [Why This System](#5-why-this-system)

---

## 1. System Overview

This ERP system is purpose-built for **Bangladeshi NGOs, Development Organizations, and Microfinance Institutions (MFIs)**. Unlike generic ERP solutions, every module has been designed around the specific operational, financial, and regulatory needs of the NGO sector in Bangladesh.

### At a Glance

| Metric | Value |
|--------|-------|
| Total Modules | 12 |
| Total Screens/Pages | 84 |
| Navigation Menu Items | 76 |
| Compliance Frameworks | NGOAB, FDRA 2016, MRA, BLA 2006 |
| Currency | BDT (with multi-currency support for USD, EUR, GBP) |
| Language Support | English (Bangla UI planned) |
| Deployment | Cloud (VPS) or On-premise |
| Dark/Light Mode | Yes |
| Mobile Responsive | Yes |

---

## 2. Module-wise Feature Details with Use Cases

---

### 2.1 Dashboard

The central command center providing real-time organizational health at a glance.

---

#### 1. Overview
**Route:** `/dashboard`

**What it does:** Main dashboard with 8 KPI cards (Total Fund Received, Fund Utilized, Active Projects, Active Beneficiaries, Pending Approvals, Staff Count, Procurement Status, Compliance Status), 6 interactive charts (Fund Utilization by Project, Monthly Income vs Expense, Donor Contribution Breakdown, Project Progress, Budget vs Actual, Beneficiary Growth Trend), upcoming deadline alerts, and recent transaction table.

**Example Case:** Executive Director Rahim Saheb starts his morning by opening the Dashboard. At a glance, he sees that Fund Utilization is at 62% across 8 active projects, 3 pending approvals are waiting (2 vouchers + 1 leave request), and the WASH project in Sylhet has exceeded 80% budget utilization. He clicks on the "Pending Approvals" card to approve the urgent voucher for field office rent, then notices the "Budget vs Actual" chart showing the Education project is underspending — prompting him to call the Project Manager for an update.

**When to use:** Open this every morning as the first screen. Use it whenever you need a quick organizational health check — before board meetings, before donor calls, or when making urgent decisions. This is your "control room."

**Benefit:** Eliminates the need to ask multiple department heads "What's happening?" — everything is visible in one screen. Saves 1-2 hours daily that leadership typically spends collecting status updates. Decision-makers can act immediately on alerts instead of waiting for weekly reports.

---

#### 2. Analytics
**Route:** `/dashboard/analytics`

**What it does:** Advanced analytical views with trend analysis, year-over-year comparisons, and drill-down capability across all modules.

**Example Case:** Before the Annual General Meeting, the M&E Manager generates a year-over-year comparison: beneficiary count grew 35% (from 12,000 to 16,200), fund utilization improved from 78% to 89%, and project completion rate increased from 65% to 82%. She exports these trend charts as visuals for the Chairman's AGM presentation.

**When to use:** Use when preparing for board meetings, AGMs, donor review meetings, or strategic planning sessions. Also useful for quarterly performance reviews and annual report preparation.

**Benefit:** Provides data-driven evidence for organizational performance. Instead of manually compiling data from different departments into Excel, get automated trend analysis that tells the story of your organization's growth and impact.

---

#### 3. Activity Feed
**Route:** `/dashboard/activity-feed`

**What it does:** Real-time organizational activity stream showing all system actions — approvals, transactions, document uploads, user logins, and status changes across every module.

**Example Case:** Finance Head Nasima Apa notices an unusual pattern in the Activity Feed at 11 PM — someone logged in from an unfamiliar IP and exported the vendor payment report. She immediately checks the user was Karim from IT doing a scheduled data backup, not an unauthorized access. Without the feed, she might not have noticed until the next audit.

**When to use:** Check periodically to monitor organizational activity. Especially useful after weekends or holidays to catch up on what happened. Critical during audits when auditors ask "who did what and when."

**Benefit:** Complete transparency and accountability. Every action is logged — no one can claim "I didn't do that" or "I wasn't told." Reduces fraud risk and builds a culture of accountability. During donor audits, you can demonstrate exactly who approved what and when.

---

### 2.2 Finance & Accounting

Complete double-entry accounting system designed for NGO fund accounting with donor-wise fund segregation.

---

#### 4. Chart of Accounts
**Route:** `/finance/chart-of-accounts`

**What it does:** Multi-level (up to 5 levels) hierarchical account structure following NGO accounting standards. Pre-configured with Assets, Liabilities, Income, Expense, and Equity groups. Supports donor-specific fund codes and project-wise account mapping. Includes 30+ account heads with account codes, types, balances, and active/inactive status management.

**Example Case:** Your organization receives a new grant from UNICEF for a "Child Nutrition" project. The Finance Manager opens Chart of Accounts and creates new sub-accounts: "4102 - UNICEF Child Nutrition Income" under Income, "5201 - Nutrition Program Direct Costs" under Expenses, and "5202 - Nutrition Field Staff Salary" under Personnel. These accounts are tagged to the UNICEF grant so every transaction automatically links to the correct donor fund — ensuring UNICEF can see exactly where their money went.

**When to use:** At the start of every new project/grant (to set up fund-specific accounts), during annual financial year setup, or when restructuring the accounting framework. Also use when NGOAB or auditors request a specific account breakdown.

**Benefit:** Donor-wise fund segregation means you never mix funds. When USAID asks "show me only transactions against my grant," you can generate a report in seconds. Without this, finance teams spend days manually filtering Excel sheets. Also ensures NGOAB's FD-6 audit report is easily generated with proper account hierarchy.

---

#### 5. Journal Entries
**Route:** `/finance/journal-entries`

**What it does:** Double-entry journal voucher management. Create, review, and post journal entries with Entry No, Date, Description, Account mapping, Project linkage, Debit/Credit amounts, and approval Status (Posted/Draft/Pending Review). Tracks grant receipts, salary payments, rent, equipment purchases, training expenses, donor fund transfers, depreciation entries, and operational costs.

**Example Case:** BDT 50,00,000 is received from World Bank for the WASH project. The Accountant creates a journal entry: Debit "Bank - BRAC Bank A/C" BDT 50,00,000 and Credit "World Bank WASH Grant Income" BDT 50,00,000, tagged to Project "WASH Phase-3." The entry goes to "Pending Review" status. The Finance Head reviews, verifies the bank credit advice matches, and posts the entry. Now the fund is properly recorded and the Dashboard KPI "Total Fund Received" updates automatically.

**When to use:** Every financial transaction in the organization flows through journal entries — fund receipts, salary payments, bill payments, asset purchases, depreciation, adjusting entries, and closing entries. If money moves, a journal entry is created.

**Benefit:** Double-entry ensures your books always balance (Debit = Credit). The approval workflow prevents unauthorized entries — a junior accountant cannot post entries without senior review. Project linkage means every taka is traceable to a specific donor/grant. This is the foundation that makes all financial reports accurate and audit-ready.

---

#### 6. Vouchers
**Route:** `/finance/vouchers`

**What it does:** Comprehensive voucher register supporting multiple voucher types — Debit Voucher (DV), Receipt Voucher (RV), Cash Voucher (CV), Bank Voucher (BV), and Journal Voucher (JV). Each voucher tracks Voucher No, Type, Date, Description, Amount, Prepared By, Approved By, and Status (Approved/Pending/Draft). Multi-level approval workflow.

**Example Case:** Field Coordinator Mahbub needs to pay BDT 25,000 for renting a training venue in Sunamganj. He creates a Debit Voucher (DV-2026-045) with description "Venue rent for farmer training - Climate Adaptation project," attaches the rental agreement PDF, and submits. The Project Manager reviews and recommends. The Finance Head gives final approval. The cashier makes the payment and the voucher status changes to "Approved." When the auditor comes, the complete trail — who prepared, who approved, what document was attached — is all in one place.

**When to use:** Every payment (DV), every receipt (RV), every cash transaction (CV), every bank transaction (BV), and every adjustment (JV) requires a voucher. This is the daily workhorse of the finance team. NGOAB requires 5-year voucher retention — this system stores them permanently.

**Benefit:** Replaces physical voucher books and filing cabinets. No more searching through boxes of paper vouchers during audits. The multi-level approval prevents unauthorized payments — a voucher cannot be approved by the same person who prepared it. NGOAB auditors can review any voucher with full supporting documents in seconds.

---

#### 7. Bank Reconciliation
**Route:** `/finance/bank-reconciliation`

**What it does:** Automated bank statement matching and reconciliation. Displays all organizational bank accounts with Book Balance vs Bank Statement Balance comparison, Difference calculation, Last Reconciled Date, and reconciliation Status (Reconciled/Pending/Discrepancy). Supports NGOAB "mother account" tracking requirement.

**Example Case:** At month-end, the Finance Officer downloads the bank statement from Sonali Bank (the NGOAB-designated "mother account"). The system shows Book Balance BDT 85,20,000 but Bank Statement shows BDT 87,50,000 — a difference of BDT 2,30,000. She drills down and finds: BDT 1,50,000 is a cheque issued to a vendor that hasn't been presented yet, and BDT 80,000 is bank interest that wasn't recorded in the books. She records the interest as a journal entry, marks the cheque as "outstanding," and the reconciliation status turns green.

**When to use:** Monthly (mandatory), but ideally weekly for large-volume accounts. Always before generating financial reports. Critical before NGOAB FD-6 annual audit submission.

**Benefit:** Catches errors, fraud, and unauthorized transactions. If someone misappropriates funds, the discrepancy will show up during reconciliation. Ensures your financial reports reflect the true cash position. NGOAB specifically checks the "mother account" reconciliation — having it automated and up-to-date demonstrates strong financial governance.

---

#### 8. Bank & Cash
**Route:** `/finance/bank-cash`

**What it does:** Unified view of all cash and bank accounts. Tracks Account Code, Account Name, Type (Cash/Bank/Mobile Banking), Bank Name, masked Account Numbers, Current Balance, Currency, and Status. Includes Petty Cash, current accounts, savings accounts, and mobile banking (bKash).

**Example Case:** The ED needs to know "How much cash do we have right now?" before approving a BDT 15 lakh emergency procurement for flood relief materials. He opens Bank & Cash and sees: Sonali Bank: BDT 32,50,000, BRAC Bank: BDT 18,20,000, Petty Cash HQ: BDT 45,000, bKash: BDT 2,80,000 — Total: BDT 53,95,000. More than enough. He approves the procurement immediately. Without this screen, he would have had to call the Finance Head, who would check 4 different bank portals and 2 cash registers.

**When to use:** Before making any major financial decision (large payments, emergency spending). During cash flow planning. When field offices request fund transfers. For daily cash position monitoring.

**Benefit:** Real-time visibility of your entire financial position across all accounts — banks, cash boxes, mobile banking — in one screen. Prevents situations like "we thought we had money but the other account was empty." Essential for organizations with multiple bank accounts across different donors and projects.

---

#### 9. Financial Reports
**Route:** `/finance/financial-reports`

**What it does:** Report generation center with 10 standard financial reports organized by category: Trial Balance, Income Statement, Balance Sheet, Cash Flow Statement, Fund Position Report, Receipt & Payment Statement, Ledger Book, Day Book, Bank Book, and Cash Book. Each report shows last generated date with one-click generation.

**Example Case:** It's March 31 — fiscal year end. The Finance Manager needs to prepare the annual financial statements for the board meeting and NGOAB submission. She clicks "Balance Sheet" — generated in 10 seconds. "Income Statement" — done. "Cash Flow Statement" — done. "Fund Position Report" showing donor-wise fund balances — done. What used to take her team 2 weeks of manual Excel compilation is now done in under an hour. She exports all reports as PDF and sends to the Audit firm for their review.

**When to use:** Monthly closing (Trial Balance, Day Book), quarterly donor reporting (Fund Position Report, Receipt & Payment), annual NGOAB submission (full financial statements), and on-demand when donors or auditors request specific reports.

**Benefit:** One-click report generation eliminates weeks of manual work. Reports are always accurate because they pull directly from the journal entries — no manual data entry errors. Consistent formatting means your financial statements look professional every time. The Fund Position Report — which shows each donor's money separately — is the single most requested report by NGOAB, and this system generates it instantly.

---

### 2.3 Budget Management

Project-wise budgeting with real-time variance tracking and donor-format budget generation.

---

#### 10. Budget List
**Route:** `/budget`

**What it does:** Overview of all organizational budgets across projects. Shows project-wise budget allocation, utilization rates, and status tracking. Provides quick access to create, review, or revise budgets.

**Example Case:** The Finance Head opens Budget List to prepare for the quarterly review meeting. She sees 8 project budgets: WASH Phase-3 is at 65% utilization (on track), Education Enhancement is at only 30% utilization (severely underspending — needs attention), and Climate Adaptation has already used 85% with 6 months remaining (overspending risk). She flags Education and Climate projects for discussion in the meeting.

**When to use:** At the start of any financial review — weekly, monthly, or quarterly. When the ED asks "how are we doing on budget?" When planning new project budgets. Before any budget revision request.

**Benefit:** Gives a bird's-eye view of all budgets in seconds. Identifies underspending (which can lead to donor fund return — a serious problem) and overspending (which means you'll run out of money before project ends). Without this, you'd need to open each project budget separately in Excel.

---

#### 11. Create Budget
**Route:** `/budget/create`

**What it does:** Detailed line-item budget creation tool. Supports budget categories: Personnel, Operations, Equipment, Travel, Training, Admin, M&E, and Contingency. Each line item includes Budget Head, Description, Unit, Quantity, Unit Cost, and Total with notes. Automatically calculates Personnel Cost %, Direct Program Cost %, and Admin Ratio.

**Example Case:** You've just won a BDT 1.7 Crore WASH grant from UNICEF. The Program Manager and Finance Head sit together to create the budget. They add line items: Project Coordinator (1 person × 12 months × BDT 65,000 = BDT 7,80,000), Water Testing Kits (500 units × BDT 1,200 = BDT 6,00,000), Community Training (20 sessions × BDT 15,000 = BDT 3,00,000), etc. The system auto-calculates that Personnel is 38% of total budget and Admin Ratio is 8.5%. UNICEF's policy caps admin at 10% — you're within limits. The budget is saved, sent for approval, and becomes the baseline against which all spending is tracked.

**When to use:** When starting a new project/grant (to create the initial budget), when preparing donor proposals (budget is a required section), or when creating the annual organizational budget.

**Benefit:** Automatic ratio calculations prevent embarrassing situations where you submit a budget to a donor with admin costs exceeding their cap. Line-item detail ensures every taka is planned for. Once approved, this budget becomes the benchmark for the entire Budget vs Actual tracking — you'll always know if you're on track.

---

#### 12. Budget vs Actual
**Route:** `/budget/budget-vs-actual`

**What it does:** Real-time variance analysis comparing budgeted amounts against actual expenditures. Grouped by category (Personnel, Direct Program Costs, Operating Costs, Capital Expenditure, M&E) with Budget Amount, Actual Spent, Variance (amount & %), visual progress bars, and Status indicators (Under Budget/On Track/Over Budget). Color-coded positive/negative variances.

**Example Case:** Three months into the WASH project, the UNICEF Program Officer calls and asks "Are you spending according to plan?" The Project Manager opens Budget vs Actual and sees: Personnel is at 24% spent (should be ~25% — perfect), Field Equipment is at 45% (over budget — bulk purchase happened early), Travel is at 8% (underspent — field visits delayed due to floods). She explains to UNICEF that equipment was front-loaded by design, travel will catch up in Q2, and overall the project is at 27% burn rate against 25% timeline — essentially on track. UNICEF is satisfied with the transparent, data-backed answer.

**When to use:** Before every donor reporting period. During monthly finance reviews. When approving new expenditures ("do we have budget remaining for this?"). When planning budget revisions. Whenever a donor asks "where's my money going?"

**Benefit:** This is the single most powerful tool for donor confidence. Donors want to see that their money is being spent as planned. Color-coded variances make it instantly visible where attention is needed. Prevents the common NGO problem of "we didn't realize we overspent until the project ended." Early warning system for budget deviations allows corrective action before it's too late.

---

#### 13. Budget Revision
**Route:** `/budget/revision`

**What it does:** Budget amendment tracking with full audit trail. Columns: Revision No, Date, Project, Original Budget, Revised Budget, Change Amount, Change %, Reason, Approved By, and Status (Approved/Pending/Rejected). Ensures transparent budget modifications.

**Example Case:** The Climate Adaptation project needs to reallocate BDT 5,00,000 from "International Travel" (cancelled due to visa issues) to "Local Training" (increased demand from communities). The Project Manager creates Budget Revision #3: Original BDT 8,00,000 → Revised BDT 3,00,000 for Travel, Original BDT 12,00,000 → Revised BDT 17,00,000 for Training. Reason: "International workshop cancelled; reallocated to community-level capacity building per donor verbal approval dated 15-Jan-2026." The ED approves. Now when the auditor asks "why is training 42% over original budget?" — the approved revision with documented reason is already in the system.

**When to use:** Whenever you need to change a budget line item — reallocating funds between budget heads, increasing/decreasing total budget (with donor approval), or adjusting for unforeseen circumstances. Most donors allow 10-15% reallocation without formal approval; larger changes need documented revision.

**Benefit:** Maintains a complete audit trail of every budget change. Auditors and donors can see the original budget, every revision made, who approved it, and why. Without this, budget changes are made informally in Excel with no record, leading to audit findings like "budget was modified without proper authorization."

---

#### 14. Cost Allocation
**Route:** `/budget/cost-allocation`

**What it does:** Shared cost distribution across multiple projects. Matrix-style allocation showing Cost Items (Office Rent, Utilities, Admin Staff, Vehicle Costs, IT Infrastructure) distributed across projects with allocated amounts and percentages. Tracks Total Shared Costs, Projects Covered, and Average Admin Ratio.

**Example Case:** Your office rent is BDT 3,00,000/month. You have 5 active projects. How much rent should each project bear? The Cost Allocation module distributes it: WASH (30% — largest team), Education (25%), Health (20%), Climate (15%), Youth (10%). So WASH is charged BDT 90,000/month for rent. This allocation is applied to Vehicle Costs, Utilities, Admin Staff, and IT costs too. Now when USAID asks "how much of our grant goes to admin overhead?" — you have a documented, fair allocation methodology, not arbitrary numbers.

**When to use:** Monthly (when allocating shared costs to projects), during annual budget preparation, when calculating indirect cost rates for donor proposals, and during audits when asked to justify admin cost allocation.

**Benefit:** Transparent and defensible cost allocation methodology. Without this, organizations either: (a) charge all admin costs to one project (unfair, donor may reject), or (b) make up random percentages (audit risk). This system provides a documented, systematic approach. Major donors like USAID and EU specifically ask for cost allocation methodology — having it built into the system demonstrates financial maturity.

---

### 2.4 Donor & Grant Management

End-to-end donor relationship and grant lifecycle management with restricted fund tracking.

---

#### 15. Donor Directory
**Route:** `/donors`

**What it does:** Complete donor database with profiles for all funding partners. Tracks Donor Name, Type (Bilateral/Multilateral/Foundation/Corporate), Country, Total Grants, Active Grants, Total Funded Amount, Contact Person, and Relationship Status.

**Example Case:** Your organization wants to approach JICA for a new agriculture project. Before writing the proposal, the Fundraising Coordinator opens Donor Directory and checks JICA's profile: they've funded 2 previous grants (both successfully closed), total funding of BDT 4.5 Crore, contact person is Mr. Tanaka at the Dhaka office. She also sees that the relationship status is "Active" with a note "Expressed interest in food security projects during last meeting." Armed with this history, she writes a targeted proposal referencing the successful past collaboration — significantly increasing the chance of approval.

**When to use:** Before approaching any donor for new funding (check relationship history), during fundraising strategy meetings, when preparing donor acknowledgement communications, and for annual donor engagement planning.

**Benefit:** Institutional memory about donor relationships. When staff turnover happens (common in NGOs), the new fundraising person doesn't start from zero — all donor history, contact details, and relationship notes are preserved. Prevents embarrassing situations like approaching a donor who already rejected you last month, or not knowing that a donor has specific sector preferences.

---

#### 16. Grant Registry
**Route:** `/donors/grants`

**What it does:** Centralized grant/project registry. Tracks Grant ID, Title, Donor, Award Amount, Disbursed Amount, Remaining Balance, Start/End Dates, and Status (Active/Closed/Pipeline/Suspended).

**Example Case:** The board asks "What is our total active grant portfolio?" The Finance Head opens Grant Registry and instantly answers: 6 active grants worth BDT 21.7 Crore total, BDT 14.2 Crore already disbursed, BDT 7.5 Crore remaining. 2 grants are in pipeline worth BDT 8 Crore. 3 grants closed this year. She also notices Grant GR-005 (EU Climate Fund) has only BDT 45 lakh remaining but 8 months left — she flags it for potential cost-extension request to EU before the funds run out.

**When to use:** For portfolio management — knowing how many grants are active, how much money is committed, what's in the pipeline. Before financial planning. When NGOAB asks for a list of all foreign-funded projects (FD-1 requirement). During board meetings for portfolio updates.

**Benefit:** Single source of truth for all grants. Prevents the common problem of "we forgot to track that grant" or "we didn't realize the grant was ending next month." The Remaining Balance column is crucial — it tells you exactly how much of each donor's money you still have, preventing over-commitment or under-utilization.

---

#### 17. Fund Receipts
**Route:** `/donors/fund-receipts`

**What it does:** Fund receipt voucher register tracking all incoming donations. Columns: Receipt No, Date, Donor, Grant, Amount, Currency (BDT/USD), Exchange Rate, BDT Equivalent, Bank Account, and Status (Received/Pending/Confirmed). Supports multi-currency receipt with automatic BDT conversion.

**Example Case:** USAID sends USD 125,000 for the Education project. The money arrives in the NGOAB-designated Sonali Bank "mother account." The Finance Officer creates a Fund Receipt: Amount USD 125,000, Exchange Rate 118.50, BDT Equivalent BDT 1,48,12,500, Bank: Sonali Bank Mother A/C. Status set to "Received." She then marks it "Confirmed" after bank verification. This receipt automatically updates the Grant Registry balance and the Dashboard "Total Fund Received" KPI. When filing NGOAB's FD-2 (Fund Release form), all receipt details are already documented.

**When to use:** Every time money is received from any donor — whether in BDT or foreign currency. Immediately upon bank confirmation of fund receipt. For NGOAB FD-2 and FD-7 (Fund Receipt Permission) compliance.

**Benefit:** Multi-currency tracking with exchange rate recording is critical for NGOAB compliance. The government wants to know exactly how much foreign currency was received, at what rate, and into which account. Without systematic tracking, organizations struggle to reconcile foreign donations during audits. Also prevents the "unrecorded donation" problem where money arrives but isn't properly logged.

---

#### 18. Fund Requisitions
**Route:** `/donors/fund-requisitions`

**What it does:** Fund requisition submission and tracking system. Manages internal requests for fund release from donors/grants. Tracks Requisition No, Date, Project, Grant, Amount Requested, Purpose, Requested By, and approval Status (Draft/Submitted/Approved/Disbursed/Rejected).

**Example Case:** The WASH Project Manager needs BDT 12,00,000 for next quarter's field activities. She creates a Fund Requisition: Project "WASH Phase-3," Grant "World Bank WB-WASH-2024," Amount BDT 12,00,000, Purpose "Q2 field implementation — 50 tubewell installations + 10 community training sessions." The Finance Head reviews the remaining grant balance (BDT 35 lakh available — sufficient), checks Budget vs Actual (the project is on track), and approves. The requisition is then forwarded to World Bank as a formal fund release request. When the money arrives, the requisition status changes to "Disbursed."

**When to use:** Whenever a project needs funds released from a donor grant. Before the start of each quarter (for quarterly fund requests). When NGOAB requires proof of fund release process (FD-2 compliance).

**Benefit:** Creates a formal, auditable fund release process. Donors and NGOAB want to see that funds are requested with proper justification and approved by authorized personnel — not just withdrawn casually. The approval workflow prevents unauthorized fund access. Also serves as a planning tool — project managers must think ahead about what funds they need and why.

---

#### 19. Donor Reports
**Route:** `/donors/reports`

**What it does:** Donor report management system. Tracks all reports due to donors: Report ID, Type (Financial/Narrative/Progress/Audit), Donor, Grant, Period, Due Date, Submitted Date, and Status (Draft/Under Review/Submitted/Accepted/Revision Required). Ensures timely donor reporting compliance.

**Example Case:** It's the 15th of the month. The Donor Reports page shows 3 reports in red (overdue): USAID Q4 Financial Report (due 5 days ago), UNICEF Semi-annual Narrative (due 2 days ago), and World Bank Progress Report (due yesterday). The Programs Director immediately assigns: Finance Manager to complete USAID financial, M&E Officer to finalize UNICEF narrative, WASH PM to submit World Bank progress. She calls USAID to explain the delay and promises submission by Friday. Without this tracking, the overdue reports might not have been noticed until the donor sent a stern reminder.

**When to use:** Weekly — to check upcoming deadlines and act early. Immediately after completing any donor report. During donor relationship management — timely reporting builds trust; late reporting damages it.

**Benefit:** Late donor reports can lead to funding suspension or even grant termination. This tracker ensures no report deadline is ever missed by surprise. The Status column (Accepted/Revision Required) also tracks whether donors accepted the report or asked for changes — useful for understanding which reports need improvement. Organizations with 5+ donors typically struggle to track 30-50 reports per year manually — this system makes it effortless.

---

#### 20. Grant Lifecycle
**Route:** `/donors/grant-lifecycle`

**What it does:** Visual grant lifecycle tracker showing each grant's progression through 6 stages: Identification → Proposal → Negotiation → Agreement → Implementation → Closeout. Card-based layout with stage progress indicators, overall progress bar, responsible person, key dates, and next action items with deadlines.

**Example Case:** The Fundraising Coordinator manages 12 grant opportunities at different stages. She opens Grant Lifecycle and sees: 3 grants in "Identification" stage (potential donors identified, concept notes being prepared), 2 in "Proposal" stage (full proposals submitted, waiting for response), 1 in "Negotiation" (budget revision requested by donor), 4 in "Implementation" (active projects), and 2 in "Closeout" (final reports being prepared). The card for "EU Food Security Grant" shows Next Action: "Submit revised budget by Feb 20" — she has 5 days. She assigns the Finance Manager to prepare the revision.

**When to use:** During fundraising strategy meetings. For pipeline management — understanding what grants are coming and when. For resource planning — knowing which grants are closing (staff may need reassignment) and which are starting (recruitment needed).

**Benefit:** Visualizes the entire grant pipeline from prospect to closure. Without this, grant opportunities fall through the cracks — "we forgot to submit the proposal on time" or "we didn't realize the grant was ending and didn't plan closeout activities." The 6-stage visual makes it easy for even non-finance staff to understand where each grant stands. Essential for organizational sustainability planning.

---

### 2.5 Project Management

Full project lifecycle management with LogFrame, activity planning, and milestone tracking.

---

#### 21. Project List
**Route:** `/projects`

**What it does:** Card-based project portfolio view showing all projects. Each project card displays: Name, Donor, Date Range, Location, Budget, Amount Spent, Progress bar with %, Team Member count, and Status (Active/Completed/Pipeline/On Hold).

**Example Case:** A new board member asks "What projects are we currently running?" Instead of pulling up a PowerPoint presentation, the Programs Director opens Project List: 5 Active projects (WASH in Sylhet, Education in Dhaka, Health in Chittagong, Climate in Barishal, Youth in Rangpur), 2 Completed (Sanitation 2024, Microfinance Expansion), 1 Pipeline (Food Security with EU). Each card shows progress — WASH is at 72%, Education at 45%, Health at 88% (nearly complete). The board member gets a complete picture in 30 seconds.

**When to use:** When anyone asks "what are we working on?" For portfolio-level project management. Before allocating new resources. When planning organizational capacity for new proposals.

**Benefit:** Visual portfolio view replaces lengthy project summary documents. Progress bars give instant status without reading detailed reports. Card layout makes it easy to spot projects that need attention (low progress, high budget utilization). Perfect for quick presentations to visitors, board members, or government officials.

---

#### 22. Project Dashboard
**Route:** `/projects/dashboard`

**What it does:** Comprehensive project performance analytics. Summary cards: Active Projects, Total Budget, Average Progress, Team Members. Activity overview: Total Activities, Completed, Delayed. Detailed performance table with project-wise Budget, Spent, Progress, Activity completion rates, Burn Rate analysis with color-coded overspend indicators.

**Example Case:** The Programs Director prepares for the monthly management meeting. The Project Dashboard shows: Average Progress across 5 projects is 61%, but one project (Climate Adaptation) has a burn rate of 78% against only 55% progress — meaning it's spending faster than it's delivering. Another project (Youth Employment) has 12 delayed activities out of 25. She prepares specific questions for both Project Managers and sets the meeting agenda around these two projects that need corrective action.

**When to use:** Monthly management meetings. When prioritizing which projects need attention. For comparative performance analysis across the portfolio. Before donor review meetings.

**Benefit:** Burn Rate analysis is the most critical metric here — it compares money spent vs. work completed. A project that spent 80% budget but completed only 50% activities is in trouble. This early warning system prevents project failures. Without it, problems are usually discovered only at the end when it's too late to fix.

---

#### 23. Activity Planning
**Route:** `/projects/activity-planning`

**What it does:** Work breakdown structure (WBS) and activity tracking. Manages activities across all projects with Activity ID, Name, Project, Responsible Person, Start/End Dates, Budget, Status (Planned/In Progress/Completed/Delayed), and % Complete with visual progress bars.

**Example Case:** The WASH Project Manager plans Q2 activities: "Install 50 tubewells in Sylhet Sadar" (Budget: BDT 15,00,000, Mar-May, assigned to Field Engineer Karim), "Conduct 10 hygiene awareness sessions" (Budget: BDT 1,50,000, April, assigned to Community Mobilizer Fatema), "Water quality testing in 3 unions" (Budget: BDT 2,00,000, May, assigned to Lab Technician Rafiq). Each activity has a responsible person, budget, and timeline. As work progresses, field staff update completion %. The PM can see at a glance: 3 activities completed, 5 in progress, 2 delayed (marked in red).

**When to use:** At project start (to plan all activities), weekly (to update progress), during team meetings (to review what's on track and what's delayed), and for donor progress reporting.

**Benefit:** Converts a project from a vague "we're working on it" to specific, measurable activities with owners and deadlines. The "Delayed" status flag ensures no activity silently falls behind. Budget-per-activity tracking prevents "we did all activities but ran out of money for the last 3." This is the operational backbone that turns project plans into actual delivery.

---

#### 24. Milestone Tracking
**Route:** `/projects/milestones`

**What it does:** Key deliverable and deadline management. Tracks Milestone ID, Description, Project, Target Date, Actual Date, Deliverable, and Status (Achieved/On Track/At Risk/Overdue). Ensures project deliverables are met on schedule.

**Example Case:** The Education project has 8 milestones. Milestone 3: "Complete 50 teacher training sessions by June 30" — Status: On Track (38 completed, 12 scheduled). Milestone 5: "Distribute textbooks to 10,000 students by August 15" — Status: At Risk (procurement delayed, vendor has delivery issues). The Project Manager sees "At Risk" and immediately contacts the Procurement team to expedite or find an alternate vendor. Milestone 7: "Submit mid-term evaluation report to DFID by September 30" — Status: Overdue (it's October 5). She prioritizes this immediately.

**When to use:** Monthly review of all milestones. When preparing donor progress reports (donors care about milestones, not day-to-day activities). When a project seems to be drifting off-track. During project steering committee meetings.

**Benefit:** Milestones are the "big picture" deliverables that donors funded you to achieve. Missing a milestone can trigger donor concerns, fund suspension, or even grant termination. "At Risk" early warning allows corrective action before a milestone becomes "Overdue." This is different from Activity Planning — activities are the daily work; milestones are the major checkpoints that matter to donors and beneficiaries.

---

#### 25. LogFrame
**Route:** `/projects/logframe`

**What it does:** Standard NGO Logical Framework (LogFrame) matrix display. Structured view with 4 columns: Level (Goal/Purpose/Output/Activity), Narrative Summary, Objectively Verifiable Indicators (OVI), Means of Verification (MOV), and Assumptions.

**Example Case:** DFID requests the LogFrame for the Health project before their annual review visit. The M&E Officer opens the LogFrame page and shows: **Goal:** "Improved maternal and child health in Chittagong division." **Purpose:** "Increased access to quality healthcare for 50,000 women." **Output 1:** "200 community health workers trained" (OVI: Training completion certificates, MOV: Training records database). **Output 2:** "50 health camps conducted" (OVI: Health camp reports with patient counts, MOV: Camp registers + photos). DFID reviewers can see the logical chain from activities to outputs to purpose to goal — demonstrating that the project design is coherent.

**When to use:** During project design/proposal writing (LogFrame is a required attachment for most donors), during M&E reviews, and when donors visit for project review. Also used internally to ensure all activities logically contribute to the project goal.

**Benefit:** LogFrame is the international standard for development project planning used by virtually all major donors (DFID, EU, USAID, World Bank, UNICEF). Having it built into the system — rather than as a forgotten Word document — means it stays updated as the project evolves. Demonstrates to donors that your organization follows international best practices in project design and monitoring.

---

#### 26. Project Closeout
**Route:** `/projects/closeout`

**What it does:** Formal project closure management. Checklist-based closeout tracker covering: Final Financial Report, Final Narrative Report, Asset Disposition Plan, Lessons Learned Document, Donor Acknowledgement, Staff Transition Plan, Data Archival, and Final Audit. Shows completion % with per-item status.

**Example Case:** The Sanitation project ended on December 31. The Project Manager opens Closeout and sees the checklist: Final Financial Report ✅ (submitted Jan 15), Final Narrative Report ✅ (submitted Jan 20), Asset Disposition Plan ⏳ (in progress — 3 motorcycles and 15 laptops need to be transferred to the next project or returned to donor), Lessons Learned ❌ (not started), Staff Transition Plan ✅ (5 staff reassigned, 2 contracts ended), Data Archival ❌ (not started), Final Audit ⏳ (auditor scheduled for March). Overall: 43% complete. She knows exactly what's pending and assigns team members to complete each item.

**When to use:** When any project ends — whether successfully completed, terminated early, or suspended. The closeout process should start 2-3 months before the project end date. Also when donors ask "has the project been properly closed?"

**Benefit:** Proper project closeout is often neglected — projects "end" but final reports aren't submitted, assets aren't accounted for, and lessons aren't documented. This leads to audit findings and damages donor relationships. The checklist ensures nothing is forgotten. NGOAB specifically checks whether completed projects have submitted final financial reports and asset disposition plans. Incomplete closeout can delay approval for new project proposals.

---

### 2.6 Beneficiary Management

Comprehensive beneficiary tracking from registration through impact measurement.

---

#### 27. Beneficiary Registry
**Route:** `/beneficiaries`

**What it does:** Searchable beneficiary database. Tracks Beneficiary ID, Name, Father/Spouse Name, Age, Gender, District, Upazila, Union, NID Number, Program, Enrollment Date, and Status (Active/Graduated/Inactive). Covers all 8 divisions of Bangladesh.

**Example Case:** A USAID monitoring team visits and asks "Can you show us the beneficiary list for the WASH project in Sylhet Sadar?" The Project Manager filters: Program = WASH, District = Sylhet, Status = Active. Instantly, 1,847 beneficiaries appear with their names, NID numbers, enrollment dates, and union locations. The USAID team randomly selects 10 names for field verification. The data matches — building donor confidence in the organization's data quality. Without this registry, the team would have scrambled through field registers and Excel files across multiple offices.

**When to use:** During beneficiary registration (adding new beneficiaries), donor monitoring visits (showing beneficiary data), de-duplication checks (ensuring the same person isn't registered twice using NID), program graduation tracking, and government/NGOAB reporting on beneficiary numbers.

**Benefit:** Centralized beneficiary data eliminates duplicates — a common problem where the same person is counted in multiple programs (inflating impact numbers). NID-based tracking ensures data integrity. Searchable database means any beneficiary can be found in seconds during field visits. Geographic tagging (Division → District → Upazila → Union) enables targeted programming and geographic coverage analysis. This is the foundation for all impact reporting.

---

#### 28. Program Enrollment
**Route:** `/beneficiaries/enrollment`

**What it does:** Program enrollment tracking. Columns: Enrollment ID, Beneficiary Name, Program, Enrollment Date, District, Upazila, Services Assigned, and Status (Active/Graduated/Dropped Out/Waitlisted).

**Example Case:** The Education project is enrolling 500 children in a scholarship program. The Field Officer registers each child: Name, school, grade, guardian NID, and assigns services (textbooks + tuition fee + school uniform). The enrollment status shows: 420 Active, 15 Graduated (completed school), 8 Dropped Out (reasons documented: family migration, early marriage, economic hardship), 57 Waitlisted (budget insufficient for all applicants). The Dropout Rate of 1.8% is reported to DFID as evidence of strong retention. The 57 waitlisted children are prioritized if additional funds become available.

**When to use:** When onboarding new beneficiaries into any program. For tracking who is receiving what services. During donor reporting to show enrollment numbers and retention rates. When analyzing dropout patterns to improve program design.

**Benefit:** Tracks the complete beneficiary journey — from enrollment to graduation or dropout. Dropout tracking with reasons is critical for program improvement (if many drop out due to "distance," you know you need closer service points). Waitlist management ensures fairness and transparency. Service assignment creates accountability — each enrolled beneficiary has documented entitlements that can be verified during monitoring visits.

---

#### 29. Service Delivery
**Route:** `/beneficiaries/service-delivery`

**What it does:** Service delivery tracking system. Records every service provided: Service ID, Beneficiary, Service Type (Health Checkup/Training/Asset Distribution/Cash Transfer/Counseling), Date, Location, Delivered By, Quantity/Value, and Status (Delivered/Scheduled/Cancelled).

**Example Case:** In the Health project, Community Health Worker (CHW) Fatema conducted 45 health checkups in Union Panchagar last week. Each checkup is recorded: Beneficiary name, date, vitals checked, referral given (if any). She also distributed 200 iron tablets and 50 ORS packets — each with recipient name and quantity. When the District Health Office asks "how many health services did your NGO deliver this quarter?" — the answer is generated in seconds: 2,340 health checkups, 12,000 iron tablets distributed, 180 referrals made, 45 counseling sessions conducted. All disaggregated by location, beneficiary age, and gender.

**When to use:** Every time a service is delivered to a beneficiary — health checkup, training session, cash transfer, asset distribution. For generating service delivery reports for donors. During monitoring visits to verify services were actually delivered. For workload analysis of field staff.

**Benefit:** This is the evidence layer — proving that your organization actually delivered the services it promised. Without this, you have vague claims like "we served 5,000 beneficiaries" with no detail. With this, you have "we delivered 2,340 health checkups to 1,847 unique beneficiaries across 12 unions, conducted by 8 CHWs." This level of detail builds immense donor confidence and differentiates professional organizations from those making unverifiable claims.

---

#### 30. Impact Assessment
**Route:** `/beneficiaries/impact-assessment`

**What it does:** Outcome and impact measurement dashboard. Tracks 8 key indicators: Access to Safe Water, School Enrollment Rate, Maternal Health Visits, Income Increase, Loan Repayment Rate, Agricultural Yield, Training Completion Rate, Sanitation Coverage. Each indicator shows Baseline, Target, Current Value, Achievement %, Data Source, and Last Updated date. Color-coded progress bars.

**Example Case:** Before the annual donor conference, the M&E Director prepares impact data: "Access to Safe Water increased from 45% (baseline) to 78% (current) against a target of 85% — we're at 92% achievement." "School Enrollment Rate improved from 62% to 89%." "Average household income increased by 34% (target was 25% — exceeded!)." These numbers, backed by survey data with documented methodology, are presented to 15 donors at the conference. Three donors express interest in scaling up funding based on these proven results.

**When to use:** During donor reporting (especially annual/final reports), board presentations, fundraising proposals (showing past impact to attract new funding), media/PR communications, and internal strategic planning to understand what's working and what's not.

**Benefit:** Impact data is the ultimate "proof" that your organization is making a difference. Donors are increasingly demanding evidence-based results — "how many lives did you actually change?" Baseline-Target-Achievement tracking provides a clear, scientific framework. Color-coded progress (green/amber/red) makes it instantly visible which indicators are succeeding and which need more effort. This module turns your organization from "we think we're making impact" to "we can prove we're making impact with data."

---

#### 31. Grievance Management
**Route:** `/beneficiaries/grievances`

**What it does:** Beneficiary complaint and grievance redressal system. Tracks: Grievance ID, Date, Complainant Name, Category (Service Quality/Staff Behavior/Eligibility/Delay/Corruption), Description, Severity (High/Medium/Low), Assigned To, Resolution Date, and Status (Open/Under Investigation/Resolved/Closed). Calculates average resolution time.

**Example Case:** Beneficiary Halima Begum from Sunamganj calls the complaint hotline: "I was enrolled in the livelihood program but haven't received my sewing machine after 3 months, while my neighbor got hers in 2 weeks." The complaint is logged as Grievance GRV-2026-034, Category: "Delay," Severity: "Medium," assigned to Field Coordinator Mahbub. He investigates and finds the sewing machine was held up at the Sunamganj warehouse. He arranges delivery within 5 days and updates the resolution. Average resolution time across all grievances: 8.5 days. When USAID asks "Do you have a beneficiary feedback mechanism?" — you show them this system with resolution statistics.

**When to use:** When any beneficiary complaint is received — by phone, in person, or through community meetings. For tracking resolution timelines. During safeguarding reviews. When donors ask about accountability mechanisms.

**Benefit:** Demonstrates accountability to beneficiaries — the people your organization exists to serve. Many donors now require a formal grievance mechanism as a funding condition. The "Corruption" category specifically addresses the risk of staff misusing resources. Average resolution time is a key performance metric — shorter is better. Without a formal system, complaints are handled ad-hoc, resolution isn't tracked, and patterns (like repeated complaints about a specific staff member) aren't detected.

---

### 2.7 Procurement & Supply Chain

End-to-end procurement lifecycle from requisition to goods receipt with inventory management.

---

#### 32. Purchase Requisition
**Route:** `/procurement/requisitions`

**What it does:** Internal purchase request management. Tracks: PR No, Date, Requested By, Department, Project, Items Description, Estimated Cost, Priority (Urgent/High/Normal/Low), Approval Status (Draft/Submitted/Reviewed/Approved/Rejected/PO Created), and linked PO Reference. Ensures budget validation before procurement.

**Example Case:** Field Office Sylhet needs 500 water testing kits urgently for the WASH project. The Field Coordinator creates PR-2026-038: Items "Water Testing Kit (H2S Vials) x 500," Estimated Cost BDT 6,00,000, Priority "Urgent," Project "WASH Phase-3." The system checks: Budget remaining for "Field Equipment" = BDT 8,50,000 (sufficient). The Procurement Head reviews, verifies the specifications, and approves. A Purchase Order is generated and the PO reference (PO-2026-022) is linked back to this requisition. The complete chain — who requested, why, budget check, who approved — is documented.

**When to use:** Whenever any department needs to purchase anything — office supplies, project materials, equipment, services. Every purchase must start with a requisition. This is the entry point for all procurement.

**Benefit:** Budget validation before procurement prevents overspending — you can't request something if the budget doesn't have money for it. Priority flags ensure urgent needs (like emergency flood relief supplies) get fast-tracked while routine purchases follow normal timelines. The approval chain prevents unauthorized purchases. NGOAB and donors want to see a procurement process — this is it.

---

#### 33. Purchase Orders
**Route:** `/procurement/orders`

**What it does:** Purchase order management. Tracks PO No, Date, Vendor, Items Description, Delivery Date, Total Amount, Payment Terms, and Status (Draft/Issued/Partially Received/Completed/Cancelled). Links to approved requisitions.

**Example Case:** After PR-2026-038 is approved for 500 water testing kits, the Procurement Officer creates PO-2026-022 to "Bengal Scientific Supplies": Items "H2S Water Testing Vials x 500 @ BDT 1,200 each = BDT 6,00,000," Delivery Date "Feb 28, 2026," Payment Terms "30 days after delivery with inspection." The PO is sent to the vendor. When the kits arrive, the status changes to "Partially Received" (if only 400 came) or "Completed" (if all 500 came). The PO links back to the original requisition and forward to the Goods Receipt — creating a complete procurement trail.

**When to use:** After a Purchase Requisition is approved (to formally order from a vendor). For tracking delivery status. For vendor payment processing (payment is made against PO + Goods Receipt). For procurement audit trail.

**Benefit:** Creates a legally binding purchase document. Payment is only made when goods are received against a valid PO — preventing situations where money is paid without proper authorization. The PR → PO → GRN (Goods Receipt) → Payment chain is the gold standard of procurement governance that all major donors require. Without POs, procurement is informal and audit-risky.

---

#### 34. eTendering
**Route:** `/procurement/etendering`

**What it does:** Digital competitive bidding and tender management. Manages: Tender No, Title, Category, Publication Date, Closing Date, Estimated Value, Bids Received count, and Status (Open/Evaluation/Awarded/Cancelled). Ensures transparent and competitive procurement.

**Example Case:** The organization needs to construct a community health center in Chittagong (estimated cost BDT 45,00,000). Since this exceeds the direct purchase threshold, a tender is issued: "TND-2026-008 - Construction of Community Health Center, Sitakunda, Chittagong." The tender is published with technical specifications, bill of quantities, and closing date. 7 bids are received. The Evaluation Committee scores them on technical (60%) and financial (40%) criteria. "Rahman Construction Ltd" wins with the best combined score. The entire process — publication, bids received, evaluation scores, award decision — is documented in the system. When the EU auditor checks, the transparent process is demonstrated.

**When to use:** For all procurements above the organization's direct purchase threshold (typically BDT 5-10 lakh depending on donor policy). When donors require competitive bidding (most do for amounts above $5,000). For construction, large equipment purchases, and consultancy services.

**Benefit:** Transparent procurement is the #1 audit focus area for donors. eTendering documents that you gave fair opportunity to multiple vendors, evaluated objectively, and selected the best value — not just gave the contract to a friend. This protects your organization from fraud allegations. Major donors like USAID, EU, and World Bank have strict procurement policies — this system demonstrates compliance with all of them.

---

#### 35. Vendor Management
**Route:** `/procurement/vendors`

**What it does:** Vendor directory and performance tracking. Tracks Vendor ID, Company Name, Category, Contact Person, Phone, Email, Rating (1-5), Total Orders, and Active Status. Maintains approved vendor list.

**Example Case:** You need to buy 200 laptops. Before issuing a tender, the Procurement Head checks Vendor Management: "TechBD Solutions" — Rating 4.5/5, 12 past orders, always delivered on time. "CompuWorld" — Rating 2.8/5, 4 past orders, 2 had quality issues. "Digital Systems" — Rating 4.2/5, 8 past orders, competitive pricing. She invites TechBD, Digital Systems, and 2 new vendors for the tender. CompuWorld is excluded from the shortlist due to poor performance history. This data-driven vendor selection protects the organization from repeat bad experiences.

**When to use:** Before any procurement (to check vendor history and ratings), after each procurement (to update vendor ratings based on delivery performance), during annual vendor review, and when setting up an "approved vendor list" as required by many donor procurement policies.

**Benefit:** Institutional memory about vendors. Without this, when the Procurement Officer leaves, all knowledge about "which vendors are reliable" walks out the door. Rating history prevents repeating mistakes. Approved vendor lists are a donor requirement — having them systematically maintained (not in someone's notebook) demonstrates procurement maturity. Also useful for identifying vendor concentration risk (are you over-dependent on one supplier?).

---

#### 36. Contracts
**Route:** `/procurement/contracts`

**What it does:** Contract register for all organizational contracts. Tracks Contract No, Title, Vendor, Type (Supply/Service/Works/Consultancy), Start Date, End Date, Value, and Status (Active/Expired/Under Renewal/Terminated).

**Example Case:** The Admin Manager opens Contracts and sees 3 contracts expiring in the next 30 days: Office Security Service (BDT 4,80,000/year, expires March 15), Internet Service (BDT 1,80,000/year, expires March 20), and Office Cleaning (BDT 3,60,000/year, expires March 30). She starts the renewal process for security and internet (good performance, renew for another year) and decides to re-tender the cleaning contract (performance has been declining). Without this tracking, she might not have noticed the expiring contracts until the security guard didn't show up one morning.

**When to use:** For managing all active contracts. For expiry tracking (to plan renewals or re-tendering well in advance). During audits (to show all organizational commitments). For financial planning (to know recurring contractual obligations).

**Benefit:** Contract expiry alerts prevent service disruptions. Without centralized tracking, organizations often discover contract expirations too late — leading to service gaps or auto-renewals at unfavorable terms. The contract register also gives a clear picture of all financial commitments for budgeting. Donor auditors frequently ask "show me your contract register" — having it organized and up-to-date scores major points.

---

#### 37. Inventory
**Route:** `/procurement/inventory`

**What it does:** Real-time stock management across all locations. Tracks Item Code, Item Name, Category, Unit, Stock In Hand, Reorder Level, Unit Price, Total Value, and Status (In Stock/Low Stock/Out of Stock). Automated low-stock alerts.

**Example Case:** The Logistics Officer checks Inventory before the next flood season. Water purification tablets: 5,000 in stock, reorder level 2,000 — status "In Stock" (good). Tarpaulin sheets: 150 in stock, reorder level 500 — status "Low Stock" (need to order immediately). ORS packets: 0 in stock, reorder level 1,000 — status "Out of Stock" (emergency order needed). She creates Purchase Requisitions for tarpaulins and ORS immediately, ensuring the organization is ready when floods hit. Without this system, the stockout would only be discovered during the actual emergency — when it's too late.

**When to use:** Daily for warehouse staff (to update stock movements). Before any distribution activity (to confirm stock availability). For reorder planning. During physical stock verification (to compare system stock vs actual count). For financial reporting (inventory valuation).

**Benefit:** Prevents stockouts during critical operations — imagine running a health camp and discovering you have no medicine. Low-stock alerts enable proactive ordering. Real-time valuation helps financial reporting. Location-wise tracking prevents "we have stock in Dhaka warehouse but the field office in Sylhet is empty." Donor-funded items are tracked separately to ensure they're used for the intended purpose.

---

#### 38. Warehouse
**Route:** `/procurement/warehouse`

**What it does:** Multi-location store management. Shows all warehouse/store facilities: Store ID, Name, Location, Capacity %, Manager, Items Count, Total Value, and Status.

**Example Case:** The Supply Chain Manager needs to decide where to store 2 tonnes of flood relief materials just received. She opens Warehouse: Dhaka HQ is at 92% capacity (too full), Sylhet is at 65% (has space but far from the flood-prone area), Barishal is at 40% (nearest to flood zone and has space — perfect). She directs the shipment to Barishal warehouse. She also notices Chattogram warehouse is at 95% — she schedules redistribution of slow-moving items to Rangpur (at 55%) to free up space.

**When to use:** When deciding where to store incoming goods. For capacity planning before large procurements. During redistribution of materials between locations. For annual warehouse audit and stock verification.

**Benefit:** Multi-location visibility prevents the "Dhaka hoarding" problem where everything gets stored at HQ while field offices struggle. Capacity tracking prevents overloading (fire/safety risk). Having a dedicated warehouse manager for each location creates accountability. Total value per warehouse is important for insurance purposes and financial reporting.

---

#### 39. Goods Receipt
**Route:** `/procurement/goods-receipt`

**What it does:** Goods receipt note (GRN) management for received items. Tracks GRN No, Date, PO Reference, Vendor, Items, Quantity Ordered vs Received, Inspection Status (Passed/Failed/Partial), Received By, and Status (Pending Inspection/Accepted/Rejected/Partial).

**Example Case:** 500 water testing kits ordered via PO-2026-022 arrive at the Sylhet warehouse. The Store Manager opens Goods Receipt and creates GRN-2026-045: Quantity Ordered 500, Quantity Received 480 (20 short). He inspects: 470 pass quality check, 10 are damaged. Status: "Partial" (received 480 of 500, accepted 470, rejected 10). He notifies the vendor about the 20 undelivered and 10 damaged units. Payment is processed only for 470 accepted units (BDT 5,64,000 instead of BDT 6,00,000). The vendor delivers the remaining 30 units in the next shipment, recorded as a separate GRN.

**When to use:** Every time goods are received from a vendor — whether full delivery or partial. Before processing vendor payment (payment = PO + GRN match). During stock reconciliation (goods received should match inventory increase).

**Benefit:** 3-way matching (PO → GRN → Invoice) is the gold standard of procurement governance. You only pay for what you actually received in acceptable condition — not what the vendor claims to have sent. This prevents overpayment, protects against vendor fraud, and ensures quality control. Without GRN, organizations often pay for goods never received or accept defective items without recourse.

---

### 2.8 Fixed Assets

Complete asset lifecycle management from acquisition to disposal with depreciation tracking.

---

#### 40. Asset Register
**Route:** `/assets`

**What it does:** Master asset database. Tracks Asset ID, Name, Category, Purchase Date, Original Cost, Location, Custodian, Donor/Fund Source, Condition, Depreciation Method, Net Book Value, and Status.

**Example Case:** NGOAB sends a letter requesting the complete list of assets purchased with foreign donation funds for the annual FD-5 submission. The Admin Officer opens Asset Register, filters by Fund Source ≠ "Own Fund," and generates the list: 8 vehicles (total BDT 1.2 Crore), 45 laptops (BDT 32 lakh), 15 projectors (BDT 7.5 lakh), office furniture across 5 locations (BDT 18 lakh), etc. Each asset shows the specific donor who funded it, current condition, and custodian. The FD-5 report is ready in 15 minutes. Last year, when they did this manually, it took 2 weeks and still had errors.

**When to use:** During NGOAB FD-5 asset reporting (mandatory annual), during donor project closeout (asset disposition planning), for insurance purposes, when staff request equipment, and during physical asset verification.

**Benefit:** Donor-wise asset tracking is an NGOAB compliance requirement that most NGOs struggle with. When a project ends, donors want to know "what happened to the assets we funded?" — this system answers instantly. Custodian tracking creates personal accountability (who has the laptop?). Without a digital register, organizations rely on manual registers that are often outdated, incomplete, or lost.

---

#### 41. Asset Categories
**Route:** `/assets/categories`

**What it does:** Asset category configuration. Defines Category Code, Name, Useful Life (Years), Depreciation Method (Straight Line/Declining Balance), Depreciation Rate %, Asset Count, Total Value, and Status.

**Example Case:** The Finance Manager is setting up the depreciation policy. She configures: Vehicles — 5 years useful life, Straight Line, 20%/year. IT Equipment — 3 years, Straight Line, 33%/year. Furniture — 10 years, Straight Line, 10%/year. Land & Building — 40 years, Straight Line, 2.5%/year. These rates follow Bangladesh Income Tax rules and are approved by the organization's auditor. Once set, every new asset in each category automatically inherits the correct depreciation method — no manual calculation needed.

**When to use:** During initial system setup (to configure categories and rates), when the auditor recommends depreciation rate changes, or when adding a new asset type that doesn't fit existing categories.

**Benefit:** Standardized depreciation rates across the organization prevent inconsistencies. Without this, different accountants might depreciate the same type of asset at different rates. The configuration ensures compliance with Bangladesh accounting standards and tax rules. Once set up, it's mostly a "configure once, use forever" feature that saves ongoing effort.

---

#### 42. Depreciation Schedule
**Route:** `/assets/depreciation`

**What it does:** Automated depreciation calculation and tracking. Shows Asset ID, Name, Category, Purchase Date, Original Cost, Accumulated Depreciation, Net Book Value, Annual Depreciation, and Monthly Depreciation. Supports both Straight-Line and Written Down Value (WDV) methods.

**Example Case:** Year-end closing: the Finance Manager needs to record depreciation expense for all assets. She opens Depreciation Schedule and sees: Total Original Cost BDT 4.2 Crore, Total Accumulated Depreciation BDT 1.8 Crore, Total Net Book Value BDT 2.4 Crore, Current Year Depreciation BDT 72,00,000. She clicks "Post Annual Depreciation" and the system creates journal entries automatically: Debit "Depreciation Expense" BDT 72,00,000, Credit "Accumulated Depreciation" BDT 72,00,000 — split by asset category and project. What used to take 3 days of manual calculation in Excel is done in 5 minutes with zero errors.

**When to use:** Monthly (for monthly depreciation booking), at year-end (for annual depreciation closing), during audit (auditors always check depreciation calculations), and when preparing financial statements (Balance Sheet shows Net Book Value).

**Benefit:** Automated depreciation eliminates calculation errors — a single mistake in an Excel formula can misstate your Balance Sheet by lakhs. Project-wise depreciation allocation ensures each project bears the correct asset cost in its financial report. This is a common audit finding area — having automated, consistent depreciation calculations means fewer audit observations.

---

#### 43. Asset Transfer
**Route:** `/assets/transfer`

**What it does:** Asset movement tracking between offices/locations. Logs Transfer ID, Date, Asset, From Location, To Location, Transferred By, Reason, Approved By, and Status (Completed/Pending Approval/In Transit).

**Example Case:** The Sylhet office is closing as the WASH project ends. 3 laptops, 1 projector, and 1 motorcycle need to be transferred to the Barishal office for the new Climate project. The Admin Officer creates transfers: Asset "Laptop Dell-045" From "Sylhet Field Office" To "Barishal Field Office," Reason "Project closure — WASH Phase-3, reassigned to Climate Adaptation." The ED approves. The assets are physically moved and the receiving office confirms receipt. The Asset Register automatically updates the location from Sylhet to Barishal. When NGOAB asks "where are the WASH project assets now?" — the complete transfer trail is documented.

**When to use:** When any asset moves between locations (office to office, HQ to field, project to project). During project closeout (asset reassignment). When staff relocate and take equipment with them. During donor asset disposition reporting.

**Benefit:** Chain of custody documentation prevents asset loss. Without transfer tracking, assets "disappear" during office relocations or project closures. The approval requirement ensures asset movements are authorized. Transfer history is crucial for NGOAB FD-5 reporting and donor asset disposition plans — "the laptop funded by USAID was transferred from Sylhet to Barishal on this date, approved by the ED."

---

#### 44. Maintenance
**Route:** `/assets/maintenance`

**What it does:** Preventive and corrective maintenance management. Tracks Maintenance ID, Asset, Type (Preventive/Corrective/Emergency), Description, Scheduled Date, Completion Date, Cost, Vendor/Technician, and Status.

**Example Case:** The organization has 8 vehicles. The Admin Manager sets up preventive maintenance: Oil change every 5,000 km, tire check every 10,000 km, full service every 20,000 km. The system schedules: "Vehicle Toyota Hilux-003 — Oil change due on Feb 15, 2026." When a vehicle breaks down unexpectedly (corrective maintenance), it's recorded: "Emergency repair — replaced radiator, cost BDT 45,000, vendor Rahim Auto Workshop." At year-end, the total vehicle maintenance cost is BDT 8,50,000 across 8 vehicles. This data helps decide: should we keep maintaining old vehicles or replace them?

**When to use:** For scheduling preventive maintenance (to avoid breakdowns). When any asset needs repair. For tracking maintenance costs per asset (to make replacement decisions). During budget planning (to estimate next year's maintenance costs).

**Benefit:** Preventive maintenance extends asset life and prevents costly emergency repairs. Total maintenance cost per asset helps with replacement decisions — if a vehicle costs BDT 5 lakh/year in repairs, it might be cheaper to replace it. Maintenance history also adds value during asset disposal (a well-maintained vehicle fetches a higher resale price). For donor-funded assets, maintenance records demonstrate responsible stewardship.

---

#### 45. Disposal
**Route:** `/assets/disposal`

**What it does:** Asset disposal and write-off management. Tracks Disposal ID, Asset, Category, Original Value, Book Value at Disposal, Disposal Method (Sale/Auction/Scrap/Donation), Recovery Amount, Disposal Date, Approved By, and Status. Compliant with donor asset disposition requirements.

**Example Case:** 10 laptops purchased in 2020 (original value BDT 3,50,000 each) are now 6 years old, fully depreciated (Book Value BDT 0), and no longer functional for office use. The IT Manager initiates disposal: 5 laptops to be sold by auction (estimated recovery BDT 5,000 each), 3 donated to a local school (donor USAID approved donation), 2 scrapped (non-functional). The Disposal Committee reviews and approves. Auction is conducted, recovers BDT 28,000. USAID is notified about the 3 donated laptops as per their asset disposition guidelines. The Asset Register is updated — these 10 laptops are marked as "Disposed."

**Example Case 2:** A World Bank-funded motorcycle is stolen from the field office. The Admin Officer records: Disposal Method "Write-off (Theft)," GD (General Diary) number from police report, Book Value at Write-off BDT 1,20,000, Recovery BDT 0. Insurance claim is filed separately. World Bank is formally notified as per grant agreement requirements.

**When to use:** When assets reach end of useful life, when assets are damaged beyond repair, when donors request asset disposition at project closeout, or when assets are lost/stolen.

**Benefit:** Proper disposal process prevents "ghost assets" (assets on paper that don't physically exist). Donors like USAID have specific asset disposition policies — assets above a certain value need donor approval before disposal. Without this system, disposal happens informally (someone sells the old laptop and pockets the money). The approval requirement and recovery tracking ensure transparency. Recovery rate calculation shows how much value the organization extracts from old assets.

---

### 2.9 Human Resources

Complete HR management from recruitment to performance evaluation with Bangladesh Labour Act compliance.

---

#### 46. Employee Directory
**Route:** `/hr`

**What it does:** Comprehensive employee database. Tracks Employee ID, Name, Designation, Department, Date of Joining, Employment Type (Full-time/Contract/Consultant), Project Assignment, Phone, Email, and Status (Active/On Leave/Resigned/Terminated).

**Example Case:** NGOAB requests FD-4 (Personnel Details) for the annual return — a list of all staff with their positions, qualifications, salary ranges, and project assignments. The HR Manager opens Employee Directory: 87 total staff — 52 full-time, 28 contract (project-based), 7 consultants. She filters by project to show staff allocation: WASH (18 staff), Education (15), Health (12), Climate (8), Youth (6), Admin/Support (28). The FD-4 report is generated with all required fields. She also notices 3 staff are on "Resigned" status — she updates their exit dates and assigns replacements.

**When to use:** For NGOAB FD-4 reporting, new staff onboarding, organizational directory, staff allocation planning, and any HR query. This is the HR equivalent of the Beneficiary Registry — the master database.

**Benefit:** Centralized staff data eliminates the "multiple Excel files" problem. Project assignment tracking enables accurate project cost allocation (critical for donor reporting). Employment type classification ensures contract staff are managed differently from permanent staff (different benefits, different exit processes). When a donor asks "how many staff does my project fund?" — the answer is instant.

---

#### 47. Onboarding
**Route:** `/hr/onboarding`

**What it does:** New employee onboarding checklist and tracker. Tracks tasks for each new hire: ID Card, Bank Account Setup, IT Access, Policy Handbook, Orientation, Supervisor Introduction, Probation Goals. Shows completion % and Status.

**Example Case:** Three new field officers join the WASH project on March 1. The HR Officer creates onboarding checklists for each. Day 1: ID Card ✅, Policy Handbook ✅, Supervisor Introduction ✅. Day 2: IT Access ⏳ (IT department backed up), Bank Account ⏳ (needs to visit bank). Day 5: Orientation session ✅, Probation goals set ✅. Employee Rashid is at 85% completion (bank account still pending). Nadia is at 100% (completed everything). Kamal is at 70% (IT access and bank account both pending). The HR Manager follows up on the pending items to ensure all three are fully onboarded within the first week.

**When to use:** Every time a new employee joins. During the first 1-2 weeks of employment. For ensuring no onboarding step is missed.

**Benefit:** Standardized onboarding ensures every new employee gets the same experience — no one is "forgotten" without an ID card for 3 months. The checklist prevents common oversights like not setting up IT access (new employee can't work) or not giving the policy handbook (employee makes mistakes due to not knowing policies). Probation goal setting from Day 1 sets clear expectations. Professional onboarding creates a positive first impression and improves retention.

---

#### 48. Attendance
**Route:** `/hr/attendance`

**What it does:** Monthly attendance dashboard. Shows: Employee Name, Department, Working Days, Present, Absent, Late, Leave days, OT Hours, and Attendance %. Monthly summaries for all employees.

**Example Case:** Payroll processing day: the Finance Officer needs attendance data to calculate salaries. She opens Attendance for January 2026: 23 working days. Rahim — 22 present, 1 casual leave = full salary. Fatema — 20 present, 1 sick leave, 2 absent without leave = deduct 2 days. Karim — 23 present, 8 OT hours = full salary + OT pay. She exports the data, and the Payroll module automatically applies the correct deductions and additions. Without this system, she would be cross-checking paper attendance registers from 5 different offices.

**When to use:** Daily (for attendance recording), monthly (for payroll processing), quarterly (for attendance pattern analysis), and during performance reviews (attendance is a factor).

**Benefit:** Accurate attendance = accurate payroll. Paper registers are easily manipulated (someone can mark themselves present on a day they were absent). Digital attendance with department-level oversight prevents ghost employees and buddy punching. OT tracking ensures compliance with Bangladesh Labour Act overtime provisions. Attendance trends help identify issues — if someone is consistently late, it's flagged early rather than discovered during annual review.

---

#### 49. Leave Management
**Route:** `/hr/leave`

**What it does:** Leave application and balance tracking. Manages Leave ID, Employee, Leave Type (Annual/Casual/Sick/Maternity/Paternity/Without Pay), Start/End Date, Days, Applied On, and Status (Approved/Pending/Rejected/Cancelled). Leave types configured per Bangladesh Labour Act 2006.

**Example Case:** Senior Program Officer Nazia applies for 16 weeks Maternity Leave starting April 1, 2026. The system checks: Bangladesh Labour Act 2006 entitles her to 16 weeks (112 days) with full pay. Her leave balance shows 112 days Maternity Leave available. Her supervisor approves. The system automatically: blocks her from being assigned activities during that period, adjusts the project's staff plan, and calculates that her salary for April-July will be charged to the project as Maternity Leave. When she returns, her leave balance is updated. No manual calculation, no spreadsheet tracking.

**When to use:** When any employee needs leave (they apply through the system), for leave balance queries ("how many days of leave do I have left?"), during payroll (leave affects salary calculation), and for manpower planning (who's available next month?).

**Benefit:** Bangladesh Labour Act compliance is automatic — the system knows that Annual Leave is 1 day per 18 working days, Casual Leave is 10 days/year, Sick Leave is 14 days/year, Maternity is 16 weeks. Without this, HR manually tracks balances in Excel and often makes errors (approving leave when balance is zero, or denying leave that an employee is legally entitled to). The approval workflow ensures supervisors can plan for staff absence.

---

#### 50. Payroll
**Route:** `/hr/payroll`

**What it does:** Monthly payroll processing. Tracks Basic Salary, House Rent Allowance, Medical Allowance, Transport Allowance, Gross Salary, Tax Deduction (TDS), Provident Fund Deduction, and Net Salary. Payment status tracking. Supports project-wise salary cost allocation for donor reporting.

**Example Case:** Month-end: the Finance Manager processes payroll for 87 staff. The system pulls attendance data (2 staff had unpaid absences — salary deducted), leave data (1 staff on half-pay leave), and calculates: Total Gross BDT 42,50,000, TDS deductions BDT 3,80,000, PF deductions BDT 2,12,500, Net Payable BDT 36,57,500. For donor reporting, the system allocates: BDT 12,00,000 to WASH (18 staff), BDT 9,50,000 to Education (15 staff), BDT 4,20,000 to Admin (shared cost allocated across all projects). The bank transfer file is generated and sent to the bank. Payslips are generated for each employee.

**When to use:** Monthly (for salary processing), during tax season (for TDS certificate generation), for donor reporting (project-wise salary costs), and for annual increment/bonus processing.

**Benefit:** Payroll is the most error-sensitive financial process — a single mistake affects an employee's income and trust. Automated calculation from attendance + leave data eliminates manual errors. TDS calculation follows Bangladesh tax rules automatically. Project-wise allocation solves the biggest headache in NGO finance — "how much of this person's salary should each donor pay?" Without this, finance teams spend days manually calculating split salaries across projects.

---

#### 51. Performance (ePMS)
**Route:** `/hr/performance`

**What it does:** Electronic Performance Management System. Tracks Employee, Department, Review Period, Self Score, Supervisor Score, Final Score, Rating (Outstanding/Exceeds Expectations/Meets Expectations/Below Expectations/Unsatisfactory), and review Status.

**Example Case:** Annual performance review cycle: Field Coordinator Mahbub gives himself a self-score of 4.2/5 with evidence — "completed 48 of 50 tubewell installations (96%), conducted 12 community training sessions, maintained 98% beneficiary satisfaction." His supervisor reviews: acknowledges the installations but notes "field visit reports were often late, need improvement in documentation." Supervisor score: 3.8/5. Final score: 4.0 (Exceeds Expectations). Mahbub gets a 12% increment (organization policy: "Exceeds" = 10-15% increment). The entire process — self-assessment, supervisor review, final rating, increment decision — is documented and auditable.

**When to use:** During annual/semi-annual performance review cycles, for increment and promotion decisions, for identifying training needs (employees rated "Below Expectations" need development plans), and for contract renewal decisions.

**Benefit:** Objective, documented performance evaluation replaces subjective "I think this person is good/bad." Both employee and supervisor provide input — reducing bias. Evidence-based ratings protect against unfair termination claims ("you fired me without reason" — the ePMS shows 2 consecutive "Unsatisfactory" ratings with documented improvement plans). Data-driven increment decisions ensure high performers are rewarded and underperformers are supported with training.

---

#### 52. Training
**Route:** `/hr/training`

**What it does:** Training program management. Tracks Training ID, Title, Type (Internal/External/Online), Facilitator, Date, Duration, Participants count, Budget, and Status.

**Example Case:** The Capacity Building plan for 2026 includes 15 training programs. The HR Manager tracks: "Financial Management for Non-Finance Staff" (Internal, Feb, 25 participants, BDT 50,000 — Completed ✅), "Project Cycle Management" (External by BRAC Learning Center, March, 12 participants, BDT 2,50,000 — Upcoming), "Safeguarding & Protection" (Online via Kaya platform, ongoing, all 87 staff, BDT 0 — In Progress). When DFID asks "What capacity building activities have you done this year?" — the complete training register with participant counts, costs, and completion status is ready.

**When to use:** When planning training programs, tracking ongoing trainings, reporting to donors on capacity building, and for individual employee training records (important for career development).

**Benefit:** Donors increasingly demand capacity building as a project component — this tracks it systematically. Training cost tracking ensures the training budget is used effectively. Participant records help identify who has been trained and who hasn't — preventing situations where the same people always attend trainings while others are overlooked. Training investment per employee is a key HR metric that demonstrates organizational commitment to staff development.

---

#### 53. Org Chart
**Route:** `/hr/org-chart`

**What it does:** Visual organizational hierarchy display. Shows department-wise structure with Department Name, Head, Staff Count, and Sub-departments. Card-based tree layout.

**Example Case:** A new donor (SDC) visits for a pre-funding assessment. They ask "Can you show us your organizational structure?" The Programs Director opens the Org Chart: Executive Director at the top, 6 departments underneath (Finance, Programs, HR, M&E, IT, Field Operations), Programs further divided into 5 sectors (Education, Health, WASH, Climate, Youth) — each with a sector lead and team members. SDC can see that the organization has proper structure, clear reporting lines, and adequate staffing for the proposed project. This visual presentation makes a stronger impression than a paragraph description in a proposal.

**When to use:** During donor visits and assessments, for new employee orientation (understanding the organization), for internal communications about structure changes, and for proposal submissions (many donors request an org chart).

**Benefit:** Clear organizational structure demonstrates governance maturity. Donors want to see that your organization isn't run by one person — there are departments, reporting lines, and accountability structures. The visual format is instantly understandable. Staff count per department helps with resource planning — if IT has 3 people supporting 87 staff, they might be understaffed. Org Chart is a standard attachment in most donor proposals and NGOAB documentation.

---

### 2.10 Microfinance (MFI)

Complete microfinance operations module following MRA (Microcredit Regulatory Authority) guidelines.

---

#### 54. Samity/Group Management
**Route:** `/microfinance/samity`

**What it does:** Core microfinance group management. Tracks Samity ID, Name, Branch, Formation Date, Meeting Day & Time, Total Members, Active Loans, Total Savings, Outstanding Loan Portfolio, Field Officer, and Status (Active/Inactive/Suspended/New).

**Example Case:** Field Officer Rafiqul manages 3 samities in Sylhet Sadar. He opens his samity list: "Shapla Mohila Samity" — 35 members, Saturday 9 AM meeting, BDT 8.75 lakh savings, BDT 11.20 lakh outstanding loans. "Padma Unnayan Samity" — 30 members, Sunday 10 AM meeting, BDT 7.20 lakh savings. "Jamuna Mohila Dal" — 25 members, Wednesday 9 AM meeting, newest group with BDT 4.20 lakh savings. He notices "Mohanonda Mohila Samity" is marked "Inactive" with 0 active loans — he recommends either reactivating it with fresh loans or formally closing it to the Branch Manager.

**When to use:** Daily by field officers (to manage their samity visits), weekly by branch managers (to review branch performance), and for MRA reporting on group-level data.

**Benefit:** Digital samity management replaces paper registers that field officers carry to meetings. Real-time portfolio tracking per samity enables performance comparison — which samities are performing well, which need attention. Meeting schedule tracking ensures no samity is missed. The savings-to-loan ratio per samity is a key MRA metric — if outstanding loans far exceed savings, that samity is over-leveraged and risky.

---

#### 55. Loan Products
**Route:** `/microfinance/loan-products`

**What it does:** Loan product catalog configuration. Defines Product Code, Name, Category (Income Generating/Agriculture/Education/Housing/Emergency/Seasonal), Min/Max Amount, Interest Rate %, Duration, Repayment Frequency, Grace Period, and Service Charge %. All configured per MRA interest rate guidelines.

**Example Case:** The MFI Director wants to launch a new "Agricultural Loan" product for farmers. She opens Loan Products and configures: Name "Krishi Rin," Category "Agriculture," Min Amount BDT 20,000, Max Amount BDT 2,00,000, Interest Rate 20% (declining balance — within MRA's maximum of 24%), Duration 12 months, Repayment "Monthly" (aligned with harvest cycles unlike weekly IGA loans), Grace Period 3 months (seedlings need time to grow before income). She checks that the rate complies with MRA guidelines, gets board approval, and activates the product. Field officers can now disburse loans under this product.

**When to use:** When designing new loan products, when MRA revises interest rate caps (to update existing products), during product performance reviews, and when donors fund specific credit programs (to create donor-linked products).

**Benefit:** Product standardization ensures all field officers offer the same terms — no one can arbitrarily change interest rates or loan amounts. MRA compliance is built-in — the system can flag products that exceed regulatory caps. Product-wise portfolio tracking enables performance analysis: "Our agricultural loan has 98% repayment but education loan has only 85% — why?" This data drives product design improvements.

---

#### 56. Loan Applications
**Route:** `/microfinance/loan-applications`

**What it does:** Loan application processing pipeline. Tracks Application ID, Date, Applicant Name, Samity, Product, Amount Requested, Purpose, Field Officer, and Status (Submitted/Under Review/Recommended/Approved/Rejected/Disbursed).

**Example Case:** Samity member Reshma Begum applies for a BDT 50,000 "Jagoron" (IGA) loan to buy a sewing machine and fabric. Field Officer Rafiqul verifies: she's been a member for 2 years, has BDT 12,000 savings, repaid her previous BDT 30,000 loan on time (100% repayment). He recommends approval. The Branch Manager reviews the recommendation, checks that Reshma's total loan exposure won't exceed MRA limits, and approves. Status changes from "Recommended" to "Approved." Reshma is notified that her loan will be disbursed at the next samity meeting. The approval rate this month: 82% (8 of 10 applications approved; 2 rejected — one had an existing overdue loan, one requested above maximum limit).

**When to use:** When samity members apply for loans (field officer submits the application), during loan approval committee meetings, for tracking application pipeline, and for MRA reporting on loan approvals.

**Benefit:** Structured approval workflow prevents unauthorized lending. The multi-level process (field officer recommends → branch manager approves) provides checks and balances. Application tracking shows the pipeline — how many applications are waiting, how long approval takes (if it takes 3 weeks, members go to competitors). Rejection reason documentation protects against claims of discrimination. Approval rate is a key metric — too low means stringent criteria (members leave), too high means loose criteria (risk increases).

---

#### 57. Disbursement
**Route:** `/microfinance/disbursement`

**What it does:** Loan disbursement tracking. Manages Disbursement ID, Date, Loan Account, Borrower, Product, Disbursed Amount, Mode (Cash/Bank/Mobile), Branch, Disbursed By, and Status (Scheduled/Disbursed/On Hold/Cancelled).

**Example Case:** It's samity meeting day (Saturday, 9 AM at Shapla Mohila Samity). 3 loans were approved this week: Reshma BDT 50,000, Salma BDT 40,000, Jhorna BDT 30,000. The Field Officer disburses at the meeting: Reshma — Cash BDT 50,000 (disbursed ✅), Salma — bKash transfer BDT 40,000 (disbursed ✅), Jhorna — On Hold (didn't attend the meeting, will disburse at next meeting). Total disbursed today: BDT 90,000. All members sign the disbursement register. The system updates loan accounts, records disbursement mode, and the samity's outstanding loan portfolio increases by BDT 90,000.

**When to use:** During samity meetings (the primary disbursement point), when bank transfers are processed, for tracking scheduled vs actual disbursements, and for cash flow planning (knowing how much cash field officers need to carry).

**Benefit:** Disbursement tracking ensures accountability — every taka disbursed is recorded with recipient name, amount, mode, and disbursing officer. Mobile banking disbursement (bKash/Nagad) reduces cash handling risk. "On Hold" status prevents forcing disbursement when conditions aren't met (member absent, documentation incomplete). Monthly disbursement data helps cash flow planning — the finance team knows how much cash each branch needs.

---

#### 58. Collection/Repayment
**Route:** `/microfinance/collection`

**What it does:** Weekly/monthly collection and repayment tracking. Records Collection ID, Samity, Collection Date, Members Present, Total Collectible, Amount Collected, Shortfall, On-time %, Collected By, and Status (Completed/Partial/Missed).

**Example Case:** Saturday 9 AM at Shapla Mohila Samity: 32 of 35 members present. Total collectible this week: BDT 84,500 (28 loan installments + 35 savings deposits). Amount actually collected: BDT 79,200. Shortfall: BDT 5,300 (3 members couldn't pay full installment). On-time collection rate: 93.7%. Field Officer Rafiqul records the collection, notes the 3 members who paid partial ("Halima — BDT 1,500 short, husband's rickshaw broke down, promised next week"), and deposits the collected amount at the branch within 2 hours. The Branch Manager reviews all samity collections by evening — total branch collection today: BDT 4,85,000 across 6 samities.

**When to use:** During every samity meeting (the primary collection point), for daily/weekly collection monitoring by branch managers, for identifying collection trends (declining collection rate = early warning), and for MRA reporting.

**Benefit:** Digital collection records replace paper collection sheets — which are easily manipulated or lost. Real-time collection data prevents a common MFI fraud: field officers collecting money but not depositing it. The shortfall tracking with reasons enables supportive follow-up rather than punitive action. Collection rate is THE most important MFI metric — if it drops below 95%, the institution has a serious problem. Weekly tracking at samity level catches problems early.

---

#### 59. Savings
**Route:** `/microfinance/savings`

**What it does:** Member savings account management. Tracks Account ID, Member Name, Samity, Savings Type (Compulsory/Voluntary/Fixed Deposit/DPS), Balance, Monthly Deposit, Total Deposited, Interest Earned, Last Transaction, and Status.

**Example Case:** MRA requires that all MFI members must have a compulsory savings account. The system tracks: "Reshma Begum — Compulsory Savings BDT 12,000 (BDT 200/week for 60 weeks), Voluntary Savings BDT 8,000, Total BDT 20,000." She earned BDT 1,200 interest on her voluntary savings this year. The total savings portfolio across all samities: Compulsory BDT 38,50,000, Voluntary BDT 18,30,000, Fixed Deposit BDT 5,20,000, DPS BDT 3,40,000 = Grand Total BDT 65,40,000. The savings-to-loan ratio is tracked — MRA expects healthy MFIs to have a ratio of at least 15-20%.

**When to use:** During every collection (savings are collected alongside loan installments), when members want to withdraw savings, for interest calculation, and for MRA savings mobilization reporting.

**Benefit:** MRA mandates compulsory savings — this system enforces it (you can't disburse a loan without an active savings account). Savings tracking protects member money — every deposit and withdrawal is recorded, preventing disputes. Interest calculation is automated and transparent. Savings portfolio is a key MFI stability indicator — an MFI with high savings has a stable funding base and is less dependent on external loans.

---

#### 60. Overdue Management
**Route:** `/microfinance/overdue`

**What it does:** Delinquent loan monitoring and recovery. Tracks Loan Account, Borrower, Samity, Product, Loan Amount, Outstanding, Overdue Amount, Days Overdue, Last Payment Date, Classification (Watch/Substandard/Doubtful/Bad), Recovery Action, and Status.

**Example Case:** The Branch Manager opens Overdue Management: 15 overdue loans (out of 850 total) = PAR (Portfolio at Risk) of 1.8% — within the healthy range (<5%). Most serious case: Borrower Kulsum, Loan BDT 80,000, Outstanding BDT 52,000, Overdue BDT 18,000, 120 days overdue — Classification "Doubtful." Recovery action: "Home visit conducted, borrower's husband is ill, negotiated restructured repayment plan — BDT 3,000/month." Another case: Borrower Alam, 15 days overdue, Classification "Watch" — just missed one installment due to temporary cash flow issue, field officer will follow up this week.

**When to use:** Weekly review by branch managers, monthly review by MFI Director, during MRA provisioning calculation, and for field officer performance assessment (overdue loans in their portfolio).

**Benefit:** MRA requires loan classification following specific provisioning norms: Watch (1-30 days) = 5% provision, Substandard (31-180 days) = 25%, Doubtful (181-365 days) = 75%, Bad (>365 days) = 100%. This directly affects the MFI's financial statements. Early identification (Watch classification at just 1 day overdue) enables proactive recovery action before the loan deteriorates further. PAR>30 is the global standard MFI health metric — this system calculates it automatically.

---

#### 61. MRA Reports
**Route:** `/microfinance/mra-reports`

**What it does:** Regulatory report management for Microcredit Regulatory Authority. Tracks all required reports: MRA Monthly Return (CDF-1), Quarterly Financial Statement, Annual Audited Report, Portfolio Quality Report, Interest Rate Compliance, Client Protection Report, Savings Mobilization Report, and Governance Report.

**Example Case:** MRA's filing deadline for the Monthly Return (CDF-1) is the 10th of each month. On February 5, the MFI Director opens MRA Reports: January CDF-1 status is "Draft" — she reviews the auto-populated data: Total Borrowers 2,450, Outstanding Portfolio BDT 3.2 Crore, Savings Portfolio BDT 65 lakh, Recovery Rate 98.2%, PAR>30 1.8%. She verifies the numbers match the operational data, approves, and submits to MRA through their portal. Status changes to "Submitted." The Quarterly Financial Statement is "Due This Month" — she assigns the Finance Manager. The Annual Audited Report "Not Started" is due in March — she schedules a meeting with the external auditor.

**When to use:** On a calendar-driven basis — monthly (CDF-1), quarterly (financial statements, portfolio quality), and annually (audited report, governance report). Before each MRA deadline. During MRA inspections (to demonstrate compliance).

**Benefit:** MRA non-compliance can result in license suspension — which would shut down the entire MFI operation. Deadline tracking with overdue alerts ensures no submission is missed. Auto-populated data from the operational modules means reports are generated in minutes instead of days. Consistent, accurate regulatory reporting builds MRA's confidence in your MFI, potentially leading to favorable regulatory treatment (higher lending limits, broader operational approval).

---

### 2.11 Reports & Analytics

Centralized reporting hub with regulatory, donor, and management reports.

---

#### 62. Financial Reports
**Route:** `/reports/financial`

**What it does:** Complete financial report library. 12 report types: Trial Balance, Income Statement, Balance Sheet, Cash Flow Statement, Fund Position Report, General Ledger, Day Book, Bank Book, Cash Book, Receipts & Payments Account, Income & Expenditure Account, and Project-wise Expenditure Statement.

**Example Case:** The external auditor arrives for the annual audit. Day 1 request: "Please provide Trial Balance, Balance Sheet, Income Statement, and Cash Flow Statement for FY 2025-2026." The Finance Manager opens Financial Reports, selects the fiscal year, and generates all 4 reports in under 2 minutes. Day 2: "I need the General Ledger for account 4101 (USAID Grant Income) and all journal entries above BDT 5 lakh." Generated in 30 seconds. Day 5: "Project-wise Expenditure Statement for all active projects." Done. The audit team completes their fieldwork in 5 days instead of the usual 2 weeks — because they're not waiting for the finance team to compile reports manually.

**When to use:** During audits, monthly/quarterly closing, donor reporting, board meeting preparation, NGOAB annual return filing, and on-demand whenever financial data is needed.

**Benefit:** 12 standard reports cover every financial reporting need an NGO has. One-click generation means the finance team can respond to any request in minutes, not days. Consistent formatting builds credibility — your Balance Sheet looks professional every time, not formatted differently depending on who made it in Excel. The Fund Position Report — showing each donor's fund balance separately — is the #1 most requested report by NGOAB and donors. Having it automated is a game-changer.

---

#### 63. NGOAB Reports
**Route:** `/reports/ngoab`

**What it does:** NGOAB compliance report automation. Manages all mandatory forms: FD-1 through FD-9, FC-1 (Foreign Contribution), and Annual Return. Tracks Form No, Name, Frequency, Due Date, Status, and Last Submitted date. Deadline alert system.

**Example Case:** The ED's desk has a note: "NGOAB FD-3 due by March 15." She opens NGOAB Reports and sees the complete picture: FD-3 (Quarterly Progress) — due in 15 days, status "Draft" (Finance team is working on it). FD-6 (Annual Audit) — due next month, status "Not Started" (auditor hasn't finished yet). FD-9 (Registration Renewal) — overdue by 3 days! She immediately calls the Admin Manager: "Why wasn't FD-9 submitted?" The Admin Manager didn't know it was due — the previous Compliance Officer left and nobody picked up the task. The system's overdue alert prevented a potentially serious compliance lapse.

**When to use:** Weekly compliance review. Before every NGOAB deadline. During NGOAB inspections (to demonstrate compliance history). When preparing for new project proposals (NGOAB checks compliance status before approving FD-1).

**Benefit:** NGOAB compliance failures can result in license cancellation — ending the organization's ability to receive foreign donations. This system prevents that by tracking every required form with automated deadline alerts. Most NGOs track NGOAB deadlines on a wall calendar or in someone's memory — when that person leaves, deadlines are missed. This system ensures institutional compliance that doesn't depend on any individual. The overdue alert is especially valuable — it's the difference between "we submitted late" and "we forgot to submit entirely."

---

#### 64. Donor Reports
**Route:** `/reports/donor`

**What it does:** Donor-specific report management. Covers Financial Report, Narrative Report, Progress Report, Audit Report, Fund Utilization Certificate, and Expenditure Statement for each donor. Tracks Due Date, Status, and Format.

**Example Case:** EU requires a very specific "Financial Report Template" with expenditure categorized by their budget line items. USAID requires "SF-425 Federal Financial Report" format. DFID requires "Annual Review" format with logframe-aligned progress. The Reports Coordinator tracks all of these: 6 donors × 4-6 reports each = 28 donor reports per year. She opens the page: 3 reports overdue (red), 5 due this month (amber), 20 upcoming (green). She assigns: Finance Officer to prepare EU financial report, M&E Officer to write DFID narrative, Program Manager to compile USAID progress report. Each report's specific template and format requirements are documented.

**When to use:** Continuously — donor reporting is a year-round activity. At the start of each month, check which reports are due. After completing a report, update the status. During donor relationship management calls.

**Benefit:** Different donors have different reporting requirements, formats, and frequencies — managing 28+ reports per year across 6+ donors is overwhelming without a tracking system. Late reports damage donor relationships and can trigger fund suspension. This tracker ensures nothing falls through the cracks. Status tracking (Draft → Under Review → Submitted → Accepted → Revision Required) provides visibility into each report's progress.

---

#### 65. Project Reports
**Route:** `/reports/project`

**What it does:** Project-wise report generation. Types: Progress Report, Financial Report, M&E Report, Completion Report. Covers all active projects with Period, Author, and Status tracking.

**Example Case:** The WASH Project Manager needs to prepare the quarterly progress report. She opens Project Reports and starts: activities completed this quarter (pulled from Activity Planning), milestones achieved (from Milestone Tracking), budget spent vs planned (from Budget vs Actual), beneficiaries reached (from Beneficiary Registry), challenges faced, and plans for next quarter. The data is already in the system — she just needs to write the narrative around it. What used to take a week (gathering data from various departments and field offices) now takes 2 days, with most time spent on writing, not data collection.

**When to use:** Quarterly (for progress reports), monthly (for internal project updates), at project midpoint (mid-term evaluation report), and at project end (completion report).

**Benefit:** Since all operational data (activities, milestones, budgets, beneficiaries) is already in the system, report preparation is mostly about narration, not data collection. This dramatically reduces reporting time and improves accuracy (data comes from the source system, not from "I remember we did about 50 activities"). Completion reports are especially important — they document the project's full story for future reference and donor relationship management.

---

#### 66. HR Reports
**Route:** `/reports/hr`

**What it does:** Human resource analytics reports. Includes: Staff List, Attendance Summary, Leave Balance Report, Payroll Register, Tax Report (TDS), Provident Fund Statement, Training Report, Performance Summary, Staff Turnover Analysis.

**Example Case:** The HR Manager prepares for the quarterly management meeting. She generates: Staff Turnover Analysis — 4 resignations this quarter (2 from Field Operations, 1 from Finance, 1 from IT), turnover rate 4.6% (industry average 6% — good). Training Report — 45 staff trained in 6 programs, total cost BDT 8,50,000. Leave Balance Report — 12 staff have more than 20 days unused Annual Leave (they should be encouraged to take time off). TDS Report — BDT 18,60,000 deducted this quarter, due for deposit to NBR. Each report gives actionable insights, not just data.

**When to use:** Monthly (attendance summary, payroll register), quarterly (tax, turnover analysis), annually (performance summary, training summary), and on-demand (staff list for NGOAB, leave balance for individuals).

**Benefit:** HR decisions should be data-driven, not gut-feel. Turnover analysis identifies if a specific department has high attrition (signaling management issues). Training reports show ROI on capacity building. Leave balance tracking prevents burnout and liability accumulation. TDS reports ensure tax compliance (late tax deposit = penalty from NBR). These reports transform HR from an administrative function to a strategic partner in organizational management.

---

#### 67. Procurement Reports
**Route:** `/reports/procurement`

**What it does:** Procurement analytics. Reports: Purchase Order Summary, Vendor Performance Analysis, Contract Status Report, Inventory Valuation, Stock Movement Report, Procurement Pipeline, Tender Analysis.

**Example Case:** The Procurement Manager presents at the quarterly management meeting. Vendor Performance Analysis shows: "TechBD Solutions" — 100% on-time delivery, zero quality issues, highest rating. "Bengal Furniture" — 60% on-time delivery, 2 quality complaints. She recommends keeping TechBD on the preferred list and issuing a warning to Bengal Furniture. Inventory Valuation shows: total stock worth BDT 28 lakh across 5 warehouses. Procurement Pipeline shows: 8 POs pending delivery worth BDT 12 lakh. This data enables decisions: "Should we renew the Bengal Furniture contract? Should we increase the Chittagong warehouse budget?"

**When to use:** Monthly (PO and inventory reports), quarterly (vendor performance, pipeline), annually (procurement efficiency analysis), and during audits (to demonstrate procurement governance).

**Benefit:** Vendor performance data enables objective vendor selection — not "we always buy from this vendor because the Procurement Officer knows them." Inventory valuation is critical for financial reporting (stock is an asset on the Balance Sheet). Stock movement analysis identifies slow-moving items that tie up capital. Procurement pipeline gives advance visibility for cash flow planning.

---

#### 68. Custom Reports
**Route:** `/reports/custom`

**What it does:** User-defined custom report builder. Shows saved custom reports with Report Name, Created By, Data Source (module), Columns Selected, Filters Applied, Last Run, and Schedule. Supports drag-and-drop report design, scheduled auto-generation, and multi-format export.

**Example Case:** The ED wants a weekly report every Monday morning showing: Active Projects (from Projects module), Fund Balance by Donor (from Donors module), Overdue Approvals (from Workflows), and Staff on Leave This Week (from HR module). No standard report combines data from 4 modules. Using Custom Reports, the IT Officer creates a cross-module report, selects the relevant columns, applies filters, and schedules it for "Every Monday 7:00 AM." Now the ED gets this consolidated briefing automatically in her email every Monday — she didn't have to ask anyone.

**When to use:** When standard reports don't answer your specific question. When you need cross-module data combined. When you need scheduled automatic reports. When board members or donors want information in a specific format.

**Benefit:** Every organization has unique reporting needs that standard reports don't cover. Without custom reports, staff spend hours in Excel merging data from different sources. The scheduling feature is especially powerful — routine reports are generated and delivered automatically, freeing up staff time. Multi-format export (PDF for presentations, Excel for further analysis, CSV for data exchange) meets every use case.

---

#### 69. Audit Trail
**Route:** `/reports/audit-trail`

**What it does:** Complete system activity audit log. Records Timestamp, User, Action (Create/Update/Delete/Login/Logout/Approve/Reject/Export), Module, Record ID, Description, IP Address, and Status (Success/Failed).

**Example Case:** During the annual audit, the auditor asks: "Who approved Voucher DV-2026-045 for BDT 25,00,000?" The Finance Manager opens Audit Trail, searches "DV-2026-045": Created by Accountant Rahim at 10:15 AM on Jan 12 from IP 192.168.1.45 → Reviewed by Finance Officer Nasima at 11:30 AM → Approved by Finance Head Karim at 2:45 PM → Payment posted at 3:00 PM. The auditor is satisfied with the clear approval chain. She also checks: "Were there any failed login attempts last month?" — 3 failed attempts for user "admin" from an unknown IP. IT is asked to investigate and enable two-factor authentication.

**When to use:** During audits (primary use case), when investigating suspicious activity, for security monitoring, and for compliance demonstrations.

**Benefit:** The audit trail is your ultimate defense against fraud allegations and compliance failures. It proves who did what, when, and from where. Without it, disputes are unresolvable — "I didn't approve that payment" vs "Yes you did." IP address tracking adds another layer — if someone says "I didn't log in that day" but the audit trail shows their ID was used from their known IP, the evidence is clear. NGOAB, MRA, and all major donors expect audit trails as a governance requirement.

---

### 2.12 Settings & Administration

System configuration, user management, and organizational setup.

---

#### 70. Organization Setup
**Route:** `/settings/organization`

**What it does:** Organizational profile configuration. Sections: Organization Profile (Name, Registration No, NGOAB License No, Address), Fiscal Year Settings (Start Month, Currency, Number Format), and operational parameters.

**Example Case:** During initial system setup, the Admin configures: Organization Name "Shapla Development Foundation," Registration No "S-12345," NGOAB License No "FD-2024-678," Address "House 45, Road 12, Dhanmondi, Dhaka." Fiscal Year starts July 1 (Bangladesh government fiscal year). Currency BDT. Number format "Bangladeshi" (1,00,000 not 100,000). VAT Registration No "123456789." This information auto-populates all reports, letters, vouchers, and NGOAB submissions — type it once, use it everywhere.

**When to use:** Once during initial system setup. When organizational details change (address, registration renewal, license renewal). When setting up a new fiscal year.

**Benefit:** Single source of truth for organizational identity. Prevents inconsistencies like "different letterhead addresses in different reports." Auto-population saves repetitive data entry. Fiscal year configuration ensures all financial calculations use the correct period. This is the foundation that all other modules build upon.

---

#### 71. User Management
**Route:** `/settings/users`

**What it does:** User account administration. Tracks User ID, Full Name, Email, Role, Department, Last Login, and Status (Active/Inactive/Locked/Pending). Manages all system users.

**Example Case:** A new Finance Officer joins. The IT Admin creates a user: Name "Nasreen Akhter," Email "nasreen@shapla.org," Role "Finance Officer," Department "Finance & Accounts," Status "Active." Nasreen can now log in and access only the Finance module (as defined by her role). When Accountant Rahim resigns, his status is changed to "Inactive" — he can no longer log in, but his historical data (journal entries he created, vouchers he prepared) remains in the system. The ED notices user "Karim" hasn't logged in for 30 days — she asks HR if he's still employed.

**When to use:** When new employees need system access. When employees leave (to deactivate their accounts immediately — security critical). When roles change (promotion means different access level). For periodic access review (who has access? Is it still appropriate?).

**Benefit:** Controlled access prevents unauthorized system use. Immediate deactivation when staff leave prevents ex-employees from accessing sensitive data (a major security risk). "Last Login" tracking identifies dormant accounts. Role-based access means the Finance Officer can't modify HR data and the HR Manager can't approve vouchers — separation of duties is a core governance requirement.

---

#### 72. Roles & Permissions
**Route:** `/settings/roles`

**What it does:** Granular role-based access control (RBAC). Defines roles with specific module permissions: Super Admin, Finance Admin, Program Manager, HR Manager, Field Officer, Data Entry Operator, Auditor (Read Only), Branch Manager. Each role has module-level read/write/approve/export permissions.

**Example Case:** The organization defines 8 roles. "Finance Admin" can read/write/approve in Finance, Budget, and Reports modules, but has read-only access to HR and Projects. "Field Officer" can write in Beneficiary, Microfinance (Collection/Savings), and read in Projects — but cannot access Finance or HR at all. "Auditor" has read-only access to everything but cannot modify any data. "Data Entry Operator" can write in selected modules but cannot approve anything. When a new module is added, permissions are configured once per role, and all users with that role automatically get the correct access.

**When to use:** During initial system setup (define all roles). When organizational structure changes. When auditors recommend segregation of duty improvements. When adding new modules or features.

**Benefit:** Role-based access is the foundation of information security and governance. Without it, everyone has access to everything — a data entry operator could approve a BDT 50 lakh payment, or a field officer could modify salary data. Segregation of duties (the person who creates a voucher cannot approve it) is a core audit requirement. RBAC implements this automatically. Donors like USAID specifically ask about access controls during organizational capacity assessments.

---

#### 73. Approval Workflows
**Route:** `/settings/workflows`

**What it does:** Multi-level approval workflow configuration. Defines workflows for: Voucher Approval, Purchase Requisition, Leave Request, Budget Revision, Fund Requisition, Asset Disposal, Payroll Processing. Each workflow specifies Module, Trigger, Approval Steps, and Status.

**Example Case:** The organization configures the Voucher Approval workflow: Amount < BDT 50,000 → Prepared by Accountant → Approved by Finance Officer (1 level). Amount BDT 50,000 - 5,00,000 → Prepared by Accountant → Reviewed by Finance Officer → Approved by Finance Head (2 levels). Amount > BDT 5,00,000 → Prepared by Accountant → Reviewed by Finance Officer → Approved by Finance Head → Final Approval by ED (3 levels). This ensures that larger amounts require higher authority approval. When Accountant Rahim creates a BDT 8 lakh voucher, the system automatically routes it through the 3-level approval chain — he can't skip any step.

**When to use:** During initial setup (configure all workflows). When the organization grows (add more approval levels). When auditors flag weak controls (add additional review steps). When donors require specific approval processes.

**Benefit:** Automated workflows eliminate the biggest governance risk in NGOs — unauthorized approvals. The system enforces the defined process; no one can bypass it. Amount-based thresholds ensure proportionate control — routine small payments are processed quickly (1 level) while large amounts get proper scrutiny (3 levels). This is one of the first things donors and auditors check: "Is there a formal approval process, and is it enforced?"

---

#### 74. Notification Settings
**Route:** `/settings/notifications`

**What it does:** Notification preference management. Configurable alerts by category: Approvals, Deadlines, Budget Alerts, System Notifications, HR Notifications, Report Notifications. Each category supports Email, In-App, and SMS channels.

**Example Case:** The Finance Head configures her notifications: Budget Alerts — Email + In-App (she wants to know immediately if any project exceeds 90% budget utilization). Approval Requests — In-App only (she checks the system regularly, doesn't need email for every approval). Deadlines — Email + SMS (NGOAB deadlines are critical, she wants SMS as backup). The Field Officer configures: Collection Reminders — SMS (reminds him which samity meeting is tomorrow). Leave Approvals — Email (so he knows when his leave is approved even when not logged in). Each user customizes their own notification experience.

**When to use:** During initial user setup (configure default notifications). Periodically when users want to adjust alert frequency. When new notification types are added.

**Benefit:** Right information to the right person at the right time. Without notifications, important events go unnoticed — a pending approval sits for days because the approver didn't know it was waiting. Budget alerts prevent overspending surprises. Deadline reminders prevent compliance failures. SMS ensures critical alerts reach field staff who may not always have internet access. Customization prevents notification fatigue — users choose what they want to be alerted about.

---

#### 75. System Configuration
**Route:** `/settings/system`

**What it does:** Technical system settings. Includes: Number Sequences (Voucher No, PO No, PR No format), Tax Configuration (VAT Rate 15%, TDS Rate, AIT Rate), Default Values, and integration parameters.

**Example Case:** The Finance Manager configures number sequences: Voucher numbers as "DV-2026-001" (Type-Year-Sequence), PO numbers as "PO-2026-001," Journal Entry numbers as "JE-2026-001." Tax rates: VAT 15% (standard Bangladesh rate), TDS rates by category (Salary 10%, Contractor 7%, Rent 5% as per NBR rules). Default values: Currency BDT, fiscal year July-June, reporting language English. When the government changes VAT rate (which has happened — it was 7.5% during COVID), the Finance Manager updates it in one place and all future calculations use the new rate.

**When to use:** During initial system setup. When government changes tax rates. When the organization wants to modify document numbering formats. When adding new integration endpoints.

**Benefit:** Centralized configuration prevents inconsistencies — all vouchers across all offices follow the same numbering format. Tax rate configuration ensures compliance with Bangladesh tax laws. When tax rates change (which happens periodically through budget announcements), updating one setting updates the entire system — instead of finding and updating 50 different Excel sheets. This is the "plumbing" that makes everything else work correctly.

---

#### 76. Backup & Logs
**Route:** `/settings/backup-logs`

**What it does:** Data backup and system log management. Tracks Backup ID, Date/Time, Type (Full/Incremental/Database/Files), Size, Duration, Status (Success/Failed/In Progress), Initiated By. Also shows system event logs.

**Example Case:** Every night at 2 AM, the system runs an automated full backup. The IT Admin checks Backup & Logs on Monday morning: Friday backup — Success (2.3 GB, 12 minutes), Saturday — Success (2.4 GB, 13 minutes), Sunday — Failed! He checks the log: "Disk space insufficient on backup server." He clears old backups from 6 months ago (retained copies are safe on cloud), frees up 50 GB, and manually triggers a backup — Success. If he hadn't checked, and the server crashed this week, the last good backup would be Friday — 2 days of data lost.

**When to use:** Daily (quick check that last night's backup succeeded), weekly (review backup health), monthly (cleanup old backups, verify backup integrity by test restore), and immediately after any system error.

**Benefit:** Backups are your insurance policy. Without verified backups, a server crash, ransomware attack, or accidental deletion could destroy years of financial data. The status monitoring ensures backup failures are caught immediately — not discovered during the disaster when it's too late. System logs help diagnose issues — slow performance, login errors, failed operations. Professional backup management demonstrates IT governance maturity to donors and auditors.

---

## 3. Regulatory Compliance Summary

This system is built to comply with the following Bangladeshi and international regulations:

### 3.1 NGOAB (NGO Affairs Bureau) Compliance

| Requirement | How the System Addresses It |
|-------------|---------------------------|
| **FD-1 to FD-9 Form Submission** | Dedicated NGOAB Reports module (`/reports/ngoab`) auto-generates all 11 required forms with deadline tracking and overdue alerts |
| **Foreign Donation Tracking** | Fund Receipts module tracks all foreign donations with currency conversion, bank reference, and NGOAB-designated "mother account" monitoring |
| **Fund Release Approval** | Fund Requisition module manages the complete fund release workflow with multi-level approval |
| **Project Proposal Documentation** | Grant Registry and Lifecycle modules maintain complete project documentation from proposal to closeout |
| **Annual Audit Compliance** | Financial Reports module generates audit-ready statements; Audit Trail ensures complete activity logging |
| **Personnel Reporting (FD-4)** | HR module maintains complete staff database with project-wise allocation for FD-4 reporting |
| **Asset Reporting (FD-5)** | Fixed Assets module tracks all assets with donor-wise funding source for FD-5 compliance |
| **5-Year Voucher Retention** | All vouchers are digitally stored with full audit trail, ensuring the mandatory 5-year retention |

### 3.2 Foreign Donations (Voluntary Activities) Regulation Act, 2016 (FDRA)

| Requirement | How the System Addresses It |
|-------------|---------------------------|
| **Designated Bank Account** | Bank & Cash module tracks the NGOAB-designated "mother account" separately |
| **Prior Approval for Foreign Funds** | Fund Requisition workflow includes NGOAB approval stage |
| **Quarterly Progress Reports** | Automated FD-3 quarterly progress report generation |
| **Expenditure Documentation** | Complete voucher management with digital storage and multi-level approval |
| **Fund Utilization Reports** | Budget vs Actual and Donor Reports provide real-time fund utilization tracking |

### 3.3 Microcredit Regulatory Authority (MRA) Compliance

| Requirement | How the System Addresses It |
|-------------|---------------------------|
| **MRA Monthly Return (CDF-1)** | MRA Reports module tracks all required regulatory submissions with due dates |
| **Interest Rate Compliance** | Loan Products module configures rates within MRA-prescribed limits |
| **Loan Classification** | Overdue Management uses MRA provisioning norms (Watch/Substandard/Doubtful/Bad) |
| **Savings Regulation** | Savings module separates Compulsory and Voluntary savings per MRA guidelines |
| **Portfolio Quality Reporting** | PAR (Portfolio at Risk) analysis with PAR>30 tracking |
| **Client Protection** | Grievance Management module ensures client complaint resolution |
| **Annual Audited Report** | Financial statements generated in MRA-required format |
| **Governance Reporting** | Organization setup and audit trail ensure governance documentation |

### 3.4 Bangladesh Labour Act, 2006 Compliance

| Requirement | How the System Addresses It |
|-------------|---------------------------|
| **Leave Entitlements** | Leave Management module configured with all statutory leave types (Annual, Casual, Sick, Maternity 16 weeks, Paternity) |
| **Payroll Compliance** | Payroll module calculates TDS, Provident Fund deductions per BLA requirements |
| **Attendance Records** | Monthly attendance tracking with working hours, overtime, and late records |
| **Gratuity/Provident Fund** | PF deduction tracking in payroll; separate PF statement generation |
| **Service Records** | Complete employee lifecycle documentation from onboarding to separation |

### 3.5 International Standards & Best Practices

| Standard | Implementation |
|----------|---------------|
| **IPSAS (International Public Sector Accounting Standards)** | Chart of Accounts and financial reporting follow NGO-specific IPSAS guidelines |
| **LogFrame (Logical Framework Approach)** | Dedicated LogFrame module for donor-standard project planning |
| **Results-Based Management (RBM)** | Impact Assessment module with baseline-target-achievement tracking |
| **WCAG 2.1 AA (Web Accessibility)** | UI designed with 4.5:1 contrast ratio, keyboard navigation, screen reader support |
| **Data Privacy** | Role-based access control, audit trail, encrypted data storage |
| **Donor Compliance** | Supports reporting formats for USAID, World Bank, DFID/FCDO, UNICEF, EU, SDC, JICA |

---

## 4. Technology Stack

| Component | Technology | Version | Why |
|-----------|-----------|---------|-----|
| Framework | Next.js | 16.1.x | Industry-leading React framework with server-side rendering for performance |
| UI Library | React | 19.2.x | Latest stable with React Compiler for optimal performance |
| Language | TypeScript | 6.0.x | Type-safe development preventing runtime errors |
| Styling | Tailwind CSS | 4.1.x | Modern utility-first CSS with Oxide engine |
| Components | shadcn/ui | Latest 2026 | Production-grade accessible UI components |
| Database | PostgreSQL | 18.x | Enterprise-grade relational database |
| ORM | Prisma | 7.x | Type-safe database access with auto-migrations |
| Cache | Redis | 7.x | High-performance caching and session management |
| Charts | Recharts | 3.x | Interactive data visualization |
| Deployment | Node.js | 24.x LTS | Long-term support runtime |
| Monorepo | Turborepo | 2.x | Scalable build system |

---

## 5. Why This System

### For NGO Decision Makers

| Challenge | Our Solution |
|-----------|-------------|
| NGOAB compliance is manual and error-prone | Automated FD-1 to FD-9 form generation with deadline alerts |
| Donor reporting takes weeks of manual compilation | One-click donor-specific financial and narrative reports |
| No visibility across projects and funds | Real-time dashboard with fund utilization, project progress, and KPIs |
| Microfinance operations rely on paper | Complete digital MFI module with samity management, loan processing, and collection tracking |
| Procurement lacks transparency | eTendering, vendor management, and multi-level approval workflows |
| Asset tracking is unreliable | Full asset lifecycle management with depreciation and donor-wise tracking |
| Staff management is fragmented | Integrated HR from onboarding to payroll to performance review |
| No audit trail for accountability | Every action logged with user, timestamp, IP address, and change details |

### Key Differentiators

1. **Bangladesh-specific** — Built specifically for Bangladeshi NGO regulations, not adapted from generic ERP
2. **All-in-one** — 12 modules covering every aspect of NGO operations in a single platform
3. **Modern technology** — 2026 latest stable tech stack ensuring long-term maintainability
4. **Multi-compliance** — NGOAB + FDRA + MRA + BLA compliance built into every module
5. **Scalable** — From small CBOs to large national NGOs like BRAC/ASA/Proshika
6. **Cloud-ready** — Deploy on VPS, cloud, or on-premise based on organizational needs
7. **84 functional screens** — Comprehensive coverage with no "coming soon" placeholders
8. **Real-world example-driven** — Every feature designed around actual NGO workflows in Bangladesh

---

> **Document prepared by:** CodeMoly Development Team
> **Date:** February 2026
> **Version:** 2.0
> **Contact:** For demo access or queries, please contact the development team.
