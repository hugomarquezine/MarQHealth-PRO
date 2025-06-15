'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [loadingPatientId, setLoadingPatientId] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) router.push('/')
      else {
        setUser(data.session.user)
        setLoading(false)
      }
    }
    checkSession()
  }, [router])
  
  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, cpf')
        .or(`full_name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(10)
      setSearchResults(data || [])
      setIsSearching(false)
    }
    const delayDebounceFn = setTimeout(() => { performSearch() }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-50">Carregando...</div>
  }

  return (
    <div className="min-h-screen font-sans bg-slate-50">
      <header className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="font-semibold text-slate-700">
          <span className="text-slate-400">Médico:</span> {user?.email}
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100"
        >
          Logout
        </button>
      </header>

      <main className="flex flex-col items-center w-full px-4 pt-16 mx-auto md:pt-24 max-w-7xl">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Qual será nosso próximo paciente?
          </h1>
          <div className="mt-8">
            <input
              type="text"
              placeholder="Digite o nome, CPF ou telefone para buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 text-lg bg-white border rounded-full shadow-sm appearance-none border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="h-96"> {/* Container para os resultados com altura fixa */}
            <div className="mt-6 text-left">
              {isSearching && <p className="p-4 text-center text-slate-500">Buscando...</p>}
              {!isSearching && searchResults.length > 0 && (
                <ul className="overflow-hidden bg-white border rounded-xl border-slate-200 shadow-sm">
                  {searchResults.map((patient) => (
                    <li key={patient.id} onClick={() => setLoadingPatientId(patient.id)} className="block w-full">
                      <Link href={`/paciente/${patient.id}`} className="block w-full transition-colors duration-150 hover:bg-slate-50">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                          <div>
                            <p className="font-semibold text-slate-800">{patient.full_name}</p>
                            <p className="text-sm text-slate-500">CPF: {patient.cpf}</p>
                          </div>
                          {loadingPatientId === patient.id && <div className="w-5 h-5 border-b-2 border-blue-500 rounded-full animate-spin"></div>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}