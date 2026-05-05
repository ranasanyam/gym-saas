// prisma/fix-active-plans.ts
// One-time migration: for each member, ensure only the most recently assigned
// diet plan and workout plan have isActive = true. All older ones get isActive = false.
//
// Run with:  npx ts-node --project tsconfig.json prisma/fix-active-plans.ts

import { PrismaClient } from "../src/generated/prisma"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting active-plan migration...")

  // ── Diet Plans ──────────────────────────────────────────────────────────────

  // Get all unique member IDs that have at least one assigned diet plan
  const dietMemberIds = await prisma.dietPlan.groupBy({
    by: ["assignedToMemberId"],
    where: { assignedToMemberId: { not: null } },
  })

  let dietFixed = 0
  for (const row of dietMemberIds) {
    const memberId = row.assignedToMemberId!

    // Find the most recently assigned plan for this member
    const plans = await prisma.dietPlan.findMany({
      where:   { assignedToMemberId: memberId },
      orderBy: { createdAt: "desc" },
      select:  { id: true },
    })

    if (plans.length <= 1) continue  // Nothing to fix

    const [newestPlan, ...olderPlans] = plans

    // Set oldest plans to inactive
    await prisma.dietPlan.updateMany({
      where: { id: { in: olderPlans.map(p => p.id) } },
      data:  { isActive: false },
    })
    // Ensure newest is active
    await prisma.dietPlan.update({
      where: { id: newestPlan.id },
      data:  { isActive: true },
    })

    dietFixed++
  }

  console.log(`Diet plans fixed for ${dietFixed} members.`)

  // ── Workout Plans ───────────────────────────────────────────────────────────

  const workoutMemberIds = await prisma.workoutPlan.groupBy({
    by: ["assignedToMemberId"],
    where: { assignedToMemberId: { not: null } },
  })

  let workoutFixed = 0
  for (const row of workoutMemberIds) {
    const memberId = row.assignedToMemberId!

    const plans = await prisma.workoutPlan.findMany({
      where:   { assignedToMemberId: memberId },
      orderBy: { createdAt: "desc" },
      select:  { id: true },
    })

    if (plans.length <= 1) continue

    const [newestPlan, ...olderPlans] = plans

    await prisma.workoutPlan.updateMany({
      where: { id: { in: olderPlans.map(p => p.id) } },
      data:  { isActive: false },
    })
    await prisma.workoutPlan.update({
      where: { id: newestPlan.id },
      data:  { isActive: true },
    })

    workoutFixed++
  }

  console.log(`Workout plans fixed for ${workoutFixed} members.`)
  console.log("Migration complete.")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
