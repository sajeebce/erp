# Onboarding to Offboarding Full Journey Test

Ei document-ta new tester-er jonno end-to-end HR + Finance journey test script. Goal holo ekta notun job post create kora theke applicant hire, employee onboarding, payroll journal entry, PF, offboarding, and final settlement journal entry porjonto sob checkpoint verify kora.

Dev URL: `http://localhost:4000`

## 0. Before Testing

1. App run thakte hobe port `4000`-e.
2. Admin/HR user diye login korun.
3. Finance journal entry verify korar jonno Admin or Finance Manager access thaka bhalo.
4. Test data note korar jonno niche IDs/links likhe rakhun:
   - Job title
   - Public job link
   - Applicant email
   - Employee number
   - Payroll run number
   - Payroll journal entry number
   - PF settlement number
   - Offboarding number
   - Offboarding journal entry number

Expected:
- Dashboard load hoy.
- `HR & Payroll`, `Finance`, `Projects`, and `Settings` module accessible.
- Page-level error dekhay na.

## 1. Create Job Post

Go to `/hr/recruitment/new`.

Create a test job:
- Title: `Field Coordinator E2E Test`
- Department: select any valid department
- Designation: select any valid designation, if available
- Employment type: `FULL_TIME` or `CONTRACT`
- Location: `Dhaka`
- Deadline: future date
- Description, Responsibilities, Qualifications: meaningful test text
- Preferred Skills: `Excel, Donor Reporting, Field Survey`
- Benefits: `Festival bonus, mobile allowance`

Requirements:
- Minimum education: `Masters`
- Minimum experience: `3`
- Required skills: `Project Management`, `Excel`, `Donor Reporting`
- Required languages: `Bengali`, `English`
- Required certifications: `PMP`

Submit.

Expected:
- Job create hoy.
- Job detail page open hoy.
- Requirement chips/badges job detail-e show kore.
- Job status initially draft thakte pare.

## 2. Publish Job And Share Link

On job detail page:

1. Click `Publish`.
2. Click copy/share link button.
3. Copy public URL.
4. Open the link in another browser/incognito window.

Also verify from `/hr/recruitment` list:
- Published job row-te share/copy link button kaj kore.

Expected:
- Draft job share disabled or unavailable.
- Published job public URL open hoy.
- URL pattern: `/careers/{orgSlug}/{jobSlug}`.
- Public page admin login chara load hoy.

## 3. Applicant Applies From Public Link

Public job link open kore application submit korun.

Use unique applicant data:
- Name: `Rahim E2E Test`
- Email: `rahim.e2e.<unique-number>@example.com`
- Phone: any valid number
- Education: `Masters`
- Experience: `3`
- Skills: select all required skills
- Languages: select `Bengali` and `English`
- Certifications: select `PMP`
- Confirm accuracy checkbox: checked
- CV upload: optional

Expected:
- Application submit successfully.
- Success message show kore.
- Same email diye abar submit korle duplicate validation ashbe.
- Required field missing rakhle validation ashbe.

## 4. Move Applicant Through Recruitment Pipeline

Return to admin job detail page `/hr/recruitment/{jobId}`.

1. Open `Pipeline` tab.
2. Confirm new applicant `APPLIED` column-e ache.
3. Applicant card click korun.
4. Verify applicant detail page.
5. Click `Score CV` if auto score not visible.
6. Click `Advance to Next` step by step until application reaches `HIRED`.

Expected:
- Applicant detail page-e self-declared education, experience, skills, language, certifications show kore.
- Score breakdown visible hoy.
- Applicant pipeline stage update hoy.
- `HIRED` stage-e gele `Convert to Employee` button visible hoy.

## 5. Convert Hired Applicant To Employee

On hired application detail page:

1. Click `Convert to Employee`.
2. Employee create form open hobe: `/hr/employees/new?fromApplication={applicationId}`.
3. Prefilled fields verify korun:
   - Full name
   - Email
   - Phone
   - Department/designation from job, if configured
4. Required fields complete korun:
   - Department
   - Designation
   - Joining date
   - Employment type
   - Basic salary, e.g. `50000`
   - Bank name and bank account number, if payroll/payslip verification korte chan
5. Save.

Expected:
- Employee create hoy.
- Employee detail page open hoy.
- Employee directory-te employee visible.
- Recruitment application reference employee info-te preserved thake.
- Default onboarding checklist employee-r jonno create hoy, if active checklist exists.
- Auto-created contract thakte pare, usually draft status-e.

