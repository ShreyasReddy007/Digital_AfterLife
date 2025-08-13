import { DefaultSession } from "next-auth";
declare module "next-auth" {
  /**
   * The shape of the user object returned in the session.
   * By default, it only has name, email, and image.
   * We are adding an 'id' property.
   */
  interface Session {
    user?: {
      id: string; // Add your custom property here
    } & DefaultSession["user"];
  }
}
