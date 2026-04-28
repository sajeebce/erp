# HR Attendance & Movement Workflow Plan

> Prepared: 2026-04-28  
> Scope: HR Module  
> Related docs: [NGO_ERP_FEATURES.md](./NGO_ERP_FEATURES.md), [multiconcern-hr.md](./multiconcern-hr.md)

---

## Goal

Support three client attendance scenarios inside one centralized HR module:

1. Outstation movement during office hours
2. Field worker attendance tracking
3. Cross-branch attendance from HQ or other branch visits

The solution must differentiate absence from official duty, support location-aware attendance, preserve centralized reporting, and remain aligned with the multi-concern HR direction.

---

## Client Scenarios

### Scenario 1: Outstation Movement During Office Hours

Example:

- Senior officer visits a bank
- Senior officer visits District Commissioner office

Expected flow:

1. Employee checks out for official movement
2. Employee selects movement type = official duty
3. Employee enters destination, purpose, and expected return time
4. Supervisor can see who is out on duty
5. Employee checks in on return
6. System records movement duration separately from absence

Key outcomes:

- Official duty is not treated as absence
- Time outside office is tracked
- Supervisor has real-time visibility
- Reports show movement history

### Scenario 2: Field Worker Attendance Tracking

Expected flow:

1. Employee opens mobile attendance screen
2. Employee checks in from field location
3. System records GPS coordinates and timestamp
4. Employee checks out from field location
5. If network is unavailable, event is saved locally and synced later

Key outcomes:

- Location-based validation
- Real-time attendance logging
- Offline-to-online sync support

### Scenario 3: Cross-Branch Attendance

Expected flow:

1. Employee visits another branch
2. Employee checks in from that branch location
3. System recognizes the visited branch or operating location
4. Attendance is marked against the employee, with visit location logged
5. HQ can see centralized visit and attendance reports

Key outcomes:

- Multi-location attendance flexibility
- Centralized tracking
- Visit logs and reporting

---

## Current Codebase State

### What exists now

- Basic `Attendance` model with:
  - `employeeId`
  - `date`
  - `status`
  - `checkIn`
  - `checkOut`
  - `otHours`
  - `notes`
- Attendance API for create and list
- Monthly attendance summary API
- Payroll integration using attendance records
- `BusinessUnit`, `CostCenter`, and `OperatingLocation` setup models already exist

### Important gaps

- No official movement entity or workflow
- No movement type classification
- No GPS or geo-validation fields in attendance
- No mobile attendance event model
- No offline sync support
- No branch visit log
- No supervisor live visibility for employees out on duty
- No employee `primaryBusinessUnitId`, `primaryCostCenterId`, or `workLocationId` yet in HR data model
- Attendance UI is still static demo data, not live transactional UI

### Known inconsistency already identified

- Attendance API now accepts `WEEKEND`, aligned with schema and validator
- Payroll processing still does not handle `WEEKEND` or `HOLIDAY` explicitly
- Current payroll logic may count those days into absence deduction if records exist

---

## Design Principles

1. Do not create separate attendance systems per concern or branch.
2. Keep attendance employee-based.
3. Add location, branch, and movement context to attendance records.
4. Treat official movement as duty status, not absence.
5. Support centralized reporting by business unit, operating location, department, project, and grant when relevant.
6. Preserve a simple manual admin workflow where GPS or mobile is not available.

---

## Proposed Functional Design

## 1. Attendance Record Model

Keep daily attendance as the payroll-facing summary record, but enrich it with context.

Recommended additions:

```text
Attendance
  id
  employeeId
  date
  status
  checkIn
  checkOut
  otHours
  notes
  attendanceSource        // MANUAL, WEB, MOBILE, BIOMETRIC, IMPORT
  attendanceMode          // OFFICE, FIELD, BRANCH_VISIT, OFFICIAL_MOVEMENT, REMOTE
  operatingLocationId?
  businessUnitId?
  geoLat?
  geoLng?
  geoAccuracyMeters?
  geoAddress?
  validationStatus?       // VALID, OUT_OF_GEOFENCE, MANUAL_OVERRIDE, PENDING
  syncedAt?
  deviceId?
```

