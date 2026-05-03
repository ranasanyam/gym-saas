// src/app/member/dashboard/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Building2, Dumbbell, UtensilsCrossed, CreditCard, ShoppingBag,
  Bell, Flame, CalendarCheck, Clock, CheckCircle2, Loader2, Compass,
  ArrowRight, ChevronRight,
  AlertCircle,
  ClockAlert, Zap, Apple, ChevronDown, ChevronUp, Target
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { NoGymState } from "@/components/member/NoGymState"


// Grace window after a meal's scheduled time before it's 'missed'

const MEAL_MISS_GRACE_MINUTES = 30


interface GymMembership {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  lastCheckinDate: string | null;
  gym: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    contactNumber: string | null;
  } | null;
  membershipPlan: {
    name: string;
    price: string | number;
    durationMonths: number;
  } | null;
  assignedTrainer: {
    profile: { fullName: string; avatarUrl: string | null };
  } | null;
}

interface MealItem {
  name: string
  scheduledTime?: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  foods?: string[]
}

interface MealLog {
  id: string
  memberId: string
  dietPlanId: string
  mealKey: string
  logDate: string
  takenAt: string
}

interface WorkoutLogEntry {
  id: string
  memberId: string
  workoutPlanId: string | null
  dayNumber: number | null
  weekNumber: number | null
  loggedAt: string
  scheduledDayName: string
  workoutPlan: { id: string; title: string | null; goal: string | null; difficulty: string } | null
}

interface DashSummary {
  assignedDietPlan: {
    id: string
    title: string | null
    caloriesTarget: number | null
    proteinG: number | null
    carbsG: number | null
    fatG: number | null
    planData: Record<string, MealItem[]>
  } | null
  assignedWorkoutPlan: {
    id: string
    title: string | null
    goal: string | null
    difficulty: string
    planData: Record<string, any[]>
  } | null
  todayMealLogs: MealLog[]
  weekMealLogs: MealLog[]
  recentWorkoutLogs: WorkoutLogEntry[]
  todayWorkoutLogged: boolean
  todayMacroSummary: { calories: number; protein_g: number; carbs_g: number; fat_g: number }
}


