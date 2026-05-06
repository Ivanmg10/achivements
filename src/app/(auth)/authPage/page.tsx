"use client";

import LoginUserForm from "@/components/login-user-form/LoginUserForm";
import RegisterUserForm from "@/components/register-user-form/RegisterUserForm";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formTransition } from "@/lib/animations";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [hasRegister, setHasRegister] = useState(false);

  return (
    <div className="bg-bg-main text-text-main min-h-screen">
      <header className="absolute p-5">
        <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors">
          <IconArrowLeft stroke={2} size={24} />
        </Link>
      </header>
      <main className="flex justify-center items-center min-h-screen px-4">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              variants={formTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <LoginUserForm setIsLogin={setIsLogin} isRegister={hasRegister} />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              variants={formTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <RegisterUserForm
                setIsLogin={setIsLogin}
                setIsRegister={setHasRegister}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
