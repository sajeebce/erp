# No-Cost Project Extension Workflow Plan

> Updated: 2026-05-01  
> Context: Accounts Module Task 3 - No-Cost Project Extension  
> Scope: Client demo workflow, role setup, approval flow, validation, and test steps

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

## 2. Current Verdict

The current system supports the required no-cost extension workflow through a dedicated project extension flow.

Implemented/currently available:

- Project list and project detail pages.
- Dedicated no-cost extension request model.
- Project detail page extension panel.
- Extension request submission.
- Admin approval/rejection queue.
- Budget snapshot validation.
- Approval updates project end date only.
- Generic project update blocks direct end-date extension and budget bypass.

Recommended demo flow:

**Project Manager requests extension -> Admin reviews reason -> Admin approves/rejects -> project end date updates without budget change.**

## 3. Recommended Demo Roles

For the demo, use a dedicated Project Manager user instead of using Staff or Store Manager.

Recommended employee/user mapping:

- **Abdur Rahim**: Admin / approver.
- **Fatema Khatun**: Project Manager / extension requester.
- **Kamal Ahmed**: Staff / procurement and attendance demo user.
- **Shakil Ahmed**: Store Manager / inventory, GRN, asset, mobile attendance demo user.
- **Karim Ahmed or Nasima Akter**: Finance/accounts demo users, if needed.

Project Manager role should have project access only, not full admin access.

Minimum Project Manager menu:

- Dashboard
- Projects
- Project List
- Create Project

Optional but not required:

- Attendance self-service, only if the same user is also used for HR attendance demo.

## 4. Setup Flow Before Testing

## 4.1 Create Role

Open:

- `http://localhost:4000/settings/roles`

Create or verify a role:

- Role name: `PROJECT_MANAGER`
- Display name: `Project Manager`

Recommended permissions:

- `projects.read`
- `projects.create`
- `projects.update` for own/assigned project metadata, if supported
- `projects.extension.create`

Do not give approval permission to Project Manager for this demo.

## 4.2 Create or Link User

Open:

- `http://localhost:4000/settings/users`

Create/link user for:

- Employee: `Fatema Khatun`
- Role: `Project Manager`

The user must be linked to Fatema Khatun's employee record so submitted extension requests can show the correct requester.

## 4.3 Assign Fatema as Project Manager

Open:

- `http://localhost:4000/projects/new`

When creating a project, select:

- Project Manager: `Fatema Khatun`

If using an existing project, make sure the project manager is Fatema Khatun or another dedicated project manager.

## 5. Business Workflow

## 5.1 Project Creation

Admin or Project Manager creates a project from:

- `http://localhost:4000/projects/new`

Required demo data:

- Project name
- Donor/program, if applicable
- Start date
- End date
- Budget
- Project Manager: `Fatema Khatun`

The initial budget is the approved project budget.

## 5.2 Project Manager Requests No-Cost Extension

Project Manager logs in and opens:

- `http://localhost:4000/projects`

Then:

1. Select the project.
2. Open the project detail page, for example:
   - `http://localhost:4000/projects/11a7753d-cea3-4508-b46c-9e641e070213`
3. Find the `No-Cost Extension & Timeline` section.
4. Click `Request No-Cost Extension`.
5. Enter:
   - Proposed new end date
   - Reason
   - Impact notes, if available
   - Approval/reference note, if available
6. Submit request.

Budget should be visible as a locked/read-only value. It must not be editable in the extension request.

## 5.3 System Validation on Submit

System should validate:

1. Project exists under the same organization.
2. Project has a current end date.
3. Proposed end date is later than current end date.
4. There is no duplicate pending extension request for the same project.
5. Extension reason is provided.
6. Project budget is not modified.

Expected result:

- Request status becomes `PENDING_APPROVAL`.
- Request number is generated, for example `NCE-2026-001`.
- Current end date and current budget are saved as snapshots.

## 5.4 Admin Reviews Extension

Admin logs in and opens:

- `http://localhost:4000/projects/extensions`

Admin should see:

- Project name
- Current end date
- Proposed new end date
- Extension duration
- Current budget snapshot
- Reason
- Requested by
- Status

