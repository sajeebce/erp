# HR Training & Development Module

## Goal

Training module-er kaj holo employee training program create kora, participant nominate kora, attendance/completion track kora, and employee training history maintain kora.

Senior test case-er key requirement:

- same employee-ke same training-e duplicate nominate kora jabe na
- same employee-ke overlapping date/time-er active training-e nominate kora jabe na
- system automatically conflict detect kore clear warning/block message debe
- employee training history future decision-er jonno visible thakbe

This document is the product behavior guide. Detailed implementation plan ache:

- [hr-training-participation-control-workflow-plan.md](./hr-training-participation-control-workflow-plan.md)

---

## Scope From ERP Features

`NGO_ERP_FEATURES.md` er HR Training & Development scope:

- Training Programs: create and track internal, external, and online training programs
- Participant Management: enroll employees, track attendance and completion
- Skill Matrix: employee skills and proficiency
- Certification Tracking: certificate and expiry tracking

CSS multi-concern architecture theke important decision:

- `Project` and `Concern/BusinessUnit` same jinis na
- Training record-e project context thakte pare, kintu conflict rule project-specific howa uchit na
- Employee physically ek somoye ekta training-e thakte parbe, tai date/time overlap hole project same hok ba different hok, system block korbe

---

## Required Features

### 1. Training Program Management

Training create/edit korte minimum fields:

| Field | Required | Notes |
|---|---:|---|
| Training No | Auto | Example: TRN-0001 |
| Title | Yes | Training name |
| Type | Yes | INTERNAL, EXTERNAL, ONLINE |
| Project | Optional | Donor/project-linked training hole |
| Concern / Business Unit | Optional | CSS Hospital, Nursing Institute, AVA Center etc. Future multi-concern support |
| Cost Center | Optional | OPD, Admin, Training, Field Operations etc. |
| Facilitator | Optional | Trainer/vendor/person name |
| Venue | Optional | Physical venue or online platform |
| Start Date & Time | Yes | Date-only is not enough for reliable overlap checks |
| End Date & Time | Yes | If same-day, same date with later time |
| Duration Hours | Optional | Can be calculated from start/end later |
| Capacity | Recommended | Maximum participants |
| Budget | Optional | Planned training cost |
| Actual Cost | Optional | Filled after completion |
| Status | Yes | PLANNED, IN_PROGRESS, COMPLETED, CANCELLED |
| Description | Optional | Objective/agenda |

Current schema has `startDate` and `endDate`. For better production behavior, these should be treated as date-time values in UI, not only date.

### 2. Participant Nomination

HR should be able to:

- select a training
- see current participants
- assign eligible employees
- see why an employee is not eligible
- remove/cancel a nomination if needed
- mark attendance
- enter score and feedback

Participant fields:

| Field | Meaning |
|---|---|
| Employee | nominated employee |
| Nomination status | optional future field: NOMINATED, CONFIRMED, CANCELLED, COMPLETED |
| Attended | whether employee attended |
| Score | post-training assessment |
| Feedback | trainer/HR feedback |
| Certificate | optional future file/link |

### 3. Eligible Employee Dropdown

Dropdown behavior should be smart, but not trusted as the only validation.

Default dropdown should show only eligible employees:

- active employees
- not already assigned to selected training
- no active training overlap with selected training date/time
- optionally filtered by department, project allocation, concern, or location

If product wants stronger transparency, add `Show ineligible employees` toggle:

| Employee state | Dropdown behavior |
|---|---|
| Eligible | selectable |
| Already nominated in this training | disabled with reason |
| Has overlapping active training | disabled with conflict training no/title/time |
| Inactive employee | hidden or disabled |
| Capacity full | assign button disabled |

Important: dropdown filtering is UX only. API must still enforce all rules.

---

## Business Rules

### Rule 1: Same Training Duplicate

Same employee cannot be nominated twice to the same training.

Example:

- Employee A assigned to TRN-0001
- HR tries Employee A again in TRN-0001
- System blocks with: `Employee is already a participant`

This should be a hard block.

### Rule 2: Date/Time Overlap

Same employee cannot be nominated to another active training if the time window overlaps.

Overlap formula:

```text
targetStart < otherEnd AND otherStart < targetEnd
```

Use strict `<` comparison so these are allowed:

- Training A: 10:00-12:00
- Training B: 12:00-14:00

These are blocked:

- Training A: 10:00-13:00
- Training B: 12:00-15:00

If system stores date-only values, fallback formula can be:

```text
targetStart <= otherEnd AND otherStart <= targetEnd
```

But date-only rule is less accurate. Date-time is better.

### Rule 3: Active Training Scope

Conflict detection should compare only:

- PLANNED
- IN_PROGRESS

Ignore:

- COMPLETED
- CANCELLED

Completed trainings remain in history but do not block future nominations.

### Rule 4: Project Rule

Do not block only because project is same.

Correct behavior:

| Scenario | Behavior |
|---|---|
| Same employee, same training | Block |
| Same employee, same project, different training, no overlap | Allow |
| Same employee, same project, date/time overlap | Block |
| Same employee, different project, date/time overlap | Block |
| Same employee, different project, no overlap | Allow |

Reason: ekjon employee same project-er under multiple training korte pare, but same time-e physically two training-e thakte parbe na.

### Rule 5: Same Course/Topic Repetition

Same course/topic previously completed hole always block kora uchit na.

Better behavior:

- same training session duplicate: hard block
- same course already completed: warning or configurable block
- refresher/re-certification training: allow