Notes:

- `status` remains the daily status dimension used by reporting and payroll
- `attendanceMode` explains how the attendance happened
- `operatingLocationId` logs where the employee checked in

## 2. Official Movement Log

Do not overload attendance with all movement details. Add a dedicated movement log.

Recommended model:

```text
AttendanceMovement
  id
  organizationId
  employeeId
  attendanceId?
  movementType           // OFFICIAL_DUTY, BANK_VISIT, GOVT_OFFICE, FIELD_VISIT, CLIENT_VISIT, OTHER
  purpose
  destinationName
  destinationAddress?
  operatingLocationId?   // if movement is to another registered branch/location
  checkOutTime
  expectedReturnTime?
  actualReturnTime?
  status                 // OPEN, RETURNED, CANCELLED
  approvedById?
  supervisorNotes?
  geoLatOut?
  geoLngOut?
  geoLatIn?
  geoLngIn?
  createdAt
  updatedAt
```

Purpose:

- Separate official movement from absence
- Track office-hour movement duration
- Enable supervisor visibility and reporting

## 3. Branch Visit Log

Cross-branch attendance can be captured either from attendance events alone or with a dedicated log.

Preferred approach:

- Store branch visit context on attendance
- Add optional visit log for reporting if client wants visit history beyond attendance

Recommended model:

```text
AttendanceVisit
  id
  organizationId
  employeeId
  attendanceId
  homeOperatingLocationId?
  visitedOperatingLocationId
  purpose?
  remarks?
  createdAt
```

If implementation needs to stay lean in phase 1, this can be deferred and derived from attendance + movement data.

---

## HR Master Data Alignment

To align with `multiconcern-hr.md`, HR should add:

```text
Employee
  primaryBusinessUnitId
  primaryCostCenterId?
  workLocationId?
```

And optionally:

```text
Department
  businessUnitId?
  costCenterId?
```

This is necessary because:

- cross-branch attendance needs a home location vs actual attendance location
- supervisor views need concern/location filters
- attendance summary by business unit is part of the multi-concern direction

---

## Workflow Details

## Workflow A: Standard Office Attendance

1. Employee checks in from default office location
2. System validates timestamp and optional location
3. Attendance created with:
   - `status = PRESENT`
   - `attendanceMode = OFFICE`
4. Employee checks out at day end
5. Monthly summary and payroll consume the final record

## Workflow B: Official Movement During Office Hours

1. Employee checks in normally in office
2. Employee clicks `Start Movement`
3. Employee selects:
   - movement type
   - destination
   - purpose
   - expected return time
4. System creates `AttendanceMovement` with `status = OPEN`
5. Supervisor dashboard shows employee as `Out on Duty`
6. Employee returns and clicks `End Movement`
7. System updates movement with actual return time
8. Attendance remains duty-valid and is not marked absent

Recommended reporting behavior:

- Daily attendance status remains `PRESENT` or `OFFICIAL_DUTY_PRESENT`
- Movement duration is shown separately

Implementation note:

- If new status values are introduced, payroll rules must be updated carefully
- Simpler phase 1 option: keep `status = PRESENT` and store duty context in `attendanceMode` + movement table

## Workflow C: Field Attendance

1. Employee opens mobile check-in page
2. System requests device location
3. Attendance event stores:
   - coordinates
   - accuracy
   - timestamp
   - device source
4. If geofence exists, validate location
5. Attendance created with:
   - `status = PRESENT`
   - `attendanceMode = FIELD`
   - `validationStatus = VALID` or `OUT_OF_GEOFENCE`
6. Check-out repeats the same pattern
7. If offline:
   - event stored locally on device
   - sync API pushes event later
   - server stores original event time and sync time

## Workflow D: Cross-Branch Attendance

