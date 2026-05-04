import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import { RetroAchievementsUserProfile } from "./types";

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
      raUser?: RetroAchievementsUserProfile | null;
      location?: string | null;
      favorite_game?: { id: number; title: string; imageIcon: string } | null;
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
    raUser?: RetroAchievementsUserProfile | null;
    location?: string | null;
    favorite_game?: { id: number; title: string; imageIcon: string } | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    theme?: string;
    avatar?: string;
    raid?: string;
    rausername?: string;
    steamid?: string;
    steamusername?: string;
    admin?: boolean;
    email?: string;
    raUser?: RetroAchievementsUserProfile | null;
    location?: string | null;
    favorite_game?: { id: number; title: string; imageIcon: string } | null;
  }
}
