import { RetroAchievementsUserProfile } from "./types";

export interface User {
  id: number;
  username: string;
  password: string;
  raId?: string | null;
  theme: string;
  avatar?: string | null;
  raid?: string | null;
  rausername?: string | null;
  steamid?: string | null;
  steamusername?: string | null;
  email?: string | null;
  admin?: boolean;
  raUser?: RetroAchievementsUserProfile | null;
  location?: string | null;
  favorite_game?: { id: number; title: string; imageIcon: string } | null;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  theme: string;
  avatar: string | null;
  admin: boolean;
  rausername: string | null;
  ra_display: string | null;
  location: string | null;
  steamusername?: string | null;
}
