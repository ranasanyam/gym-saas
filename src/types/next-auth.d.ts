import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string | null
      hasActivePlan?: boolean
      ownerPlanStatus?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    profileId?:    string
    role?:         string | null
    // hasActivePlan: true  → owner has an active/grace-period subscription
    // hasActivePlan: false → no subscription, or fully expired (past grace)
    // hasActivePlan: undefined → old token; proxy passes through
    hasActivePlan?: boolean
    ownerPlanStatus?: string | null
    // planExpired: true → had a subscription that has fully expired (past grace period)
    // used to show ?expired=true on /owner/choose-plan
    planExpired?:   boolean
  }
}
