// // // prisma/seed-saas-plans.ts
// // // Run: npx ts-node prisma/seed-saas-plans.ts
// // // Or add to package.json: "prisma": { "seed": "ts-node prisma/seed-saas-plans.ts" }
// // import { PrismaClient } from "../src/generated/prisma"
// // const prisma = new PrismaClient()

// // async function main() {
// //   const plans = [
// //     {
// //       name:        "Free",
// //       description: "Get started with GymStack at no cost. Perfect for new gyms.",
// //       interval:    "MONTHLY" as const,
// //       price:       0,
// //       sortOrder:   1,
// //       maxMembers:  100,
// //       maxTrainers: 2,
// //       // Features
// //       attendanceTracking:   true,
// //       workoutPlans:         true,
// //       dietPlans:            false,
// //       classScheduling:      false,
// //       reportsAnalytics:     false,
// //       onlinePayments:       false,
// //       balanceSheet:         false,
// //       supplementManagement: false,
// //       customBranding:       false,
// //       whatsappIntegration:  false,
// //       apiAccess:            false,
// //     },
// //     {
// //       name:        "Basic",
// //       description: "3-month plan with expanded member capacity and all core tools.",
// //       interval:    "QUARTERLY" as const,
// //       price:       1000,
// //       sortOrder:   2,
// //       maxMembers:  200,
// //       maxTrainers: 5,
// //       attendanceTracking:   true,
// //       workoutPlans:         true,
// //       dietPlans:            true,
// //       classScheduling:      false,
// //       reportsAnalytics:     false,
// //       onlinePayments:       false,
// //       balanceSheet:         false,
// //       supplementManagement: false,
// //       customBranding:       false,
// //       whatsappIntegration:  false,
// //       apiAccess:            false,
// //     },
// //     {
// //       name:        "Standard",
// //       description: "6-month plan with online payments, balance sheet, and supplement management.",
// //       interval:    "HALF_YEARLY" as const,
// //       price:       2000,
// //       sortOrder:   3,
// //       maxMembers:  500,
// //       maxTrainers: 15,
// //       attendanceTracking:   true,
// //       workoutPlans:         true,
// //       dietPlans:            true,
// //       classScheduling:      true,
// //       reportsAnalytics:     true,
// //       onlinePayments:       true,
// //       balanceSheet:         true,
// //       supplementManagement: true,
// //       customBranding:       false,
// //       whatsappIntegration:  false,
// //       apiAccess:            false,
// //     },
// //     {
// //       name:        "Pro",
// //       description: "Annual plan with unlimited members and all Standard features.",
// //       interval:    "YEARLY" as const,
// //       price:       3000,
// //       sortOrder:   4,
// //       maxMembers:  null,   // unlimited
// //       maxTrainers: null,
// //       attendanceTracking:   true,
// //       workoutPlans:         true,
// //       dietPlans:            true,
// //       classScheduling:      true,
// //       reportsAnalytics:     true,
// //       onlinePayments:       true,
// //       balanceSheet:         true,
// //       supplementManagement: true,
// //       customBranding:       false,
// //       whatsappIntegration:  false,
// //       apiAccess:            false,
// //     },
// //     {
// //       name:        "Elite",
// //       description: "Annual plan with custom branding, WhatsApp integration, and all Pro features.",
// //       interval:    "YEARLY" as const,
// //       price:       4000,
// //       sortOrder:   5,
// //       maxMembers:  null,
// //       maxTrainers: null,
// //       attendanceTracking:   true,
// //       workoutPlans:         true,
// //       dietPlans:            true,
// //       classScheduling:      true,
// //       reportsAnalytics:     true,
// //       onlinePayments:       true,
// //       balanceSheet:         true,
// //       supplementManagement: true,
// //       customBranding:       true,
// //       whatsappIntegration:  true,
// //       apiAccess:            false,
// //     },
// //     {
// //       name:        "Lifetime",
// //       description: "One-time payment. Every Elite feature, forever. Never pay again.",
// //       interval:    "LIFETIME" as const,
// //       price:       10000,
// //       sortOrder:   6,
// //       maxMembers:  null,
// //       maxTrainers: null,
// //       attendanceTracking:   true,
// //       workoutPlans:         true,
// //       dietPlans:            true,
// //       classScheduling:      true,
// //       reportsAnalytics:     true,
// //       onlinePayments:       true,
// //       balanceSheet:         true,
// //       supplementManagement: true,
// //       customBranding:       true,
// //       whatsappIntegration:  true,
// //       apiAccess:            true,
// //     },
// //   ]

