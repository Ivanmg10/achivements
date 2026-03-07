import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

const handler = NextAuth({
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

        // Esto es lo que NextAuth ve como "user"
        return {
          id: user.id.toString(),
          name: user.username,
          theme: user.theme,
          avatar: user.avatar,
          raid: user.raid,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // 1️⃣ Guardar datos adicionales en el JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.theme = user.theme;
        token.name = user.name;
        token.avatar = user.avatar;
        token.raid = user.raid;
      }
      return token;
    },
    // 2️⃣ Pasar esos datos a session.user
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.theme = token.theme;
        session.user.name = token.name;
        session.user.avatar = token.avatar;
        session.user.raid = token.raid;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
