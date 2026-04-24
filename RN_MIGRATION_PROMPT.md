# GymStack — React Native Migration Prompt

> Paste this entire document into Claude Code inside your React Native project.

---

## HIGH-LEVEL OVERVIEW

You are building **GymStack** — a Gym Management SaaS mobile app in React Native (Expo). The web app is built with Next.js 16, Prisma 7 + PostgreSQL, and NextAuth v5. The mobile app connects to the **same backend API** that the web app uses. You must not implement a new backend — only build the React Native client.

The app has three user roles:
- **Owner** — manages gyms, members, trainers, plans, payments, expenses, supplements, lockers
- **Trainer** — views assigned members, creates workout/diet plans
- **Member** — views their membership, workout/diet plans, attendance, body metrics

The backend base URL is stored in an environment variable `EXPO_PUBLIC_API_URL`. All API calls are REST (JSON), with a Bearer token in the `Authorization` header (for mobile JWT) or cookie (handled automatically on web).

---

## TECH STACK TO USE

```
React Native: Expo SDK 52+ (managed workflow)
Navigation: React Navigation v7 (Stack + Bottom Tabs + Drawer)
State: Zustand 5 + TanStack Query v5
Forms: React Hook Form 7 + Zod 3
Auth Storage: expo-secure-store (for JWT tokens)
HTTP: axios with interceptors
Images: expo-image, expo-image-picker
Notifications: expo-notifications
Payments: react-native-razorpay
Date: date-fns
UI: Custom components (dark theme, orange primary color — match web exactly)
Icons: lucide-react-native
Animations: react-native-reanimated + moti
```

---

## FOLDER STRUCTURE

Create this exact folder structure:

```
src/
├── api/
│   ├── client.ts            ← axios instance + interceptors
│   ├── auth.ts              ← auth API calls
│   ├── profile.ts           ← profile API calls
│   ├── owner/
│   │   ├── dashboard.ts
│   │   ├── gyms.ts
│   │   ├── members.ts
│   │   ├── trainers.ts
│   │   ├── workouts.ts
│   │   ├── diets.ts
│   │   ├── payments.ts
│   │   ├── attendance.ts
│   │   ├── supplements.ts
│   │   ├── expenses.ts
│   │   ├── lockers.ts
│   │   ├── notifications.ts
│   │   └── reports.ts
│   ├── member/
│   │   ├── dashboard.ts
│   │   ├── gyms.ts
│   │   ├── workouts.ts
│   │   ├── diets.ts
│   │   ├── attendance.ts
│   │   ├── bodyMetrics.ts
│   │   ├── payments.ts
│   │   └── notifications.ts
│   └── trainer/
│       ├── dashboard.ts
│       ├── gyms.ts
│       ├── workouts.ts
│       └── diets.ts
├── auth/
│   ├── storage.ts           ← SecureStore helpers
│   ├── tokenManager.ts      ← access/refresh token logic
│   └── mobileAuth.ts        ← mobile login/logout/refresh
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Toast.tsx
│   │   ├── Pagination.tsx
│   │   ├── StatCard.tsx
│   │   └── SectionHeader.tsx
│   ├── forms/
│   │   ├── FormInput.tsx    ← RHF-controlled Input
│   │   ├── FormSelect.tsx
│   │   ├── FormDatePicker.tsx
│   │   ├── OtpInput.tsx     ← 6-box OTP input
│   │   └── ImagePicker.tsx
│   ├── owner/
│   │   ├── ExpiryAlert.tsx
│   │   ├── SubscriptionBanner.tsx
│   │   ├── UsageMeter.tsx
│   │   └── MemberCard.tsx
│   ├── member/
│   │   ├── NoGymState.tsx
│   │   └── AttendanceCard.tsx
│   └── shared/
│       ├── RoleGate.tsx
│       └── PlanGate.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── ProfileContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useProfile.ts
│   ├── useToast.ts
│   └── useApiError.ts
├── navigation/
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── OwnerNavigator.tsx
│   ├── MemberNavigator.tsx
│   └── TrainerNavigator.tsx
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── SelectRoleScreen.tsx
│   │   ├── CompleteProfileScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   └── ResetPasswordScreen.tsx
│   ├── owner/
│   │   ├── DashboardScreen.tsx
│   │   ├── ChoosePlanScreen.tsx
│   │   ├── GymsScreen.tsx
│   │   ├── GymDetailScreen.tsx
│   │   ├── MembersScreen.tsx
│   │   ├── MemberDetailScreen.tsx
│   │   ├── AddMemberScreen.tsx
│   │   ├── TrainersScreen.tsx
│   │   ├── TrainerDetailScreen.tsx
│   │   ├── AddTrainerScreen.tsx
│   │   ├── WorkoutsScreen.tsx
│   │   ├── WorkoutDetailScreen.tsx
│   │   ├── DietsScreen.tsx
│   │   ├── DietDetailScreen.tsx
│   │   ├── AttendanceScreen.tsx
│   │   ├── PaymentsScreen.tsx
│   │   ├── SupplementsScreen.tsx
│   │   ├── ExpensesScreen.tsx
│   │   ├── LockersScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── member/
│   │   ├── DashboardScreen.tsx
│   │   ├── MyGymsScreen.tsx
│   │   ├── DiscoverScreen.tsx
│   │   ├── WorkoutsScreen.tsx
│   │   ├── DietsScreen.tsx
│   │   ├── AttendanceScreen.tsx
│   │   ├── BodyMetricsScreen.tsx
│   │   ├── PaymentsScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── trainer/
│       ├── DashboardScreen.tsx
│       ├── MyGymsScreen.tsx
│       ├── DiscoverScreen.tsx
│       ├── WorkoutsScreen.tsx
│       └── DietsScreen.tsx
├── stores/
│   ├── authStore.ts
│   └── gymStore.ts
├── types/
│   ├── auth.ts
│   ├── profile.ts
│   ├── gym.ts
│   ├── member.ts
│   ├── trainer.ts
│   ├── workout.ts
│   ├── diet.ts
│   ├── payment.ts
│   ├── notification.ts
│   ├── supplement.ts
│   ├── expense.ts
│   ├── locker.ts
│   └── billing.ts
├── lib/
│   ├── utils.ts
│   ├── queryKeys.ts
│   ├── schemas/
│   │   └── index.ts         ← Zod schemas
│   └── constants.ts
└── theme/
    ├── colors.ts
    ├── typography.ts
    └── spacing.ts
```

---

## MODULE 1: AUTHENTICATION

### 1.1 Mobile Auth Flow

The backend exposes three endpoints specifically for mobile authentication (separate from the NextAuth web flow):

```
POST /api/auth/mobile-login
POST /api/auth/mobile-logout
POST /api/auth/mobile-refresh
```

**Login request:**
```typescript
// POST /api/auth/mobile-login
body: {
  email: string      // accepts email OR 10-digit mobile number
  password: string
}
response: {
  accessToken: string   // short-lived JWT (store in SecureStore)
  refreshToken: string  // long-lived JWT (store in SecureStore)
  profile: {
    id: string
    fullName: string
    email: string | null
    mobileNumber: string
    role: "owner" | "trainer" | "member" | null
    ownerPlanStatus: "PENDING_SELECTION" | "ACTIVE" | null
    avatarUrl: string | null
  }
}
```

**Token refresh:**
```typescript
// POST /api/auth/mobile-refresh
body: { refreshToken: string }
response: { accessToken: string, refreshToken: string }
```