Future field useful hote pare:

- `courseId`
- `isRefresher`
- `certificateExpiryDate`

### Rule 6: Capacity

If capacity is configured and participant count reaches capacity:

- dropdown/assign button should be disabled
- API should reject extra nomination

Message:

```text
Training capacity is full
```

---

## Recommended Workflow

### Successful Nomination

1. HR opens `/hr/training`
2. HR selects a training program
3. System loads training schedule and current participants
4. Employee dropdown shows eligible employees
5. HR selects employee and clicks Assign
6. API validates duplicate and overlap rules
7. System creates participant row
8. Participant appears in list and employee history

### Duplicate Nomination Block

1. Employee A is already assigned to TRN-0001
2. HR tries to assign Employee A again to TRN-0001
3. API returns 409 conflict
4. UI shows:

```text
Employee is already nominated in this training.
```

### Overlap Conflict Block

1. Employee A assigned to TRN-0001, 10 May 2026 10:00-13:00
2. HR tries to assign Employee A to TRN-0002, 10 May 2026 12:00-15:00
3. API returns 409 conflict with conflicting training details
4. UI shows:

```text
Conflict with TRN-0001 - Safeguarding Training (10 May 2026, 10:00-13:00).
```

### Non-overlap Allow

1. Employee A assigned to TRN-0001, 10 May 2026 10:00-13:00
2. HR assigns Employee A to TRN-0003, 10 May 2026 14:00-17:00
3. System allows nomination

---

## UI Behavior For `/hr/training`

Page should have these sections:

### 1. KPI Summary

- Total trainings
- Participants trained
- Upcoming trainings
- Budget utilized
- Conflict blocks this month (optional later)

### 2. Training Schedule Table

Columns:

- Training No
- Title
- Type
- Project
- Concern / Business Unit
- Facilitator
- Date/time range
- Duration
- Participants / Capacity
- Budget
- Status

Actions:

- View
- Edit
- Add participant
- Mark complete

### 3. Selected Training Detail

Show:

- title, training no, type, status
- date/time range
- facilitator, venue
- project/concern context
- budget and actual cost
- participants count

### 4. Participant Panel

Controls:

- employee dropdown
- assign button
- optional `Show ineligible` toggle

Participant table:

- employee no
- employee name
- department
- nomination status
- attended
- score
- feedback

### 5. Conflict Message Area

Conflict messages should be visible near assignment controls, not only toast.

Good messages:

- `Employee is already nominated in this training.`
- `Employee has overlapping training nomination.`
- `Conflict with TRN-0002 - Project Cycle Management (10 May 2026, 12:00-15:00).`
- `Training capacity is full.`

---

## API Behavior

### Create Training

Route:

```text
POST /api/v1/hr/training
```

Must validate:

- title required
- type valid
- start date/time required
- end date/time should be after start date/time
- project belongs to organization if provided
- business unit belongs to organization if provided later

### Add Participant

Route:

```text
POST /api/v1/hr/training/[id]/participants
```

Validation order:

1. authenticated user
2. training exists
3. employee exists in same organization
4. training is not CANCELLED or COMPLETED, unless policy allows late history entry
5. exact duplicate check
6. capacity check
7. overlapping active training check
8. create participant
9. write audit log

