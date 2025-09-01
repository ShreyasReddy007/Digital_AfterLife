// pages/api/auth/[...nextauth].ts
import NextAuth, { DefaultSession, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      hasCompletedOnboarding?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    hasCompletedOnboarding?: boolean;
  }
}


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const authOptions: NextAuthOptions = {
  adapter: PostgresAdapter(pool),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        
        try {
          const { rows } = await pool.query(
            'SELECT "hasCompletedOnboarding" FROM users WHERE id = $1',
            [token.sub]
          );
          if (rows[0]) {
            session.user.hasCompletedOnboarding = rows[0].hasCompletedOnboarding;
          }
        } catch (error) {
          console.error("Failed to fetch onboarding status:", error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export default NextAuth(authOptions);

