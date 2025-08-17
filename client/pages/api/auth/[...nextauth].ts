// File: pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";

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
    async jwt({ token, user }) {
      // This callback runs on sign-in and adds the user ID to the token.
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // This callback runs on every session check.
      // **FIXED**: The user ID is in `token.sub` (subject), not `token.id`.
      if (token.sub && session.user) {
        session.user.id = token.sub;

        try {
          const userId = session.user.id;
          
          // This query should now work correctly with the valid user ID.
          await pool.query(
            'UPDATE users SET "lastSeen" = NOW() WHERE id = $1',
            [userId]
          );

        } catch (error) {
          console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
          console.error("!!!    FAILED TO UPDATE lastSeen     !!!");
          console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
          console.error("User ID causing error:", session.user.id);
          console.error("Detailed Error:", error);
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
