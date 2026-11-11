-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

CREATE TYPE "AvailabilityStatus" AS ENUM ('OPEN', 'BOOKED', 'BLOCKED');

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateTable
CREATE TABLE "availabilities" (
    "id" UUID NOT NULL,
    "advocateId" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'OPEN',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "advocateId" UUID NOT NULL,
    "availabilityId" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "transactionId" TEXT,
    "paymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "availabilities_advocateId_startsAt_idx"
ON "availabilities"("advocateId", "startsAt");

-- CreateIndex
CREATE INDEX "appointments_advocateId_scheduledAt_idx"
ON "appointments"("advocateId", "scheduledAt");

CREATE INDEX "appointments_clientId_status_idx"
ON "appointments"("clientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_appointmentId_key"
ON "payments"("appointmentId");

CREATE UNIQUE INDEX "payments_transactionId_key"
ON "payments"("transactionId");

CREATE UNIQUE INDEX "payments_paymentIntentId_key"
ON "payments"("paymentIntentId");

-- AddForeignKey
ALTER TABLE "availabilities"
ADD CONSTRAINT "availabilities_advocateId_fkey"
FOREIGN KEY ("advocateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_advocateId_fkey"
FOREIGN KEY ("advocateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_availabilityId_fkey"
FOREIGN KEY ("availabilityId") REFERENCES "availabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"
ADD CONSTRAINT "payments_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
