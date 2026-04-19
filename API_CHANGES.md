# GymStack API Changes — Mobile Developer Reference

> **Last updated:** 2026-04-18
> **Base URL:** `https://<your-domain>`  
> All paths below are relative to the base URL.

---

## Section 1 — Standard Response Contract

Every API route now returns a **consistent envelope** regardless of success or failure.

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": [ ... ]  // optional — present on validation errors (array of Zod issues)
  }
}
```

### Full Error Code Reference

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `UNAUTHORIZED` | 401 | Not authenticated — missing or invalid token |
| `FORBIDDEN` | 403 | Authenticated but not permitted (wrong role) |
| `PLAN_LIMIT_REACHED` | 403 | Count limit hit on current plan (e.g., max gyms) |
| `PLAN_FEATURE_BLOCKED` | 403 | Feature not available on current plan |
| `SUBSCRIPTION_EXPIRED` | 403 | Subscription has expired (past 7-day grace period) |
| `VALIDATION_ERROR` | 422 | Request body failed Zod schema validation |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Resource already exists (e.g., member already enrolled) |
| `RATE_LIMITED` | 429 | Too many requests |
| `BAD_REQUEST` | 400 | Invalid request structure |
| `INTERNAL_ERROR` | 500 | Server-side error |

> **Note:** Many existing routes still return legacy error shapes (`{ error: "string" }`). The new shape above is used by routes updated in this release. Mobile app should handle **both** shapes during the migration window.

---

## Section 2 — Changed Endpoints

### `POST /api/owner/gyms`

**What changed:** Removed accidental debug `console.log` calls, added try/catch, removed unused `auth` import. Behavior is unchanged.

**Before (internal):**
```
console.log('usage', usage)
console.log('sub', sub)
```
**After:** Logs removed. Response shape unchanged.

---

### `POST /api/subscriptions/subscribe`

**What changed:** Redundant ternary `isPaid ? "COMPLETED" : "COMPLETED"` cleaned up. No behavioral change — payment status is always `COMPLETED`.

---

### `POST /api/owner/members`

**What changed:** Fixed variable shadowing bug where inner `const plan` shadowed outer `plan`. No behavioral change.

---

## Section 3 — New Endpoints

No new endpoints were added in this release. The changes are infrastructure and tooling.

---

## Section 4 — Removed Endpoints

No endpoints were removed in this release.

---

## Section 5 — Auth & Headers

### Web (Browser) Auth
Uses NextAuth session cookies. The cookie is set automatically on login.

### Mobile Auth (Bearer Token)
Every request to a protected route must include:

```
Authorization: Bearer <accessToken>
```

#### Login Flow

```
POST /api/auth/mobile-login
Content-Type: application/json

{
  "email": "user@example.com",     // OR mobile number: "9876543210" / "+919876543210"
  "password": "secret"
}
```

**Response:**
```json
{
  "accessToken":      "<jwt>",
  "refreshToken":     "<opaque>",
  "expiresIn":        900,
  "refreshExpiresIn": 7776000,
  "profile": {
    "id":           "cuid",
    "fullName":     "John Doe",
    "email":        "user@example.com",
    "role":         "owner",
    "avatarUrl":    null,
    "mobileNumber": "9876543210",
    "wallet":       { "balance": 0 },
    "referralCode": "JOHN1234"
  }
}
```

#### Token Refresh

```
POST /api/auth/mobile-refresh
Content-Type: application/json

{ "refreshToken": "<opaque>" }
```

**Response:**
```json
{
  "accessToken":  "<new-jwt>",
  "refreshToken": "<new-opaque>",
  "expiresIn":    900
}
```

Refresh tokens are **single-use and rotated** on every refresh. Store the new refreshToken after each refresh call.

#### Logout

```
POST /api/auth/mobile-logout
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "refreshToken": "<opaque>" }
```

#### Auth Failure Response

When auth fails, all protected routes return:

```json
HTTP 401
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

---

## Section 6 — Plan Gating Errors

When a feature is accessed on an insufficient plan:

```json
HTTP 403
{
  "success": false,
  "error": {
    "code": "PLAN_FEATURE_BLOCKED",
    "message": "Supplements is not available on your current plan. Please upgrade to access this feature."
  }
}
```

Or when a count limit is hit:

```json
HTTP 403
{
  "success": false,
  "error": {
    "code": "PLAN_LIMIT_REACHED",
    "message": "You've reached the limit of 1 gyms on your current plan. Please upgrade to add more."
  }
}
```

When a subscription is expired:

```json
HTTP 403
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_EXPIRED",
    "message": "Your subscription has expired. Please renew to continue using this feature."
  }
}
```

