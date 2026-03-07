"use client";

import LoginUserForm from "@/components/login-user-form/LoginUserForm";
import RegisterUserForm from "@/components/register-user-form/RegisterUserForm";
import { IconArrowLeft } from "@tabler/icons-react";
import { useState } from "react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [hasRegister, setHasRegister] = useState(false);

  return (
    <div className="main-body-red">
      <header className="flex justify-center items-center absolute p-5">
        <IconArrowLeft stroke={2} size={32} />
      </header>
      <main className="flex justify-center items-center  h-svh">
        {isLogin ? (
          <LoginUserForm setIsLogin={setIsLogin} isRegister={hasRegister} />
        ) : (
          <RegisterUserForm
            setIsLogin={setIsLogin}
            setIsRegister={setHasRegister}
          />
        )}
      </main>
    </div>
  );
}
