import { DefaultSession, DefaultJWT } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      businessName?: string;
      brandColor?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    businessName?: string;
    brandColor?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    businessName?: string;
    brandColor?: string;
  }
}
