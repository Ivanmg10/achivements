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
  raUser?: RetroAchievementsUserProfile | object;
}