// //   console.log("Seeding SaaS plans...")
// //   for (const plan of plans) {
// //     await prisma.saasPlan.upsert({
// //       where:  { id: plan.name.toLowerCase() }, // stable ID by name
// //       update: plan,
// //       create: { id: plan.name.toLowerCase(), ...plan },
// //     })
// //     console.log(`  ✓ ${plan.name} — ₹${plan.price} / ${plan.interval}`)
// //   }
// //   console.log("Done.")
// // }

// // main().catch(console.error).finally(() => prisma.$disconnect())




// // prisma/seed-saas-plans.ts
// // Seeds the 5 subscription plans matching the spec exactly.
// // Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-saas-plans.ts

// import { PrismaClient } from "../src/generated/prisma"
// import { PrismaPg } from "@prisma/adapter-pg"
// import { Pool } from "pg"
// import * as dotenv from "dotenv"

// dotenv.config({ path: ".env" })

// const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
// const adapter = new PrismaPg(pool)
// const prisma = new PrismaClient({ adapter })


// // ── Shared feature flags per tier ─────────────────────────────────────────────
// const basicFeatures = {
//   attendanceTracking: true,
//   workoutPlans: true,
//   dietPlans: true,
//   classScheduling: false,
//   reportsAnalytics: true,
//   onlinePayments: true,
//   balanceSheet: true,
//   supplementManagement: false,
//   customBranding: false,
//   whatsappIntegration: false,
//   apiAccess: false,
// }

// const proFeatures = {
//   attendanceTracking: true,
//   workoutPlans: true,
//   dietPlans: true,
//   classScheduling: true,
//   reportsAnalytics: true,
//   onlinePayments: true,
//   balanceSheet: true,
//   supplementManagement: true,
//   customBranding: false,
//   whatsappIntegration: false,
//   apiAccess: false,
// }

// const enterpriseFeatures = {
//   attendanceTracking: true,
//   workoutPlans: true,
//   dietPlans: true,
//   classScheduling: true,
//   reportsAnalytics: true,
//   onlinePayments: true,
//   balanceSheet: true,
//   supplementManagement: true,
//   customBranding: true,
//   whatsappIntegration: true,
//   apiAccess: true,
// }

// async function main() {
//   const plans = [
//     // ── Free ──────────────────────────────────────────────────────────────────
//     {
//       id: "plan_free",
//       name: "Free",
//       description: "Try GymStack free for 1 month. Perfect for new gym owners.",
//       interval: "MONTHLY" as const,
//       price: 0,
//       sortOrder: 1,
//       maxGyms: 1,
//       maxMembers: null,
//       maxTrainers: null,
//       maxMembershipPlans: null,
//       maxNotificationsPerMonth: null,
//       maxClasses: null,
//       maxStorageGb: null,
//       attendanceTracking: true,
//       workoutPlans: false,
//       dietPlans: false,
//       classScheduling: false,
//       reportsAnalytics: true,
//       onlinePayments: false,
//       balanceSheet: false,
//       supplementManagement: false,
//       customBranding: false,
//       whatsappIntegration: false,
//       apiAccess: false,
//     },

