// src/services/aiPlanGenerator.ts
// LangChain + Google Gemini plan generation service.
// Generates structured diet or workout plans as JSON matching the existing planData schema.

import { ChatGroq } from "@langchain/groq"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { JsonOutputParser } from "@langchain/core/output_parsers"

const DAYS_FULL  = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DietPlanInputs {
  age: number
  gender: string
  heightCm: number
  weightKg: number
  goal: string              // "weight loss" | "muscle gain" | "maintenance"
  activityLevel: string     // "sedentary" | "lightly active" | "moderately active" | "very active"
  dietaryPreference: string // "vegan" | "vegetarian" | "non-vegetarian"
  allergies?: string        // comma-separated
  mealsPerDay: number       // 3 | 4 | 5
}

export interface WorkoutPlanInputs {
  age: number
  gender: string
  fitnessLevel: string     // "beginner" | "intermediate" | "advanced"
  goal: string             // "weight loss" | "muscle gain" | "strength" | "endurance"
  daysPerWeek: number      // 3-6
  availableEquipment: string // "gym" | "home" | "bodyweight only"
  currentInjuries?: string
}

export interface GeneratedDietPlan {
  title: string
  description: string
  caloriesTarget: number
  proteinG: number
  carbsG: number
  fatG: number
  planData: Record<string, Array<{
    name: string
    scheduledTime: string
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    foods: string[]
  }>>
}

export interface GeneratedWorkoutPlan {
  title: string
  description: string
  goal: string
  difficulty: string
  durationWeeks: number
  planData: Record<string, Array<{
    name: string
    sets?: number
    reps?: number
    duration?: number
    notes?: string
  }>>
}

// ── Shared model factory ──────────────────────────────────────────────────────

function getModel() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("GROQ_API_KEY is not set")
  return new ChatGroq({
    model:       "llama-3.3-70b-versatile",
    apiKey,
    temperature: 0.3,
    maxTokens:   8192,
  })
}

// ── Diet Plan Generator ────────────────────────────────────────────────────────

const DIET_SYSTEM_PROMPT = `You are an expert sports nutritionist and dietitian. Generate a personalized 7-day repeating daily meal plan based on the user's profile.

CRITICAL: Return ONLY valid JSON — no markdown, no explanation, no extra text.

The JSON must follow this exact structure:
{{
  "title": "Personalized Diet Plan for [Goal]",
  "description": "Brief 1-2 sentence description of this plan and its approach",
  "caloriesTarget": <daily calorie target as integer>,
  "proteinG": <daily protein grams as number>,
  "carbsG": <daily carbs grams as number>,
  "fatG": <daily fat grams as number>,
  "planData": {{
    "Monday__Breakfast": [
      {{
        "name": "Breakfast",
        "scheduledTime": "08:00",
        "calories": <integer>,
        "protein_g": <number>,
        "carbs_g": <number>,
        "fat_g": <number>,
        "foods": ["food1", "food2", "food3"]
      }}
    ],
    "Monday__Lunch": [...],
    "Monday__Dinner": [...],
    "Tuesday__Breakfast": [...],
    ... (all 7 days, all meals per day)
  }}
}}

Rules:
- Include exactly {mealsPerDay} meals per day named appropriately (e.g. Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner)
- Keys format: "DayName__MealName" (e.g. "Monday__Breakfast", "Tuesday__Lunch")
- All 7 days must be present: Monday through Sunday
- Vary meals across days for nutritional diversity
- scheduledTime format: "HH:MM" (24-hour)
- Respect dietary preferences and allergies strictly
- Macros should be realistic and sum approximately to daily targets
- foods array should list 2-6 specific food items with exact quantities, formatted as "Food name - quantity" (e.g., "Oats - 80g", "Milk - 200ml", "Banana - 1 medium (120g)", "Chicken breast - 150g grilled", "Brown rice - 1 cup cooked (180g)")`

const DIET_HUMAN_PROMPT = `Generate a personalized diet plan for:
- Age: {age} years
- Gender: {gender}
- Height: {heightCm} cm
- Weight: {weightKg} kg
- Goal: {goal}
- Activity Level: {activityLevel}
- Dietary Preference: {dietaryPreference}
- Allergies/Restrictions: {allergies}
- Meals per day: {mealsPerDay}`

export async function generateDietPlan(inputs: DietPlanInputs): Promise<GeneratedDietPlan> {
  const model  = getModel()
  const parser = new JsonOutputParser<GeneratedDietPlan>()

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", DIET_SYSTEM_PROMPT],
    ["human",  DIET_HUMAN_PROMPT],
  ])

  const chain = prompt.pipe(model).pipe(parser)

  const result = await chain.invoke({
    mealsPerDay:        inputs.mealsPerDay,
    age:                inputs.age,
    gender:             inputs.gender,
    heightCm:           inputs.heightCm,
    weightKg:           inputs.weightKg,
    goal:               inputs.goal,
    activityLevel:      inputs.activityLevel,
    dietaryPreference:  inputs.dietaryPreference,
    allergies:          inputs.allergies || "None",
  })

  if (!result.planData || typeof result.planData !== "object") {
    throw new Error("AI returned invalid diet plan structure")
  }

  return result
}

// ── Workout Plan Generator ─────────────────────────────────────────────────────

