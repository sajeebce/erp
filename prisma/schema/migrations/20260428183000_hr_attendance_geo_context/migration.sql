ALTER TABLE "Attendance"
ADD COLUMN "geoLat" DECIMAL(10,7),
ADD COLUMN "geoLng" DECIMAL(10,7),
ADD COLUMN "geoAccuracyMeters" DECIMAL(8,2),
ADD COLUMN "geoAddress" TEXT,
ADD COLUMN "validationStatus" TEXT,
ADD COLUMN "syncedAt" TIMESTAMP(3),
ADD COLUMN "deviceId" TEXT;