//     // ── Basic (3 / 6 / 12 months) ─────────────────────────────────────────────
//     {
//       id: "plan_basic_3m",
//       name: "Basic",
//       description: "Core gym management for a single location.",
//       interval: "QUARTERLY" as const,
//       price: 999,
//       sortOrder: 2,
//       maxGyms: 1,
//       maxMembers: null,
//       maxTrainers: null,
//       maxMembershipPlans: null,
//       maxNotificationsPerMonth: null,
//       maxClasses: null,
//       maxStorageGb: null,
//       ...basicFeatures,
//     },
//     {
//       id: "plan_basic_6m",
//       name: "Basic",
//       description: "Core gym management for a single location.",
//       interval: "HALF_YEARLY" as const,
//       price: 1799,
//       sortOrder: 3,
//       maxGyms: 1,
//       maxMembers: null,
//       maxTrainers: null,
//       maxMembershipPlans: null,
//       maxNotificationsPerMonth: null,
//       maxClasses: null,
//       maxStorageGb: null,
//       ...basicFeatures,
//     },
//     {
//       id: "plan_basic_12m",
//       name: "Basic",
//       description: "Core gym management for a single location.",
//       interval: "YEARLY" as const,
//       price: 2999,
//       sortOrder: 4,
//       maxGyms: 1,
//       maxMembers: null,
//       maxTrainers: null,
//       maxMembershipPlans: null,
//       maxNotificationsPerMonth: null,
//       maxClasses: null,
//       maxStorageGb: null,
//       ...basicFeatures,
//     },

//     // ── Pro (3 / 6 / 12 months) ───────────────────────────────────────────────
//     {
//       id: "plan_pro_3m",
//       name: "Pro",
//       description: "Scale across multiple locations with full feature access.",
//       interval: "QUARTERLY" as const,
//       price: 1999,
//       sortOrder: 5,
//       maxGyms: 5,
//       maxMembers: null,
//       maxTrainers: null,
//       maxMembershipPlans: null,
//       maxNotificationsPerMonth: null,
//       maxClasses: null,
//       maxStorageGb: null,
//       ...proFeatures,
//     },
//     {
//       id: "plan_pro_6m",
//       name: "Pro",
//       description: "Scale across multiple locations with full feature access.",
//       interval: "HALF_YEARLY" as const,
//       price: 3499,
//       sortOrder: 6,
//       maxGyms: 5,
//       maxMembers: null,
//       maxTrainers: null,
//       maxMembershipPlans: null,
//       maxNotificationsPerMonth: null,
//       maxClasses: null,
//       maxStorageGb: null,
//       ...proFeatures,
//     },
//     {
//       id: "plan_pro_12m",
//       name: "Pro",
//       description: "Scale across multiple locations with full feature access.",
//       interval: "YEARLY" as const,
//       price: 5999,
//       sortOrder: 7,
//       maxGyms: 5,
//       maxMembers: null,
//       maxTrainers: null,
//       maxMembershipPlans: null,
//       maxNotificationsPerMonth: null,
//       maxClasses: null,
//       maxStorageGb: null,
//       ...proFeatures,
//     },

//     // ── Enterprise (3 / 6 / 12 months) ───────────────────────────────────────
//     {
//       id: "plan_enterprise_3m",
//       name: "Enterprise",
//       description: "Unlimited everything for large gym chains.",
//       interval: "QUARTERLY" as const,
//       price: 3999,
//       sortOrder: 8,
//       maxGyms: null,
//       maxMembers: null,
//       maxTrainers: null,
//       maxMembershipPlans: null,
//       maxNotificationsPerMonth: null,
//       maxClasses: null,
//       maxStorageGb: null,
//       ...enterpriseFeatures,
//     },
//     {
//       id: "plan_enterprise_6m",
//       name: "Enterprise",
//       description: "Unlimited everything for large gym chains.",
//       interval: "HALF_YEARLY" as const,
//       price: 6999,
//       sortOrder: 9,
//       maxGyms: null,
//       maxMembers: null,
//       maxTrainers: null,
//       maxMembershipPlans: null,
//       maxNotificationsPerMonth: null,
//       maxClasses: null,
//       maxStorageGb: null,
//       ...enterpriseFeatures,
//     },
//     {
//       id: "plan_enterprise_12m",
//       name: "Enterprise",
//       description: "Unlimited everything for large gym chains.",
//       interval: "YEARLY" as const,
//       price: 11999,
//       sortOrder: 10,
//       maxGyms: null,
//       maxMembers: null,
//       maxTrainers: null,
//       maxMembershipPlans: null,
//       maxNotificationsPerMonth: null,
//       maxClasses: null,
//       maxStorageGb: null,
//       ...enterpriseFeatures,
//     },
//   ]

