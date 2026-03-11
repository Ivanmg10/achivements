declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      theme?: string;
      avatar?: string;
      raid?: string;
      rausername?: string;
      steamid?: string;
      steamusername?: string;
      email?: string;
      admin?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    theme?: string;
    avatar?: string;
    raid?: string;
    rausername?: string;
    steamid?: string;
    steamusername?: string;
    email?: string;
    admin?: boolean;
  }

  interface JWT {
    id: string;
    theme?: string;
    avatar?: string;
    raid?: string;
    rausername?: string;
    steamid?: string;
    steamusername?: string;
    email?: string;
    admin?: boolean;
  }
}
