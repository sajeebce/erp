# HR Salary, Offer, Notification, And Payroll Update Plan

Ei document-er goal holo HR module-er department management, employee directory filters, salary structure, salary grade, recruitment offer, recruitment form cleanup, recruitment skills dropdown, notification template, SMTP email, employee compensation, payroll approval, and public career form update requirements ek jaygay rakha.

Dev URL: `http://localhost:4000`

## 1. Salary Structure Setup

Page: `/hr/salary-structures`

Requirements:

1. Admin/HR salary structure create korte parbe.
2. Salary structure-er moddhe gross salary breakdown rules thakbe.
3. Breakdown rule percentage or fixed amount based hote pare, project-er existing design onujayi final field decide korte hobe.
4. Example components:
   - Basic Salary
   - House Rent
   - Medical Allowance
   - Conveyance Allowance
   - Other Allowance
   - Provident Fund deduction, if applicable
   - Tax deduction, if applicable
5. Salary structure active/inactive kora jabe.
6. Active salary structure salary grade creation-er somoy selectable hobe.

Expected:

- Salary structure save hole tar component rules persist hobe.
- Same structure multiple salary grade-e use kora jabe.
- Structure update korle existing approved payroll history change hobe na.

## 2. Salary Grade Setup

Page: `/hr/salary-grades`

Requirements:

1. Salary grade create korar somoy salary structure select korte hobe.
2. Gross salary input dile selected salary structure onujayi auto breakdown calculate hobe.
3. Example:
   - Grade `G1`
   - Gross salary: `100000 BDT`
   - Selected salary structure onujayi component breakdown auto generate hobe.
4. Another example:
   - Grade `G2`
   - Gross salary: `80000 BDT`
   - Same or selected salary structure onujayi G2-er breakdown auto generate hobe.
5. Admin/HR breakdown preview dekhte parbe before saving.
6. Saved salary grade employee offer, employee profile, and payroll run-e use hobe.

Expected:

- Grade-wise gross salary and component breakdown correctly save hobe.
- Grade select korle API/UI theke component breakdown retrieve kora jabe.
- Payroll calculation salary grade-er saved breakdown follow korbe.
- Salary grade create/edit form save korle steps preserve hobe.
- Pay level input edit korar somoy full number unintentionally clear hoye jabe na.
- Active grade delete icon diye deactivate kora jabe.
- Inactive grade action icon diye abar activate kora jabe.
- Grade-er specific salary structure na thakle active default/global salary structure fallback hisebe use hote parbe.

## 3. Recruitment Application Offer Tab

Example page: `/hr/recruitment/applications/25c777e4-5e0d-4e8b-a7cd-3488dee6c656`

Offer stage-er tab update korte hobe.

Current problem:

- Offer tab-e personal information ba onno tab-er extra information show korar dorkar nai.

Requirements:

1. Applicant jokhon offer stage-e thakbe, Offer tab-e only company ki offer kortese seta show korbe.
2. Offer tab-e salary grade select korar field thakbe.
3. Salary grade select korle salary breakdown show korbe.
4. Leave benefits show korbe:
   - Annual Leave
   - Casual Leave
   - Maternity Leave
   - Sick Leave
   - Any other configured leave type
5. Prottek leave type-er allowed days/count show korbe.
6. Extra custom offer message input field thakbe.
7. Offer send korle applicant-er kache email jabe.
8. Email-e Offer tab-e thaka sob relevant information include hobe:
   - Position/job information
   - Salary grade
   - Gross salary
   - Salary breakdown
   - Leave benefits and counts
   - Custom offer message
   - Next step or response instruction, if available

Expected:

- Offer tab clean and offer-focused hobe.
- Salary grade select korar por breakdown immediately visible hobe.
- Offer email applicant-er email address-e queue/send hobe.
- Offer stage-e selected salary grade later employee create/profile/payroll flow-e source of truth hisebe use hobe.
- Offer tab-er leave benefits editable hobe.
- Application interview history-te duration `durationMinutes` field theke proper value show korbe, e.g. `30 min`; shudhu `min` show korbe na.

## 4. Stage Update Email Notification

Requirements:

1. Recruitment/onboarding/offboarding-er prottek stage update hole applicant/employee-er kache email jabe.
2. Email content notification template theke generate hobe.
3. Stage-wise event examples:
   - Application received
   - Shortlisted
   - Interview scheduled
   - Offer stage
   - Offer sent
   - Hired
   - Onboarding started
   - Onboarding completed
   - Offboarding started
   - Clearance pending
   - Final settlement completed
