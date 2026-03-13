// src/app/owner/referral/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/owner/PageHeader"
import {
  Gift, Copy, Check, Users, Wallet, TrendingUp,
  Clock, CheckCircle2, XCircle, Loader2, Share2,
  ArrowDownLeft, ArrowUpRight, Zap, Star, Building2,
  AlertCircle, Info,
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

interface OwnerReferralData {
  code: string | null
  stats: {
    totalReferred: number; converted: number; pending: number
    totalEarned: number; walletBalance: number; rewardPerReferral: number
  }
  referred: {
    id: string; status: string; rewardAmount: number | null
    createdAt: string; expiresAt: string | null
    referred: {
      fullName: string; avatarUrl: string | null; createdAt: string
      role: string; ownedGyms?: { name: string }[]
    }
  }[]
  transactions: {
    id: string; type: string; amount: number; balanceAfter: number
    description: string | null; createdAt: string; expiresAt: string | null
  }[]
  alreadyUsingNotices: {
    profileId: string; fullName: string; avatarUrl: string | null
    gymName: string; notifiedAt: string
  }[]
}

const STATUS_CONFIG = {
  CONVERTED: { label: "Rewarded",  color: "bg-green-500/15 text-green-400",   icon: CheckCircle2 },
  PENDING:   { label: "Pending",   color: "bg-yellow-500/15 text-yellow-400", icon: Clock },
  EXPIRED:   { label: "Expired",   color: "bg-white/8 text-white/35",         icon: XCircle },
}

const TX_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  CREDIT_REFERRAL:    { label: "Referral Reward",      color: "text-green-400", icon: ArrowDownLeft },
  CREDIT_BONUS:       { label: "Bonus Credit",          color: "text-green-400", icon: ArrowDownLeft },
  DEBIT_SUBSCRIPTION: { label: "Platform Fee Discount", color: "text-red-400",   icon: ArrowUpRight },
  DEBIT_MEMBERSHIP:   { label: "Membership Discount",   color: "text-red-400",   icon: ArrowUpRight },
  DEBIT_ADJUSTMENT:   { label: "Adjustment",            color: "text-red-400",   icon: ArrowUpRight },
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000))
}

