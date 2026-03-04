"use client";

import { useTheme } from "@/context/ThemeContext";
import RegisterUserForm from "../register-user-form/RegisterUserForm";

export default function MainStart() {
  const { theme } = useTheme();

  return (
    <main className={`min-h-screen main-body-${theme}`}>
      <section className={`text-center main-header-${theme}`}>
        <RegisterUserForm />
      </section>
    </main>
  );
}