## 6. Verify Employee Directory And Onboarding

Go to `/hr/employees`.

1. Search employee by name/email/employee number.
2. Employee row click korun.
3. Profile summary verify korun.
4. Go to `/hr/onboarding`.
5. Confirm new employee onboarding list-e visible.
6. Open `/hr/onboarding/{employeeId}`.
7. Checklist tasks visible kina check korun.
8. One or more task mark complete kore save/refresh check korun.

Expected:
- Employee active status-e ache.
- Onboarding progress employee-r sathe linked.
- Completed onboarding task refresh-er poro completed thake.

## 7. Assign Business Unit And Project

Open employee detail page `/hr/employees/{employeeId}`.

Employment/profile section:

1. Click edit.
2. Assign `Business Unit / Concern`.
3. Ensure department, designation, joining date, employment type thik ache.
4. Save.

Compensation section:

1. Basic salary greater than `0` confirm korun.
2. Salary grade/structure thakle assign korun, otherwise basic salary enough for payroll smoke test.
3. Save.

Projects tab:

1. Open `Projects` tab.
2. Click add project allocation.
3. Select active project.
4. Percentage set korun `100`.
5. Start date joining date or before June payroll period.
6. Save.

Expected:
- Business Unit / Concern profile-e show kore.
- Project allocation list-e active allocation show kore.
- Active project allocation total `100%`.
- Payroll approval-er time salary journal entry-te project/business unit dimension use hobe.

## 8. Contract Active/Approve Check

Go to `/hr/contracts`.

1. Search employee.
2. Open employee contract.
3. Confirm contract has:
   - Employee
   - Start date
   - Basic salary
   - Contract type
   - Project, if selected
4. Contract status active/approved path verify korun.

Expected:
- Employee-r jonno active/approved contract available.
- If converted employee auto-created contract draft thake and no approve action visible hoy, create a new contract from `/hr/contracts/new` for the same employee. Current new contract flow creates an active contract.
- Contract salary employee basic salary-er sathe consistent thake.

## 9. Create And Process June Payroll

Go to `/hr/payroll`.

1. Click `Run Payroll`.
2. Select:
   - Month: `June`
   - Year: current test year, e.g. `2026`
3. Click `Create Run`.
4. Payroll run row-e `Process` click korun.
5. Process complete hole payroll run select/open korun.
6. Payroll register-e employee ache kina verify korun.

Expected:
- Payroll run draft theke processed hoy.
- Employee count includes new active employee, if joining date June payroll period-er moddhe eligible.
- Employee gross/net salary show kore.
- Payslip icon/detail open hoy.
- Duplicate same month/year run create korte gele validation thakte pare.

## 10. Approve Payroll And Verify Finance Journal Entry

Payroll run status `PROCESSED` hole:

1. Admin/Finance Manager role diye `Approve` click korun.
2. Run status `APPROVED` hoy.
3. Go to `/finance/journal-entries`.
4. Search by payroll run number or description `Payroll`.
5. Open generated journal entry.

Expected:
- Payroll approval auto-generated approved journal entry create kore.
- Journal entry status `APPROVED`.
- Source module payroll/run reference preserved.
- Total debit equals total credit.
- Debit line salary expense account-e.
- Credit line bank/cash account-e.
- Payroll deductions thakle liability credit line thake.
- Salary debit line-e business unit/project/budget dimensions appear kore, if employee project allocation and budget mapping available.

## 11. Provident Fund Check

Go to `/hr/pension/provident-fund`.

PF policy/member setup:

1. Open `Policies`; active policy ache kina verify korun.
2. Open `Enrollments`.
3. If employee already enrolled, detail open korun.
4. If not enrolled, create enrollment:
   - Employee: newly converted employee
   - Policy: active PF policy
   - Effective date: joining date or before payroll/offboarding period

Contribution check:

1. Open `Contributions`.
2. Run or preview contribution for relevant period if available.
3. Open employee contribution detail/report.

Expected:
- Employee PF member hisebe visible.
- Current balance, employee contribution, employer contribution fields update hoy if contribution run completed.
- PF register/report employee-ke include kore.

## 12. Start Offboarding

Go to `/hr/offboarding/new`.

