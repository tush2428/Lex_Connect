-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "advocate_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "barCouncilNumber" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "referralInformation" TEXT,
    "bio" TEXT,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "experienceSummary" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advocate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualifications" (
    "id" UUID NOT NULL,
    "advocateId" UUID NOT NULL,
    "qualification" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "yearCompleted" INTEGER NOT NULL,

    CONSTRAINT "qualifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specializations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "specializations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AdvocateProfileToSpecialization" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AdvocateProfileToSpecialization_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "advocate_profiles_userId_key" ON "advocate_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "advocate_profiles_barCouncilNumber_key" ON "advocate_profiles"("barCouncilNumber");

-- CreateIndex
CREATE UNIQUE INDEX "specializations_name_key" ON "specializations"("name");

-- CreateIndex
CREATE INDEX "_AdvocateProfileToSpecialization_B_index" ON "_AdvocateProfileToSpecialization"("B");

-- AddForeignKey
ALTER TABLE "advocate_profiles" ADD CONSTRAINT "advocate_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualifications" ADD CONSTRAINT "qualifications_advocateId_fkey" FOREIGN KEY ("advocateId") REFERENCES "advocate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdvocateProfileToSpecialization" ADD CONSTRAINT "_AdvocateProfileToSpecialization_A_fkey" FOREIGN KEY ("A") REFERENCES "advocate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdvocateProfileToSpecialization" ADD CONSTRAINT "_AdvocateProfileToSpecialization_B_fkey" FOREIGN KEY ("B") REFERENCES "specializations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
