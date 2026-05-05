// src/lib/aiPlanPricing.ts
// Pricing constants for AI-generated plans. Amounts are in INR paise for Razorpay.

export const AI_DIET_PLAN_PRICE    = 500  // INR
export const AI_WORKOUT_PLAN_PRICE = 300  // INR

export const AI_PLAN_PRICES: Record<"diet" | "workout", number> = {
  diet:    AI_DIET_PLAN_PRICE,
  workout: AI_WORKOUT_PLAN_PRICE,
}