**Logout:**
```typescript
// POST /api/auth/mobile-logout
headers: { Authorization: "Bearer <accessToken>" }
body: { refreshToken: string }
response: { success: true }
```

**Create `src/auth/storage.ts`:**
```typescript
import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "gymstack_access_token";
const REFRESH_KEY = "gymstack_refresh_token";

export const TokenStorage = {
  getAccess: () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefresh: () => SecureStore.getItemAsync(REFRESH_KEY),
  setTokens: (access: string, refresh: string) => Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]),
  clear: () => Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]),
};
```

**Create `src/api/client.ts`:** Axios instance with request interceptor (attach Bearer token) and response interceptor (retry once on 401 via /mobile-refresh, then logout).

**Create `src/stores/authStore.ts` (Zustand):**
```typescript
interface AuthStore {
  accessToken: string | null
  refreshToken: string | null
  profile: ProfileData | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshTokens: () => Promise<void>
  setProfile: (profile: ProfileData) => void
}
```

On app start, read tokens from SecureStore. If accessToken exists, call `/api/profile/me` to restore session.

### 1.2 OTP Flow (Registration)

The signup flow is a two-step process:

**Step 1 — Send OTP:**
```typescript
// POST /api/auth/send-otp
body: { email: string, fullName: string }
response: { success: boolean, message: string, expiresIn: number }
```

**Step 2 — Verify OTP:**
```typescript
// POST /api/auth/verify-otp
body: { email: string, otp: string }  // otp is 6 digits
response: { verified: true }
```

**Step 3 — Register:**
```typescript
// POST /api/auth/register
body: {
  fullName: string
  email: string
  password: string          // min 8 chars
  mobileNumber: string      // 10 digits, normalized
  city: string
  gender?: "MALE" | "FEMALE" | "OTHER"
  referralCode?: string
}
response: { success: boolean, profileId: string }
```

**Real-time uniqueness checks (debounced 500ms):**
```typescript
// GET /api/auth/check-email-status?email=...
response: { status: "FOUND" | "NOT_FOUND" | "INVITED" }

// GET /api/auth/check-mobile-status?mobile=...
response: { status: "ACTIVE" | "INVITED" | "NOT_FOUND" }
```

After successful registration, auto-login via `/api/auth/mobile-login`.

### 1.3 Screens to Create

**`screens/auth/LoginScreen.tsx`:**
- Single `TextInput` for email or mobile (the backend auto-detects; mobile = 10 digits matching `/^[6-9]\d{9}$/`)
- Password input with show/hide toggle
- "Forgot Password?" link
- "Sign Up" link
- On submit: call `authStore.login(email, password)`
- Error mapping: show toast for wrong password, account not found, OAuth-only account, invited-but-not-completed

**`screens/auth/SignupScreen.tsx`:**
- Two-step screen using local `step` state (1 = form, 2 = OTP)
- **Step 1 fields:** fullName*, mobileNumber*, city*, email*, gender (select), password*, referralCode (optional)
- Debounce email and mobile inputs to check uniqueness
- **Step 2:** `OtpInput` component (6 boxes, auto-advance, paste support, backspace)
- Resend button with 60-second countdown (`setInterval`, clear on unmount)
- On OTP verified + register: auto-login, navigate to SelectRole

**`screens/auth/SelectRoleScreen.tsx`:**
- Three cards: Owner, Trainer, Member
- ```typescript
  // POST /api/profile/set-role
  body: { role: "owner" | "trainer" | "member" }
  response: { success: boolean }
  ```
- After setting role: refresh profile, navigate to respective stack

**`screens/auth/CompleteProfileScreen.tsx`:**
- Multi-step: validate token from deep link → show completion form
- ```typescript
  // GET /api/auth/validate-token?token=...
  response: { valid: boolean, name: string, mobile: string, role: string, gymName?: string }
  
  // GET /api/auth/check-mobile-status?mobile=...
  response: { status: "ACTIVE" | "INVITED" | "NOT_FOUND" }
  
  // POST /api/auth/request-completion-otp
  body: { mobile: string, email: string }
  
  // POST /api/auth/complete-profile
  body: { email: string, password: string, city?: string, gender?: string, token?: string }
  response: { success: boolean, role: string }
  ```
- Handle deep links: `gymstack://complete-profile?token=...`

**`screens/auth/ForgotPasswordScreen.tsx`:**
```typescript
// POST /api/auth/forgot-password
body: { email: string }
response: { success: boolean }
```

**`screens/auth/ResetPasswordScreen.tsx`:**
```typescript
// POST /api/auth/reset-password
body: { token: string, password: string }
response: { success: boolean }
```
Handle token from deep link `gymstack://reset-password?token=...`.

---

## MODULE 2: NAVIGATION

### 2.1 Root Navigator (`src/navigation/RootNavigator.tsx`)

```
RootNavigator
├── AuthNavigator (shown when !isAuthenticated)
│   ├── LoginScreen
│   ├── SignupScreen
│   ├── SelectRoleScreen
│   ├── CompleteProfileScreen
│   ├── ForgotPasswordScreen
│   └── ResetPasswordScreen
├── OwnerNavigator (shown when role === "owner")
├── MemberNavigator (shown when role === "member")
└── TrainerNavigator (shown when role === "trainer")
```

On app start: read token from SecureStore → if valid, show appropriate role navigator; else show AuthNavigator.

Handle role === null (authenticated but no role): always show SelectRoleScreen.

Handle `ownerPlanStatus === "PENDING_SELECTION"` or `hasActivePlan === false` for owners: show ChoosePlanScreen as the first screen (non-dismissable).

### 2.2 Owner Navigator (`src/navigation/OwnerNavigator.tsx`)

Bottom tab navigator with a Drawer or Stack for sub-screens:

```
OwnerTabNavigator (Bottom Tabs)
├── Dashboard Tab → DashboardScreen
├── Members Tab → Stack
│   ├── MembersScreen (list)
│   ├── MemberDetailScreen
│   └── AddMemberScreen
├── More Tab (or Drawer) → links to:
│   ├── TrainersScreen
│   ├── WorkoutsScreen
│   ├── DietsScreen
│   ├── AttendanceScreen
│   ├── PaymentsScreen
│   ├── SupplementsScreen
│   ├── ExpensesScreen
│   ├── LockersScreen
│   ├── ReportsScreen
│   └── SettingsScreen
└── Notifications Tab → NotificationsScreen
```

Trainer and Trainer Detail screens are full-stack screens pushed from the Members/Trainers list.

### 2.3 Member Navigator (`src/navigation/MemberNavigator.tsx`)

```
MemberTabNavigator (Bottom Tabs)
├── Home Tab → DashboardScreen
├── Workouts Tab → Stack
│   ├── WorkoutsScreen
│   └── WorkoutDetailScreen
├── Diet Tab → Stack
│   ├── DietsScreen
│   └── DietDetailScreen
├── Progress Tab → Stack
│   ├── BodyMetricsScreen
│   └── AttendanceScreen
└── Profile Tab → ProfileScreen (+ PaymentsScreen, NotificationsScreen as sub-screens)
```

### 2.4 Trainer Navigator (`src/navigation/TrainerNavigator.tsx`)

```
TrainerTabNavigator (Bottom Tabs)
├── Dashboard Tab → DashboardScreen
├── Gyms Tab → Stack (MyGymsScreen, DiscoverScreen, GymDetailScreen)
├── Plans Tab → Stack (WorkoutsScreen, DietsScreen)
└── Profile Tab → ProfileScreen
```

