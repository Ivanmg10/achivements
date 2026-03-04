"use client";

import { useState } from "react";

export default function RegisterUserForm() {
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
    console.log(data);
  }

  return (
    <main className="min-h-screen main-body-dark">
      <form
        onSubmit={handleSubmit}
        className="text-center main-header-dark flex flex-col items-center"
      >
        <h1 className="text-4xl font-bold p-5">Registro</h1>
        <input
          type="text"
          className="border-2 rounded-3xl p-2 m-2"
          placeholder="Nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="border-2 rounded-3xl p-2 m-2"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="bg-white text-black px-4 py-2 rounded-3xl m-5"
          type="submit"
        >
          Registrar
        </button>
      </form>
    </main>
  );
}
