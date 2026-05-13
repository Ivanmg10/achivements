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
        <div className="mb-5 bg-danger/20 border border-danger/40 rounded-xl p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
        <label htmlFor="register-username" className="sr-only">{T.registerForm.username}</label>
        <input
          id="register-username"
          type="text"
          className="bg-bg-tertiary text-text-main rounded-xl p-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
          placeholder={T.registerForm.username}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <label htmlFor="register-password" className="sr-only">{T.registerForm.password}</label>
        <input
          id="register-password"
          type="password"
          className="bg-bg-tertiary text-text-main rounded-xl p-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
          placeholder={T.registerForm.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <label htmlFor="register-token" className="sr-only">{T.registerForm.invitationCode}</label>
        <input
          id="register-token"
          type="text"
          className="bg-bg-tertiary text-text-main rounded-xl p-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
          placeholder={T.registerForm.invitationCode}
          value={registerToken}
          onChange={(e) => setRegisterToken(e.target.value)}
          autoComplete="off"
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
