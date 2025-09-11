// app-medico-web-IA/src/app/paciente/[id]/page.js

'use client'

import ReactMarkdown from 'react-markdown'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { checkMedicalAccess, getUserRole } from '@/lib/authUtils'

export default function PacientePage({ params }) {
  const [patient, setPatient] = useState(null)
  const [reports, setReports] = useState([])
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingReport, setViewingReport] = useState(null)
  const [isAnamneseOpen, setIsAnamneseOpen] = useState(true)
  const [user, setUser] = useState(null)
  const [hasAccess, setHasAccess] = useState(null)
  const [userRole, setUserRole] = useState(null)

  // Verificar autenticação e acesso
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/'
        return
      }
      
      setUser(session.user)
      const access = await checkMedicalAccess(session.user.id)
      const role = await getUserRole(session.user.id)
      setHasAccess(access)
      setUserRole(role)
      
      if (!access) {
        window.location.href = '/dashboard'
        return
      }
    }
    checkAccess()
  }, [])

  // useEffect para buscar dados do paciente e lista de relatórios
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!hasAccess) return
      
      setLoading(true)
      const patientId = params.id
      const { data: patientData } = await supabase.from('patients').select('*').eq('id', patientId).single()
      const { data: reportsData } = await supabase.from('reports').select('*').eq('patient_id', patientId).order('created_at', { ascending: false })
      
      setPatient(patientData)
      setReports(reportsData || [])

      if (reportsData && reportsData.length > 0) {
        setViewingReport(reportsData[0])
      }
      setLoading(false)
    }
    if (params.id && hasAccess) fetchPatientData()
  }, [params.id, hasAccess])

  // useEffect para buscar interações do relatório selecionado
  useEffect(() => {
    const fetchInteractions = async () => {
      if (!viewingReport) return
      const { data: interactionsData } = await supabase.from('patient_interactions').select('*').eq('report_id', viewingReport.id)
      setInteractions(interactionsData || [])
    }
    fetchInteractions()
  }, [viewingReport])

  if (hasAccess === null) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Acesso Negado</h2>
          <p className="text-slate-600 mb-2">
            Você não tem permissão para acessar os dados dos pacientes.
          </p>
          {userRole && (
            <p className="text-sm text-slate-500 mb-4">
              Seu role atual: <span className="font-medium">{userRole}</span>
            </p>
          )}
          <Link href="/dashboard" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )
  if (!patient) return <div className="flex items-center justify-center min-h-screen bg-slate-50">Paciente não encontrado.</div>
  
  // Função para calcular a idade a partir de um texto 'DD/MM/AAAA'