---

## MODULE 3: DATA TYPES

Create `src/types/` with these exact interfaces:

### `src/types/auth.ts`
```typescript
export type UserRole = "owner" | "trainer" | "member" | null;
export type OwnerPlanStatus = "PENDING_SELECTION" | "ACTIVE" | null;
export type ProfileStatus = "ACTIVE" | "INVITED";
export type AuthProvider = "EMAIL" | "GOOGLE" | "GITHUB";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  profile: AuthProfile;
}

export interface AuthProfile {
  id: string;
  fullName: string;
  email: string | null;
  mobileNumber: string;
  role: UserRole;
  ownerPlanStatus: OwnerPlanStatus;
  avatarUrl: string | null;
}
```

### `src/types/profile.ts`
```typescript
export interface ProfileData {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  mobileNumber: string;
  avatarUrl: string | null;
  city: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth: string | null;
  address: string | null;
  goals: string | null;
  role: UserRole;
  ownerPlanStatus: OwnerPlanStatus;
  status: ProfileStatus;
  wallet: { balance: number } | null;
  referralCode: string | null;
  gym: GymSummary | null;
}

export interface GymSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  city: string;
}
```

### `src/types/gym.ts`
```typescript
export interface Gym {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  whatsappNumber: string | null;
  services: string[];
  facilities: string[];
  gymImages: string[];
  logoUrl: string | null;
  timezone: string;
  currency: string;
  isActive: boolean;
}

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  durationMonths: number;
  price: number;
  features: string[];
  maxClasses: number | null;
  isActive: boolean;
}
```

### `src/types/member.ts`
```typescript
export type MemberStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "EXPIRED";
export type AttendanceMethod = "MANUAL" | "QR" | "BIOMETRIC" | "SELF";

export interface GymMember {
  id: string;
  gymId: string;
  profileId: string;
  membershipPlanId: string | null;
  assignedTrainerId: string | null;
  membershipType: string | null;
  status: MemberStatus;
  registrationId: string;
  startDate: string | null;
  endDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  medicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  currentStreak: number;
  longestStreak: number;
  lastCheckinDate: string | null;
  totalCheckins: number;
  isActive: boolean;
  gymNameSnapshot: string | null;
  profile: {
    fullName: string;
    email: string | null;
    mobileNumber: string;
    avatarUrl: string | null;
    city: string | null;
    gender: string | null;
  };
  membershipPlan: MembershipPlan | null;
}

export interface Attendance {
  id: string;
  gymId: string;
  memberId: string;
  checkInTime: string;
  checkOutTime: string | null;
  method: AttendanceMethod;
}

export interface BodyMetric {
  id: string;
  memberId: string;
  recordedAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  bmi: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  notes: string | null;
}
```

### `src/types/payment.ts`
```typescript
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  membershipPlanId: string | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatus;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  invoiceUrl: string | null;
  paymentDate: string;
  planNameSnapshot: string | null;
  notes: string | null;
}
```

### `src/types/notification.ts`
```typescript
export type NotificationType = "BILLING" | "CLASS_REMINDER" | "PLAN_UPDATE" | "ANNOUNCEMENT" | "REFERRAL" | "SYSTEM";

export interface Notification {
  id: string;
  gymId: string | null;
  profileId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
```

### `src/types/supplement.ts`
```typescript
export interface Supplement {
  id: string;
  gymId: string;
  name: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  unitSize: string | null;
  price: number;
  costPrice: number | null;
  stockQty: number;
  lowStockAt: number;
  imageUrl: string | null;
  isActive: boolean;
}

export interface SupplementSale {
  id: string;
  supplementId: string;
  gymId: string;
  memberId: string | null;
  memberName: string;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string;
  notes: string | null;
  soldAt: string;
}
```

### `src/types/expense.ts`
```typescript
export type ExpenseCategory = "ELECTRICITY" | "WATER" | "RENT" | "EQUIPMENT_PURCHASE" | "EQUIPMENT_MAINTENANCE" | "STAFF_SALARY" | "MARKETING" | "CLEANING" | "INSURANCE" | "INTERNET" | "SOFTWARE" | "MISCELLANEOUS";

export interface GymExpense {
  id: string;
  gymId: string;
  addedById: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  expenseDate: string;
  receiptUrl: string | null;
}
```

### `src/types/locker.ts`
```typescript
export type LockerStatus = "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RESERVED";

export interface Locker {
  id: string;
  gymId: string;
  lockerNumber: string;
  floor: string | null;
  size: string | null;
  status: LockerStatus;
  monthlyFee: number;
  notes: string | null;
}

export interface LockerAssignment {
  id: string;
  lockerId: string;
  memberId: string;
  gymId: string;
  assignedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  feeCollected: boolean;
  notes: string | null;
}
```

### `src/types/billing.ts`
```typescript
export type SaasPlanInterval = "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY" | "LIFETIME";
export type SaasSubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED" | "LIFETIME";

export interface SaasPlan {
  id: string;
  name: string;
  description: string | null;
  interval: SaasPlanInterval;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  maxGyms: number | null;
  maxMembers: number | null;
  maxTrainers: number | null;
  maxMembershipPlans: number | null;
  maxNotificationsPerMonth: number | null;
  maxClasses: number | null;
  maxStorageGb: number | null;
  attendanceTracking: boolean;
  workoutPlans: boolean;
  dietPlans: boolean;
  classScheduling: boolean;
  reportsAnalytics: boolean;
  onlinePayments: boolean;
  balanceSheet: boolean;
  supplementManagement: boolean;
  customBranding: boolean;
  whatsappIntegration: boolean;
  apiAccess: boolean;
}

export interface SaasSubscription {
  id: string;
  profileId: string;
  saasPlanId: string;
  status: SaasSubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  razorpaySubId: string | null;
  saasPlan: SaasPlan;
}
```

### `src/types/workout.ts`
```typescript
export type DifficultyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface WorkoutPlan {
  id: string;
  gymId: string;
  createdBy: string;
  assignedToMemberId: string | null;
  title: string;
  description: string | null;
  goal: string | null;
  difficulty: DifficultyLevel | null;
  isGlobal: boolean;
  isTemplate: boolean;
  durationWeeks: number | null;
  weekStartDate: string | null;
  planData: WorkoutPlanData;
  isActive: boolean;
}

export interface WorkoutPlanData {
  weeks: WorkoutWeek[];
}

export interface WorkoutWeek {
  weekNumber: number;
  days: WorkoutDay[];
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  exercises: Exercise[];
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weightKg: number | null;
  durationSec: number | null;
  restSec: number | null;
  notes: string | null;
}

export interface DietPlan {
  id: string;
  gymId: string;
  createdBy: string;
  assignedToMemberId: string | null;
  title: string;
  description: string | null;
  goal: string | null;
  caloriesTarget: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  isGlobal: boolean;
  isTemplate: boolean;
  durationWeeks: number | null;
  weekStartDate: string | null;
  planData: DietPlanData;
  isActive: boolean;
}

export interface DietPlanData {
  weeks: DietWeek[];
}

export interface DietWeek {
  weekNumber: number;
  days: DietDay[];
}

export interface DietDay {
  dayNumber: number;
  name: string;
  meals: Meal[];
  totalCalories: number | null;
}

export interface Meal {
  name: string;
  time: string | null;
  foods: FoodItem[];
}

export interface FoodItem {
  name: string;
  qty: string;
  calories: number | null;
  protein: number | null;
}
```

