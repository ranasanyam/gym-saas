# MOBILE_SYNC_REPORT.md
> **GymStack — Mobile Engineer Sync Document**
> Generated from a full read of the Next.js codebase (`src/app/api/`, `src/lib/`, `src/middleware.ts`, `src/lib/schemas/`).
> This document is self-contained. Do not open the Next.js project — use only this file and the mobile codebase.
> Base URL: your production domain, e.g. `https://gymstack.app`

---

## ⚠️ CRITICAL NOTICE — Read First

**The API does NOT consistently use a unified response envelope.** The `api-response.ts` utility (which defines `{ success: true, data }` / `{ success: false, error: { code, message } }`) exists but is **not yet applied to all routes**. The actual response format in production routes is:

- **Success**: raw data object (no `success` wrapper). E.g. `{ members: [...], total: 42, pages: 3 }`.
- **Error**: `{ error: "Human-readable message" }` with a few routes also including `code` and/or `upgradeRequired: true`.
- **Auth errors**: `{ error: "Unauthorized" }` at HTTP 401.
- **Plan wall errors**: `{ error: "...", code: "PLAN_NOT_SELECTED" | "PLAN_EXPIRED" }` at HTTP 403.

Do **not** write a single universal `response.data` unwrapper — parse each endpoint's documented shape.

---

## Section 1 — Standard API Response Contract

### 1.1 Success Response (most routes — raw shape)

Most routes return the payload directly:

```typescript
// Example: GET /api/owner/members
{
  members: GymMember[];   // array
  total:   number;        // total matching count
  pages:   number;        // total pages (limit = 20 per page)
}
```

### 1.2 Error Response (all routes)

```typescript
interface ApiError {
  error: string;             // always present: human-readable message
  code?: string;             // present only on plan-wall and specific validation errors
  upgradeRequired?: true;    // present on plan-limit / feature-gated errors
  conflicts?: ConflictItem[]; // present on bulk duplicate errors
  detail?: string;           // present on 500 errors that expose detail
}

interface ConflictItem {
  row:    number;  // 0-based row index in submitted array
  mobile: string;
  reason: string;
}
```

### 1.3 Standard Error Codes (from `api-response.ts`)

These constants are defined but only some routes use them explicitly:

```typescript
export const ERROR_CODES = {
  UNAUTHORIZED:         "UNAUTHORIZED",
  FORBIDDEN:            "FORBIDDEN",
  PLAN_LIMIT_REACHED:   "PLAN_LIMIT_REACHED",
  PLAN_FEATURE_BLOCKED: "PLAN_FEATURE_BLOCKED",
  SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED",
  VALIDATION_ERROR:     "VALIDATION_ERROR",
  NOT_FOUND:            "NOT_FOUND",
  CONFLICT:             "CONFLICT",
  RATE_LIMITED:         "RATE_LIMITED",
  INTERNAL_ERROR:       "INTERNAL_ERROR",
  BAD_REQUEST:          "BAD_REQUEST",
}
```

### 1.4 Paginated Response Shape

```typescript
interface PaginatedResponse<T> {
  // items key varies by entity (members / payments / expenses / etc.)
  [itemsKey: string]: T[];
  total: number;
  pages: number;
}
```

Default page size: **20 items**. Pass `?page=N` (1-indexed).

### 1.5 Example JSON Blocks

**Success (login)**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "a3f9c2...",
  "expiresIn": 900,
  "refreshExpiresIn": 7776000,
  "profile": {
    "id": "clx...",
    "fullName": "Rahul Sharma",
    "email": "rahul@example.com",
    "role": "owner",
    "avatarUrl": null,
    "mobileNumber": "9876543210",
    "city": "Mumbai",
    "gender": "MALE",
    "wallet": { "balance": 0 },
    "referralCode": "RAHUL1234"
  }
}
```

**Error (no plan selected)**
```json
{
  "error": "Please select a plan to continue.",
  "code": "PLAN_NOT_SELECTED"
}
```

**Error (plan limit)**
```json
{
  "error": "You've reached the limit of 200 members on your current plan. Please upgrade to add more.",
  "upgradeRequired": true
}
```

**Error (bulk conflict)**
```json
{
  "error": "Duplicate mobile numbers in batch",
  "conflicts": [
    { "row": 3, "mobile": "9876543210", "reason": "Duplicate mobile number in this batch" }
  ]
}
```

---

## Section 2 — Authentication & Session

### 2.1 Auth Mechanism

The mobile app uses **short-lived JWT access tokens** (`Authorization: Bearer <token>`) combined with **long-lived refresh tokens** stored securely on-device.

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access token | 15 minutes (900 seconds) | In-memory or secure store |
| Refresh token | 90 days (7,776,000 seconds) | Secure keychain / keystore |

### 2.2 Request Header (every authenticated request)

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

The backend (`mobileAuth.ts`) checks `Authorization: Bearer <token>` first, then falls back to NextAuth session cookie (web only). Mobile always sends the header.

### 2.3 Login

**Endpoint:** `POST /api/auth/mobile-login`
**Auth required:** No
**Rate limit:** 5 attempts per 15 min per IP

**Request body:**
```typescript
{
  email: string;    // email address OR 10-digit Indian mobile number (e.g. "9876543210" or "+919876543210")
  password: string;
}
```

**Identifier format:** The backend auto-detects:
- If it matches `/^(\+91)?[6-9]\d{9}$/` → mobile number login (looks up by `mobileNumber`)
- Otherwise → email login (looks up by `email`)

**Success response (200):**
```typescript
{
  accessToken:     string;  // JWT, valid 15 min
  refreshToken:    string;  // opaque hex token, valid 90 days
  expiresIn:       900;     // seconds
  refreshExpiresIn: 7776000; // seconds
  profile: {
    id:           string;
    fullName:     string;
    email:        string | null;
    role:         "owner" | "trainer" | "member" | null;
    avatarUrl:    string | null;
    mobileNumber: string | null;
    city:         string | null;
    gender:       string | null;
    wallet:       { balance: number } | null;
    referralCode: string | null;
  }
}
```

**Error responses:**
| HTTP | Body |
|------|------|
| 400 | `{ "error": "Email and password are required" }` |
| 401 | `{ "error": "Invalid password" }` |
| 401 | `{ "error": "Account exists but no password set (OAuth account)" }` |
| 404 | `{ "error": "No account found with this email or mobile number" }` |
| 429 | `{ "error": "Too many login attempts. Try again in N seconds." }` |
| 500 | `{ "error": "Login failed" }` |

### 2.4 Token Refresh

**Endpoint:** `POST /api/auth/mobile-refresh`
**Auth required:** No

**Request body:**
```typescript
{ refreshToken: string }
```

**Success response (200):**
```typescript
{
  accessToken:      string;  // new access token
  refreshToken:     string;  // new refresh token (old one is revoked)
  expiresIn:        900;
  refreshExpiresIn: 7776000;
}
```

**Behavior:** Refresh tokens are **single-use and rotated** — the old token is revoked in the same DB transaction that creates the new one. If `refreshToken` is invalid, expired, or already revoked, returns 401.

**Error responses:**
| HTTP | Body |
|------|------|
| 400 | `{ "error": "Refresh token required" }` |
| 401 | `{ "error": "Refresh token invalid or expired" }` |

### 2.5 Logout

**Endpoint:** `POST /api/auth/mobile-logout`
**Auth required:** No (idempotent)

**Request body:**
```typescript
{ refreshToken: string }
```

Always returns `{ "success": true }` — never fails. Revokes the token server-side. **Also** call `DELETE /api/push/register-device` with the Expo push token to stop receiving push notifications.

### 2.6 Auth Failure Response

Any protected endpoint with a missing/invalid/expired access token:
```json
HTTP 401
{ "error": "Unauthorized" }
```

The mobile app should:
1. Catch HTTP 401
2. Attempt refresh via `POST /api/auth/mobile-refresh`
3. If refresh succeeds → retry the original request with new access token
4. If refresh fails (401) → clear stored tokens → redirect to login screen

### 2.7 PLAN_NOT_SELECTED Response

When an owner has no active subscription, every owner API endpoint (except `/api/owner/subscription`) returns:
```json
HTTP 403
{
  "error": "Please select a plan to continue.",
  "code": "PLAN_NOT_SELECTED"
}
```

**Mobile app MUST:** on receiving `code === "PLAN_NOT_SELECTED"`, immediately navigate to the plan selection screen. Do not show a generic error.

When a plan has expired (past the 7-day grace period):
```json
HTTP 403
{
  "error": "Your plan has expired. Please renew to continue.",
  "code": "PLAN_EXPIRED"
}
```

**Mobile app MUST:** navigate to plan selection/renewal screen.

### 2.8 Token Storage Recommendation

- **iOS**: Store in iOS Keychain (`expo-secure-store` or `@react-native-async-storage`)
- **Android**: Store in Android Keystore via `expo-secure-store`
- Never store tokens in `AsyncStorage` (unencrypted) or `localStorage`

---

## Section 3 — Plan & Feature Gating

### 3.1 Plans

The API uses lowercase plan slugs (derived from plan name via `.toLowerCase().trim()`).

| Display Name | Slug used in API | Tier Order |
|-------------|-----------------|------------|
| Free | `"free"` | 1 |
| Basic | `"basic"` | 2 |
| Starter | `"starter"` | 3 |
| Growth | `"growth"` | 4 |
| Pro | `"pro"` | 5 |
| Enterprise | `"enterprise"` | 5 (same tier as Pro) |
| Lifetime | `"lifetime"` | 6 |
| (Legacy) Free Trial | `"free trial"` | 1 |

> **Note:** Old subscriptions may have slug `"free trial"`. Treat it the same as `"free"` in UI.

### 3.2 ownerPlanStatus

The `Profile` model has `ownerPlanStatus: "PENDING_SELECTION" | "ACTIVE" | null`.

| Value | Meaning | Mobile app behavior |
|-------|---------|---------------------|
| `null` or `"PENDING_SELECTION"` | Owner has never confirmed a plan | Force navigation to plan selection screen on login |
| `"ACTIVE"` | Owner has confirmed a plan | Allow normal access |

This is stored in the JWT and in the Profile DB. The mobile app should check this after login. The hard API enforcement is done via `code: "PLAN_NOT_SELECTED"` on every owner endpoint.

### 3.3 PlanLimits Interface

```typescript
interface PlanLimits {
  maxGyms:              number | null;   // null = unlimited
  maxMembers:           number | null;   // total active members across all gyms
  maxTrainers:          number | null;
  maxMembershipPlans:   number | null;
  maxNotificationsPerMonth: number | null;

