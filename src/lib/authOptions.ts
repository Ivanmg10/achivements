import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import type { NextAuthOptions, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { clientAddress, isLimited, recordAttempt } from "@/lib/attemptLimit";
import { loadUserByUsername, loadUserSynced, passwordVersion, type UserRecord } from "@/lib/userRecord";

export const SESSION_REVOKED = "session-revoked";
export const TOO_MANY_ATTEMPTS = "too-many-attempts";

// Compared against when the username does not exist, so a wrong username
// takes as long to reject as a wrong password.
const DUMMY_HASH = "$2b$12$OHdczSP7rxt/DGdKG9CL8uLHmqCqG/wZ.VGxo3Y0h1k59R.06f3EW";

/** What the token carries, always rebuilt from the users row, never from the browser. */
function tokenFields(row: UserRecord) {
  return {
    id: String(row.id),
    name: row.username,
    theme: row.theme,
    avatar: row.avatar ?? undefined,
    rausername: row.rausername ?? undefined,
    // Server-side only: authHandlerOptions strips it from what the browser gets.
    raid: row.raid ?? undefined,
    raLinked: Boolean(row.rausername && row.raid),
    steamid: row.steamid ?? undefined,
    steamusername: row.steamusername ?? undefined,
    email: row.email ?? undefined,
    emailVerified: Boolean(row.email_verified_at),
    admin: row.admin === true,
    raUser: row.raUser ?? null,
    location: row.location ?? null,
    favorite_game: row.favorite_game ?? null,
    favorite_steam_game: row.favorite_steam_game ?? null,
    pwv: passwordVersion(row.password),
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const username = credentials?.username;
        const password = credentials?.password;
        if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
          return null;
        }

        const ip = clientAddress(req?.headers ?? {});
        const accountKey = `${ip}:${username.toLowerCase()}`;
        if ((await isLimited("login", accountKey)) || (await isLimited("login-ip", ip))) {
          throw new Error(TOO_MANY_ATTEMPTS);
        }

        const user = await loadUserByUsername(username);
        const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
        if (!user || !valid) {
          await recordAttempt("login", accountKey);
          await recordAttempt("login-ip", ip);
          return null;
        }

        return { ...tokenFields(user), syncedAt: Date.now() };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * Signing in copies the users row into the token. After that, every read
     * of the session re-reads the row: an update() from the browser only asks
     * for that re-read, and whatever data it sends is ignored — otherwise
     * anyone could put any Steam or RA account, or anything else, in their
     * own session. A row that is gone, or a password that changed since the
     * token was issued, ends the session.
     */
    async jwt({ token, user, trigger }) {
      if (user) return { ...token, ...(user as unknown as Partial<JWT>) };

      let row: UserRecord | null;
      let syncedAt: number;
      try {
        ({ row, at: syncedAt } = await loadUserSynced(token.id, {
          fresh: trigger === "update",
          // Never older than what the token already holds (see userRecord).
          notBefore: token.syncedAt ?? 0,
        }));
      } catch (err) {
        // A database blip should not sign everyone out; the token stands as it was.
        console.error("[auth] could not refresh the session", err);
        return token;
      }

      if (!row || !token.pwv || passwordVersion(row.password) !== token.pwv) {
        throw new Error(SESSION_REVOKED);
      }
      return { ...token, ...tokenFields(row), syncedAt };
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.theme = token.theme;
        session.user.name = token.name;
        session.user.avatar = token.avatar;
        session.user.rausername = token.rausername;
        session.user.raid = token.raid;
        session.user.raLinked = token.raLinked === true;
        session.user.steamid = token.steamid;
        session.user.steamusername = token.steamusername;
        session.user.email = token.email ?? undefined;
        session.user.emailVerified = token.emailVerified === true;
        session.user.admin = token.admin;
        session.user.raUser = token.raUser;
        session.user.location = token.location;
        session.user.favorite_game = token.favorite_game;
        session.user.favorite_steam_game = token.favorite_steam_game;
      }
      return session;
    },
  },
  logger: {
    error(code, metadata) {
      // A revoked session is the expected way out, not a server fault.
      const message = (metadata as { message?: string } | undefined)?.message;
      if (code === "JWT_SESSION_ERROR" && message === SESSION_REVOKED) return;
      console.error(`[next-auth][error][${code}]`, metadata);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/authPage",
  },
};

/**
 * The options the NextAuth route handler serves the browser with. Same as
 * authOptions except that the session it hands out has no RA API key: the key
 * signs calls made on the server (getServerSession(authOptions) still sees it)
 * and has no business in the browser, where any script on the page could read it.
 */
export const authHandlerOptions: NextAuthOptions = {
  ...authOptions,
  callbacks: {
    ...authOptions.callbacks,
    async session(params) {
      const session = (await authOptions.callbacks!.session!(params)) as Session;
      if (session.user) delete session.user.raid;
      return session;
    },
  },
};