Conflict response should include enough detail for UI:

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Employee has overlapping training nomination",
    "details": {
      "conflictingTrainingId": ["..."],
      "conflictingTrainingNo": ["TRN-0002"],
      "conflictingTrainingTitle": ["Project Cycle Management"],
      "startDate": ["2026-05-10T10:00:00.000Z"],
      "endDate": ["2026-05-10T13:00:00.000Z"]
    }
  }
}
```

### Eligible Employees

Recommended future route:

```text
GET /api/v1/hr/training/[id]/eligible-employees
```

Response should include:

- eligible employees
- ineligible employees with reason, if requested

Example:

```json
{
  "employeeId": "...",
  "employeeNo": "EMP-001",
  "fullName": "Abdur Rahim",
  "eligible": false,
  "reason": "OVERLAPPING_TRAINING",
  "conflictingTrainingNo": "TRN-0002"
}
```

This route makes dropdown filtering reliable and keeps frontend simple.

---

## Training History

Training history should be visible from employee profile or a dedicated history panel.

Fields:

- training no
- title
- type
- project
- concern/business unit
- date/time range
- status
- attended
- score
- feedback
- certificate/expiry if available later

History should include completed and past trainings. Blocked nomination attempts do not need to create history rows in phase 1.

Optional later:

- log blocked attempts in audit log for HR compliance review

---

## Data Model Recommendation

Current models are enough for the senior test case:

- `Training`
- `TrainingParticipant`
- unique key: `trainingId + employeeId`

Recommended future fields:

### Training

- `organizationId`
- `businessUnitId`
- `costCenterId`
- `startDateTime`
- `endDateTime`
- `capacity`
- `courseId`

### TrainingParticipant

- `nominationStatus`
- `nominatedAt`
- `cancelledAt`
- `cancelReason`
- `certificateFilePath`
- `certificateExpiryDate`

Important: for CSS multi-concern, `businessUnitId` should represent concern/program/institute, while `projectId` should represent donor-funded project. These should not be mixed.

---

## Current Implementation Status

This section compares the target behavior in this document with the current project implementation.

| Area | Current implementation | Status |
|---|---|---|
| Training list API | `GET /api/v1/hr/training` lists trainings with count of participants. | Partially done |
| Training create API | `POST /api/v1/hr/training` creates training with title, type, facilitator, venue, start/end, duration, budget, description, and `projectId`. | Partially done |
| Training detail API | `GET /api/v1/hr/training/[id]` returns training with participants. | Partially done |
| Participant list API | `GET /api/v1/hr/training/[id]/participants` returns participants with employee basic info. | Done |
| Participant create API | `POST /api/v1/hr/training/[id]/participants` validates employee, duplicate nomination, and active training overlap. | Mostly done |
| Duplicate block | `@@unique([trainingId, employeeId])` exists and API checks duplicate before create. | Done |
| Overlap block | API checks overlap against `PLANNED` and `IN_PROGRESS` trainings. | Mostly done |
| Conflict response | API returns conflict training id/no/title/start/end details. UI formats a conflict message. | Mostly done |
| Training page | `/hr/training` loads training list, active employees, selected training, participant list, and assigns participants. | Partially done |
| Employee dropdown | Dropdown now loads training-specific eligible employees and can show ineligible employees with conflict reason. | Done |
| Create/edit training UI | Training page now has schedule/edit dialog with date-time, project, capacity, budget, and status fields. | Done |
| Date-time UI | Create/edit dialog uses date-time inputs for start/end. | Done |
| Project display/filter | API accepts `projectId`; UI can select and display project context. List filtering by project is still optional future work. | Partially done |
| Concern/business unit context | Schema recommendation exists, but current training model has no `businessUnitId` or `costCenterId`. | Missing |
| Capacity | `Training.capacity` exists; API and UI block assignment when capacity is full. | Done |
| Target training status validation | Participant API blocks assignment to `COMPLETED` or `CANCELLED` target training. | Done |
| Boundary time rule | API uses strict date-time overlap logic for trainings with explicit end times. | Done |
| Participant attendance update | Participant row supports attended, score, and feedback updates. | Done |
| Remove/cancel nomination | Participant row supports removal. A soft cancellation lifecycle is still future work. | Partially done |
| Training history | Dedicated training history API exists. Employee profile UI panel is still future work. | Partially done |
| Skill/certification integration | Skill Matrix and Certification Tracking are in target feature scope, but not connected to training completion. | Missing |
| Audit for blocked attempts | Successful participant assignment is audited; blocked conflict attempts are not logged. | Optional missing |

---

## Remaining Gaps And Implementation Notes

The first implementation pass closed the browser-critical gaps for the senior demo: create/edit training, date-time inputs, eligible employee filtering, duplicate/overlap enforcement, capacity, and participant update/remove. The notes below are retained as traceability from target behavior to implementation work; items marked as future work still remain.

### Gap 1: Training Create/Edit UI

Status: implemented.

Current issue:

- `/hr/training` can list and assign participants, but HR cannot create or edit training from the page.
- `Schedule Training` button is disabled.

Needed behavior:

- Add create training modal/page.
- Add edit training action from table/detail.
- Fields should include title, type, facilitator, venue, start date/time, end date/time, duration, project, budget, status, and description.

### Gap 2: Date-Time Accuracy

Status: implemented for trainings with explicit start/end date-time.

Current issue:

- Target behavior requires date and time range.
- Current UI displays date range only.
- API stores `DateTime`, but product behavior is still date-first.
- Current overlap query uses inclusive date-range logic, which is safe for date-only training but wrong for back-to-back same-day sessions.

Needed behavior:

- UI should use `datetime-local` or separate date + time inputs.
- Create/update API should validate:
  - start is valid
  - end is valid
  - end is after start
- Overlap logic should use strict date-time comparison:

```text
targetStart < otherEnd AND otherStart < targetEnd
```

### Gap 3: Eligible Employee Dropdown

Status: implemented.

Current issue:

- Dropdown loads all active employees from `/api/v1/hr/employees?status=ACTIVE&limit=100`.
- Already nominated or overlapping employees still appear selectable.
- The API blocks them after submit, but the UX is weaker than the target behavior.

Needed behavior:

- Add eligible employee API:

```text
GET /api/v1/hr/training/[id]/eligible-employees
```

- Default dropdown should show only eligible employees.
- Optional `showIneligible=true` should return disabled employees with reason.

Reasons to return:

- `ALREADY_NOMINATED`
- `OVERLAPPING_TRAINING`
- `INACTIVE_EMPLOYEE`
- `CAPACITY_FULL`

### Gap 4: Target Training Status Block

Status: implemented.

Current issue:

- Participant API checks overlap against other active trainings.
- It does not clearly block assigning a participant to a target training that is already `COMPLETED` or `CANCELLED`.

Needed behavior:

- For normal nomination, allow only:
  - `PLANNED`
  - `IN_PROGRESS`
- Reject:
  - `COMPLETED`
  - `CANCELLED`

Expected messages:

```text
Cannot nominate participant to a completed training.
Cannot nominate participant to a cancelled training.
```

### Gap 5: Capacity Control

Status: implemented.

Current issue:

- No `capacity` field exists.
- No validation prevents too many participants.

Needed behavior:

- Add `capacity Int?` to `Training`.
- Show participants as `current / capacity`.
- Disable assign button when full.
- API must reject assignment when full.

### Gap 6: Project and Concern Context

Status: partially implemented. Project context is implemented; concern/cost center context remains future work.

Current issue:

- `Training.projectId` exists, but UI does not display project.
- Training model does not have `businessUnitId` or `costCenterId`.
- CSS architecture needs project and concern to remain separate.

Needed behavior:

- Show project on training list/detail.
- Validate project belongs to organization during create/update.
- Later add:
  - `businessUnitId`
  - `costCenterId`
- Use shared dimension validation pattern when business unit/cost center fields are added.

Important rule:

- Project or concern should not decide overlap.
- Employee date/time conflict should decide overlap.

### Gap 7: Participant Lifecycle

Status: partially implemented. Update/remove are implemented; soft nomination status and cancellation lifecycle remain future work.

Current issue:

- `TrainingParticipant` only has `attended`, `score`, and `feedback`.
- There is no nomination status or cancellation lifecycle.

Needed behavior:

- Short term:
  - add update API for attended, score, feedback
  - add remove/cancel participant API
- Later:
  - add `nominationStatus`
  - add `nominatedAt`
  - add `cancelledAt`
  - add `cancelReason`

### Gap 8: Training History

Status: partially implemented. API is implemented; employee profile UI panel remains future work.

Current issue:

- Employee timeline only shows attended trainings as `Training completed`.
- It does not show all nominations, planned trainings, scores, feedback, project, or certificates.

Needed behavior:

- Add dedicated training history API:

```text
GET /api/v1/hr/employees/[id]/training-history
```

- Show:
  - training no
  - title
  - type
  - project
  - concern/business unit when available
  - date/time range
  - training status
  - attended
  - score
  - feedback
  - certificate/expiry when available

### Gap 9: Skill and Certification Integration

Current issue:

- Training completion does not update employee skill matrix or certification records.

Needed behavior:

- Add optional mapping from training to skill/certification.
- On completion:
  - add/update employee skill
  - add certification record if the training awards a certificate
  - track certificate expiry

### Gap 10: Browser Test Data

Current issue:

- The test plan needs controlled demo trainings with exact times.
- Current seed/demo data may not have the needed overlap and non-overlap sessions.

Needed behavior:

- Add a seed script or admin-only setup endpoint for the training demo test cases.
- Data should include:
  - one overlap pair
  - one non-overlap training
  - one completed training
  - one cancelled training
  - one active employee

---

## Implementation Plan

### Phase 1: Harden Existing Participant Control

Status: implemented.

Goal: make senior test case pass reliably even if UI filtering is bypassed.

Tasks:

1. Update participant POST validation:
   - reject target training if `COMPLETED`
   - reject target training if `CANCELLED`
2. Change overlap logic to strict date-time overlap:

```text
targetStart < otherEnd AND otherStart < targetEnd
```

3. Normalize null `endDate` as `startDate`.
4. Keep duplicate check before overlap check.
5. Keep response details for conflict training.
6. Add tests or manual API verification for:
   - duplicate nomination
   - same project overlap block
   - different project overlap block
   - same project non-overlap allow
   - completed/cancelled target training block

Expected deliverable:

- `POST /api/v1/hr/training/[id]/participants` is the final authority for duplicate and overlap rules.

### Phase 2: Add Training Create/Edit UI

Status: implemented.

Goal: HR can prepare the browser test data without seed/curl.

Tasks:

1. Enable `Schedule Training` button.
2. Add create modal or create page.
3. Add edit action on training table/detail.
4. Add inputs:
   - title
   - type
   - facilitator
   - venue
   - start date/time
   - end date/time
   - duration
   - project
   - budget
   - description
5. Validate end date/time after start date/time.
6. Refresh training list after create/edit.

Expected deliverable:

- HR can create `TRN-A`, `TRN-B`, and `TRN-C` from browser.

### Phase 3: Eligible Employee Dropdown

Status: implemented.

Goal: prevent most invalid nominations before submit.

Tasks:

1. Add route:

```text
GET /api/v1/hr/training/[id]/eligible-employees
```

2. Return eligible employees by default.
3. Support optional ineligible output:

```text
GET /api/v1/hr/training/[id]/eligible-employees?includeIneligible=true
```

4. Compute reasons:
   - duplicate
   - overlap
   - inactive
   - capacity full later
5. Update `/hr/training` employee dropdown to use this route instead of all active employees.
6. Add inline reason when employee is disabled or excluded.

Expected deliverable:

- Already nominated and overlapping employees do not appear as normal selectable options.

### Phase 4: Capacity and Participant Lifecycle

Status: partially implemented. Capacity, attended, score, feedback, and remove participant are implemented. Soft nomination lifecycle fields remain future work.

Goal: make participant management production-grade.

Schema changes:

- Add `Training.capacity Int?`
- Optional later fields on `TrainingParticipant`:
  - `nominationStatus`
  - `nominatedAt`
  - `cancelledAt`
  - `cancelReason`

API tasks:

1. Capacity check in participant POST.
2. Add participant update route:

```text
PATCH /api/v1/hr/training/[id]/participants/[participantId]
```

3. Update fields:
   - attended
   - score
   - feedback
4. Add cancel/remove route:

```text
DELETE /api/v1/hr/training/[id]/participants/[participantId]
```

UI tasks:

1. Show `participants / capacity`.
2. Disable assign when full.
3. Add attended toggle.
4. Add score/feedback edit.
5. Add cancel/remove action.

Expected deliverable:

- HR can manage participant lifecycle after nomination.

### Phase 5: Project, Concern, and Cost Center Context

Status: partially implemented. Project context is implemented; business unit and cost center fields remain future work.

Goal: align training with CSS multi-concern architecture.

Short-term tasks:

1. Show `projectId`/project name in training list and detail.
2. Validate project belongs to current organization during create/update.
3. Add project filter to training list.

Later schema tasks:

1. Add `businessUnitId String? @db.Uuid` to `Training`.
2. Add `costCenterId String? @db.Uuid` to `Training`.
3. Add relations to `BusinessUnit` and `CostCenter`.
4. Add indexes.
5. Add business unit and cost center selectors.
6. Validate dimensions with shared dimension validation helper.

Expected deliverable:

- Training can be reported by project and concern without mixing those concepts.

### Phase 6: Training History Panel

Status: partially implemented. Training history API is implemented; employee profile UI panel remains future work.

Goal: make history tracking visible and useful.

Tasks:

1. Add API:

```text
GET /api/v1/hr/employees/[id]/training-history
```

2. Add profile tab or panel for training history.
3. Include planned, in-progress, completed, and attended records.
4. Show score and feedback.
5. Link each row back to training detail.

Expected deliverable:

- Senior can verify automated conflict detection and historical tracking from employee profile.

### Phase 7: Skill and Certification Integration

Status: future work.

Goal: complete Training & Development scope beyond the no-overlap demo.

Tasks:

1. Add optional training outcome fields:
   - skillId
   - certificationName or certificationId
   - certificateValidityMonths
2. On training completion:
   - create/update employee skill
   - create employee certification if applicable
3. Add certificate upload/expiry tracking.
4. Add report for expiring certifications.

Expected deliverable:

- Training completion can update employee skill/certification records.

### Phase 8: Demo Seed and Regression Tests

Status: implemented for demo seed data; automated tests remain future work.

Goal: make the browser test plan repeatable.

Tasks:

1. Add seed data for:
   - `TRN-A` overlap base training
   - `TRN-B` overlapping training
   - `TRN-C` non-overlapping training
   - `TRN-D` cancelled training
   - `TRN-E` completed training
2. Add one active employee for training tests.
3. Add API/curl verification notes.
4. Optional: add automated tests for participant API.

Expected deliverable:

- Browser Test Plan can be executed from a clean local demo database.

---

## Browser Test Plan

> Note: The expected outputs below describe the target behavior for `/hr/training`. If the current UI does not yet expose create/edit controls for every field, use the available API/seed flow to create the test trainings first, then execute the participant assignment tests in the browser.

### Prerequisite Setup

Goal: prepare the browser state before executing Test Case 1 through Test Case 6.

Required URLs:

| Purpose | URL |
|---|---|
| Login | `http://localhost:3000/login` |
| Projects list | `http://localhost:3000/projects` |
| Employee list | `http://localhost:3000/hr/employees` |
| Training page | `http://localhost:3000/hr/training` |

