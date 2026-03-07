import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      theme?: string;
      avatar?: string;
      raid?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    theme?: string;
    name: string;
    avatar?: string;
    raid?: string;
  }

  interface JWT {
    id: string;
    theme?: string;
  }
}
