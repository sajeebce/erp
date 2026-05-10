# Onboarding to Offboarding Full Journey Test

Ei document-ta new tester-er jonno end-to-end HR + Finance journey test script. Goal holo ekta notun job post create kora theke applicant hire, employee onboarding, payroll journal entry, PF, offboarding, and final settlement journal entry porjonto sob checkpoint verify kora.

Note: `docs/hr-update.md` implement korar por ei test script-er HR update related checkpoint-gula active hobe. Ei update only department management, recruitment form cleanup, skills dropdown, offer/salary grade, notification email, SMTP/email queue, compensation benefits, payroll approval/email, and public career religion dropdown behavior-ke affect kore.

Dev URL: `http://localhost:4000`

## 0. Before Testing

1. App run thakte hobe port `4000`-e.
2. Admin/HR user diye login korun.
3. Finance journal entry verify korar jonno Admin or Finance Manager access thaka bhalo.
4. Test data note korar jonno niche IDs/links likhe rakhun:
   - Job title
   - Public job link
   - Applicant email
   - Department code/name
   - Salary structure name
   - Salary grade, e.g. `G1`
   - Employee number
   - Payroll run number
   - Payroll journal entry number
   - Email queue/event reference, if visible
   - PF settlement number
   - Offboarding number
   - Offboarding journal entry number

Expected:
- Dashboard load hoy.
- `HR & Payroll`, `Finance`, `Projects`, and `Settings` module accessible.
- `HR & Payroll > Departments` and `HR & Payroll > Notification Settings` accessible after HR update.
- Page-level error dekhay na.

## 0A. HR Update Prerequisites

Ei section only `docs/hr-update.md` implementation-er jonno.

Department setup:

1. Go to `/hr/departments` from `HR & Payroll > Departments`.
2. Confirm default seeded departments exist:
   - Finance & Accounts
   - Programs
   - Human Resources
   - Field Operations
   - IT & Systems
   - Administration
   - Monitoring & Evaluation
   - Procurement & Logistics
3. Create a test department if needed:
   - Name: `Field Programs E2E`
   - Code: `FP-E2E`
   - Status: active

Salary setup:

1. Go to `/hr/salary-structures`.
2. Create or verify active salary structure with gross breakdown components.
3. Go to `/hr/salary-grades`.
4. Create grade:
   - Grade: `G1`
   - Gross salary: `100000 BDT`
   - Select active salary structure
5. Confirm salary breakdown auto-calculates.
6. Edit salary grade pay levels and save.
7. Deactivate a test grade with the delete icon, then activate it again with the activate icon.

Notification and SMTP setup:

1. Go to `HR & Payroll > Notification Settings`.
2. Confirm default templates exist for recruitment, onboarding, and offboarding stage updates.
3. Go to `/settings/notifications`.
4. Configure SMTP using Gmail app password or test SMTP.
5. For Gmail test, use these values:
   - SMTP Server: `smtp.gmail.com`
   - SMTP Port: `587`
   - Encryption: `STARTTLS`
   - Gmail Username: full Gmail address, e.g. `yourname@gmail.com`
   - Gmail App Password: Google app password, 16 characters, e.g. `abcd efgh ijkl mnop` from Google Account security page
   - From Address: same Gmail address used in Gmail Username
   - From Name: `CSS BD HR`
   - Daily Send Limit: `500` or a small test limit like `20`
6. Gmail app password setup:
   - Open Google Account for the sender Gmail.
   - Turn on 2-Step Verification.
   - Go to Security > App passwords.
   - Create app password for Mail/Other app.
   - Copy the 16-character password and paste it in `Gmail App Password`.
   - Do not use the normal Gmail login password.
7. Click `Save Changes`.
8. Refresh `/settings/notifications` and confirm SMTP values are still saved.
9. Create a queue event by saving an offer, advancing a recruitment stage, or approving payroll.
10. Trigger the queue worker:
    - Browser: `/api/v1/cron/email-queue?limit=5`
    - PowerShell:
      ```powershell
      Invoke-RestMethod -Uri "http://localhost:4000/api/v1/cron/email-queue?limit=5" -Method POST
      ```
