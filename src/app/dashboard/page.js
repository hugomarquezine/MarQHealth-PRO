'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { checkMedicalAccess, getUserRole } from '@/lib/authUtils'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [loadingPatientId, setLoadingPatientId] = useState(null)
  const [hasMedicalAccess, setHasMedicalAccess] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) router.push('/')
      else {
        setUser(data.session.user)
        // Verificar acesso médico e obter role
        const access = await checkMedicalAccess(data.session.user.id)
        const role = await getUserRole(data.session.user.id)
        setHasMedicalAccess(access)
        setUserRole(role)
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
      
      // Verificar se o usuário tem acesso médico antes de buscar
      if (!user) {
        setSearchResults([])
        return
      }
      
      const hasAccess = await checkMedicalAccess(user.id)
      if (!hasAccess) {
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
  }, [searchTerm, user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {loadingPatientId && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-700 font-medium">Abrindo paciente...</span>
          </div>
        </div>
      )}
      {/* Header moderno com gradiente */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/marq-logo.png"
                  alt="MarQHealth Logo"
                  width={32}
                  height={32}
                  style={{ width: "auto", height: "auto" }}
                />
                <h1 className="text-xl font-bold text-slate-900">MarQHealth</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-sm">
                <span className="text-slate-500">Bem-vindo,</span>
                <span className="ml-1 font-semibold text-slate-700">{user?.email}</span>
                {userRole && (
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    userRole === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                    userRole === 'admin' ? 'bg-blue-100 text-blue-800' :
                    userRole === 'doctor' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {userRole === 'super_admin' ? 'Super Admin' : 
                     userRole === 'admin' ? 'Administrador' : 
                     userRole === 'doctor' ? 'Médico' : 
                     userRole === 'user' ? 'Recepção' : userRole}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content com design moderno */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Buscar Paciente
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-6">
            Digite o nome, CPF ou telefone do paciente para acessar o histórico
          </p>
          
          {/* Informações do usuário logado */}
          {userRole && (
            <div className="inline-flex items-center space-x-3 bg-white rounded-lg border border-slate-200 px-4 py-2 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  userRole === 'super_admin' ? 'bg-purple-500' :
                  userRole === 'admin' ? 'bg-blue-500' :
                  userRole === 'doctor' ? 'bg-green-500' :
                  'bg-gray-500'
                }`}></div>
                <span className="text-sm font-medium text-slate-700">
                  {userRole === 'super_admin' ? 'Super Administrador' : 
                   userRole === 'admin' ? 'Administrador' : 
                   userRole === 'doctor' ? 'Médico' : 
                   userRole === 'user' ? 'Recepção' : userRole}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-300"></div>
              <span className="text-xs text-slate-500">
                {hasMedicalAccess ? 'Acesso liberado' : 'Acesso restrito'}
              </span>
            </div>
          )}
        </div>

        {/* Barra de busca moderna */}
        <div className="max-w-2xl mx-auto mb-8">
          {!hasMedicalAccess ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Acesso Restrito</h3>
              <p className="text-red-700 mb-2">
                Apenas médicos e administradores podem acessar os dados dos pacientes.
              </p>
              {userRole && (
                <p className="text-sm text-red-600">
                  Seu role atual: <span className="font-medium">{userRole}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Digite o nome, CPF ou telefone para buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 text-lg bg-white border border-slate-300 rounded-2xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          )}
        </div>

        {/* Resultados da busca */}
        <div className="max-w-4xl mx-auto">
          {isSearching && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-600">Buscando pacientes...</span>
              </div>
            </div>
          )}
          
          {!isSearching && searchResults.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((patient) => (
                <div key={patient.id} className="group">
                  <Link href={`/paciente/${patient.id}`} className="block" onClick={() => setLoadingPatientId(patient.id)}>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 group-hover:scale-[1.02]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {patient.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 text-lg">{patient.full_name}</h3>
                              <p className="text-sm text-slate-500">CPF: {patient.cpf}</p>
                            </div>
                          </div>
                        </div>
                        {loadingPatientId === patient.id ? (
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum paciente encontrado</h3>
              <p className="text-slate-500">Tente buscar com outros termos ou verifique se o paciente está cadastrado.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}