  // Feature flags
  hasAnalytics:         boolean;
  hasDashboardAnalytics: boolean;
  hasFullAnalytics:     boolean;
  hasWorkoutPlans:      boolean;
  hasDietPlans:         boolean;
  hasAttendance:        boolean;
  hasSupplements:       boolean;
  hasPayments:          boolean;
  hasMemberCrud:        boolean;
  hasPlanTemplates:     boolean;
  hasReferAndEarn:      boolean;
  hasFullReports:       boolean;
}
```

### 3.4 Plan Limits by Slug

```typescript
const PLAN_LIMITS = {
  "free": {
    maxGyms: 1, maxMembers: null, maxTrainers: null, maxMembershipPlans: null, maxNotificationsPerMonth: null,
    hasAnalytics: true, hasDashboardAnalytics: true, hasFullAnalytics: false,
    hasWorkoutPlans: false, hasDietPlans: false, hasAttendance: true,
    hasSupplements: false, hasPayments: false, hasMemberCrud: true,
    hasPlanTemplates: false, hasReferAndEarn: false, hasFullReports: false,
  },
  "basic": {
    maxGyms: 1, maxMembers: null, maxTrainers: null, maxMembershipPlans: null, maxNotificationsPerMonth: null,
    hasAnalytics: true, hasDashboardAnalytics: true, hasFullAnalytics: false,
    hasWorkoutPlans: false, hasDietPlans: false, hasAttendance: true,
    hasSupplements: false, hasPayments: false, hasMemberCrud: true,
    hasPlanTemplates: false, hasReferAndEarn: true, hasFullReports: true,
  },
  "starter": {
    maxGyms: 2, maxMembers: 200, maxTrainers: 2, maxMembershipPlans: 20, maxNotificationsPerMonth: 50,
    hasAnalytics: true, hasDashboardAnalytics: true, hasFullAnalytics: false,
    hasWorkoutPlans: true, hasDietPlans: true, hasAttendance: true,
    hasSupplements: false, hasPayments: false, hasMemberCrud: false,
    hasPlanTemplates: false, hasReferAndEarn: false, hasFullReports: false,
  },
  "growth": {
    maxGyms: 10, maxMembers: 500, maxTrainers: 10, maxMembershipPlans: 50, maxNotificationsPerMonth: 100,
    hasAnalytics: true, hasDashboardAnalytics: true, hasFullAnalytics: true,
    hasWorkoutPlans: true, hasDietPlans: true, hasAttendance: true,
    hasSupplements: true, hasPayments: true, hasMemberCrud: true,
    hasPlanTemplates: false, hasReferAndEarn: false, hasFullReports: false,
  },
  "pro": {
    maxGyms: 1, maxMembers: null, maxTrainers: null, maxMembershipPlans: null, maxNotificationsPerMonth: null,
    hasAnalytics: true, hasDashboardAnalytics: true, hasFullAnalytics: true,
    hasWorkoutPlans: true, hasDietPlans: true, hasAttendance: true,
    hasSupplements: true, hasPayments: true, hasMemberCrud: true,
    hasPlanTemplates: true, hasReferAndEarn: true, hasFullReports: true,
  },
  "enterprise": {
    maxGyms: 5, maxMembers: null, maxTrainers: null, maxMembershipPlans: null, maxNotificationsPerMonth: null,
    // all flags: true (same as pro except maxGyms=5)
    hasAnalytics: true, hasDashboardAnalytics: true, hasFullAnalytics: true,
    hasWorkoutPlans: true, hasDietPlans: true, hasAttendance: true,
    hasSupplements: true, hasPayments: true, hasMemberCrud: true,
    hasPlanTemplates: true, hasReferAndEarn: true, hasFullReports: true,
  },
  "lifetime": {
    // all null limits, all flags true
    maxGyms: null, maxMembers: null, maxTrainers: null, maxMembershipPlans: null, maxNotificationsPerMonth: null,
    hasAnalytics: true, hasDashboardAnalytics: true, hasFullAnalytics: true,
    hasWorkoutPlans: true, hasDietPlans: true, hasAttendance: true,
    hasSupplements: true, hasPayments: true, hasMemberCrud: true,
    hasPlanTemplates: true, hasReferAndEarn: true, hasFullReports: true,
  },
}
```

### 3.5 Subscription Status Endpoint

**Endpoint:** `GET /api/owner/subscription`
**Auth required:** Yes (Bearer token)
**Plan wall:** EXEMPT — this endpoint works even with no plan

**Response:**
```typescript
{
  subscription: {
    id:               string;
    status:           "ACTIVE" | "TRIALING" | "CANCELLED" | "EXPIRED" | "LIFETIME";
    planName:         string;       // e.g. "Pro"
    planSlug:         string;       // e.g. "pro"
    limits:           PlanLimits;
    currentPeriodEnd: string | null; // ISO date string
    isExpired:        boolean;       // true only after 7-day grace period
    isInGracePeriod:  boolean;       // period ended but within 7-day grace
    isLifetime:       boolean;
    isTrial:          boolean;
    daysRemaining:    number | null; // clamped to 0
    daysUntilExpiry:  number | null; // negative = days since expiry
  } | null;
  usage: {
    gyms:             number;
    members:          number;
    trainers:         number;
    membershipPlans:  number;
    notificationsThisMonth: number;
  };
}
```

### 3.6 Feature Gate Error Response

When a feature is not available on the owner's plan:
```json
HTTP 403
{
  "error": "Workout plan creation is not available on your current plan. Please upgrade to access this feature.",
  "upgradeRequired": true
}
```

The `upgradeRequired: true` flag is the signal to show an upgrade prompt.

### 3.7 Feature Flag Table (for client-side UI gating)

| Feature | free | basic | starter | growth | pro | enterprise | lifetime |
|---------|------|-------|---------|--------|-----|------------|---------|
| hasMemberCrud | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ |
| hasAttendance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| hasAnalytics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| hasDashboardAnalytics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| hasWorkoutPlans | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| hasDietPlans | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| hasPayments | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| hasSupplements | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| hasFullAnalytics | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| hasFullReports | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| hasReferAndEarn | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| hasPlanTemplates | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |

---

## Section 4 — Changed Endpoints

### 4.1 `POST /api/profile/set-role`
**Was:** `POST /api/auth/set-role`
**Change:** URL moved. No longer auto-assigns any plan on `role="owner"`. Returns `{ success: true, role }`. The mobile app must next route the owner to plan selection.

```
BEFORE: POST /api/auth/set-role   → auto-assigned Free Trial plan for owners
AFTER:  POST /api/profile/set-role → sets role only; owner must select plan separately
```

### 4.2 `POST /api/owner/members` (single member add)
**Breaking changes:**
- `membershipPlanId` is now **REQUIRED** (was optional). Returns 400 if missing.
- `paymentReceived` is now **REQUIRED as explicit boolean** (was optional, defaulted to false). Returns 400 with `code: "PAYMENT_RECEIVED_REQUIRED"` if not a boolean.
- `email` field removed from required fields. Now uses `mobileNumber` + `fullName` only (invite-based flow).
- Response body changed: now returns `{ outcome, id, gymMemberId }` (see Section 7).

### 4.3 `POST /api/owner/members/bulk/confirm`
**Breaking changes:**
- No longer accepts global `membershipPlanId` or `paymentReceived` fallback fields.
- Per-row `membershipPlanId: string` now required (400 if missing in any row).
- Per-row `paymentReceived: boolean` now required (400 if not exactly boolean in any row).
- Duplicate mobiles within batch now rejected with `{ error, conflicts }` shape at 409.
- All DB writes wrapped in a single `prisma.$transaction()` — all-or-nothing.
- Response: `{ added, skipped, failed, total }`.

### 4.4 `POST /api/push/register-device`
**Was:** Accepted `{ fcmToken: "ExponentPushToken[...]" }`
**Now:** Accepts `{ expoPushToken: "ExponentPushToken[...]" }` (primary field). Old `fcmToken` field still accepted for backwards compat.
- Token must start with `"ExponentPushToken["` — FCM tokens no longer accepted.
- Added `DELETE /api/push/register-device` to unregister on logout.

### 4.5 All `GET/POST/PATCH/DELETE /api/owner/*` routes
**Breaking change:** All owner API routes now call `requireActivePlan(profileId)` at the top (except `/api/owner/subscription`). If owner has no active plan subscription, every route returns:
```json
HTTP 403 { "error": "Please select a plan to continue.", "code": "PLAN_NOT_SELECTED" }
```
Previously these routes only checked subscription feature flags (not whether a plan was selected at all).

### 4.6 `POST /api/auth/register`
**Breaking change:** Now requires prior OTP email verification. Calling register without a verified OTP record in DB returns:
```json
HTTP 403 { "error": "Email not verified. Please verify your email with the OTP first." }
```
See onboarding flow in Section 9.

### 4.7 `GET /api/owner/payments`
**Added field:** Response now includes `allTimeRevenue: number` in addition to existing `monthTotal`.

### 4.8 `GET /api/owner/reports`
**Added fields:** Response now includes `lockerRevenue` in summary, `lockerRevenueSeries` array, and `isPremium: boolean` flag. The `topGyms` array now includes `lockerRev` field per gym.

---

## Section 5 — New Endpoints

### 5.1 `POST /api/auth/send-otp`
**Step 1 of email verification.** Call before account creation.
**Auth required:** No
**Rate limit:** 10 per hour per IP, 3 per 10 min per email

**Request:**
```typescript
{ email: string; fullName: string }
```

**Response (200):**
```typescript
{ success: true; message: string; expiresIn: 600 }  // expiresIn in seconds
```

**Errors:**
| HTTP | Body |
|------|------|
| 400 | `{ "error": "Valid email is required" }` |
| 400 | `{ "error": "Full name is required" }` |
| 409 | `{ "error": "An account with this email already exists" }` |
| 429 | `{ "error": "Too many requests. Try again in Ns." }` |
| 500 | `{ "error": "Failed to send verification email. Please try again." }` |

### 5.2 `POST /api/auth/verify-otp`
**Step 2 of email verification.**
**Auth required:** No
**Rate limit:** 5 attempts per 10 min per email

**Request:**
```typescript
{ email: string; otp: string }  // otp is 6-digit numeric string
```

**Response (200):**
```typescript
{ success: true; verified: true }
```

**Errors:**
| HTTP | Body |
|------|------|
| 400 | `{ "error": "No pending verification found...", remaining: N }` |
| 400 | `{ "error": "Verification code has expired..." }` |
| 400 | `{ "error": "Incorrect code. N attempts remaining.", remaining: N }` |
| 400 | `{ "error": "Too many incorrect attempts..." }` |
| 429 | Rate limited |

> OTP expires in **10 minutes**. Max **5 incorrect attempts** before record is deleted.

### 5.3 `POST /api/auth/complete-profile`
**Activates an INVITED profile** (member/trainer added by owner via mobile number only).
**Auth required:** No

Two paths:

**Path A — Invite token (from SMS link):**
```typescript
{
  token:    string;   // from SMS invite link query param
  email:    string;
  password: string;   // min 8 chars
  city?:    string;
  gender?:  string;
}
```

**Path B — OTP (mobile users who never got a link):**
```typescript
{
  mobile:   string;   // the mobile number the owner used to add them
  email:    string;
  otp:      string;   // 6-digit OTP sent to their email
  password: string;
  city?:    string;
  gender?:  string;
}
```

**Response (200):**
```typescript
{ success: true; role: "member" | "trainer" | null }
```

### 5.4 `POST /api/auth/mobile-logout`
See Section 2.5.

### 5.5 `POST /api/auth/mobile-refresh`
See Section 2.4.

### 5.6 `GET /api/auth/check-mobile-status`
**Public endpoint — checks if a mobile number is registered.**
**Auth required:** No

**Query:** `?mobile=9876543210` (10-digit normalised)

**Response (200):**
```typescript
{ status: "NOT_FOUND" | "ACTIVE" | "INVITED" }
```

- `NOT_FOUND` → mobile not on GymStack (safe to add as new member)
- `INVITED` → invited by a gym but not yet activated
- `ACTIVE` → active GymStack user (will be linked, not re-created)

Use this for debounced validation on forms that collect mobile numbers.

### 5.7 `GET /api/subscriptions/plans`
**Public endpoint — all active SaaS plans.**
**Auth required:** No

**Response:**
```typescript
Array<{
  id:           string;
  name:         string;    // "Free", "Basic", "Pro", "Enterprise", etc.
  description:  string;
  interval:     "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY" | "LIFETIME";
  price:        number;    // INR, 0 for free
  currency:     string;    // "INR"
  sortOrder:    number;
  maxGyms:      number | null;
  maxMembers:   number | null;
  maxTrainers:  number | null;
  maxMembershipPlans: number | null;
  maxNotificationsPerMonth: number | null;
  attendanceTracking: boolean;
  workoutPlans:       boolean;
  dietPlans:          boolean;
  reportsAnalytics:   boolean;
  onlinePayments:     boolean;
  balanceSheet:       boolean;
  supplementManagement: boolean;
  customBranding:     boolean;
  apiAccess:          boolean;
}>
```

### 5.8 `POST /api/subscriptions/create-order`
**Creates a Razorpay order for plan purchase.**
**Auth required:** Yes

**Request:**
```typescript
{ saasPlanId: string }
```

**Response (200):**
```typescript
{ orderId: string; amount: number; currency: string }
```
> `amount` is in **paise** (1 INR = 100 paise). Pass to Razorpay SDK.

### 5.9 `POST /api/subscriptions/subscribe`
**Activates a plan after payment.**
**Auth required:** Yes

**Request (free plan):**
```typescript
{ saasPlanId: string; amount: 0 }
```

**Request (paid plan):**
```typescript
{
  saasPlanId:         string;
  amount:             number;
  razorpayPaymentId:  string;
  razorpayOrderId:    string;
  razorpaySignature?: string;
}
```

**Response (200):**
```typescript
{ subscription: SaasSubscription; payment: SaasPayment }
```

**After this call:** `ownerPlanStatus` becomes `"ACTIVE"` on the Profile. The mobile app should update local auth state accordingly and allow access to owner features.

### 5.10 `GET /api/owner/subscription`
See Section 3.5.

### 5.11 `POST /api/owner/members/bulk`
**Preview-only endpoint (no DB writes).**
**Auth required:** Yes (owner, active plan, Basic+ tier)

**Request:**
```typescript
{
  gymId: string;
  rows:  Array<{ name: string; mobile: string }>;  // max 500 rows
}
```

**Response (200):**
```typescript
{
  preview: {
    newUsers:    Array<{ name: string; mobile: string; normMobile: string }>;
    invited:     Array<{ name: string; mobile: string; normMobile: string }>;
    onGymStack:  Array<{ name: string; mobile: string; normMobile: string }>;
    alreadyHere: Array<{ name: string; mobile: string; normMobile: string }>;
    invalid:     Array<{ name: string; mobile: string; reason: string }>;
  }
}
```

Categories:
- `newUsers` → new to GymStack; will receive SMS invite
- `invited` → previously invited; will receive new SMS
- `onGymStack` → active GymStack user; will be silently linked
- `alreadyHere` → already in this gym; skipped
- `invalid` → bad mobile or empty name; skipped

### 5.12 `POST /api/owner/members/bulk/confirm`
**Commits a bulk add after preview.**
**Auth required:** Yes (owner, active plan, Basic+ tier)

**Request:**
```typescript
{
  gymId: string;
  rows:  Array<{
    name:             string;
    mobile:           string;
    membershipPlanId: string;    // REQUIRED per row
    paymentReceived:  boolean;   // REQUIRED per row — must be exact boolean
    startDate?:       string;    // ISO date string (YYYY-MM-DD or ISO8601)
    endDate?:         string;    // ISO date string
  }>;
}
```

**Success response (200):**
```typescript
{
  added:   number;
  skipped: number;
  failed:  Array<{ name: string; mobile: string; reason: string }>;
  total:   number;
}
```

**Error — validation failure (400):**
```typescript
{
  error:     "Validation failed";
  conflicts: Array<{ row: number; mobile: string; reason: string }>;
}
```

**Error — duplicate mobiles within batch (409):**
```typescript
{
  error:     "Duplicate mobile numbers in batch";
  conflicts: Array<{ row: number; mobile: string; reason: string }>;
}
```

**Transaction behavior:** All `GymMember.create` calls are wrapped in a single DB transaction. If any single create fails, **all are rolled back** and the endpoint returns 500. Profile creation (with SMS sends) happens before the transaction and cannot be rolled back if the transaction fails.

### 5.13 `POST /api/owner/members/upload-excel`
**Parse Excel/CSV and return preview (no DB writes).**
**Auth required:** Yes (owner, active plan, Pro+ tier)
**Request:** `multipart/form-data` with fields `file` (xlsx/xls/csv) and `gymId`

**Response (200):**
```typescript
{
  preview:      BulkPreview;   // same shape as bulk route
  totalParsed:  number;        // total rows in file (including header)
}
```

### 5.14 `POST /api/owner/members/[memberId]/renew`
**Renew a member's subscription.**
**Auth required:** Yes (owner, active plan)

**Request:**
```typescript
{
  membershipPlanId?: string;  // if omitted, uses member's current plan
  paymentAmount?:   number;   // records payment if provided
  paymentMethod?:   "CASH" | "CARD" | "UPI" | "ONLINE";  // default: "CASH"
  notes?:           string;
}
```

**Response (200):**
```typescript
{
  success:    true;
  newEndDate: string;  // ISO date string
  member:     GymMember;
}
```

Logic: new end date = `addMonths(max(today, currentEndDate), plan.durationMonths)`. I.e., extends from current end date if still in future, otherwise extends from today.

### 5.15 `GET/POST /api/owner/lockers`
**List and create gym lockers.**
**Auth required:** Yes (owner, active plan)

**GET** query: `?gymId=<id>&status=AVAILABLE|ASSIGNED|MAINTENANCE|RESERVED`

**GET response:**
```typescript
{
  lockers: Locker[];
  stats:   { total: number; available: number; assigned: number; maintenance: number; reserved: number };
}
```

**POST (single):** `{ gymId, lockerNumber, floor?, size?, monthlyFee?, notes? }`
**POST (bulk):** `{ gymId, bulk: true, prefix?, from, to, floor?, size?, monthlyFee?, notes? }` (max 200)

### 5.16 `POST /api/push/register-device` / `DELETE /api/push/register-device`
See Section 4.4.

### 5.17 `GET /api/owner/checkins`
**Auth required:** Yes (owner, active plan)
Returns today's check-in list for quick dashboard display.

### 5.18 `GET /api/owner/supplements` and `POST /api/owner/supplements/sell`
**Auth required:** Yes (owner, active plan, Pro+ feature `hasSupplements`)
Supplement management and sales recording. ⚠️ NOT FULLY DOCUMENTED — requires manual inspection of those route files if needed.

---

## Section 6 — Removed Endpoints

### 6.1 `POST /api/auth/set-role`
**Removed.** Moved to `POST /api/profile/set-role`. NextAuth v5 intercepts all POST requests to `/api/auth/*` before custom handlers can run, so the route was relocated.

### 6.2 Global `membershipPlanId` and `paymentReceived` fields in bulk confirm
**Removed from `POST /api/owner/members/bulk/confirm` body.** The body used to accept:
```typescript
// OLD — no longer accepted
{
  membershipPlanId?: string;   // global fallback
  paymentReceived?:  boolean;  // global fallback
}
```
These global fallbacks are gone. Every row must now include its own `membershipPlanId` and `paymentReceived`.

---

## Section 7 — Member Creation Changes

### 7.1 Single Member Add — `POST /api/owner/members`

**Required fields:**
| Field | Type | Notes |
|-------|------|-------|
| `gymId` | `string` (CUID) | The gym to add member to |
| `fullName` | `string` | min 2 chars |
| `mobileNumber` | `string` | 10-digit Indian mobile number |
| `membershipPlanId` | `string` (CUID) | **Now required** (was optional before) |
| `paymentReceived` | `boolean` | **Now required, must be exact boolean** |

**Optional fields:**
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `startDate` | `string` (ISO date) | `new Date()` | Membership start date |
| `endDate` | `string` (ISO date) | auto-calculated | Overrides auto-calc if provided |

**paymentReceived behavior:**
- `true` → backend creates a `Payment` record with `status: "COMPLETED"`, `paymentMethod: "CASH"`, `amount: plan.price`
- `false` → member is added but no payment record is created
- `undefined` / anything other than boolean → rejected with 400

**startDate default:** `new Date()` (today, server time) if not provided.

**endDate auto-calculation:**
```
endDate = startDate + plan.durationMonths
```
Algorithm (same as JS `addMonths`):
```javascript
function addMonths(dateStr, months) {
  const d = new Date(dateStr)
  const day = d.getDate()         // save original day
  d.setMonth(d.getMonth() + months)
  if (d.getDate() !== day) d.setDate(0)  // if month rolled over, go to last day
  return d.toISOString().split("T")[0]
}
```
If `endDate` is explicitly provided in the request, it overrides auto-calculation.

**totalAmount:** `plan.price` (from the MembershipPlan record). The mobile app should fetch the plan's price and display it as read-only before submission.

**Full request body:**
```typescript
{
  gymId:            string;   // required
  fullName:         string;   // required
  mobileNumber:     string;   // required, 10-digit
  membershipPlanId: string;   // required
  paymentReceived:  boolean;  // required
  startDate?:       string;   // ISO date, default today
  endDate?:         string;   // ISO date, auto-calculated if omitted
}
```

**Success response (201):**
```typescript
{
  outcome:     "created" | "reinvited" | "linked";
  id:          string;   // GymMember ID
  gymMemberId: string;   // same as id
}
```

Outcome meanings:
- `created` → new to GymStack, INVITED profile created, SMS sent
- `reinvited` → was INVITED by another gym, fresh SMS sent
- `linked` → existing active GymStack user, silently linked

**Validation errors:**
| Field | Code | HTTP | Message |
|-------|------|------|---------|
| gymId | — | 400 | "Gym is required" |
| fullName | — | 400 | "Full name is required" |
| mobileNumber | — | 400 | "Mobile number is required" |
| mobileNumber (invalid) | — | 400 | "Invalid mobile number — must be 10 digits" |
| membershipPlanId | — | 400 | "Membership plan is required" |
| paymentReceived | `PAYMENT_RECEIVED_REQUIRED` | 400 | "paymentReceived must be explicitly true or false." |
| — (gym not found) | — | 404 | "Gym not found" |
| — (already member) | — | 409 | "This member is already enrolled in this gym" |

### 7.2 Bulk Manual Add

**Step 1 — Preview:** `POST /api/owner/members/bulk`
Body: `{ gymId, rows: [{ name, mobile }] }` — name + mobile only, no plan or payment here.
Returns categorized preview (see Section 5.11).

**Step 2 — Confirm:** `POST /api/owner/members/bulk/confirm`
After preview, send the actionable rows (newUsers + invited + onGymStack) with per-row plan and payment:

```typescript
{
  gymId: string;
  rows: Array<{
    name:             string;  // required
    mobile:           string;  // required, 10-digit
    membershipPlanId: string;  // required per row
    paymentReceived:  boolean; // required per row, exact boolean
    startDate?:       string;  // ISO date
    endDate?:         string;  // ISO date; auto-calculated from plan if omitted
  }>;
}
```

**Validation (per row, returns 400 with conflicts array):**
- Missing `membershipPlanId` → `reason: "membershipPlanId is required"`
- `paymentReceived` not exact boolean → `reason: "paymentReceived must be true or false"`

**Duplicate mobile check (returns 409 with conflicts array):**
- Same mobile appears twice in the submitted `rows` array

**Conflict response shape:**
```typescript
{
  error:     string;
  conflicts: Array<{
    row:    number;   // 0-based index
    mobile: string;
    reason: string;
  }>;
}
```

**Transaction behavior:** All-or-nothing. If any `GymMember.create` fails, ALL are rolled back.

**Success response (200):**
```typescript
{
  added:   number;
  skipped: number;  // rows already in gym
  failed:  Array<{ name: string; mobile: string; reason: string }>;
  total:   number;  // total rows submitted
}
```

### 7.3 Excel / File Upload

**Endpoint:** `POST /api/owner/members/upload-excel`
**Content-Type:** `multipart/form-data`
**Required plan:** Pro+
**Max rows:** 2,000

**Form fields:**
| Field | Type | Required |
|-------|------|----------|
| `file` | File (xlsx/xls/csv) | Yes |
| `gymId` | string | Yes |

**Expected column names (case-insensitive, flexible detection):**
| Column | Detection keywords | Required |
|--------|-------------------|----------|
| Name | contains "name" | **Yes** |
| Mobile | contains "mobile", "phone", "number", "contact" | **Yes** |
| Membership Plan | contains "plan" or "membership" | No |
| Start Date | contains "start" | No |
| End Date | contains "end" | No |
| Payment Received | contains "payment", "paid", "received" | No |

**Payment Received column accepted values:** `Yes`, `Y`, `True`, `1` → `true`. Anything else → `false`. Blank → `false`.

> ⚠️ Unlike the manual/bulk add flows, the Excel upload does NOT require Payment Received to be explicit. Blank/missing payment column → treated as `false` (no payment recorded).

**Date formats accepted:** `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, or JS-parseable.

**Plan name matching:** The plan name in the spreadsheet is matched case-insensitively against the gym's active `MembershipPlan.name` values. If no match → `membershipPlanId` will be `undefined` for that row.

**Success response (200):**
```typescript
{
  preview:     BulkPreview;  // same shape as manual bulk preview
  totalParsed: number;
}
```

After the preview is returned, use `POST /api/owner/members/bulk/confirm` with the rows from `preview.newUsers + preview.invited + preview.onGymStack` to commit.

---

## Section 8 — Mobile Number Uniqueness

### 8.1 Current State

⚠️ There is **no hard database unique constraint** on `mobileNumber` at the DB level (no `@unique` attribute in the Prisma schema as observed). Uniqueness is **logically enforced** by `resolveInvitedProfile()`:

1. When adding a member or trainer, the backend calls `findFirst({ where: { mobileNumber: { endsWith: mobile } } })`
2. If a profile is found → the existing profile is reused (not a new one created)
3. This prevents duplicate phone-number profiles across roles

### 8.2 Endpoints that enforce mobile uniqueness

| Endpoint | Enforcement |
|----------|-------------|
| `POST /api/owner/members` | Via `resolveInvitedProfile` — finds or creates profile by mobile |
| `POST /api/owner/trainers` | Via `resolveInvitedProfile` — same |
| `POST /api/owner/members/bulk/confirm` | Via `resolveInvitedProfile` per row |
| `GET /api/auth/check-mobile-status` | Read-only check — returns status |

### 8.3 Cross-role uniqueness

Yes — a single mobile number maps to exactly one Profile. A person invited as a member and later as a trainer at a different gym will have the same Profile record, just attached to multiple gym records. They cannot be two separate profiles.

### 8.4 Duplicate mobile in batch

When submitting bulk confirm with duplicate mobiles in the same batch:
```json
HTTP 409
{
  "error": "Duplicate mobile numbers in batch",
  "conflicts": [
    { "row": 3, "mobile": "9876543210", "reason": "Duplicate mobile number in this batch" }
  ]
}
```

### 8.5 Mobile app requirements on forms

Any form that collects a mobile number should:
1. After the user types a 10-digit number (debounced 500ms), call `GET /api/auth/check-mobile-status?mobile=<10digits>`
2. Show an informational badge:
   - `NOT_FOUND` → "New to GymStack — will receive SMS invite" (green)
   - `INVITED` → "Already invited — will re-invite" (blue)
   - `ACTIVE` → "Existing GymStack user — will link" (orange)
3. Do NOT block form submission based on this check — all three statuses are valid for adding members/trainers

---

## Section 9 — Onboarding Flow Changes

### 9.1 New Owner Onboarding (complete sequence)

```
Step 1: OTP Send
  POST /api/auth/send-otp
  Body: { email, fullName }
  → Wait for email OTP (10 min expiry)

Step 2: OTP Verify
  POST /api/auth/verify-otp
  Body: { email, otp }
  → Marks OTP as verified in DB

Step 3: Register
  POST /api/auth/register
  Body: { fullName, email, password, mobileNumber, city, gender?, referralCode? }
  → Creates profile (role: null), wallet, referral code
  → Returns { success: true, profileId }

Step 4: Login
  POST /api/auth/mobile-login
  Body: { email, password }
  → Returns accessToken + refreshToken + profile (role: null)

Step 5: Set Role
  POST /api/profile/set-role          ← NOTE: /profile/ not /auth/
  Body: { role: "owner" }
  Authorization: Bearer <accessToken>
  → Returns { success: true, role: "owner" }
  → NO plan assigned at this step

Step 6: Plan Selection (NEW — required)
  GET /api/subscriptions/plans           → fetch all plans to show UI
  POST /api/subscriptions/create-order   → for paid plans (gets Razorpay orderId)
  POST /api/subscriptions/subscribe      → activate plan
  Body (free plan): { saasPlanId, amount: 0 }
  Body (paid plan): { saasPlanId, amount, razorpayPaymentId, razorpayOrderId }
  → Sets ownerPlanStatus = "ACTIVE" on Profile
  → Creates SaasSubscription

Step 7: Create First Gym
  POST /api/owner/gyms
  → Now allowed (plan active)
```

### 9.2 What happens if owner skips plan selection

If owner logs in and tries to access any `GET/POST /api/owner/*` endpoint (except `/api/owner/subscription`):
```json
HTTP 403
{
  "error": "Please select a plan to continue.",
  "code": "PLAN_NOT_SELECTED"
}
```

**Mobile app MUST:** intercept this response globally and redirect to the plan selection screen. This is enforced server-side and cannot be bypassed.

### 9.3 Plan Selection Screen Requirements

- Show all plans from `GET /api/subscriptions/plans` — no default selected
- Free plan: POST `/api/subscriptions/subscribe` with `amount: 0` immediately
- Paid plan: POST `/api/subscriptions/create-order` → open Razorpay → POST `/api/subscriptions/subscribe` with Razorpay response
- Plan selection is permanent for the duration — cannot be "skipped" or "done later"

---

## Section 10 — Revenue Logic

### 10.1 When a payment record is created

A `Payment` row is created when:
- `paymentReceived === true` in single member add
- `paymentReceived === true` in bulk member add (per row)
- `POST /api/owner/payments` is called explicitly (manual payment recording)
- `POST /api/owner/members/[memberId]/renew` with `paymentAmount` provided

### 10.2 When no payment record is created

- `paymentReceived === false` in single or bulk member add → member is added but NO payment recorded
- Excel upload with blank/No in Payment Received column → no payment recorded

### 10.3 Recording payment later for members added without payment

Use `POST /api/owner/payments`:

**Request:**
```typescript
{
  gymId:            string;   // required
  memberId:         string;   // required (GymMember ID)
  amount:           number;   // required, positive
  membershipPlanId?: string;  // optional — if provided, extends membership endDate
  paymentMethod?:   "CASH" | "CARD" | "UPI" | "ONLINE";  // default: "CASH"
  paymentDate?:     string;   // ISO datetime, default: now
  notes?:           string;
}
```

**Response (201):** Full payment object with member + gym included.

**Side effects when `membershipPlanId` is provided:** membership `endDate` is automatically extended by `plan.durationMonths` months from the current endDate (or today if expired), and `status` is set to `"ACTIVE"`.

---

## Section 11 — Error Code Master Table

| Code | HTTP Status | Meaning | Affected Endpoints | Mobile should show |
|------|-------------|---------|-------------------|-------------------|
| `PLAN_NOT_SELECTED` | 403 | Owner hasn't selected a plan | All `/api/owner/*` (except subscription) | Redirect to plan selection screen |
| `PLAN_EXPIRED` | 403 | Owner's plan expired (past 7-day grace) | All `/api/owner/*` | Redirect to plan renewal/selection screen |
| `PAYMENT_RECEIVED_REQUIRED` | 400 | `paymentReceived` field not an explicit boolean | `POST /api/owner/members`, bulk confirm | Inline error on payment field |
| `UNAUTHORIZED` | 401 | No valid session or token | All auth-required endpoints | Redirect to login |
| `FORBIDDEN` | 403 | Role not allowed | Role-gated endpoints | Show access denied screen |
| `PLAN_LIMIT_REACHED` | 403 | Numeric limit reached (members/gyms/trainers) | Create endpoints | Show upgrade prompt with current/max count |
| `PLAN_FEATURE_BLOCKED` | 403 | Feature not available on current plan | Feature endpoints | Show upgrade prompt |
| `SUBSCRIPTION_EXPIRED` | 403 | Subscription has expired | Owner endpoints | Redirect to renewal |
| `NOT_FOUND` | 404 | Entity does not exist | GET/PATCH/DELETE endpoints | Show not-found state |
| `CONFLICT` | 409 | Duplicate entity | POST endpoints | Show conflict message |
| `VALIDATION_ERROR` | 422 | Zod schema validation failed | Endpoints using Zod schemas | Show field-level errors from `details` |
| `BAD_REQUEST` | 400 | Bad input (not schema failure) | All write endpoints | Show error message |
| `INTERNAL_ERROR` | 500 | Unexpected server error | All endpoints | Show generic error + retry option |
| `RATE_LIMITED` | 429 | Too many requests | Login (5/15min), register, OTP send | Show countdown timer from `Retry-After` header |
| — (no code field) | 409 | "This member is already enrolled" | `POST /api/owner/members` | Inline error — "already in this gym" |
| — (upgradeRequired) | 403 | Plan upgrade needed | Create endpoints | Show upgrade prompt modal |
| — (conflicts array) | 400/409 | Batch has duplicate or invalid rows | Bulk confirm, bulk upload | Highlight conflicting rows with reason |

> Routes that use the `upgradeRequired: true` field (not a `code` field) still need to be handled — check for `response.upgradeRequired === true` as a separate condition.

---

## Section 12 — Types & Interfaces

```typescript
// ── Profile / User ────────────────────────────────────────────────────────────

interface Profile {
  id:           string;
  fullName:     string;
  email:        string | null;
  avatarUrl:    string | null;
  mobileNumber: string | null;
  city:         string | null;
  gender:       string | null;
  dateOfBirth:  string | null;  // ISO date string
  role:         "owner" | "trainer" | "member" | null;
  wallet:       { balance: number } | null;
  referralCode: string | null;
  gym:          { id: string; name: string; isActive: boolean } | null;
}

// ── Plan & Features ───────────────────────────────────────────────────────────

type PlanSlug = "free" | "basic" | "starter" | "growth" | "pro" | "enterprise" | "lifetime" | "free trial";
type PlanStatus = "ACTIVE" | "TRIALING" | "CANCELLED" | "EXPIRED" | "LIFETIME";

interface PlanLimits {
  maxGyms:              number | null;
  maxMembers:           number | null;
  maxTrainers:          number | null;
  maxMembershipPlans:   number | null;
  maxNotificationsPerMonth: number | null;
  hasAnalytics:         boolean;
  hasDashboardAnalytics: boolean;
  hasFullAnalytics:     boolean;
  hasWorkoutPlans:      boolean;
  hasDietPlans:         boolean;
  hasAttendance:        boolean;
  hasSupplements:       boolean;
  hasPayments:          boolean;
  hasMemberCrud:        boolean;
  hasPlanTemplates:     boolean;
  hasReferAndEarn:      boolean;
  hasFullReports:       boolean;
}

interface ActiveSubscription {
  id:               string;
  status:           PlanStatus;
  planName:         string;
  planSlug:         PlanSlug;
  limits:           PlanLimits;
  currentPeriodEnd: string | null;  // ISO date string
  isExpired:        boolean;
  isInGracePeriod:  boolean;
  isLifetime:       boolean;
  isTrial:          boolean;
  daysRemaining:    number | null;
  daysUntilExpiry:  number | null;
}

// ── Member ────────────────────────────────────────────────────────────────────

type MemberOutcome = "created" | "reinvited" | "linked" | "already_member";
type MemberStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "EXPIRED";

interface GymMember {
  id:                     string;
  gymId:                  string;
  profileId:              string;
  membershipPlanId:       string | null;
  startDate:              string;    // ISO date
  endDate:                string | null;
  status:                 MemberStatus;
  isActive:               boolean;
  gymNameSnapshot:        string | null;
  heightCm:               number | null;
  weightKg:               number | null;
  medicalNotes:           string | null;
  emergencyContactName:   string | null;
  emergencyContactPhone:  string | null;
  workoutStartTime:       string | null;
  workoutEndTime:         string | null;
  assignedTrainerId:      string | null;
  createdAt:              string;    // ISO datetime
  updatedAt:              string;
  profile?: {
    fullName:     string;
    email:        string | null;
    mobileNumber: string | null;
    avatarUrl:    string | null;
    status:       string;
  };
  membershipPlan?: {
    name:  string;
    price: number;
  } | null;
  gym?: {
    name: string;
  };
}

// ── Bulk Member Row ───────────────────────────────────────────────────────────

interface BulkMemberRow {
  name:             string;
  mobile:           string;    // 10-digit string
  membershipPlanId: string;    // required
  paymentReceived:  boolean;   // required, exact boolean
  startDate?:       string;    // ISO date
  endDate?:         string;    // ISO date
}

interface BulkPreviewRow {
  name:       string;
  mobile:     string;
  normMobile: string;   // normalised 10-digit
  // Extra fields present after Excel upload or after client attaches meta:
  membershipPlanId?: string;
  startDate?:        string;
  endDate?:          string;
  paymentReceived?:  boolean;
}

interface BulkPreview {
  newUsers:    BulkPreviewRow[];
  invited:     BulkPreviewRow[];
  onGymStack:  BulkPreviewRow[];
  alreadyHere: BulkPreviewRow[];
  invalid:     Array<{ name: string; mobile: string; reason: string }>;
}

// ── Revenue / Payment ─────────────────────────────────────────────────────────

interface Payment {
  id:               string;
  gymId:            string;
  memberId:         string;
  membershipPlanId: string | null;
  amount:           number;
  currency:         string;
  paymentMethod:    "CASH" | "CARD" | "UPI" | "ONLINE";
  status:           "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
  paymentDate:      string;    // ISO datetime
  planNameSnapshot: string | null;
  notes:            string | null;
  createdAt:        string;
}

// ── Conflict ──────────────────────────────────────────────────────────────────

interface MemberConflict {
  row:    number;   // 0-based index in submitted rows array
  mobile: string;
  reason: string;
}

// ── API Response Wrappers ─────────────────────────────────────────────────────
// NOTE: Most routes do NOT wrap in these — they return raw data.
// These wrappers are defined in api-response.ts but not universally applied.

interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Actual error shape used by most routes (NOT the wrapper above):
interface RawApiError {
  error:            string;
  code?:            string;
  upgradeRequired?: true;
  conflicts?:       MemberConflict[];
  detail?:          string;
  remaining?:       number;
}

// ── Paginated (conceptual) ───────────────────────────────────────────────────

interface PaginatedResponse<ItemKey extends string, T> {
  [key: ItemKey]: T[];
  total: number;
  pages: number;
}
// Example usage: PaginatedResponse<"members", GymMember>
```

---

## Section 13 — Mobile Action Checklist

```markdown
## Critical (Breaking — app will not function without these)

- [ ] 1. GLOBAL: Intercept HTTP 403 with `code === "PLAN_NOT_SELECTED"` on ALL owner API calls
         → navigate to plan selection screen unconditionally (no toast, no retry)

- [ ] 2. GLOBAL: Intercept HTTP 403 with `code === "PLAN_EXPIRED"` on ALL owner API calls
         → navigate to plan renewal screen

- [ ] 3. AUTH: Change role-set endpoint from `POST /api/auth/set-role`
         → `POST /api/profile/set-role`

- [ ] 4. AUTH: After role="owner" is set, do NOT route to dashboard
         → route to plan selection screen instead (no plan is auto-assigned anymore)

- [ ] 5. REGISTRATION: Implement 3-step OTP flow before account creation
         Step 1: POST /api/auth/send-otp (email + fullName)
         Step 2: POST /api/auth/verify-otp (email + otp)
         Step 3: POST /api/auth/register (same as before, but now requires prior verified OTP)

- [ ] 6. MEMBER ADD: Make `membershipPlanId` required on single member add form
         → show validation error if not selected
         → do not allow form submission without it

- [ ] 7. MEMBER ADD: Replace `paymentReceived` checkbox (default false) with explicit
         Yes/No selection with NO default value
         → block submission if neither selected
         → handle `code === "PAYMENT_RECEIVED_REQUIRED"` (400) with inline field error

- [ ] 8. MEMBER ADD BULK: Remove global plan selector and global payment checkbox
         → add per-row plan selector (required per row)
         → add per-row payment Yes/No (required per row, no default)
         → remove global `membershipPlanId` and `paymentReceived` from bulk confirm body

- [ ] 9. BULK CONFIRM: Handle new conflict response shapes
         `{ error, conflicts: [{ row, mobile, reason }] }` at HTTP 400 and 409
         → highlight conflicting rows in UI

## High Priority (Features broken without these)

- [ ] 10. PUSH: Change Expo push token registration to use `expoPushToken` field
          instead of deprecated `fcmToken` field
          POST /api/push/register-device: { expoPushToken: "ExponentPushToken[...]" }

- [ ] 11. PUSH: Call DELETE /api/push/register-device on logout to stop notifications

- [ ] 12. PLAN SELECTION SCREEN: Implement full plan selection UI
          → fetch plans from GET /api/subscriptions/plans
          → free plan: POST /api/subscriptions/subscribe directly
          → paid plan: POST /api/subscriptions/create-order → Razorpay → POST /api/subscriptions/subscribe

- [ ] 13. SUBSCRIPTION STATUS: Implement GET /api/owner/subscription response
          → use `isInGracePeriod` to show grace period banner
          → use `daysUntilExpiry` (can be negative) for expiry countdown
          → use `isExpired` (only true after 7-day grace) to hard-block

- [ ] 14. TOKEN REFRESH: Implement access token refresh flow
          → On any HTTP 401 from any authenticated request:
            1. Call POST /api/auth/mobile-refresh
            2. If success → retry original request with new token
            3. If 401 again → clear tokens → send to login

- [ ] 15. MEMBER RENEW: Implement POST /api/owner/members/[memberId]/renew endpoint call
          → Body: { membershipPlanId?, paymentAmount?, paymentMethod?, notes? }
          → Response: { success: true, newEndDate, member }

## Medium Priority (New features / UI gaps)

- [ ] 16. MOBILE STATUS: Add debounced mobile number check on all forms
          GET /api/auth/check-mobile-status?mobile=<10digits>
          → Show status badge: NOT_FOUND/INVITED/ACTIVE

- [ ] 17. PAYMENTS PAGE: Add `allTimeRevenue` field to revenue stats display
          (returned from GET /api/owner/payments)

- [ ] 18. REPORTS: Update reports screen to handle new response fields:
          `lockerRevenue`, `lockerRevenueSeries`, `isPremium`

- [ ] 19. EXPENSES: Implement expenses screens using:
          GET /api/owner/expenses (with range, category, gymId, page params)
          POST /api/owner/expenses

- [ ] 20. LOCKERS: Implement locker management screens using:
          GET /api/owner/lockers?gymId=<id>
          POST /api/owner/lockers (single and bulk)
          POST /api/owner/lockers/[lockerId]/assign

- [ ] 21. EXCEL UPLOAD: For Pro+ owners, implement file upload flow:
          POST /api/owner/members/upload-excel (multipart/form-data)
          → Parse and display BulkPreview
          → Confirm with POST /api/owner/members/bulk/confirm

- [ ] 22. COMPLETE PROFILE: Implement the invited member / trainer activation flow
          POST /api/auth/complete-profile (Path A: token, Path B: mobile+otp)
          → This is how invited users set their email and password

## Low Priority (Polish / UX)

- [ ] 23. UPGRADE PROMPTS: Handle `upgradeRequired: true` on any 403 response
          → Show upgrade prompt modal with plan upgrade CTA

- [ ] 24. FEATURE GATING: Use limits from GET /api/owner/subscription to gate UI
          before making API calls (avoid round-trips for blocked features)

- [ ] 25. RATE LIMITS: Handle HTTP 429 on login, register, OTP endpoints
          → Show countdown timer using `retryAfter` from response body or `Retry-After` header

- [ ] 26. GRACE PERIOD BANNER: When `isInGracePeriod === true`, show
          non-blocking renewal reminder banner

- [ ] 27. OUTCOME DISPLAY: After single member add, use `outcome` field to show
          appropriate message: "SMS invite sent" vs "Linked to existing account"

- [ ] 28. TRAINER ADD: Note that trainer add now uses same mobile-invite flow as
          members (no email required at add time)
          → POST /api/owner/trainers: { gymId, fullName, mobileNumber, bio?, experienceYears?, specializations?, certifications? }
          → email/password handled by trainer via /complete-profile

- [ ] 29. PROFILE/ME: Update to handle new `dateOfBirth` field (ISO string or null)

- [ ] 30. SUPPLEMENTAL: Verify supplement management screens call correct endpoints:
          GET/POST /api/owner/supplements
          POST /api/owner/supplements/sell
          (Pro+ plan required: hasSupplements flag)
```

---

*End of MOBILE_SYNC_REPORT.md*
*Generated: 2026-04-19 | GymStack codebase snapshot on branch `owner-dashboard`*