> **Mobile action:** When receiving any `403` with `upgradeRequired: true` OR codes `PLAN_FEATURE_BLOCKED`, `PLAN_LIMIT_REACHED`, or `SUBSCRIPTION_EXPIRED` — redirect the owner to the subscription upgrade screen.

### Plan Tiers (ascending capability)

| Plan | Key Features |
|------|-------------|
| `Free` | Attendance, member CRUD, basic analytics |
| `Basic` | + Workout/diet plans, payments, reports, referral |
| `Pro` | + Supplements, full analytics, plan templates |
| `Enterprise` | + Multiple gyms (up to 5), API access |

### Grace Period
After a plan expires, the owner has **7 days** to renew before features are hard-blocked. During grace period, `isInGracePeriod: true` is returned from `/api/owner/subscription`.

---

## Section 7 — Pagination & Filtering Conventions

All list endpoints support these query params:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number (1-indexed) |
| `limit` | number | `20` | Items per page (max 100) |
| `search` | string | `""` | Full-text search (name, email, mobile) |
| `gymId` | string | `""` | Filter by specific gym |
| `status` | string | `""` | Filter by status (ACTIVE, INACTIVE, etc.) |

**Paginated list response:**
```json
{
  "members": [ ... ],
  "total":   142,
  "pages":   8
}
```

> **Note:** The top-level `data` wrapper from the standard contract is NOT yet applied to all list routes. Routes updated in this release still return the list directly. Full standardization will happen in a future release.

---

## Section 8 — Full Endpoint Index

### Auth

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/api/auth/mobile-login` | None | Any | Issue JWT tokens |
| POST | `/api/auth/mobile-logout` | Bearer | Any | Revoke refresh token |
| POST | `/api/auth/mobile-refresh` | None | Any | Rotate refresh token |
| POST | `/api/auth/register` | None | Any | Email signup |
| POST | `/api/auth/send-otp` | None | Any | Email OTP for signup |
| POST | `/api/auth/verify-otp` | None | Any | Verify email OTP |
| POST | `/api/auth/forgot-password` | None | Any | Password reset request |
| POST | `/api/auth/reset-password` | None | Any | Confirm password reset |
| POST | `/api/auth/check-mobile-status` | None | Any | Check if mobile is registered |
| POST | `/api/auth/validate-token` | None | Any | Validate invite/reset token |
| POST | `/api/auth/complete-profile` | None | Any | Complete invited profile |
| POST | `/api/auth/request-completion-otp` | None | Any | OTP for profile completion |

### Profile

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/profile/me` | Session/Bearer | Any | Current user profile |
| POST | `/api/profile/set-role` | Session/Bearer | Any | Set role (one-time) |
| POST | `/api/profile/update` | Session/Bearer | Any | Update profile fields |
| POST | `/api/profile/change-password` | Session/Bearer | Any | Change password |

### Owner — Gyms

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/owner/gyms` | Session/Bearer | Owner | List gyms |
| POST | `/api/owner/gyms` | Session/Bearer | Owner | Create gym |
| GET | `/api/owner/gyms/[gymId]` | Session/Bearer | Owner | Gym detail |
| PATCH | `/api/owner/gyms/[gymId]` | Session/Bearer | Owner | Update gym |
| DELETE | `/api/owner/gyms/[gymId]` | Session/Bearer | Owner | Delete gym |

### Owner — Members

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/owner/members` | Session/Bearer | Owner | List members (paginated) |
| POST | `/api/owner/members` | Session/Bearer | Owner | Add member (SMS invite) |
| GET | `/api/owner/members/[memberId]` | Session/Bearer | Owner | Member detail |
| PATCH | `/api/owner/members/[memberId]` | Session/Bearer | Owner | Update member |
| DELETE | `/api/owner/members/[memberId]` | Session/Bearer | Owner | Remove member |

**POST /api/owner/members request body:**
```json
{
  "gymId":            "cuid",
  "fullName":         "Jane Doe",
  "mobileNumber":     "9876543210",
  "membershipPlanId": "cuid (optional)",
  "startDate":        "2024-01-01T00:00:00Z (optional)",
  "endDate":          "2024-12-31T00:00:00Z (optional)",
  "paymentReceived":  true
}
```

**POST /api/owner/members response:**
```json
{
  "outcome":     "created | reinvited | linked",
  "id":          "cuid",
  "gymMemberId": "cuid"
}
```

- `created` → New profile created, SMS invite sent
- `reinvited` → Existing INVITED profile, SMS resent
- `linked` → Existing ACTIVE profile silently added

