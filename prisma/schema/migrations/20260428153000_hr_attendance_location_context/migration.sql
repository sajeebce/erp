ALTER TABLE "Employee"
ADD COLUMN "primaryBusinessUnitId" UUID,
ADD COLUMN "workLocationId" UUID;

ALTER TABLE "Attendance"
ADD COLUMN "attendanceMode" TEXT,
ADD COLUMN "attendanceSource" TEXT,
ADD COLUMN "operatingLocationId" UUID;

CREATE INDEX "Employee_primaryBusinessUnitId_idx" ON "Employee"("primaryBusinessUnitId");
CREATE INDEX "Employee_workLocationId_idx" ON "Employee"("workLocationId");
CREATE INDEX "Attendance_operatingLocationId_idx" ON "Attendance"("operatingLocationId");
