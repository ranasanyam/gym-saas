-- AlterTable
ALTER TABLE "saas_plans" ADD COLUMN     "balance_sheet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "online_payments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supplement_management" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsapp_integration" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "supplements" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "description" TEXT,
    "unit_size" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2),
    "stock_qty" INTEGER NOT NULL DEFAULT 0,
    "low_stock_at" INTEGER NOT NULL DEFAULT 5,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplement_sales" (
    "id" TEXT NOT NULL,
    "supplement_id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "member_id" TEXT,
    "member_name" TEXT,
    "qty" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "sold_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplement_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplements_gym_id_idx" ON "supplements"("gym_id");

-- CreateIndex
CREATE INDEX "supplement_sales_gym_id_idx" ON "supplement_sales"("gym_id");

-- CreateIndex
CREATE INDEX "supplement_sales_supplement_id_idx" ON "supplement_sales"("supplement_id");

-- AddForeignKey
ALTER TABLE "supplements" ADD CONSTRAINT "supplements_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplement_sales" ADD CONSTRAINT "supplement_sales_supplement_id_fkey" FOREIGN KEY ("supplement_id") REFERENCES "supplements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplement_sales" ADD CONSTRAINT "supplement_sales_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplement_sales" ADD CONSTRAINT "supplement_sales_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "gym_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