Login credentials:

1. Open `http://localhost:3000/login`.
2. Login as an HR/Admin user:
   - Organization: `cssbd`
   - Email: `rahim@cssbd.org`
   - Password: `SecurePass@2026!`

Seed commands if the data is missing:

```powershell
pnpm exec tsx prisma/seed-bootstrap.ts
pnpm exec tsx prisma/seed-phase3.ts
pnpm exec tsx prisma/seed-phase8-hr.ts
pnpm exec tsx prisma/seed-training-demo.ts
```

Use these commands only if `/projects`, `/hr/employees`, or `/hr/training` is empty.

Before starting Test Case 1:

1. Go to `http://localhost:3000/projects`.
2. Confirm at least two projects exist:
   - Project A: `PRJ-2026-001`
   - Project B: `PRJ-2026-002`
3. Go to `http://localhost:3000/hr/employees`.
4. Confirm this active employee exists:
   - Employee No: `EMP-001`
   - Name: `Karim Ahmed`
   - Status: `ACTIVE`
5. Go to `http://localhost:3000/hr/training`.
6. Confirm the training page loads without API error.

### Test Data To Prepare

Create or seed these trainings before Test Case 1. If `pnpm exec tsx prisma/seed-training-demo.ts` was run successfully, these records should already exist.

