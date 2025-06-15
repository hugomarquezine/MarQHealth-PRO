'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage('Erro: Verifique seu e-mail e senha.')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="grid min-h-screen grid-cols-1 font-sans md:grid-cols-2">
      {/* Coluna do Formulário */}
      <div className="flex flex-col items-center justify-center p-8 bg-white md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Olá, Doc!
            </h1>
            <p className="mt-2 text-lg text-slate-600">
              Acesse o painel para ver os insights dos seus pacientes.
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2 transition-colors duration-200 border rounded-md shadow-sm appearance-none border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 transition-colors duration-200 border rounded-md shadow-sm appearance-none border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
            {message && <p className="text-sm text-center text-red-500">{message}</p>}
          </form>
        </div>
      </div>

      {/* Coluna da Imagem/Vídeo */}
      <div className="flex items-center justify-center bg-slate-50">
        {/* Você pode substituir este div por um componente <Image> do Next.js ou <video> */}
        <div className="w-3/4 text-center">
          <p className="text-2xl font-medium text-slate-400">SEU VÍDEO OU IMAGEM AQUI</p>
        </div>
      </div>
    </div>
  )
}