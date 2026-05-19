'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { IconUser, IconLock, IconArrowRight } from '@tabler/icons-react'

export default function LoginUserForm({
  setIsLogin,
  isRegister,
}: {
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>
  isRegister: boolean
}) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { T } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    if (!result?.ok) {
      setError(T.loginForm.invalidCredentials)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">{T.loginForm.title}</h1>
        <div className="mt-2 h-0.5 w-10 bg-accent mx-auto rounded-full" />
      </div>

      {isRegister && (
        <div role="status" className="mb-5 bg-success/20 border border-success/40 rounded-xl p-3">
          <p className="text-sm text-success">{T.loginForm.accountCreated}</p>
        </div>
      )}
      {error && (
        <div role="alert" className="mb-5 bg-danger/20 border border-danger/40 rounded-xl p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <IconUser size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <label htmlFor="login-username" className="sr-only">{T.loginForm.username}</label>
          <input
            id="login-username"
            value={username}
            className="bg-bg-tertiary text-text-main rounded-xl pl-9 pr-3 py-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
            onChange={(e) => setUsername(e.target.value)}
            placeholder={T.loginForm.username}
            autoComplete="username"
          />
        </div>

        <div className="relative">
          <IconLock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <label htmlFor="login-password" className="sr-only">{T.loginForm.password}</label>
          <input
            id="login-password"
            type="password"
            value={password}
            className="bg-bg-tertiary text-text-main rounded-xl pl-9 pr-3 py-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
            onChange={(e) => setPassword(e.target.value)}
            placeholder={T.loginForm.password}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="bg-btn-primary text-btn-primary-text w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform duration-200 mt-1"
        >
          {T.loginForm.signIn}
          <IconArrowRight size={16} aria-hidden="true" />
        </button>
      </form>

      <button
        type="button"
        onClick={() => setIsLogin(false)}
        className="text-text-secondary hover:text-text-main text-sm transition-colors w-full text-center mt-5"
      >
        {T.loginForm.noAccount}
      </button>
    </div>
  )
}
