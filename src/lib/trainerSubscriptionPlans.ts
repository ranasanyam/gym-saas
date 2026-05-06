export interface TrainerPlan {
  slug: string;
  name: string;
  price: number;
  durationDays: number;
  badge?: string;
  features: string[];
}

export const TRAINER_PLANS: TrainerPlan[] = [
  {
    slug: "monthly",
    name: "Monthly",
    price: 99,
    durationDays: 30,
    features: [
      "Browse all job postings with full details",
      "View gym contact information",
      "Apply to unlimited jobs",
      "Access application instructions",
    ],
  },
  {
    slug: "quarterly",
    name: "Quarterly",
    price: 199,
    durationDays: 90,
    badge: "Best Value",
    features: [
      "Browse all job postings with full details",
      "View gym contact information",
      "Apply to unlimited jobs",
      "Access application instructions",
      "Save ₹198 vs monthly",
    ],
  },
  {
    slug: "yearly",
    name: "Yearly",
    price: 999,
    durationDays: 365,
    badge: "Most Popular",
    features: [
      "Browse all job postings with full details",
      "View gym contact information",
      "Apply to unlimited jobs",
      "Access application instructions",
      "Save ₹1589 vs monthly",
      "Priority support",
    ],
  },
];

export function getTrainerPlan(slug: string): TrainerPlan | undefined {
  return TRAINER_PLANS.find((p) => p.slug === slug);
}
