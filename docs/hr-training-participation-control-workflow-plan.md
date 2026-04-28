# HR Training Participation Control Workflow Plan

Prepared: April 28, 2026  
Scope: Task 2 - Training Participation Control (No Overlap Rule)

---

## 1. Client Requirement

### Demonstration Flow
1. Assign an employee to a training program
2. Attempt to assign the same employee again to a conflicting or duplicate training

### Expected System Behavior
- System should restrict duplicate nominations
- System should restrict overlapping nominations

### Key Focus Points
- Validation rules enforcement
- Training history tracking
- Automated conflict detection

---

## 2. Reference Scope from NGO ERP Features

From [NGO_ERP_FEATURES.md](./NGO_ERP_FEATURES.md):

- `9.10 Training & Development`
  - Training Programs: create and track training programs
  - Participant Management: enroll employees, track attendance and completion
  - Skill Matrix
  - Certification Tracking

This client task directly extends the existing `Participant Management` scope.  
It should be implemented as a focused validation and nomination-control layer, not as a separate training subsystem.

---

## 3. Current Codebase Status

### Already Available

#### Data Model
- `Training` model exists with:
  - `trainingNo`
  - `title`
  - `type`
  - `startDate`
  - `endDate`
  - `status`
  - `participants`
- `TrainingParticipant` model exists with:
  - `trainingId`
  - `employeeId`
  - `attended`
  - `score`
  - `feedback`
- Current DB rule already prevents exact duplicate entry within the same training:
  - `@@unique([trainingId, employeeId])`

#### APIs
- `POST /api/v1/hr/training` exists
- `GET /api/v1/hr/training` exists
- `POST /api/v1/hr/training/[id]/participants` exists
- `GET /api/v1/hr/training/[id]/participants` exists

#### History Source
- Employee timeline already reads completed training participation from `TrainingParticipant`

### Current Gaps

#### Duplicate Control Gap
- Current participant API only blocks `same employee + same training`
- It does not block:
  - same employee being nominated to another training with same time slot
  - same employee being nominated twice to effectively duplicate training sessions

#### Conflict Detection Gap
- No overlap detection exists between:
  - training A start/end time
  - training B start/end time
  - same employee participant records

#### Training History Gap
- History exists indirectly through participant records
- But there is no dedicated nomination result state like:
  - `NOMINATED`
  - `CONFIRMED`
  - `COMPLETED`
  - `CANCELLED`
- For this task, a full status engine is not required unless needed later

#### UI Gap
- `/hr/training` page is still static demo data
- There is no live nomination flow UI yet

---

## 4. Implementation Goal

Implement a lean control flow so that:

1. HR can assign an employee to a training
2. System blocks duplicate nomination in the same training
3. System blocks overlapping nomination across active trainings
4. HR can see training history per employee
5. Conflict reason is returned clearly in API response

This should remain intentionally small and practical for demo and near-term production usage.

---

## 5. Business Rules

### Rule 1: Same Training Duplicate
- If the same employee is already enrolled in the same training, block the request

### Rule 2: Overlapping Training Conflict
- If the same employee is already enrolled in another training whose schedule overlaps, block the request

### Rule 3: Active Training Scope
- Overlap validation should only apply to trainings that are still relevant for nomination:
  - `PLANNED`
  - `IN_PROGRESS`
- `COMPLETED` and `CANCELLED` trainings should not block future nominations

### Rule 4: Date Interpretation
- If both `startDate` and `endDate` exist:
  - overlap means date ranges intersect
- If `endDate` is null:
  - treat it as single-day training on `startDate`

### Rule 5: Training History
- Completed and attended trainings should remain visible as employee history
- Rejected nomination attempts should not create participation rows

---

## 6. Proposed Workflow

### Workflow A: Successful Nomination
1. HR opens training participant assignment
2. HR selects employee
3. System checks:
   - employee exists in same organization
   - employee is not already enrolled in this training
   - employee has no overlapping active training
4. System creates `TrainingParticipant`
5. System returns success

### Workflow B: Duplicate Nomination Block
1. HR selects employee already assigned in same training
2. System detects existing `trainingId + employeeId`
3. System returns `409 Conflict`
4. UI shows: employee already nominated in this training

### Workflow C: Overlapping Nomination Block
1. HR selects employee for another training
2. System checks other active trainings where employee is already a participant
3. If date range overlaps, system blocks nomination
4. API returns:
   - conflicting training id/no/title
   - conflicting date range
   - conflict reason