---

## MODULE 4: API LAYER

### 4.1 Axios Client (`src/api/client.ts`)

```typescript
import axios from "axios";
import { TokenStorage } from "../auth/storage";
import { authStore } from "../stores/authStore";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL; // e.g. "https://your-domain.com"

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await TokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: refresh once, retry. On second 401: logout.
let isRefreshing = false;
let failedQueue: any[] = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await TokenStorage.getRefresh();
        const { data } = await axios.post(`${BASE_URL}/api/auth/mobile-refresh`, { refreshToken });
        await TokenStorage.setTokens(data.accessToken, data.refreshToken);
        authStore.getState().setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch (err) {
        processQueue(err, null);
        authStore.getState().logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
```

### 4.2 All API Functions

Create one file per domain. Every function returns the typed response data. Use `apiClient` for all calls.

#### `src/api/auth.ts`
```typescript
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>("/api/auth/mobile-login", { email, password }),

  logout: (refreshToken: string) =>
    apiClient.post("/api/auth/mobile-logout", { refreshToken }),

  refresh: (refreshToken: string) =>
    apiClient.post<TokenPair>("/api/auth/mobile-refresh", { refreshToken }),

  sendOtp: (email: string, fullName: string) =>
    apiClient.post<{ success: boolean; expiresIn: number }>("/api/auth/send-otp", { email, fullName }),

  verifyOtp: (email: string, otp: string) =>
    apiClient.post<{ verified: boolean }>("/api/auth/verify-otp", { email, otp }),

  register: (data: RegisterPayload) =>
    apiClient.post<{ success: boolean; profileId: string }>("/api/auth/register", data),

  checkEmailStatus: (email: string) =>
    apiClient.get<{ status: "FOUND" | "NOT_FOUND" | "INVITED" }>(`/api/auth/check-email-status?email=${encodeURIComponent(email)}`),

  checkMobileStatus: (mobile: string) =>
    apiClient.get<{ status: "ACTIVE" | "INVITED" | "NOT_FOUND" }>(`/api/auth/check-mobile-status?mobile=${encodeURIComponent(mobile)}`),

  validateToken: (token: string) =>
    apiClient.get<{ valid: boolean; name?: string; mobile?: string; role?: string; gymName?: string }>(`/api/auth/validate-token?token=${token}`),

  requestCompletionOtp: (mobile: string, email: string) =>
    apiClient.post("/api/auth/request-completion-otp", { mobile, email }),

  completeProfile: (data: CompleteProfilePayload) =>
    apiClient.post<{ success: boolean; role: string }>("/api/auth/complete-profile", data),

  forgotPassword: (email: string) =>
    apiClient.post("/api/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post("/api/auth/reset-password", { token, password }),

  setRole: (role: UserRole) =>
    apiClient.post("/api/profile/set-role", { role }),
};
```

#### `src/api/profile.ts`
```typescript
export const profileApi = {
  getMe: () =>
    apiClient.get<ProfileData>("/api/profile/me"),

  update: (data: UpdateProfilePayload) =>
    apiClient.post("/api/profile/update", data),

  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient.post("/api/profile/change-password", { oldPassword, newPassword }),
};
```

#### `src/api/owner/dashboard.ts`
```typescript
export type DashRange = "today" | "last_7_days" | "last_30_days" | "last_3_months" | "custom";

export const ownerDashboardApi = {
  getStats: (gymId: string, range: DashRange, customStart?: string, customEnd?: string) =>
    apiClient.get("/api/owner/dashboard", {
      params: { gymId, range, customStart, customEnd },
    }),
};
```

Dashboard response shape:
```typescript
interface DashboardStats {
  gymIds: string[];
  totalMembers: number;
  activeMembers: number;
  totalAttendanceToday: number;
  monthlyRevenue: number;
  recentMembers: GymMember[];
  todayCheckins: Attendance[];
  expiredMembers: { id: string; fullName: string }[];
  expiringToday: { id: string; fullName: string }[];
  expiringMembers3: { id: string; fullName: string }[];
  expiringMembers: { id: string; fullName: string }[];
}
```

#### `src/api/owner/members.ts`
```typescript
export const ownerMembersApi = {
  list: (gymId: string, params?: { page?: number; search?: string; status?: MemberStatus }) =>
    apiClient.get<PaginatedResponse<GymMember>>("/api/owner/members", { params: { gymId, ...params } }),

  create: (data: CreateMemberPayload) =>
    apiClient.post<{ outcome: "created" | "linked" | "reinvited"; id: string; gymMemberId: string }>("/api/owner/members", data),

  bulkUpload: (gymId: string, formData: FormData) =>
    apiClient.post("/api/owner/members/bulk", formData, {
      params: { gymId },
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getById: (memberId: string) =>
    apiClient.get<GymMember>(`/api/owner/members/${memberId}`),

  update: (memberId: string, data: UpdateMemberPayload) =>
    apiClient.post(`/api/owner/members/${memberId}`, data),

  renew: (memberId: string, data: RenewMemberPayload) =>
    apiClient.post(`/api/owner/members/${memberId}/renew`, data),
};

// CreateMemberPayload:
interface CreateMemberPayload {
  gymId: string;
  fullName: string;
  mobileNumber: string;
  membershipPlanId: string;
  startDate?: string;       // ISO date
  endDate?: string;
  paymentReceived: number;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  goals?: string;
  avatarUrl?: string;
}
```

#### `src/api/owner/gyms.ts`
```typescript
export const ownerGymsApi = {
  list: () => apiClient.get<Gym[]>("/api/owner/gyms"),
  create: (data: CreateGymPayload) => apiClient.post<Gym>("/api/owner/gyms", data),
  getById: (gymId: string) => apiClient.get<Gym>(`/api/owner/gyms/${gymId}`),
  update: (gymId: string, data: UpdateGymPayload) => apiClient.post(`/api/owner/gyms/${gymId}`, data),
};

// CreateGymPayload:
interface CreateGymPayload {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  whatsappNumber?: string;
  services?: string[];
  facilities?: string[];
  gymImages?: string[];
  logoUrl?: string;
  timezone?: string;
  currency?: string;
}
```

#### `src/api/owner/trainers.ts`
```typescript
export const ownerTrainersApi = {
  list: (gymId: string) => apiClient.get<GymTrainer[]>("/api/owner/trainers", { params: { gymId } }),
  create: (data: CreateTrainerPayload) => apiClient.post("/api/owner/trainers", data),
  getById: (trainerId: string) => apiClient.get(`/api/owner/trainers/${trainerId}`),
  update: (trainerId: string, data: any) => apiClient.post(`/api/owner/trainers/${trainerId}`, data),
};
```

#### `src/api/owner/attendance.ts`
```typescript
export const ownerAttendanceApi = {
  list: (gymId: string, range?: DashRange) =>
    apiClient.get<Attendance[]>("/api/owner/attendance", { params: { gymId, range } }),
  log: (data: { gymId: string; memberId: string; method?: AttendanceMethod }) =>
    apiClient.post("/api/owner/attendance", data),
};
```

#### `src/api/owner/payments.ts`
```typescript
export const ownerPaymentsApi = {
  list: (gymId: string, params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<Payment> & { monthTotal: number }>("/api/owner/payments", {
      params: { gymId, ...params },
    }),
};
```