interface DashData {
  memberName: string
  gymName: string | null
  membershipStatus: string | null
  membershipPlan: string | null
  expiryDate: string | null
  daysRemaining: number | null
  hasCheckedInToday: boolean
  currentStreak: number
  monthlyCheckIns: number
  todayWorkout: { exercises: any[]; day: string } | null
  todayDiet: { mealCount: number; totalCalories: number } | null
  recentNotifications: any[]
  unreadCount: number
  activeMembership: GymMembership | null
  memberships: GymMembership[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMealStatus(
  scheduledTime: string | undefined,
  isLogged: boolean,
): "taken" | "missed" | "upcoming" {
  if (isLogged) return "taken"
  if (!scheduledTime) return "upcoming"
  const [h, m] = scheduledTime.split(":").map(Number)
  const now = new Date()
  const scheduled = new Date(now)
  scheduled.setHours(h, m, 0, 0)
  const graceMs = MEAL_MISS_GRACE_MINUTES * 60 * 1000
  return now.getTime() > scheduled.getTime() + graceMs ? "missed" : "upcoming"
}

function todayKey(): string {
  return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()]
}

function todayShortKey(): string {
  return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()]
}
function StatCard({ icon: Icon, label, value, color = "text-primary" }: any) {
  return (
    <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-white/5">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
        <p className="text-white/40 text-xs">{label}</p>
      </div>
    </div>
  )
}

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className={`font-semibold ${color}`}>{value}g / {target}g</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all`} style={{ width: `${pct * 100}%`, backgroundColor: "currentColor" }} />
      </div>
    </div>
  )
}

// ── Meal Tracker Section ───────────────────────────────────────────────────────

function DietTrackerSection({
  summary,
  onMealTaken,
  markingMeal,
}: {
  summary: DashSummary
  onMealTaken: (dietPlanId: string, mealKey: string) => Promise<void>
  markingMeal: string | null
}) {
  const [weekExpanded, setWeekExpanded] = useState(false)
  const { assignedDietPlan, todayMealLogs, weekMealLogs, todayMacroSummary } = summary

  if (!assignedDietPlan) {
    return (
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 border-dashed rounded-2xl p-8 text-center">
        <Apple className="w-8 h-8 text-white/15 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-1">No Diet Plan Yet</h3>
        <p className="text-white/35 text-sm mb-4">You don't have a diet plan yet. Build a custom plan through AI.</p>
        <button className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 border border-green-500/25 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-green-500/20 transition-colors">
          <Zap className="w-4 h-4" /> Build with AI (coming soon)
        </button>
      </div>
    )
  }

  const planData  = assignedDietPlan.planData as Record<string, MealItem[]>
  const todayName = todayKey()
  const todayKeys = Object.keys(planData).filter(k => k.startsWith(`${todayName}__`))
  const loggedSet = new Set(todayMealLogs.map(l => l.mealKey))

  // Sort meals by scheduledTime
  const todayMeals = todayKeys
    .map(key => ({
      key,
      name:    key.replace(`${todayName}__`, ""),
      items:   planData[key] ?? [],
      isLogged: loggedSet.has(key),
    }))
    .sort((a, b) => {
      const ta = a.items[0]?.scheduledTime ?? "99:99"
      const tb = b.items[0]?.scheduledTime ?? "99:99"
      return ta.localeCompare(tb)
    })

  const nextMeal = todayMeals.find(m => getMealStatus(m.items[0]?.scheduledTime, m.isLogged) === "upcoming")

  // Macro targets
  const calorieTarget  = assignedDietPlan.caloriesTarget  ?? 0
  const proteinTarget  = Number(assignedDietPlan.proteinG) || 0
  const carbsTarget    = Number(assignedDietPlan.carbsG)   || 0
  const fatTarget      = Number(assignedDietPlan.fatG)     || 0

  // Build week grid (last 7 days)
  const weekDays: { label: string; date: Date; takenCount: number; totalCount: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]
    const dayKeys = Object.keys(planData).filter(k => k.startsWith(`${dayName}__`))
    const dateStr = d.toISOString().split("T")[0]
    const takenCount = weekMealLogs.filter(l => {
      const logDay = new Date(l.logDate).toISOString().split("T")[0]
      return logDay === dateStr && dayKeys.includes(l.mealKey)
    }).length
    weekDays.push({
      label:      ["Su","Mo","Tu","We","Th","Fr","Sa"][d.getDay()],
      date:       d,
      takenCount,
      totalCount: dayKeys.length,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-green-400" /> Diet & Meal Tracker
        </h3>
        <Link href="/member/diet" className="text-primary text-xs hover:underline flex items-center gap-1">
          View plan <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Today's Meals */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-3">
        <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Today's Meals</p>
        {todayMeals.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No meals scheduled for today</p>
        ) : (
          <div className="space-y-2">
            {todayMeals.map(meal => {
              const item = meal.items[0]
              const status = getMealStatus(item?.scheduledTime, meal.isLogged)
              const isNext = nextMeal?.key === meal.key
              return (
                <div key={meal.key}
                  className={`p-3 rounded-xl border transition-all ${
                    isNext
                      ? "bg-green-500/8 border-green-500/25"
                      : "bg-white/3 border-white/6"
                  }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isNext && <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">Next Meal</span>}
                        <p className="text-white font-semibold text-sm">{meal.name}</p>
                        {item?.scheduledTime && (
                          <span className="text-white/35 text-xs">{item.scheduledTime}</span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          status === "taken"    ? "bg-green-500/15 text-green-400"
                          : status === "missed" ? "bg-red-500/15 text-red-400"
                          : "bg-white/8 text-white/40"
                        }`}>
                          {status === "taken" ? "Taken" : status === "missed" ? "Missed" : "Upcoming"}
                        </span>
                      </div>
                      {item?.foods && item.foods.length > 0 && (
                        <p className="text-white/30 text-xs mt-1 truncate">{item.foods.join(", ")}</p>
                      )}
                      {item && (item.calories || item.protein_g) && (
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-white/35">
                          {item.calories  && <span>{item.calories} kcal</span>}
                          {item.protein_g && <span>P: {item.protein_g}g</span>}
                          {item.carbs_g   && <span>C: {item.carbs_g}g</span>}
                          {item.fat_g     && <span>F: {item.fat_g}g</span>}
                        </div>
                      )}
                    </div>
                    {status === "upcoming" && (
                      <button
                        onClick={() => onMealTaken(assignedDietPlan.id, meal.key)}
                        disabled={markingMeal === meal.key}
                        className="shrink-0 flex items-center gap-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/25 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {markingMeal === meal.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Mark Taken
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Macro Summary */}
      {calorieTarget > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Today's Macros</p>
            <div className="flex items-center gap-1.5">
              <span className="text-orange-400 font-bold text-sm">{todayMacroSummary.calories}</span>
              <span className="text-white/35 text-xs">/ {calorieTarget} kcal</span>
            </div>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400/70 rounded-full transition-all"
              style={{ width: `${Math.min((todayMacroSummary.calories / calorieTarget) * 100, 100)}%` }} />
          </div>
          {(proteinTarget > 0 || carbsTarget > 0 || fatTarget > 0) && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: "Protein", val: todayMacroSummary.protein_g, target: proteinTarget, color: "text-red-400" },
                { label: "Carbs",   val: todayMacroSummary.carbs_g,   target: carbsTarget,   color: "text-yellow-400" },
                { label: "Fat",     val: todayMacroSummary.fat_g,     target: fatTarget,     color: "text-blue-400" },
              ].map(m => (
                <div key={m.label} className="bg-white/3 rounded-xl p-2.5 text-center">
                  <p className={`text-sm font-bold ${m.color}`}>{m.val}g</p>
                  <p className="text-white/30 text-[10px]">{m.label} / {m.target}g</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* This Week */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
        <button className="w-full flex items-center justify-between mb-3"
          onClick={() => setWeekExpanded(e => !e)}>
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">This Week</p>
          {weekExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
        </button>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d, i) => {
            const allDone  = d.totalCount > 0 && d.takenCount === d.totalCount
            const someDone = d.takenCount > 0 && !allDone
            const isToday  = i === 6
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border ${
                  allDone  ? "bg-green-500/20 border-green-500/30 text-green-400"
                  : someDone ? "bg-yellow-500/15 border-yellow-500/25 text-yellow-400"
                  : isToday  ? "border-primary/40 text-white/50 bg-white/3"
                  : "border-white/6 text-white/25 bg-white/2"
                }`}>
                  {d.takenCount}/{d.totalCount}
                </div>
                <span className={`text-[9px] font-semibold ${isToday ? "text-primary" : "text-white/25"}`}>{d.label}</span>
              </div>
            )
          })}
        </div>
        {weekExpanded && (
          <div className="mt-3 pt-3 border-t border-white/6 space-y-1">
            {weekDays.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className={i === 6 ? "text-primary font-semibold" : "text-white/40"}>
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.date.getDay()]} {d.date.getDate()}
                </span>
                <span className={d.takenCount === d.totalCount && d.totalCount > 0 ? "text-green-400" : "text-white/30"}>
                  {d.takenCount} / {d.totalCount} meals
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Workout Tracker Section ────────────────────────────────────────────────────

function WorkoutTrackerSection({
  summary,
  onWorkoutDone,
  markingWorkout,
}: {
  summary: DashSummary
  onWorkoutDone: (workoutPlanId: string, scheduledDay: string) => Promise<void>
  markingWorkout: boolean
}) {
  const { assignedWorkoutPlan, recentWorkoutLogs, todayWorkoutLogged } = summary

  if (!assignedWorkoutPlan) {
    return (
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 border-dashed rounded-2xl p-8 text-center">
        <Dumbbell className="w-8 h-8 text-white/15 mx-auto mb-3" />
        <h3 className="text-white font-semibold mb-1">No Workout Plan Yet</h3>
        <p className="text-white/35 text-sm mb-4">You don't have a workout plan yet. Build a custom plan through AI.</p>
        <button className="inline-flex items-center gap-2 bg-purple-500/15 text-purple-400 border border-purple-500/25 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-purple-500/20 transition-colors">
          <Zap className="w-4 h-4" /> Build with AI (coming soon)
        </button>
      </div>
    )
  }

  const todayName = todayKey()
  const todayShortName = todayShortKey()
  const planData  = assignedWorkoutPlan.planData as Record<string, any[]>
  const todayExercises: any[] = planData[todayShortName] ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-purple-400" /> Workout Tracker
        </h3>
        <Link href="/member/workouts" className="text-primary text-xs hover:underline flex items-center gap-1">
          View plans <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Today's workout */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">Today's Workout</p>
            <p className="text-white font-semibold">{assignedWorkoutPlan.title ?? "Workout Plan"}</p>
            {assignedWorkoutPlan.goal && (
              <p className="text-white/35 text-xs mt-0.5">{assignedWorkoutPlan.goal}</p>
            )}
          </div>
          {todayWorkoutLogged ? (
            <span className="shrink-0 flex items-center gap-1.5 bg-green-500/15 text-green-400 border border-green-500/25 text-xs font-semibold px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          ) : todayExercises.length > 0 ? (
            <button
              onClick={() => onWorkoutDone(assignedWorkoutPlan.id, todayName)}
              disabled={markingWorkout}
              className="shrink-0 flex items-center gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/25 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {markingWorkout ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Mark Done
            </button>
          ) : null}
        </div>

        {todayExercises.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-3">Rest day — no workout scheduled today</p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-white/30 text-xs mb-2">{todayName} · {todayExercises.length} exercise{todayExercises.length !== 1 ? "s" : ""}</p>
            {todayExercises.slice(0, 5).map((ex: any, i: number) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-white/3 rounded-xl">
                <span className="text-white/25 text-xs w-4 shrink-0">{i + 1}.</span>
                <p className="text-white text-sm font-medium flex-1 truncate">{ex.name}</p>
                {ex.sets && ex.reps && (
                  <span className="text-white/35 text-xs shrink-0">{ex.sets}×{ex.reps}</span>
                )}
                {ex.duration && !ex.reps && (
                  <span className="text-white/35 text-xs shrink-0">{ex.duration}s</span>
                )}
              </div>
            ))}
            {todayExercises.length > 5 && (
              <p className="text-white/25 text-xs text-center">+{todayExercises.length - 5} more</p>
            )}
          </div>
        )}
      </div>

      {/* Recent workouts */}
      {recentWorkoutLogs.length > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Recent Sessions</p>
          <div className="space-y-2">
            {recentWorkoutLogs.slice(0, 3).map(log => (
              <div key={log.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{log.scheduledDayName}</p>
                  <p className="text-white/35 text-xs">{log.workoutPlan?.title ?? "Workout"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white/40 text-xs">
                    {new Date(log.loggedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                  <span className="text-green-400 text-[10px] font-bold">Done ✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main dashboard page ────────────────────────────────────────────────────────

export default function MemberDashboard() {
  const { toast }     = useToast()
  const [data, setData]       = useState<DashData | null>(null)
  const [summary, setSummary] = useState<DashSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [justCheckedIn, setJustCheckedIn] = useState(false)
  const [markingMeal, setMarkingMeal] = useState<string | null>(null)
  const [markingWorkout, setMarkingWorkout] = useState(false)

  const load = useCallback(async () => {
    const [d, s] = await Promise.all([
      fetch("/api/member/dashboard").then(r => r.json()),
      fetch("/api/member/dashboard-summary").then(r => r.json()),
    ])
    setData(d)
    if (s?.success) setSummary(s.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const checkIn = async () => {
    setCheckingIn(true)
    const res = await fetch("/api/member/attendance", { method: "POST" })
    if (res.ok) {
      setJustCheckedIn(true)
      setData(d => d ? { ...d, hasCheckedInToday: true } : d)
      toast({ variant: "success", title: "Checked in! 🔥", description: "Your attendance has been recorded." })
    } else {
      const d = await res.json()
      toast({ variant: "destructive", title: d.error ?? "Check-in failed" })
    }
    setCheckingIn(false)
  }

  const handleMealTaken = async (dietPlanId: string, mealKey: string) => {
    setMarkingMeal(mealKey)
    const res = await fetch("/api/member/meal-log", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ dietPlanId, mealKey, takenAt: new Date().toISOString() }),
    })
    if (res.ok) {
      toast({ variant: "success", title: "Meal logged!", description: "Meal marked as taken." })
      // Re-fetch only the summary
      const s = await fetch("/api/member/dashboard-summary").then(r => r.json())
      if (s?.success) setSummary(s.data)
    } else {
      const d = await res.json()
      toast({ variant: "destructive", title: d.error ?? "Failed to log meal" })
    }
    setMarkingMeal(null)
  }

  const handleWorkoutDone = async (workoutPlanId: string, scheduledDay: string) => {
    setMarkingWorkout(true)
    const res = await fetch("/api/member/workout-log", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ workoutPlanId, scheduledDay, completedAt: new Date().toISOString() }),
    })
    if (res.ok) {
      toast({ variant: "success", title: "Workout done! 💪", description: "Session logged." })
      const s = await fetch("/api/member/dashboard-summary").then(r => r.json())
      if (s?.success) setSummary(s.data)
    } else {
      const d = await res.json()
      toast({ variant: "destructive", title: d.error ?? "Failed to log workout" })
    }
    setMarkingWorkout(false)
  }
  if (loading) return (
    <div className="max-w-4xl space-y-5 animate-pulse">
      <div className="h-28 bg-white/3 rounded-2xl" />
      <div className="h-14 bg-white/3 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/3 rounded-2xl" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-white/3 rounded-2xl" />)}
      </div>
    </div>
  )

  if (!data) return null


  const firstName = data.memberName?.split(" ")[0] ?? "there"
  const noGym     = !data.gymName

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  if (noGym) return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">{greeting}, {firstName} 👋</h1>
        <p className="text-white/35 text-sm mt-0.5">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>
      <NoGymState />
    </div>
  )

  const statusColor =
    data.membershipStatus === "ACTIVE"    ? "text-green-400 bg-green-500/10 border-green-500/20"
    : data.membershipStatus === "EXPIRED" ? "text-red-400 bg-red-500/10 border-red-500/20"
    : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"

  return (
    <div className="max-w-4xl space-y-5">
      {/* Welcome banner */}
      <div className="relative bg-linear-to-br from-primary/20 via-primary/6 to-transparent border border-primary/15 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-primary text-sm font-medium mb-1">{greeting} 👋</p>
            <h2 className="text-2xl font-display font-bold text-white">{firstName}!</h2>
            {data.gymName ? (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-white/50 text-sm">{data.gymName}</span>
                {data.membershipStatus && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusColor}`}>
                    {data.membershipStatus}
                  </span>
                )}
                {data.membershipPlan && (
                  <span className="text-white/35 text-xs">{data.membershipPlan}</span>
                )}
              </div>
            ) : (
              <p className="text-white/40 text-sm mt-1">You're not enrolled in any gym yet.</p>
            )}
            {data.daysRemaining !== null && data.daysRemaining <= 7 && data.daysRemaining > 0 && (
              <p className="text-yellow-400/80 text-xs mt-2">
                ⚠ Membership expires in {data.daysRemaining} day{data.daysRemaining !== 1 ? "s" : ""}
              </p>
            )}
            

          
          </div>
          
          {data.gymName && (
            <button
              onClick={checkIn}
              disabled={data.hasCheckedInToday || checkingIn || justCheckedIn}
              className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
                data.hasCheckedInToday || justCheckedIn
                  ? "bg-green-500/15 text-green-400 border border-green-500/20 cursor-default"
                  : "bg-gradient-primary text-white hover:opacity-90 shadow-lg shadow-primary/20"
              }`}
            >
              {checkingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : data.hasCheckedInToday || justCheckedIn ? (
                <><CheckCircle2 className="w-4 h-4" /> Checked In</>
              ) : (
                <><CalendarCheck className="w-4 h-4" /> Check In</>
              )}
            </button>
          )}
        </div>
      </div>
      {!loading && data?.memberships && data?.memberships
              .filter((m) => {
                if(!m.endDate) return false;
                const days = Math.ceil(
                  (new Date(m.endDate).getTime() - Date.now()) / ( 1000 * 60 * 60 * 24)
                );
                return days <= 7;
            })
            .map((m) => {
              const days = Math.ceil(
                (new Date(m.endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const expired = days <= 0;
              return (
                <div 
                key={m.id}
                className={`flex items-center justify-between gap-5 border rounded-xl p-5 ${expired ? "bg-red-500/10 border-red-500/25" : "bg-yellow-500/8 border-yellow-500/20"}`}
                >
                  <div className="flex items-center gap-4">
                    {expired ? <AlertCircle className="w-5 h-5 text-red-400" /> : <ClockAlert className="w-5 h-5 text-yellow-400" />}
                  <div>
                    <div
                    className={`text-md font-semibold ${expired ? "text-red-400" : "text-yello-400"}`}
                    >
                      {expired ? `Membership Expired - ${m.gym?.name ?? "Your Gym"}` : `Expiring Soon - ${m.gym?.name ?? "Your Gym"}`}
                    </div>
                    <div className="text-white/50 text-sm">
                      {expired ? `Your membership has expired. Renew to keep access.` : `${days} day${days === 1 ? "" : "s"} left on your membership.`}
                    </div>
                  </div>
                  </div>
                  {m.gym?.id && (
                    <Link href={`/member/discover/${m.gym?.id}`} className={`border border-red-500/25 text-red-400 bg-red-500/10 hover:bg-red-500/5 py-2 px-4 rounded-xl`}>
                      <span>Renew Now</span>
                    </Link>
                  )}
                </div>
              )
            })}

      {/* No gym CTA */}
      {noGym && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Compass className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-white font-display font-bold text-lg mb-2">Find Your Gym</h3>
          <p className="text-white/40 text-sm mb-5 max-w-xs mx-auto">Browse gyms in your city and join one to get started.</p>
          <Link href="/member/discover"
            className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
            <Compass className="w-4 h-4" /> Discover Gyms
          </Link>
        </div>
      )}

      {/* Stats row */}
      {!noGym && (
        <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Flame}          label="Day Streak"       value={`🔥 ${data.currentStreak}`}   color="text-orange-400" />
        <StatCard icon={CalendarCheck}  label="This Month"       value={data.monthlyCheckIns}           color="text-blue-400" />
        <StatCard icon={Clock}          label="Days Left"        value={data.daysRemaining ?? "∞"}      color="text-green-400" />
      </div>
      )}

      {/* {!noGym && (
        <div className="grid md:grid-cols-2 gap-4">

        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" /> Today's Workout
            </h3>
            <Link href="/member/workouts" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!data.todayWorkout || data.todayWorkout.exercises.length === 0 ? (
            <div className="text-center py-6">
              <Dumbbell className="w-7 h-7 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No workout assigned yet</p>
              <Link href="/member/workouts" className="text-primary text-xs mt-1 hover:underline inline-block">View plans</Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-white/35 text-xs mb-2">{data.todayWorkout.day} · {data.todayWorkout.exercises.length} exercise{data.todayWorkout.exercises.length !== 1 ? "s" : ""}</p>
              {data.todayWorkout.exercises.slice(0, 4).map((ex: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white/3 rounded-xl">
                  <span className="text-white/25 text-xs w-4 shrink-0">{i + 1}.</span>
                  <p className="text-white text-sm font-medium flex-1 truncate">{ex.name}</p>
                  {ex.sets && ex.reps && (
                    <span className="text-white/35 text-xs shrink-0">{ex.sets}×{ex.reps}</span>
                  )}
                </div>
              ))}
              {data.todayWorkout.exercises.length > 4 && (
                <p className="text-white/30 text-xs text-center">+{data.todayWorkout.exercises.length - 4} more</p>
              )}
            </div>
          )}
        </div>


        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-primary" /> Today's Diet
            </h3>
            <Link href="/member/diet" className="text-primary text-xs hover:underline flex items-center gap-1">
              View plan <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!data.todayDiet ? (
            <div className="text-center py-6">
              <UtensilsCrossed className="w-7 h-7 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No diet plan assigned yet</p>
              <Link href="/member/diet" className="text-primary text-xs mt-1 hover:underline inline-block">View plans</Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-500/8 border border-orange-500/15 rounded-xl p-3 text-center">
                  <p className="text-orange-400 font-bold text-xl">{data.todayDiet.totalCalories}</p>
                  <p className="text-white/40 text-xs">kcal today</p>
                </div>
                <div className="bg-white/3 border border-white/6 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-xl">{data.todayDiet.mealCount}</p>
                  <p className="text-white/40 text-xs">meal{data.todayDiet.mealCount !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <Link href="/member/diet"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/8 text-white/50 hover:text-white hover:border-white/15 transition-all text-sm">
                View full plan <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
      )} */}

      {/* Diet & Meal Tracker */}

      {summary && (
        <DietTrackerSection 
          summary={summary}
          onMealTaken={handleMealTaken}
          markingMeal={markingMeal}
        />
      )}

      {/* Workout Tracker */}
      {summary && (
        <WorkoutTrackerSection 
          summary={summary}
          onWorkoutDone={handleWorkoutDone}
          markingWorkout={markingWorkout}
        />
      )}

      {/* Recent notifications */}
      {data.recentNotifications.length > 0 && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Notifications
              {data.unreadCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {data.unreadCount}
                </span>
              )}
            </h3>
            <Link href="/member/notifications" className="text-primary text-xs hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentNotifications.map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 p-3 bg-white/3 rounded-xl">
                {!n.isRead && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{n.title}</p>
                  <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{n.message}</p>
                </div>
                <span className="text-white/25 text-[10px] shrink-0">
                  {new Date(n.createdAt).toLocaleTimeString("en-IN", { timeStyle: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      {!noGym && (
        <div>
        <p className="text-white/35 text-xs uppercase tracking-wider font-semibold mb-3">Quick Links</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { href: "/member/gym",         icon: Building2,      label: "My Gym",     color: "text-blue-400",   bg: "bg-blue-500/10"   },
            { href: "/member/workouts",    icon: Dumbbell,       label: "Workouts",   color: "text-purple-400", bg: "bg-purple-500/10" },
            { href: "/member/diet",        icon: UtensilsCrossed,label: "Diet Plan",  color: "text-green-400",  bg: "bg-green-500/10"  },
            { href: "/member/payments",    icon: CreditCard,     label: "Payments",   color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { href: "/member/supplements", icon: ShoppingBag,    label: "Supplements",color: "text-orange-400", bg: "bg-orange-500/10" },
          ].map(({ href, icon: Icon, label, color, bg }) => (
            <Link key={href} href={href}
              className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-white/12 transition-colors group text-center">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-white/50 text-xs font-medium group-hover:text-white transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}
