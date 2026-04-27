# No-Cost Project Extension Workflow Plan

> Prepared: 2026-04-27  
> Context: Client Task 3 requirement review  
> Scope: Current implementation assessment + recommended implementation workflow  

## 1. Client Requirement

Task 3: No-Cost Project Extension

Demonstration flow:

1. Select an existing project.
2. Extend project duration without increasing budget.
3. System validation to ensure no budget modification.

Key focus points:

1. Budget integrity enforcement.
2. Extension approval process.
3. Updated project timeline visibility.

## 2. Executive Verdict

Current system-e project create, list, detail, and direct update flow ache. Project-er `startDate`, `endDate`, and `totalBudget` schema/API/UI-te ache.

But client-er required **No-Cost Project Extension** flow ekhono proper dedicated workflow hisebe implemented na.

Current status:

- Existing project select kora jay.
- Project end date direct edit kora jay.
- Project budget direct edit kora jay.
- Project detail page-e timeline dates visible.
- Dedicated extension request nai.
- Approval process nai.
- Budget unchanged validation nai.
- Extension history nai.
- Direct project update diye budget change bypass kora possible.

Verdict:

**Task 3 currently partially supported by generic project edit, but not compliant with the required no-cost extension workflow.**

## 3. Files Reviewed

- `prisma/schema/project.prisma`
- `src/app/api/v1/projects/route.ts`
- `src/app/api/v1/projects/[id]/route.ts`
- `src/app/(dashboard)/projects/page.tsx`
- `src/app/(dashboard)/projects/[id]/page.tsx`
- `src/lib/approval-engine.ts`
- `prisma/schema/system.prisma`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/NGO_ERP_CLIENT_REPORT.md`

## 4. Current Implementation Assessment

## 4.1 What Already Exists

### A. Project Selection

Functional.

Current project list page:

- Route: `/projects`
- API: `GET /api/v1/projects`
- User can select an existing project and open detail page.

### B. Project Timeline Data

Partially functional.

Project model already has:

- `startDate`
- `endDate`
- `status`
- `progress`

Project detail page displays project date information.

### C. Project Update

Functional but risky for this requirement.

Current API:

- `PUT /api/v1/projects/[id]`

This API allows updating:

- `startDate`
- `endDate`
- `totalBudget`
- `status`
- `progress`
- other project metadata

This means a user can extend project duration and modify budget in the same generic update request.

For no-cost extension, this is not acceptable unless controlled by separate validation and permissions.

### D. Audit Logging

Partial.

Project update API writes audit log, but current audit log does not specifically record:

- old end date
- new end date
- budget before extension
- budget after extension
- extension approval decision
- approver identity as a formal extension approver

## 4.2 What Is Missing

### A. Dedicated Extension Request

Missing.

There is no dedicated model such as:

- `ProjectExtensionRequest`
- `NoCostExtensionRequest`

### B. Approval Workflow

Missing.

There is no submit -> review -> approve/reject flow for project extension.

### C. Budget Integrity Enforcement

Missing.

Current project update API can accept `totalBudget`. So no-cost extension can be bypassed by direct budget update unless API is restricted.

### D. Extension History

Missing.

System does not track:

- original end date
- previous extension requests
- approved/rejected extension decisions
- extension count
- extension reason
- donor/board approval reference

### E. Updated Timeline Visibility

Partial only.

Current detail page can show current project end date, but it does not clearly show:

- original end date
- extended end date
- active extension status
- extension history
- "Extended" badge

## 5. Target Business Workflow

## 5.1 Step 1: Select Existing Project

User opens:

- `/projects`

System lists active projects with:

- project number
- project name
- donor
- project status
- original/current end date
- budget
- extension status

User selects one project.

Allowed project statuses:

- `ACTIVE`
- `ON_HOLD`

Optional allowed status:

- `PIPELINE`, only if organization wants pre-start date corrections.

Recommended for client demo:

- Allow only `ACTIVE` and `ON_HOLD`.

## 5.2 Step 2: Start No-Cost Extension Request

On project detail page:

- Button: `Request No-Cost Extension`

System opens a form or page:

- `/projects/[id]/extensions/new`

Form should show read-only current project information:

- project number
- project name
- donor/grant
- project status
- current start date
- current end date
- current total budget
- amount spent
- remaining budget

User input fields:

- proposed new end date
- extension reason
- implementation impact note
- donor/management approval reference
- attachment/document reference
- requested by

Budget field must not be editable.

## 5.3 Step 3: System Validation Before Submit

On submit, system must validate:

1. Project exists under the user's organization.
2. Project is not deleted.
3. Project status is allowed for extension.
4. Current project has an existing `endDate`.
5. Proposed new end date is later than current end date.
6. There is no other pending extension request for the same project.
7. Budget is not changed.
8. Request reason is mandatory.
9. If donor approval reference is required by policy, it must be provided.

Budget integrity validation:

- API should not accept `proposedBudget` from UI.
- If API accepts it for audit display, it must exactly equal `project.totalBudget`.
- On approval, transaction must update only `Project.endDate`.
- `Project.totalBudget` must remain unchanged.

## 5.4 Step 4: Submit for Approval

After validation, system creates extension request:

- Status: `PENDING_APPROVAL`
- Current end date snapshot saved.
- Current budget snapshot saved.
- Proposed end date saved.
- Request reason saved.
- Requested user saved.

Recommended request number format:

- `NCE-2026-001`

Status flow:

1. `DRAFT`
2. `PENDING_APPROVAL`
3. `APPROVED`
4. `REJECTED`
5. `CANCELLED`

For demo simplicity, system can create directly as `PENDING_APPROVAL`.

## 5.5 Step 5: Approval Review

Approver opens:

- `/projects/extensions`
- or project detail extension panel

Approver sees:

- current end date
- proposed end date
- extension days/months
- current budget
- confirmation that budget is unchanged
- reason
- impact note
- attachment/reference
- previous extension history

Approver actions:

- Approve
- Reject

Reject requires reason.

Approve requires final validation again inside database transaction.

## 5.6 Step 6: Approval Validation

Before approval, system must re-check:

1. Request status is `PENDING_APPROVAL`.
2. Project still exists.
3. Project budget still equals request snapshot budget, unless policy allows unrelated approved budget revision.
4. Request proposed end date is later than current project end date.
5. No newer approved extension already changed the project end date in a conflicting way.
6. Approval user has permission.

Important:

Validation must happen at approval time, not only at submit time.

## 5.7 Step 7: Apply Approved Extension

Approval transaction should:

1. Update extension request status to `APPROVED`.
2. Save `approvedById`.
3. Save `approvedAt`.
4. Save approval notes.
5. Update `Project.endDate` to proposed end date.
6. Keep `Project.totalBudget` unchanged.
7. Create audit log.

Audit log should record:

- project id
- request id
- old end date
- new end date
- old budget
- new budget
- approved by
- approved at

## 5.8 Step 8: Updated Timeline Visibility

After approval, project detail should show:

- original project end date
- current approved end date
- extension count
- latest extension status
- latest approved extension date
- extension reason

Project list should show:

- current end date
- `Extended` badge if at least one approved extension exists
- pending extension badge if one request is waiting for approval

Timeline/milestone view should show:

- activities/milestones within original timeline
- activities/milestones within extended timeline
- overdue activities after extended end date

## 6. Recommended Data Model

Add enum:

```prisma
enum ProjectExtensionStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  CANCELLED
}
```

Add model:

```prisma
model ProjectExtensionRequest {
  id                 String                 @id @default(uuid()) @db.Uuid
  organizationId     String                 @db.Uuid
  projectId          String                 @db.Uuid
  requestNo          String
  currentStartDate   DateTime?
  currentEndDate     DateTime
  proposedEndDate    DateTime
  currentBudget      Decimal                @db.Decimal(18, 2)
  reason             String
  impactNotes        String?
  approvalReference  String?
  attachmentUrl      String?
  status             ProjectExtensionStatus @default(PENDING_APPROVAL)
  requestedById      String                 @db.Uuid
  requestedAt        DateTime               @default(now())
  approvedById       String?                @db.Uuid
  approvedAt         DateTime?
  approvalNotes      String?
  rejectedById       String?                @db.Uuid
  rejectedAt         DateTime?
  rejectionReason    String?
  createdAt          DateTime               @default(now())
  updatedAt          DateTime               @updatedAt
  deletedAt          DateTime?

  organization Organization @relation(fields: [organizationId], references: [id])
  project      Project      @relation(fields: [projectId], references: [id])

  @@unique([organizationId, requestNo])
  @@index([organizationId])
  @@index([projectId])
  @@index([status])
}
```

Add relation in `Project`:

```prisma
extensionRequests ProjectExtensionRequest[]
```

Optional fields in `Project` for stronger timeline reporting:

```prisma
originalEndDate DateTime?
lastExtendedAt  DateTime?
```

Recommendation:

- Add `originalEndDate` only if existing project data can be migrated safely.
- Otherwise derive original end date from first approved extension request's `currentEndDate`.

## 7. Recommended API Design

## 7.1 List Project Extensions

`GET /api/v1/projects/[id]/extensions`

Returns:

- extension requests for selected project
- latest status
- approved/rejected history

## 7.2 Create Extension Request

`POST /api/v1/projects/[id]/extensions`

Payload:

```json
{
  "proposedEndDate": "2027-06-30",
  "reason": "Implementation delayed due to field access constraints.",
  "impactNotes": "Remaining activities can be completed within extended period without additional budget.",
  "approvalReference": "Board Memo BM-2026-04"
}
```

Backend must derive:

- current end date
- current budget
- organization id
- requested by
- request number

Backend must not trust budget from client payload.

## 7.3 Approve Extension

`POST /api/v1/projects/[id]/extensions/[extensionId]/approve`

Payload:

```json
{
  "approvalNotes": "Approved as no budget increase is requested."
}
```

Transaction:

- validate request
- validate budget unchanged
- update project end date
- update request status
- write audit log

## 7.4 Reject Extension

`POST /api/v1/projects/[id]/extensions/[extensionId]/reject`

Payload:

```json
{
  "rejectionReason": "Donor approval reference is missing."
}
```

## 7.5 Optional Global Approval Queue

`GET /api/v1/projects/extensions?status=PENDING_APPROVAL`

Used by admin/project director dashboard.

## 8. Recommended UI Design

## 8.1 Project List

Route:

- `/projects`

Add columns:

- start date
- current end date
- extension status

Badges:

- `Extended`
- `Extension Pending`

## 8.2 Project Detail

Route:

- `/projects/[id]`

Add card: `Project Timeline`

Fields:

- start date
- original end date
- current end date
- days extended
- latest extension status

Add action:

- `Request No-Cost Extension`

Add card: `Extension History`

Table columns:

- request no
- requested date
- current end date
- proposed end date
- status
- requested by
- approved by

## 8.3 New Extension Page

Route:

- `/projects/[id]/extensions/new`

Sections:

1. Project summary
2. Budget lock confirmation
3. Extension request details
4. Attachments/reference
5. Submit button

Budget lock confirmation text:

`This is a no-cost extension. Project budget will remain unchanged.`

## 8.4 Approval Queue

Route:

- `/projects/extensions`

Filters:

- status
- donor
- project manager
- date range

Actions:

- view
- approve
- reject

## 9. Budget Integrity Enforcement Rules

Rules that must be enforced:

1. No-cost extension cannot change `Project.totalBudget`.
2. Extension request payload should not include budget update.
3. Approval transaction must compare current project budget with request snapshot budget.
4. Generic project edit API should not allow budget changes unless a separate budget revision flow exists.
5. Any approved budget revision must be auditable and separate from no-cost extension.

Recommended API hardening:

- Keep `PUT /api/v1/projects/[id]` for metadata updates.
- Remove `totalBudget` from generic project update unless user has explicit finance/budget permission.
- If `totalBudget` update is needed, use a separate budget revision workflow.

Why this matters:

- Otherwise client demo can show no-cost extension, but real users can still bypass the control through generic edit.

## 10. Permission Model

Recommended permissions:

- `projects.read`
- `projects.extension.create`
- `projects.extension.approve`
- `projects.extension.reject`
- `projects.extension.cancel`
- `projects.extension.view_all`

Recommended roles:

- Project Manager: create request
- Program Head: review/approve
- Finance Head: confirm no budget impact
- Admin: override/manage all

For demo:

- Admin can create and approve.
- Project Manager can create only.

## 11. Audit and Compliance Requirements

Every no-cost extension must preserve:

- who requested
- who approved/rejected
- when requested
- when approved/rejected
- reason
- old end date
- new end date
- budget before
- budget after
- attachment/reference

Audit risk if missing:

- donor cannot verify whether project extension was approved
- auditor cannot prove budget was unchanged
- management cannot track repeated project delays

## 12. Reporting Requirements

Recommended reports:

1. Extension register
2. Pending extension approvals
3. Extended projects list
4. Projects ending within next 30/60/90 days
5. Projects extended more than once

Extension register columns:

- request no
- project no
- project name
- donor
- old end date
- new end date
- extension days
- budget unchanged yes/no
- status
- requested by
- approved by
- approved date

## 13. Demonstration Script

## 13.1 Happy Path

1. Open `/projects`.
2. Select an active project.
3. Show current end date and current budget.
4. Click `Request No-Cost Extension`.
5. Enter proposed new end date.
6. Enter reason and approval reference.
7. Submit request.
8. Admin opens pending extension queue.
9. Admin reviews budget unchanged confirmation.
10. Admin approves.
11. System updates project end date only.
12. Project budget remains unchanged.
13. Project timeline shows extended end date and extension history.

## 13.2 Validation Demo

Test 1: proposed end date before current end date.

Expected:

- system rejects request.

Test 2: try to modify budget through extension payload.

Expected:

- system rejects request or ignores budget field.

Test 3: approve extension after project budget changed externally.

Expected:

- system blocks approval and asks finance/admin to review.

Test 4: create second pending extension for same project.

Expected:

- system blocks duplicate pending request.

## 14. Implementation Phases

## 14.1 Phase 1: Backend Foundation

Tasks:

1. Add `ProjectExtensionStatus` enum.
2. Add `ProjectExtensionRequest` model.
3. Add relation in `Project`.
4. Run Prisma format/generate/db push or migration.
5. Add extension request number generator.
6. Add extension validation helper.

Output:

- DB can store extension requests and history.

## 14.2 Phase 2: APIs

Tasks:

1. Add list API.
2. Add create request API.
3. Add approve API.
4. Add reject API.
5. Add global pending queue API.
6. Add audit logs.

Output:

- Flow can be tested by curl.

## 14.3 Phase 3: UI

Tasks:

1. Add project detail timeline card.
2. Add request extension button.
3. Add new extension form.
4. Add extension history table.
5. Add approval queue/list page.
6. Add approve/reject dialogs.

Output:

- Full client demo possible from browser.

## 14.4 Phase 4: API Hardening

Tasks:

1. Restrict generic project update budget changes.
2. Route budget changes through budget revision workflow.
3. Add permission checks.
4. Add regression tests.

Output:

- Budget integrity is enforceable, not only visible in UI.

## 14.5 Phase 5: Reporting

Tasks:

1. Add extension register.
2. Add pending approval dashboard card.
3. Add project list badges.
4. Add export CSV.

Output:

- Management and audit reporting supported.

## 15. Test Plan

## 15.1 Database Queries

Verify request creation:

```sql
select
  "requestNo",
  "projectId",
  "currentEndDate",
  "proposedEndDate",
  "currentBudget",
  "status"