11. Check response:
    - `sent > 0` means email sent.
    - `processed > 0` and `skipped > 0` usually means SMTP config is missing/incomplete.
    - `failed > 0` means SMTP rejected or connection failed; check Gmail app password, 2-Step Verification, From Address, and SMTP port/encryption.
12. Check recipient inbox and spam folder.

Expected:
- Department list is DB-backed and active departments are selectable in recruitment.
- Salary grade `G1` has gross salary and component breakdown.
- Salary grade create/edit saves successfully; pay levels do not clear unexpectedly while editing.
- Salary grade inactive/active toggle works from action icons.
- Notification templates are editable.
- SMTP configuration saves, queue worker processes email, and Gmail test sends real mail when app password is valid.

## 1. Create Job Post

Go to `/hr/recruitment/new`.

Create a test job:
- Title: `Field Coordinator E2E Test`
- Department: select active department from `HR & Payroll > Departments`, e.g. `Field Programs E2E` or `Field Operations`
- Designation: select any valid designation, if available
- Employment type: `FULL_TIME` or `CONTRACT`
- Location: `Dhaka`
- Deadline: future date
- Description and Responsibilities: meaningful test text
- Benefits: `Festival bonus, mobile allowance`

Requirements:
- Minimum education: `Masters`
- Minimum experience: `3`
- Required skills: select from multi dropdown: `Project Management`, `Excel`, `Donor Reporting`
- Required languages: `Bengali`, `English`
- Required certifications: `PMP`

Submit.

Expected:
- Job create hoy.
- Job detail page open hoy.
- Requirement chips/badges job detail-e show kore.
- `Qualifications` and `Preferred Skills` fields form-e thake na.
- Required skills comma diye type korle tag create hoy and selected tags visible thake.
- Job pipeline skills filter dropdown/multi-select-e trigger summary first skill + `more` count show kore, but dropdown-er niche duplicate selected chips show kore na.
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
- Public page-e `Qualifications` and `Preferred Skills` old free-text sections show kore na.
- Public page-e structured required skills, education, language, and certifications show kore.

## 3. Applicant Applies From Public Link

Public job link open kore application submit korun.

Use unique applicant data:
- Name: `Rahim E2E Test`
- Email: `rahim.e2e.<unique-number>@example.com`
- Phone: any valid number
- Religion: select from dropdown, e.g. `Islam` or `Prefer not to say`
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
- Religion dropdown mandatory; religion select na korle validation error ashbe.
- Religion dropdown value application-er sathe save hoy.
- Application received email queue/send hoy template onujayi, if SMTP/email queue active.

## 4. Move Applicant Through Recruitment Pipeline

Return to admin job detail page `/hr/recruitment/{jobId}`.

1. Open `Pipeline` tab.
2. Confirm new applicant `APPLIED` column-e ache.
3. Applicant card click korun.
4. Verify applicant detail page.
5. Click `Score CV` if auto score not visible.
6. Click `Advance to Next` step by step until application reaches `OFFER` stage.
7. Open `Offer` tab.
8. Select salary grade `G1`.
9. Verify salary breakdown, gross salary, and leave benefits:
   - Annual Leave
   - Casual Leave
   - Maternity Leave, if applicable
   - Sick Leave
10. Edit leave benefit days if needed and confirm values update.
11. Add custom offer message, e.g. `Welcome to CSSBD. Please review the offer details.`
12. Send or save offer according to UI flow.
13. Verify offer email queue/send entry is created for applicant.
14. Continue stage update until application reaches `HIRED`.

