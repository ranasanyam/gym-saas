-- AlterTable
ALTER TABLE "saas_plans" ADD COLUMN     "max_gyms" INTEGER,
ADD COLUMN     "max_membership_plans" INTEGER,
ADD COLUMN     "max_notifications_per_month" INTEGER;