from "ProjectExtensionRequest"
order by "createdAt" desc;
```

Verify approved project end date:

```sql
select
  p."projectNo",
  p."name",
  p."endDate",
  p."totalBudget",
  e."requestNo",
  e."currentEndDate",
  e."proposedEndDate",
  e."currentBudget",
  e."status"
from "Project" p
join "ProjectExtensionRequest" e on e."projectId" = p."id"
where e."status" = 'APPROVED'
order by e."approvedAt" desc;
```

Verify budget unchanged:

```sql
select
  p."projectNo",
  p."totalBudget" as "projectBudget",
  e."currentBudget" as "extensionBudgetSnapshot",
  case
    when p."totalBudget" = e."currentBudget" then 'UNCHANGED'
    else 'CHANGED'
  end as "budgetIntegrity"
from "Project" p
join "ProjectExtensionRequest" e on e."projectId" = p."id"
where e."status" = 'APPROVED';
```

## 15.2 Curl Tests

Create extension request:

```bash
curl -X POST "http://192.168.50.128:4000/api/v1/projects/PROJECT_ID/extensions" \
  -H "Content-Type: application/json" \
  -d '{
    "proposedEndDate": "2027-06-30",
    "reason": "Field implementation delayed but remaining work can be completed without additional budget.",
    "impactNotes": "No scope or budget increase required.",
    "approvalReference": "Board Memo BM-2026-04"
  }'
