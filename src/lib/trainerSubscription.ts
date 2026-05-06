import { prisma } from "@/lib/prisma";

export async function getTrainerSubscriptionStatus(profileId: string) {
  const sub = await prisma.trainerSubscription.findFirst({
    where: {
      profileId,
      status: "ACTIVE",
      endDate: { gt: new Date() },
    },
    orderBy: { endDate: "desc" },
  });

  return {
    isActive: !!sub,
    subscription: sub ?? null,
  };
}
