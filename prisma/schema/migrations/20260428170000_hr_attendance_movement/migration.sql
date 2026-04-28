CREATE TABLE "AttendanceMovement" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "attendanceId" UUID,
    "movementType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "destinationAddress" TEXT,
    "operatingLocationId" UUID,
    "checkOutTime" TIMESTAMP(3) NOT NULL,
    "expectedReturnTime" TIMESTAMP(3),
    "actualReturnTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "approvedById" UUID,
    "supervisorNotes" TEXT,
    "geoLatOut" DECIMAL(10,7),
    "geoLngOut" DECIMAL(10,7),
    "geoLatIn" DECIMAL(10,7),
    "geoLngIn" DECIMAL(10,7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AttendanceMovement_organizationId_idx" ON "AttendanceMovement"("organizationId");
CREATE INDEX "AttendanceMovement_employeeId_idx" ON "AttendanceMovement"("employeeId");
CREATE INDEX "AttendanceMovement_attendanceId_idx" ON "AttendanceMovement"("attendanceId");
CREATE INDEX "AttendanceMovement_operatingLocationId_idx" ON "AttendanceMovement"("operatingLocationId");
CREATE INDEX "AttendanceMovement_status_idx" ON "AttendanceMovement"("status");
CREATE INDEX "AttendanceMovement_checkOutTime_idx" ON "AttendanceMovement"("checkOutTime");

ALTER TABLE "AttendanceMovement"
ADD CONSTRAINT "AttendanceMovement_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AttendanceMovement"
ADD CONSTRAINT "AttendanceMovement_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AttendanceMovement"
ADD CONSTRAINT "AttendanceMovement_attendanceId_fkey"
FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

