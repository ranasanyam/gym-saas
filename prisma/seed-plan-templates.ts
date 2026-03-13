// prisma/seed-plan-templates.ts
// Run: npx tsx prisma/seed-plan-templates.ts
import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import * as dotenv from "dotenv"
dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

const WORKOUT_TEMPLATES = [
  {
    type: "WORKOUT", title: "Beginner Full Body (3 Days)", goal: "Build strength & habit",
    difficulty: "BEGINNER", isGlobal: true,
    planData: {
      Mon: [
        { name: "Bodyweight Squats", sets: "3", reps: "15", duration: "", notes: "Keep chest up" },
        { name: "Push-Ups", sets: "3", reps: "10", duration: "", notes: "Modify on knees if needed" },
        { name: "Plank", sets: "3", reps: "", duration: "30s", notes: "" },
      ],
      Wed: [
        { name: "Lunges", sets: "3", reps: "12", duration: "", notes: "Each leg" },
        { name: "Dumbbell Rows", sets: "3", reps: "12", duration: "", notes: "Each arm" },
        { name: "Glute Bridge", sets: "3", reps: "15", duration: "", notes: "" },
      ],
      Fri: [
        { name: "Deadlift (light)", sets: "3", reps: "10", duration: "", notes: "Focus on form" },
        { name: "Shoulder Press", sets: "3", reps: "12", duration: "", notes: "" },
        { name: "Bicycle Crunches", sets: "3", reps: "20", duration: "", notes: "" },
      ],
    },
  },
  {
    type: "WORKOUT", title: "Weight Loss HIIT (5 Days)", goal: "Fat loss",
    difficulty: "INTERMEDIATE", isGlobal: true,
    planData: {
      Mon: [
        { name: "Jump Squats", sets: "4", reps: "15", duration: "", notes: "Land softly" },
        { name: "Burpees", sets: "4", reps: "10", duration: "", notes: "" },
        { name: "Mountain Climbers", sets: "4", reps: "", duration: "30s", notes: "" },
        { name: "Jump Rope", sets: "3", reps: "", duration: "1min", notes: "" },
      ],
      Tue: [
        { name: "Treadmill Intervals", sets: "8", reps: "", duration: "1min fast / 1min walk", notes: "" },
        { name: "Box Jumps", sets: "4", reps: "10", duration: "", notes: "" },
      ],
      Wed: [
        { name: "Upper Body Circuit", sets: "3", reps: "15", duration: "", notes: "Push-ups, rows, shoulder press" },
        { name: "Core Circuit", sets: "3", reps: "", duration: "45s each", notes: "Plank, side plank, crunches" },
      ],
      Thu: [
        { name: "Cycling / Rowing", sets: "1", reps: "", duration: "30min", notes: "Moderate intensity" },
      ],
      Fri: [
        { name: "Full Body HIIT", sets: "5", reps: "", duration: "40s on / 20s off", notes: "6 exercises in circuit" },
      ],
    },
  },
  {
    type: "WORKOUT", title: "Muscle Building (6 Days PPL)", goal: "Muscle gain",
    difficulty: "ADVANCED", isGlobal: true,
    planData: {
      Mon: [
        { name: "Bench Press", sets: "4", reps: "8-10", duration: "", notes: "Warm up first" },
        { name: "Incline DB Press", sets: "3", reps: "10-12", duration: "", notes: "" },
        { name: "Cable Flyes", sets: "3", reps: "12-15", duration: "", notes: "" },
        { name: "Tricep Pushdowns", sets: "3", reps: "12", duration: "", notes: "" },
        { name: "Overhead Tricep Extension", sets: "3", reps: "12", duration: "", notes: "" },
      ],
      Tue: [
        { name: "Deadlift", sets: "4", reps: "5-6", duration: "", notes: "Heavy" },
        { name: "Barbell Rows", sets: "4", reps: "8-10", duration: "", notes: "" },
        { name: "Pull-Ups / Lat Pulldown", sets: "3", reps: "10-12", duration: "", notes: "" },
        { name: "Barbell Curls", sets: "3", reps: "12", duration: "", notes: "" },
        { name: "Hammer Curls", sets: "3", reps: "12", duration: "", notes: "" },
      ],
      Wed: [
        { name: "Barbell Squats", sets: "4", reps: "8-10", duration: "", notes: "" },
        { name: "Leg Press", sets: "3", reps: "12-15", duration: "", notes: "" },
        { name: "Romanian Deadlift", sets: "3", reps: "10-12", duration: "", notes: "" },
        { name: "Leg Curls", sets: "3", reps: "12-15", duration: "", notes: "" },
        { name: "Calf Raises", sets: "4", reps: "15-20", duration: "", notes: "" },
      ],
      Thu: [
        { name: "Overhead Press", sets: "4", reps: "8-10", duration: "", notes: "" },
        { name: "Lateral Raises", sets: "4", reps: "15-20", duration: "", notes: "" },
        { name: "Face Pulls", sets: "3", reps: "15", duration: "", notes: "" },
        { name: "Tricep Dips", sets: "3", reps: "12", duration: "", notes: "" },
      ],
      Fri: [
        { name: "Incline Barbell Press", sets: "4", reps: "8-10", duration: "", notes: "" },
        { name: "T-Bar Rows", sets: "4", reps: "8-10", duration: "", notes: "" },
        { name: "Seated Cable Rows", sets: "3", reps: "12", duration: "", notes: "" },
        { name: "Preacher Curls", sets: "3", reps: "12", duration: "", notes: "" },
      ],
      Sat: [
        { name: "Front Squats", sets: "4", reps: "8-10", duration: "", notes: "" },
        { name: "Hack Squats", sets: "3", reps: "12", duration: "", notes: "" },
        { name: "Leg Extensions", sets: "3", reps: "15", duration: "", notes: "" },
        { name: "Standing Calf Raises", sets: "5", reps: "20", duration: "", notes: "" },
      ],
    },
  },
]

