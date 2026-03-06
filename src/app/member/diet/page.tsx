// // src/app/member/diet/page.tsx
// "use client"

// import { useEffect, useState } from "react"
// import { UtensilsCrossed, ChevronDown, ChevronUp, Flame, Loader2, Calendar, Target } from "lucide-react"

// const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]
// const DAY_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
// const MEALS = ["Breakfast","Mid-Morning Snack","Lunch","Evening Snack","Dinner","Post-Workout"]

// export default function MemberDietPage() {
//   const [plans, setPlans]       = useState<any[]>([])
//   const [loading, setLoading]   = useState(true)
//   const [expanded, setExpanded] = useState<string | null>(null)
//   const [activeDay, setActiveDay] = useState<Record<string,string>>({})
//   const [activeMeal, setActiveMeal] = useState<Record<string,string>>({})

//   useEffect(() => {
//     fetch("/api/member/diet").then(r => r.json()).then(d => {
//       setPlans(Array.isArray(d) ? d : [])
//       if (d.length > 0) {
//         const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
//         const dInit: Record<string,string> = {}
//         const mInit: Record<string,string> = {}
//         d.forEach((p: any) => { dInit[p.id] = today; mInit[p.id] = "Breakfast" })
//         setActiveDay(dInit); setActiveMeal(mInit)
//         setExpanded(d[0].id)
//       }
//     }).finally(() => setLoading(false))
//   }, [])

//   if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>

//   if (plans.length === 0) return (
//     <div className="flex flex-col items-center justify-center h-64 space-y-3">
//       <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
//         <UtensilsCrossed className="w-8 h-8 text-white/20" />
//       </div>
//       <p className="text-white font-semibold">No diet plans yet</p>
//       <p className="text-white/35 text-sm">Your trainer or gym will assign plans here</p>
//     </div>
//   )

//   return (
//     <div className="max-w-3xl space-y-5">
//       <h2 className="text-2xl font-display font-bold text-white">Diet Plans</h2>

//       {plans.map(plan => {
//         const isOpen     = expanded === plan.id
//         const planData   = plan.planData ?? {}
//         const currentDay = activeDay[plan.id] ?? DAYS[0]
//         const currentMeal = activeMeal[plan.id] ?? MEALS[0]
//         const dayData    = planData[currentDay] ?? {}
//         const items      = dayData[currentMeal] ?? []

//         // Daily totals across all meals for current day
//         const allItems: any[] = MEALS.flatMap(m => dayData[m] ?? [])
//         const totals = allItems.reduce((acc, item) => ({
//           kcal: acc.kcal + (Number(item.kcal) || 0),
//           protein: acc.protein + (Number(item.protein) || 0),
//           carbs: acc.carbs + (Number(item.carbs) || 0),
//           fat: acc.fat + (Number(item.fat) || 0),
//         }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })

//         return (
//           <div key={plan.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
//             <button onClick={() => setExpanded(isOpen ? null : plan.id)}
//               className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/2 transition-colors">
//               <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
//                 <UtensilsCrossed className="w-5 h-5 text-orange-400" />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 flex-wrap">
//                   <p className="text-white font-semibold">{plan.title ?? "Diet Plan"}</p>
//                   {plan.isGlobal && <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">Gym Plan</span>}
//                 </div>
//                 <div className="flex items-center gap-3 mt-1 text-white/35 text-xs">
//                   {plan.goal && <span className="flex items-center gap-1"><Target className="w-3 h-3" />{plan.goal}</span>}
//                   {plan.caloriesTarget && <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{plan.caloriesTarget} kcal/day</span>}
//                   <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{plan.durationWeeks}w</span>
//                 </div>
//               </div>
//               {isOpen ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
//             </button>

//             {isOpen && (
//               <div className="border-t border-white/6">
//                 {/* Day tabs */}
//                 <div className="flex gap-1 p-3 overflow-x-auto border-b border-white/5">
//                   {DAYS.map((day, i) => (
//                     <button key={day}
//                       onClick={() => setActiveDay(p => ({ ...p, [plan.id]: day }))}
//                       className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
//                         currentDay === day ? "bg-primary text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"
//                       }`}>
//                       {DAY_SHORT[i]}
//                     </button>
//                   ))}
//                 </div>

