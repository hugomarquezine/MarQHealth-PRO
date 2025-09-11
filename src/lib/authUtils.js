import { supabase } from './supabaseClient'

// Função para verificar se o usuário tem acesso médico
export async function checkMedicalAccess(userId) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar role do usuário:', error)
      return false
    }

    const userRole = data?.role || 'user'
    
    // Apenas admin, super_admin e doctor podem acessar
    return userRole === 'admin' || userRole === 'super_admin' || userRole === 'doctor'
  } catch (error) {
    console.error('Erro ao verificar acesso médico:', error)
    return false
  }
}

// Função para obter o role do usuário
export async function getUserRole(userId) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar role do usuário:', error)
      return 'user'
    }

    return data?.role || 'user'
  } catch (error) {
    console.error('Erro ao obter role do usuário:', error)
    return 'user'
  }
}