Admin actions:

- Approve
- Reject

Reject should include a rejection reason.

## 5.5 Approval Behavior

When admin approves:

1. System validates request is still pending.
2. System validates project budget still matches the saved request budget snapshot.
3. System updates only `Project.endDate`.
4. System keeps `Project.totalBudget` unchanged.
5. Extension request status becomes `APPROVED`.
6. Approval notes, approver, and approval time are saved.

This satisfies the no-cost requirement because timeline changes but budget does not change.

## 5.6 Rejection Behavior

When admin rejects:

1. Extension request status becomes `REJECTED`.
2. Rejection reason is saved.
3. Project end date remains unchanged.
4. Project budget remains unchanged.

## 6. Current Technical Implementation

Current model/API/UI paths:

- Prisma model: `ProjectExtensionRequest`
- Enum: `ProjectExtensionStatus`
- Helper: `src/lib/project-extensions.ts`
- Project detail UI: `src/app/(dashboard)/projects/[id]/page.tsx`
- Admin queue UI: `src/app/(dashboard)/projects/extensions/page.tsx`
- List/create project extension API:
  - `GET /api/v1/projects/[id]/extensions`
  - `POST /api/v1/projects/[id]/extensions`
- Admin queue API:
  - `GET /api/v1/projects/extensions`
- Approval API:
  - `POST /api/v1/projects/[id]/extensions/[extensionId]/approve`
- Rejection API:
  - `POST /api/v1/projects/[id]/extensions/[extensionId]/reject`
- Generic project update hardening:
  - `PUT /api/v1/projects/[id]`

Important control:

- Direct project end-date extension must use the no-cost extension workflow.
- Budget changes must not be done through no-cost extension.

## 7. Demo Script

## 7.1 Happy Path

1. Admin creates or verifies `Project Manager` role.
2. Admin creates/links Fatema Khatun as a Project Manager user.
3. Admin creates a project and selects Fatema Khatun as Project Manager.
4. Fatema logs in.
5. Fatema opens `Projects > Project List`.
6. Fatema opens the assigned project detail page.
7. Fatema clicks `Request No-Cost Extension`.
8. Fatema enters a later end date and reason.
9. Fatema submits the request.
10. Admin opens `Projects > No-Cost Extensions`.
11. Admin reviews budget unchanged confirmation.
12. Admin approves.
13. Project detail page shows updated end date.
14. Project budget remains unchanged.
15. Extension history/status is visible.

## 7.2 Rejection Demo

1. Fatema submits another extension request with weak/missing reference.
2. Admin opens `Projects > No-Cost Extensions`.
3. Admin rejects with reason.
4. Project end date remains unchanged.
5. Rejection reason is visible in extension history.

## 7.3 Budget Integrity Demo

Show these points during client demo:

1. Extension form does not allow budget edit.
2. Approval updates end date only.
3. Project budget before approval and after approval remains the same.
4. Direct project update cannot be used to bypass no-cost extension approval.

## 8. Expected Effects After Approval

After admin approves an extension:

- Project current end date changes to proposed new end date.
- Project budget stays unchanged.
- Extension request status becomes `APPROVED`.
- Admin queue count updates.
- Project detail timeline reflects the new end date.
- Extension history keeps requester, approver, old end date, new end date, reason, and budget snapshot.

No effect expected:

- No budget increase.
- No procurement transaction.
- No finance journal entry.
- No inventory or asset update.

## 9. Acceptance Criteria

Task 3 is ready for client demo when:

1. Project Manager can open project list.
2. Project Manager can select an existing project.
3. Project Manager can submit a no-cost extension request.
4. Budget is visible but not editable in the extension flow.
5. Admin can see pending extension request.
6. Admin can approve or reject.
7. Approval updates only project end date.
8. Project budget remains unchanged.
9. Extension history/status is visible.
10. Direct budget/end-date bypass is blocked by API validation.

## 10. Important Clarification

Attendance self-service is not required for this project extension workflow.

Fatema Khatun as Project Manager only needs project access for this Task 3 demo. HR Attendance Scenario 3 can still be tested separately using a staff/store/field user through:

- `Employee Self-Service > Mobile Check-in`