### Owner — Trainers

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/owner/trainers` | Session/Bearer | Owner | List trainers |
| POST | `/api/owner/trainers` | Session/Bearer | Owner | Add trainer (SMS invite) |
| GET | `/api/owner/trainers/[trainerId]` | Session/Bearer | Owner | Trainer detail |
| PATCH | `/api/owner/trainers/[trainerId]` | Session/Bearer | Owner | Update trainer |

### Owner — Dashboard & Reports

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/owner/dashboard` | Session/Bearer | Owner | Dashboard stats |
| GET | `/api/owner/reports` | Session/Bearer | Owner | Full analytics (Basic+ plan) |

**GET /api/owner/dashboard query params:**
```
?gymId=cuid          (optional — filter to one gym)
?range=last_30_days  (today | last_7_days | last_30_days | last_90_days | financial_year | custom)
?customStart=ISO     (required when range=custom)
?customEnd=ISO       (required when range=custom)
```

### Owner — Subscription

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/owner/subscription` | Session/Bearer | Owner | Active subscription + usage |

**Response:**
```json
{
  "subscription": {
    "id":               "cuid",
    "status":           "ACTIVE",
    "planName":         "Pro",
    "planSlug":         "pro",
    "currentPeriodEnd": "2025-01-01T00:00:00Z",
    "isExpired":        false,
    "isInGracePeriod":  false,
    "isLifetime":       false,
    "isTrial":          false,
    "daysRemaining":    45,
    "limits": {
      "maxGyms": 1,
      "hasWorkoutPlans": true,
      "hasDietPlans": true,
      "hasSupplements": true,
      "hasPayments": true,
      "hasFullAnalytics": true,
      ...
    }
  },
  "usage": {
    "gyms": 1,
    "members": 43,
    "trainers": 3,
    "membershipPlans": 4,
    "notificationsThisMonth": 12
  }
}
```

### Owner — Payments

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/owner/payments` | Session/Bearer | Owner | Payment history (paginated) |

### Owner — Plans (Membership)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/owner/plans` | Session/Bearer | Owner | List membership plans |
| POST | `/api/owner/plans` | Session/Bearer | Owner | Create plan |

### Owner — Workouts & Diets

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/owner/workouts` | Session/Bearer | Owner | List workout plans |
| POST | `/api/owner/workouts` | Session/Bearer | Owner | Create workout plan |
| GET | `/api/owner/workouts/[planId]` | Session/Bearer | Owner | Workout detail |
| PATCH | `/api/owner/workouts/[planId]` | Session/Bearer | Owner | Update workout |
| DELETE | `/api/owner/workouts/[planId]` | Session/Bearer | Owner | Delete workout |
| GET | `/api/owner/diets` | Session/Bearer | Owner | List diet plans |
| POST | `/api/owner/diets` | Session/Bearer | Owner | Create diet plan |
| GET | `/api/owner/diets/[planId]` | Session/Bearer | Owner | Diet detail |
| PATCH | `/api/owner/diets/[planId]` | Session/Bearer | Owner | Update diet |
| DELETE | `/api/owner/diets/[planId]` | Session/Bearer | Owner | Delete diet |

### Owner — Other

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/owner/attendance` | Session/Bearer | Owner | Attendance log |
| POST | `/api/owner/attendance` | Session/Bearer | Owner | Log attendance |
| GET | `/api/owner/supplements` | Session/Bearer | Owner | Supplement inventory |
| POST | `/api/owner/supplements` | Session/Bearer | Owner | Add supplement |
| GET | `/api/owner/expenses` | Session/Bearer | Owner | Expense list |
| POST | `/api/owner/expenses` | Session/Bearer | Owner | Add expense |
| GET | `/api/owner/notifications` | Session/Bearer | Owner | Notifications |
| POST | `/api/owner/notifications` | Session/Bearer | Owner | Send notification |
| POST | `/api/owner/search-profiles` | Session/Bearer | Owner | Search users by email/name |
| PATCH | `/api/owner/update` | Session/Bearer | Owner | Update owner profile |
| POST | `/api/owner/change-password` | Session/Bearer | Owner | Change password |

