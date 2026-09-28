import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import { RetroAchievementsUserProfile } from "./types";

type SavedGame = { id: number; title: string; imageIcon: string } | null;

/** What a session knows about its user. */
type SessionUserFields = {
  id: string;
  theme?: string;
  avatar?: string;
  rausername?: string;
  /**
   * The user's RA Web API key. Server-side only: getServerSession(authOptions)
   * has it, the session the browser receives (authHandlerOptions) does not.
   */
  raid?: string;
  /** An RA username AND its API key are stored, so RA calls can be made. */
  raLinked?: boolean;
  steamid?: string;
  steamusername?: string;
  email?: string;
  /** The address has been confirmed. False blocks nothing — it only shows a banner. */
  emailVerified?: boolean;
  admin?: boolean;
  raUser?: RetroAchievementsUserProfile | null;
  location?: string | null;
  favorite_game?: SavedGame;
  favorite_steam_game?: SavedGame;
};

declare module "next-auth" {
  interface Session {
    user: SessionUserFields & DefaultSession["user"];
  }

  interface User extends SessionUserFields {
    /** Fingerprint of the password hash the session was issued with; see passwordVersion(). */
    pwv?: string;
    syncedAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT, SessionUserFields {
    pwv?: string;
    /** When the token's fields were last read from the users row (ms). */
    syncedAt?: number;
  }
}
