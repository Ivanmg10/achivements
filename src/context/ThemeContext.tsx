"use client";

import { Theme, THEME_STORAGE_KEY, isTheme } from "@/types/types";
import { useSession } from "next-auth/react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const { data: session, status } = useSession();
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [syncedTheme, setSyncedTheme] = useState<string | undefined>(undefined);

  // The account's theme is taken during render, not in an effect, so the page
  // is never repainted in the default for a frame before it arrives.
  const sessionTheme = session?.user?.theme;
  if (sessionTheme !== syncedTheme) {
    setSyncedTheme(sessionTheme);
    if (isTheme(sessionTheme)) setTheme(sessionTheme);
  }

  useEffect(() => {
    // While the session loads, the theme painted by the script in the root
    // layout (the last one this browser used) stays on screen.
    if (status === "loading") return;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage blocked: the next load starts dark, as before.
    }
  }, [theme, status]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
