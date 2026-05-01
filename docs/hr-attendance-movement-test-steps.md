# HR Attendance & Movement Test Steps

> Prepared: 2026-05-01  
> Scope: HR Module Task 1 - Attendance & Movement Tracking  
> Test users: `rahim@cssbd.org`, `kamal@cssbd.org`, `shakil@cssbd.org`

---

## Demo User Roles

| User | Role | Purpose |
|---|---|---|
| `rahim@cssbd.org` | Admin / Supervisor | Monitor attendance, movement, field and branch logs |
| `kamal@cssbd.org` | Staff | Employee self-service attendance testing |
| `shakil@cssbd.org` | Store Manager | Branch/field attendance testing |

---

## Before Testing

1. Make sure the app is running at `http://localhost:4000`.
2. Use tenant/organization slug: `cssbd`.
3. Use a fresh browser session or logout before switching user.
4. Admin menu should show `HR & Payroll`.
5. Staff/store manager menu should show `Employee Self-Service`.

Expected menus:

- Admin:
  - `HR & Payroll > Attendance`
  - `HR & Payroll > Attendance Movements`
- Staff/store manager:
  - `Employee Self-Service > My Attendance`
  - `Employee Self-Service > Mobile Check-in`

---

## Scenario 1: Outstation Movement During Office Hours

Use this when an employee goes to a bank or District Commissioner office during office hours.

### Employee Flow

Login as `kamal@cssbd.org`.

1. Open `Employee Self-Service > My Attendance`.
2. Click `Check In`.
3. Confirm today's status shows checked in / present.
4. In the same page, go to the movement section.
5. Select movement type:
   - `Official Duty`, or
   - `Bank Visit`, or
   - `Govt Office`
6. Enter destination:
   - `Bank`, or
   - `District Commissioner Office`
7. Enter purpose, for example:
   - `Cheque submission`
   - `Official document follow-up`
8. Enter expected return time if needed.
9. Click `Start Movement`.
10. Confirm an open movement is visible on the page.
11. After return, click `End Movement`.
12. At day end, click `Check Out`.

### Admin Verification

Login as `rahim@cssbd.org`.

1. Open `HR & Payroll > Attendance`.
2. Check that Kamal is not marked absent.
3. Check that attendance remains duty-valid / present.
4. Open `HR & Payroll > Attendance Movements`.
5. Confirm the movement row shows:
   - employee name
   - movement type
   - destination
   - purpose
   - start/check-out time
   - return time after ending movement
   - status `OPEN` before return or `RETURNED` after return

### Expected Database / System Effect

- `Attendance` record is created or updated for the employee.
- `AttendanceMovement` record is created when movement starts.
- `AttendanceMovement.status` changes from `OPEN` to `RETURNED` after return.
- Employee is not treated as absent for official movement.

---

## Scenario 2: Field Worker Attendance Tracking

Use this when an employee checks in/checks out from a field location.

### Employee Flow

Login as `kamal@cssbd.org` or `shakil@cssbd.org`.

1. Open `Employee Self-Service > Mobile Check-in`.
2. Select mode: `Field`.
3. Click `Capture Location`.
4. Allow browser location permission if prompted.
5. Confirm location captured message or coordinates are shown.
6. Click `Check In`.
7. Later, open the same page again.
8. Select mode: `Field`.
9. Capture location again if needed.
10. Click `Check Out`.

### Offline Sync Flow

Use this only if you want to demonstrate offline-to-online sync.

1. Open `Employee Self-Service > Mobile Check-in`.
2. Disconnect network or simulate API failure.
3. Try `Check In` or `Check Out`.
4. Confirm event is queued locally.
5. Reconnect network.
6. Click `Sync Queued`.
7. Confirm queued event count becomes zero.

### Admin Verification

Login as `rahim@cssbd.org`.

1. Open `HR & Payroll > Attendance`.
2. Check the attendance detail log.
3. Confirm the employee row shows:
   - attendance mode `FIELD`
   - source `MOBILE` if shown
   - location/coordinates if captured
   - validation status, usually `VALID` or `PENDING`
4. Confirm `Field Logs` count updates.

### Expected Database / System Effect

- `Attendance.attendanceMode = FIELD`
- `Attendance.attendanceSource = MOBILE`
- GPS fields may update:
  - `geoLat`
  - `geoLng`
  - `geoAccuracyMeters`
  - `geoAddress`
- Offline sync updates:
  - `syncedAt`
  - `deviceId`

Note: GPS depends on browser/device permission. Full geofence boundary validation is not part of the current demo scope.

---

## Scenario 3: Cross-Branch Attendance

Use this when HQ employee or staff checks in from another branch/location.

### Employee Flow

Login as `shakil@cssbd.org` or `kamal@cssbd.org`.

1. Open `Employee Self-Service > Mobile Check-in`.
2. Select mode: `Branch Visit`.
3. Select the visited branch / operating location.
4. Click `Capture Location` if GPS is available.
5. Click `Check In`.
6. Later, open the same page again.
7. Select mode: `Branch Visit`.
8. Select the same branch / operating location.
9. Click `Check Out`.

### Admin Verification

Login as `rahim@cssbd.org`.

1. Open `HR & Payroll > Attendance`.
2. Check the attendance detail log.
3. Confirm the employee row shows:
   - attendance mode `BRANCH_VISIT`
   - selected operating location / branch
   - check-in time
   - check-out time after checkout
4. Use the operating location filter to verify branch-wise attendance.
5. Confirm `Branch Visit Logs` count updates.

### Expected Database / System Effect

- `Attendance.attendanceMode = BRANCH_VISIT`
- `Attendance.operatingLocationId` is set to selected branch/location.
- GPS fields may update if location is captured.
- Admin can centrally track branch visit attendance from HQ view.

Note: Current demo supports selected branch/location-based tracking. Automatic GPS-to-branch matching is not fully implemented yet.

---

## Final Pass Criteria

The test is successful if:

1. Staff/store manager can access self-service attendance pages.
2. Staff/store manager cannot update another employee's attendance.
3. Admin can see all employee attendance records.
4. Official movement creates a movement log and does not mark employee absent.
5. Field attendance records mobile/GPS context when available.
6. Branch visit attendance records selected operating location.
7. Admin can verify all three scenarios from `HR & Payroll > Attendance` and `HR & Payroll > Attendance Movements`.