//                 {/* Daily summary */}
//                 {allItems.length > 0 && (
//                   <div className="grid grid-cols-4 gap-2 px-5 pt-4 pb-2">
//                     {[
//                       { label: "Calories", value: `${Math.round(totals.kcal)}`, unit: "kcal", color: "text-orange-400" },
//                       { label: "Protein",  value: `${Math.round(totals.protein)}`, unit: "g", color: "text-blue-400" },
//                       { label: "Carbs",    value: `${Math.round(totals.carbs)}`, unit: "g",  color: "text-green-400" },
//                       { label: "Fat",      value: `${Math.round(totals.fat)}`, unit: "g",   color: "text-yellow-400" },
//                     ].map(s => (
//                       <div key={s.label} className="bg-white/4 rounded-xl p-3 text-center">
//                         <p className={`text-lg font-display font-bold ${s.color}`}>{s.value}<span className="text-xs font-normal text-white/30 ml-0.5">{s.unit}</span></p>
//                         <p className="text-white/30 text-[10px] mt-0.5">{s.label}</p>
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {/* Meal tabs */}
//                 <div className="flex gap-1.5 px-5 pb-2 pt-3 overflow-x-auto">
//                   {MEALS.map(meal => {
//                     const count = (dayData[meal] ?? []).length
//                     return (
//                       <button key={meal}
//                         onClick={() => setActiveMeal(p => ({ ...p, [plan.id]: meal }))}
//                         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all shrink-0 border ${
//                           currentMeal === meal
//                             ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
//                             : "border-white/8 text-white/40 hover:text-white/70"
//                         }`}>
//                         {meal}
//                         {count > 0 && <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${currentMeal === meal ? "bg-orange-500/30" : "bg-white/10"}`}>{count}</span>}
//                       </button>
//                     )
//                   })}
//                 </div>

//                 {/* Food items */}
//                 <div className="px-5 pb-5 pt-2 space-y-2">
//                   {items.length === 0 ? (
//                     <div className="text-center py-6">
//                       <UtensilsCrossed className="w-6 h-6 text-white/15 mx-auto mb-2" />
//                       <p className="text-white/30 text-sm">No items for this meal</p>
//                     </div>
//                   ) : (
//                     <>
//                       <div className="grid grid-cols-6 text-[10px] text-white/30 uppercase tracking-wider px-4 py-1">
//                         <span className="col-span-2">Food</span><span className="text-center">Qty</span><span className="text-center">Kcal</span><span className="text-center">Protein</span><span className="text-center">Carbs</span>
//                       </div>
//                       {items.map((item: any, i: number) => (
//                         <div key={i} className="grid grid-cols-6 items-center bg-[hsl(220_25%_12%)] rounded-xl px-4 py-3 text-sm">
//                           <span className="col-span-2 text-white font-medium truncate">{item.name}</span>
//                           <span className="text-center text-white/50 text-xs">{item.qty}</span>
//                           <span className="text-center text-orange-400 text-xs font-medium">{item.kcal}</span>
//                           <span className="text-center text-blue-400 text-xs">{item.protein}g</span>
//                           <span className="text-center text-green-400 text-xs">{item.carbs}g</span>
//                         </div>
//                       ))}
//                     </>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         )
//       })}
//     </div>
//   )
// }



// src/app/member/diet/page.tsx
"use client"

import { useEffect, useState } from "react"
import { UtensilsCrossed, ChevronDown, ChevronUp, Flame, Loader2, Target } from "lucide-react"

// Must exactly match the DAYS and MEAL_TIMES arrays used by the owner diet form
const DAYS  = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
const MEALS = ["Breakfast","Mid-Morning Snack","Lunch","Evening Snack","Dinner","Post-Workout"]