const calculateAge = (birthDateString) => {
  // Se a data não existir ou não for um texto, retorna 'N/A'
  if (!birthDateString || typeof birthDateString !== 'string') return 'N/A';

  // Quebra o texto em partes: dia, mês, ano
  const parts = birthDateString.split('/');
  if (parts.length !== 3) return 'N/A'; // Formato inválido

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Mês no JavaScript é 0-11
  const year = parseInt(parts[2], 10);

  const today = new Date();
  const birthDateObj = new Date(year, month, day);

  // Validação extra para garantir que a data é válida
  if (isNaN(birthDateObj.getTime())) return 'N/A';

  let age = today.getFullYear() - birthDateObj.getFullYear();
  const m = today.getMonth() - birthDateObj.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
  }
  return age;
}
  
  const getInteractions = (type) => interactions.filter(i => i.interaction_type === type).map(i => i.target_value);
  const incomodos = getInteractions('INCOMODO');
  const wishlist = getInteractions('WISHLIST');
  const interesses = getInteractions('INTERESSE');
  const skincare = getInteractions('SKINCARE');

  // Parse robusto para colunas selecionados_face/body (aceita JSON array ou CSV)
  const parseSelections = (value) => {
    if (!value) return [];
    try {
      if (Array.isArray(value)) return value.filter(Boolean).map(String);
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        // Tenta JSON primeiro
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || trimmed.startsWith('{')) {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
        }
        // Fallback para CSV separado por vírgula, ponto e vírgula ou pipe
        return trimmed.split(/[;,|]/).map(s => s.trim()).filter(Boolean).map(String);
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  const selecionadosFace = parseSelections(viewingReport?.selecionados_face ?? patient?.selecionados_face);
  const selecionadosBody = parseSelections(viewingReport?.selecionados_body ?? patient?.selecionados_body);
  // Se o relatório tiver incômodos (interactions), usa eles; senão, usa selecionados da anamnese
  const selectedFromAnamnese = Array.from(new Set([
    ...selecionadosFace,
    ...selecionadosBody,
  ].map(v => (typeof v === 'string' ? v.trim() : String(v)).trim()))).filter(Boolean);
  const incomodosMerged = (incomodos && incomodos.length > 0)
    ? incomodos
    : selectedFromAnamnese;

  const ReportCard = ({ title, items, color, icon }) => (
    <div className="p-6 bg-white border rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color.includes('red') ? 'bg-red-100' : color.includes('pink') ? 'bg-pink-100' : color.includes('green') ? 'bg-green-100' : 'bg-blue-100'}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <h3 className={`text-lg font-semibold ${color}`}>{title}</h3>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${color.includes('red') ? 'bg-red-400' : color.includes('pink') ? 'bg-pink-400' : color.includes('green') ? 'bg-green-400' : 'bg-blue-400'}`}></div>
              <span className="text-slate-700 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400 italic">Nenhum item registrado.</p>
      )}
    </div>
  );

  // Função para exportar PDF
  const handleExportPDF = () => {
    // Criar uma versão otimizada para impressão
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Ficha do Paciente - ${patient.full_name}</title>
          <style>
            body { 
              font-family: 'Inter', sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white;
              color: #1e293b;
              line-height: 1.5;
              font-size: 14px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 25px; 
              padding-bottom: 15px; 
              border-bottom: 2px solid #e2e8f0;
            }
            .patient-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #1e293b; 
              margin-bottom: 8px;
            }
            .patient-info { 
              color: #64748b; 
              font-size: 12px;
            }
            .section { 
              margin-bottom: 20px; 
              page-break-inside: avoid;
            }
            .section-title { 
              font-size: 16px; 
              font-weight: bold; 
              color: #1e293b; 
              margin-bottom: 12px;
              padding-bottom: 6px;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 12px; 
              margin-bottom: 15px;
            }
            .info-item { 
              margin-bottom: 8px;
              padding: 8px;
              background: #f8fafc;
              border-radius: 4px;
            }
            .info-label { 
              font-weight: 600; 
              color: #475569; 
              font-size: 12px;
              margin-bottom: 2px;
            }
            .info-value { 
              color: #1e293b; 
              font-size: 13px;
            }
            .report-card { 
              background: #f8fafc; 
              border: 1px solid #e2e8f0; 
              border-radius: 6px; 
              padding: 12px; 
              margin-bottom: 12px;
            }
            .report-title { 
              font-weight: bold; 
              margin-bottom: 8px; 
              color: #1e293b;
              font-size: 14px;
            }
            .report-list { 
              margin: 0; 
              padding-left: 16px;
            }
            .report-list li { 
              margin-bottom: 4px; 
              color: #475569;
              font-size: 13px;
            }
            .ai-suggestion { 
              background: #f1f5f9; 
              border-left: 3px solid #3b82f6; 
              padding: 15px; 
              margin-top: 15px;
              border-radius: 0 6px 6px 0;
            }
            .ai-title { 
              font-weight: bold; 
              color: #1e40af; 
              margin-bottom: 8px;
              font-size: 14px;
            }
            .ai-content {
              font-size: 13px;
              line-height: 1.4;
            }
            .date { 
              color: #64748b; 
              font-size: 11px; 
              margin-top: 4px;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none !important; }
              * { 
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <!-- Cabeçalho do Relatório -->
          <div class="header">
            <h1 class="patient-name">${patient.full_name}</h1>
            <div class="patient-info">
              CPF: ${patient.cpf} | Email: ${patient.email} | Telefone: ${patient.phone || 'N/A'}
            </div>
            <div class="date">
              Relatório gerado em: ${new Date(viewingReport?.created_at).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                timeZone: 'UTC'
              })}
            </div>
          </div>

          <!-- Dados da Anamnese -->
          <div class="section">
            <h2 class="section-title">Dados da Anamnese</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Data de Nascimento</div>
                <div class="info-value">${patient.birth_date} (${calculateAge(patient.birth_date)} anos)</div>
              </div>
              <div class="info-item">
                <div class="info-label">Gênero</div>
                <div class="info-value">${patient.gender || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Telefone</div>
                <div class="info-value">${patient.phone || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Instagram</div>
                <div class="info-value">${patient.instagram ? `@${patient.instagram.replace('@', '')}` : 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Endereço Completo</div>
                <div class="info-value">${patient.endereco_completo || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Preferência de Tratamento</div>
                <div class="info-value">${patient.formality_preference || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Como Conheceu a Clínica</div>
                <div class="info-value">${patient.como_conheceu_clinica || 'N/A'}</div>
              </div>
              ${patient.como_conheceu_clinica === 'Indicacao' && patient.nome_indicou ? `
                <div class="info-item">
                  <div class="info-label">Nome de Quem Indicou</div>
                  <div class="info-value">${patient.nome_indicou}</div>
                </div>
              ` : ''}
              <div class="info-item">
                <div class="info-label">Histórico Dermatológico</div>
                <div class="info-value">${patient.historico_dermatologico ? 'Sim' : 'Não'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Tratamentos Realizados</div>
                <div class="info-value">${patient.tratamentos_realizados || 'Nenhum'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Outros Tratamentos</div>
                <div class="info-value">${patient.outros_tratamentos || 'Nenhum'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Doença Crônica</div>
                <div class="info-value">${patient.doenca_cronica ? `Sim: ${patient.doenca_cronica_descricao}` : 'Não'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Medicamentos Contínuos</div>
                <div class="info-value">${patient.medicamentos_continuos ? `Sim: ${patient.medicamentos_descricao}` : 'Não'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Alergias</div>
                <div class="info-value">${patient.alergias ? `Sim: ${patient.alergias_descricao}` : 'Não'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Histórico Familiar de Câncer de Pele</div>
                <div class="info-value">${patient.historico_cancer_pele_familia ? `Sim: ${patient.cancer_pele_familia_quem}` : 'Não'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Rotina de Cuidados com a Pele</div>
                <div class="info-value">${patient.rotina_cuidados_pele || 'Nenhuma'}</div>
              </div>
            </div>
          </div>

          <!-- Relatórios da Sessão -->
          <div class="section">
            <h2 class="section-title">Relatório da Sessão</h2>
            
            ${incomodosMerged.length > 0 ? `
              <div class="report-card">
                <div class="report-title">Principais Incômodos</div>
                <ul class="report-list">
                  ${incomodosMerged.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${wishlist.length > 0 ? `
              <div class="report-card">
                <div class="report-title">Procedimentos que Amou</div>
                <ul class="report-list">
                  ${wishlist.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${interesses.length > 0 ? `
              <div class="report-card">
                <div class="report-title">Outras Áreas Visitadas</div>
                <ul class="report-list">
                  ${interesses.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${skincare.length > 0 ? `
              <div class="report-card">
                <div class="report-title">Interesse em Skincare</div>
                <ul class="report-list">
                  ${skincare.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>

          <!-- Sugestões da IA -->
          ${viewingReport?.ai_suggestion ? `
            <div class="section">
              <div class="ai-suggestion">
                <div class="ai-title">Sugestões da IA - Fórmulas Manipuladas</div>
                <div class="ai-content">${viewingReport.ai_suggestion}</div>
              </div>
            </div>
          ` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Cabeçalho Fixo Moderno */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-lg border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Voltar</span>
              </Link>
              <div className="h-6 w-px bg-slate-300"></div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
                <p className="text-sm text-slate-500">CPF: {patient.cpf}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div id="patient-report-content" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Cabeçalho do Relatório */}
          <div className="text-center mb-8 pb-6 border-b border-slate-200">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{patient.full_name}</h1>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
              <span>CPF: {patient.cpf}</span>
              <span>•</span>
              <span>Email: {patient.email}</span>
              <span>•</span>
              <span>Telefone: {patient.phone || 'N/A'}</span>
            </div>
            <div className="mt-4 text-sm text-slate-500">
              Relatório gerado em: {new Date(viewingReport?.created_at).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                timeZone: 'UTC'
              })}
            </div>
          </div>
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <h2 className="text-2xl font-semibold text-slate-800 flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Relatório da Sessão
            </h2>
          
            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-6 bg-white border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Dados da Anamnese</h3>
                </div>
                <button onClick={() => setIsAnamneseOpen(!isAnamneseOpen)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isAnamneseOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {isAnamneseOpen && (
                <div className="p-6 bg-slate-50">
                  <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Informações Pessoais */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Data de Nascimento</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.birth_date} ({calculateAge(patient.birth_date)} anos)</dd>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Gênero</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.gender || 'N/A'}</dd>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Telefone</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.phone || 'N/A'}</dd>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Instagram</dt>
                      <dd className="text-base font-semibold text-slate-900">
                        {patient.instagram ? (
                          <a 
                            href={`https://instagram.com/${patient.instagram.replace('@', '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          >
                            @{patient.instagram.replace('@', '')}
                          </a>
                        ) : 'N/A'}
                      </dd>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 sm:col-span-2">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Endereço Completo</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.endereco_completo || 'N/A'}</dd>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 sm:col-span-2">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Preferência de Tratamento</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.formality_preference || 'N/A'}</dd>
                    </div>

                    {/* Informações de Como Conheceu a Clínica */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Como Conheceu a Clínica</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.como_conheceu_clinica || 'N/A'}</dd>
                    </div>
                    {patient.como_conheceu_clinica === 'Indicacao' && patient.nome_indicou && (
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <dt className="text-sm font-medium text-slate-500 mb-1">Nome de Quem Indicou</dt>
                        <dd className="text-base font-semibold text-slate-900">{patient.nome_indicou}</dd>
                      </div>
                    )}

                    {/* Histórico Médico e Dermatológico */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 sm:col-span-2">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Histórico Dermatológico</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.historico_dermatologico ? 'Sim' : 'Não'}</dd>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 sm:col-span-2">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Tratamentos Dermatológicos Realizados</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.tratamentos_realizados || 'Nenhum'}</dd>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 sm:col-span-2">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Outros Tratamentos Estéticos</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.outros_tratamentos || 'Nenhum'}</dd>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Doença Crônica</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.doenca_cronica ? `Sim: ${patient.doenca_cronica_descricao}` : 'Não'}</dd>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Medicamentos Contínuos</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.medicamentos_continuos ? `Sim: ${patient.medicamentos_descricao}` : 'Não'}</dd>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Alergias</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.alergias ? `Sim: ${patient.alergias_descricao}` : 'Não'}</dd>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Histórico Familiar de Câncer de Pele</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.historico_cancer_pele_familia ? `Sim: ${patient.cancer_pele_familia_quem}` : 'Não'}</dd>
                    </div>

                    {/* Hábitos e Rotina */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200 sm:col-span-2">
                      <dt className="text-sm font-medium text-slate-500 mb-1">Rotina de Cuidados com a Pele</dt>
                      <dd className="text-base font-semibold text-slate-900">{patient.rotina_cuidados_pele || 'Nenhuma'}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ReportCard title="Principais Incômodos" items={incomodosMerged} color="text-red-600" icon="😰" />
              <ReportCard title="Procedimentos que Amou ❤️" items={wishlist} color="text-pink-600" icon="❤️" />
              <ReportCard title="Outras Áreas Visitadas" items={interesses} color="text-green-600" icon="📍" />
              <ReportCard title="Interesse em Skincare" items={skincare} color="text-blue-600" icon="✨" />
            </div>

            {/* ================================================================= */}
            {/* ================= CARD DE SUGESTÃO DA IA ======================== */}
            {viewingReport?.ai_suggestion && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Sugestões da IA</h3>
                    <p className="text-sm text-slate-600">Fórmulas Manipuladas Personalizadas</p>
                  </div>
                </div>

                {/* A MÁGICA ACONTECE AQUI */}
                <div className="bg-white rounded-xl p-6 border border-blue-100">
                  <div className="prose prose-slate max-w-none prose-sm">
                    <ReactMarkdown>
                      {viewingReport.ai_suggestion}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
            {/* ================================================================= */}
            {/* ================================================================= */}
          </div>


          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-800 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Histórico de Consultas
            </h2>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <p className="text-sm font-medium text-slate-700">Selecione uma consulta para visualizar</p>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {reports.length > 0 ? reports.map((report, index) => (
                  <div 
                    key={report.id}
                    onClick={() => setViewingReport(report)}
                    className={`p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                      viewingReport?.id === report.id 
                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                        : 'hover:border-l-4 hover:border-l-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          viewingReport?.id === report.id 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Consulta #{reports.length - index}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(report.created_at).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              timeZone: 'UTC'
                            })}
                          </p>
                        </div>
                      </div>
                      {viewingReport?.id === report.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400">Nenhum relatório anterior</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}