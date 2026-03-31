-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED', 'PENDING');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('DEBIT', 'RECEIPT', 'CASH', 'BANK', 'JOURNAL', 'CONTRA');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountNature" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('BDT', 'USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CURRENT', 'SAVINGS', 'FIXED_DEPOSIT', 'MOBILE_BANKING', 'CASH');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'RECONCILED', 'DISCREPANCY');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE', 'CLOSED', 'REVISED');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('PROJECT', 'CORE', 'PROGRAM', 'OPERATIONAL', 'PROPOSAL');

-- CreateEnum
CREATE TYPE "BudgetPeriodType" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "IndirectCostBase" AS ENUM ('TOTAL_DIRECT', 'MTDC', 'PERSONNEL');

-- CreateEnum
CREATE TYPE "DonorType" AS ENUM ('BILATERAL', 'MULTILATERAL', 'FOUNDATION', 'CORPORATE', 'INDIVIDUAL', 'GOVERNMENT', 'INGO');

-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('PIPELINE', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "GrantLifecycleStage" AS ENUM ('IDENTIFICATION', 'PROPOSAL', 'NEGOTIATION', 'AGREEMENT', 'IMPLEMENTATION', 'CLOSEOUT');

-- CreateEnum
CREATE TYPE "FundReceiptStatus" AS ENUM ('PENDING', 'RECEIVED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "DonorReportType" AS ENUM ('FINANCIAL', 'NARRATIVE', 'PROGRESS', 'AUDIT', 'FUND_UTILIZATION', 'EXPENDITURE_STATEMENT');

-- CreateEnum
CREATE TYPE "DonorReportStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'SUBMITTED', 'ACCEPTED', 'REVISION_REQUIRED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PIPELINE', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('HUMANITARIAN', 'DEVELOPMENT', 'ADVOCACY', 'CAPACITY_BUILDING', 'RESEARCH', 'EMERGENCY_RESPONSE', 'CORE_OPERATIONS', 'MULTI_COUNTRY');

-- CreateEnum
CREATE TYPE "ProjectSector" AS ENUM ('WASH', 'EDUCATION', 'HEALTH', 'LIVELIHOODS', 'FOOD_SECURITY', 'PROTECTION', 'SHELTER', 'NUTRITION', 'AGRICULTURE', 'CLIMATE_ADAPTATION', 'GOVERNANCE', 'GENDER_EQUALITY', 'DISASTER_RISK_REDUCTION', 'MULTI_SECTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskLikelihood" AS ENUM ('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "RiskImpact" AS ENUM ('NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('FINANCIAL', 'OPERATIONAL', 'SECURITY', 'POLITICAL', 'ENVIRONMENTAL', 'REPUTATIONAL', 'COMPLIANCE', 'TECHNICAL');

-- CreateEnum
CREATE TYPE "IndicatorType" AS ENUM ('QUANTITATIVE', 'QUALITATIVE');

-- CreateEnum
CREATE TYPE "IndicatorFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY', 'END_OF_PROJECT');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('ON_TRACK', 'ACHIEVED', 'AT_RISK', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LogFrameLevel" AS ENUM ('GOAL', 'PURPOSE', 'OUTPUT', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "CloseoutItemStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BeneficiaryStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'INACTIVE', 'DECEASED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'DROPPED_OUT', 'WAITLISTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ServiceDeliveryStatus" AS ENUM ('SCHEDULED', 'DELIVERED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "GrievanceSeverity" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "GrievanceCategory" AS ENUM ('SERVICE_QUALITY', 'STAFF_BEHAVIOR', 'ELIGIBILITY', 'DELAY', 'CORRUPTION', 'OTHER');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PRPriority" AS ENUM ('URGENT', 'HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "PRStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED', 'PO_CREATED');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('DRAFT', 'OPEN', 'EVALUATION', 'AWARDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('SUPPLY', 'SERVICE', 'WORKS', 'CONSULTANCY');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'UNDER_RENEWAL', 'TERMINATED');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "GRNStatus" AS ENUM ('PENDING_INSPECTION', 'ACCEPTED', 'REJECTED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "DepreciationMethod" AS ENUM ('STRAIGHT_LINE', 'DECLINING_BALANCE');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "AssetTransferStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "DisposalMethod" AS ENUM ('SALE', 'AUCTION', 'SCRAP', 'DONATION', 'WRITE_OFF');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'CONTRACT', 'CONSULTANT', 'INTERN', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'PROBATION', 'RESIGNED', 'TERMINATED', 'RETIRED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'PROCESSING', 'PROCESSED', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PerformanceRating" AS ENUM ('OUTSTANDING', 'EXCEEDS_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'BELOW_EXPECTATIONS', 'UNSATISFACTORY');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('INTERNAL', 'EXTERNAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobPostingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SCREENED', 'SHORTLISTED', 'TECHNICAL_TEST', 'INTERVIEW', 'REFERENCE_CHECK', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "EmployeeContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'RENEWED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "OffboardingStatus" AS ENUM ('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SeparationType" AS ENUM ('RESIGNATION', 'TERMINATION', 'END_OF_CONTRACT', 'RETIREMENT', 'REDUNDANCY', 'MUTUAL_SEPARATION', 'DEATH_IN_SERVICE');

-- CreateEnum
CREATE TYPE "EmployeeGrievanceStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "DisciplinaryAction" AS ENUM ('VERBAL_WARNING', 'WRITTEN_WARNING', 'FINAL_WARNING', 'SUSPENSION', 'TERMINATION');

-- CreateEnum
CREATE TYPE "SamityStatus" AS ENUM ('NEW', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LoanCategory" AS ENUM ('INCOME_GENERATING', 'AGRICULTURE', 'EDUCATION', 'HOUSING', 'EMERGENCY', 'SEASONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "RepaymentFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "InterestMethod" AS ENUM ('FLAT', 'DECLINING_BALANCE');

-- CreateEnum
CREATE TYPE "LoanAppStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'RECOMMENDED', 'APPROVED', 'REJECTED', 'DISBURSED');

-- CreateEnum
CREATE TYPE "LoanAccountStatus" AS ENUM ('PENDING_DISBURSEMENT', 'ACTIVE', 'CLOSED', 'WRITTEN_OFF', 'RESTRUCTURED');

-- CreateEnum
CREATE TYPE "DisbursementMode" AS ENUM ('CASH', 'BANK', 'MOBILE_BANKING');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('SCHEDULED', 'DISBURSED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('COMPLETED', 'PARTIAL', 'MISSED');

-- CreateEnum
CREATE TYPE "SavingsType" AS ENUM ('COMPULSORY', 'VOLUNTARY', 'FIXED_DEPOSIT', 'DPS');

-- CreateEnum
CREATE TYPE "LoanClassification" AS ENUM ('REGULAR', 'WATCH', 'SUBSTANDARD', 'DOUBTFUL', 'BAD');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_REQUEST', 'APPROVAL_COMPLETED', 'DEADLINE_REMINDER', 'BUDGET_ALERT', 'SYSTEM_ALERT', 'HR_NOTIFICATION', 'REPORT_DUE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "ExpenseClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'SUPERVISOR_APPROVED', 'FINANCE_APPROVED', 'REJECTED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdvanceStatus" AS ENUM ('REQUESTED', 'APPROVED', 'DISBURSED', 'PARTIALLY_SETTLED', 'SETTLED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdvanceType" AS ENUM ('TRAVEL', 'ACTIVITY', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "PettyCashAction" AS ENUM ('OPENING_BALANCE', 'EXPENSE', 'REPLENISHMENT', 'ADJUSTMENT', 'CLOSING');

-- CreateEnum
CREATE TYPE "SalaryComponentCalculationType" AS ENUM ('FIXED', 'PERCENT_OF_BASIC', 'PERCENT_OF_GROSS');

-- CreateEnum
CREATE TYPE "SalaryRevisionType" AS ENUM ('INITIAL', 'STEP_INCREMENT', 'GRADE_PROMOTION', 'COLA', 'MARKET_ADJUSTMENT', 'CORRECTION', 'DEMOTION');

-- CreateEnum
CREATE TYPE "OKRCycleStatus" AS ENUM ('PLANNING', 'ACTIVE', 'SCORING', 'CLOSED');

-- CreateEnum
CREATE TYPE "OKROwnerType" AS ENUM ('ORGANIZATION', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "OKRObjectiveStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KeyResultType" AS ENUM ('METRIC', 'MILESTONE', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "OKRScoreType" AS ENUM ('SELF', 'MANAGER', 'PEER');

-- CreateTable
CREATE TABLE "AssetCategory" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usefulLifeYears" INTEGER NOT NULL,
    "depreciationMethod" "DepreciationMethod" NOT NULL DEFAULT 'STRAIGHT_LINE',
    "depreciationRate" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "assetNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" UUID NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "purchasePrice" DECIMAL(18,2) NOT NULL,
    "serialNumber" TEXT,
    "barcode" TEXT,
    "warehouseId" UUID,
    "custodianId" UUID,
    "projectId" UUID,
    "donorId" UUID,
    "condition" "AssetCondition" NOT NULL DEFAULT 'NEW',
    "accumulatedDepreciation" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netBookValue" DECIMAL(18,2) NOT NULL,
    "insuranceInfo" TEXT,
    "warrantyExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "disposedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDepreciation" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "openingValue" DECIMAL(18,2) NOT NULL,
    "depreciationAmount" DECIMAL(18,2) NOT NULL,
    "closingValue" DECIMAL(18,2) NOT NULL,
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetDepreciation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTransfer" (
    "id" UUID NOT NULL,
    "transferNo" TEXT NOT NULL,
    "assetId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "reason" TEXT,
    "transferredById" UUID NOT NULL,
    "approvedById" UUID,
    "status" "AssetTransferStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "receivedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMaintenance" (
    "id" UUID NOT NULL,
    "maintenanceNo" TEXT NOT NULL,
    "assetId" UUID NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completionDate" TIMESTAMP(3),
    "cost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "vendorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDisposal" (
    "id" UUID NOT NULL,
    "disposalNo" TEXT NOT NULL,
    "assetId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "method" "DisposalMethod" NOT NULL,
    "originalValue" DECIMAL(18,2) NOT NULL,
    "bookValueAtDisposal" DECIMAL(18,2) NOT NULL,
    "recoveryAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "buyerInfo" TEXT,
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "reason" TEXT,
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetDisposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "roleId" UUID NOT NULL,
    "departmentId" UUID,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "preferredLanguage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "beneficiaryNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fatherSpouseName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "age" INTEGER,
    "gender" TEXT,
    "nidNumber" TEXT,
    "phone" TEXT,
    "division" TEXT,
    "district" TEXT,
    "upazila" TEXT,
    "union" TEXT,
    "village" TEXT,
    "address" TEXT,
    "photo" TEXT,
    "status" "BeneficiaryStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeneficiaryEnrollment" (
    "id" UUID NOT NULL,
    "enrollmentNo" TEXT NOT NULL,
    "beneficiaryId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "programName" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "graduationDate" TIMESTAMP(3),
    "servicesAssigned" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "dropoutReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeneficiaryEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDelivery" (
    "id" UUID NOT NULL,
    "serviceNo" TEXT NOT NULL,
    "beneficiaryId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "serviceType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "deliveredById" UUID,
    "quantity" DECIMAL(10,2),
    "value" DECIMAL(18,2),
    "status" "ServiceDeliveryStatus" NOT NULL DEFAULT 'DELIVERED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactIndicator" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpactIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactAssessment" (
    "id" UUID NOT NULL,
    "indicatorId" UUID NOT NULL,
    "projectId" UUID,
    "baseline" DECIMAL(18,2) NOT NULL,
    "target" DECIMAL(18,2) NOT NULL,
    "currentValue" DECIMAL(18,2) NOT NULL,
    "achievementPct" DECIMAL(5,2) NOT NULL,
    "dataSource" TEXT,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpactAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" UUID NOT NULL,
    "grievanceNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "beneficiaryId" UUID,
    "complainantName" TEXT NOT NULL,
    "category" "GrievanceCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "GrievanceSeverity" NOT NULL DEFAULT 'MEDIUM',
    "assignedToId" UUID,
    "resolutionDate" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "status" "GrievanceStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" UUID NOT NULL,
    "budgetCode" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "budgetType" "BudgetType" NOT NULL DEFAULT 'PROJECT',
    "projectId" UUID NOT NULL,
    "grantId" UUID,
    "fiscalYearId" UUID NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "periodType" "BudgetPeriodType" NOT NULL DEFAULT 'ANNUAL',
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "currencyCode" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(12,6),
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "indirectCostRate" DECIMAL(5,2),
    "indirectCostBase" "IndirectCostBase",
    "indirectCostAmount" DECIMAL(18,2),
    "costShareRequired" BOOLEAN NOT NULL DEFAULT false,
    "costSharePercent" DECIMAL(5,2),
    "costShareAmount" DECIMAL(18,2),
    "donorAmount" DECIMAL(18,2),
    "budgetCeiling" DECIMAL(18,2),
    "varianceThreshold" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "narrative" TEXT,
    "assumptions" TEXT,
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" UUID NOT NULL,
    "budgetId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "levelOfEffort" DECIMAL(5,2),
    "duration" INTEGER,
    "donorShare" DECIMAL(18,2),
    "costShare" DECIMAL(18,2),
    "narrative" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetRevision" (
    "id" UUID NOT NULL,
    "revisionNo" TEXT NOT NULL,
    "budgetId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalTotal" DECIMAL(18,2) NOT NULL,
    "revisedTotal" DECIMAL(18,2) NOT NULL,
    "changeAmount" DECIMAL(18,2) NOT NULL,
    "changePercent" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetRevisionLine" (
    "id" UUID NOT NULL,
    "revisionId" UUID NOT NULL,
    "budgetLineId" UUID NOT NULL,
    "originalAmount" DECIMAL(18,2) NOT NULL,
    "revisedAmount" DECIMAL(18,2) NOT NULL,
    "changeAmount" DECIMAL(18,2) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "BudgetRevisionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostAllocationRule" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostAllocationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostAllocationEntry" (
    "id" UUID NOT NULL,
    "ruleId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "allocatedAmount" DECIMAL(18,2) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostAllocationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DonorType" NOT NULL,
    "country" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "description" TEXT,
    "relationshipStatus" TEXT,
    "totalFunded" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorContact" (
    "id" UUID NOT NULL,
    "donorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DonorContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grant" (
    "id" UUID NOT NULL,
    "grantNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "donorId" UUID NOT NULL,
    "projectId" UUID,
    "awardAmount" DECIMAL(18,2) NOT NULL,
    "disbursedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currencyCode" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "GrantStatus" NOT NULL DEFAULT 'PIPELINE',
    "lifecycleStage" "GrantLifecycleStage" NOT NULL DEFAULT 'IDENTIFICATION',
    "ngoabFdNo" TEXT,
    "agreementRef" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundReceipt" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "donorId" UUID NOT NULL,
    "grantId" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currencyCode" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "amountInBDT" DECIMAL(18,2) NOT NULL,
    "bankAccountId" UUID NOT NULL,
    "bankReference" TEXT,
    "status" "FundReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FundReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundRequisition" (
    "id" UUID NOT NULL,
    "requisitionNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "grantId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "purpose" TEXT NOT NULL,
    "requestedById" UUID NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorReport" (
    "id" UUID NOT NULL,
    "reportNo" TEXT NOT NULL,
    "type" "DonorReportType" NOT NULL,
    "grantId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "submittedDate" TIMESTAMP(3),
    "status" "DonorReportStatus" NOT NULL DEFAULT 'DRAFT',
    "preparedById" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "localizedName" JSONB,
    "type" "AccountType" NOT NULL,
    "nature" "AccountNature" NOT NULL,
    "parentId" UUID,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBankAccount" BOOLEAN NOT NULL DEFAULT false,
    "fundCode" TEXT,
    "projectId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" UUID NOT NULL,
    "entryNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "fiscalYearId" UUID NOT NULL,
    "projectId" UUID,
    "grantId" UUID,
    "currencyCode" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "exchangeRate" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "totalDebit" DECIMAL(18,2) NOT NULL,
    "totalCredit" DECIMAL(18,2) NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "isAutoGenerated" BOOLEAN NOT NULL DEFAULT false,
    "sourceModule" TEXT,
    "sourceId" UUID,
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntryLine" (
    "id" UUID NOT NULL,
    "journalEntryId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "description" TEXT,
    "debit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "projectId" UUID,
    "costCenterId" TEXT,

    CONSTRAINT "JournalEntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "type" "VoucherType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "payee" TEXT,
    "projectId" UUID,
    "grantId" UUID,
    "bankAccountId" UUID,
    "chequeNo" TEXT,
    "chequeDate" TIMESTAMP(3),
    "journalEntryId" UUID,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "preparedById" UUID NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "glAccountId" UUID,
    "accountCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "type" "BankAccountType" NOT NULL,
    "bankName" TEXT,
    "branchName" TEXT,
    "accountNumber" TEXT,
    "routingNumber" TEXT,
    "swiftCode" TEXT,
    "currencyCode" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "isMotherAccount" BOOLEAN NOT NULL DEFAULT false,
    "currentBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankReconciliation" (
    "id" UUID NOT NULL,
    "bankAccountId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "bookBalance" DECIMAL(18,2) NOT NULL,
    "bankBalance" DECIMAL(18,2) NOT NULL,
    "difference" DECIMAL(18,2) NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "reconciledById" UUID,
    "reconciledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankReconciliationItem" (
    "id" UUID NOT NULL,
    "reconciliationId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "bookAmount" DECIMAL(18,2),
    "bankAmount" DECIMAL(18,2),
    "isMatched" BOOLEAN NOT NULL DEFAULT false,
    "matchedJournalId" UUID,
    "type" TEXT NOT NULL,

    CONSTRAINT "BankReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashFund" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "imprestAmount" DECIMAL(18,2) NOT NULL,
    "currentBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currencyCode" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "custodianId" UUID NOT NULL,
    "alternateCustodianId" UUID,
    "bankAccountId" UUID,
    "projectId" UUID,
    "grantId" UUID,
    "location" TEXT,
    "maxTransactionLimit" DECIMAL(18,2),
    "reconciliationFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastReconciledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashFund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashTransaction" (
    "id" UUID NOT NULL,
    "fundId" UUID NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "action" "PettyCashAction" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "receiptPath" TEXT,
    "projectId" UUID,
    "budgetLineId" UUID,
    "accountId" UUID,
    "voucherId" UUID,
    "journalEntryId" UUID,
    "recordedById" UUID NOT NULL,
    "approvedById" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PettyCashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseClaim" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "claimNo" TEXT NOT NULL,
    "employeeId" UUID NOT NULL,
    "claimDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "approvedAmount" DECIMAL(18,2),
    "currencyCode" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "purpose" TEXT NOT NULL,
    "projectId" UUID,
    "grantId" UUID,
    "travelStartDate" TIMESTAMP(3),
    "travelEndDate" TIMESTAMP(3),
    "status" "ExpenseClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "supervisorId" UUID,
    "supervisorApprovedAt" TIMESTAMP(3),
    "financeApprovedById" UUID,
    "financeApprovedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "voucherId" UUID,
    "journalEntryId" UUID,
    "advanceId" UUID,
    "advanceDeducted" DECIMAL(18,2),
    "netPayable" DECIMAL(18,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseClaimItem" (
    "id" UUID NOT NULL,
    "claimId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "approvedAmount" DECIMAL(18,2),
    "receiptPath" TEXT,
    "hasReceipt" BOOLEAN NOT NULL DEFAULT false,
    "noReceiptReason" TEXT,
    "accountId" UUID,
    "projectId" UUID,
    "budgetLineId" UUID,
    "tdsRate" DECIMAL(5,2),
    "tdsAmount" DECIMAL(18,2),
    "vdsRate" DECIMAL(5,2),
    "vdsAmount" DECIMAL(18,2),
    "location" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExpenseClaimItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAdvance" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "advanceNo" TEXT NOT NULL,
    "employeeId" UUID NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT NOT NULL,
    "advanceType" "AdvanceType" NOT NULL DEFAULT 'TRAVEL',
    "estimatedAmount" DECIMAL(18,2) NOT NULL,
    "approvedAmount" DECIMAL(18,2),
    "projectId" UUID,
    "grantId" UUID,
    "travelStartDate" TIMESTAMP(3),
    "travelEndDate" TIMESTAMP(3),
    "expectedSettlementDate" TIMESTAMP(3),
    "disbursedAmount" DECIMAL(18,2),
    "disbursedAt" TIMESTAMP(3),
    "disbursementMethod" TEXT,
    "bankAccountId" UUID,
    "disbursementVoucherId" UUID,
    "disbursementJournalId" UUID,
    "settledAmount" DECIMAL(18,2),
    "refundAmount" DECIMAL(18,2),
    "additionalPaid" DECIMAL(18,2),
    "settledAt" TIMESTAMP(3),
    "status" "AdvanceStatus" NOT NULL DEFAULT 'REQUESTED',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerDiemRate" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "locationType" TEXT NOT NULL DEFAULT 'DISTRICT',
    "donorId" UUID,
    "fullDayRate" DECIMAL(18,2) NOT NULL,
    "halfDayRate" DECIMAL(18,2),
    "overnightRate" DECIMAL(18,2),
    "mealsOnlyRate" DECIMAL(18,2),
    "currencyCode" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerDiemRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "glAccountId" UUID,
    "budgetCategory" TEXT,
    "maxAmountPerItem" DECIMAL(18,2),
    "requiresReceipt" BOOLEAN NOT NULL DEFAULT true,
    "tdsApplicable" BOOLEAN NOT NULL DEFAULT false,
    "defaultTdsRate" DECIMAL(5,2),
    "vdsApplicable" BOOLEAN NOT NULL DEFAULT false,
    "defaultVdsRate" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GratuityPolicy" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "vestingPeriodMonths" INTEGER NOT NULL DEFAULT 60,
    "minServiceMonths" INTEGER NOT NULL DEFAULT 0,
    "formulaType" TEXT NOT NULL DEFAULT 'MONTHS_PER_YEAR',
    "ratePerYear" DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    "calculationBase" TEXT NOT NULL DEFAULT 'LAST_BASIC',
    "rateBands" JSONB,
    "accrualFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "fundBankAccountId" UUID,
    "maintainFund" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GratuityPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GratuityLedger" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "policyId" UUID NOT NULL,
    "totalAccrued" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "serviceStartDate" TIMESTAMP(3) NOT NULL,
    "lastAccrualDate" TIMESTAMP(3),
    "isVested" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GratuityLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GratuityAccrual" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "ledgerId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "accrualMonth" INTEGER NOT NULL,
    "accrualYear" INTEGER NOT NULL,
    "basicSalary" DECIMAL(18,2) NOT NULL,
    "accrualAmount" DECIMAL(18,2) NOT NULL,
    "serviceMonths" INTEGER NOT NULL,
    "projectAllocations" JSONB,
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GratuityAccrual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GratuityPayment" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "paymentNo" TEXT NOT NULL,
    "ledgerId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "paymentType" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "calculationBase" DECIMAL(18,2) NOT NULL,
    "serviceYears" DECIMAL(5,2) NOT NULL,
    "serviceDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "referenceNo" TEXT,
    "offboardingId" UUID,
    "journalEntryId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GratuityPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GratuityFund" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "bankAccountId" UUID,
    "currentBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "fdrDetails" JSONB,
    "totalFdr" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GratuityFund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GratuityFundTransaction" (
    "id" UUID NOT NULL,
    "fundId" UUID NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "referenceNo" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GratuityFundTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "headId" UUID,
    "parentId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designation" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "level" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "employeeNo" TEXT NOT NULL,
    "userId" UUID,
    "fullName" TEXT NOT NULL,
    "localizedName" JSONB,
    "fatherName" TEXT,
    "motherName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "maritalStatus" TEXT,
    "nidNumber" TEXT,
    "passport" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "emergencyContact" TEXT,
    "presentAddress" TEXT,
    "permanentAddress" TEXT,
    "photo" TEXT,
    "spouseName" TEXT,
    "numberOfDependents" INTEGER,
    "nationality" TEXT DEFAULT 'Bangladeshi',
    "religion" TEXT,
    "bloodGroup" TEXT,
    "birthPlace" TEXT,
    "disability" TEXT,
    "departmentId" UUID NOT NULL,
    "designationId" UUID NOT NULL,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "confirmationDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "reportingToId" UUID,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "dutyStation" TEXT,
    "probationEndDate" TIMESTAMP(3),
    "gradeLevel" TEXT,
    "costCenter" TEXT,
    "salaryGradeId" UUID,
    "salaryStepNo" INTEGER,
    "salaryStructureId" UUID,
    "workingHoursPerWeek" DECIMAL(4,1) DEFAULT 40,
    "noticePeriodDays" INTEGER DEFAULT 30,
    "isExpatriate" BOOLEAN NOT NULL DEFAULT false,
    "shiftSchedule" TEXT,
    "basicSalary" DECIMAL(18,2),
    "bankAccountNo" TEXT,
    "bankName" TEXT,
    "tinNumber" TEXT,
    "bankBranch" TEXT,
    "bankRoutingNo" TEXT,
    "mobileBankingProvider" TEXT,
    "mobileBankingNumber" TEXT,
    "paymentMethod" TEXT DEFAULT 'BANK_TRANSFER',
    "taxCircle" TEXT,
    "taxZone" TEXT,
    "houseRentAllowance" DECIMAL(18,2),
    "medicalAllowance" DECIMAL(18,2),
    "transportAllowance" DECIMAL(18,2),
    "otherAllowances" JSONB,
    "grossSalary" DECIMAL(18,2),
    "payFrequency" TEXT DEFAULT 'MONTHLY',
    "ngoabNotified" BOOLEAN NOT NULL DEFAULT false,
    "fd4ReferenceNo" TEXT,
    "fd4SubmissionDate" TIMESTAMP(3),
    "fd4ApprovalStatus" TEXT,
    "codeOfConductSigned" BOOLEAN NOT NULL DEFAULT false,
    "codeOfConductDate" TIMESTAMP(3),
    "pseaDeclarationSigned" BOOLEAN NOT NULL DEFAULT false,
    "safeguardingTrainingDate" TIMESTAMP(3),
    "safeguardingTrainingExpiry" TIMESTAMP(3),
    "backgroundCheckStatus" TEXT,
    "backgroundCheckDate" TIMESTAMP(3),
    "mdsCheckCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "convertedFromApplicationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDocument" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentNumber" TEXT,
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "issuingAuthority" TEXT,
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "verificationStatus" TEXT DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeEmergencyContact" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "contactName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeEmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeEducation" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "grade" TEXT,
    "country" TEXT DEFAULT 'Bangladesh',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeWorkHistory" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "employer" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "department" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "reasonForLeaving" TEXT,
    "responsibilities" TEXT,
    "location" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeWorkHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDependent" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "nidNumber" TEXT,
    "occupation" TEXT,
    "isNominee" BOOLEAN NOT NULL DEFAULT false,
    "nomineePercentage" DECIMAL(5,2),
    "nomineeFor" TEXT,
    "isInsuranceBeneficiary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDependent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSkill" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "skillName" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL,
    "yearsOfExp" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLanguage" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "language" TEXT NOT NULL,
    "readLevel" TEXT,
    "writeLevel" TEXT,
    "speakLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeCertification" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "issuingOrg" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "certificateNo" TEXT,
    "filePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProjectAllocation" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EmployeeProjectAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingChecklist" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'HR',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
    "documentType" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "checklistId" UUID NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedById" UUID,
    "notes" TEXT,
    "documentId" UUID,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "otHours" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "daysPerYear" INTEGER NOT NULL,
    "isCarryForward" BOOLEAN NOT NULL DEFAULT false,
    "maxCarryForward" INTEGER,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveBalance" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "leaveTypeId" UUID NOT NULL,
    "fiscalYearId" UUID,
    "entitled" INTEGER NOT NULL,
    "taken" INTEGER NOT NULL DEFAULT 0,
    "remaining" INTEGER NOT NULL,
    "carriedForward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApplication" (
    "id" UUID NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "employeeId" UUID NOT NULL,
    "leaveTypeId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT,
    "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "halfDaySession" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT true,
    "isPercentage" BOOLEAN NOT NULL DEFAULT false,
    "percentageOf" TEXT,
    "defaultValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "runNo" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalGross" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "processedById" UUID,
    "processedAt" TIMESTAMP(3),
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "journalEntryId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntry" (
    "id" UUID NOT NULL,
    "payrollRunId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "basicSalary" DECIMAL(18,2) NOT NULL,
    "houseRent" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "medicalAllowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "transportAllowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherEarnings" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grossSalary" DECIMAL(18,2) NOT NULL,
    "pfDeduction" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "tdsDeduction" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "absentDeduction" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(18,2) NOT NULL,
    "workingDays" INTEGER NOT NULL,
    "presentDays" INTEGER NOT NULL,
    "absentDays" INTEGER NOT NULL DEFAULT 0,
    "otHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "otPayment" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PayrollEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceReview" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "reviewPeriod" TEXT NOT NULL,
    "reviewType" TEXT NOT NULL,
    "selfScore" DECIMAL(3,1),
    "supervisorScore" DECIMAL(3,1),
    "finalScore" DECIMAL(3,1),
    "rating" "PerformanceRating",
    "selfComments" TEXT,
    "supervisorComments" TEXT,
    "developmentPlan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reviewedById" UUID,
    "completedAt" TIMESTAMP(3),
    "okrCycleId" UUID,
    "okrScore" DECIMAL(3,2),
    "competencyScore" DECIMAL(3,2),
    "okrWeight" DECIMAL(3,2) NOT NULL DEFAULT 0.4,
    "competencyWeight" DECIMAL(3,2) NOT NULL DEFAULT 0.3,
    "supervisorWeight" DECIMAL(3,2) NOT NULL DEFAULT 0.3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" UUID NOT NULL,
    "trainingNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "TrainingType" NOT NULL,
    "facilitator" TEXT,
    "venue" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "durationHours" INTEGER,
    "budget" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "actualCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "TrainingStatus" NOT NULL DEFAULT 'PLANNED',
    "description" TEXT,
    "projectId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingParticipant" (
    "id" UUID NOT NULL,
    "trainingId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "score" DECIMAL(5,2),
    "feedback" TEXT,

    CONSTRAINT "TrainingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "postingNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "departmentId" UUID NOT NULL,
    "designationId" UUID,
    "hiringManagerId" UUID,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "location" TEXT NOT NULL,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "vacancies" INTEGER NOT NULL DEFAULT 1,
    "salaryMin" DECIMAL(18,2),
    "salaryMax" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "showSalary" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "responsibilities" TEXT NOT NULL,
    "qualifications" TEXT NOT NULL,
    "preferredSkills" TEXT,
    "benefits" TEXT,
    "minEducation" TEXT,
    "minExperience" INTEGER,
    "requiredSkills" JSONB,
    "requiredLanguages" JSONB,
    "requiredCertifications" JSONB,
    "scoreWeightEducation" INTEGER NOT NULL DEFAULT 25,
    "scoreWeightExperience" INTEGER NOT NULL DEFAULT 30,
    "scoreWeightSkills" INTEGER NOT NULL DEFAULT 20,
    "scoreWeightLanguages" INTEGER NOT NULL DEFAULT 15,
    "scoreWeightCertifications" INTEGER NOT NULL DEFAULT 10,
    "projectId" UUID,
    "grantId" UUID,
    "publishedAt" TIMESTAMP(3),
    "applicationDeadline" TIMESTAMP(3) NOT NULL,
    "expectedStartDate" TIMESTAMP(3),
    "status" "JobPostingStatus" NOT NULL DEFAULT 'DRAFT',
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "allowInternalApplicants" BOOLEAN NOT NULL DEFAULT true,
    "requireCoverLetter" BOOLEAN NOT NULL DEFAULT false,
    "customQuestions" JSONB,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" UUID NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "jobPostingId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "applicantPhone" TEXT,
    "applicantAddress" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "employeeId" UUID,
    "cvFilePath" TEXT,
    "coverLetterPath" TEXT,
    "additionalDocs" JSONB,
    "parsedEducation" JSONB,
    "parsedExperience" JSONB,
    "parsedSkills" JSONB,
    "parsedLanguages" JSONB,
    "parsedCertifications" JSONB,
    "totalExperienceYears" DECIMAL(4,1),
    "customResponses" JSONB,
    "autoScore" DECIMAL(5,2),
    "manualScore" DECIMAL(5,2),
    "finalScore" DECIMAL(5,2),
    "scoreBreakdown" JSONB,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "rejectionReason" TEXT,
    "notes" TEXT,
    "offeredSalary" DECIMAL(18,2),
    "offerLetterPath" TEXT,
    "offerAcceptedAt" TIMESTAMP(3),
    "offerDeclinedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "interviewType" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "location" TEXT,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "meetingLink" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "interviewerNotes" TEXT,
    "overallRating" DECIMAL(3,1),
    "recommendation" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewPanel" (
    "id" UUID NOT NULL,
    "interviewId" UUID NOT NULL,
    "interviewerId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "score" DECIMAL(3,1),
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "InterviewPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEvaluation" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "evaluatorId" UUID NOT NULL,
    "criteria" TEXT NOT NULL,
    "score" DECIMAL(3,1) NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeContract" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "contractNo" TEXT NOT NULL,
    "employeeId" UUID NOT NULL,
    "contractType" "EmploymentType" NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "probationEndDate" TIMESTAMP(3),
    "basicSalary" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "salaryComponents" JSONB,
    "projectId" UUID,
    "grantId" UUID,
    "costCenter" TEXT,
    "contractFilePath" TEXT,
    "amendments" JSONB,
    "isRenewable" BOOLEAN NOT NULL DEFAULT true,
    "renewalNoticeDays" INTEGER NOT NULL DEFAULT 30,
    "previousContractId" UUID,
    "terminatedAt" TIMESTAMP(3),
    "terminationReason" TEXT,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "status" "EmployeeContractStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offboarding" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "offboardingNo" TEXT NOT NULL,
    "employeeId" UUID NOT NULL,
    "separationType" "SeparationType" NOT NULL,
    "initiatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastWorkingDay" TIMESTAMP(3) NOT NULL,
    "noticeDate" TIMESTAMP(3),
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "exitInterviewDate" TIMESTAMP(3),
    "exitInterviewerId" UUID,
    "exitInterviewNotes" TEXT,
    "exitReason" TEXT,
    "wouldRehire" BOOLEAN,
    "unusedLeaveDays" DECIMAL(5,1),
    "leaveEncashment" DECIMAL(18,2),
    "gratuity" DECIMAL(18,2),
    "otherPayments" DECIMAL(18,2),
    "deductions" DECIMAL(18,2),
    "finalSettlement" DECIMAL(18,2),
    "settlementPaidAt" TIMESTAMP(3),
    "experienceCertPath" TEXT,
    "status" "OffboardingStatus" NOT NULL DEFAULT 'INITIATED',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffboardingTask" (
    "id" UUID NOT NULL,
    "offboardingId" UUID NOT NULL,
    "taskName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "assignedToId" UUID,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedById" UUID,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OffboardingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HolidayCalendar" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HolidayCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" UUID NOT NULL,
    "calendarId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "localizedName" JSONB,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "type" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeGrievance" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "grievanceNo" TEXT NOT NULL,
    "employeeId" UUID,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidencePaths" JSONB,
    "assignedToId" UUID,
    "investigationNotes" TEXT,
    "resolution" TEXT,
    "resolutionDate" TIMESTAMP(3),
    "escalatedToId" UUID,
    "escalationReason" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" "EmployeeGrievanceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeGrievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplinaryCase" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "caseNo" TEXT NOT NULL,
    "employeeId" UUID NOT NULL,
    "action" "DisciplinaryAction" NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidencePaths" JSONB,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "actionDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "suspensionStart" TIMESTAMP(3),
    "suspensionEnd" TIMESTAMP(3),
    "withPay" BOOLEAN NOT NULL DEFAULT true,
    "appealFiled" BOOLEAN NOT NULL DEFAULT false,
    "appealDate" TIMESTAMP(3),
    "appealOutcome" TEXT,
    "issuedById" UUID NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisciplinaryCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryGrade" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT,
    "minSalary" DECIMAL(18,2) NOT NULL,
    "midSalary" DECIMAL(18,2) NOT NULL,
    "maxSalary" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryGradeStep" (
    "id" UUID NOT NULL,
    "gradeId" UUID NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "basicSalary" DECIMAL(18,2) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryGradeStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "gradeId" UUID,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructureLine" (
    "id" UUID NOT NULL,
    "structureId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "calculationType" "SalaryComponentCalculationType" NOT NULL,
    "amount" DECIMAL(18,2),
    "percentage" DECIMAL(5,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryStructureLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryRevisionHistory" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "revisionDate" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "revisionType" "SalaryRevisionType" NOT NULL,
    "previousGradeId" UUID,
    "newGradeId" UUID,
    "previousStepNo" INTEGER,
    "newStepNo" INTEGER,
    "previousBasic" DECIMAL(18,2),
    "newBasic" DECIMAL(18,2) NOT NULL,
    "previousGross" DECIMAL(18,2),
    "newGross" DECIMAL(18,2) NOT NULL,
    "reason" TEXT,
    "remarks" TEXT,
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryRevisionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntryLine" (
    "id" UUID NOT NULL,
    "payrollEntryId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "componentName" TEXT NOT NULL,
    "componentCode" TEXT NOT NULL,
    "lineType" TEXT NOT NULL,
    "calculationType" "SalaryComponentCalculationType" NOT NULL,
    "percentage" DECIMAL(5,2),
    "amount" DECIMAL(18,2) NOT NULL,
    "ytdAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollEntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipTemplate" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "headerText" TEXT,
    "footerText" TEXT,
    "logoPath" TEXT,
    "showYTD" BOOLEAN NOT NULL DEFAULT true,
    "showEmployerContributions" BOOLEAN NOT NULL DEFAULT false,
    "showAttendanceSummary" BOOLEAN NOT NULL DEFAULT true,
    "showNetPayInWords" BOOLEAN NOT NULL DEFAULT true,
    "paperSize" TEXT NOT NULL DEFAULT 'A4',
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayslipTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipDistribution" (
    "id" UUID NOT NULL,
    "payrollEntryId" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "sentTo" TEXT,
    "sentAt" TIMESTAMP(3),
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayslipDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamCoverageRule" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "departmentId" UUID,
    "minimumPresencePercent" DECIMAL(5,2) NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamCoverageRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OKRCycle" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cycleType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "OKRCycleStatus" NOT NULL DEFAULT 'PLANNING',
    "checkInFrequency" TEXT NOT NULL DEFAULT 'BIWEEKLY',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OKRCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OKRObjective" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "cycleId" UUID NOT NULL,
    "ownerType" "OKROwnerType" NOT NULL,
    "ownerId" UUID NOT NULL,
    "parentObjectiveId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(3,2) NOT NULL DEFAULT 1,
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "score" DECIMAL(3,2),
    "status" "OKRObjectiveStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OKRObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OKRKeyResult" (
    "id" UUID NOT NULL,
    "objectiveId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resultType" "KeyResultType" NOT NULL,
    "startValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "targetValue" DECIMAL(18,2) NOT NULL,
    "currentValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "unit" TEXT,
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "score" DECIMAL(3,2),
    "dueDate" TIMESTAMP(3),
    "status" "OKRObjectiveStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OKRKeyResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OKRCheckIn" (
    "id" UUID NOT NULL,
    "keyResultId" UUID NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousValue" DECIMAL(18,2) NOT NULL,
    "newValue" DECIMAL(18,2) NOT NULL,
    "progress" DECIMAL(5,2) NOT NULL,
    "note" TEXT,
    "blockers" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OKRCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OKRScore" (
    "id" UUID NOT NULL,
    "objectiveId" UUID NOT NULL,
    "scorerId" UUID NOT NULL,
    "scoreType" "OKRScoreType" NOT NULL,
    "score" DECIMAL(3,2) NOT NULL,
    "comments" TEXT,
    "scoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OKRScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollBudgetAllocation" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "payrollRunId" UUID NOT NULL,
    "payrollEntryId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "budgetId" UUID,
    "budgetLineId" UUID,
    "allocationPct" DECIMAL(5,2) NOT NULL,
    "grossAmount" DECIMAL(18,2) NOT NULL,
    "netAmount" DECIMAL(18,2) NOT NULL,
    "fringeAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalCharge" DECIMAL(18,2) NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollBudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER,
    "managerId" UUID,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" UUID NOT NULL,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT NOT NULL,
    "warehouseId" UUID NOT NULL,
    "stockInHand" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reorderLevel" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "donorFunded" BOOLEAN NOT NULL DEFAULT false,
    "donorId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "reference" TEXT,
    "referenceId" UUID,
    "notes" TEXT,
    "transactedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" UUID NOT NULL,
    "grnNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "poId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "receivedById" UUID NOT NULL,
    "status" "GRNStatus" NOT NULL DEFAULT 'PENDING_INSPECTION',
    "inspectionNotes" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptLine" (
    "id" UUID NOT NULL,
    "grnId" UUID NOT NULL,
    "poLineId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantityOrdered" DECIMAL(10,2) NOT NULL,
    "quantityReceived" DECIMAL(10,2) NOT NULL,
    "quantityAccepted" DECIMAL(10,2) NOT NULL,
    "quantityRejected" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rejectionReason" TEXT,

    CONSTRAINT "GoodsReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "managerId" UUID,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Samity" (
    "id" UUID NOT NULL,
    "samityNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchId" UUID NOT NULL,
    "formationDate" TIMESTAMP(3) NOT NULL,
    "meetingDay" TEXT NOT NULL,
    "meetingTime" TEXT,
    "fieldOfficerId" UUID,
    "totalMembers" INTEGER NOT NULL DEFAULT 0,
    "status" "SamityStatus" NOT NULL DEFAULT 'NEW',
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Samity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MFIMember" (
    "id" UUID NOT NULL,
    "memberNo" TEXT NOT NULL,
    "beneficiaryId" UUID NOT NULL,
    "samityId" UUID NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MFIMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanProduct" (
    "id" UUID NOT NULL,
    "productCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "LoanCategory" NOT NULL,
    "minAmount" DECIMAL(18,2) NOT NULL,
    "maxAmount" DECIMAL(18,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "interestMethod" "InterestMethod" NOT NULL DEFAULT 'DECLINING_BALANCE',
    "maxDurationMonths" INTEGER NOT NULL,
    "repaymentFrequency" "RepaymentFrequency" NOT NULL DEFAULT 'WEEKLY',
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "serviceCharge" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "requiresSavings" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanApplication" (
    "id" UUID NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "memberId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "amountRequested" DECIMAL(18,2) NOT NULL,
    "purpose" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "fieldOfficerId" UUID,
    "status" "LoanAppStatus" NOT NULL DEFAULT 'SUBMITTED',
    "approvedAmount" DECIMAL(18,2),
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanAccount" (
    "id" UUID NOT NULL,
    "accountNo" TEXT NOT NULL,
    "memberId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "principalAmount" DECIMAL(18,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "interestMethod" "InterestMethod" NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "installmentAmount" DECIMAL(18,2) NOT NULL,
    "totalRepayable" DECIMAL(18,2) NOT NULL,
    "totalPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(18,2) NOT NULL,
    "overdueAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "daysOverdue" INTEGER NOT NULL DEFAULT 0,
    "classification" "LoanClassification" NOT NULL DEFAULT 'REGULAR',
    "disbursedAt" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "status" "LoanAccountStatus" NOT NULL DEFAULT 'PENDING_DISBURSEMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanDisbursement" (
    "id" UUID NOT NULL,
    "disbursementNo" TEXT NOT NULL,
    "loanAccountId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "mode" "DisbursementMode" NOT NULL,
    "branchId" UUID,
    "disbursedById" UUID NOT NULL,
    "status" "DisbursementStatus" NOT NULL DEFAULT 'SCHEDULED',
    "reference" TEXT,
    "journalEntryId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanDisbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRepayment" (
    "id" UUID NOT NULL,
    "repaymentNo" TEXT NOT NULL,
    "loanAccountId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "principalAmount" DECIMAL(18,2) NOT NULL,
    "interestAmount" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "penaltyAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "collectedById" UUID NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "isOnTime" BOOLEAN NOT NULL DEFAULT true,
    "journalEntryId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionSheet" (
    "id" UUID NOT NULL,
    "collectionNo" TEXT NOT NULL,
    "samityId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "membersPresent" INTEGER NOT NULL,
    "totalCollectible" DECIMAL(18,2) NOT NULL,
    "amountCollected" DECIMAL(18,2) NOT NULL,
    "shortfall" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "onTimePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "collectedById" UUID NOT NULL,
    "status" "CollectionStatus" NOT NULL DEFAULT 'COMPLETED',
    "depositedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsAccount" (
    "id" UUID NOT NULL,
    "accountNo" TEXT NOT NULL,
    "memberId" UUID NOT NULL,
    "type" "SavingsType" NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalDeposited" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "interestEarned" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "interestRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "monthlyDeposit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsTransaction" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "reference" TEXT,
    "transactedById" UUID NOT NULL,
    "journalEntryId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "customDomain" TEXT,
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "registrationNo" TEXT,
    "ngoabLicenseNo" TEXT,
    "mraLicenseNo" TEXT,
    "vatRegistrationNo" TEXT,
    "tin" TEXT,
    "address" TEXT,
    "district" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "baseCurrency" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 7,
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "numberFormat" TEXT NOT NULL DEFAULT 'BD',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "supportedLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "localizedName" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "storageUsedBytes" BIGINT NOT NULL DEFAULT 0,
    "storageWarning80Sent" BOOLEAN NOT NULL DEFAULT false,
    "storageWarning90Sent" BOOLEAN NOT NULL DEFAULT false,
    "bandwidthUsedBytes" BIGINT NOT NULL DEFAULT 0,
    "bandwidthPeriodStart" TIMESTAMP(3),
    "bandwidthPeriodEnd" TIMESTAMP(3),
    "bandwidthWarning80Sent" BOOLEAN NOT NULL DEFAULT false,
    "bandwidthWarning90Sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalYear" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalPeriod" (
    "id" UUID NOT NULL,
    "fiscalYearId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "id" UUID NOT NULL,
    "code" "CurrencyCode" NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" UUID NOT NULL,
    "currencyId" UUID NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberSequence" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "separator" TEXT NOT NULL DEFAULT '-',
    "includeYear" BOOLEAN NOT NULL DEFAULT true,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "padLength" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "vendorNo" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "category" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "tin" TEXT,
    "tradeLicense" TEXT,
    "rating" DECIMAL(3,1) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRating" (
    "id" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "poId" UUID,
    "quality" INTEGER NOT NULL,
    "delivery" INTEGER NOT NULL,
    "pricing" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "overall" DECIMAL(3,1) NOT NULL,
    "comments" TEXT,
    "ratedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisition" (
    "id" UUID NOT NULL,
    "prNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "requestedById" UUID NOT NULL,
    "departmentId" UUID,
    "projectId" UUID,
    "priority" "PRPriority" NOT NULL DEFAULT 'NORMAL',
    "totalEstimate" DECIMAL(18,2) NOT NULL,
    "justification" TEXT,
    "status" "PRStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "linkedPOId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PurchaseRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisitionLine" (
    "id" UUID NOT NULL,
    "prId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "specification" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "estimatedPrice" DECIMAL(18,2) NOT NULL,
    "totalEstimate" DECIMAL(18,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseRequisitionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" UUID NOT NULL,
    "poNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vendorId" UUID NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "paymentTerms" TEXT,
    "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderLine" (
    "id" UUID NOT NULL,
    "poId" UUID NOT NULL,
    "prLineId" UUID,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,
    "receivedQty" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tender" (
    "id" UUID NOT NULL,
    "tenderNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "estimatedValue" DECIMAL(18,2) NOT NULL,
    "publicationDate" TIMESTAMP(3) NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "status" "TenderStatus" NOT NULL DEFAULT 'DRAFT',
    "awardedToId" UUID,
    "awardDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderBid" (
    "id" UUID NOT NULL,
    "tenderId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "bidAmount" DECIMAL(18,2) NOT NULL,
    "technicalScore" DECIMAL(5,2),
    "financialScore" DECIMAL(5,2),
    "combinedScore" DECIMAL(5,2),
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenderBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" UUID NOT NULL,
    "contractNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vendorId" UUID NOT NULL,
    "type" "ContractType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "terms" TEXT,
    "renewalDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "projectNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectType" "ProjectType" NOT NULL DEFAULT 'DEVELOPMENT',
    "sector" "ProjectSector" NOT NULL DEFAULT 'OTHER',
    "donorId" UUID,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalBudget" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "amountSpent" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "country" TEXT,
    "region" TEXT,
    "location" TEXT,
    "implementingPartner" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PIPELINE',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "managerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTeamMember" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "role" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "allocation" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProjectTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "activityNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" UUID NOT NULL,
    "responsibleId" UUID,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "actualCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "ActivityStatus" NOT NULL DEFAULT 'PLANNED',
    "parentId" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" UUID NOT NULL,
    "milestoneNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "projectId" UUID NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "deliverable" TEXT,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'ON_TRACK',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogFrameEntry" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "level" "LogFrameLevel" NOT NULL,
    "narrative" TEXT NOT NULL,
    "indicators" TEXT,
    "meansOfVerification" TEXT,
    "assumptions" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogFrameEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectIndicator" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "IndicatorType" NOT NULL DEFAULT 'QUANTITATIVE',
    "unit" TEXT,
    "baselineValue" DECIMAL(18,2),
    "baselineDate" TIMESTAMP(3),
    "targetValue" DECIMAL(18,2),
    "currentValue" DECIMAL(18,2),
    "frequency" "IndicatorFrequency" NOT NULL DEFAULT 'QUARTERLY',
    "dataSource" TEXT,
    "responsible" TEXT,
    "disaggregation" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRisk" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "RiskCategory" NOT NULL DEFAULT 'OPERATIONAL',
    "likelihood" "RiskLikelihood" NOT NULL DEFAULT 'MEDIUM',
    "impact" "RiskImpact" NOT NULL DEFAULT 'MODERATE',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "mitigation" TEXT,
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCloseout" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "startDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCloseout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCloseoutItem" (
    "id" UUID NOT NULL,
    "closeoutId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CloseoutItemStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "assigneeId" UUID,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectCloseoutItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFPolicy" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "employeeContribRate" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "employerContribRate" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "contributionBase" TEXT NOT NULL DEFAULT 'BASIC',
    "eligibilityMonths" INTEGER NOT NULL DEFAULT 0,
    "eligibilityTypes" JSONB,
    "vestingSchedule" JSONB NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL DEFAULT 9.00,
    "interestCalcMethod" TEXT NOT NULL DEFAULT 'MONTHLY_BALANCE',
    "interestPostingFreq" TEXT NOT NULL DEFAULT 'ANNUAL',
    "allowPartialWithdraw" BOOLEAN NOT NULL DEFAULT true,
    "maxWithdrawPercent" DECIMAL(5,2),
    "withdrawalReasons" JSONB,
    "minServiceForWithdraw" INTEGER NOT NULL DEFAULT 12,
    "allowLoan" BOOLEAN NOT NULL DEFAULT true,
    "maxLoanPercent" DECIMAL(5,2) DEFAULT 80.00,
    "loanInterestRate" DECIMAL(5,2) DEFAULT 5.00,
    "maxLoanRepayMonths" INTEGER NOT NULL DEFAULT 36,
    "maxActiveLoans" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PFPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFTrust" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNo" TEXT,
    "registrationDate" TIMESTAMP(3),
    "bankAccountId" UUID,
    "currentBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PFTrust_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFTrustee" (
    "id" UUID NOT NULL,
    "trustId" UUID NOT NULL,
    "employeeId" UUID,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "appointedDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PFTrustee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFEnrollment" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "policyId" UUID NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "employeeRate" DECIMAL(5,2) NOT NULL,
    "employerRate" DECIMAL(5,2) NOT NULL,
    "totalEmployeeContrib" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalEmployerContrib" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalInterest" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalWithdrawals" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalLoanOutstanding" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PFEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFNominee" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "nidNumber" TEXT,
    "phone" TEXT,
    "address" TEXT,

    CONSTRAINT "PFNominee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFContribution" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "basicSalary" DECIMAL(18,2) NOT NULL,
    "employeeAmount" DECIMAL(18,2) NOT NULL,
    "employerAmount" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "projectAllocations" JSONB,
    "payrollRunId" UUID,
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PFContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFInterestPosting" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "openingBalance" DECIMAL(18,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "interestAmount" DECIMAL(18,2) NOT NULL,
    "closingBalance" DECIMAL(18,2) NOT NULL,
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PFInterestPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFWithdrawal" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "withdrawalNo" TEXT NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "supportingDocs" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PFWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFLoan" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "loanNo" TEXT NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "principalAmount" DECIMAL(18,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "repaymentMonths" INTEGER NOT NULL,
    "monthlyInstallment" DECIMAL(18,2) NOT NULL,
    "totalRepayable" DECIMAL(18,2) NOT NULL,
    "outstandingBalance" DECIMAL(18,2) NOT NULL,
    "disbursedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PFLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFLoanRepayment" (
    "id" UUID NOT NULL,
    "loanId" UUID NOT NULL,
    "installmentNo" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "principalPortion" DECIMAL(18,2) NOT NULL,
    "interestPortion" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "payrollRunId" UUID,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "PFLoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFSettlement" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "settlementNo" TEXT NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "employeeContrib" DECIMAL(18,2) NOT NULL,
    "employerContrib" DECIMAL(18,2) NOT NULL,
    "interestEarned" DECIMAL(18,2) NOT NULL,
    "vestedPercent" DECIMAL(5,2) NOT NULL,
    "vestedEmployer" DECIMAL(18,2) NOT NULL,
    "forfeited" DECIMAL(18,2) NOT NULL,
    "loanDeduction" DECIMAL(18,2) NOT NULL,
    "netPayable" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CALCULATED',
    "offboardingId" UUID,
    "approvedById" UUID,
    "paidAt" TIMESTAMP(3),
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PFSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFInvestment" (
    "id" UUID NOT NULL,
    "trustId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "accountNo" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "maturityDate" TIMESTAMP(3),
    "currentValue" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "PFInvestment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFInvestmentIncome" (
    "id" UUID NOT NULL,
    "investmentId" UUID NOT NULL,
    "incomeType" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PFInvestmentIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PFTrustTransaction" (
    "id" UUID NOT NULL,
    "trustId" UUID NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "referenceNo" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "journalEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PFTrustTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperAdminAuditLog" (
    "id" UUID NOT NULL,
    "superAdminId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" UUID,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpersonationSession" (
    "id" UUID NOT NULL,
    "superAdminId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "targetRole" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpersonationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaSetting" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'cloudflare_r2',
    "bucketName" TEXT NOT NULL,
    "region" TEXT,
    "endpoint" TEXT NOT NULL,
    "accessKeyId" TEXT NOT NULL,
    "secretAccessKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "maxFileSizeMb" INTEGER NOT NULL DEFAULT 50,
    "allowedMimeTypes" TEXT NOT NULL DEFAULT 'image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "priceQuarterly" DECIMAL(10,2),
    "priceYearly" DECIMAL(10,2),
    "maxUsers" INTEGER NOT NULL,
    "maxProjects" INTEGER NOT NULL,
    "maxBeneficiaries" INTEGER NOT NULL,
    "storageGb" INTEGER NOT NULL DEFAULT 5,
    "bandwidthGb" INTEGER NOT NULL DEFAULT 50,
    "trialDays" INTEGER NOT NULL DEFAULT 14,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformFeature" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT,
    "isQuantifiable" BOOLEAN NOT NULL DEFAULT false,
    "defaultLimit" INTEGER,
    "isBeta" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFeature" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "limit" INTEGER,
    "config" JSONB,

    CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSubscription" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "graceStartDate" TIMESTAMP(3),
    "graceDays" INTEGER NOT NULL DEFAULT 7,
    "pausedAt" TIMESTAMP(3),
    "pausedUntil" TIMESTAMP(3),
    "totalPauseDaysUsed" INTEGER NOT NULL DEFAULT 0,
    "scheduledPlanId" UUID,
    "scheduledChangeDate" TIMESTAMP(3),
    "scheduledChangeType" TEXT,
    "lastPaymentDate" TIMESTAMP(3),
    "nextPaymentDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantInvoice" (
    "id" UUID NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
    "description" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "transactionRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "gateway" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" TEXT NOT NULL,
    "gatewayResponse" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantAuditLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID,
    "action" "AuditAction" NOT NULL,
    "module" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" UUID,
    "description" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isImpersonated" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastDeliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" UUID NOT NULL,
    "endpointId" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRetentionPolicy" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPurgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExportRequest" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "exportType" TEXT NOT NULL,
    "modules" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "filePath" TEXT,
    "fileSize" BIGINT,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalWorkflowDef" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalWorkflowDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalWorkflowStep" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "roleId" UUID NOT NULL,
    "amountMin" DECIMAL(18,2),
    "amountMax" DECIMAL(18,2),
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ApprovalWorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalInstance" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'SUBMITTED',
    "requestedById" UUID NOT NULL,
    "amount" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalAction" (
    "id" UUID NOT NULL,
    "instanceId" UUID NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" UUID NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT,
    "durationMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "initiatedBy" TEXT,
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssetCategory_organizationId_idx" ON "AssetCategory"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCategory_organizationId_code_key" ON "AssetCategory"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetNo_key" ON "Asset"("assetNo");

-- CreateIndex
CREATE INDEX "Asset_assetNo_idx" ON "Asset"("assetNo");

-- CreateIndex
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");

-- CreateIndex
CREATE INDEX "Asset_warehouseId_idx" ON "Asset"("warehouseId");

-- CreateIndex
CREATE INDEX "Asset_projectId_idx" ON "Asset"("projectId");

-- CreateIndex
CREATE INDEX "Asset_condition_idx" ON "Asset"("condition");

-- CreateIndex
CREATE INDEX "AssetDepreciation_assetId_idx" ON "AssetDepreciation"("assetId");

-- CreateIndex
CREATE INDEX "AssetDepreciation_period_idx" ON "AssetDepreciation"("period");

-- CreateIndex
CREATE UNIQUE INDEX "AssetTransfer_transferNo_key" ON "AssetTransfer"("transferNo");

-- CreateIndex
CREATE INDEX "AssetTransfer_assetId_idx" ON "AssetTransfer"("assetId");

-- CreateIndex
CREATE INDEX "AssetTransfer_status_idx" ON "AssetTransfer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssetMaintenance_maintenanceNo_key" ON "AssetMaintenance"("maintenanceNo");

-- CreateIndex
CREATE INDEX "AssetMaintenance_assetId_idx" ON "AssetMaintenance"("assetId");

-- CreateIndex
CREATE INDEX "AssetMaintenance_scheduledDate_idx" ON "AssetMaintenance"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDisposal_disposalNo_key" ON "AssetDisposal"("disposalNo");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDisposal_assetId_key" ON "AssetDisposal"("assetId");

-- CreateIndex
CREATE INDEX "AssetDisposal_assetId_idx" ON "AssetDisposal"("assetId");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_organizationId_email_key" ON "User"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Role_organizationId_idx" ON "Role"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_organizationId_name_key" ON "Role"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_module_action_resource_key" ON "Permission"("module", "action", "resource");

-- CreateIndex
CREATE INDEX "Beneficiary_organizationId_nidNumber_idx" ON "Beneficiary"("organizationId", "nidNumber");

-- CreateIndex
CREATE INDEX "Beneficiary_organizationId_idx" ON "Beneficiary"("organizationId");

-- CreateIndex
CREATE INDEX "Beneficiary_name_idx" ON "Beneficiary"("name");

-- CreateIndex
CREATE INDEX "Beneficiary_district_idx" ON "Beneficiary"("district");

-- CreateIndex
CREATE INDEX "Beneficiary_status_idx" ON "Beneficiary"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Beneficiary_organizationId_beneficiaryNo_key" ON "Beneficiary"("organizationId", "beneficiaryNo");

-- CreateIndex
CREATE UNIQUE INDEX "BeneficiaryEnrollment_enrollmentNo_key" ON "BeneficiaryEnrollment"("enrollmentNo");

-- CreateIndex
CREATE INDEX "BeneficiaryEnrollment_beneficiaryId_idx" ON "BeneficiaryEnrollment"("beneficiaryId");

-- CreateIndex
CREATE INDEX "BeneficiaryEnrollment_projectId_idx" ON "BeneficiaryEnrollment"("projectId");

-- CreateIndex
CREATE INDEX "BeneficiaryEnrollment_status_idx" ON "BeneficiaryEnrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BeneficiaryEnrollment_beneficiaryId_projectId_key" ON "BeneficiaryEnrollment"("beneficiaryId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDelivery_serviceNo_key" ON "ServiceDelivery"("serviceNo");

-- CreateIndex
CREATE INDEX "ServiceDelivery_beneficiaryId_idx" ON "ServiceDelivery"("beneficiaryId");

-- CreateIndex
CREATE INDEX "ServiceDelivery_projectId_idx" ON "ServiceDelivery"("projectId");

-- CreateIndex
CREATE INDEX "ServiceDelivery_date_idx" ON "ServiceDelivery"("date");

-- CreateIndex
CREATE INDEX "ServiceDelivery_projectId_date_idx" ON "ServiceDelivery"("projectId", "date");

-- CreateIndex
CREATE INDEX "ImpactAssessment_indicatorId_idx" ON "ImpactAssessment"("indicatorId");

-- CreateIndex
CREATE INDEX "ImpactAssessment_projectId_idx" ON "ImpactAssessment"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Grievance_grievanceNo_key" ON "Grievance"("grievanceNo");

-- CreateIndex
CREATE INDEX "Grievance_beneficiaryId_idx" ON "Grievance"("beneficiaryId");

-- CreateIndex
CREATE INDEX "Grievance_status_idx" ON "Grievance"("status");

-- CreateIndex
CREATE INDEX "Grievance_severity_idx" ON "Grievance"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_budgetCode_key" ON "Budget"("budgetCode");

-- CreateIndex
CREATE INDEX "Budget_projectId_idx" ON "Budget"("projectId");

-- CreateIndex
CREATE INDEX "Budget_grantId_idx" ON "Budget"("grantId");

-- CreateIndex
CREATE INDEX "Budget_status_idx" ON "Budget"("status");

-- CreateIndex
CREATE INDEX "Budget_budgetType_idx" ON "Budget"("budgetType");

-- CreateIndex
CREATE INDEX "Budget_fiscalYearId_idx" ON "Budget"("fiscalYearId");

-- CreateIndex
CREATE INDEX "BudgetLine_budgetId_idx" ON "BudgetLine"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetLine_accountId_idx" ON "BudgetLine"("accountId");

-- CreateIndex
CREATE INDEX "BudgetLine_category_idx" ON "BudgetLine"("category");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetRevision_revisionNo_key" ON "BudgetRevision"("revisionNo");

-- CreateIndex
CREATE INDEX "BudgetRevision_budgetId_idx" ON "BudgetRevision"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetRevision_status_idx" ON "BudgetRevision"("status");

-- CreateIndex
CREATE INDEX "BudgetRevisionLine_revisionId_idx" ON "BudgetRevisionLine"("revisionId");

-- CreateIndex
CREATE INDEX "CostAllocationEntry_ruleId_idx" ON "CostAllocationEntry"("ruleId");

-- CreateIndex
CREATE INDEX "CostAllocationEntry_projectId_idx" ON "CostAllocationEntry"("projectId");

-- CreateIndex
CREATE INDEX "Donor_organizationId_idx" ON "Donor"("organizationId");

-- CreateIndex
CREATE INDEX "Donor_type_idx" ON "Donor"("type");

-- CreateIndex
CREATE INDEX "Donor_name_idx" ON "Donor"("name");

-- CreateIndex
CREATE INDEX "DonorContact_donorId_idx" ON "DonorContact"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "Grant_grantNo_key" ON "Grant"("grantNo");

-- CreateIndex
CREATE INDEX "Grant_donorId_idx" ON "Grant"("donorId");

-- CreateIndex
CREATE INDEX "Grant_projectId_idx" ON "Grant"("projectId");

-- CreateIndex
CREATE INDEX "Grant_status_idx" ON "Grant"("status");

-- CreateIndex
CREATE INDEX "FundReceipt_organizationId_idx" ON "FundReceipt"("organizationId");

-- CreateIndex
CREATE INDEX "FundReceipt_donorId_idx" ON "FundReceipt"("donorId");

-- CreateIndex
CREATE INDEX "FundReceipt_grantId_idx" ON "FundReceipt"("grantId");

-- CreateIndex
CREATE INDEX "FundReceipt_date_idx" ON "FundReceipt"("date");

-- CreateIndex
CREATE INDEX "FundReceipt_status_idx" ON "FundReceipt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FundReceipt_organizationId_receiptNo_key" ON "FundReceipt"("organizationId", "receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "FundRequisition_requisitionNo_key" ON "FundRequisition"("requisitionNo");

-- CreateIndex
CREATE INDEX "FundRequisition_grantId_idx" ON "FundRequisition"("grantId");

-- CreateIndex
CREATE INDEX "FundRequisition_projectId_idx" ON "FundRequisition"("projectId");

-- CreateIndex
CREATE INDEX "FundRequisition_status_idx" ON "FundRequisition"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DonorReport_reportNo_key" ON "DonorReport"("reportNo");

-- CreateIndex
CREATE INDEX "DonorReport_grantId_idx" ON "DonorReport"("grantId");

-- CreateIndex
CREATE INDEX "DonorReport_dueDate_idx" ON "DonorReport"("dueDate");

-- CreateIndex
CREATE INDEX "DonorReport_status_idx" ON "DonorReport"("status");

-- CreateIndex
CREATE INDEX "Account_organizationId_idx" ON "Account"("organizationId");

-- CreateIndex
CREATE INDEX "Account_type_idx" ON "Account"("type");

-- CreateIndex
CREATE INDEX "Account_parentId_idx" ON "Account"("parentId");

-- CreateIndex
CREATE INDEX "Account_projectId_idx" ON "Account"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_organizationId_code_key" ON "Account"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_entryNo_key" ON "JournalEntry"("entryNo");

-- CreateIndex
CREATE INDEX "JournalEntry_entryNo_idx" ON "JournalEntry"("entryNo");

-- CreateIndex
CREATE INDEX "JournalEntry_date_idx" ON "JournalEntry"("date");

-- CreateIndex
CREATE INDEX "JournalEntry_status_idx" ON "JournalEntry"("status");

-- CreateIndex
CREATE INDEX "JournalEntry_projectId_idx" ON "JournalEntry"("projectId");

-- CreateIndex
CREATE INDEX "JournalEntry_grantId_idx" ON "JournalEntry"("grantId");

-- CreateIndex
CREATE INDEX "JournalEntry_fiscalYearId_idx" ON "JournalEntry"("fiscalYearId");

-- CreateIndex
CREATE INDEX "JournalEntryLine_journalEntryId_idx" ON "JournalEntryLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "JournalEntryLine_accountId_idx" ON "JournalEntryLine"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_journalEntryId_key" ON "Voucher"("journalEntryId");

-- CreateIndex
CREATE INDEX "Voucher_organizationId_idx" ON "Voucher"("organizationId");

-- CreateIndex
CREATE INDEX "Voucher_voucherNo_idx" ON "Voucher"("voucherNo");

-- CreateIndex
CREATE INDEX "Voucher_type_idx" ON "Voucher"("type");

-- CreateIndex
CREATE INDEX "Voucher_date_idx" ON "Voucher"("date");

-- CreateIndex
CREATE INDEX "Voucher_status_idx" ON "Voucher"("status");

-- CreateIndex
CREATE INDEX "Voucher_projectId_idx" ON "Voucher"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_organizationId_voucherNo_key" ON "Voucher"("organizationId", "voucherNo");

-- CreateIndex
CREATE INDEX "BankAccount_organizationId_idx" ON "BankAccount"("organizationId");

-- CreateIndex
CREATE INDEX "BankAccount_glAccountId_idx" ON "BankAccount"("glAccountId");

-- CreateIndex
CREATE INDEX "BankAccount_type_idx" ON "BankAccount"("type");

-- CreateIndex
CREATE INDEX "BankAccount_isMotherAccount_idx" ON "BankAccount"("isMotherAccount");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_organizationId_accountCode_key" ON "BankAccount"("organizationId", "accountCode");

-- CreateIndex
CREATE INDEX "BankReconciliation_bankAccountId_idx" ON "BankReconciliation"("bankAccountId");

-- CreateIndex
CREATE INDEX "BankReconciliation_periodEnd_idx" ON "BankReconciliation"("periodEnd");

-- CreateIndex
CREATE INDEX "BankReconciliationItem_reconciliationId_idx" ON "BankReconciliationItem"("reconciliationId");

-- CreateIndex
CREATE INDEX "PettyCashFund_organizationId_idx" ON "PettyCashFund"("organizationId");

-- CreateIndex
CREATE INDEX "PettyCashFund_custodianId_idx" ON "PettyCashFund"("custodianId");

-- CreateIndex
CREATE UNIQUE INDEX "PettyCashFund_organizationId_code_key" ON "PettyCashFund"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PettyCashTransaction_transactionNo_key" ON "PettyCashTransaction"("transactionNo");

-- CreateIndex
CREATE INDEX "PettyCashTransaction_fundId_idx" ON "PettyCashTransaction"("fundId");

-- CreateIndex
CREATE INDEX "PettyCashTransaction_date_idx" ON "PettyCashTransaction"("date");

-- CreateIndex
CREATE INDEX "PettyCashTransaction_projectId_idx" ON "PettyCashTransaction"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseClaim_claimNo_key" ON "ExpenseClaim"("claimNo");

-- CreateIndex
CREATE INDEX "ExpenseClaim_organizationId_idx" ON "ExpenseClaim"("organizationId");

-- CreateIndex
CREATE INDEX "ExpenseClaim_employeeId_idx" ON "ExpenseClaim"("employeeId");

-- CreateIndex
CREATE INDEX "ExpenseClaim_status_idx" ON "ExpenseClaim"("status");

-- CreateIndex
CREATE INDEX "ExpenseClaim_projectId_idx" ON "ExpenseClaim"("projectId");

-- CreateIndex
CREATE INDEX "ExpenseClaimItem_claimId_idx" ON "ExpenseClaimItem"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAdvance_advanceNo_key" ON "EmployeeAdvance"("advanceNo");

-- CreateIndex
CREATE INDEX "EmployeeAdvance_organizationId_idx" ON "EmployeeAdvance"("organizationId");

-- CreateIndex
CREATE INDEX "EmployeeAdvance_employeeId_idx" ON "EmployeeAdvance"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeAdvance_status_idx" ON "EmployeeAdvance"("status");

-- CreateIndex
CREATE INDEX "PerDiemRate_organizationId_idx" ON "PerDiemRate"("organizationId");

-- CreateIndex
CREATE INDEX "PerDiemRate_location_idx" ON "PerDiemRate"("location");

-- CreateIndex
CREATE INDEX "PerDiemRate_donorId_idx" ON "PerDiemRate"("donorId");

-- CreateIndex
CREATE INDEX "ExpenseCategory_organizationId_idx" ON "ExpenseCategory"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_organizationId_code_key" ON "ExpenseCategory"("organizationId", "code");

-- CreateIndex
CREATE INDEX "GratuityPolicy_organizationId_idx" ON "GratuityPolicy"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "GratuityPolicy_organizationId_name_key" ON "GratuityPolicy"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "GratuityLedger_employeeId_key" ON "GratuityLedger"("employeeId");

-- CreateIndex
CREATE INDEX "GratuityLedger_organizationId_idx" ON "GratuityLedger"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "GratuityLedger_organizationId_employeeId_key" ON "GratuityLedger"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "GratuityAccrual_organizationId_idx" ON "GratuityAccrual"("organizationId");

-- CreateIndex
CREATE INDEX "GratuityAccrual_employeeId_idx" ON "GratuityAccrual"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "GratuityAccrual_ledgerId_accrualMonth_accrualYear_key" ON "GratuityAccrual"("ledgerId", "accrualMonth", "accrualYear");

-- CreateIndex
CREATE UNIQUE INDEX "GratuityPayment_paymentNo_key" ON "GratuityPayment"("paymentNo");

-- CreateIndex
CREATE INDEX "GratuityPayment_organizationId_idx" ON "GratuityPayment"("organizationId");

-- CreateIndex
CREATE INDEX "GratuityPayment_employeeId_idx" ON "GratuityPayment"("employeeId");

-- CreateIndex
CREATE INDEX "GratuityFund_organizationId_idx" ON "GratuityFund"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "GratuityFund_organizationId_name_key" ON "GratuityFund"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "GratuityFundTransaction_transactionNo_key" ON "GratuityFundTransaction"("transactionNo");

-- CreateIndex
CREATE INDEX "GratuityFundTransaction_fundId_idx" ON "GratuityFundTransaction"("fundId");

-- CreateIndex
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_organizationId_name_key" ON "Department"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_organizationId_code_key" ON "Department"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Designation_title_key" ON "Designation"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_nidNumber_key" ON "Employee"("nidNumber");

-- CreateIndex
CREATE INDEX "Employee_organizationId_idx" ON "Employee"("organizationId");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX "Employee_employmentType_idx" ON "Employee"("employmentType");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_organizationId_employeeNo_key" ON "Employee"("organizationId", "employeeNo");

-- CreateIndex
CREATE INDEX "EmployeeDocument_employeeId_idx" ON "EmployeeDocument"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeDocument_type_idx" ON "EmployeeDocument"("type");

-- CreateIndex
CREATE INDEX "EmployeeDocument_expiryDate_idx" ON "EmployeeDocument"("expiryDate");

-- CreateIndex
CREATE INDEX "EmployeeEmergencyContact_employeeId_idx" ON "EmployeeEmergencyContact"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeEducation_employeeId_idx" ON "EmployeeEducation"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeWorkHistory_employeeId_idx" ON "EmployeeWorkHistory"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeDependent_employeeId_idx" ON "EmployeeDependent"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeSkill_employeeId_idx" ON "EmployeeSkill"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSkill_employeeId_skillName_key" ON "EmployeeSkill"("employeeId", "skillName");

-- CreateIndex
CREATE INDEX "EmployeeLanguage_employeeId_idx" ON "EmployeeLanguage"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeLanguage_employeeId_language_key" ON "EmployeeLanguage"("employeeId", "language");

-- CreateIndex
CREATE INDEX "EmployeeCertification_employeeId_idx" ON "EmployeeCertification"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeProjectAllocation_employeeId_idx" ON "EmployeeProjectAllocation"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeProjectAllocation_projectId_idx" ON "EmployeeProjectAllocation"("projectId");

-- CreateIndex
CREATE INDEX "OnboardingChecklist_organizationId_idx" ON "OnboardingChecklist"("organizationId");

-- CreateIndex
CREATE INDEX "OnboardingProgress_employeeId_idx" ON "OnboardingProgress"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_employeeId_checklistId_key" ON "OnboardingProgress"("employeeId", "checklistId");

-- CreateIndex
CREATE INDEX "Attendance_employeeId_idx" ON "Attendance"("employeeId");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_name_key" ON "LeaveType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_code_key" ON "LeaveType"("code");

-- CreateIndex
CREATE INDEX "LeaveBalance_employeeId_idx" ON "LeaveBalance"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_employeeId_leaveTypeId_fiscalYearId_key" ON "LeaveBalance"("employeeId", "leaveTypeId", "fiscalYearId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveApplication_applicationNo_key" ON "LeaveApplication"("applicationNo");

-- CreateIndex
CREATE INDEX "LeaveApplication_employeeId_idx" ON "LeaveApplication"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveApplication_status_idx" ON "LeaveApplication"("status");

-- CreateIndex
CREATE INDEX "LeaveApplication_startDate_idx" ON "LeaveApplication"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryComponent_name_key" ON "SalaryComponent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryComponent_code_key" ON "SalaryComponent"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_runNo_key" ON "PayrollRun"("runNo");

-- CreateIndex
CREATE INDEX "PayrollRun_organizationId_idx" ON "PayrollRun"("organizationId");

-- CreateIndex
CREATE INDEX "PayrollRun_status_idx" ON "PayrollRun"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_month_year_key" ON "PayrollRun"("month", "year");

-- CreateIndex
CREATE INDEX "PayrollEntry_payrollRunId_idx" ON "PayrollEntry"("payrollRunId");

-- CreateIndex
CREATE INDEX "PayrollEntry_employeeId_idx" ON "PayrollEntry"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEntry_payrollRunId_employeeId_key" ON "PayrollEntry"("payrollRunId", "employeeId");

-- CreateIndex
CREATE INDEX "PerformanceReview_employeeId_idx" ON "PerformanceReview"("employeeId");

-- CreateIndex
CREATE INDEX "PerformanceReview_reviewPeriod_idx" ON "PerformanceReview"("reviewPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "Training_trainingNo_key" ON "Training"("trainingNo");

-- CreateIndex
CREATE INDEX "Training_status_idx" ON "Training"("status");

-- CreateIndex
CREATE INDEX "Training_startDate_idx" ON "Training"("startDate");

-- CreateIndex
CREATE INDEX "TrainingParticipant_trainingId_idx" ON "TrainingParticipant"("trainingId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingParticipant_trainingId_employeeId_key" ON "TrainingParticipant"("trainingId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_postingNo_key" ON "JobPosting"("postingNo");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_slug_key" ON "JobPosting"("slug");

-- CreateIndex
CREATE INDEX "JobPosting_organizationId_idx" ON "JobPosting"("organizationId");

-- CreateIndex
CREATE INDEX "JobPosting_status_idx" ON "JobPosting"("status");

-- CreateIndex
CREATE INDEX "JobPosting_slug_idx" ON "JobPosting"("slug");

-- CreateIndex
CREATE INDEX "JobPosting_applicationDeadline_idx" ON "JobPosting"("applicationDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_organizationId_postingNo_key" ON "JobPosting"("organizationId", "postingNo");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_applicationNo_key" ON "JobApplication"("applicationNo");

-- CreateIndex
CREATE INDEX "JobApplication_organizationId_idx" ON "JobApplication"("organizationId");

-- CreateIndex
CREATE INDEX "JobApplication_jobPostingId_idx" ON "JobApplication"("jobPostingId");

-- CreateIndex
CREATE INDEX "JobApplication_status_idx" ON "JobApplication"("status");

-- CreateIndex
CREATE INDEX "JobApplication_autoScore_idx" ON "JobApplication"("autoScore");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobPostingId_applicantEmail_key" ON "JobApplication"("jobPostingId", "applicantEmail");

-- CreateIndex
CREATE INDEX "Interview_applicationId_idx" ON "Interview"("applicationId");

-- CreateIndex
CREATE INDEX "Interview_scheduledAt_idx" ON "Interview"("scheduledAt");

-- CreateIndex
CREATE INDEX "InterviewPanel_interviewId_idx" ON "InterviewPanel"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPanel_interviewId_interviewerId_key" ON "InterviewPanel"("interviewId", "interviewerId");

-- CreateIndex
CREATE INDEX "ApplicationEvaluation_applicationId_idx" ON "ApplicationEvaluation"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationEvaluation_applicationId_evaluatorId_criteria_key" ON "ApplicationEvaluation"("applicationId", "evaluatorId", "criteria");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeContract_contractNo_key" ON "EmployeeContract"("contractNo");

-- CreateIndex
CREATE INDEX "EmployeeContract_organizationId_idx" ON "EmployeeContract"("organizationId");

-- CreateIndex
CREATE INDEX "EmployeeContract_employeeId_idx" ON "EmployeeContract"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeContract_status_idx" ON "EmployeeContract"("status");

-- CreateIndex
CREATE INDEX "EmployeeContract_endDate_idx" ON "EmployeeContract"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Offboarding_offboardingNo_key" ON "Offboarding"("offboardingNo");

-- CreateIndex
CREATE INDEX "Offboarding_organizationId_idx" ON "Offboarding"("organizationId");

-- CreateIndex
CREATE INDEX "Offboarding_employeeId_idx" ON "Offboarding"("employeeId");

-- CreateIndex
CREATE INDEX "Offboarding_status_idx" ON "Offboarding"("status");

-- CreateIndex
CREATE INDEX "OffboardingTask_offboardingId_idx" ON "OffboardingTask"("offboardingId");

-- CreateIndex
CREATE INDEX "HolidayCalendar_organizationId_idx" ON "HolidayCalendar"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "HolidayCalendar_organizationId_name_year_key" ON "HolidayCalendar"("organizationId", "name", "year");

-- CreateIndex
CREATE INDEX "Holiday_calendarId_idx" ON "Holiday"("calendarId");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeGrievance_grievanceNo_key" ON "EmployeeGrievance"("grievanceNo");

-- CreateIndex
CREATE INDEX "EmployeeGrievance_organizationId_idx" ON "EmployeeGrievance"("organizationId");

-- CreateIndex
CREATE INDEX "EmployeeGrievance_employeeId_idx" ON "EmployeeGrievance"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeGrievance_status_idx" ON "EmployeeGrievance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaryCase_caseNo_key" ON "DisciplinaryCase"("caseNo");

-- CreateIndex
CREATE INDEX "DisciplinaryCase_organizationId_idx" ON "DisciplinaryCase"("organizationId");

-- CreateIndex
CREATE INDEX "DisciplinaryCase_employeeId_idx" ON "DisciplinaryCase"("employeeId");

-- CreateIndex
CREATE INDEX "SalaryGrade_organizationId_idx" ON "SalaryGrade"("organizationId");

-- CreateIndex
CREATE INDEX "SalaryGrade_isActive_idx" ON "SalaryGrade"("isActive");

-- CreateIndex
CREATE INDEX "SalaryGrade_level_idx" ON "SalaryGrade"("level");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryGrade_organizationId_code_key" ON "SalaryGrade"("organizationId", "code");

-- CreateIndex
CREATE INDEX "SalaryGradeStep_gradeId_idx" ON "SalaryGradeStep"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryGradeStep_gradeId_stepNumber_key" ON "SalaryGradeStep"("gradeId", "stepNumber");

-- CreateIndex
CREATE INDEX "SalaryStructure_organizationId_idx" ON "SalaryStructure"("organizationId");

-- CreateIndex
CREATE INDEX "SalaryStructure_gradeId_idx" ON "SalaryStructure"("gradeId");

-- CreateIndex
CREATE INDEX "SalaryStructureLine_structureId_idx" ON "SalaryStructureLine"("structureId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructureLine_structureId_componentId_key" ON "SalaryStructureLine"("structureId", "componentId");

-- CreateIndex
CREATE INDEX "SalaryRevisionHistory_employeeId_idx" ON "SalaryRevisionHistory"("employeeId");

-- CreateIndex
CREATE INDEX "SalaryRevisionHistory_organizationId_idx" ON "SalaryRevisionHistory"("organizationId");

-- CreateIndex
CREATE INDEX "SalaryRevisionHistory_revisionDate_idx" ON "SalaryRevisionHistory"("revisionDate");

-- CreateIndex
CREATE INDEX "PayrollEntryLine_payrollEntryId_idx" ON "PayrollEntryLine"("payrollEntryId");

-- CreateIndex
CREATE INDEX "PayrollEntryLine_componentId_idx" ON "PayrollEntryLine"("componentId");

-- CreateIndex
CREATE INDEX "PayslipTemplate_organizationId_idx" ON "PayslipTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "PayslipDistribution_payrollEntryId_idx" ON "PayslipDistribution"("payrollEntryId");

-- CreateIndex
CREATE INDEX "TeamCoverageRule_organizationId_idx" ON "TeamCoverageRule"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamCoverageRule_organizationId_departmentId_key" ON "TeamCoverageRule"("organizationId", "departmentId");

-- CreateIndex
CREATE INDEX "OKRCycle_organizationId_idx" ON "OKRCycle"("organizationId");

-- CreateIndex
CREATE INDEX "OKRCycle_status_idx" ON "OKRCycle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OKRCycle_organizationId_name_key" ON "OKRCycle"("organizationId", "name");

-- CreateIndex
CREATE INDEX "OKRObjective_organizationId_idx" ON "OKRObjective"("organizationId");

-- CreateIndex
CREATE INDEX "OKRObjective_cycleId_idx" ON "OKRObjective"("cycleId");

-- CreateIndex
CREATE INDEX "OKRObjective_ownerType_ownerId_idx" ON "OKRObjective"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "OKRObjective_parentObjectiveId_idx" ON "OKRObjective"("parentObjectiveId");

-- CreateIndex
CREATE INDEX "OKRKeyResult_objectiveId_idx" ON "OKRKeyResult"("objectiveId");

-- CreateIndex
CREATE INDEX "OKRCheckIn_keyResultId_idx" ON "OKRCheckIn"("keyResultId");

-- CreateIndex
CREATE INDEX "OKRCheckIn_checkInDate_idx" ON "OKRCheckIn"("checkInDate");

-- CreateIndex
CREATE INDEX "OKRScore_objectiveId_idx" ON "OKRScore"("objectiveId");

-- CreateIndex
CREATE UNIQUE INDEX "OKRScore_objectiveId_scorerId_scoreType_key" ON "OKRScore"("objectiveId", "scorerId", "scoreType");

-- CreateIndex
CREATE INDEX "PayrollBudgetAllocation_organizationId_idx" ON "PayrollBudgetAllocation"("organizationId");

-- CreateIndex
CREATE INDEX "PayrollBudgetAllocation_payrollRunId_idx" ON "PayrollBudgetAllocation"("payrollRunId");

-- CreateIndex
CREATE INDEX "PayrollBudgetAllocation_projectId_idx" ON "PayrollBudgetAllocation"("projectId");

-- CreateIndex
CREATE INDEX "PayrollBudgetAllocation_budgetId_idx" ON "PayrollBudgetAllocation"("budgetId");

-- CreateIndex
CREATE INDEX "PayrollBudgetAllocation_period_idx" ON "PayrollBudgetAllocation"("period");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollBudgetAllocation_payrollEntryId_projectId_key" ON "PayrollBudgetAllocation"("payrollEntryId", "projectId");

-- CreateIndex
CREATE INDEX "Warehouse_organizationId_idx" ON "Warehouse"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_organizationId_code_key" ON "Warehouse"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_itemCode_key" ON "InventoryItem"("itemCode");

-- CreateIndex
CREATE INDEX "InventoryItem_itemCode_idx" ON "InventoryItem"("itemCode");

-- CreateIndex
CREATE INDEX "InventoryItem_warehouseId_idx" ON "InventoryItem"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryItem_status_idx" ON "InventoryItem"("status");

-- CreateIndex
CREATE INDEX "InventoryTransaction_itemId_idx" ON "InventoryTransaction"("itemId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_type_idx" ON "InventoryTransaction"("type");

-- CreateIndex
CREATE INDEX "InventoryTransaction_createdAt_idx" ON "InventoryTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_grnNo_key" ON "GoodsReceipt"("grnNo");

-- CreateIndex
CREATE INDEX "GoodsReceipt_poId_idx" ON "GoodsReceipt"("poId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_grnNo_idx" ON "GoodsReceipt"("grnNo");

-- CreateIndex
CREATE INDEX "GoodsReceiptLine_grnId_idx" ON "GoodsReceiptLine"("grnId");

-- CreateIndex
CREATE INDEX "Branch_organizationId_idx" ON "Branch"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_organizationId_code_key" ON "Branch"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Samity_samityNo_key" ON "Samity"("samityNo");

-- CreateIndex
CREATE INDEX "Samity_branchId_idx" ON "Samity"("branchId");

-- CreateIndex
CREATE INDEX "Samity_status_idx" ON "Samity"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MFIMember_memberNo_key" ON "MFIMember"("memberNo");

-- CreateIndex
CREATE INDEX "MFIMember_beneficiaryId_idx" ON "MFIMember"("beneficiaryId");

-- CreateIndex
CREATE INDEX "MFIMember_samityId_idx" ON "MFIMember"("samityId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanProduct_productCode_key" ON "LoanProduct"("productCode");

-- CreateIndex
CREATE INDEX "LoanProduct_productCode_idx" ON "LoanProduct"("productCode");

-- CreateIndex
CREATE INDEX "LoanProduct_category_idx" ON "LoanProduct"("category");

-- CreateIndex
CREATE UNIQUE INDEX "LoanApplication_applicationNo_key" ON "LoanApplication"("applicationNo");

-- CreateIndex
CREATE INDEX "LoanApplication_memberId_idx" ON "LoanApplication"("memberId");

-- CreateIndex
CREATE INDEX "LoanApplication_status_idx" ON "LoanApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LoanAccount_accountNo_key" ON "LoanAccount"("accountNo");

-- CreateIndex
CREATE INDEX "LoanAccount_memberId_idx" ON "LoanAccount"("memberId");

-- CreateIndex
CREATE INDEX "LoanAccount_status_idx" ON "LoanAccount"("status");

-- CreateIndex
CREATE INDEX "LoanAccount_classification_idx" ON "LoanAccount"("classification");

-- CreateIndex
CREATE INDEX "LoanAccount_accountNo_idx" ON "LoanAccount"("accountNo");

-- CreateIndex
CREATE INDEX "LoanAccount_memberId_status_idx" ON "LoanAccount"("memberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LoanDisbursement_disbursementNo_key" ON "LoanDisbursement"("disbursementNo");

-- CreateIndex
CREATE UNIQUE INDEX "LoanDisbursement_loanAccountId_key" ON "LoanDisbursement"("loanAccountId");

-- CreateIndex
CREATE INDEX "LoanDisbursement_loanAccountId_idx" ON "LoanDisbursement"("loanAccountId");

-- CreateIndex
CREATE INDEX "LoanDisbursement_date_idx" ON "LoanDisbursement"("date");

-- CreateIndex
CREATE UNIQUE INDEX "LoanRepayment_repaymentNo_key" ON "LoanRepayment"("repaymentNo");

-- CreateIndex
CREATE INDEX "LoanRepayment_loanAccountId_idx" ON "LoanRepayment"("loanAccountId");

-- CreateIndex
CREATE INDEX "LoanRepayment_date_idx" ON "LoanRepayment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionSheet_collectionNo_key" ON "CollectionSheet"("collectionNo");

-- CreateIndex
CREATE INDEX "CollectionSheet_samityId_idx" ON "CollectionSheet"("samityId");

-- CreateIndex
CREATE INDEX "CollectionSheet_date_idx" ON "CollectionSheet"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SavingsAccount_accountNo_key" ON "SavingsAccount"("accountNo");

-- CreateIndex
CREATE INDEX "SavingsAccount_memberId_idx" ON "SavingsAccount"("memberId");

-- CreateIndex
CREATE INDEX "SavingsAccount_type_idx" ON "SavingsAccount"("type");

-- CreateIndex
CREATE INDEX "SavingsAccount_accountNo_idx" ON "SavingsAccount"("accountNo");

-- CreateIndex
CREATE INDEX "SavingsTransaction_accountId_idx" ON "SavingsTransaction"("accountId");

-- CreateIndex
CREATE INDEX "SavingsTransaction_date_idx" ON "SavingsTransaction"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_customDomain_key" ON "Organization"("customDomain");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "FiscalYear_organizationId_isCurrent_idx" ON "FiscalYear"("organizationId", "isCurrent");

-- CreateIndex
CREATE INDEX "FiscalYear_organizationId_idx" ON "FiscalYear"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalPeriod_fiscalYearId_periodNumber_key" ON "FiscalPeriod"("fiscalYearId", "periodNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");

-- CreateIndex
CREATE INDEX "ExchangeRate_currencyId_effectiveDate_idx" ON "ExchangeRate"("currencyId", "effectiveDate");

-- CreateIndex
CREATE INDEX "SystemConfig_organizationId_idx" ON "SystemConfig"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_organizationId_key_key" ON "SystemConfig"("organizationId", "key");

-- CreateIndex
CREATE INDEX "NumberSequence_organizationId_idx" ON "NumberSequence"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "NumberSequence_organizationId_entity_key" ON "NumberSequence"("organizationId", "entity");

-- CreateIndex
CREATE INDEX "Vendor_organizationId_idx" ON "Vendor"("organizationId");

-- CreateIndex
CREATE INDEX "Vendor_companyName_idx" ON "Vendor"("companyName");

-- CreateIndex
CREATE INDEX "Vendor_category_idx" ON "Vendor"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_organizationId_vendorNo_key" ON "Vendor"("organizationId", "vendorNo");

-- CreateIndex
CREATE INDEX "VendorRating_vendorId_idx" ON "VendorRating"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisition_prNo_key" ON "PurchaseRequisition"("prNo");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_prNo_idx" ON "PurchaseRequisition"("prNo");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_status_idx" ON "PurchaseRequisition"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_projectId_idx" ON "PurchaseRequisition"("projectId");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionLine_prId_idx" ON "PurchaseRequisitionLine"("prId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNo_key" ON "PurchaseOrder"("poNo");

-- CreateIndex
CREATE INDEX "PurchaseOrder_poNo_idx" ON "PurchaseOrder"("poNo");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_poId_idx" ON "PurchaseOrderLine"("poId");

-- CreateIndex
CREATE UNIQUE INDEX "Tender_tenderNo_key" ON "Tender"("tenderNo");

-- CreateIndex
CREATE INDEX "Tender_status_idx" ON "Tender"("status");

-- CreateIndex
CREATE INDEX "Tender_closingDate_idx" ON "Tender"("closingDate");

-- CreateIndex
CREATE INDEX "TenderBid_tenderId_idx" ON "TenderBid"("tenderId");

-- CreateIndex
CREATE INDEX "TenderBid_vendorId_idx" ON "TenderBid"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNo_key" ON "Contract"("contractNo");

-- CreateIndex
CREATE INDEX "Contract_vendorId_idx" ON "Contract"("vendorId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");

-- CreateIndex
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_donorId_idx" ON "Project"("donorId");

-- CreateIndex
CREATE INDEX "Project_projectType_idx" ON "Project"("projectType");

-- CreateIndex
CREATE INDEX "Project_sector_idx" ON "Project"("sector");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_projectNo_key" ON "Project"("organizationId", "projectNo");

-- CreateIndex
CREATE INDEX "ProjectTeamMember_projectId_idx" ON "ProjectTeamMember"("projectId");

-- CreateIndex
CREATE INDEX "ProjectTeamMember_employeeId_idx" ON "ProjectTeamMember"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_activityNo_key" ON "Activity"("activityNo");

-- CreateIndex
CREATE INDEX "Activity_projectId_idx" ON "Activity"("projectId");

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "Activity"("status");

-- CreateIndex
CREATE INDEX "Activity_parentId_idx" ON "Activity"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_milestoneNo_key" ON "Milestone"("milestoneNo");

-- CreateIndex
CREATE INDEX "Milestone_projectId_idx" ON "Milestone"("projectId");

-- CreateIndex
CREATE INDEX "Milestone_targetDate_idx" ON "Milestone"("targetDate");

-- CreateIndex
CREATE INDEX "LogFrameEntry_projectId_idx" ON "LogFrameEntry"("projectId");

-- CreateIndex
CREATE INDEX "ProjectIndicator_projectId_idx" ON "ProjectIndicator"("projectId");

-- CreateIndex
CREATE INDEX "ProjectRisk_projectId_idx" ON "ProjectRisk"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCloseout_projectId_key" ON "ProjectCloseout"("projectId");

-- CreateIndex
CREATE INDEX "ProjectCloseoutItem_closeoutId_idx" ON "ProjectCloseoutItem"("closeoutId");

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_idx" ON "ProjectDocument"("projectId");

-- CreateIndex
CREATE INDEX "PFPolicy_organizationId_idx" ON "PFPolicy"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PFPolicy_organizationId_name_key" ON "PFPolicy"("organizationId", "name");

-- CreateIndex
CREATE INDEX "PFTrust_organizationId_idx" ON "PFTrust"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PFTrust_organizationId_name_key" ON "PFTrust"("organizationId", "name");

-- CreateIndex
CREATE INDEX "PFTrustee_trustId_idx" ON "PFTrustee"("trustId");

-- CreateIndex
CREATE UNIQUE INDEX "PFEnrollment_employeeId_key" ON "PFEnrollment"("employeeId");

-- CreateIndex
CREATE INDEX "PFEnrollment_organizationId_idx" ON "PFEnrollment"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PFEnrollment_organizationId_employeeId_key" ON "PFEnrollment"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "PFNominee_enrollmentId_idx" ON "PFNominee"("enrollmentId");

-- CreateIndex
CREATE INDEX "PFContribution_organizationId_idx" ON "PFContribution"("organizationId");

-- CreateIndex
CREATE INDEX "PFContribution_employeeId_idx" ON "PFContribution"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PFContribution_enrollmentId_month_year_key" ON "PFContribution"("enrollmentId", "month", "year");

-- CreateIndex
CREATE INDEX "PFInterestPosting_organizationId_idx" ON "PFInterestPosting"("organizationId");

-- CreateIndex
CREATE INDEX "PFInterestPosting_enrollmentId_idx" ON "PFInterestPosting"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PFWithdrawal_withdrawalNo_key" ON "PFWithdrawal"("withdrawalNo");

-- CreateIndex
CREATE INDEX "PFWithdrawal_organizationId_idx" ON "PFWithdrawal"("organizationId");

-- CreateIndex
CREATE INDEX "PFWithdrawal_enrollmentId_idx" ON "PFWithdrawal"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PFLoan_loanNo_key" ON "PFLoan"("loanNo");

-- CreateIndex
CREATE INDEX "PFLoan_organizationId_idx" ON "PFLoan"("organizationId");

-- CreateIndex
CREATE INDEX "PFLoan_enrollmentId_idx" ON "PFLoan"("enrollmentId");

-- CreateIndex
CREATE INDEX "PFLoanRepayment_loanId_idx" ON "PFLoanRepayment"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "PFLoanRepayment_loanId_installmentNo_key" ON "PFLoanRepayment"("loanId", "installmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "PFSettlement_settlementNo_key" ON "PFSettlement"("settlementNo");

-- CreateIndex
CREATE INDEX "PFSettlement_organizationId_idx" ON "PFSettlement"("organizationId");

-- CreateIndex
CREATE INDEX "PFSettlement_employeeId_idx" ON "PFSettlement"("employeeId");

-- CreateIndex
CREATE INDEX "PFInvestment_trustId_idx" ON "PFInvestment"("trustId");

-- CreateIndex
CREATE INDEX "PFInvestmentIncome_investmentId_idx" ON "PFInvestmentIncome"("investmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PFTrustTransaction_transactionNo_key" ON "PFTrustTransaction"("transactionNo");

-- CreateIndex
CREATE INDEX "PFTrustTransaction_trustId_idx" ON "PFTrustTransaction"("trustId");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_email_key" ON "SuperAdmin"("email");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_superAdminId_idx" ON "SuperAdminAuditLog"("superAdminId");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_action_idx" ON "SuperAdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_createdAt_idx" ON "SuperAdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ImpersonationSession_superAdminId_idx" ON "ImpersonationSession"("superAdminId");

-- CreateIndex
CREATE INDEX "ImpersonationSession_organizationId_idx" ON "ImpersonationSession"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformFeature_code_key" ON "PlatformFeature"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PlanFeature_planId_featureId_key" ON "PlanFeature"("planId", "featureId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSubscription_organizationId_key" ON "TenantSubscription"("organizationId");

-- CreateIndex
CREATE INDEX "TenantSubscription_organizationId_idx" ON "TenantSubscription"("organizationId");

-- CreateIndex
CREATE INDEX "TenantSubscription_status_idx" ON "TenantSubscription"("status");

-- CreateIndex
CREATE INDEX "TenantSubscription_nextPaymentDate_idx" ON "TenantSubscription"("nextPaymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvoice_invoiceNo_key" ON "TenantInvoice"("invoiceNo");

-- CreateIndex
CREATE INDEX "TenantInvoice_organizationId_idx" ON "TenantInvoice"("organizationId");

-- CreateIndex
CREATE INDEX "TenantInvoice_status_idx" ON "TenantInvoice"("status");

-- CreateIndex
CREATE INDEX "TenantInvoice_dueDate_idx" ON "TenantInvoice"("dueDate");

-- CreateIndex
CREATE INDEX "PaymentTransaction_invoiceId_idx" ON "PaymentTransaction"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_gateway_idx" ON "PaymentTransaction"("gateway");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "TenantAuditLog_organizationId_createdAt_idx" ON "TenantAuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantAuditLog_organizationId_module_idx" ON "TenantAuditLog"("organizationId", "module");

-- CreateIndex
CREATE INDEX "TenantAuditLog_organizationId_resource_idx" ON "TenantAuditLog"("organizationId", "resource");

-- CreateIndex
CREATE INDEX "TenantAuditLog_userId_idx" ON "TenantAuditLog"("userId");

-- CreateIndex
CREATE INDEX "TenantAuditLog_action_idx" ON "TenantAuditLog"("action");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_type_channel_key" ON "NotificationSetting"("userId", "type", "channel");

-- CreateIndex
CREATE INDEX "Attachment_entityType_entityId_idx" ON "Attachment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Attachment_uploadedById_idx" ON "Attachment"("uploadedById");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_organizationId_idx" ON "WebhookEndpoint"("organizationId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_endpointId_idx" ON "WebhookDelivery"("endpointId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_event_idx" ON "WebhookDelivery"("event");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DataRetentionPolicy_organizationId_entityType_key" ON "DataRetentionPolicy"("organizationId", "entityType");

-- CreateIndex
CREATE INDEX "DataExportRequest_organizationId_idx" ON "DataExportRequest"("organizationId");

-- CreateIndex
CREATE INDEX "DataExportRequest_status_idx" ON "DataExportRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowDef_organizationId_idx" ON "ApprovalWorkflowDef"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalWorkflowDef_organizationId_name_key" ON "ApprovalWorkflowDef"("organizationId", "name");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowStep_workflowId_idx" ON "ApprovalWorkflowStep"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalWorkflowStep_workflowId_stepNumber_key" ON "ApprovalWorkflowStep"("workflowId", "stepNumber");

-- CreateIndex
CREATE INDEX "ApprovalInstance_workflowId_idx" ON "ApprovalInstance"("workflowId");

-- CreateIndex
CREATE INDEX "ApprovalInstance_entityType_entityId_idx" ON "ApprovalInstance"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ApprovalInstance_status_idx" ON "ApprovalInstance"("status");

-- CreateIndex
CREATE INDEX "ApprovalAction_instanceId_idx" ON "ApprovalAction"("instanceId");

-- AddForeignKey
ALTER TABLE "AssetCategory" ADD CONSTRAINT "AssetCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDepreciation" ADD CONSTRAINT "AssetDepreciation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransfer" ADD CONSTRAINT "AssetTransfer_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDisposal" ADD CONSTRAINT "AssetDisposal_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiaryEnrollment" ADD CONSTRAINT "BeneficiaryEnrollment_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeneficiaryEnrollment" ADD CONSTRAINT "BeneficiaryEnrollment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDelivery" ADD CONSTRAINT "ServiceDelivery_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDelivery" ADD CONSTRAINT "ServiceDelivery_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAssessment" ADD CONSTRAINT "ImpactAssessment_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "ImpactIndicator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRevision" ADD CONSTRAINT "BudgetRevision_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRevisionLine" ADD CONSTRAINT "BudgetRevisionLine_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "BudgetRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRevisionLine" ADD CONSTRAINT "BudgetRevisionLine_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostAllocationEntry" ADD CONSTRAINT "CostAllocationEntry_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "CostAllocationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostAllocationEntry" ADD CONSTRAINT "CostAllocationEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donor" ADD CONSTRAINT "Donor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorContact" ADD CONSTRAINT "DonorContact_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundReceipt" ADD CONSTRAINT "FundReceipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundReceipt" ADD CONSTRAINT "FundReceipt_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundReceipt" ADD CONSTRAINT "FundReceipt_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundRequisition" ADD CONSTRAINT "FundRequisition_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundRequisition" ADD CONSTRAINT "FundRequisition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorReport" ADD CONSTRAINT "DonorReport_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliation" ADD CONSTRAINT "BankReconciliation_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliationItem" ADD CONSTRAINT "BankReconciliationItem_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "BankReconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashFund" ADD CONSTRAINT "PettyCashFund_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashFund" ADD CONSTRAINT "PettyCashFund_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashTransaction" ADD CONSTRAINT "PettyCashTransaction_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "PettyCashFund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaimItem" ADD CONSTRAINT "ExpenseClaimItem_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "ExpenseClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAdvance" ADD CONSTRAINT "EmployeeAdvance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerDiemRate" ADD CONSTRAINT "PerDiemRate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GratuityPolicy" ADD CONSTRAINT "GratuityPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GratuityLedger" ADD CONSTRAINT "GratuityLedger_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GratuityLedger" ADD CONSTRAINT "GratuityLedger_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GratuityAccrual" ADD CONSTRAINT "GratuityAccrual_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GratuityAccrual" ADD CONSTRAINT "GratuityAccrual_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "GratuityLedger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GratuityPayment" ADD CONSTRAINT "GratuityPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GratuityPayment" ADD CONSTRAINT "GratuityPayment_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "GratuityLedger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GratuityFund" ADD CONSTRAINT "GratuityFund_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GratuityFundTransaction" ADD CONSTRAINT "GratuityFundTransaction_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "GratuityFund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_reportingToId_fkey" FOREIGN KEY ("reportingToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_salaryGradeId_fkey" FOREIGN KEY ("salaryGradeId") REFERENCES "SalaryGrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "SalaryStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEmergencyContact" ADD CONSTRAINT "EmployeeEmergencyContact_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEducation" ADD CONSTRAINT "EmployeeEducation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeWorkHistory" ADD CONSTRAINT "EmployeeWorkHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDependent" ADD CONSTRAINT "EmployeeDependent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkill" ADD CONSTRAINT "EmployeeSkill_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLanguage" ADD CONSTRAINT "EmployeeLanguage_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeCertification" ADD CONSTRAINT "EmployeeCertification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProjectAllocation" ADD CONSTRAINT "EmployeeProjectAllocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProjectAllocation" ADD CONSTRAINT "EmployeeProjectAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "OnboardingChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingParticipant" ADD CONSTRAINT "TrainingParticipant_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingParticipant" ADD CONSTRAINT "TrainingParticipant_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewPanel" ADD CONSTRAINT "InterviewPanel_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvaluation" ADD CONSTRAINT "ApplicationEvaluation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeContract" ADD CONSTRAINT "EmployeeContract_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offboarding" ADD CONSTRAINT "Offboarding_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffboardingTask" ADD CONSTRAINT "OffboardingTask_offboardingId_fkey" FOREIGN KEY ("offboardingId") REFERENCES "Offboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "HolidayCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryGrade" ADD CONSTRAINT "SalaryGrade_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryGradeStep" ADD CONSTRAINT "SalaryGradeStep_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "SalaryGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "SalaryGrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureLine" ADD CONSTRAINT "SalaryStructureLine_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "SalaryStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureLine" ADD CONSTRAINT "SalaryStructureLine_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRevisionHistory" ADD CONSTRAINT "SalaryRevisionHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRevisionHistory" ADD CONSTRAINT "SalaryRevisionHistory_previousGradeId_fkey" FOREIGN KEY ("previousGradeId") REFERENCES "SalaryGrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRevisionHistory" ADD CONSTRAINT "SalaryRevisionHistory_newGradeId_fkey" FOREIGN KEY ("newGradeId") REFERENCES "SalaryGrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntryLine" ADD CONSTRAINT "PayrollEntryLine_payrollEntryId_fkey" FOREIGN KEY ("payrollEntryId") REFERENCES "PayrollEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntryLine" ADD CONSTRAINT "PayrollEntryLine_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipTemplate" ADD CONSTRAINT "PayslipTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipDistribution" ADD CONSTRAINT "PayslipDistribution_payrollEntryId_fkey" FOREIGN KEY ("payrollEntryId") REFERENCES "PayrollEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamCoverageRule" ADD CONSTRAINT "TeamCoverageRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamCoverageRule" ADD CONSTRAINT "TeamCoverageRule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OKRCycle" ADD CONSTRAINT "OKRCycle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OKRObjective" ADD CONSTRAINT "OKRObjective_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "OKRCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OKRObjective" ADD CONSTRAINT "OKRObjective_parentObjectiveId_fkey" FOREIGN KEY ("parentObjectiveId") REFERENCES "OKRObjective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OKRKeyResult" ADD CONSTRAINT "OKRKeyResult_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "OKRObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OKRCheckIn" ADD CONSTRAINT "OKRCheckIn_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "OKRKeyResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OKRScore" ADD CONSTRAINT "OKRScore_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "OKRObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBudgetAllocation" ADD CONSTRAINT "PayrollBudgetAllocation_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBudgetAllocation" ADD CONSTRAINT "PayrollBudgetAllocation_payrollEntryId_fkey" FOREIGN KEY ("payrollEntryId") REFERENCES "PayrollEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBudgetAllocation" ADD CONSTRAINT "PayrollBudgetAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBudgetAllocation" ADD CONSTRAINT "PayrollBudgetAllocation_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBudgetAllocation" ADD CONSTRAINT "PayrollBudgetAllocation_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_poLineId_fkey" FOREIGN KEY ("poLineId") REFERENCES "PurchaseOrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Samity" ADD CONSTRAINT "Samity_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MFIMember" ADD CONSTRAINT "MFIMember_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MFIMember" ADD CONSTRAINT "MFIMember_samityId_fkey" FOREIGN KEY ("samityId") REFERENCES "Samity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_productId_fkey" FOREIGN KEY ("productId") REFERENCES "LoanProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanAccount" ADD CONSTRAINT "LoanAccount_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MFIMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanAccount" ADD CONSTRAINT "LoanAccount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "LoanProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanDisbursement" ADD CONSTRAINT "LoanDisbursement_loanAccountId_fkey" FOREIGN KEY ("loanAccountId") REFERENCES "LoanAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_loanAccountId_fkey" FOREIGN KEY ("loanAccountId") REFERENCES "LoanAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionSheet" ADD CONSTRAINT "CollectionSheet_samityId_fkey" FOREIGN KEY ("samityId") REFERENCES "Samity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsAccount" ADD CONSTRAINT "SavingsAccount_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MFIMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsTransaction" ADD CONSTRAINT "SavingsTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SavingsAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalPeriod" ADD CONSTRAINT "FiscalPeriod_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemConfig" ADD CONSTRAINT "SystemConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumberSequence" ADD CONSTRAINT "NumberSequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRating" ADD CONSTRAINT "VendorRating_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionLine" ADD CONSTRAINT "PurchaseRequisitionLine_prId_fkey" FOREIGN KEY ("prId") REFERENCES "PurchaseRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_prLineId_fkey" FOREIGN KEY ("prLineId") REFERENCES "PurchaseRequisitionLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderBid" ADD CONSTRAINT "TenderBid_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderBid" ADD CONSTRAINT "TenderBid_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTeamMember" ADD CONSTRAINT "ProjectTeamMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTeamMember" ADD CONSTRAINT "ProjectTeamMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogFrameEntry" ADD CONSTRAINT "LogFrameEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogFrameEntry" ADD CONSTRAINT "LogFrameEntry_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LogFrameEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectIndicator" ADD CONSTRAINT "ProjectIndicator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRisk" ADD CONSTRAINT "ProjectRisk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCloseout" ADD CONSTRAINT "ProjectCloseout_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCloseoutItem" ADD CONSTRAINT "ProjectCloseoutItem_closeoutId_fkey" FOREIGN KEY ("closeoutId") REFERENCES "ProjectCloseout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFPolicy" ADD CONSTRAINT "PFPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFTrust" ADD CONSTRAINT "PFTrust_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFTrustee" ADD CONSTRAINT "PFTrustee_trustId_fkey" FOREIGN KEY ("trustId") REFERENCES "PFTrust"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFEnrollment" ADD CONSTRAINT "PFEnrollment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFEnrollment" ADD CONSTRAINT "PFEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFNominee" ADD CONSTRAINT "PFNominee_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "PFEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFContribution" ADD CONSTRAINT "PFContribution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFInterestPosting" ADD CONSTRAINT "PFInterestPosting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFWithdrawal" ADD CONSTRAINT "PFWithdrawal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFLoan" ADD CONSTRAINT "PFLoan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFLoanRepayment" ADD CONSTRAINT "PFLoanRepayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "PFLoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFSettlement" ADD CONSTRAINT "PFSettlement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFInvestment" ADD CONSTRAINT "PFInvestment_trustId_fkey" FOREIGN KEY ("trustId") REFERENCES "PFTrust"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PFTrustTransaction" ADD CONSTRAINT "PFTrustTransaction_trustId_fkey" FOREIGN KEY ("trustId") REFERENCES "PFTrust"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuperAdminAuditLog" ADD CONSTRAINT "SuperAdminAuditLog_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "PlatformFeature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvoice" ADD CONSTRAINT "TenantInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "TenantSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "TenantInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantAuditLog" ADD CONSTRAINT "TenantAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSetting" ADD CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowStep" ADD CONSTRAINT "ApprovalWorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ApprovalWorkflowDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalInstance" ADD CONSTRAINT "ApprovalInstance_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ApprovalWorkflowDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "ApprovalInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
