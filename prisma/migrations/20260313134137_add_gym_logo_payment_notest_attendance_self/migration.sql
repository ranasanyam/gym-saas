-- AlterEnum
ALTER TYPE "AttendanceMethod" ADD VALUE 'SELF';

-- AlterTable
ALTER TABLE "gym_members" ADD COLUMN     "current_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_checkin_date" DATE,
ADD COLUMN     "longest_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_checkins" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "gyms" ADD COLUMN     "logo_url" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "attendance_milestones" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "achieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poster_url" TEXT,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attendance_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_milestones_member_id_milestone_key" ON "attendance_milestones"("member_id", "milestone");

-- AddForeignKey
ALTER TABLE "attendance_milestones" ADD CONSTRAINT "attendance_milestones_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "gym_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_milestones" ADD CONSTRAINT "attendance_milestones_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
