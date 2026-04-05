// src/app/api/owner/expenses/[expenseId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

async function verifyOwnership(profileId: string, expenseId: string) {
  return prisma.gymExpense.findFirst({
    where: { id: expenseId, gym: { ownerId: profileId } },
  })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ expenseId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { expenseId } = await params
  const expense = await verifyOwnership(profileId, expenseId)
  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 })
  return NextResponse.json(expense)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ expenseId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { expenseId } = await params

  const existing = await verifyOwnership(profileId, expenseId)
  if (!existing) return NextResponse.json({ error: "Expense not found" }, { status: 404 })

  const body = await req.json()
  const { title, amount, category, description, expenseDate, receiptUrl } = body

  const updated = await prisma.gymExpense.update({
    where: { id: expenseId },
    data: {
      ...(title       ? { title: title.trim() }               : {}),
      ...(amount      ? { amount: parseFloat(amount) }         : {}),
      ...(category    ? { category }                           : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(expenseDate ? { expenseDate: new Date(expenseDate) } : {}),
      ...(receiptUrl  !== undefined ? { receiptUrl: receiptUrl || null } : {}),
    },
    include: {
      gym:     { select: { name: true } },
      addedBy: { select: { fullName: true } },
    },
  })

  revalidatePath("/owner/dashboard")
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ expenseId: string }> }) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { expenseId } = await params

  const existing = await verifyOwnership(profileId, expenseId)
  if (!existing) return NextResponse.json({ error: "Expense not found" }, { status: 404 })

  await prisma.gymExpense.delete({ where: { id: expenseId } })
  revalidatePath("/owner/dashboard")
  return NextResponse.json({ success: true })
}