| Training | Title | Start | End | Project | Capacity | Status |
|---|---|---|---|---|---:|---|
| TRN-A | Safeguarding Training | 10 May 2026, 10:00 | 10 May 2026, 13:00 | Project A / `PRJ-2026-001` | 20 | PLANNED |
| TRN-B | Project Cycle Management | 10 May 2026, 12:00 | 10 May 2026, 15:00 | Project A / `PRJ-2026-001` | 20 | PLANNED |
| TRN-F | Partner Reporting Workshop | 10 May 2026, 12:00 | 10 May 2026, 15:00 | Project B / `PRJ-2026-002` | 20 | PLANNED |
| TRN-C | Finance Compliance Orientation | 10 May 2026, 14:00 | 10 May 2026, 17:00 | Project A / `PRJ-2026-001` | 20 | PLANNED |
| TRN-D | Cancelled Field Safety Session | 10 May 2026, 11:00 | 10 May 2026, 12:00 | Project B / `PRJ-2026-002` | 20 | CANCELLED |
| TRN-E | Completed HR Policy Session | 09 May 2026, 10:00 | 09 May 2026, 12:00 | Project A / `PRJ-2026-001` | 20 | COMPLETED |

If a training is missing, create it from `http://localhost:3000/hr/training`:

1. Click `New Training` or `Add Training`.
2. Fill title, type, facilitator, venue, date/time, project, capacity, and status.
3. Save.
4. Confirm the new training appears in the Training Schedule table.

Recommended training field values:

