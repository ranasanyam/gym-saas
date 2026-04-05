// prisma/assign-test-plan.ts
// Manually assigns a SaaS plan to an owner for testing — bypasses Razorpay entirely.
//
// Usage:
//   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/assign-test-plan.ts \
//     --email owner@example.com \
//     --plan  pro \
//     --interval YEARLY
//
// --plan options:    free | basic | pro | enterprise
// --interval options: MONTHLY | QUARTERLY | HALF_YEARLY | YEARLY
//   (MONTHLY only exists for "free" plan)
//
// Examples:
//   Assign Pro yearly to yourself:
//     ... --email you@gmail.com --plan pro --interval YEARLY
//
//   Activate the free plan for testing:
//     ... --email you@gmail.com --plan free --interval MONTHLY
//
//   Give Enterprise 6-month access:
//     ... --email you@gmail.com --plan enterprise --interval HALF_YEARLY

import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg }     from "@prisma/adapter-pg"
import { Pool }          from "pg"
import { addMonths }     from "date-fns"
import * as dotenv       from "dotenv"

dotenv.config({ path: ".env" })

const pool    = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

// ── Parse CLI args ────────────────────────────────────────────────────────────
function getArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : undefined
}

const email    = getArg("--email")
const planKey  = (getArg("--plan")     ?? "pro").toLowerCase()
const interval = (getArg("--interval") ?? "YEARLY").toUpperCase()

const INTERVAL_MONTHS: Record<string, number | null> = {
  MONTHLY:     1,
  QUARTERLY:   3,
  HALF_YEARLY: 6,
  YEARLY:      12,
  LIFETIME:    null,
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!email) {
    console.error("Error: --email is required")
    console.error("Usage: ts-node assign-test-plan.ts --email owner@example.com --plan pro --interval YEARLY")
    process.exit(1)
  }

  if (!(interval in INTERVAL_MONTHS)) {
    console.error(`Error: unknown interval "${interval}". Valid: MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY`)
    process.exit(1)
  }

  // 1. Find the owner's profile
  const profile = await prisma.profile.findUnique({
    where:  { email: email.toLowerCase().trim() },
    select: { id: true, fullName: true, role: true },
  })

  if (!profile) {
    console.error(`No profile found for email: ${email}`)
    process.exit(1)
  }

  if (profile.role !== "owner") {
    console.warn(`Warning: profile role is "${profile.role}" (not "owner"). Proceeding anyway.`)
  }

  console.log(`\nProfile found: ${profile.fullName} (${email})`)

  // 2. Find the plan
  const plan = await prisma.saasPlan.findFirst({
    where: {
      name:     { contains: planKey, mode: "insensitive" },
      interval: interval as any,
      isActive: true,
    },
  })

  if (!plan) {
    console.error(`No active plan found matching name="${planKey}" interval="${interval}"`)
    console.error("Run seed-saas-plans.ts first to create the plans.")

    // Show available plans to help debug
    const available = await prisma.saasPlan.findMany({
      where:   { isActive: true },
      select:  { name: true, interval: true, price: true },
      orderBy: { sortOrder: "asc" },
    })
    if (available.length > 0) {
      console.log("\nAvailable active plans:")
      available.forEach(p => console.log(`  ${p.name.padEnd(14)} ${p.interval.padEnd(14)} ₹${p.price}`))
    }
    process.exit(1)
  }

  console.log(`Plan found: ${plan.name} / ${plan.interval} — ₹${plan.price}`)

  // 3. Cancel any existing active subscription
  const cancelled = await prisma.saasSubscription.updateMany({
    where: {
      profileId: profile.id,
      status:    { in: ["ACTIVE", "TRIALING", "LIFETIME"] },
    },
    data: { status: "CANCELLED" },
  })
  if (cancelled.count > 0) {
    console.log(`Cancelled ${cancelled.count} existing subscription(s).`)
  }

  // 4. Create new subscription
  const now      = new Date()
  const months   = INTERVAL_MONTHS[interval]
  const periodEnd = months !== null ? addMonths(now, months) : null
  const isLifetime = interval === "LIFETIME"
  const status   = isLifetime ? "LIFETIME" : "ACTIVE"

  const sub = await prisma.saasSubscription.create({
    data: {
      profileId:          profile.id,
      saasPlanId:         plan.id,
      status,
      currentPeriodStart: now,
      currentPeriodEnd:   periodEnd,
      trialEndsAt:        null,
    },
    include: { saasPlan: true },
  })

  // 5. Record a ₹0 test payment so the payment history isn't empty
  await prisma.saasPayment.create({
    data: {
      profileId:      profile.id,
      subscriptionId: sub.id,
      amount:         0,
      discountAmount: 0,
      finalAmount:    0,
      currency:       "INR",
      status:         "COMPLETED",
      razorpayPaymentId: null,
      razorpayOrderId:   null,
    },
  })

  const expiryStr = periodEnd
    ? periodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Never (Lifetime)"

  console.log(`
✅  Subscription activated!
    Owner  : ${profile.fullName} (${email})
    Plan   : ${plan.name} — ${plan.interval}
    Status : ${status}
    Expires: ${expiryStr}
    Sub ID : ${sub.id}

You can now log in as this owner and all plan features will be active.
`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
}).finally(() => prisma.$disconnect())