### Workflow D: Training History View
1. HR opens employee training history
2. System lists employee participations ordered by training date
3. HR can review:
   - training title
   - type
   - date range
   - attended status
   - score

---

## 7. Data Model Plan

## Phase 1 Recommendation

No schema change required for the base duplicate/overlap rule.

Reason:
- `Training` already has date fields
- `TrainingParticipant` already links employee to training
- Conflict detection can be enforced at API layer using existing tables

## Optional Later Enhancement

If training nomination lifecycle becomes more complex, add:
- `nominationStatus`
- `nominatedAt`
- `cancelledAt`
- `cancelReason`

These are not required for current client task.

---

## 8. API Plan

### Existing API to Extend
- `POST /api/v1/hr/training/[id]/participants`

### Validation Steps in Participant POST
1. Validate training exists
2. Validate employee belongs to same organization
3. Validate exact duplicate in same training
4. Load target training date window
5. Query other participant rows of same employee joined with trainings
6. Filter active trainings:
   - `PLANNED`
   - `IN_PROGRESS`
7. Check overlap
8. If conflict found, return `409 Conflict`
9. Else create participant row

### Example Conflict Response

```json
{
  "success": false,
  "error": {
    "message": "Employee has overlapping training nomination",
    "details": {
      "conflictingTrainingId": "...",
      "conflictingTrainingNo": "TRN-2026-005",
      "conflictingTrainingTitle": "Project Cycle Management",
      "startDate": "2026-05-10T00:00:00.000Z",
      "endDate": "2026-05-12T00:00:00.000Z"
    }
  }
}
```

### Suggested Read APIs for UI

Keep current routes and extend response shape as needed:

- `GET /api/v1/hr/training/[id]/participants`
  - include employee basic details
- `GET /api/v1/hr/employees/[id]/timeline`
  - already useful for history

Optional dedicated API later:
- `GET /api/v1/hr/employees/[id]/training-history`

Not necessary in first pass.

---

## 9. UI Plan

## Phase 1

Use existing training participant assignment flow or create a simple participant panel.

Minimum UI behavior:
- employee dropdown
- assign button
- inline conflict message on duplicate or overlap
- participant list under training

## Phase 2

Make `/hr/training` live API-driven instead of static demo data.

Recommended additions:
- training list from API
- open training details
- participant tab
- assign employee modal
- training history link from employee profile

## Demo-Critical UI Messages

- `Employee already nominated in this training`
- `Employee already nominated in another training during the same period`
- `Training history available in employee record`

---

## 10. Conflict Detection Logic

### Date Normalization
- `targetStart = training.startDate`
- `targetEnd = training.endDate ?? training.startDate`
- `otherStart = otherTraining.startDate`
- `otherEnd = otherTraining.endDate ?? otherTraining.startDate`

### Overlap Formula

Two training windows overlap if:

`targetStart <= otherEnd AND otherStart <= targetEnd`

### Status Filter

Only compare against trainings where:
- `status = PLANNED`
- `status = IN_PROGRESS`

Ignore:
- `COMPLETED`
- `CANCELLED`

---

## 11. Reporting & History

### Training History Tracking

Employee training history can be derived from:
- `TrainingParticipant`
- joined `Training`

Fields to show:
- training no
- title
- type
- start date
- end date
- attended
- score

### Conflict Audit Trail

No DB record needed for blocked attempts in Phase 1.  
Return API error only.

Optional later:
- add audit log entry for blocked nomination attempts

---

## 12. Phased Delivery

### Phase 1: Core Validation
- extend participant POST API
- exact duplicate block
- overlap block
- clear conflict response

### Phase 2: Live Training UI
- make training page API-driven
- add participant assignment UI
- show conflict message in UI

### Phase 3: History Improvements
- employee training history view
- filters by date/type/status
- export if needed

---

## 13. Acceptance Criteria

The task is complete when:

1. Same employee cannot be assigned twice to the same training
2. Same employee cannot be assigned to overlapping active trainings
3. Non-overlapping trainings can still be assigned successfully
4. API returns clear conflict reason
5. Employee training participation remains visible as history
6. Demo can show:
   - one successful assignment
   - one duplicate rejection
   - one overlap rejection

---

## 14. Recommended Next Implementation Step

Implement `Phase 1` first only.

Reason:
- lowest scope
- no schema migration needed
- directly addresses client requirement
- avoids overengineering

After that, convert `/hr/training` from static page to live participant-management UI.