| Field | TRN-A | TRN-B | TRN-C |
|---|---|---|---|
| Type | INTERNAL | EXTERNAL | INTERNAL |
| Facilitator | HR Department | BRAC Institute of Development Studies | Finance Department |
| Venue | Khulna Head Office - Training Hall | Khulna Head Office - Conference Room A | Khulna Head Office - Conference Room B |
| Capacity | 20 | 20 | 20 |

Use the same active employee in all tests:

- Demo employee: `EMP-001`

Clean state before Test Case 1:

- `EMP-001` should not already be assigned to `TRN-A`, `TRN-B`, or `TRN-C`.
- If `EMP-001` is already listed as a participant under these trainings, remove the participant rows from the Training Participants table before starting.

The key overlap pair:

- `TRN-A`: 10:00-13:00
- `TRN-B`: 12:00-15:00

These overlap because 12:00-13:00 intersects.

The key non-overlap pair:

- `TRN-A`: 10:00-13:00
- `TRN-C`: 14:00-17:00

These do not overlap.

---

### Test Case 1: Training Page Loads

Scenario: HR opens the Training page and sees training schedule plus participant controls.

Dependency:

- Login completed.
- Projects and employees verified.
- TRN-A, TRN-B, and TRN-C exist.

URL:

- `http://localhost:3000/hr/training`

Steps:

1. Login from `http://localhost:3000/login` using `cssbd / rahim@cssbd.org`.
2. Open `http://localhost:3000/hr/training`.
3. Wait for the page to load.
4. Confirm no red API error or toast error is visible.
5. Check the KPI cards at the top.
6. Check the Training Schedule table.
7. Confirm the table contains:
   - `TRN-A - Safeguarding Training`
   - `TRN-B - Project Cycle Management`
   - `TRN-C - Finance Compliance Orientation`
8. Click/select `TRN-A - Safeguarding Training`.
9. Check the selected training details panel.
10. Check the Training Participants section.

Expected output:

1. No red API error is shown.
2. Training Schedule table shows `TRN-A`, `TRN-B`, and `TRN-C`.
3. Selected Training panel shows:
   - training no
   - title
   - type
   - status
   - date/time range
   - facilitator/venue if available
4. Participant section has:
   - employee dropdown
   - assign button
   - participant list
5. `TRN-A` participant count should be `0/20` if the clean state was prepared.

Video narration script in Bangla:

```text
এখন আমি HR Training & Development মডিউলের প্রথম টেস্ট কেস দেখাচ্ছি।
এই টেস্ট কেসের উদ্দেশ্য হলো Training page ঠিকভাবে লোড হচ্ছে কিনা,
training schedule দেখা যাচ্ছে কিনা, এবং participant assignment control আছে কিনা যাচাই করা।

প্রথমে আমি cssbd organization দিয়ে admin user হিসেবে login করেছি।
এরপর আমি Training page খুলেছি: http://localhost:3000/hr/training।

এখানে দেখা যাচ্ছে page কোনো API error ছাড়া load হয়েছে।
উপরে KPI cards আছে: Total Trainings, Participants Trained, Budget Utilized এবং Upcoming।
Total Trainings এখন ৬ দেখাচ্ছে, কারণ table-এ মোট ৬টি training আছে।

এখন Training Schedule table যাচাই করছি।
Table-এ TRN-A - Safeguarding Training, TRN-B - Project Cycle Management,
এবং TRN-C - Finance Compliance Orientation দেখা যাচ্ছে।
প্রতিটি row-তে training type, project, facilitator, date/time range,
duration, participants count, budget এবং status দেখা যাচ্ছে।

এখন আমি TRN-A - Safeguarding Training select করছি।
ডান পাশে Selected Training panel-এ TRN-A-এর details দেখা যাচ্ছে:
training ID, title, type, status, date/time range, project, facilitator,
location এবং participants count।
Date/time range দেখাচ্ছে 10 May 2026, 10:00-13:00।

নিচের Training Participants section-এ training dropdown আছে,
employee select dropdown আছে, Assign button আছে, এবং participant list আছে।
TRN-A-এর participant count এখন 0 / 20, অর্থাৎ clean state প্রস্তুত আছে।

তাই Test Case 1 অনুযায়ী Training page load, schedule display,
selected training details এবং participant controls সব ঠিক আছে।
এই test case pass।
```

---

### Test Case 2: Successful Employee Assignment

Scenario: HR nominates an active employee to a planned training.

Dependency:

- Test Case 1 passed.
- `TRN-A` is `PLANNED`.
- `EMP-001` is active.
- `EMP-001` is not already assigned to `TRN-A`.

URL:

- `http://localhost:3000/hr/training`

Steps:

1. Open `http://localhost:3000/hr/training`.
2. Select `TRN-A - Safeguarding Training`.
3. Confirm `TRN-A` schedule is `10 May 2026, 10:00-13:00`.
4. Confirm `TRN-A` status is `PLANNED`.
5. In the employee dropdown, search/select `EMP-001 - Karim Ahmed`.
6. Click `Assign` or `Add Participant`.
7. Wait for the participant list to refresh.

Expected output:

1. System shows success message.
2. `EMP-001` appears in the participant list for `TRN-A`.
3. Participant row shows:
   - employee no
   - employee name
   - department if available
   - attended = false or not attended yet
4. Training participant count increases by 1.
5. No duplicate participant row is created.
6. `EMP-001` should no longer be available as an eligible employee for `TRN-A`.

Postcondition:

- Keep `EMP-001` assigned to `TRN-A`; Test Case 3, 4, 5, and 6 depend on it.

