import { clerkClient } from '@clerk/nextjs/server'

import { prisma } from '@/lib/db'

const PLACEHOLDER_PASSWORD_HASH = 'clerk-managed'

const toDate = (value: Date | string | number | null | undefined): Date => {
  if (!value) {
    return new Date()
  }

  if (value instanceof Date) {
    return value
  }

  return new Date(value)
}

export async function ensureUser(userId: string) {
  const clerkUser = await clerkClient.users.getUser(userId)

  const emailAddresses = clerkUser.emailAddresses || []
  const primaryEmail =
    emailAddresses.find((address) => address.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    emailAddresses[0]?.emailAddress

  if (!primaryEmail) {
    throw new Error(`Unable to resolve an email address for Clerk user ${userId}`)
  }

  const primaryEmailRecord = emailAddresses.find(
    (address) => address.id === clerkUser.primaryEmailAddressId,
  )

  const createdAt = toDate(clerkUser.createdAt)
  const emailVerified =
    primaryEmailRecord?.verification?.status === 'verified'
      ? toDate(clerkUser.updatedAt ?? createdAt)
      : null

  return prisma.user.upsert({
    where: { id: userId },
    update: {
      email: primaryEmail,
      name: clerkUser.fullName ?? null,
      image: clerkUser.imageUrl ?? null,
      emailVerified,
    },
    create: {
      id: userId,
      email: primaryEmail,
      name: clerkUser.fullName ?? null,
      image: clerkUser.imageUrl ?? null,
      passwordHash: PLACEHOLDER_PASSWORD_HASH,
      emailVerified,
      createdAt,
    },
  })
}
