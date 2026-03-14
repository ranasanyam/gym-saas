// // prisma/seed-saas-plans.ts
// // Run: npx ts-node prisma/seed-saas-plans.ts
// // Or add to package.json: "prisma": { "seed": "ts-node prisma/seed-saas-plans.ts" }
// import { PrismaClient } from "../src/generated/prisma"
// const prisma = new PrismaClient()

// async function main() {
//   const plans = [
//     {
//       name:        "Free",
//       description: "Get started with GymStack at no cost. Perfect for new gyms.",
//       interval:    "MONTHLY" as const,
//       price:       0,
//       sortOrder:   1,
//       maxMembers:  100,
//       maxTrainers: 2,
//       // Features
//       attendanceTracking:   true,
//       workoutPlans:         true,
//       dietPlans:            false,
//       classScheduling:      false,
//       reportsAnalytics:     false,
//       onlinePayments:       false,
//       balanceSheet:         false,
//       supplementManagement: false,
//       customBranding:       false,
//       whatsappIntegration:  false,
//       apiAccess:            false,
//     },
//     {
//       name:        "Basic",
//       description: "3-month plan with expanded member capacity and all core tools.",
//       interval:    "QUARTERLY" as const,
//       price:       1000,
//       sortOrder:   2,
//       maxMembers:  200,
//       maxTrainers: 5,
//       attendanceTracking:   true,
//       workoutPlans:         true,
//       dietPlans:            true,
//       classScheduling:      false,
//       reportsAnalytics:     false,
//       onlinePayments:       false,
//       balanceSheet:         false,
//       supplementManagement: false,
//       customBranding:       false,
//       whatsappIntegration:  false,
//       apiAccess:            false,
//     },
//     {
//       name:        "Standard",
//       description: "6-month plan with online payments, balance sheet, and supplement management.",
//       interval:    "HALF_YEARLY" as const,
//       price:       2000,
//       sortOrder:   3,
//       maxMembers:  500,
//       maxTrainers: 15,
//       attendanceTracking:   true,
//       workoutPlans:         true,
//       dietPlans:            true,
//       classScheduling:      true,
//       reportsAnalytics:     true,
//       onlinePayments:       true,
//       balanceSheet:         true,
//       supplementManagement: true,
//       customBranding:       false,
//       whatsappIntegration:  false,
//       apiAccess:            false,
//     },
//     {
//       name:        "Pro",
//       description: "Annual plan with unlimited members and all Standard features.",
//       interval:    "YEARLY" as const,
//       price:       3000,
//       sortOrder:   4,
//       maxMembers:  null,   // unlimited
//       maxTrainers: null,
//       attendanceTracking:   true,
//       workoutPlans:         true,
//       dietPlans:            true,
//       classScheduling:      true,
//       reportsAnalytics:     true,
//       onlinePayments:       true,
//       balanceSheet:         true,
//       supplementManagement: true,
//       customBranding:       false,
//       whatsappIntegration:  false,
//       apiAccess:            false,
//     },
//     {
//       name:        "Elite",
//       description: "Annual plan with custom branding, WhatsApp integration, and all Pro features.",
//       interval:    "YEARLY" as const,
//       price:       4000,
//       sortOrder:   5,
//       maxMembers:  null,
//       maxTrainers: null,
//       attendanceTracking:   true,
//       workoutPlans:         true,
//       dietPlans:            true,
//       classScheduling:      true,
//       reportsAnalytics:     true,
//       onlinePayments:       true,
//       balanceSheet:         true,
//       supplementManagement: true,
//       customBranding:       true,
//       whatsappIntegration:  true,
//       apiAccess:            false,
//     },
//     {
//       name:        "Lifetime",
//       description: "One-time payment. Every Elite feature, forever. Never pay again.",
//       interval:    "LIFETIME" as const,
//       price:       10000,
//       sortOrder:   6,
//       maxMembers:  null,
//       maxTrainers: null,
//       attendanceTracking:   true,
//       workoutPlans:         true,
//       dietPlans:            true,
//       classScheduling:      true,
//       reportsAnalytics:     true,
//       onlinePayments:       true,
//       balanceSheet:         true,
//       supplementManagement: true,
//       customBranding:       true,
//       whatsappIntegration:  true,
//       apiAccess:            true,
//     },
//   ]

//   console.log("Seeding SaaS plans...")
//   for (const plan of plans) {
//     await prisma.saasPlan.upsert({
//       where:  { id: plan.name.toLowerCase() }, // stable ID by name
//       update: plan,
//       create: { id: plan.name.toLowerCase(), ...plan },
//     })
//     console.log(`  ✓ ${plan.name} — ₹${plan.price} / ${plan.interval}`)
//   }
//   console.log("Done.")
// }