#### `src/api/owner/workouts.ts`
```typescript
export const ownerWorkoutsApi = {
  list: (gymId: string) => apiClient.get<WorkoutPlan[]>("/api/owner/workouts", { params: { gymId } }),
  create: (data: CreateWorkoutPayload) => apiClient.post("/api/owner/workouts", data),
  getById: (planId: string) => apiClient.get(`/api/owner/workouts/${planId}`),
  update: (planId: string, data: any) => apiClient.post(`/api/owner/workouts/${planId}`, data),
};
```

#### `src/api/owner/diets.ts`
```typescript
export const ownerDietsApi = {
  list: (gymId: string) => apiClient.get<DietPlan[]>("/api/owner/diets", { params: { gymId } }),
  create: (data: CreateDietPayload) => apiClient.post("/api/owner/diets", data),
  getById: (planId: string) => apiClient.get(`/api/owner/diets/${planId}`),
  update: (planId: string, data: any) => apiClient.post(`/api/owner/diets/${planId}`, data),
};
```

#### `src/api/owner/supplements.ts`
```typescript
export const ownerSupplementsApi = {
  list: (gymId: string) =>
    apiClient.get<Supplement[]>("/api/owner/supplements", { params: { gymId } }),
  create: (data: CreateSupplementPayload) =>
    apiClient.post("/api/owner/supplements", data),
  sell: (data: SellSupplementPayload) =>
    apiClient.post("/api/owner/supplements/sell", data),
};

interface SellSupplementPayload {
  supplementId: string;
  gymId: string;
  memberId?: string;
  memberName: string;
  qty: number;
  unitPrice: number;
  paymentMethod: string;
  notes?: string;
}
```

#### `src/api/owner/expenses.ts`
```typescript
export const ownerExpensesApi = {
  list: (gymId: string, params?: { page?: number; category?: ExpenseCategory }) =>
    apiClient.get<PaginatedResponse<GymExpense>>("/api/owner/expenses", { params: { gymId, ...params } }),
  create: (data: CreateExpensePayload) =>
    apiClient.post("/api/owner/expenses", data),
  update: (expenseId: string, data: any) =>
    apiClient.patch(`/api/owner/expenses/${expenseId}`, data),
  delete: (expenseId: string) =>
    apiClient.delete(`/api/owner/expenses/${expenseId}`),
};
```

#### `src/api/owner/lockers.ts`
```typescript
export const ownerLockersApi = {
  list: (gymId: string) =>
    apiClient.get<Locker[]>("/api/owner/lockers", { params: { gymId } }),
  create: (data: CreateLockerPayload) =>
    apiClient.post("/api/owner/lockers", data),
  getById: (lockerId: string) =>
    apiClient.get(`/api/owner/lockers/${lockerId}`),
  update: (lockerId: string, data: any) =>
    apiClient.patch(`/api/owner/lockers/${lockerId}`, data),
  assign: (lockerId: string, data: AssignLockerPayload) =>
    apiClient.post(`/api/owner/lockers/${lockerId}/assign`, data),
};

interface AssignLockerPayload {
  memberId: string;
  gymId: string;
  expiresAt?: string;
  feeCollected: boolean;
  notes?: string;
}
```

#### `src/api/owner/notifications.ts`
```typescript
export const ownerNotificationsApi = {
  list: () => apiClient.get<Notification[]>("/api/owner/notifications"),
  create: (data: CreateNotificationPayload) =>
    apiClient.post("/api/owner/notifications", data),
};
```

#### `src/api/owner/reports.ts`
```typescript
export const ownerReportsApi = {
  get: (gymId: string, range?: DashRange) =>
    apiClient.get("/api/owner/reports", { params: { gymId, range } }),
};
```

#### `src/api/member/` — member-facing equivalents
```typescript
// GET /api/member/dashboard
// GET /api/member/has-gym
// GET /api/member/gyms
// GET /api/member/discover
// GET /api/member/discover/:gymId
// GET/POST /api/member/workouts
// GET /api/member/workouts/:planId
// GET /api/member/diets
// GET /api/member/diets/:planId
// GET/POST /api/member/body-metrics
// GET/POST /api/member/attendance
// GET /api/member/payments
// GET /api/member/notifications
// GET /api/member/supplements
// GET /api/member/announcements
```

Member dashboard response:
```typescript
interface MemberDashboard {
  memberships: GymMember[];
  streak: number;
  checkinsThisMonth: number;
  todayWorkout: WorkoutDay | null;
  todayDiet: DietDay | null;
  unreadNotifications: number;
}
```

#### Billing API (`src/api/billing.ts`)
```typescript
export const billingApi = {
  getPlans: () => apiClient.get<SaasPlan[]>("/api/billing/plans"),

  createOrder: (saasPlanId: string) =>
    apiClient.post<{
      orderId: string;
      amount: number;
      currency: string;
      key: string;
    }>("/api/billing/create-order", { saasPlanId }),

  subscribe: (data: {
    saasPlanId: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
  }) => apiClient.post("/api/billing/subscribe", data),

  getSubscription: () => apiClient.get<SaasSubscription | null>("/api/owner/subscription"),
};
```

#### Referral API (`src/api/referral.ts`)
```typescript
export const referralApi = {
  get: () =>
    apiClient.get<{
      code: string;
      referrals: Array<{
        id: string;
        status: "PENDING" | "CONVERTED" | "EXPIRED";
        createdAt: string;
        referred: { fullName: string; avatarUrl: string | null };
      }>;
    }>("/api/referral"),
};
```

---

## MODULE 5: REACT QUERY SETUP

### `src/lib/queryKeys.ts`
```typescript
export const queryKeys = {
  profile: { me: ["profile", "me"] },
  owner: {
    dashboard: (gymId: string, range: string) => ["owner", "dashboard", gymId, range],
    members: (gymId: string) => ["owner", "members", gymId],
    member: (id: string) => ["owner", "member", id],
    gyms: () => ["owner", "gyms"],
    gym: (id: string) => ["owner", "gym", id],
    trainers: (gymId: string) => ["owner", "trainers", gymId],
    workouts: (gymId: string) => ["owner", "workouts", gymId],
    diets: (gymId: string) => ["owner", "diets", gymId],
    payments: (gymId: string) => ["owner", "payments", gymId],
    attendance: (gymId: string) => ["owner", "attendance", gymId],
    supplements: (gymId: string) => ["owner", "supplements", gymId],
    expenses: (gymId: string) => ["owner", "expenses", gymId],
    lockers: (gymId: string) => ["owner", "lockers", gymId],
    notifications: () => ["owner", "notifications"],
    reports: (gymId: string, range: string) => ["owner", "reports", gymId, range],
    subscription: () => ["owner", "subscription"],
  },
  member: {
    dashboard: () => ["member", "dashboard"],
    gyms: () => ["member", "gyms"],
    workouts: (gymId: string) => ["member", "workouts", gymId],
    diets: (gymId: string) => ["member", "diets", gymId],
    attendance: (gymId: string) => ["member", "attendance", gymId],
    bodyMetrics: (gymId: string) => ["member", "bodyMetrics", gymId],
    payments: () => ["member", "payments"],
    notifications: () => ["member", "notifications"],
  },
  billing: {
    plans: () => ["billing", "plans"],
  },
};
```