---

### Test Case 3: Duplicate Nomination Block

Scenario: HR tries to assign the same employee again to the same training.

Precondition:

- Test Case 2 has already assigned `EMP-001` to `TRN-A`.

Dependency:

- Do not remove `EMP-001` from `TRN-A` before this test.

URL:

- `http://localhost:3000/hr/training`

Steps:

1. Open `http://localhost:3000/hr/training`.
2. Select `TRN-A - Safeguarding Training`.
3. Confirm `EMP-001` is already visible in the participant list.
4. Open the employee dropdown.
5. Try to select `EMP-001` again.
6. If `EMP-001` is hidden or disabled, note the disabled/hidden state.
7. If the UI still allows selecting `EMP-001`, select it.
8. Click `Assign`.

Expected output:

1. Preferred UI behavior:
   - `EMP-001` should not appear in the eligible employee dropdown, or
   - `EMP-001` should be disabled with reason `Already nominated in this training`.
2. API behavior if submit is attempted:
   - request is rejected with `409 Conflict`
   - message: `Employee is already a participant`
3. Participant list still contains only one row for `EMP-001` under `TRN-A`.
4. Training participant count does not increase.
5. The existing `EMP-001` participant row remains unchanged.

---

### Test Case 4: Overlapping Training Block, Same Project

Scenario: HR tries to assign an employee to another training under the same project, but date/time overlaps.

Precondition:

- `EMP-001` is already assigned to `TRN-A`.
- `TRN-B` overlaps with `TRN-A`.
- `TRN-A` and `TRN-B` are both under Project A / `PRJ-2026-001`.

Dependency:

- Test Case 2 must be completed first.
- Test Case 5 uses `TRN-F`; `TRN-B` should remain under Project A for this test.

URL:

- `http://localhost:3000/hr/training`

Setup check before assigning:

1. Select `TRN-A` and confirm project is Project A / `PRJ-2026-001`.
2. Select `TRN-B` and confirm project is Project A / `PRJ-2026-001`.
3. Confirm `TRN-B` schedule is `10 May 2026, 12:00-15:00`.
4. Confirm `EMP-001` is already assigned to `TRN-A`.

Steps:

1. Select `TRN-B - Project Cycle Management`.
2. Open the employee dropdown.
3. Try to select `EMP-001`.
4. If `EMP-001` is hidden or disabled, inspect the reason.
5. If the UI still allows selecting `EMP-001`, select it.
6. Click `Assign`.

Expected output:

1. Preferred UI behavior:
   - `EMP-001` should be disabled or excluded from eligible list.
   - reason should mention overlap with `TRN-A`.
2. API behavior if submit is attempted:
   - request is rejected with `409 Conflict`
   - message: `Employee has overlapping training nomination`
   - conflict details include:
     - conflicting training no: `TRN-A`
     - title: `Safeguarding Training`
     - date/time: `10 May 2026, 10:00-13:00`
3. `EMP-001` is not added to `TRN-B`.
4. Participant count for `TRN-B` does not increase.
5. The selected project being the same must not be shown as the blocking reason.

Important expected rule:

- Same project is not the reason for blocking.
- The date/time overlap is the reason for blocking.

---

### Test Case 5: Overlapping Training Block, Different Project

Scenario: HR tries to assign an employee to a different-project training, but date/time overlaps.

Precondition:

- `EMP-001` is assigned to `TRN-A`.
- `TRN-A` is under Project A / `PRJ-2026-001`.
- `TRN-F` is under Project B / `PRJ-2026-002`.
- `TRN-F` overlaps with `TRN-A`.

Dependency:

- Test Case 2 must be completed first.
- Test Case 4 can be completed before this test.
- `TRN-F` should already be available from the training demo seed.

URLs:

- Training page: `http://localhost:3000/hr/training`
- Projects page for project verification: `http://localhost:3000/projects`

Setup before assigning:

1. Open `http://localhost:3000/projects`.
2. Confirm Project B exists, for example `PRJ-2026-002`.
3. Open `http://localhost:3000/hr/training`.
4. Select `TRN-F - Partner Reporting Workshop`.
5. Confirm `TRN-F` belongs to Project B / `PRJ-2026-002`.
6. Confirm start/end time:
   - Start: `10 May 2026, 12:00`
   - End: `10 May 2026, 15:00`
7. Confirm `EMP-001` is already assigned to `TRN-A`.

Steps:

1. Select `TRN-F - Partner Reporting Workshop`.
2. Confirm `TRN-F` belongs to a different project than `TRN-A`.
3. Open the employee dropdown.
4. Try to select `EMP-001`.
5. If the UI still allows selecting `EMP-001`, click `Assign`.

Expected output:

1. System still blocks the nomination.
2. Error reason is overlap, not project mismatch.
3. Message references the conflicting training:

```text
Conflict with TRN-A - Safeguarding Training (10 May 2026, 10:00-13:00).
```

4. `EMP-001` is not added to `TRN-F`.

Business meaning:

- Employee cannot attend two trainings at the same time even if the projects are different.

Postcondition:

- `TRN-F` remains under Project B.
- Test Case 6 does not depend on `TRN-F`.

---

### Test Case 6: Same Project, Non-overlapping Training Allowed

Scenario: HR assigns the same employee to another training under the same project, but time does not overlap.

Precondition:

- `EMP-001` is assigned to `TRN-A`.
- `TRN-C` is under the same project as `TRN-A`.
- `TRN-C` starts after `TRN-A` ends.