Create offboarding:
- Employee: newly created employee
- Separation type: `RESIGNATION` or `END_OF_CONTRACT`
- Notice date: test date
- Last working day: after joining date and after PF effective date
- Notice period days: `30`
- Notes: `E2E offboarding test`

Submit.

Expected:
- Offboarding record create hoy.
- Offboarding number generate hoy.
- Status `INITIATED`.
- Default tasks create hoy:
  - Return Laptop & Equipment
  - Revoke Email & System Access
  - Return ID Badge & Keys
  - Clear Financial Dues
  - Knowledge Transfer Documentation
  - Exit Interview
  - Update Employee Records
  - Issue Experience Certificate

## 13. Complete Offboarding Tasks And Settlement

Open offboarding detail page.

1. Mark all checklist tasks completed.
2. Fill exit interview:
   - Date
   - Interviewer
   - Exit reason
   - Notes
   - Would rehire checkbox as needed
3. Click save.
4. Click `Calculate Settlement`.
5. Verify settlement fields:
   - Leave encashment
   - Gratuity
   - Other payments
   - Deductions
   - Net settlement
6. Click `Complete Exit`.

Expected:
- Incomplete task thakle complete exit blocked hoy.
- All tasks complete hole `Complete Exit` available.
- Completion employee status update kore separation type onujayi, e.g. `RESIGNED`, `TERMINATED`, or `RETIRED`.
- Final settlement data remains visible.

## 14. Verify Offboarding Journal Entry

After `Complete Exit`:

1. Go to `/finance/journal-entries`.
2. Search by offboarding number or description `Final settlement`.
3. Open generated journal entry.

Expected:
- Auto-generated journal entry exists.
- Source module `offboarding` and source id/reference preserved.
- Journal entry status `APPROVED`.
- Total debit equals total credit.
- Debit line final settlement/salary expense account-e.
- Credit line bank/cash account-e.
- Deduction thakle liability credit line create hoy.
- Business unit/project dimension employee profile/project allocation theke carry kore.

## 15. Verify PF Settlement From Offboarding

Go to `/hr/pension/provident-fund/settlements`.

1. Search employee/offboarding reference.
2. Open PF settlement.
3. Verify:
   - Employee contribution
   - Employer contribution
   - Interest earned
   - Vested employer amount
   - Loan deduction, if any
   - Net payable
   - Offboarding reference

Expected:
- Employee active PF enrollment and positive balance thakle offboarding completion PF settlement create kore.
- No duplicate PF settlement create hoy if complete endpoint/action retried.
- If employee PF enrolled na thake or balance zero hoy, settlement absent thaka acceptable; tester note korbe.

## 16. Final Cross-Checks

Recruitment:
- Job status published.
- Applicant final stage hired.
- Convert-to-employee duplicate create hoy na.

Employee:
- Employee directory-te record ache.
- Employee status offboarding completion-er pore updated.
- Business Unit / Concern assigned.
- Project allocation total 100%.
- Contract active/approved.

Payroll:
- June payroll run approved.
- Payroll register includes employee before offboarding.
- Payroll journal entry approved and balanced.

Finance:
- Payroll JE and offboarding JE both visible.
- Debit/credit totals match.
- Business unit/project dimensions correct where applicable.

PF:
- PF enrollment/contribution checked.
- PF settlement checked after offboarding when eligible.

Regression:
- `/hr/recruitment` loads.
- Public careers apply form works.
- `/hr/employees` loads.
- `/hr/onboarding` loads.
- `/hr/payroll` loads.
- `/finance/journal-entries` loads.
- `/hr/offboarding` loads.

## Common Issues To Watch

- Applicant email must be unique.
- Job must be published before public link works.
- Employee joining date must make employee eligible for selected payroll month.
- Basic salary must be greater than `0` for meaningful payroll.
- Business Unit / Concern and 100% active project allocation are needed for clean dimension checks.
- Payroll approval requires Admin/Finance Manager role.
- Salary expense, bank/cash, and deduction liability accounts must exist before payroll/offboarding JE generation.
- PF settlement only appears when employee has active PF enrollment and positive balance.
- Offboarding cannot complete until all tasks are checked.

## Optional Verification Commands

Run TypeScript check:

```powershell
npx.cmd tsc --noEmit
```

Expected:
- TypeScript passes.

Note:
- Full lint may still fail because repo may have unrelated existing lint issues outside this journey.
