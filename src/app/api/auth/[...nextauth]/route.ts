import NextAuth from "next-auth";
import { authHandlerOptions } from "@/lib/authOptions";

const handler = NextAuth(authHandlerOptions);
export { handler as GET, handler as POST };
