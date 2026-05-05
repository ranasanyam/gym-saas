"use client"

import { useState, useEffect } from "react"
import { X, Loader2, CheckCircle2, Zap, Brain, Dumbbell, UtensilsCrossed, Sparkles, AlertCircle, Crown } from "lucide-react"
import Link from "next/link"

interface AIPlanModalProps {
  planType: "diet" | "workout"
  isOpen: boolean
  onClose: () => void
  onSuccess?: (plan: any) => void
}

interface DietForm {
  age: string; gender: string; heightCm: string; weightKg: string
  goal: string; activityLevel: string; dietaryPreference: string
  allergies: string; mealsPerDay: string
}

interface WorkoutForm {
  age: string; gender: string; fitnessLevel: string; goal: string
  daysPerWeek: string; availableEquipment: string; currentInjuries: string
}

const DIET_DEFAULTS: DietForm = {
  age: "", gender: "male", heightCm: "", weightKg: "",
  goal: "weight_loss", activityLevel: "moderate",
  dietaryPreference: "non_vegetarian", allergies: "", mealsPerDay: "3",
}

const WORKOUT_DEFAULTS: WorkoutForm = {
  age: "", gender: "male", fitnessLevel: "beginner",
  goal: "weight_loss", daysPerWeek: "3",
  availableEquipment: "gym", currentInjuries: "",
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/60 text-xs font-semibold uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-colors"
const selectCls = `${inputCls} cursor-pointer`

export function AIPlanModal({ planType, isOpen, onClose, onSuccess }: AIPlanModalProps) {
  const [step, setStep]         = useState<"loading" | "no-sub" | "form" | "generating" | "success">("loading")
  const [error, setError]       = useState<string | null>(null)
  const [subStatus, setSubStatus] = useState<any>(null)
  const [dietForm, setDietForm] = useState<DietForm>(DIET_DEFAULTS)
  const [wkForm, setWkForm]     = useState<WorkoutForm>(WORKOUT_DEFAULTS)

  useEffect(() => {
    if (!isOpen) return
    setStep("loading")
    setError(null)
    fetch("/api/member/ai-subscription/status")
      .then(r => r.json())
      .then(d => {
        setSubStatus(d)
        if (!d.hasSubscription || d.remainingCredits <= 0) {
          setStep("no-sub")
        } else {
          setStep("form")
        }
      })
      .catch(() => setStep("no-sub"))
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    if (step === "generating") return
    setStep("loading")
    setError(null)
    setDietForm(DIET_DEFAULTS)
    setWkForm(WORKOUT_DEFAULTS)
    onClose()
  }

  const handleGenerate = async () => {
    setError(null)
    setStep("generating")

    const inputs = planType === "diet"
      ? {
          age:               Number(dietForm.age),
          gender:            dietForm.gender,
          heightCm:          Number(dietForm.heightCm),
          weightKg:          Number(dietForm.weightKg),
          goal:              dietForm.goal,
          activityLevel:     dietForm.activityLevel,
          dietaryPreference: dietForm.dietaryPreference,
          allergies:         dietForm.allergies,
          mealsPerDay:       Number(dietForm.mealsPerDay),
        }
      : {
          age:                Number(wkForm.age),
          gender:             wkForm.gender,
          fitnessLevel:       wkForm.fitnessLevel,
          goal:               wkForm.goal,
          daysPerWeek:        Number(wkForm.daysPerWeek),
          availableEquipment: wkForm.availableEquipment,
          currentInjuries:    wkForm.currentInjuries,
        }

    try {
      const res = await fetch("/api/member/ai-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType, inputs }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === "NO_SUBSCRIPTION" || data.code === "NO_CREDITS") {
          setSubStatus({ hasSubscription: false })
          setStep("no-sub")
          setError(data.error)
          return
        }
        throw new Error(data.error ?? "Generation failed")
      }
      setStep("success")
      onSuccess?.(data)
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.")
      setStep("form")
    }
  }

  const isDiet = planType === "diet"
  const Icon   = isDiet ? UtensilsCrossed : Dumbbell
  const color  = isDiet ? "text-green-400" : "text-purple-400"
  const bg     = isDiet ? "bg-green-500/15" : "bg-purple-500/15"
  const border = isDiet ? "border-green-500/25" : "border-purple-500/25"
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[hsl(220_25%_9%)] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${bg} border ${border} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">
                AI {isDiet ? "Diet" : "Workout"} Plan
              </h2>
              {subStatus?.hasSubscription && subStatus.remainingCredits > 0 && (
                <p className="text-white/40 text-xs mt-0.5">{subStatus.remainingCredits} credit{subStatus.remainingCredits !== 1 ? "s" : ""} remaining</p>
              )}
            </div>
          </div>
          {step !== "generating" && (
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/70 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">

          {/* Loading */}
          {step === "loading" && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
            </div>
          )}

          {/* No subscription */}
          {step === "no-sub" && (
            <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
              <div className="w-14 h-14 bg-primary/10 border border-primary/25 rounded-2xl flex items-center justify-center">
                <Crown className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Subscription Required</p>
                <p className="text-white/40 text-sm mt-1.5 max-w-xs">
                  {error ?? (subStatus?.hasSubscription
                    ? "You've used all your credits. Subscribe to get more."
                    : "Get an AI subscription to generate unlimited personalized plans."
                  )}
                </p>
              </div>
              <Link
                href="/member/plans"
                onClick={handleClose}
                className="inline-flex items-center gap-2 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4" /> View Plans
              </Link>
            </div>
          )}

          {/* Generating */}
          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <div className={`w-16 h-16 ${bg} border ${border} rounded-2xl flex items-center justify-center`}>
                <Brain className={`w-8 h-8 ${color} animate-pulse`} />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">Generating your plan…</p>
                <p className="text-white/40 text-sm mt-1.5 max-w-xs">
                  AI is crafting a personalized {isDiet ? "diet" : "workout"} plan based on your profile. This may take up to 30 seconds.
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className={`w-2 h-2 ${isDiet ? "bg-green-400" : "bg-purple-400"} rounded-full animate-bounce`}
                    style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-8 gap-5">
              <div className="w-16 h-16 bg-green-500/15 border border-green-500/25 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">Plan Created!</p>
                <p className="text-white/40 text-sm mt-1.5">
                  Your AI-generated {isDiet ? "diet" : "workout"} plan has been saved and set as active.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/25 font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                View Plan
              </button>
            </div>
          )}

          {/* Form */}
          {step === "form" && (
            <div className="space-y-4">
              <div className={`${bg} border ${border} rounded-xl p-3.5 flex items-center gap-3`}>
                <Sparkles className={`w-4 h-4 ${color} shrink-0`} />
                <p className="text-white/70 text-xs leading-relaxed">
                  A <span className={`font-bold ${color}`}>7-day personalized {isDiet ? "meal" : "workout"} plan</span> generated by AI, tailored to your body and goals. Uses 1 credit.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 flex items-start gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}

              {isDiet ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Age">
                    <input type="number" min="10" max="100" placeholder="e.g. 28"
                      value={dietForm.age} onChange={e => setDietForm(f => ({...f, age: e.target.value}))} className={inputCls} />
                  </Field>
                  <Field label="Gender">
                    <select value={dietForm.gender} onChange={e => setDietForm(f => ({...f, gender: e.target.value}))} className={selectCls}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Height (cm)">
                    <input type="number" min="100" max="250" placeholder="e.g. 175"
                      value={dietForm.heightCm} onChange={e => setDietForm(f => ({...f, heightCm: e.target.value}))} className={inputCls} />
                  </Field>
                  <Field label="Weight (kg)">
                    <input type="number" min="30" max="300" placeholder="e.g. 75"
                      value={dietForm.weightKg} onChange={e => setDietForm(f => ({...f, weightKg: e.target.value}))} className={inputCls} />
                  </Field>
                  <Field label="Goal">
                    <select value={dietForm.goal} onChange={e => setDietForm(f => ({...f, goal: e.target.value}))} className={selectCls}>
                      <option value="weight_loss">Weight Loss</option>
                      <option value="muscle_gain">Muscle Gain</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="general_health">General Health</option>
                    </select>
                  </Field>
                  <Field label="Activity Level">
                    <select value={dietForm.activityLevel} onChange={e => setDietForm(f => ({...f, activityLevel: e.target.value}))} className={selectCls}>
                      <option value="sedentary">Sedentary</option>
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="active">Active</option>
                      <option value="very_active">Very Active</option>
                    </select>
                  </Field>
                  <Field label="Diet Preference">
                    <select value={dietForm.dietaryPreference} onChange={e => setDietForm(f => ({...f, dietaryPreference: e.target.value}))} className={selectCls}>
                      <option value="non_vegetarian">Non-Vegetarian</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="pescatarian">Pescatarian</option>
                    </select>
                  </Field>
                  <Field label="Meals per Day">
                    <select value={dietForm.mealsPerDay} onChange={e => setDietForm(f => ({...f, mealsPerDay: e.target.value}))} className={selectCls}>
                      <option value="3">3 meals</option>
                      <option value="4">4 meals</option>
                      <option value="5">5 meals</option>
                      <option value="6">6 meals</option>
                    </select>
                  </Field>
                  <div className="col-span-2">
                    <Field label="Allergies / Restrictions (optional)">
                      <input type="text" placeholder="e.g. nuts, dairy, gluten"
                        value={dietForm.allergies} onChange={e => setDietForm(f => ({...f, allergies: e.target.value}))} className={inputCls} />
                    </Field>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Age">
                    <input type="number" min="10" max="100" placeholder="e.g. 25"
                      value={wkForm.age} onChange={e => setWkForm(f => ({...f, age: e.target.value}))} className={inputCls} />
                  </Field>
                  <Field label="Gender">
                    <select value={wkForm.gender} onChange={e => setWkForm(f => ({...f, gender: e.target.value}))} className={selectCls}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Fitness Level">
                    <select value={wkForm.fitnessLevel} onChange={e => setWkForm(f => ({...f, fitnessLevel: e.target.value}))} className={selectCls}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </Field>
                  <Field label="Goal">
                    <select value={wkForm.goal} onChange={e => setWkForm(f => ({...f, goal: e.target.value}))} className={selectCls}>
                      <option value="weight_loss">Weight Loss</option>
                      <option value="muscle_gain">Muscle Gain</option>
                      <option value="strength">Strength</option>
                      <option value="endurance">Endurance</option>
                      <option value="flexibility">Flexibility</option>
                    </select>
                  </Field>
                  <Field label="Days per Week">
                    <select value={wkForm.daysPerWeek} onChange={e => setWkForm(f => ({...f, daysPerWeek: e.target.value}))} className={selectCls}>
                      <option value="3">3 days</option>
                      <option value="4">4 days</option>
                      <option value="5">5 days</option>
                      <option value="6">6 days</option>
                    </select>
                  </Field>
                  <Field label="Equipment">
                    <select value={wkForm.availableEquipment} onChange={e => setWkForm(f => ({...f, availableEquipment: e.target.value}))} className={selectCls}>
                      <option value="gym">Full Gym</option>
                      <option value="home">Home (no equipment)</option>
                      <option value="minimal">Minimal (dumbbells)</option>
                      <option value="full_gym">Commercial Gym</option>
                    </select>
                  </Field>
                  <div className="col-span-2">
                    <Field label="Injuries / Limitations (optional)">
                      <input type="text" placeholder="e.g. knee pain, lower back issues"
                        value={wkForm.currentInjuries} onChange={e => setWkForm(f => ({...f, currentInjuries: e.target.value}))} className={inputCls} />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "form" && (
          <div className="p-5 border-t border-white/8 shrink-0">
            <button
              onClick={handleGenerate}
              className={`w-full flex items-center justify-center gap-2.5 font-semibold py-3 rounded-xl transition-all disabled:opacity-60 ${
                isDiet
                  ? "bg-green-500 hover:bg-green-400 text-white"
                  : "bg-purple-500 hover:bg-purple-400 text-white"
              }`}
            >
              <Zap className="w-4 h-4" /> Generate Plan (1 credit)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
