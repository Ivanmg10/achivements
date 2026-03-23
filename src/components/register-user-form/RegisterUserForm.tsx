"use client";

import { useState } from "react";

export default function RegisterUserForm({
  setIsLogin,
  setIsRegister,
}: {
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRegister: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data) {
      setIsLogin(true);
      setIsRegister(true);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="text-center flex flex-col items-center justify-center bg-bg-card text-text-main rounded-3xl p-5 h-1/3"
    >
      <h1 className="text-4xl font-bold p-5 mb-10">Registro</h1>
      <input
        type="text"
        className="border-2 rounded-3xl p-2 m-2 w-100"
        placeholder="Nombre de usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        className="border-2 rounded-3xl p-2 m-2 w-100"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={() => setIsLogin(true)} className="w-100 text-left p-2">
        <p className="hover:text-white w-full">Ya tienes una cuenta?</p>
      </button>
      <button
        className="bg-white text-black px-4 py-2 rounded-3xl m-2 w-100"
        type="submit"
      >
        Registrar
      </button>
    </form>
  );
}