### `src/lib/constants.ts`
```typescript
export const PAGINATION_LIMIT = 20;
export const OTP_EXPIRY_SECONDS = 600; // 10 min
export const OTP_RESEND_COOLDOWN = 60; // 1 min
export const GRACE_PERIOD_DAYS = 7;
export const REFERRAL_EXPIRY_DAYS = 30;
export const INVITE_TOKEN_EXPIRY_DAYS = 30;

export const EXPENSE_CATEGORIES = [
  "ELECTRICITY", "WATER", "RENT", "EQUIPMENT_PURCHASE",
  "EQUIPMENT_MAINTENANCE", "STAFF_SALARY", "MARKETING",
  "CLEANING", "INSURANCE", "INTERNET", "SOFTWARE", "MISCELLANEOUS"
] as const;

export const ATTENDANCE_STREAK_MILESTONES = [30, 100, 365];
```

---

## MODULE 6: FORMS & VALIDATION (Zod Schemas)

Create `src/lib/schemas/index.ts` with these Zod schemas:

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "At least 2 characters"),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  city: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  password: z.string().min(8, "At least 8 characters"),
  referralCode: z.string().optional(),
});

export const otpSchema = z.object({
  otp: z.string().length(6, "Enter all 6 digits"),
});

export const addMemberSchema = z.object({
  gymId: z.string(),
  fullName: z.string().min(2),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile required"),
  membershipPlanId: z.string().min(1, "Select a plan"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentReceived: z.number().min(0),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  goals: z.string().optional(),
});

export const createGymSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, "6-digit pincode"),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile"),
  whatsappNumber: z.string().optional(),
});

export const createExpenseSchema = z.object({
  gymId: z.string(),
  title: z.string().min(2),
  amount: z.number().positive(),
  category: z.enum([
    "ELECTRICITY", "WATER", "RENT", "EQUIPMENT_PURCHASE",
    "EQUIPMENT_MAINTENANCE", "STAFF_SALARY", "MARKETING",
    "CLEANING", "INSURANCE", "INTERNET", "SOFTWARE", "MISCELLANEOUS"
  ]),
  description: z.string().optional(),
  expenseDate: z.string(),
  receiptUrl: z.string().optional(),
});

export const addBodyMetricSchema = z.object({
  weightKg: z.number().positive().optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  muscleMassKg: z.number().positive().optional(),
  bmi: z.number().positive().optional(),
  chestCm: z.number().positive().optional(),
  waistCm: z.number().positive().optional(),
  hipsCm: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const createLockerSchema = z.object({
  gymId: z.string(),
  lockerNumber: z.string().min(1),
  floor: z.string().optional(),
  size: z.string().optional(),
  monthlyFee: z.number().min(0),
  notes: z.string().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});
```

Use `zodResolver` from `@hookform/resolvers/zod` in every form.

---

## MODULE 7: SCREEN IMPLEMENTATIONS

### 7.1 Owner Dashboard Screen (`screens/owner/DashboardScreen.tsx`)

```
- Gym selector dropdown (if owner has multiple gyms)
- Date range selector: Today / 7 Days / 30 Days / 3 Months / Custom
- Stat cards (2-column grid):
  - Total Members
  - Active Members
  - Monthly Revenue (₹)
  - Today's Attendance
- Membership Expiry Alerts section (red/yellow cards):
  - Expired Members (red)
  - Expiring Today (red)
  - Expiring in 3 Days (yellow)
  - Expiring in 7 Days (yellow)
- Recent Members list (last 5, with avatar, name, plan, status badge)
- Today's Check-ins list (last 8, with avatar, name, time)
- Quick Actions: Add Member, Create Workout, View Reports
```

Data source: `GET /api/owner/dashboard?gymId=...&range=...`

### 7.2 Members Screen (`screens/owner/MembersScreen.tsx`)

```
- Search bar (debounced 400ms, searches name/email/mobile)
- Status filter tabs: All | Active | Expired | Inactive | Suspended
- Paginated FlatList of MemberCard components
- Each MemberCard shows: avatar, name, plan, status badge, expiry date
- FAB (Floating Action Button) → AddMemberScreen
- Pull-to-refresh
- Infinite scroll (load more on end reached)
```

Pagination: `page` query param, `limit=20`. Show `Pagination` component or load-more button.

### 7.3 Add Member Screen (`screens/owner/AddMemberScreen.tsx`)

Form fields (React Hook Form + Zod):
- Full Name* (text)
- Mobile Number* (numeric, 10 digits, validated)
- Email (optional, email type)
- Membership Plan* (select from gym's active plans)
- Start Date (date picker, defaults to today)
- End Date (auto-calculated from plan duration, editable)
- Payment Received (numeric, ₹)
- Gender (select: Male / Female / Other)
- Date of Birth (date picker, optional)
- Address (multi-line text, optional)
- Goals (multi-line text, optional)

On submit: `POST /api/owner/members`. Handle three outcomes:
- `"created"` → success toast "Member added and invite sent"
- `"linked"` → success toast "Existing user linked to gym"
- `"reinvited"` → success toast "Invite resent to existing member"

### 7.4 Member Detail Screen (`screens/owner/MemberDetailScreen.tsx`)

Tabs: Info | Plans | Attendance | Payments | Body Metrics

**Info tab:** Profile info, emergency contact, medical notes, edit button
**Plans tab:** Current membership plan, renewal button, plan history
**Attendance tab:** Calendar heatmap of check-ins, streak count, total check-ins
**Payments tab:** List of payments with status, amount, method, date
**Body Metrics tab:** Line/bar charts for weight, body fat, BMI over time; add new entry button

### 7.5 Payments Screen (`screens/owner/PaymentsScreen.tsx`)

```
- Month total revenue header card
- Filter by gym (dropdown)
- Paginated FlatList of Payment cards:
  - Member name + avatar
  - Plan name (planNameSnapshot)
  - Amount, status badge (COMPLETED=green, FAILED=red, PENDING=yellow)
  - Payment method, date
- Pull-to-refresh
```

Data: `GET /api/owner/payments?gymId=...&page=...`
Response includes `monthTotal` (number).

### 7.6 Expenses Screen (`screens/owner/ExpensesScreen.tsx`)

```
- Category filter chips (horizontal scroll)
- Paginated list of expense cards
- Total expenses summary card
- FAB → Add Expense modal/screen
```

CRUD:
- Create: `POST /api/owner/expenses`
- Update: `PATCH /api/owner/expenses/:id`
- Delete: `DELETE /api/owner/expenses/:id`

### 7.7 Supplements Screen (`screens/owner/SupplementsScreen.tsx`)

Two tabs: Inventory | Sales History

**Inventory tab:**
- List of supplements with stock quantity
- Low stock warning (stockQty <= lowStockAt) — show red badge
- Add supplement button → form

**Sales History tab:**
- List of sales with member name, qty, amount, date

Sell supplement: `POST /api/owner/supplements/sell`

### 7.8 Lockers Screen (`screens/owner/LockersScreen.tsx`)

```
- Grid of locker cards (3 columns)
- Color coded: AVAILABLE=green, ASSIGNED=blue, MAINTENANCE=orange, RESERVED=yellow
- Tap locker → Locker Detail (assignment info, member name if assigned)
- Assign locker: POST /api/owner/lockers/:id/assign
- Add locker: POST /api/owner/lockers
- Update locker status: PATCH /api/owner/lockers/:id
```

### 7.9 Reports Screen (`screens/owner/ReportsScreen.tsx`)

```
- Date range selector
- Revenue chart (bar, by week/month)
- Attendance chart (line, by day)
- Member growth chart (line)
- Top paying members list
- Revenue breakdown by membership plan
```

Data: `GET /api/owner/reports?gymId=...&range=...`

### 7.10 Notifications Screen (Owner + Member + Trainer)

```
- List of notifications grouped by date
- Unread notifications shown with highlight
- Tap to mark as read (update isRead)
- Notification types with different icons:
  - BILLING → credit card icon
  - ANNOUNCEMENT → megaphone icon
  - PLAN_UPDATE → dumbbell icon
  - REFERRAL → gift icon
  - SYSTEM → bell icon
```

Data: `GET /api/owner/notifications` or `GET /api/member/notifications`

### 7.11 Workout Plan Screen (`screens/owner/WorkoutsScreen.tsx`)

```
- List of workout plans (global + member-assigned)
- Filter: All | Global | Assigned
- Each card: title, difficulty badge, member name (if assigned), weeks
- Tap → WorkoutDetailScreen
- FAB → Create plan
```

Workout Plan Detail:
```
- Plan info header (title, goal, difficulty, duration)
- Week tabs (Week 1, Week 2, ...)
- Day accordion (Day 1 → list of exercises with sets/reps/weight)
- Assign to member button
```

### 7.12 Diet Plan Screen (`screens/owner/DietsScreen.tsx`)

Same pattern as Workouts but with diet-specific fields:
- Calories target, protein/carbs/fat grams
- Meals per day with foods and portions

### 7.13 Member Dashboard Screen (`screens/member/DashboardScreen.tsx`)

```
- Greeting with profile name + avatar
- Active membership card (gym name, plan, expiry date, status)
- Streak counter (fire emoji + number)
- This month check-ins count
- Today's workout card (show day's exercises if plan assigned)
- Today's diet card (show day's meals if diet assigned)
- Quick actions: Log attendance, View workout, View diet
```

Data: `GET /api/member/dashboard`

### 7.14 Body Metrics Screen (`screens/member/BodyMetricsScreen.tsx`)

```
- Line chart for weight over time
- BMI indicator
- Body fat percentage gauge
- History list of entries (reverse chronological)
- FAB → Add new measurement
- Add metric form: weight, body fat %, muscle mass, BMI, chest/waist/hips, notes
```

Data:
- GET: `GET /api/member/body-metrics?gymId=...`
- POST: `POST /api/member/body-metrics`

### 7.15 Choose Plan Screen (`screens/owner/ChoosePlanScreen.tsx`)

```
- List of SaaS plans as cards
- Each card: name, price, interval, feature flags as checkmarks
- Highlight popular plan
- Lifetime plan as special card
- "Select Plan" button → triggers Razorpay checkout
```

Payment flow:
1. `POST /api/billing/create-order { saasPlanId }` → get `{ orderId, amount, currency, key }`
2. Open `RazorpayCheckout.open({ key, order_id, amount, currency, ... })`
3. On success: `POST /api/billing/subscribe { saasPlanId, razorpayPaymentId, razorpayOrderId, razorpaySignature }`
4. Refresh profile and navigate to owner dashboard

Use `react-native-razorpay` package.

---

## MODULE 8: THEME

### `src/theme/colors.ts`
```typescript
export const colors = {
  // Primary orange gradient stops
  primary: "#f97316",         // orange-500
  primaryDark: "#ea580c",     // orange-600
  primaryLight: "#fb923c",    // orange-400

  // Dark backgrounds (mirrors web dark theme)
  bg: "#0d1117",              // darkest background
  bgCard: "#161b22",          // card background
  bgInput: "#1c2128",         // input field background
  bgBorder: "#2d3748",        // border color

  // Text
  textPrimary: "#f0f6fc",     // main text (near white)
  textSecondary: "#8b949e",   // muted text
  textMuted: "#484f58",       // very muted

  // Status
  success: "#3fb950",
  warning: "#d29922",
  error: "#f85149",
  info: "#58a6ff",

  // Status badges
  active: "#3fb950",
  expired: "#f85149",
  inactive: "#8b949e",
  suspended: "#d29922",
};
```

### `src/theme/typography.ts`
Font scale matching web Tailwind text sizes. Use Inter or system font.

---

## MODULE 9: PUSH NOTIFICATIONS

Use `expo-notifications` to register device and receive push notifications.

On app start (after login), call:
```typescript
// POST /api/push/register-device
body: {
  endpoint: string,     // device push token
  p256dh: string,       // Expo push token (use as p256dh)
  auth: string,         // device ID or similar
  userAgent: string,    // "react-native/expo"
}
```

Get Expo push token:
```typescript
const token = (await Notifications.getExpoPushTokenAsync()).data;
```

Handle foreground notifications: show in-app toast.
Handle background/tap: navigate to NotificationsScreen.

---

## MODULE 10: DEEP LINKS

Configure deep link scheme `gymstack://` in `app.json`:

