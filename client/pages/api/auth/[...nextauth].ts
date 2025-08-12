// File: pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";

// Create a new pool of connections to your PostgreSQL database.
// The adapter will use this to automatically create users, sessions, etc.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Define the authentication options.
export const authOptions: NextAuthOptions = {
  // The adapter is the key piece that connects NextAuth to your database.
  adapter: PostgresAdapter(pool),
  
  // Configure one or more authentication providers.
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // You can add more providers here, like Email, GitHub, etc.
  ],

  // The secret is used to sign and encrypt JWTs and cookies.
  secret: process.env.NEXTAUTH_SECRET,

  // Define the session strategy. 'jwt' is recommended.
  session: {
    strategy: "jwt",
  },

  // Callbacks are functions that are called at specific times during the auth process.
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        // The 'sub' property of the token is the user's ID in your database.
        session.user.id = token.sub;
      }
      return session;
    },
  },

  // You can define custom pages for sign-in, sign-out, and error handling.
  pages: {
    signIn: '/login', // Redirect users to your custom login page.
  },
};

// Export the NextAuth handler with the defined options.
export default NextAuth(authOptions);
