-- CreateIndex
CREATE INDEX "gym_members_created_at_idx" ON "gym_members"("created_at");

-- CreateIndex
CREATE INDEX "gym_members_end_date_idx" ON "gym_members"("end_date");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "supplement_sales_sold_at_idx" ON "supplement_sales"("sold_at");
