import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const result = await pool.query(
          "SELECT * FROM users WHERE username = $1",
          [credentials.username],
        );

        const user = result.rows[0];
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id.toString(),
          name: user.username,
          theme: user.theme,
          avatar: user.avatar,
          raid: user.raid,
          rausername: user.rausername,
          steamid: user.steamid,
          steamusername: user.steamusername,
          email: user.email,
          admin: user.admin,
          raUser: user.raUser ?? null,
          location: user.location ?? null,
          favorite_game: user.favorite_game ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.theme = user.theme;
        token.name = user.name;
        token.avatar = user.avatar;
        token.raid = user.raid;
        token.rausername = user.rausername;
        token.steamid = user.steamid;
        token.steamusername = user.steamusername;
        token.email = user.email;
        token.admin = user.admin;
        token.raUser = user.raUser ?? null;
        token.location = user.location ?? null;
        token.favorite_game = user.favorite_game ?? null;
      }

      if (trigger === "update" && session !== undefined) {
        if ("raUser" in session) {
          const raUserObj = session.raUser as Record<string, unknown> | null | undefined
          const sessionAny = session as Record<string, unknown>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          token.raUser = (raUserObj ?? null) as any
          token.rausername = (raUserObj?.User as string) ?? null
          // Use the explicit API key passed from RaLoginModal, not ULID (they differ in RA)
          if (sessionAny.raidKey) token.raid = sessionAny.raidKey as string
          else if (!raUserObj) token.raid = undefined
        }
        if (session?.theme) token.theme = session.theme;
        if (session?.name) token.name = session.name;
        if ("email" in session && session.email) token.email = session.email;
        if ("avatar" in session && session.avatar) token.avatar = session.avatar;
        if ("location" in session) token.location = session.location ?? null;
        if ("favorite_game" in session) token.favorite_game = session.favorite_game ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.theme = token.theme;
        session.user.name = token.name;
        session.user.avatar = token.avatar;
        session.user.raid = token.raid;
        session.user.rausername = token.rausername;
        session.user.steamid = token.steamid;
        session.user.steamusername = token.steamusername;
        session.user.email = token.email;
        session.user.admin = token.admin;
        session.user.raUser = token.raUser;
        session.user.location = token.location;
        session.user.favorite_game = token.favorite_game;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/authPage",
  },
};
