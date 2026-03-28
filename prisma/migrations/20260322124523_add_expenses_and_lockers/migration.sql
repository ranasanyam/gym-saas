-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('ELECTRICITY', 'WATER', 'RENT', 'EQUIPMENT_PURCHASE', 'EQUIPMENT_MAINTENANCE', 'STAFF_SALARY', 'MARKETING', 'CLEANING', 'INSURANCE', 'INTERNET', 'SOFTWARE', 'MISCELLANEOUS');

-- CreateEnum
CREATE TYPE "LockerStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RESERVED');

-- CreateTable
CREATE TABLE "gym_expenses" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "added_by_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'MISCELLANEOUS',
    "description" TEXT,
    "expense_date" DATE NOT NULL,
    "receipt_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gym_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lockers" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "locker_number" TEXT NOT NULL,
    "floor" TEXT,
    "size" TEXT,
    "status" "LockerStatus" NOT NULL DEFAULT 'AVAILABLE',
    "monthly_fee" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lockers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locker_assignments" (
    "id" TEXT NOT NULL,
    "locker_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "fee_collected" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locker_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gym_expenses_gym_id_idx" ON "gym_expenses"("gym_id");

-- CreateIndex
CREATE INDEX "gym_expenses_expense_date_idx" ON "gym_expenses"("expense_date");

-- CreateIndex
CREATE INDEX "lockers_gym_id_idx" ON "lockers"("gym_id");

-- CreateIndex
CREATE UNIQUE INDEX "lockers_gym_id_locker_number_key" ON "lockers"("gym_id", "locker_number");

-- CreateIndex
CREATE INDEX "locker_assignments_locker_id_idx" ON "locker_assignments"("locker_id");

-- CreateIndex
CREATE INDEX "locker_assignments_member_id_idx" ON "locker_assignments"("member_id");

-- CreateIndex
CREATE INDEX "locker_assignments_gym_id_idx" ON "locker_assignments"("gym_id");

-- AddForeignKey
ALTER TABLE "gym_expenses" ADD CONSTRAINT "gym_expenses_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_expenses" ADD CONSTRAINT "gym_expenses_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lockers" ADD CONSTRAINT "lockers_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locker_assignments" ADD CONSTRAINT "locker_assignments_locker_id_fkey" FOREIGN KEY ("locker_id") REFERENCES "lockers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locker_assignments" ADD CONSTRAINT "locker_assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "gym_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locker_assignments" ADD CONSTRAINT "locker_assignments_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
