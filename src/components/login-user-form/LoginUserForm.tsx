"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginUserForm() {
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

    console.log(result);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-4xl font-bold p-5">Logeo</h1>
      <input
        value={username}
        className="border-2 rounded-3xl p-2 m-2"
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        className="border-2 rounded-3xl p-2 m-2"
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button
        type="submit"
        className="bg-white text-black px-4 py-2 rounded-3xl m-5"
      >
        Login
      </button>
    </form>
  );
}