export default function MemberDietPage() {
  const [plans, setPlans]           = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState<string | null>(null)   // all collapsed by default
  const [activeDay, setActiveDay]   = useState<Record<string,string>>({})
  const [activeMeal, setActiveMeal] = useState<Record<string,string>>({})

  useEffect(() => {
    fetch("/api/member/diet").then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : []
      setPlans(list)
      // default each plan to today's day name
      const todayIdx = new Date().getDay()                       // 0=Sun
      const todayKey = DAYS[todayIdx === 0 ? 6 : todayIdx - 1]  // shift: Sun→Saturday index
      const dInit: Record<string,string> = {}
      const mInit: Record<string,string> = {}
      list.forEach((p: any) => { dInit[p.id] = todayKey; mInit[p.id] = "Breakfast" })
      setActiveDay(dInit)
      setActiveMeal(mInit)
      // do NOT auto-expand any plan — let member choose
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )

  if (plans.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-3">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
        <UtensilsCrossed className="w-8 h-8 text-white/20" />
      </div>
      <p className="text-white font-semibold">No diet plans yet</p>
      <p className="text-white/35 text-sm">Your trainer or gym will assign plans here</p>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-white">Diet Plans</h2>
        <span className="text-white/35 text-sm">{plans.length} plan{plans.length !== 1 ? "s" : ""}</span>
      </div>

      {plans.map(plan => {
        const isOpen      = expanded === plan.id
        // planData structure: { weekStartDate, meals: { "Monday__Breakfast": [...items] } }
        const meals: Record<string, any[]> = plan.planData?.meals ?? {}
        const currentDay  = activeDay[plan.id]  ?? "Monday"
        const currentMeal = activeMeal[plan.id] ?? "Breakfast"
        const mealKey     = `${currentDay}__${currentMeal}`
        const items: any[] = meals[mealKey] ?? []

        // Daily nutrition totals across all meals for the current day
        const allDayItems = MEALS.flatMap(m => meals[`${currentDay}__${m}`] ?? [])
        const totals = allDayItems.reduce(
          (acc, item) => ({
            calories: acc.calories + (Number(item.calories) || 0),
            protein:  acc.protein  + (Number(item.protein)  || 0),
            carbs:    acc.carbs    + (Number(item.carbs)    || 0),
            fat:      acc.fat      + (Number(item.fat)      || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        )

        // Count total items across all meals to show in header
        const totalItems = Object.values(meals).reduce((acc, arr) => acc + arr.length, 0)

        return (
          <div key={plan.id} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">

            {/* Plan header — click to expand/collapse */}
            <button
              onClick={() => setExpanded(isOpen ? null : plan.id)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/2 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold">{plan.title ?? "Diet Plan"}</p>
                  {plan.isGlobal && (
                    <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">Gym Plan</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-white/35 text-xs flex-wrap">
                  {plan.goal && (
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />{plan.goal}</span>
                  )}
                  {plan.caloriesTarget && (
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{plan.caloriesTarget} kcal/day target</span>
                  )}
                  {totalItems > 0 && (
                    <span className="text-white/25">{totalItems} food item{totalItems !== 1 ? "s" : ""}</span>
                  )}
                  <span>by {plan.creator?.fullName ?? "Gym"}</span>
                </div>
              </div>
              {isOpen
                ? <ChevronUp className="w-4 h-4 text-white/30 shrink-0" />
                : <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
              }
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t border-white/6">

                {/* Day tabs */}
                <div className="flex gap-1 p-3 overflow-x-auto border-b border-white/5">
                  {DAYS.map(day => {
                    const dayHasItems = MEALS.some(m => (meals[`${day}__${m}`] ?? []).length > 0)
                    return (
                      <button
                        key={day}
                        onClick={() => setActiveDay(p => ({ ...p, [plan.id]: day }))}
                        className={`relative px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                          currentDay === day
                            ? "bg-primary text-white"
                            : "text-white/40 hover:text-white/70 hover:bg-white/5"
                        }`}
                      >
                        {day.slice(0, 3)}
                        {dayHasItems && (
                          <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                            currentDay === day ? "bg-white" : "bg-orange-400"
                          }`} />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Daily nutrition summary */}
                {allDayItems.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 px-5 pt-4 pb-2">
                    {[
                      { label: "Calories", value: Math.round(totals.calories), unit: "kcal", color: "text-orange-400" },
                      { label: "Protein",  value: Math.round(totals.protein),  unit: "g",    color: "text-blue-400"   },
                      { label: "Carbs",    value: Math.round(totals.carbs),    unit: "g",    color: "text-green-400"  },
                      { label: "Fat",      value: Math.round(totals.fat),      unit: "g",    color: "text-yellow-400" },
                    ].map(s => (
                      <div key={s.label} className="bg-white/4 rounded-xl p-3 text-center">
                        <p className={`text-lg font-display font-bold ${s.color}`}>
                          {s.value}<span className="text-xs font-normal text-white/30 ml-0.5">{s.unit}</span>
                        </p>
                        <p className="text-white/30 text-[10px] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Meal tabs */}
                <div className="flex gap-1.5 px-5 pb-2 pt-3 overflow-x-auto">
                  {MEALS.map(meal => {
                    const count = (meals[`${currentDay}__${meal}`] ?? []).length
                    return (
                      <button
                        key={meal}
                        onClick={() => setActiveMeal(p => ({ ...p, [plan.id]: meal }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all shrink-0 border ${
                          currentMeal === meal
                            ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                            : "border-white/8 text-white/40 hover:text-white/70"
                        }`}
                      >
                        {meal}
                        {count > 0 && (
                          <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            currentMeal === meal ? "bg-orange-500/30" : "bg-white/10"
                          }`}>{count}</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Food items for selected meal */}
                <div className="px-5 pb-5 pt-2 space-y-2">
                  {items.length === 0 ? (
                    <div className="text-center py-6">
                      <UtensilsCrossed className="w-6 h-6 text-white/15 mx-auto mb-2" />
                      <p className="text-white/30 text-sm">No items for {currentMeal} on {currentDay}</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-6 text-[10px] text-white/30 uppercase tracking-wider px-4 py-1">
                        <span className="col-span-2">Food</span>
                        <span className="text-center">Qty</span>
                        <span className="text-center">Kcal</span>
                        <span className="text-center">Protein</span>
                        <span className="text-center">Carbs</span>
                      </div>
                      {items.map((item: any, i: number) => (
                        <div key={i} className="grid grid-cols-6 items-center bg-[hsl(220_25%_12%)] rounded-xl px-4 py-3 text-sm">
                          <span className="col-span-2 text-white font-medium truncate">{item.name || "—"}</span>
                          {/* owner saves as: quantity, calories, protein, carbs, fat */}
                          <span className="text-center text-white/50 text-xs">{item.quantity || "—"}</span>
                          <span className="text-center text-orange-400 text-xs font-medium">{item.calories || "—"}</span>
                          <span className="text-center text-blue-400 text-xs">{item.protein ? `${item.protein}g` : "—"}</span>
                          <span className="text-center text-green-400 text-xs">{item.carbs ? `${item.carbs}g` : "—"}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}