Expected:
- Applicant detail page-e self-declared education, experience, skills, language, certifications show kore.
- Applicant detail page-e selected religion show kore.
- Score breakdown visible hoy.
- Applicant pipeline stage update hoy.
- Prottek stage update-e template-based email queue/send hoy.
- Offer tab-e personal/other tab-er extra information show kore na; only offer details show kore.
- Offer email-e salary grade, salary breakdown, leave benefits, and custom message thake.
- Offer tab-e salary grade select korar por pay level explicitly select kora jay; hidden midpoint salary automatically use hoy na.
- Interview history duration number shoho show kore, e.g. `30 min`; shudhu `min` show kore na.
- `HIRED` stage-e gele `Convert to Employee` button visible hoy.

## 5. Convert Hired Applicant To Employee

On hired application detail page:

1. Click `Convert to Employee`.
2. Employee create form open hobe: `/hr/employees/new?fromApplication={applicationId}`.
3. Prefilled fields verify korun:
   - Full name
   - Email
   - Phone
   - Bangla/local name, father/spouse name, mother name
   - Date of birth, gender, nationality, NID, religion, blood group, marital status
   - Present/permanent address and emergency contact
   - Education, skills, languages, certifications, if candidate submitted them
   - Department/designation from job, if configured
4. Required fields complete korun:
   - Department
   - Designation
   - Joining date
   - Employment type
   - Salary grade from offer, e.g. `G1`, if not already prefilled
5. Save.

Expected:
- Employee create hoy.
- Employee detail page open hoy.
- Employee directory-te employee visible.
- Recruitment application reference employee info-te preserved thake.
- Applicant-er selected religion employee profile-e copy hoy.
- Applicant-er selected gender/marital status employee form-e normalized hoye selected thake, e.g. `Male` -> `MALE`, `Unmarried` -> `SINGLE`.
- Applicant-er emergency contact custom relationship, e.g. `Uncle`, profile-e readable text hisebe show kore; raw translation key show kore na.
- Offer stage-er selected salary grade employee profile-e preserved thake.
- Offer stage-er selected salary grade employee create form-e prefilled thake.
- Offer stage-er selected pay level/basic amount employee create form-e prefilled thake and employee profile-e matching grade pay level show kore.
- Salary structure missing thakle employee create/profile active grade-specific or default/global active salary structure fallback use kore.
- Bank details initially blank thaka acceptable; onboarding/employee creation block korbe na.
- Default onboarding checklist employee-r jonno create hoy, if active checklist exists.
- Auto-created contract thakte pare, usually draft status-e.
- Hired/onboarding stage email queue/send hoy template onujayi.

## 6. Verify Employee Directory And Onboarding

Go to `/hr/employees`.

1. Search employee by name/email/employee number.
2. Employee row click korun.
3. Profile summary verify korun.
4. Personal Information section-e religion applicant form-er selected value-er sathe match kore kina verify korun.
5. Open `/hr` Employee Directory.
6. Verify `Religion-wise Employee Count` summary card/section visible.
7. Confirm selected religion count at least `1` increase/include kore.
8. Confirm Employee Directory main filter row only 3 ta filter show kore:
   - Department
   - Designation
   - Duty Station
9. Open employee profile again and go to `Compensation & Benefits` tab.
10. Verify salary grade `G1`, gross salary, salary structure, component breakdown, and leave benefits show kore.
11. Click edit on `Compensation & Benefits` and verify calculated fields are prefilled from salary grade + salary structure:
   - Basic Salary
   - House Rent Allowance
   - Medical Allowance
   - Transport Allowance
   - Gross Salary
12. Verify bank details blank ache, then optionally fill bank details later.
13. Go to `/hr/onboarding`.
14. Confirm new employee onboarding list-e visible.
15. Open `/hr/onboarding/{employeeId}`.
16. Checklist tasks visible kina check korun.
17. One or more task mark complete kore save/refresh check korun.

