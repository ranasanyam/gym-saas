-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE 'DEBIT_MEMBERSHIP';

-- AlterTable
ALTER TABLE "gyms" ADD COLUMN     "whatsapp_number" TEXT;

-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "gym_id" TEXT;

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_templates" (
    "id" TEXT NOT NULL,
    "owner_gym_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "difficulty" TEXT,
    "plan_data" JSONB NOT NULL,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_profile_id_idx" ON "push_subscriptions"("profile_id");

-- CreateIndex
CREATE INDEX "plan_templates_type_is_global_idx" ON "plan_templates"("type", "is_global");

-- CreateIndex
CREATE INDEX "plan_templates_owner_gym_id_idx" ON "plan_templates"("owner_gym_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_expires_at_idx" ON "wallet_transactions"("expires_at");

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_templates" ADD CONSTRAINT "plan_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_templates" ADD CONSTRAINT "plan_templates_owner_gym_id_fkey" FOREIGN KEY ("owner_gym_id") REFERENCES "gyms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