1. Employee checks in from another branch or operating location
2. System matches GPS or selected branch to `OperatingLocation`
3. Attendance created with:
   - `status = PRESENT`
   - `attendanceMode = BRANCH_VISIT`
   - `operatingLocationId = visited branch`
4. If needed, create `AttendanceVisit`
5. HQ reports show:
   - employee home location
   - actual visited location
   - date and time of visit

---

## API Plan

## Attendance APIs

### Keep

- `GET /api/v1/hr/attendance`
- `POST /api/v1/hr/attendance`
- `GET /api/v1/hr/attendance/summary`

### Extend `POST /api/v1/hr/attendance`

Add support for:

```json
{
  "employeeId": "uuid",
  "date": "2026-04-28",
  "status": "PRESENT",
  "checkIn": "2026-04-28T09:00:00+06:00",
  "checkOut": "2026-04-28T18:00:00+06:00",
  "attendanceMode": "FIELD",
  "attendanceSource": "MOBILE",
  "operatingLocationId": "uuid",
  "businessUnitId": "uuid",
  "geoLat": 23.8103,
  "geoLng": 90.4125,
  "geoAccuracyMeters": 18,
  "geoAddress": "Motijheel, Dhaka",
  "validationStatus": "VALID",
  "deviceId": "mobile-device-id"
}
```

### Add movement APIs

- `POST /api/v1/hr/attendance/movements/start`
- `POST /api/v1/hr/attendance/movements/:id/return`
- `GET /api/v1/hr/attendance/movements`
- `GET /api/v1/hr/attendance/movements/open`

### Add mobile sync API

- `POST /api/v1/hr/attendance/mobile-sync`

Purpose:

- accept queued offline attendance events
- preserve original event timestamp
- avoid duplicate device submissions

### Summary and reporting filters

Extend attendance and report APIs with:

- `businessUnitId`
- `operatingLocationId`
- `departmentId`
- `employeeId`
- `attendanceMode`
- `validationStatus`

---

## UI Plan

## Admin and HR Pages

### `/hr/attendance`

Convert current static page into live data page.

Add:

- filter by month, business unit, location, department, employee
- attendance status badges
- attendance mode badges
- validation status badges
- export to Excel/PDF

### New page: `/hr/attendance/movements`

Show:

- open movements
- returned movements
- employee name
- movement type
- destination
- check-out time
- return time
- duration
- supervisor status

### New widget: Supervisor visibility

Add dashboard card or panel:

- employees currently out on official duty
- employees checked in from field
- employees checked in from another branch

## Employee / Mobile Pages

### `/self-service/attendance`

Actions:

- check in
- check out
- start movement
- end movement
- show today status

### `/self-service/attendance/mobile`

Optimized for mobile:

- one-tap check-in
- location permission prompt
- offline queue status
- sync retry

---

## Payroll Impact Plan

This area needs careful correction.

### Current issue

Payroll currently calculates:

- `presentDays` from `PRESENT`, `LATE`, `HALF_DAY`
- `leaveDays` from `ON_LEAVE`
- `absentDays = daysInMonth - presentDays - leaveDays`

This means:

- `WEEKEND` is not handled
- `HOLIDAY` is not handled
- future movement-related status could also be mishandled

### Required payroll update

Payroll attendance logic should explicitly classify each attendance day into:

- payable present day
- payable leave day
- non-working day
- deductible absence day

Recommended non-working statuses:

- `WEEKEND`
- `HOLIDAY`

Holiday source:

- Use the existing HR `HolidayCalendar` and `Holiday` tables
- Payroll should read the active default holiday calendar for the payroll year
- Monthly working-day calculation should exclude holiday dates from that calendar
- Do not introduce a separate holiday engine for payroll

Recommended duty-valid statuses or modes:

- `PRESENT`
- `LATE`
- `HALF_DAY`
- `ON_LEAVE`
- official movement records linked to a valid attendance day

### Recommended implementation rule

Do not compute absence using raw `daysInMonth`.

Instead compute:

```text
workingCalendarDays
  = total month days
  - weekends
  - holidays

absentDays
  = workingCalendarDays
  - presentEquivalentDays
  - approvedLeaveDays
```