// main().catch(console.error).finally(() => prisma.$disconnect())




// prisma/seed-saas-plans.ts
// Seeds the 5 subscription plans matching the spec exactly.
// Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-saas-plans.ts

import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env" })

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })


async function main() {
  const plans = [
    {
      id: "plan_free_trial",
      name: "Free Trial",
      description: "Try FitHub free for 1 month. Perfect for new gym owners.",
      interval: "MONTHLY" as const,
      price: 0,
      sortOrder: 1,
      // Limits
      maxGyms: 1,
      maxMembers: 100,
      maxTrainers: 1,
      maxMembershipPlans: 10,
      maxNotificationsPerMonth: 10,
      maxClasses: null,
      maxStorageGb: null,
      // Features
      attendanceTracking: false,
      workoutPlans: false,
      dietPlans: false,
      classScheduling: false,
      reportsAnalytics: false,
      onlinePayments: false,
      balanceSheet: false,
      supplementManagement: false,
      customBranding: false,
      whatsappIntegration: false,
      apiAccess: false,
    },
    {
      id: "plan_starter",
      name: "Starter",
      description: "Manage up to 2 gyms with workout plans, diet plans and attendance for 6 months.",
      interval: "HALF_YEARLY" as const,
      price: 2000,
      sortOrder: 2,
      maxGyms: 2,
      maxMembers: 200,
      maxTrainers: 2,
      maxMembershipPlans: 20,
      maxNotificationsPerMonth: 50,
      maxClasses: null,
      maxStorageGb: null,
      attendanceTracking: true,
      workoutPlans: true,
      dietPlans: true,
      classScheduling: false,
      reportsAnalytics: false,
      onlinePayments: false,
      balanceSheet: false,
      supplementManagement: false,
      customBranding: false,
      whatsappIntegration: false,
      apiAccess: false,
    },
    {
      id: "plan_growth",
      name: "Growth",
      description: "Up to 10 gyms, supplements, payments, full analytics. 12 months.",
      interval: "YEARLY" as const,
      price: 3000,
      sortOrder: 3,
      maxGyms: 10,
      maxMembers: 500,
      maxTrainers: 10,
      maxMembershipPlans: 50,
      maxNotificationsPerMonth: 100,
      maxClasses: null,
      maxStorageGb: null,
      attendanceTracking: true,
      workoutPlans: true,
      dietPlans: true,
      classScheduling: false,
      reportsAnalytics: true,
      onlinePayments: true,
      balanceSheet: true,
      supplementManagement: true,
      customBranding: false,
      whatsappIntegration: false,
      apiAccess: false,
    },
    {
      id: "plan_pro",
      name: "Pro",
      description: "Everything in Growth plus unlimited everything, templates and refer & earn. 12 months.",
      interval: "YEARLY" as const,
      price: 5000,
      sortOrder: 4,
      maxGyms: null,
      maxMembers: null,
      maxTrainers: null,
      maxMembershipPlans: null,
      maxNotificationsPerMonth: null,
      maxClasses: null,
      maxStorageGb: null,
      attendanceTracking: true,
      workoutPlans: true,
      dietPlans: true,
      classScheduling: true,
      reportsAnalytics: true,
      onlinePayments: true,
      balanceSheet: true,
      supplementManagement: true,
      customBranding: true,
      whatsappIntegration: true,
      apiAccess: false,
    },
    {
      id: "plan_lifetime",
      name: "Lifetime",
      description: "All Pro features, forever. Pay once, never pay again.",
      interval: "LIFETIME" as const,
      price: 30000,
      sortOrder: 5,
      maxGyms: null,
      maxMembers: null,
      maxTrainers: null,
      maxMembershipPlans: null,
      maxNotificationsPerMonth: null,
      maxClasses: null,
      maxStorageGb: null,
      attendanceTracking: true,
      workoutPlans: true,
      dietPlans: true,
      classScheduling: true,
      reportsAnalytics: true,
      onlinePayments: true,
      balanceSheet: true,
      supplementManagement: true,
      customBranding: true,
      whatsappIntegration: true,
      apiAccess: true,
    },
  ]

  console.log("Seeding SaaS plans (5-plan spec)...")
  for (const plan of plans) {
    await prisma.saasPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    })
    console.log(`  ✓ ${plan.name} — ₹${plan.price} / ${plan.interval}`)
  }
  console.log("Done.")
}

main().catch(console.error).finally(() => prisma.$disconnect())