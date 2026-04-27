'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

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
    <div className="bg-bg-card rounded-2xl p-8 w-full max-w-sm">
      <h1 className="text-3xl font-bold text-text-accent mb-8">{T.loginForm.title}</h1>

      {isRegister && (
        <div className="mb-5 bg-green-900/40 border border-green-700 rounded-xl p-3">
          <p className="text-sm text-green-400">{T.loginForm.accountCreated}</p>
        </div>
      )}
      {error && (
        <div className="mb-5 bg-red-900/40 border border-red-700 rounded-xl p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-4">
        <input
          value={username}
          className="bg-bg-tertiary text-text-main rounded-xl p-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
          onChange={(e) => setUsername(e.target.value)}
          placeholder={T.loginForm.username}
        />
        <input
          type="password"
          value={password}
          className="bg-bg-tertiary text-text-main rounded-xl p-3 w-full outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
          onChange={(e) => setPassword(e.target.value)}
          placeholder={T.loginForm.password}
        />
      </div>

      <button
        type="submit"
        onClick={handleSubmit}
        className="bg-btn-primary text-btn-primary-text w-full py-3 rounded-xl font-medium hover:scale-[1.02] transition-transform duration-200 mb-4"
      >
        {T.loginForm.signIn}
      </button>

      <button
        type="button"
        onClick={() => setIsLogin(false)}
        className="text-text-secondary hover:text-text-main text-sm transition-colors w-full text-center"
      >
        {T.loginForm.noAccount}
      </button>
    </div>
  )
}