Expected:
- Employee active status-e ache.
- Employee profile-e religion show kore.
- `/hr` Employee Directory page-e religion-wise employee count summary show kore.
- `/hr` Employee Directory filter row-e only Department, Designation, Duty Station thake.
- Compensation & Benefits tab offer-er salary grade and benefits show kore.
- Compensation & Benefits view mode and edit mode same grade + salary structure calculation follow kore.
- Example `G-1 Pay Level 3` with `Standard Bangladesh` and PF Not Enrolled:
  - Basic `20,000`
  - House Rent `10,000`
  - Medical `2,000`
- Transport `3,000`
- Gross `35,000`
  - PF line `Not deducted - PF enroll needed` show korbe, but amount deduct korbe na
  - Tax deduction `1,000`
  - Net `34,000`
- Same employee PF active enrollment hole PF deduction `2,000` apply hobe and net `32,000` hobe.
- Blank bank details employee profile-ke invalid kore na.
- Onboarding progress employee-r sathe linked.
- Completed onboarding task refresh-er poro completed thake.
- Onboarding stage update email queue/send hoy template onujayi.

## 7. Assign Business Unit And Project

Open employee detail page `/hr/employees/{employeeId}`.

Employment/profile section:

1. Click edit.
2. Assign `Business Unit / Concern`.
3. Ensure department, designation, joining date, employment type thik ache.
4. Save.

Compensation section:

1. Salary grade `G1` assigned ache kina confirm korun.
2. Salary grade breakdown and gross salary visible kina confirm korun.
3. Bank details blank thakle optional bhabe fill korun, but payroll salary calculation salary grade theke hobe.
4. Save.

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
- Salary grade assigned and payroll-ready.
- Payroll approval-er time salary journal entry-te project/business unit dimension use hobe.

## 8. Contract Active/Approve Check

Go to `/hr/contracts`.

1. Search employee.
2. Open employee contract.
3. Confirm contract has:
   - Employee
   - Start date
   - Salary grade/gross salary or contract salary, depending on implemented contract fields
   - Contract type
   - Project, if selected
4. Contract status active/approved path verify korun.

Expected:
- Employee-r jonno active/approved contract available.
- If converted employee auto-created contract draft thake and no approve action visible hoy, create a new contract from `/hr/contracts/new` for the same employee. Current new contract flow creates an active contract.
- Contract salary employee salary grade/gross salary-er sathe consistent thake.

## 9. Create And Process June Payroll

Go to `/hr/payroll`.

1. Click `Run Payroll`.
2. Select:
   - Month: `June`
   - Year: current test year, e.g. `2026`
3. Click `Create Run`.
4. Payroll run row-e `Process` click korun.
5. Process complete hole payroll run select/open korun or `View Register` click korun.
6. Payroll register-e employee ache kina verify korun.

Expected:
- Payroll run draft theke processed/requested flow-e jay.
- Employee count includes new active employee, if joining date June payroll period-er moddhe eligible.
- Employee salary grade `G1` onujayi gross, breakdown, deductions, and net salary show kore.
- `View Register` action selected payroll register/details load kore.
- HR role diye payroll run korle status `Requested` and action column-e `Requested to Admin` show kore.
- Duplicate same month/year run create korte gele validation thakte pare.

## 10. Approve Payroll And Verify Finance Journal Entry

Payroll run status `Requested` or `PROCESSED` hole:

1. Admin role diye `/hr/payroll` open korun.
2. Requested payroll row-e `Approve` click korun. HR role-e ei jaygay `Requested to Admin` disabled action show korbe.
3. Run status `APPROVED` hoy.
4. HR role/page theke same payroll row-e `Approved` status visible kina verify korun.
5. Verify payroll approval-er por employee payroll email queue entries create hoy.
6. Go to `/finance/journal-entries`.
7. Search by payroll run number or description `Payroll`.
8. Open generated journal entry.

