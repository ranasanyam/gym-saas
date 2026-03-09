// prisma/seed-saas-plans.ts
// Run: npx ts-node prisma/seed-saas-plans.ts
// Or add to package.json: "prisma": { "seed": "ts-node prisma/seed-saas-plans.ts" }
import { PrismaClient } from "../src/generated/prisma"
const prisma = new PrismaClient()

async function main() {
  const plans = [
    {
      name:        "Free",
      description: "Get started with FitHub at no cost. Perfect for new gyms.",
      interval:    "MONTHLY" as const,
      price:       0,
      sortOrder:   1,
      maxMembers:  100,
      maxTrainers: 2,
      // Features
      attendanceTracking:   true,
      workoutPlans:         true,
      dietPlans:            false,
      classScheduling:      false,
      reportsAnalytics:     false,
      onlinePayments:       false,
      balanceSheet:         false,
      supplementManagement: false,
      customBranding:       false,
      whatsappIntegration:  false,
      apiAccess:            false,
    },
    {
      name:        "Basic",
      description: "3-month plan with expanded member capacity and all core tools.",
      interval:    "QUARTERLY" as const,
      price:       1000,
      sortOrder:   2,
      maxMembers:  200,
      maxTrainers: 5,
      attendanceTracking:   true,
      workoutPlans:         true,
      dietPlans:            true,
      classScheduling:      false,
      reportsAnalytics:     false,
      onlinePayments:       false,
      balanceSheet:         false,
      supplementManagement: false,
      customBranding:       false,
      whatsappIntegration:  false,
      apiAccess:            false,
    },
    {
      name:        "Standard",
      description: "6-month plan with online payments, balance sheet, and supplement management.",
      interval:    "HALF_YEARLY" as const,
      price:       2000,
      sortOrder:   3,
      maxMembers:  500,
      maxTrainers: 15,
      attendanceTracking:   true,
      workoutPlans:         true,
      dietPlans:            true,
      classScheduling:      true,
      reportsAnalytics:     true,
      onlinePayments:       true,
      balanceSheet:         true,
      supplementManagement: true,
      customBranding:       false,
      whatsappIntegration:  false,
      apiAccess:            false,
    },
    {
      name:        "Pro",
      description: "Annual plan with unlimited members and all Standard features.",
      interval:    "YEARLY" as const,
      price:       3000,
      sortOrder:   4,
      maxMembers:  null,   // unlimited
      maxTrainers: null,
      attendanceTracking:   true,
      workoutPlans:         true,
      dietPlans:            true,
      classScheduling:      true,
      reportsAnalytics:     true,
      onlinePayments:       true,
      balanceSheet:         true,
      supplementManagement: true,
      customBranding:       false,
      whatsappIntegration:  false,
      apiAccess:            false,
    },
    {
      name:        "Elite",
      description: "Annual plan with custom branding, WhatsApp integration, and all Pro features.",
      interval:    "YEARLY" as const,
      price:       4000,
      sortOrder:   5,
      maxMembers:  null,
      maxTrainers: null,
      attendanceTracking:   true,
      workoutPlans:         true,
      dietPlans:            true,
      classScheduling:      true,
      reportsAnalytics:     true,
      onlinePayments:       true,
      balanceSheet:         true,
      supplementManagement: true,
      customBranding:       true,
      whatsappIntegration:  true,
      apiAccess:            false,
    },
    {
      name:        "Lifetime",
      description: "One-time payment. Every Elite feature, forever. Never pay again.",
      interval:    "LIFETIME" as const,
      price:       10000,
      sortOrder:   6,
      maxMembers:  null,
      maxTrainers: null,
      attendanceTracking:   true,
      workoutPlans:         true,
      dietPlans:            true,
      classScheduling:      true,
      reportsAnalytics:     true,
      onlinePayments:       true,
      balanceSheet:         true,
      supplementManagement: true,
      customBranding:       true,
      whatsappIntegration:  true,
      apiAccess:            true,
    },
  ]

  console.log("Seeding SaaS plans...")
  for (const plan of plans) {
    await prisma.saasPlan.upsert({
      where:  { id: plan.name.toLowerCase() }, // stable ID by name
      update: plan,
      create: { id: plan.name.toLowerCase(), ...plan },
    })
    console.log(`  ✓ ${plan.name} — ₹${plan.price} / ${plan.interval}`)
  }
  console.log("Done.")
}

main().catch(console.error).finally(() => prisma.$disconnect())