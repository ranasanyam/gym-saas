// src/lib/schemas/index.ts
// Centralized Zod schemas for all API request validation.
// Import and use in API routes via zodResolver or manual .parse() / .safeParse().

import { z } from "zod"

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:    z.string().min(1, "Email or mobile is required"),
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email:    z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
  token:    z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const setRoleSchema = z.object({
  role: z.enum(["owner", "trainer", "member"], { required_error: "Role is required" }),
})

// ── Gym ───────────────────────────────────────────────────────────────────────

export const createGymSchema = z.object({
  name:          z.string().min(1, "Gym name is required").max(100),
  address:       z.string().max(300).optional(),
  city:          z.string().max(100).optional(),
  state:         z.string().max(100).optional(),
  pincode:       z.string().max(10).optional(),
  contactNumber: z.string().max(15).optional(),
  services:      z.array(z.string()).optional().default([]),
  facilities:    z.array(z.string()).optional().default([]),
  gymImages:     z.array(z.string().url()).optional().default([]),
})

export const updateGymSchema = createGymSchema.partial()

// ── Member ────────────────────────────────────────────────────────────────────

export const addMemberSchema = z.object({
  gymId:            z.string().cuid("Invalid gym ID"),
  fullName:         z.string().min(2, "Full name is required"),
  mobileNumber:     z.string().min(10, "Valid mobile number is required"),
  membershipPlanId: z.string().cuid().optional(),
  startDate:        z.string().datetime().optional(),
  endDate:          z.string().datetime().optional(),
  paymentReceived:  z.boolean().optional().default(false),
})

export const updateMemberSchema = z.object({
  status:         z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "EXPIRED"]).optional(),
  membershipPlanId: z.string().cuid().optional().nullable(),
  endDate:        z.string().datetime().optional().nullable(),
  heightCm:       z.number().positive().optional().nullable(),
  weightKg:       z.number().positive().optional().nullable(),
  medicalNotes:   z.string().max(500).optional().nullable(),
  emergencyContactName:  z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().max(15).optional().nullable(),
  workoutStartTime: z.string().optional().nullable(),
  workoutEndTime:   z.string().optional().nullable(),
})

// ── Trainer ───────────────────────────────────────────────────────────────────

export const addTrainerSchema = z.object({
  gymId:            z.string().cuid("Invalid gym ID"),
  fullName:         z.string().min(2, "Full name is required"),
  mobileNumber:     z.string().min(10, "Valid mobile number is required"),
  bio:              z.string().max(500).optional(),
  experienceYears:  z.number().int().min(0).max(50).optional().default(0),
  specializations:  z.array(z.string()).optional().default([]),
  certifications:   z.array(z.string()).optional().default([]),
})

// ── Membership Plan ───────────────────────────────────────────────────────────

export const createMembershipPlanSchema = z.object({
  gymId:          z.string().cuid("Invalid gym ID"),
  name:           z.string().min(1, "Plan name is required").max(100),
  price:          z.number().min(0, "Price must be non-negative"),
  durationMonths: z.number().int().min(1).max(24),
  description:    z.string().max(500).optional(),
  features:       z.array(z.string()).optional().default([]),
})

// ── Workout / Diet Plan ───────────────────────────────────────────────────────

export const createWorkoutPlanSchema = z.object({
  gymId:       z.string().cuid().optional(),
  title:       z.string().min(1, "Title is required").max(200),
  description: z.string().max(500).optional(),
  planData:    z.record(z.unknown()).optional().default({}),
  isTemplate:  z.boolean().optional().default(false),
  memberId:    z.string().cuid().optional(),
})

export const createDietPlanSchema = z.object({
  gymId:       z.string().cuid().optional(),
  title:       z.string().min(1, "Title is required").max(200),
  description: z.string().max(500).optional(),
  planData:    z.record(z.unknown()).optional().default({}),
  isTemplate:  z.boolean().optional().default(false),
  memberId:    z.string().cuid().optional(),
})

// ── Attendance ────────────────────────────────────────────────────────────────

export const logAttendanceSchema = z.object({
  gymId:    z.string().cuid("Invalid gym ID"),
  memberId: z.string().cuid("Invalid member ID").optional(),
  method:   z.enum(["MANUAL", "QR", "BIOMETRIC", "SELF"]).optional().default("MANUAL"),
  checkIn:  z.string().datetime().optional(),
})

// ── Payment ───────────────────────────────────────────────────────────────────

export const recordPaymentSchema = z.object({
  gymId:            z.string().cuid(),
  memberId:         z.string().cuid(),
  membershipPlanId: z.string().cuid().optional(),
  amount:           z.number().positive(),
  paymentMethod:    z.enum(["CASH", "CARD", "UPI", "ONLINE"]).default("CASH"),
  paymentDate:      z.string().datetime().optional(),
  notes:            z.string().max(300).optional(),
})

// ── Subscription ──────────────────────────────────────────────────────────────

export const subscribeSchema = z.object({
  saasPlanId:         z.string().min(1, "Plan ID is required"),
  amount:             z.number().min(0),
  razorpayPaymentId:  z.string().optional(),
  razorpayOrderId:    z.string().optional(),
  razorpaySignature:  z.string().optional(),
})

// ── Pagination ────────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional().default(""),
  gymId:  z.string().optional().default(""),
  status: z.string().optional().default(""),
})

// ── Notification ──────────────────────────────────────────────────────────────

export const createAnnouncementSchema = z.object({
  gymId:   z.string().cuid("Invalid gym ID"),
  title:   z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  targetRole: z.enum(["all", "member", "trainer"]).optional().default("all"),
})

// ── Expense ───────────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  gymId:       z.string().cuid("Invalid gym ID"),
  category:    z.string().min(1).max(100),
  amount:      z.number().positive(),
  description: z.string().max(300).optional(),
  date:        z.string().datetime().optional(),
})
