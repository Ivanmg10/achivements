'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export default function RegisterUserForm({
  setIsLogin,
  setIsRegister,
}: {
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>
  setIsRegister: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [registerToken, setRegisterToken] = useState('')
  const [error, setError] = useState('')
  const { T } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, registerToken: registerToken || undefined }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || T.registerForm.errorCreating)
      return
    }

    setIsLogin(true)
    setIsRegister(true)
  }

  return (
    <div className="bg-bg-card rounded-2xl p-8 w-full max-w-sm">
      <h1 className="text-3xl font-bold text-text-accent mb-8">{T.registerForm.title}</h1>

      {error && (
        <div className="mb-5 bg-red-900/40 border border-red-700 rounded-xl p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
        <input
          type="text"
          className="bg-bg-tertiary text-text-main rounded-xl p-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
          placeholder={T.registerForm.username}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="bg-bg-tertiary text-text-main rounded-xl p-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
          placeholder={T.registerForm.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="text"
          className="bg-bg-tertiary text-text-main rounded-xl p-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
          placeholder={T.registerForm.invitationCode}
          value={registerToken}
          onChange={(e) => setRegisterToken(e.target.value)}
        />

        <button
          type="submit"
          className="bg-btn-primary text-btn-primary-text w-full py-3 rounded-xl font-medium hover:scale-[1.02] transition-transform duration-200 mt-1"
        >
          {T.registerForm.createAccount}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setIsLogin(true)}
        className="text-text-secondary hover:text-text-main text-sm transition-colors w-full text-center"
      >
        {T.registerForm.alreadyHaveAccount}
      </button>
    </div>
  )
}
