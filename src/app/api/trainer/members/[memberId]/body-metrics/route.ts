// src/app/api/trainer/members/[memberId]/body-metrics/route.ts
import { NextRequest, NextResponse } from "next/server"
import { resolveProfileId } from "@/lib/mobileAuth"
import { prisma } from "@/lib/prisma"

async function verifyTrainerMember(profileId: string, memberId: string) {
  const trainer = await prisma.gymTrainer.findUnique({
    where: { profileId },
    select: { id: true, gymId: true },
  })
  if (!trainer) return null

  const member = await prisma.gymMember.findFirst({
    where: { id: memberId, assignedTrainerId: trainer.id },
    select: { id: true },
  })
  return member ? trainer : null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { memberId } = await params
  const trainer = await verifyTrainerMember(profileId, memberId)
  if (!trainer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const metrics = await prisma.bodyMetric.findMany({
    where:   { memberId },
    orderBy: { recordedAt: "desc" },
  })

  return NextResponse.json(metrics)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const profileId = await resolveProfileId(req)
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { memberId } = await params
  const trainer = await verifyTrainerMember(profileId, memberId)
  if (!trainer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { recordedAt, weightKg, bodyFatPct, muscleMassKg, bmi, chestCm, waistCm, hipsCm, notes } = body

  if (!recordedAt) return NextResponse.json({ error: "recordedAt is required" }, { status: 400 })

  const metric = await prisma.bodyMetric.create({
    data: {
      memberId,
      recordedAt:   new Date(recordedAt),
      weightKg:     weightKg     != null ? parseFloat(weightKg)     : null,
      bodyFatPct:   bodyFatPct   != null ? parseFloat(bodyFatPct)   : null,
      muscleMassKg: muscleMassKg != null ? parseFloat(muscleMassKg) : null,
      bmi:          bmi          != null ? parseFloat(bmi)          : null,
      chestCm:      chestCm      != null ? parseFloat(chestCm)      : null,
      waistCm:      waistCm      != null ? parseFloat(waistCm)      : null,
      hipsCm:       hipsCm       != null ? parseFloat(hipsCm)       : null,
      notes:        notes        ?? null,
    },
  })

  return NextResponse.json(metric, { status: 201 })
}
