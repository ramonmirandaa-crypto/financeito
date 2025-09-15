import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { NextAuthOptions, getServerSession } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    session: ({ session, user }) => {
      if (session.user) {
        ;(session.user as any).id = user.id
      }
      return session
    },
  },
}

export function getAuthSession() {
  return getServerSession(authOptions)
}