Expected:
- HR payroll request Admin approval chara approved hoy na.
- Payroll approval auto-generated approved journal entry create kore.
- Journal entry status `APPROVED`.
- Source module payroll/run reference preserved.
- Total debit equals total credit.
- Debit line salary expense account-e.
- Credit line bank/cash account-e.
- Payroll deductions thakle liability credit line thake.
- Salary debit line-e business unit/project/budget dimensions appear kore, if employee project allocation and budget mapping available.
- Payroll approval-er por employee-wise email queue status `PENDING`, `SENDING`, `SENT`, `FAILED`, or `RETRYING` hisebe track hoy.

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
- Offboarding employee dropdown only `ACTIVE` employee show kore.
- Same employee-er active offboarding already thakle duplicate offboarding create hoy na.
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
- Completion active project allocation close kore and active contract terminate kore, so employee future payroll/allocation readiness theke baad pore.
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
- PF settlement approve/pay korle PF enrollment `SETTLED` hoy and balance zero hoy.
- If employee PF enrolled na thake or balance zero hoy, settlement absent thaka acceptable; tester note korbe.

## 16. Final Cross-Checks

Recruitment:
- Job status published.
- Applicant final stage hired.
- Recruitment form-e `Qualifications` and `Preferred Skills` removed.
- Required skills multi-select/dropdown behavior verified.
- Offer tab salary grade, leave benefits, and custom offer message verified.
- Convert-to-employee duplicate create hoy na.

Employee:
- Employee directory-te record ache.
- Employee profile-e applicant selected religion copied and visible.
- `/hr` Employee Directory-te religion-wise count summary visible.
- `/hr` Employee Directory-te Religion filter diye employee list filter kora jay.
- Employee status offboarding completion-er pore updated.
- Offboarded employee notun offboarding selection list-e ar show kore na.
- Offboarded employee-er active project allocation/active contract remain kore na.
- Business Unit / Concern assigned.
- Salary grade and Compensation & Benefits tab verified.
- Provident Fund Not Enrolled hole Compensation & Benefits salary breakdown-e PF line `Not deducted - PF enroll needed` show korbe, but amount deduct korbe na; PF active enrollment korar por PF deduction amount show/apply korbe.
- Bank details initially blank but editable.
- Project allocation total 100%.
- Contract active/approved.

Payroll:
- June payroll run approved.
- Payroll register includes employee before offboarding.
- Payroll calculated from assigned salary grade.
- Payroll gross salary basic salary + salary structure earning components include kore, only allowance sum hisebe show kore na.
- Payroll approval email queue checked.
- Payroll journal entry approved and balanced.

Notification:
- Recruitment, onboarding, and offboarding stage update emails are queued/sent from templates.
- SMTP configuration/test email verified.
- Payroll approved email queue processed or pending status visible.

Finance:
- Payroll JE and offboarding JE both visible.
- Debit/credit totals match.
- Business unit/project dimensions correct where applicable.

PF:
- PF enrollment/contribution checked.
- PF enrollment create korar sathei first effective month contribution auto-post hoy and employee profile refresh korle PF balance update dekha jay.
- PF enrollment page theke employee profile tab-e fire ashle Retirement Benefits card latest PF balance show kore.
- PF settlement checked after offboarding when eligible.

Regression:
- `/hr/departments` loads.
- `/hr/salary-structures` loads.
- `/hr/salary-grades` loads.
- `/settings/notifications` loads.
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
- Active department must exist before creating job posting.
- Salary structure and salary grade must exist before offer/payroll verification.
- Employee must have assigned salary grade for payroll calculation.
- Salary structure-e PF component thakleo employee PF active enrollment na thakle PF amount deduct hobe na; profile-e status text `Not deducted - PF enroll needed` show korte pare.
- PF enrollment create hole first contribution auto-create hoy; first balance check korte Contributions tab-e manual run mandatory na.
- Employee profile summary/latest PF balance focus/refresh-e update hoy, so stale `BDT 0` thakar kotha na.
- Religion filter public career religion values-er sathe match kore and `Islam`/`ISLAM` duplicate count kore na.
- Business Unit / Concern and 100% active project allocation are needed for clean dimension checks.
- Payroll approval requires Admin role after HR request.
- SMTP config/email queue worker must be available for email send verification; otherwise verify queued entries.
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
