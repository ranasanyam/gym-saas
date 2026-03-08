// src/app/member/referral/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Gift, Copy, Check, Users, Wallet, TrendingUp,
  Clock, CheckCircle2, XCircle, Loader2, Share2,
  ArrowDownLeft, ArrowUpRight
} from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"

interface ReferralData {
  code: string | null
  stats: {
    totalReferred: number; converted: number; pending: number
    totalEarned: number; walletBalance: number; rewardPerReferral: number
  }
  referred: {
    id: string; status: string; rewardAmount: number | null; createdAt: string
    referred: { fullName: string; avatarUrl: string | null; createdAt: string }
  }[]
  transactions: {
    id: string; type: string; amount: number; balanceAfter: number
    description: string | null; createdAt: string
  }[]
}

const STATUS_CONFIG = {
  CONVERTED: { label: "Rewarded",  color: "bg-green-500/15 text-green-400",  icon: CheckCircle2 },
  PENDING:   { label: "Pending",   color: "bg-yellow-500/15 text-yellow-400", icon: Clock },
  EXPIRED:   { label: "Expired",   color: "bg-white/8 text-white/35",         icon: XCircle },
}

const TX_CONFIG = {
  CREDIT_REFERRAL:    { label: "Referral Reward",   color: "text-green-400", icon: ArrowDownLeft },
  CREDIT_BONUS:       { label: "Bonus Credit",       color: "text-green-400", icon: ArrowDownLeft },
  DEBIT_SUBSCRIPTION: { label: "Subscription Used",  color: "text-red-400",   icon: ArrowUpRight  },
  DEBIT_ADJUSTMENT:   { label: "Adjustment",         color: "text-red-400",   icon: ArrowUpRight  },
}

export default function MemberReferralPage() {
  const { toast } = useToast()
  const [data, setData]     = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState(false)
  const [tab, setTab]         = useState<"referrals" | "wallet">("referrals")

  useEffect(() => {
    fetch("/api/referral")
      .then(r => r.json())
      .then(d => setData(d))
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
        title: "Join FitHub!",
        text: `Use my referral code ${data?.code} to join FitHub and start your fitness journey!`,
        url: referralLink,
      })
    } else copyLink()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )

  if (!data) return null

  const { stats } = data

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">Refer & Earn</h2>
        <p className="text-white/40 text-sm mt-0.5">
          Invite friends to FitHub and earn ₹{stats.rewardPerReferral} for every successful referral
        </p>
      </div>

      {/* Referral code card */}
      <div className="bg-linear-to-br from-primary/20 to-amber-500/5 border border-primary/25 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-white font-semibold">Your Referral Code</p>
            <p className="text-white/40 text-xs">Share this with friends to earn rewards</p>
          </div>
        </div>

        {/* Code display */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-black/30 rounded-xl px-5 py-3 border border-white/10">
            <span className="text-2xl font-mono font-bold text-primary tracking-widest">
              {data.code ?? "—"}
            </span>
          </div>
          <button onClick={copyCode}
            className="p-3 rounded-xl bg-primary/15 border border-primary/25 text-primary hover:bg-primary/25 transition-all">
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white/70 hover:text-white hover:bg-white/12 text-sm transition-all">
            <Copy className="w-4 h-4" /> Copy Link
          </button>
          <button onClick={share}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white font-semibold text-sm transition-all">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        <p className="text-white/30 text-xs text-center">
          When someone signs up using your code and joins a gym, you earn ₹{stats.rewardPerReferral}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Referred", value: stats.totalReferred, icon: Users, color: "text-blue-400" },
          { label: "Converted",      value: stats.converted,     icon: CheckCircle2, color: "text-green-400" },
          { label: "Pending",        value: stats.pending,       icon: Clock, color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-4 text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
            <p className="text-white font-bold text-xl">{s.value}</p>
            <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Wallet balance */}
      <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-white/50 text-sm">Wallet Balance</p>
            <p className="text-white font-bold text-2xl font-display">
              ₹{Number(stats.walletBalance).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/35 text-xs">Total Earned</p>
          <p className="text-green-400 font-semibold text-lg">
            ₹{Number(stats.totalEarned).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[hsl(220_25%_7%)] border border-white/5 rounded-xl p-1">
        {(["referrals", "wallet"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? "bg-[hsl(220_25%_12%)] text-white" : "text-white/40 hover:text-white/70"
            }`}>{t === "wallet" ? "Wallet History" : "My Referrals"}</button>
        ))}
      </div>

      {/* Referrals list */}
      {tab === "referrals" && (
        <div className="bg-[hsl(220_25%_9%)] border border-white/6 rounded-2xl overflow-hidden">
          {data.referred.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <Users className="w-10 h-10 text-white/10" />
              <p className="text-white/30 text-sm">No referrals yet — share your code!</p>
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
                        Joined {new Date(r.referred.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${cfg.color}`}>
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

      {/* Wallet history */}
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
                const cfg = TX_CONFIG[tx.type as keyof typeof TX_CONFIG]
                const isCredit = tx.type.startsWith("CREDIT")
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isCredit ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      {cfg ? <cfg.icon className={`w-4 h-4 ${cfg.color}`} /> : <Wallet className="w-4 h-4 text-white/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{cfg?.label ?? tx.type}</p>
                      {tx.description && <p className="text-white/35 text-xs mt-0.5 truncate">{tx.description}</p>}
                      <p className="text-white/25 text-xs mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {" · "}Balance: ₹{Number(tx.balanceAfter).toLocaleString("en-IN")}
                      </p>
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
    </div>
  )
}