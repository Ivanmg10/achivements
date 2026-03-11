"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
    </SessionProvider>
  );
}
