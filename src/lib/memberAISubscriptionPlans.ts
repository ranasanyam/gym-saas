export interface MemberAIPlan {
  slug: "basic" | "standard" | "premium"
  name: string
  price: number          // INR
  durationMonths: number
  credits: number
  badge?: string
  features: string[]
}

export const MEMBER_AI_PLANS: MemberAIPlan[] = [
  {
    slug: "basic",
    name: "Basic",
    price: 99,
    durationMonths: 1,
    credits: 5,
    features: [
      "5 AI plan generations",
      "Diet & workout plans",
      "Free edits within 2 hours",
      "Valid for 1 month",
    ],
  },
  {
    slug: "standard",
    name: "Standard",
    price: 199,
    durationMonths: 3,
    credits: 20,
    badge: "Popular",
    features: [
      "20 AI plan generations",
      "Diet & workout plans",
      "Free edits within 2 hours",
      "Valid for 3 months",
    ],
  },
  {
    slug: "premium",
    name: "Premium",
    price: 799,
    durationMonths: 12,
    credits: 100,
    features: [
      "100 AI plan generations",
      "Diet & workout plans",
      "Free edits within 2 hours",
      "Valid for 12 months",
    ],
  },
]

export function getPlanBySlug(slug: string) {
  return MEMBER_AI_PLANS.find(p => p.slug === slug)
}