```

Approve extension:

```bash
curl -X POST "http://192.168.50.128:4000/api/v1/projects/PROJECT_ID/extensions/EXTENSION_ID/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalNotes": "Approved as no-cost extension. Budget remains unchanged."
  }'
```

Reject extension:

```bash
curl -X POST "http://192.168.50.128:4000/api/v1/projects/PROJECT_ID/extensions/EXTENSION_ID/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Donor approval reference missing."
  }'
```

## 15.3 End-to-End Browser Test

1. Open `http://192.168.50.128:4000/projects`.
2. Select an active project.
3. Note current budget and current end date.
4. Click `Request No-Cost Extension`.
5. Submit proposed extended end date.
6. Open extension approval queue.
7. Approve request.
8. Return to project detail page.
9. Verify project end date updated.
10. Verify budget unchanged.
11. Verify extension history visible.

## 16. Acceptance Criteria

Task 3 should be considered complete only when:

1. User can select an existing project.
2. User can request project duration extension.
3. Budget is read-only in extension flow.
4. System blocks any extension request with budget modification.
5. Extension request goes through approval.
6. Approval updates project end date only.
7. Project budget remains unchanged after approval.
8. Extension history is visible.
9. Project timeline shows updated end date.
10. Audit log records old end date, new end date, budget snapshot, requester, and approver.
11. Curl/API test passes.
12. Browser end-to-end test passes.

## 17. Recommended Next Implementation Decision

Recommended implementation order:

1. Backend model and APIs first.
2. Budget integrity hardening second.
3. Project detail UI third.
4. Approval queue fourth.
5. Reports/export last.

This order keeps the core control enforceable before UI polish.

