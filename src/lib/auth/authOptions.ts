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
        if (!credentials?.email || !credentials?.password) {
          console.error('[auth] Missing credentials');
          return null;
        }

        const email = credentials.email as string;
        const limited = await isRateLimited({ key: `login:${email}`, limit: 10, windowSeconds: 900 });
        if (limited) {
          console.error('[auth] Rate limited:', email);
          return null;
        }

        await connectDB();
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !user.password) {
          console.error('[auth] User not found or no password:', email);
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) {
          console.error('[auth] Invalid password for:', email);
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          businessName: user.businessName,
          brandColor: user.brandColor,
          plan: user.plan ?? 'free',
          hasMpToken: !!user.mpAccessToken,
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

    async jwt({ token, user, account, trigger }) {
      if (user) {
        if (account?.provider === 'google') {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email })
            .select('_id plan businessName brandColor mpAccessToken')
            .lean();
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.plan = (dbUser as { plan?: string }).plan ?? 'free';
            token.planExpiresAt = (dbUser as { planExpiresAt?: Date }).planExpiresAt?.toISOString();
            token.businessName = (dbUser as { businessName?: string }).businessName;
            token.brandColor = (dbUser as { brandColor?: string }).brandColor;
            token.hasMpToken = !!(dbUser as { mpAccessToken?: string }).mpAccessToken;
          }
        } else {
          token.id = user.id;
          token.businessName = user.businessName;
          token.brandColor = user.brandColor;
          token.plan = user.plan ?? 'free';
          token.planExpiresAt = user.planExpiresAt;
          token.hasMpToken = user.hasMpToken ?? false;
        }
      }
      if (trigger === 'update' && token.id) {
        await connectDB();
        const fresh = await User.findById(token.id).select('mpAccessToken plan businessName brandColor').lean();
        if (fresh) {
          token.hasMpToken = !!fresh.mpAccessToken;
          token.plan = fresh.plan ?? 'free';
          token.planExpiresAt = fresh.planExpiresAt?.toISOString();
          token.businessName = fresh.businessName;
          token.brandColor = fresh.brandColor;
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.businessName = token.businessName as string | undefined;
      session.user.brandColor = token.brandColor as string | undefined;
      session.user.hasMpToken = (token.hasMpToken as boolean | undefined) ?? false;

      // Verificar expiración del plan Pro
      const planExpiresAt = token.planExpiresAt as string | undefined;
      const planExpired = planExpiresAt && new Date(planExpiresAt) < new Date();
      session.user.plan = planExpired ? 'free' : (((token.plan as string | undefined) ?? 'free') as 'free' | 'pro');

      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  session: { strategy: 'jwt' },
};