### Billing / SaaS Subscriptions

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/subscriptions/plans` | None | Any | List available SaaS plans |
| POST | `/api/subscriptions/subscribe` | Session/Bearer | Owner | Activate plan after payment |
| POST | `/api/subscriptions/create-order` | Session/Bearer | Owner | Create Razorpay order |
| GET | `/api/billing/plans` | None | Any | Same as subscriptions/plans |

### Trainer

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/trainer/dashboard` | Session/Bearer | Trainer | Trainer dashboard |
| GET | `/api/trainer/members` | Session/Bearer | Trainer | Assigned members |
| GET | `/api/trainer/members/[memberId]` | Session/Bearer | Trainer | Member detail |
| GET | `/api/trainer/workouts` | Session/Bearer | Trainer | Workout plans |
| POST | `/api/trainer/workouts` | Session/Bearer | Trainer | Create workout |
| GET | `/api/trainer/workouts/[planId]` | Session/Bearer | Trainer | Workout detail |
| PATCH | `/api/trainer/workouts/[planId]` | Session/Bearer | Trainer | Update workout |
| DELETE | `/api/trainer/workouts/[planId]` | Session/Bearer | Trainer | Delete workout |
| GET | `/api/trainer/diets` | Session/Bearer | Trainer | Diet plans |
| POST | `/api/trainer/diets` | Session/Bearer | Trainer | Create diet |
| GET | `/api/trainer/diets/[planId]` | Session/Bearer | Trainer | Diet detail |
| PATCH | `/api/trainer/diets/[planId]` | Session/Bearer | Trainer | Update diet |
| DELETE | `/api/trainer/diets/[planId]` | Session/Bearer | Trainer | Delete diet |
| GET | `/api/trainer/attendance` | Session/Bearer | Trainer | Attendance |
| POST | `/api/trainer/attendance` | Session/Bearer | Trainer | Log attendance |
| GET | `/api/trainer/notifications` | Session/Bearer | Trainer | Notifications |
| GET | `/api/trainer/gyms` | Session/Bearer | Trainer | Assigned gyms |
| GET | `/api/trainer/discover` | Session/Bearer | Trainer | Browse gyms |

### Member

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/member/dashboard` | Session/Bearer | Member | Member dashboard |
| GET | `/api/member/attendance` | Session/Bearer | Member | Attendance history |
| POST | `/api/member/attendance` | Session/Bearer | Member | Log check-in |
| GET | `/api/member/workouts` | Session/Bearer | Member | Assigned workouts |
| GET | `/api/member/diet` | Session/Bearer | Member | Assigned diet |
| GET | `/api/member/payments` | Session/Bearer | Member | Payment history |
| GET | `/api/member/gyms` | Session/Bearer | Member | Enrolled gyms |
| GET | `/api/member/has-gym` | Session/Bearer | Member | Check if enrolled in any gym |
| GET | `/api/member/discover` | Session/Bearer | Member | Browse public gyms |
| GET | `/api/member/notifications` | Session/Bearer | Member | Notifications |
| GET | `/api/member/body-metrics` | Session/Bearer | Member | Body metrics history |
| GET | `/api/member/announcements` | Session/Bearer | Member | Gym announcements |
| GET | `/api/member/supplements` | Session/Bearer | Member | Available supplements |

### Notifications

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/notifications/unread-count` | Session/Bearer | Any | Unread count |
| POST | `/api/push/register-device` | Session/Bearer | Any | Register push device |
| POST | `/api/push/subscribe` | Session/Bearer | Any | Subscribe to push |

### Misc

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/api/health` | None | Any | Health check |
| POST | `/api/upload` | Session/Bearer | Any | Image upload (Cloudinary) |
| GET | `/api/wallet` | Session/Bearer | Any | Wallet balance |
| GET | `/api/referral` | Session/Bearer | Any | Referral info |
| POST | `/api/contact` | None | Any | Contact form |

---

## Mobile Developer Briefing

**Most important breaking changes to act on first:**

1. **Auth token structure is unchanged** — the `Authorization: Bearer <accessToken>` pattern remains the same. Access tokens are valid for 15 minutes; refresh tokens last 90 days and are single-use (always store the new `refreshToken` after each `/api/auth/mobile-refresh` call).

2. **Plan gating is now enforced server-side** — any request to a feature not on the owner's plan returns HTTP 403 with `error.code` of `PLAN_FEATURE_BLOCKED`, `PLAN_LIMIT_REACHED`, or `SUBSCRIPTION_EXPIRED`. When the mobile app receives any of these codes on a 403 response, redirect the owner to the subscription upgrade screen.

3. **Member add flow changed** — `POST /api/owner/members` no longer requires an email. It now accepts `mobileNumber` + `fullName` and handles the invite flow internally. The response now returns an `outcome` field (`"created"`, `"reinvited"`, or `"linked"`) instead of just the new member ID.

4. **Error response shape is being standardized** — new infrastructure routes return `{ success: false, error: { code, message } }`. Existing routes still return `{ error: "string" }`. Build your error handling to check for both shapes during this transition period.

5. **No endpoints were deleted** — all existing mobile API paths remain intact. This release is additive only.
