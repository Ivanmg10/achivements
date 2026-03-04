"use client";

import { useTheme } from "@/context/ThemeContext";
import RegisterUserForm from "../register-user-form/RegisterUserForm";
import LoginUserForm from "../login-user-form/LoginUserForm";

export default function MainStart() {
  const { theme } = useTheme();

  return (
    <main className={`min-h-screen main-body-${theme}`}>
      <section className={`text-center main-header-${theme}`}>
        <RegisterUserForm />
        <hr className="w-3/4 m-auto mt-5 mb-5" />
        <LoginUserForm />
      </section>
    </main>
  );
}