4. Email immediate send na hole email queue-te thakbe.
5. Failed email retry korar mechanism thaka uchit.

Expected:

- Stage update transaction complete hole related email queue entry create hobe.
- Email send success/failure status track kora jabe.
- Duplicate email avoid korte event key/idempotency use kora uchit.

## 5. HR & Payroll Notification Settings

Navigation:

- Left navigation-e `HR & Payroll` menu-er under-e `Notification Settings` add korte hobe.

Requirements:

1. Notification settings page-e onboarding and offboarding-er prottek stage-er jonno default mail template thakbe.
2. Admin template edit korte parbe.
3. Template fields:
   - Template name
   - Event/stage
   - Email subject
   - Email body
   - Active/inactive
4. Template body dynamic variables support korbe.
5. Suggested variables:
   - `{{applicantName}}`
   - `{{employeeName}}`
   - `{{jobTitle}}`
   - `{{stageName}}`
   - `{{salaryGrade}}`
   - `{{grossSalary}}`
   - `{{offerMessage}}`
   - `{{companyName}}`
   - `{{startDate}}`
6. Default templates seed korte hobe, but admin edit korle edited version use hobe.

Expected:

- Stage update email template-based hobe.
- Admin template edit korle next email theke updated content use hobe.
- Missing template thakle fallback default template use hobe or clear error log hobe.

## 6. SMTP Configuration

Page: `/settings/notifications`

Requirements:

1. SMTP configuration setting add korte hobe.
2. Gmail app password diye email send korar moto configuration support korte hobe.
3. Fields:
   - SMTP host, example: `smtp.gmail.com`
   - SMTP port, example: `587`
   - Secure/TLS option
   - Sender email
   - Sender name
   - SMTP username
   - SMTP app password
   - Test recipient email
4. Admin test email send kore configuration verify korte parbe.
5. Password encrypted/secure storage-e save korte hobe.
6. Password UI-te plain text show kora jabe na after save.

Expected:

- Valid Gmail SMTP app password diye test email send hobe.
- Invalid configuration hole clear validation/error message show hobe.
- Email queue worker ei SMTP config use kore mail send korbe.

## 7. Employee Profile Compensation & Benefits

Example page: `/hr/employees/defdf8af-f7b8-4359-a3f0-c127c2d83eaf`

Tab: `Compensation & Benefits`

Requirements:

1. Applicant onboard hoye employee howar por offer-e selected salary grade employee profile-e show korbe.
2. Compensation & Benefits tab-e show korbe:
   - Salary grade
   - Gross salary
   - Salary structure name
   - Salary component breakdown
   - Leave benefits
3. Bank details section initially blank thakbe.
4. Bank details pore fill up kora jabe.
5. Bank details fields:
   - Bank name
   - Branch name
   - Account name
   - Account number
   - Routing number, if applicable
   - Payment method

Expected:

- Employee conversion-er somoy salary grade link preserve hobe.
- Offer tab-e selected salary grade employee create page-e `/hr/employees/new?fromApplication={applicationId}` diye gele auto prefill hobe.
- Candidate public career form-e fill kora personal/contact data employee create page-e auto prefill hobe, including name, Bangla/local name, email, phone, father/spouse name, mother name, date of birth, gender, nationality, NID, religion, blood group, marital status, present/permanent address, emergency contact, education, skills, languages, and certifications.
- Public career form-er `Male/Female/Other` and `Married/Unmarried/Other` values employee form-er dropdown values-e normalize hoye prefill hobe.
- Employee profile-er emergency contact relationship known enum hole translated label show korbe; custom relationship value, e.g. `Uncle`, raw translation key na dekhaye readable text show korbe.
- Salary grade-er selected basic salary pay level-er sathe match kore employee profile-e correct pay level show korbe.
- Employee-r explicit salary structure missing hole system first grade-specific active structure, then default/global active salary structure fallback use korbe.
- Compensation & Benefits view mode and edit mode same salary grade + salary structure calculation follow korbe.
- Bank details blank thakleo profile valid thakbe.
- Payroll run salary grade data use korte parbe.

Current expected salary flow:

1. HR offer tab-e salary grade select korbe.
2. Hired applicant convert korle offer-er salary grade employee create form-e prefill hobe.
3. Employee create/save korle selected grade, matching salary pay level, and resolved salary structure employee profile-e preserve hobe.
4. Compensation & Benefits tab salary grade pay level + salary structure component rules theke breakdown calculate korbe.
5. Edit mode-eo same calculated basic/allowance/gross values prefill hobe, so HR-ke manually allowance field fill korte hobe na.
6. Payroll run same grade/pay level/structure source use korbe.

## 8. Payroll Run From Salary Grade

Page: `/hr/payroll`

Requirements:

1. Payroll run korle employee-er assigned salary grade onujayi calculation hobe.
2. Gross salary, salary structure breakdown, deductions, and net payable calculate hobe.
3. Salary grade missing thakle employee payroll run-e warning/error show korte hobe.
4. Payroll run save korle employee-wise payroll lines create hobe.

Expected:

- Employee-er salary grade `G1` hole `G1` breakdown onujayi payroll line hobe.
- Employee-er salary grade `G2` hole `G2` breakdown onujayi payroll line hobe.
- Payroll historical data salary grade future update-er karone silently change hobe na.

## 9. Payroll Approval And Email Flow

Page: `/hr/payroll`

Requirements:

1. HR role payroll run korle status `Requested` show korbe and action column-e `Requested to Admin` show korbe.
2. Admin/Finance Manager payroll page-e ei payroll request approve korte parbe.
3. Admin approve korar por HR dashboard/page action column-e `Approved` status show korbe.
4. Payroll approve hole oi payroll run-er under-e thaka sob employee-er kache email jabe.
5. Payroll email direct batch send na kore queue-te add hobe.
6. Email queue one by one process hobe.
7. Cron job or background worker lagte pare email queue process korar jonno.
8. Payroll run-er eye/view action `View Register` hisebe clear label thakbe and selected payroll register/details load korbe.

## 9.1 Offboarding Completion Cleanup

Pages: `/hr/offboarding`, `/hr/offboarding/new`

Requirements:

1. Offboarding initiate dropdown-e only `ACTIVE` employee selectable hobe.
2. Same employee-er active offboarding already thakle duplicate offboarding create hobe na.
3. Offboarding complete korle employee status separation type onujayi `RESIGNED`, `TERMINATED`, or `RETIRED` hobe.
4. Offboarding complete korle active project allocation close hobe.
5. Offboarding complete korle active employee contract terminate hobe.
6. Final settlement JE and PF settlement retry-safe hobe, duplicate create hobe na.

Expected:

- Offboarded employee historical records-e thakbe, but active payroll/project/contract workflow theke exclude hobe.
- Future payroll run employee status `ACTIVE` na hole include korbe na.
- PF settlement pay korle PF enrollment `SETTLED` hoy and PF balance zero hoy.

Expected:

- HR submitted payroll cannot be treated as approved until Admin approval.
- Admin approval audit log thakbe.
- Approved payroll-er employee email queue entries create hobe.
- Queue worker email send kore status update korbe: `PENDING`, `SENDING`, `SENT`, `FAILED`, `RETRYING`.

## 10. Email Queue And Cron Consideration

Requirements:

1. Central email queue table/model thaka uchit.
2. Queue record fields:
   - Recipient email
   - Subject
   - Body
   - Related module
   - Related entity id
   - Status
   - Retry count
   - Last error
   - Scheduled at
   - Sent at
3. Cron/background job pending email process korbe.
4. Failed email retry limit thakbe.
5. Same event-er duplicate email avoid korte unique event key use kora uchit.

Expected:

- Payroll approval-er moto large email batch stable bhabe process hobe.
- Email send failure payroll approval transaction rollback korbe na.
- Admin future-e email queue monitoring korte parbe.

## 11. Public Career Form Religion Dropdown

Example public page: `/careers/cssbd/field-coordinator-test-dhaka-bangladesh-1778056471225`

Requirement:

1. Application form-er `Religion` field text input na hoye dropdown hobe.
2. `Religion` field mandatory hobe.
3. Empty/default value diye form submit kora jabe na.
4. Suggested options:
   - Islam
   - Hinduism
   - Christianity
   - Buddhism
   - Other
   - Prefer not to say
5. Existing validation dropdown value accept korbe.
6. Existing saved applicant data display korte parbe.

Expected:

- Public applicant form-e religion dropdown show hobe.
- Religion select na korle validation error show hobe.
- Submit korle selected religion application-er sathe save hobe.

## 12. Religion Data Flow And Demographics Summary

Flow:

1. Public career page-e applicant `Religion` mandatory dropdown theke select korbe.
2. Submit korle selected religion `JobApplication.religion` field-e save hobe.
3. HR applicant detail page-e religion show korbe.
4. Applicant hired/convert-to-employee korar somoy `JobApplication.religion` theke `Employee.religion` field-e copy hobe.
5. Employee profile-er Personal Information section-e religion show korbe.
6. `/hr` Employee Directory page-e religion-wise employee count summary show korbe.

Suggested display:

- Page: `/hr`
- Section/card title: `Religion-wise Employee Count`
- Show count:
  - Islam
  - Hinduism
  - Christianity
  - Buddhism
  - Other
  - Prefer not to say
  - Not specified, if old employee records have blank religion

Requirements:

1. Religion-wise count active/current employees-er upor calculate hobe.
2. Count card Employee Directory filter row-er sathe conflict korbe na.
3. `/hr` page-er main filter row still only 3 ta filter thakbe:
   - Department
   - Designation
   - Duty Station
4. Religion count click korle optional future enhancement hisebe employee list filter kora jete pare, but first implementation-e count show korlei enough.
5. Old employee records-e religion blank thakle `Not specified` bucket-e count hobe.

Expected:

- Applicant detail page-e selected religion show hobe.
- Convert-to-employee-er por employee profile-e same religion show hobe.
- `/hr` Employee Directory page-e religion-wise count summary show hobe.
- Religion summary employee table/search/filter behavior break korbe na.

## 13. Recruitment Job Skills Multi Dropdown

Example page: `/hr/recruitment/2be402a5-1fee-4647-bb7e-3d44651c3883`

Requirement:

1. Recruitment job detail/edit page-e skills field dropdown akare thakbe.
2. Skills field multi-select hobe.
3. Dropdown theke skill select korle selected skill dropdown/input area-te visible hobe.
4. Selected skill remove/delete korar option thakbe.
5. Multiple skill select kora jabe.
6. Selected skills display compact hobe:
   - First selected skill visible thakbe.
   - Baki selected skills `+2 more`, `+3 more` type count akare show korbe.
   - User click/expand korle full selected skills list dekha jabe.
7. Dropdown search/filter support korle better, jate large skills list theke quickly select kora jay.
8. Duplicate skill select kora jabe na.
9. Saved skills job detail, public career page, and applicant matching/scoring-e use hobe.

Expected:

- Skills input free text na hoye controlled dropdown/multi-select hobe.
- Select korar por skill immediately selected list-e show hobe.
- Remove korle selected list and saved payload update hobe.
- One skill visible rekhe baki selected skills `more` count akare compact bhabe show hobe.
- `/hr/recruitment/{jobId}` pipeline skills filter dropdown-e selected summary/count trigger-e show korbe, but dropdown-er niche duplicate selected chips show korbe na.
- `/hr/recruitment/new` page-e comma diye skill type korle tag create hobe and selected tags visible thakbe; ekhane `+N more` compact chips use kora hobe na.

## 14. Recruitment New/Edit Form Cleanup

Page: `/hr/recruitment/new`

Requirement:

1. Job Description section theke `Qualifications` field remove korte hobe.
2. Job Description section theke `Preferred Skills` field remove korte hobe.
3. Qualification/degree requirement `Minimum Education` structured dropdown diye handle hobe.
4. Skill requirement `Required Skills` structured multi-select dropdown diye handle hobe.
5. Optional/nice-to-have skill alada free text hisebe rakhar dorkar nai.
6. Public career page-e `Qualifications` and `Preferred Skills` sections hide/remove korte hobe.
7. Job create/update API-te `qualifications` required validation remove korte hobe.
8. Existing database field thakle backward compatibility-er jonno nullable/optional rakha jete pare, but UI-te new data entry nibe na.
9. Existing old job posting-e qualifications/preferred skills data thakle migration decision lagbe:
   - Option A: display na kore ignore kora.
   - Option B: one-time migrate kore structured fields-e map kora, jodi clean mapping possible hoy.

Expected:

- `/hr/recruitment/new` form-e duplicate requirement fields thakbe na.
- Degree selection only `Minimum Education` theke hobe.
- Skills selection only `Required Skills` multi-select/dropdown theke hobe.
- Public career page cleaner hobe and structured requirements-er sathe consistent thakbe.

## 15. HR Department Management

Navigation:

- Left navigation-e `HR & Payroll` menu-er under-e `Departments` add korte hobe.

Suggested page:

- `/hr/departments`

Current data source:

- Recruitment new page-er department dropdown currently `GET /api/v1/hr/departments` theke data ney.
- Ei API `Department` table theke logged-in organization wise data return kore.

Requirements:

1. HR & Payroll menu theke department list page access kora jabe.
2. Admin/HR department create, edit, active/inactive korte parbe.
3. Department fields:
   - Department name
   - Department code
   - Parent department, optional
   - Department head, optional
   - Active/inactive status
4. Department table organization-wise unique name and code maintain korbe.
5. Recruitment job create/edit form-er department dropdown ei same `Department` table/API theke data nibe.
6. Employee profile, job posting, budget, user assignment, and org chart existing relationship preserve korte hobe.
7. Inactive department new job posting-e selectable hobe na.
8. Existing job/employee-te linked inactive department display korte parbe, but new selection-e restrict thakbe.
9. Seed update korte hobe jate default departments thake.
10. Suggested default seed departments:
   - Finance & Accounts
   - Programs
   - Human Resources
   - Field Operations
   - IT & Systems
   - Administration
   - Monitoring & Evaluation
   - Procurement & Logistics
11. Database migration/check korte hobe:
   - `Department` table thakle existing schema reuse korte hobe.
   - Missing field thakle migration add korte hobe.
   - `isActive` field thakle list/filter-e use korte hobe.
12. Seed script idempotent hote hobe, mane same department duplicate create korbe na.

Expected:

- HR & Payroll menu-te Department management visible hobe.
- Admin/HR UI theke department maintain korte parbe.
- `/hr/recruitment/new` department dropdown updated active department list show korbe.
- Seed run korle default departments table-e thakbe.
- Existing recruitment, employee, and org chart relation break hobe na.

## 16. Employee Directory Filters

Page: `/hr`

Current problem:

- Employee Directory page-er filter row-te 4 ta generic `All` dropdown ache, but user bujhte pare na kon filter ki.

Requirement:

1. Current 4 ta generic `All` filter replace korte hobe.
2. Only 3 ta filter thakbe:
   - Department
   - Designation
   - Duty Station
3. Prottek filter-er placeholder/label clear hobe:
   - `All Departments`
   - `All Designations`
   - `All Duty Stations`
4. Department filter DB-backed `Department` list theke ashbe.
5. Designation filter DB-backed `Designation` list theke ashbe.
6. Duty Station filter employee records/configured duty station values theke ashbe.
7. Filter select korle employee table immediately filtered hobe.
8. Search box existing behavior preserve korbe.
9. Sortable table columns existing behavior preserve korbe.
10. Removed 4th filter-er old behavior jodi status/type/etc hoy, sheta ei update scope-e thakbe na unless future requirement ase.

Expected:

- `/hr` page-e filter row-te exactly 3 ta meaningful dropdown thakbe.
- Generic `All`, `All`, `All`, `All` UI thakbe na.
- Department, Designation, Duty Station select kore employee list filter kora jabe.
- Existing employee table, search, add employee button, and sorting break hobe na.

## 17. Implementation Notes

Data relationships:

1. `SalaryStructure` has many `SalaryStructureComponent`.
2. `SalaryGrade` belongs to `SalaryStructure`.
3. `SalaryGrade` stores gross salary and calculated component snapshot.
4. Recruitment offer/application stores selected `salaryGradeId` and offer message.
5. Employee stores assigned `salaryGradeId` after onboarding/conversion.
6. Payroll line stores salary component snapshot at run time.
7. Notification template is event/stage based.
8. Email queue records are created from template-rendered output.
9. Recruitment job skills should store selected skill ids or normalized skill values, not duplicate free-text entries.
10. Recruitment job `qualifications` and `preferredSkills` should not be required for new postings after form cleanup.
11. `Department` belongs to `Organization` and is used by recruitment job postings, employees, users, budgets, and org chart.
12. Department seed should be organization-aware and idempotent.
13. Employee Directory filters should read from Department, Designation, and employee duty station data sources.
14. `JobApplication.religion` should copy into `Employee.religion` during convert-to-employee.
15. Religion-wise summary should aggregate from `Employee.religion`.

