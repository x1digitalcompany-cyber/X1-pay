'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      toast.error('Email ou senha inválidos')
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0a1e]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#1a1030] border border-purple-900/30">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">X1</span>
          </div>
          <h1 className="text-2xl font-bold text-white">X1 Pay</h1>
          <p className="text-gray-400 mt-1">Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white focus:outline-none focus:border-purple-500"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white focus:outline-none focus:border-purple-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg gradient-brand text-white font-semibold disabled:opacity-50 hover:opacity-90 transition"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