```json
{
  "expo": {
    "scheme": "gymstack",
    "intentFilters": [
      {
        "action": "VIEW",
        "data": [{ "scheme": "gymstack" }]
      }
    ]
  }
}
```

Handle these paths in `RootNavigator.tsx` via `Linking`:
- `gymstack://complete-profile?token=...` → CompleteProfileScreen (pass token as param)
- `gymstack://reset-password?token=...` → ResetPasswordScreen (pass token as param)

---

## MODULE 11: GYM STORE

### `src/stores/gymStore.ts` (Zustand)

```typescript
interface GymStore {
  selectedGymId: string | null;
  gyms: Gym[];
  setSelectedGymId: (id: string) => void;
  setGyms: (gyms: Gym[]) => void;
}
```

The owner can manage multiple gyms. Persist `selectedGymId` in AsyncStorage so it survives app restarts. Every owner API call passes `gymId` from this store.

---

## MODULE 12: CONTEXTS

### `src/contexts/AuthContext.tsx`

Thin wrapper around `authStore` that provides `AuthContext` via React context for any components that prefer hooks over store access.

### `src/contexts/ProfileContext.tsx`

```typescript
interface ProfileContextValue {
  profile: ProfileData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isOwner: boolean;
  isTrainer: boolean;
  isMember: boolean;
  hasGym: boolean;
}
```

On mount, call `GET /api/profile/me` and cache result. Refresh after role change or plan purchase.

---

## MODULE 13: PAGINATION PATTERN

Use this standard pattern for all paginated lists:

```typescript
// In any list screen:
const [page, setPage] = useState(1);
const [allItems, setAllItems] = useState<GymMember[]>([]);

const { data, isLoading, isFetching } = useQuery({
  queryKey: queryKeys.owner.members(gymId),
  queryFn: () => ownerMembersApi.list(gymId, { page, search }),
});

// On new data, append to allItems for infinite scroll
// Show a "Load More" button if page < data.pages
```

Standard paginated response shape (all list APIs return this):
```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pages: number;
  page: number;
}
```

---

## MODULE 14: ERROR HANDLING

### Standard API Error Shape
```typescript
interface ApiError {
  error: string;        // human-readable
  code?: string;        // machine-readable e.g. "PLAN_NOT_SELECTED"
  detail?: string;
}
```

### Handle 403 `PLAN_NOT_SELECTED` or `PLAN_EXPIRED`

In the Axios response interceptor: if status 403 and code is one of these, navigate to `ChoosePlanScreen`.

### `src/hooks/useApiError.ts`

