import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { isRateLimited } from '@/lib/rateLimit';

const googleProvider = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
  : [];

export const authOptions: NextAuthConfig = {
  providers: [
    ...googleProvider,
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const limited = await isRateLimited({ key: `login:${email}`, limit: 10, windowSeconds: 900 });
        if (limited) return null;

        await connectDB();
        const user = await User.findOne({ email });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          businessName: user.businessName,
          brandColor: user.brandColor,
          plan: user.plan ?? 'free',
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await connectDB();
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            name: user.name ?? '',
            email: user.email ?? '',
            image: user.image ?? undefined,
            provider: 'google',
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.businessName = user.businessName;
        token.brandColor = user.brandColor;
        token.plan = user.plan ?? 'free';
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.businessName = token.businessName;
      session.user.brandColor = token.brandColor;
      session.user.plan = token.plan ?? 'free';
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  session: { strategy: 'jwt' },
};
