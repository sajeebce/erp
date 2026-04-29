CREATE TABLE "VendorInvoice" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "vendorId" UUID NOT NULL,
    "poId" UUID NOT NULL,
    "grossAmount" DECIMAL(18,2) NOT NULL,
    "tdsAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "vdsAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netPayable" DECIMAL(18,2) NOT NULL,
    "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outstandingAmount" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'MATCHED',
    "matchedAt" TIMESTAMP(3),
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" UUID,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VendorInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendorInvoiceGrn" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "grnId" UUID NOT NULL,
    "acceptedAmount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "VendorInvoiceGrn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendorPayment" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "paymentNo" TEXT NOT NULL,
    "invoiceId" UUID NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "bankAccountId" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "tdsAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "vdsAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netPaid" DECIMAL(18,2) NOT NULL,
    "reference" TEXT,
    "voucherId" UUID,
    "journalEntryId" UUID,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "paidById" UUID NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorInvoice_organizationId_vendorId_invoiceNo_key" ON "VendorInvoice"("organizationId", "vendorId", "invoiceNo");
CREATE INDEX "VendorInvoice_organizationId_idx" ON "VendorInvoice"("organizationId");
CREATE INDEX "VendorInvoice_vendorId_idx" ON "VendorInvoice"("vendorId");
CREATE INDEX "VendorInvoice_poId_idx" ON "VendorInvoice"("poId");
CREATE INDEX "VendorInvoice_status_idx" ON "VendorInvoice"("status");

CREATE UNIQUE INDEX "VendorInvoiceGrn_invoiceId_grnId_key" ON "VendorInvoiceGrn"("invoiceId", "grnId");
CREATE INDEX "VendorInvoiceGrn_invoiceId_idx" ON "VendorInvoiceGrn"("invoiceId");
CREATE INDEX "VendorInvoiceGrn_grnId_idx" ON "VendorInvoiceGrn"("grnId");

CREATE UNIQUE INDEX "VendorPayment_organizationId_paymentNo_key" ON "VendorPayment"("organizationId", "paymentNo");
CREATE INDEX "VendorPayment_organizationId_idx" ON "VendorPayment"("organizationId");
CREATE INDEX "VendorPayment_invoiceId_idx" ON "VendorPayment"("invoiceId");
CREATE INDEX "VendorPayment_bankAccountId_idx" ON "VendorPayment"("bankAccountId");
CREATE INDEX "VendorPayment_journalEntryId_idx" ON "VendorPayment"("journalEntryId");

ALTER TABLE "VendorInvoiceGrn"
ADD CONSTRAINT "VendorInvoiceGrn_invoiceId_fkey"
FOREIGN KEY ("invoiceId") REFERENCES "VendorInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VendorPayment"
ADD CONSTRAINT "VendorPayment_invoiceId_fkey"
FOREIGN KEY ("invoiceId") REFERENCES "VendorInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