This is the correct payroll-safe approach.

Implementation note:

- `workingCalendarDays` should be derived from:
  - total days in the payroll month
  - minus weekend dates
  - minus holiday dates from `HolidayCalendar`
- If a holiday falls on a weekend, subtract it only once

---

## Reporting Plan

Required reports:

1. Monthly attendance summary
2. Official movement register
3. Field attendance log
4. Cross-branch visit log
5. Attendance exceptions report

### Monthly attendance summary

Must show:

- present
- absent
- late
- leave
- holiday
- weekend
- field days
- branch visit days
- movement count
- OT hours

### Official movement register

Must show:

- employee
- date
- movement type
- destination
- purpose
- start time
- return time
- duration
- supervisor

### Field attendance log

Must show:

- employee
- date
- check-in/out time
- GPS coordinates
- validation result
- sync status

### Cross-branch visit log

Must show:

- employee
- home business unit
- home location
- visited location
- date
- purpose

---

## Suggested Status and Mode Strategy

To reduce payroll risk, use two layers:

### Layer 1: Daily status

Keep controlled statuses such as:

- `PRESENT`
- `ABSENT`
- `LATE`
- `HALF_DAY`
- `ON_LEAVE`
- `HOLIDAY`
- `WEEKEND`

### Layer 2: Attendance mode

Add context values such as:

- `OFFICE`
- `FIELD`
- `BRANCH_VISIT`
- `OFFICIAL_MOVEMENT`
- `REMOTE`

This avoids exploding the core payroll status enum.

---

## Implementation Phases

## Phase 1: Consistency and payroll-safe base

1. Align all attendance status validation with schema
2. Fix payroll handling for `WEEKEND` and `HOLIDAY`
3. Convert attendance page from static to live API data
4. Add attendance filters and export

## Phase 2: Multi-location attendance foundation

1. Add HR fields:
   - `primaryBusinessUnitId`
   - `primaryCostCenterId`
   - `workLocationId`
2. Update employee create/edit flows
3. Add attendance context fields:
   - `operatingLocationId`
   - `attendanceMode`
   - `attendanceSource`
4. Add location-aware reporting filters

## Phase 3: Official movement workflow

1. Create `AttendanceMovement`
2. Add start movement / return APIs
3. Add movement screen and supervisor visibility
4. Add movement reports

## Phase 4: Field attendance

1. Add geo fields and validation fields
2. Add mobile check-in/check-out UI
3. Add geofence configuration if needed
4. Add field attendance report

## Phase 5: Offline sync and advanced branch visit logging

1. Add mobile sync endpoint
2. Add duplicate event protection
3. Add sync status handling
4. Add optional `AttendanceVisit`

---

## Acceptance Criteria

The implementation is acceptable when:

- official movement is visible and not treated as absence
- field attendance can capture location data
- branch visit attendance can be logged against a visited location
- attendance summaries can filter by business unit and operating location
- payroll does not deduct `WEEKEND` or `HOLIDAY` as absence
- supervisor can see employees currently out on duty
- reports can distinguish normal attendance, field attendance, and official movement

---

## Demo Plan for Client

### Demo 1: Official movement

1. Employee checks in at office
2. Employee starts movement for bank visit
3. Supervisor sees `Out on Duty`
4. Employee returns and ends movement
5. Report shows movement duration, not absence

### Demo 2: Field attendance

1. Field worker checks in from mobile
2. Location is recorded
3. Check-out happens from field
4. Report shows field attendance with timestamp and validation

### Demo 3: Cross-branch attendance

1. HQ employee checks in from another branch
2. System tags visited location
3. HQ report shows employee, home unit, and visited branch

---

## Recommended Next Step

Start with a technical change set in this order:

1. Payroll attendance correction for `WEEKEND` and `HOLIDAY`
2. Live attendance page
3. HR master data alignment with `workLocationId` and business unit fields
4. Official movement backend model and APIs
5. Mobile and field attendance extensions