//   console.log("Seeding SaaS plans (10-plan spec)...")
//   for (const plan of plans) {
//     await prisma.saasPlan.upsert({
//       where: { id: plan.id },
//       update: plan,
//       create: plan,
//     })
//     console.log(`  ✓ ${plan.name} — ₹${plan.price} / ${plan.interval}`)
//   }
//   console.log("Done.")
// }

// main().catch(console.error).finally(() => prisma.$disconnect())



// prisma/seed-saas-plans.ts
// Seeds the GymStack subscription plans matching the billing page exactly.
//
// Plans (10 records):
//   Free     — ₹0        / MONTHLY       (1-month free trial)
//   Basic    — ₹999      / QUARTERLY
//   Basic    — ₹1,799    / HALF_YEARLY
//   Basic    — ₹2,999    / YEARLY
//   Pro      — ₹1,999    / QUARTERLY
//   Pro      — ₹3,499    / HALF_YEARLY
//   Pro      — ₹5,999    / YEARLY
//   Enterprise — ₹3,999  / QUARTERLY
//   Enterprise — ₹6,999  / HALF_YEARLY
//   Enterprise — ₹11,999 / YEARLY
//
// Run:
//   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-saas-plans.ts
//
// Safe to re-run — uses upsert on stable IDs.

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const plans = [
  // ── FREE ─────────────────────────────────────────────────────────────────
  {
    id:          "plan_free",
    name:        "Free",
    description: "Try GymStack free for 1 month. Everything you need to get started.",
    interval:    "MONTHLY" as const,
    price:       0,
    sortOrder:   1,
    // Limits
    maxGyms:                  1,
    maxMembers:               null,    // unlimited
    maxTrainers:              null,    // unlimited
    maxMembershipPlans:       null,
    maxNotificationsPerMonth: null,
    maxClasses:               null,
    maxStorageGb:             null,
    // Features — same as Basic but time-limited
    attendanceTracking:   true,
    workoutPlans:         false,
    dietPlans:            false,
    classScheduling:      false,
    reportsAnalytics:     true,
    onlinePayments:       false,
    balanceSheet:         false,
    supplementManagement: false,
    customBranding:       false,
    whatsappIntegration:  false,
    apiAccess:            false,
  },

  // ── BASIC — 3 months ─────────────────────────────────────────────────────
  {
    id:          "plan_basic_quarterly",
    name:        "Basic",
    description: "Everything you need to run one gym.",
    interval:    "QUARTERLY" as const,
    price:       999,
    sortOrder:   10,
    maxGyms:                  1,
    maxMembers:               null,
    maxTrainers:              null,
    maxMembershipPlans:       null,
    maxNotificationsPerMonth: null,
    maxClasses:               null,
    maxStorageGb:             null,
    attendanceTracking:   true,
    workoutPlans:         false,
    dietPlans:            false,
    classScheduling:      false,
    reportsAnalytics:     true,
    onlinePayments:       false,
    balanceSheet:         false,
    supplementManagement: false,
    customBranding:       false,
    whatsappIntegration:  false,
    apiAccess:            false,
  },

  // ── BASIC — 6 months ─────────────────────────────────────────────────────
  {
    id:          "plan_basic_halfyearly",
    name:        "Basic",
    description: "Everything you need to run one gym.",
    interval:    "HALF_YEARLY" as const,
    price:       1649,
    sortOrder:   11,
    maxGyms:                  1,
    maxMembers:               null,
    maxTrainers:              null,
    maxMembershipPlans:       null,
    maxNotificationsPerMonth: null,
    maxClasses:               null,
    maxStorageGb:             null,
    attendanceTracking:   true,
    workoutPlans:         false,
    dietPlans:            false,
    classScheduling:      false,
    reportsAnalytics:     true,
    onlinePayments:       false,
    balanceSheet:         false,
    supplementManagement: false,
    customBranding:       false,
    whatsappIntegration:  false,
    apiAccess:            false,
  },

  // ── BASIC — 12 months ────────────────────────────────────────────────────
  {
    id:          "plan_basic_yearly",
    name:        "Basic",
    description: "Everything you need to run one gym.",
    interval:    "YEARLY" as const,
    price:       2999,
    sortOrder:   12,
    maxGyms:                  1,
    maxMembers:               null,
    maxTrainers:              null,
    maxMembershipPlans:       null,
    maxNotificationsPerMonth: null,
    maxClasses:               null,
    maxStorageGb:             null,
    attendanceTracking:   true,
    workoutPlans:         false,
    dietPlans:            false,
    classScheduling:      false,
    reportsAnalytics:     true,
    onlinePayments:       false,
    balanceSheet:         false,
    supplementManagement: false,
    customBranding:       false,
    whatsappIntegration:  false,
    apiAccess:            false,
  },

  // ── PRO — 3 months ───────────────────────────────────────────────────────
  {
    id:          "plan_pro_quarterly",
    name:        "Pro",
    description: "Scale with full features — workouts, diet, supplements, payments and more.",
    interval:    "QUARTERLY" as const,
    price:       1499,
    sortOrder:   20,
    maxGyms:                  1,
    maxMembers:               null,
    maxTrainers:              null,
    maxMembershipPlans:       null,
    maxNotificationsPerMonth: null,
    maxClasses:               null,
    maxStorageGb:             null,
    attendanceTracking:   true,
    workoutPlans:         true,
    dietPlans:            true,
    classScheduling:      false,
    reportsAnalytics:     true,
    onlinePayments:       true,
    balanceSheet:         true,
    supplementManagement: true,
    customBranding:       false,
    whatsappIntegration:  false,
    apiAccess:            false,
  },

  // ── PRO — 6 months ───────────────────────────────────────────────────────
  {
    id:          "plan_pro_halfyearly",
    name:        "Pro",
    description: "Scale with full features — workouts, diet, supplements, payments and more.",
    interval:    "HALF_YEARLY" as const,
    price:       2499,
    sortOrder:   21,
    maxGyms:                  1,
    maxMembers:               null,
    maxTrainers:              null,
    maxMembershipPlans:       null,
    maxNotificationsPerMonth: null,
    maxClasses:               null,
    maxStorageGb:             null,
    attendanceTracking:   true,
    workoutPlans:         true,
    dietPlans:            true,
    classScheduling:      false,
    reportsAnalytics:     true,
    onlinePayments:       true,
    balanceSheet:         true,
    supplementManagement: true,
    customBranding:       false,
    whatsappIntegration:  false,
    apiAccess:            false,
  },

  // ── PRO — 12 months ──────────────────────────────────────────────────────
  {
    id:          "plan_pro_yearly",
    name:        "Pro",
    description: "Scale with full features — workouts, diet, supplements, payments and more.",
    interval:    "YEARLY" as const,
    price:       4499,
    sortOrder:   22,
    maxGyms:                  1,
    maxMembers:               null,
    maxTrainers:              null,
    maxMembershipPlans:       null,
    maxNotificationsPerMonth: null,
    maxClasses:               null,
    maxStorageGb:             null,
    attendanceTracking:   true,
    workoutPlans:         true,
    dietPlans:            true,
    classScheduling:      false,
    reportsAnalytics:     true,
    onlinePayments:       true,
    balanceSheet:         true,
    supplementManagement: true,
    customBranding:       false,
    whatsappIntegration:  false,
    apiAccess:            false,
  },

  // ── ENTERPRISE — 3 months ────────────────────────────────────────────────
  {
    id:          "plan_enterprise_quarterly",
    name:        "Enterprise",
    description: "For large chains — up to 5 gyms, AI plans, custom integrations.",
    interval:    "QUARTERLY" as const,
    price:       2999,
    sortOrder:   30,
    maxGyms:                  5,
    maxMembers:               null,
    maxTrainers:              null,
    maxMembershipPlans:       null,
    maxNotificationsPerMonth: null,
    maxClasses:               null,
    maxStorageGb:             null,
    attendanceTracking:   true,
    workoutPlans:         true,
    dietPlans:            true,
    classScheduling:      true,
    reportsAnalytics:     true,
    onlinePayments:       true,
    balanceSheet:         true,
    supplementManagement: true,
    customBranding:       true,
    whatsappIntegration:  false,
    apiAccess:            true,
  },

  // ── ENTERPRISE — 6 months ────────────────────────────────────────────────
  {
    id:          "plan_enterprise_halfyearly",
    name:        "Enterprise",
    description: "For large chains — up to 5 gyms, AI plans, custom integrations.",
    interval:    "HALF_YEARLY" as const,
    price:       4999,
    sortOrder:   31,
    maxGyms:                  5,
    maxMembers:               null,
    maxTrainers:              null,
    maxMembershipPlans:       null,
    maxNotificationsPerMonth: null,
    maxClasses:               null,
    maxStorageGb:             null,
    attendanceTracking:   true,
    workoutPlans:         true,
    dietPlans:            true,
    classScheduling:      true,
    reportsAnalytics:     true,
    onlinePayments:       true,
    balanceSheet:         true,
    supplementManagement: true,
    customBranding:       true,
    whatsappIntegration:  false,
    apiAccess:            true,
  },

  // ── ENTERPRISE — 12 months ───────────────────────────────────────────────
  {
    id:          "plan_enterprise_yearly",
    name:        "Enterprise",
    description: "For large chains — up to 5 gyms, AI plans, custom integrations.",
    interval:    "YEARLY" as const,
    price:       8999,
    sortOrder:   32,
    maxGyms:                  5,
    maxMembers:               null,
    maxTrainers:              null,
    maxMembershipPlans:       null,
    maxNotificationsPerMonth: null,
    maxClasses:               null,
    maxStorageGb:             null,
    attendanceTracking:   true,
    workoutPlans:         true,
    dietPlans:            true,
    classScheduling:      true,
    reportsAnalytics:     true,
    onlinePayments:       true,
    balanceSheet:         true,
    supplementManagement: true,
    customBranding:       true,
    whatsappIntegration:  false,
    apiAccess:            true,
  },
]

async function main() {
  console.log("Seeding GymStack SaaS plans (10 records)…\n")

  for (const plan of plans) {
    await prisma.saasPlan.upsert({
      where:  { id: plan.id },
      update: plan,
      create: plan,
    })
    console.log(`  ✓  ${plan.name.padEnd(12)} ${plan.interval.padEnd(14)} ₹${String(plan.price).padStart(6)}`)
  }

  // Deactivate the old plan IDs that no longer exist in the billing page
  const oldIds = ["plan_free_trial", "plan_starter", "plan_growth", "plan_pro", "plan_lifetime"]
  const deactivated = await prisma.saasPlan.updateMany({
    where: { id: { in: oldIds } },
    data:  { isActive: false },
  })
  if (deactivated.count > 0) {
    console.log(`\n  ⚠  Deactivated ${deactivated.count} old plan record(s) (Free Trial / Starter / Growth / Lifetime)`)
    console.log("     Existing subscriptions on those plans are NOT affected.")
  }

  console.log("\nDone. Run the assign-test-plan script to subscribe an owner for testing.")
}

main().catch(console.error).finally(() => prisma.$disconnect())