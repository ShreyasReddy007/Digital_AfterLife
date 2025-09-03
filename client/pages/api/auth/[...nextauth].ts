import NextAuth, { DefaultSession, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";

//  Interfaces
declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      hasCompletedOnboarding?: boolean;
      hasSecondaryPassword?: boolean;
      isVerified?: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    hasCompletedOnboarding?: boolean;
    hasSecondaryPassword?: boolean;
    isVerified?: boolean;
  }
}

// Pool Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// NextAuth Options
export const authOptions: NextAuthOptions = {
  adapter: PostgresAdapter(pool),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },

  //  Callbacks
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        try {
          const { rows } = await pool.query(
            'SELECT "hasCompletedOnboarding", "passwordHash" FROM users WHERE id = $1',
            [token.sub]
          );
          if (rows[0]) {
            token.hasCompletedOnboarding = rows[0].hasCompletedOnboarding;
            token.hasSecondaryPassword = Boolean(rows[0].passwordHash);
          }
        } catch (error) {
          // silent failure case
        }
        token.isVerified = false;
      }

      if (trigger === "update" && session?.user?.isVerified) {
        token.isVerified = true;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.hasCompletedOnboarding = token.hasCompletedOnboarding as boolean;
        session.user.hasSecondaryPassword = token.hasSecondaryPassword as boolean;
        session.user.isVerified = token.isVerified as boolean;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
};

export default NextAuth(authOptions);
