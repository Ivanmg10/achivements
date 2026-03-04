"use client";

import { useTheme } from "@/context/ThemeContext";

export default function MainFooter() {
  const { theme } = useTheme();

  return (
    <footer className={`flex justify-around main-header-${theme}`}>
      <section className="px-2 py-4">
        <p className="text-2xl">© 2025 Achivements</p>
      </section>
    </footer>
  );
}
