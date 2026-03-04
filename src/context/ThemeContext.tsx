"use client";

import { Theme } from "@/types/types";
import { createContext, useContext, useState, ReactNode } from "react";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: (color?: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("red");

  const toggleTheme = (color?: Theme) => {
    setTheme((prev) => (color ? color : prev === "red" ? "blue" : "red"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
