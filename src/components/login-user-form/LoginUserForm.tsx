"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginUserForm({
  setIsLogin,
  isRegister,
}: {
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
  isRegister: boolean;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await signIn("credentials", {
      username,
      password,
      redirect: true,
      callbackUrl: "/",
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="text-center flex flex-col items-center justify-center bg-bg-header text-text-main rounded-3xl p-5 h-1/3"
    >
      <h1 className="text-4xl font-bold p-5 mb-10">Inicia sesión</h1>
      {isRegister && (
        <div className="m-5 -mt-5 bg-green-400 border-3 border-green-300 rounded-xl p-2 w-100">
          <p className="text-1xl font-bold text-white">
            Has creado una cuenta correctamente
          </p>
        </div>
      )}
      <input
        value={username}
        className="border-2 rounded-3xl p-2 m-2 w-100"
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        className="border-2 rounded-3xl p-2 m-2 w-100"
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button onClick={() => setIsLogin(false)} className="w-100 text-left p-2">
        <p className="hover:text-white w-full">No tienes cuenta?</p>
      </button>
      <button
        type="submit"
        className="bg-white text-black px-4 py-2 rounded-3xl m-2 w-100"
      >
        Iniciar
      </button>
    </form>
  );
}
