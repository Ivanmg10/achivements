'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { IconUser, IconLock, IconArrowRight } from '@tabler/icons-react'

export default function RegisterUserForm({
  setIsLogin,
  setIsRegister,
}: {
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>
  setIsRegister: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { T } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, registerToken: process.env.NEXT_PUBLIC_REGISTER_TOKEN }),
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
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">{T.registerForm.title}</h1>
        <div className="mt-2 h-0.5 w-10 bg-accent mx-auto rounded-full" />
      </div>

      {error && (
        <div role="alert" className="mb-5 bg-danger/20 border border-danger/40 rounded-xl p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <IconUser size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <label htmlFor="register-username" className="sr-only">{T.registerForm.username}</label>
          <input
            id="register-username"
            type="text"
            className="bg-bg-tertiary text-text-main rounded-xl pl-9 pr-3 py-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
            placeholder={T.registerForm.username}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="relative">
          <IconLock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <label htmlFor="register-password" className="sr-only">{T.registerForm.password}</label>
          <input
            id="register-password"
            type="password"
            className="bg-bg-tertiary text-text-main rounded-xl pl-9 pr-3 py-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
            placeholder={T.registerForm.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="bg-btn-primary text-btn-primary-text w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform duration-200 mt-1"
        >
          {T.registerForm.createAccount}
          <IconArrowRight size={16} aria-hidden="true" />
        </button>
      </form>

      <button
        type="button"
        onClick={() => setIsLogin(true)}
        className="text-text-secondary hover:text-text-main text-sm transition-colors w-full text-center mt-5"
      >
        {T.registerForm.alreadyHaveAccount}
      </button>
    </div>
  )
}