const DIET_TEMPLATES = [
  {
    type: "DIET", title: "High-Protein Muscle Gain", goal: "Muscle gain",
    isGlobal: true, difficulty: null,
    planData: {
      "Monday__Breakfast":   [
        { name: "Oats", quantity: "80g", calories: "300", protein: "10g", carbs: "55g", fat: "6g" },
        { name: "Whole Eggs", quantity: "3", calories: "210", protein: "18g", carbs: "2g", fat: "15g" },
        { name: "Banana", quantity: "1 medium", calories: "90", protein: "1g", carbs: "23g", fat: "0g" },
      ],
      "Monday__Lunch": [
        { name: "Chicken Breast", quantity: "200g", calories: "330", protein: "62g", carbs: "0g", fat: "7g" },
        { name: "Brown Rice", quantity: "100g (dry)", calories: "370", protein: "8g", carbs: "77g", fat: "3g" },
        { name: "Broccoli", quantity: "150g", calories: "51", protein: "4g", carbs: "10g", fat: "1g" },
      ],
      "Monday__Dinner": [
        { name: "Salmon", quantity: "200g", calories: "412", protein: "40g", carbs: "0g", fat: "27g" },
        { name: "Sweet Potato", quantity: "200g", calories: "172", protein: "3g", carbs: "40g", fat: "0g" },
        { name: "Mixed Salad", quantity: "100g", calories: "20", protein: "2g", carbs: "3g", fat: "0g" },
      ],
      "Monday__Post-Workout": [
        { name: "Whey Protein Shake", quantity: "1 scoop (30g)", calories: "120", protein: "25g", carbs: "5g", fat: "2g" },
        { name: "Banana", quantity: "1", calories: "90", protein: "1g", carbs: "23g", fat: "0g" },
      ],
    },
  },
  {
    type: "DIET", title: "Fat Loss Deficit Plan (1800 kcal)", goal: "Weight loss",
    isGlobal: true, difficulty: null,
    planData: {
      "Monday__Breakfast": [
        { name: "Greek Yogurt", quantity: "200g", calories: "130", protein: "17g", carbs: "10g", fat: "3g" },
        { name: "Mixed Berries", quantity: "100g", calories: "50", protein: "1g", carbs: "12g", fat: "0g" },
        { name: "Almonds", quantity: "15g", calories: "88", protein: "3g", carbs: "3g", fat: "8g" },
      ],
      "Monday__Lunch": [
        { name: "Grilled Chicken", quantity: "150g", calories: "247", protein: "46g", carbs: "0g", fat: "5g" },
        { name: "Quinoa", quantity: "80g (dry)", calories: "290", protein: "11g", carbs: "52g", fat: "5g" },
        { name: "Spinach Salad", quantity: "100g", calories: "23", protein: "3g", carbs: "4g", fat: "0g" },
      ],
      "Monday__Evening Snack": [
        { name: "Apple", quantity: "1 medium", calories: "95", protein: "0g", carbs: "25g", fat: "0g" },
        { name: "Boiled Egg", quantity: "1", calories: "78", protein: "6g", carbs: "0g", fat: "5g" },
      ],
      "Monday__Dinner": [
        { name: "Baked Fish (Rohu/Tilapia)", quantity: "200g", calories: "218", protein: "45g", carbs: "0g", fat: "4g" },
        { name: "Steamed Vegetables", quantity: "200g", calories: "70", protein: "4g", carbs: "15g", fat: "0g" },
        { name: "1 Chapati", quantity: "1 medium", calories: "120", protein: "4g", carbs: "25g", fat: "1g" },
      ],
    },
  },
]

async function main() {
  // We need a system profile to attribute templates to. Use the first owner profile.
  const systemProfile = await prisma.profile.findFirst({ where: { role: "owner" }, select: { id: true } })
  if (!systemProfile) {
    console.log("No owner profile found. Create an owner account first, then run this seed.")
    return
  }

  const allTemplates = [...WORKOUT_TEMPLATES, ...DIET_TEMPLATES]
  let created = 0, skipped = 0

  for (const t of allTemplates) {
    const exists = await prisma.planTemplate.findFirst({ where: { title: t.title, isGlobal: true } })
    if (exists) { skipped++; continue }
    await prisma.planTemplate.create({
      data: {
        createdById: systemProfile.id,
        ownerGymId:  null,
        type:        t.type,
        title:       t.title,
        goal:        t.goal,
        difficulty:  t.difficulty ?? null,
        planData:    t.planData,
        isGlobal:    t.isGlobal,
      },
    })
    created++
  }

  console.log(`✅ Plan templates seeded: ${created} created, ${skipped} already existed.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())