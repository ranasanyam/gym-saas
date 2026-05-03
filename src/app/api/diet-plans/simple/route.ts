// src/app/api/diet-plans/simple/route.ts
// Accessible by owner and trainer roles. Creates a diet plan with daily meals
// and assigns it to the specified member.
import { NextRequest, NextResponse } from "next/server"
import { resolveAuth } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

interface SimpleMeal {
  name: string
  scheduledTime?: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  foods?: string[]
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export async function POST(req: NextRequest) {
  const auth = await resolveAuth(req)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role, profileId } = auth
  if (role !== "owner" && role !== "trainer") {
    return NextResponse.json({ error: "Only owners and trainers can create diet plans" }, { status: 403 })
  }

  let body: {
    memberId?: string
    gymId?: string
    name?: string
    meals?: SimpleMeal[]
  }
  try { body = await req.json() } catch { body = {} }

  const { memberId, gymId, name, meals } = body
  if (!memberId || !gymId || !name || !meals?.length) {
    return NextResponse.json({
      error: "memberId, gymId, name, and meals[] are required",
    }, { status: 400 })
  }

  // Verify the member exists and belongs to the gym
  const member = await prisma.gymMember.findFirst({
    where: { id: memberId, gymId },
    select: { id: true, gymId: true, profileId: true },
  })
  if (!member) {
    return NextResponse.json({ error: "Member not found in this gym" }, { status: 404 })
  }

  // For trainer: verify they belong to this gym
  if (role === "trainer") {
    const trainer = await prisma.gymTrainer.findFirst({
      where: { profileId, gymId },
      select: { id: true },
    })
    if (!trainer) {
      return NextResponse.json({ error: "You are not a trainer in this gym" }, { status: 403 })
    }
  }

  // For owner: verify they own this gym
  if (role === "owner") {
    const gym = await prisma.gym.findFirst({
      where: { id: gymId, ownerId: profileId },
      select: { id: true },
    })
    if (!gym) {
      return NextResponse.json({ error: "Gym not found or not yours" }, { status: 403 })
    }
  }

  // Build planData: repeat the same meals across all 7 days
  const planData: Record<string, any[]> = {}
  for (const day of DAYS) {
    for (const meal of meals) {
      const key = `${day}__${meal.name}`
      planData[key] = [{
        name:          meal.name,
        scheduledTime: meal.scheduledTime ?? null,
        calories:      meal.calories      ?? 0,
        protein_g:     meal.protein_g     ?? 0,
        carbs_g:       meal.carbs_g       ?? 0,
        fat_g:         meal.fat_g         ?? 0,
        foods:         meal.foods         ?? [],
      }]
    }
  }

  // Compute plan-level macro targets (daily totals × 7 / 7 = daily)
  const totalCalories  = meals.reduce((s, m) => s + (m.calories  ?? 0), 0)
  const totalProtein   = meals.reduce((s, m) => s + (m.protein_g ?? 0), 0)
  const totalCarbs     = meals.reduce((s, m) => s + (m.carbs_g   ?? 0), 0)
  const totalFat       = meals.reduce((s, m) => s + (m.fat_g     ?? 0), 0)

  // Deactivate any existing active diet plans for this member
  await prisma.dietPlan.updateMany({
    where: { assignedToMemberId: memberId, isActive: true },
    data:  { isActive: false },
  })

  const plan = await prisma.dietPlan.create({
    data: {
      gymId,
      createdBy:          profileId,
      assignedToMemberId: memberId,
      title:              name,
      caloriesTarget:     totalCalories,
      proteinG:           totalProtein,
      carbsG:             totalCarbs,
      fatG:               totalFat,
      planData,
      isActive:           true,
    },
  })

  // Notify the member
  try {
    await prisma.notification.create({
      data: {
        gymId,
        profileId: member.profileId,
        title:     "🥗 New Diet Plan Assigned",
        message:   `You have been assigned a new diet plan: "${name}"`,
        type:      "PLAN_UPDATE",
      },
    })
  } catch {}

  return NextResponse.json({ success: true, data: plan }, { status: 201 })
}