const WORKOUT_SYSTEM_PROMPT = `You are an expert personal trainer and strength & conditioning coach. Generate a personalized weekly workout plan based on the user's profile.

CRITICAL: Return ONLY valid JSON — no markdown, no explanation, no extra text.

The JSON must follow this exact structure:
{{
  "title": "Personalized Workout Plan for [Goal]",
  "description": "Brief 1-2 sentence description of this plan",
  "goal": "{goal}",
  "difficulty": "<BEGINNER|INTERMEDIATE|ADVANCED>",
  "durationWeeks": 4,
  "planData": {{
    "Mon": [
      {{"name": "Push-ups", "sets": 3, "reps": 15}},
      {{"name": "Plank", "duration": 30, "sets": 3}},
      {{"name": "Squats", "sets": 3, "reps": 20, "notes": "Bodyweight"}}
    ],
    "Wed": [...],
    "Fri": [...]
  }}
}}

Rules:
- Only include days that have workouts — rest days should NOT appear as keys
- Use short day names as keys: Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Schedule exactly {daysPerWeek} workout days per week with appropriate rest days between sessions
- Each workout should have 4-8 exercises appropriate for the equipment available
- For strength exercises: include "sets" and "reps"
- For timed exercises (plank, cardio): include "sets" and "duration" (seconds)
- Difficulty must match fitness level
- Consider any injuries in exercise selection
- Progressive structure: compound movements first, isolation last`

const WORKOUT_HUMAN_PROMPT = `Generate a personalized workout plan for:
- Age: {age} years
- Gender: {gender}
- Fitness Level: {fitnessLevel}
- Goal: {goal}
- Days per week: {daysPerWeek}
- Available Equipment: {availableEquipment}
- Current Injuries/Limitations: {currentInjuries}`

export async function generateWorkoutPlan(inputs: WorkoutPlanInputs): Promise<GeneratedWorkoutPlan> {
  const model  = getModel()
  const parser = new JsonOutputParser<GeneratedWorkoutPlan>()

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", WORKOUT_SYSTEM_PROMPT],
    ["human",  WORKOUT_HUMAN_PROMPT],
  ])

  const chain = prompt.pipe(model).pipe(parser)

  const result = await chain.invoke({
    goal:               inputs.goal,
    daysPerWeek:        inputs.daysPerWeek,
    age:                inputs.age,
    gender:             inputs.gender,
    fitnessLevel:       inputs.fitnessLevel,
    availableEquipment: inputs.availableEquipment,
    currentInjuries:    inputs.currentInjuries || "None",
  })

  if (!result.planData || typeof result.planData !== "object") {
    throw new Error("AI returned invalid workout plan structure")
  }

  // Validate that only short day names are used
  const validShortDays = new Set(DAYS_SHORT)
  for (const key of Object.keys(result.planData)) {
    if (!validShortDays.has(key)) {
      // Map full day names to short if AI used them
      const idx = DAYS_FULL.indexOf(key)
      if (idx !== -1) {
        result.planData[DAYS_SHORT[idx]] = result.planData[key]
        delete result.planData[key]
      }
    }
  }

  return result
}

// ── Plan Update Functions ──────────────────────────────────────────────────────

const DIET_UPDATE_SYSTEM_PROMPT = `You are an expert sports nutritionist. You will receive an existing diet plan as JSON and a change request from the user. Modify the plan according to the request while preserving the overall structure and format.

CRITICAL: Return ONLY valid JSON — no markdown, no explanation, no extra text. Return the complete updated plan with the same structure as the input.`

const DIET_UPDATE_HUMAN_PROMPT = `Existing diet plan:
{existingPlan}

User's change request: {changeRequest}

Return the complete updated diet plan JSON with the same structure, applying only the requested changes.`

export async function updateDietPlan(
  existingPlan: GeneratedDietPlan,
  changeRequest: string
): Promise<GeneratedDietPlan> {
  const model  = getModel()
  const parser = new JsonOutputParser<GeneratedDietPlan>()

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", DIET_UPDATE_SYSTEM_PROMPT],
    ["human",  DIET_UPDATE_HUMAN_PROMPT],
  ])

  const chain = prompt.pipe(model).pipe(parser)

  const result = await chain.invoke({
    existingPlan:  JSON.stringify(existingPlan),
    changeRequest,
  })

  if (!result.planData || typeof result.planData !== "object") {
    throw new Error("AI returned invalid diet plan structure")
  }

  return result
}

const WORKOUT_UPDATE_SYSTEM_PROMPT = `You are an expert personal trainer. You will receive an existing workout plan as JSON and a change request from the user. Modify the plan according to the request while preserving the overall structure and format.

CRITICAL: Return ONLY valid JSON — no markdown, no explanation, no extra text. Return the complete updated plan with the same structure as the input.`

const WORKOUT_UPDATE_HUMAN_PROMPT = `Existing workout plan:
{existingPlan}

User's change request: {changeRequest}

Return the complete updated workout plan JSON with the same structure, applying only the requested changes.`

export async function updateWorkoutPlan(
  existingPlan: GeneratedWorkoutPlan,
  changeRequest: string
): Promise<GeneratedWorkoutPlan> {
  const model  = getModel()
  const parser = new JsonOutputParser<GeneratedWorkoutPlan>()

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", WORKOUT_UPDATE_SYSTEM_PROMPT],
    ["human",  WORKOUT_UPDATE_HUMAN_PROMPT],
  ])

  const chain = prompt.pipe(model).pipe(parser)

  const result = await chain.invoke({
    existingPlan:  JSON.stringify(existingPlan),
    changeRequest,
  })

  if (!result.planData || typeof result.planData !== "object") {
    throw new Error("AI returned invalid workout plan structure")
  }

  return result
}