```typescript
export function useApiError() {
  const { toast } = useToast();
  return {
    handleError: (err: unknown) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "Something went wrong"
        : "Something went wrong";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  };
}
```

---

## MODULE 15: MISSING FEATURES TO ADD

The following features exist in the Next.js web app but must be explicitly implemented in React Native (do not skip these):

1. **Invite Token Deep Link Flow** — Complete profile via `gymstack://complete-profile?token=...`. Many owner-added members will enter the app via this link.

2. **Membership Expiry Alerts** — Show expiring members prominently on Owner Dashboard (not just a list, use color-coded alert cards).

3. **Attendance Streaks** — Display currentStreak, longestStreak, milestone badges (30/100/365 days) on Member Dashboard and Member Detail.

4. **Workout Log** — Member should be able to log completed workout sets:
   ```
   POST /api/member/workouts/:planId/log
   body: { weekNumber, dayNumber, sets: [{ exerciseName, setNumber, repsDone, weightKg, durationSec, completed }] }
   ```

5. **OTP Resend Cooldown** — 60-second countdown timer with disabled button.

6. **Bulk Member Upload** — Excel file upload on Add Members screen (`POST /api/owner/members/bulk`).

7. **Supplement Low Stock Warning** — Badge on Supplements tab icon when any item is low stock.

8. **Subscription Usage Meter** — Show owner how many members/gyms/plans used vs. plan limit (from `/api/owner/subscription`).

9. **Plan Gate** — `PlanGate` component: if feature not included in owner's current SaaS plan, show "Upgrade to access" overlay.

10. **Announcement System** — Owners can broadcast messages to all gym members. Members see announcements on their dashboard.
    ```
    POST /api/owner/announcements
    GET /api/member/announcements
    body: { gymId, title, body, targetRole?, publishedAt?, expiresAt? }
    ```

11. **Trainer Assignment** — When adding/editing a member, allow assigning a trainer from the gym's trainer list.

12. **Class Scheduling** (PlanGated) — If included in SaaS plan, show Classes section:
    ```
    GET /api/owner/classes?gymId=...
    POST /api/owner/classes
    POST /api/owner/classes/:id/sessions
    POST /api/member/classes/:sessionId/book
    ```

13. **Wallet & Referral Screen** — Show wallet balance, referral code (shareable), referral history with status.

14. **SaaS Subscription Management** — Show current plan, period dates, payment history on Owner Settings.

---

## MODULE 16: THIRD-PARTY LIBRARY EQUIVALENTS

| Web Library | React Native Equivalent |
|---|---|
| next/image | expo-image |
| next/link | React Navigation |
| next/router (useRouter) | useNavigation() |
| NextAuth.js | Custom JWT with SecureStore |
| Framer Motion | react-native-reanimated + moti |
| shadcn/ui + Radix UI | Custom RN components (from this prompt) |
| Tailwind CSS | StyleSheet + theme constants |
| react-hook-form | react-hook-form (same lib, works in RN) |
| Zod + zodResolver | Same (platform-agnostic) |
| TanStack Query | Same (platform-agnostic) |
| Zustand | Same (platform-agnostic) |
| Razorpay (web SDK) | react-native-razorpay |
| Firebase Web Push | expo-notifications + FCM |
| Cloudinary (upload widget) | expo-image-picker + direct upload to Cloudinary REST API |
| Web Push API | expo-notifications |
| PWA Service Worker | expo-notifications (background tasks) |
| Nodemailer / Resend | Backend only, not needed in app |
| lucide-react | lucide-react-native |
| date-fns | date-fns (same) |
| bcryptjs | Backend only |

---

## MODULE 17: APP.JSON / EXPO CONFIG

```json
{
  "expo": {
    "name": "GymStack",
    "slug": "gymstack",
    "scheme": "gymstack",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "backgroundColor": "#0d1117" },
    "plugins": [
      "expo-secure-store",
      "expo-image-picker",
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#f97316"
      }]
    ],
    "android": {
      "package": "com.gymstack.app",
      "googleServicesFile": "./google-services.json",
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{ "scheme": "gymstack" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    },
    "ios": {
      "bundleIdentifier": "com.gymstack.app",
      "infoPlist": {
        "NSCameraUsageDescription": "For uploading gym photos",
        "NSPhotoLibraryUsageDescription": "For uploading gym photos"
      }
    },
    "extra": {
      "apiUrl": process.env.EXPO_PUBLIC_API_URL
    }
  }
}
```

---

## IMPLEMENTATION ORDER

Build in this exact order to avoid blocking dependencies:

1. `src/theme/` — colors, typography, spacing
2. `src/types/` — all TypeScript interfaces
3. `src/auth/storage.ts` — SecureStore helpers
4. `src/api/client.ts` — Axios instance
5. `src/stores/authStore.ts` — Zustand auth store
6. `src/api/auth.ts` + `src/api/profile.ts` — auth API functions
7. `src/contexts/AuthContext.tsx` + `src/contexts/ProfileContext.tsx`
8. `src/navigation/` — all navigators
9. Auth screens (Login → Signup → SelectRole → CompleteProfile)
10. `src/components/ui/` — all base UI components
11. `src/components/forms/` — form components
12. `src/lib/schemas/` — Zod schemas
13. Owner screens (Dashboard → Members → AddMember → MemberDetail → Payments → Attendance)
14. Owner screens continued (Expenses → Supplements → Lockers → Workouts → Diets → Reports → Notifications)
15. Member screens (Dashboard → Gyms → Workouts → Diets → BodyMetrics → Attendance → Payments → Notifications)
16. Trainer screens (Dashboard → Gyms → Plans)
17. Billing: ChoosePlanScreen + Razorpay integration
18. Push notifications setup
19. Deep link handling
20. Wallet & Referral screen

---

## CRITICAL IMPLEMENTATION NOTES

1. **Mobile number normalization**: Always strip non-digits and take the last 10 digits before sending to API. The backend validates with regex `/^(\+91)?[6-9]\d{9}$/`.

2. **Plan wall**: After every API response, check for 403 with code `PLAN_NOT_SELECTED` or `PLAN_EXPIRED`. Immediately navigate to ChoosePlanScreen if received.

3. **Token storage**: Use `expo-secure-store` for tokens (not AsyncStorage — it is not encrypted). Use AsyncStorage only for non-sensitive data (selectedGymId, theme preference).

4. **Image upload**: Use Cloudinary unsigned upload preset. After `expo-image-picker` returns the URI, upload to `https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload` with `upload_preset` in FormData. Store the returned secure_url.

5. **OTP input**: Build a 6-box OTP component where each `TextInput` is 1 character wide, auto-focuses next box on input, goes back on backspace, and handles paste by splitting across boxes.

6. **Razorpay**: Use the `react-native-razorpay` package. The `key` for checkout comes from `POST /api/billing/create-order`, not from env vars.

7. **Date handling**: All dates from API are ISO 8601 strings. Use `date-fns` for all formatting: `format(parseISO(date), "dd MMM yyyy")`.

8. **Gym ID propagation**: Every owner API call requires `gymId`. Always read from `gymStore.selectedGymId`. If null (owner has no gym yet), redirect to create gym screen.

9. **Session persistence**: On app start, check SecureStore for tokens. If present, call `/api/profile/me` to validate session before showing the main app. Show a splash/loading screen during this check.

10. **Form validation feedback**: Show field-level error messages below each input. Use `red` color for errors. Only show errors after the field has been touched (RHF `formState.errors` + `touchedFields`).