Dependency:

- Test Case 2 must be completed first.
- Test Case 3, 4, and 5 can be completed before this test.
- `EMP-001` must not already be assigned to `TRN-C`.

URL:

- `http://localhost:3000/hr/training`

Setup check before assigning:

1. Select `TRN-A`.
2. Confirm project is Project A / `PRJ-2026-001`.
3. Confirm `EMP-001` is already in `TRN-A` participant list.
4. Select `TRN-C`.
5. Confirm project is Project A / `PRJ-2026-001`.
6. Confirm schedule is `10 May 2026, 14:00-17:00`.
7. Confirm `TRN-C` starts after `TRN-A` ends.

Steps:

1. Select `TRN-C - Finance Compliance Orientation`.
2. Open the employee dropdown.
3. Select `EMP-001 - Karim Ahmed`.
4. Click `Assign`.
5. Wait for participant list refresh.

Expected output:

1. System allows the nomination.
2. `EMP-001` appears in participant list for `TRN-C`.
3. No overlap warning is shown.
4. Training history for `EMP-001` now includes both:
   - `TRN-A`
   - `TRN-C`

Important expected rule:

- Same project alone must not block nomination.
- Only duplicate training or date/time conflict should block.

Final state after Test Case 6:

- `EMP-001` should be assigned to:
  - `TRN-A`
  - `TRN-C`
- `EMP-001` should not be assigned to:
  - `TRN-B`

---

### Test Case 7: Cancelled Training Does Not Block Future Nomination

Scenario: A cancelled training overlaps with the target training, but it should not block assignment.

Precondition:

- `TRN-D` is `CANCELLED`.
- `TRN-D` overlaps with `TRN-A`.
- If needed, assign `EMP-001` to `TRN-D` through seed/API as historical/cancelled data.

Steps:

1. Select a planned training that overlaps with `TRN-D`.
2. Try to assign `EMP-001`.

Expected output:

1. System ignores `CANCELLED` training in overlap detection.
2. Nomination is allowed if no other active overlap exists.
3. Conflict message should not reference `TRN-D`.

---

### Test Case 8: Completed Training Does Not Block Future Nomination

Scenario: A completed past training exists for the employee, but it should remain history only.

Precondition:

- `TRN-E` is `COMPLETED`.
- `EMP-001` has participated in `TRN-E`.

Steps:

1. Open `TRN-C` or another planned non-overlapping training.
2. Assign `EMP-001`.
3. Open employee profile or training history area if available.

Expected output:

1. System does not block because of `TRN-E`.
2. `TRN-E` remains visible in training history.
3. New nomination is created for the selected planned training.

---

### Test Case 9: Boundary Time Should Be Allowed

Scenario: One training ends exactly when another starts.

Test data:

| Training | Date/time | Status |
|---|---|---|
| TRN-F | 11 May 2026, 10:00-12:00 | PLANNED |
| TRN-G | 11 May 2026, 12:00-14:00 | PLANNED |

Steps:

1. Assign `EMP-001` to `TRN-F`.
2. Select `TRN-G`.
3. Assign `EMP-001` to `TRN-G`.

Expected output:

1. System allows both nominations.
2. No overlap conflict is shown.
3. This confirms the intended date-time logic:

```text
targetStart < otherEnd AND otherStart < targetEnd
```

Note:

- If the current system only stores date-level values, this test may fail until date-time fields are fully supported.

---

### Test Case 10: Training History Tracking

Scenario: HR reviews employee training history after nominations.

Precondition:

- `EMP-001` has at least one successful nomination.
- Ideally `EMP-001` has one completed training and one planned training.

Steps:

1. Go to `HR & Payroll > Employee Directory`.
2. Open `EMP-001` profile.
3. Open Timeline, Training History, or related training section.
4. Review listed training records.

Expected output:

1. Training history shows completed and active training participations.
2. Each row should show:
   - training no
   - title
   - date/time range
   - status
   - attended
   - score/feedback if available
3. Blocked duplicate or overlap attempts should not create training history rows.

---

### Test Case 11: API Bypass Still Blocked

Scenario: User bypasses dropdown filtering and calls participant API directly.

Precondition:

- `EMP-001` is already assigned to `TRN-A`.
- `TRN-B` overlaps with `TRN-A`.

Steps:

1. Use browser devtools, curl, Postman, or any API client.
2. Send participant create request directly:

```text
POST /api/v1/hr/training/{TRN-B_ID}/participants
```

Body:

```json
{
  "employeeId": "{EMP_001_ID}"
}
```

Expected output:

1. API rejects the request with `409 Conflict`.
2. Response includes:
   - `Employee has overlapping training nomination`
   - conflicting training no/title/date
3. Database does not create a participant row for `TRN-B + EMP-001`.

This confirms frontend filtering is not the only protection.

---

## Acceptance Criteria

Training module is ready for this feature when:

1. HR can create training with date/time range
2. HR can assign employee to training
3. Same employee cannot be assigned twice to same training
4. Same employee cannot be assigned to overlapping active training
5. Same employee can be assigned to non-overlapping training, even under same project
6. UI clearly shows conflict reason
7. Employee training history remains visible
8. API enforces the rules even if frontend filtering is bypassed

---

## Recommended Implementation Order

1. Keep backend duplicate and overlap validation as hard rules
2. Add date-time UI for training start/end
3. Add eligible employee dropdown logic
4. Add clear conflict message UI
5. Add employee training history panel
6. Add capacity and nomination lifecycle later