Important behavior:

1. Historical payroll and historical offer emails should use snapshots.
2. Current employee profile can show latest assigned grade, but old payroll must not recalculate from changed grade.
3. Email sending should be queue based for reliability.
4. SMTP password must be handled securely.
5. Permission should separate HR request and Admin approval for payroll.
6. Skills multi-select should keep saved job skills compatible with public career display and applicant scoring.
7. Recruitment job requirements should come from structured fields, not duplicate narrative textarea fields.
8. Recruitment department dropdown should show active departments from the HR Department management source.
9. Public career religion is mandatory and must block submit when empty.
10. `/hr` Employee Directory filter UI should show only Department, Designation, and Duty Station filters.
11. `/hr` Employee Directory should show religion-wise employee count as a separate summary, not as one of the three main filters.
12. Provident Fund salary structure components should apply only after employee has active PF enrollment; Not Enrolled employees can show the PF line as `Not deducted - PF enroll needed`, but profile/payroll must not deduct PF amount.
13. PF enrollment create korar sathei employee active/basic salary thakle effective month-er initial PF contribution auto-post hobe, so user-ke alada Contributions tab-e giye run dite hobe na for first balance.
14. Employee profile Retirement Benefits card latest active PF enrollment balance theke read korbe and profile tab/window focus korle summary auto-refresh korbe.
15. Offer tab-e salary grade select korle hidden midpoint salary auto-use kora jabe na; HR explicit pay level select korbe and selected pay level-er basic salary `offeredSalary` hisebe save hobe.

## 18. Acceptance Checklist

1. `/hr/salary-structures` theke salary structure create kora jay.
2. `/hr/salary-grades` theke gross salary diye grade-wise breakdown auto hoy.
3. Offer stage-e salary grade select kora jay.
4. Offer tab-e leave benefits and custom offer message thake.
5. Offer email applicant-er kache jay.
6. Prottek recruitment/onboarding/offboarding stage update-e template-based email queue hoy.
7. HR & Payroll navigation-er under-e Notification Settings thake.
8. `/settings/notifications` page-e Gmail SMTP app password config kora jay.
9. Employee profile-er Compensation & Benefits tab-e offered salary grade show kore.
10. Bank details initially blank thake and pore fill up kora jay.
11. Payroll run employee salary grade onujayi calculate hoy.
12. HR payroll submit korle `Requested` status show kore.
13. Admin approve korle `Approved` status show kore.
14. Payroll approval-er por employee-wise payroll emails queue-te add hoy.
15. Queue worker/cron one by one email send kore.
16. Public career form-e religion dropdown mandatory hoy.
17. Recruitment job page-e skills dropdown multi-select hoy, delete option thake, and compact `more` count show kore.
18. `/hr/recruitment/new` theke `Qualifications` and `Preferred Skills` remove hoy, and degree/skills structured fields diye handle hoy.
19. HR & Payroll menu-te Departments page thake, department CRUD/status manage kora jay, and seed/default department data DB-te thake.
20. `/hr` Employee Directory-te 4 ta generic `All` filter replace hoye Department, Designation, Duty Station ei 3 ta filter thake.
21. Public application religion applicant detail, employee profile, and `/hr` religion-wise employee count summary-te show hoy.
22. Employee PF Not Enrolled hole Compensation & Benefits salary breakdown-e PF line `Not deducted - PF enroll needed` dekhabe and payroll calculation PF deduction skip korbe; PF enrolled active hole only tokhon PF amount apply hoy.
23. `/hr/pension/provident-fund` theke employee enroll korle first PF balance refresh-er sathei update hobe, jodi effective date current/past hoy.
24. PF enrollment add korar por employee profile-e fire ashle Retirement Benefits card-e updated balance show hobe without manual Contributions run.
25. Grade-only offer theke employee convert korle first pay level default hobe; saved offered salary thakle shei amount-er matching pay level employee profile-e show hobe.
26. `/hr` Employee Directory-te Religion filter add hobe; filter values public career religion dropdown-er sathe match korbe and mixed-case values normalized count/filter hobe.
27. Payroll processing salary structure use korle gross salary basic salary + all earning components hisebe calculate hobe; allowance-only gross bug thakbe na.