export default function OwnerReferralPage() {
  const { toast } = useToast()
  const [data,    setData]    = useState<OwnerReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState(false)
  const [tab,     setTab]     = useState<"referrals" | "wallet" | "how">("referrals")

  useEffect(() => {
    fetch("/api/owner/referral")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const referralLink = data?.code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${data.code}`
    : ""

  const copyCode = async () => {
    if (!data?.code) return
    await navigator.clipboard.writeText(data.code)
    setCopied(true)
    toast({ variant: "success", title: "Code copied!" })
    setTimeout(() => setCopied(false), 2000)
  }

  const copyLink = async () => {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    toast({ variant: "success", title: "Referral link copied!" })
  }

  const share = async () => {
    if (!referralLink) return
    if (navigator.share) {
      await navigator.share({
        title: "Join GymStack!",
        text: `I use GymStack to manage my gym. Use my code ${data?.code} to get started!`,
        url: referralLink,
      })
    } else {
      copyLink()
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )

  if (!data) return null

  const { stats } = data

  const expiringCredits = data.transactions
    .filter(t => t.type.startsWith("CREDIT") && t.expiresAt)
    .map(t => ({ ...t, daysLeft: daysUntil(t.expiresAt) }))
    .filter(t => (t.daysLeft ?? 999) < 30)
    .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999))

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Refer & Earn"
        subtitle={`Invite other gym owners to GymStack — earn ₹${stats.rewardPerReferral} per successful referral`}
      />

      {/* Already-using notices */}
      {(data.alreadyUsingNotices?.length ?? 0) > 0 && (
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-blue-300 font-semibold text-sm">Someone you referred is already on GymStack!</p>
          </div>
          <div className="space-y-2">
            {data.alreadyUsingNotices.map(n => (
              <div key={n.profileId} className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <Avatar name={n.fullName} url={n.avatarUrl} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{n.fullName}</p>
                  <p className="text-blue-400/70 text-xs">
                    Already managing <span className="text-blue-300">{n.gymName}</span> on GymStack
                  </p>
                </div>
                <span className="text-[10px] text-blue-400/60 shrink-0">
                  {new Date(n.notifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
          <p className="text-blue-400/50 text-xs">
            If they signed up using your code, you will earn your reward once they subscribe to a paid plan.
          </p>
        </div>
      )}

      {/* Expiry warning */}
      {expiringCredits.length > 0 && (
        <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl px-4 py-3.5 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 text-sm font-medium">Credits expiring soon!</p>
            <p className="text-yellow-400/60 text-xs mt-0.5">
              Rs.{Number(expiringCredits[0].amount).toLocaleString("en-IN")} expires in {expiringCredits[0].daysLeft} days — use it on your next subscription renewal.
            </p>
          </div>
        </div>
      )}

      {/* Code card */}
      <div className="bg-linear-to-br from-primary/20 via-primary/5 to-transparent border border-primary/25 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-white font-semibold">Your Referral Code</p>
            <p className="text-white/40 text-xs">Share with other gym owners — earn ₹{stats.rewardPerReferral} per signup</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-black/30 rounded-xl px-5 py-3 border border-white/10">
            <span className="text-2xl font-mono font-bold text-primary tracking-widest">{data.code ?? "—"}</span>
          </div>
          <button onClick={copyCode}
            className="p-3 rounded-xl bg-primary/15 border border-primary/25 text-primary hover:bg-primary/25 transition-all">
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white/70 hover:text-white text-sm transition-all">
            <Copy className="w-4 h-4" /> Copy Link
          </button>
          <button onClick={share}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-linear-to-r from-primary to-orange-400 hover:opacity-90 text-white font-semibold text-sm transition-all">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
        <p className="text-white/30 text-xs text-center">
          Referral reward is credited when the referred owner subscribes to a paid GymStack plan
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Referred",  value: stats.totalReferred, icon: Users,        color: "text-blue-400" },
          { label: "Converted", value: stats.converted,     icon: CheckCircle2, color: "text-green-400" },
          { label: "Pending",   value: stats.pending,       icon: Clock,        color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
            <p className="text-white font-bold text-xl">{s.value}</p>
            <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Wallet balance */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white/50 text-xs">Wallet Balance</p>
              <p className="text-white font-bold text-2xl font-display">
                ₹{Number(stats.walletBalance).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/35 text-xs">Total Earned</p>
            <p className="text-green-400 font-semibold text-lg">₹{Number(stats.totalEarned).toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/6 space-y-2">
          <p className="text-white/30 text-xs font-medium uppercase tracking-wider">How credits work</p>
          <div className="grid sm:grid-cols-3 gap-2">
            {[
              { icon: Zap,   text: "Offset up to 20% of any GymStack subscription fee", color: "text-primary" },
              { icon: Clock, text: "Credits expire in 90 days — use them before renewal", color: "text-yellow-400" },
              { icon: Gift,  text: "No limit — refer as many owners as you want",         color: "text-green-400" },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-white/3 rounded-xl">
                <r.icon className={`w-3.5 h-3.5 ${r.color} shrink-0 mt-0.5`} />
                <p className="text-white/50 text-[11px] leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[hsl(220_25%_7%)] border border-white/5 rounded-xl p-1">
        {(["referrals", "wallet", "how"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
              tab === t ? "bg-[hsl(220_25%_12%)] text-white" : "text-white/40 hover:text-white/70"
            }`}>
            {t === "wallet" ? "Wallet History" : t === "how" ? "How to Earn" : "My Referrals"}
          </button>
        ))}
      </div>

      {tab === "referrals" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          {data.referred.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <Building2 className="w-10 h-10 text-white/10" />
              <p className="text-white/30 text-sm">No referrals yet — share your code with other gym owners!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {data.referred.map(r => {
                const cfg = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING
                return (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                    <Avatar name={r.referred.fullName} url={r.referred.avatarUrl} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{r.referred.fullName}</p>
                      <p className="text-white/35 text-xs">
                        {r.referred.ownedGyms?.[0]?.name ? `Owns: ${r.referred.ownedGyms[0].name} · ` : ""}
                        Joined {new Date(r.referred.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 ${cfg.color}`}>
                        <cfg.icon className="w-3 h-3" /> {cfg.label}
                      </span>
                      {r.status === "CONVERTED" && r.rewardAmount && (
                        <p className="text-green-400 text-xs font-semibold mt-1">+₹{Number(r.rewardAmount).toLocaleString("en-IN")}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === "wallet" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          {data.transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <TrendingUp className="w-10 h-10 text-white/10" />
              <p className="text-white/30 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {data.transactions.map(tx => {
                const cfg      = TX_CONFIG[tx.type]
                const isCredit = tx.type.startsWith("CREDIT")
                const expDays  = daysUntil(tx.expiresAt)
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "bg-green-500/10" : "bg-red-500/10"}`}>
                      {cfg ? <cfg.icon className={`w-4 h-4 ${cfg.color}`} /> : <Wallet className="w-4 h-4 text-white/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{cfg?.label ?? tx.type}</p>
                      {tx.description && <p className="text-white/35 text-xs mt-0.5 truncate">{tx.description}</p>}
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-white/25 text-xs">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {" · "}Balance: ₹{Number(tx.balanceAfter).toLocaleString("en-IN")}
                        </p>
                        {isCredit && expDays !== null && expDays < 30 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${expDays <= 7 ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                            {expDays === 0 ? "Expires today" : `Expires in ${expDays}d`}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`font-semibold text-sm ${isCredit ? "text-green-400" : "text-red-400"}`}>
                      {isCredit ? "+" : "−"}₹{Number(tx.amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === "how" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 space-y-5">
          <h3 className="text-white font-semibold text-sm">How the owner referral program works</h3>
          {[
            { step: "1", title: "Share your code with other gym owners", desc: `Share your code "${data.code}" with gym owners who haven't tried GymStack yet. The more you share, the more you earn.` },
            { step: "2", title: "They sign up on GymStack",              desc: "The gym owner creates their GymStack account using your referral code. They appear as pending immediately." },
            { step: "3", title: "They subscribe to a paid plan",         desc: "Once they activate Basic, Standard, Pro or Elite subscription, your referral converts." },
            { step: "4", title: `You earn ₹${stats.rewardPerReferral}`,  desc: "Credits hit your wallet instantly. Apply up to 20% of your next subscription fee using wallet balance." },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 text-primary text-xs font-bold">{s.step}</div>
              <div>
                <p className="text-white text-sm font-medium">{s.title}</p>
                <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-start gap-2">
            <Star className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-white/50 text-xs leading-relaxed">
              <span className="text-white font-medium">Pro tip: </span>
              Show fellow gym owners your GymStack dashboard — seeing live attendance, revenue charts and expiry alerts is usually enough to convince them. There is no cap on how many owners you can refer!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}