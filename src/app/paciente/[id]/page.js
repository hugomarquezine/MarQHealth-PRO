// app-medico-web-IA/src/app/paciente/[id]/page.js

'use client'

import ReactMarkdown from 'react-markdown'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function PacientePage({ params }) {
  const [patient, setPatient] = useState(null)
  const [reports, setReports] = useState([])
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingReport, setViewingReport] = useState(null)

  // useEffect para buscar dados do paciente e lista de relatórios
  useEffect(() => {
    const fetchPatientData = async () => {
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
    if (params.id) fetchPatientData()
  }, [params.id])

  // useEffect para buscar interações do relatório selecionado
  useEffect(() => {
    const fetchInteractions = async () => {
      if (!viewingReport) return
      const { data: interactionsData } = await supabase.from('patient_interactions').select('*').eq('report_id', viewingReport.id)
      setInteractions(interactionsData || [])
    }
    fetchInteractions()
  }, [viewingReport])

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50">Carregando dados do paciente...</div>
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

  const ReportCard = ({ title, items, color }) => (
    <div className="p-6 bg-white border rounded-xl border-slate-200">
      <h3 className={`text-lg font-semibold ${color}`}>{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 list-disc list-inside text-slate-700">
          {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Nenhum item registrado.</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen p-4 font-sans md:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="pb-4 mb-8 border-b border-slate-200">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">{patient.full_name}</h1>
          <p className="mt-1 text-lg text-slate-500">CPF: {patient.cpf} | Email: {patient.email}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <h2 className="text-2xl font-semibold text-slate-800">
              Relatório da Sessão
              <span className="ml-2 text-base font-normal text-slate-400">
                ({new Date(viewingReport?.created_at).toLocaleDateString('pt-BR', {timeZone: 'UTC'})})
              </span>
            </h2>
          
            <div className="p-6 bg-white border rounded-xl border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Dados da Anamnese</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 mt-3 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Data de Nascimento</dt>
                  <dd className="mt-1 text-sm text-slate-900">{patient.birth_date} ({calculateAge(patient.birth_date)} anos)</dd>

                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Gênero</dt>
                  <dd className="mt-1 text-sm text-slate-900">{patient.gender || 'N/A'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Preferência de Tratamento</dt>
                  <dd className="mt-1 text-sm text-slate-900">{patient.formality_preference || 'N/A'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Procedimentos Anteriores</dt>
                  <dd className="mt-1 text-sm text-slate-900">{patient.previous_procedures || 'Nenhum'}</dd>
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ReportCard title="Principais Incômodos" items={incomodos} color="text-red-600" />
              <ReportCard title="Procedimentos que Amou ❤️" items={wishlist} color="text-pink-600" />
              <ReportCard title="Outras Áreas Visitadas" items={interesses} color="text-green-600" />
              <ReportCard title="Interesse em Skincare" items={skincare} color="text-blue-600" />
            </div>

            {/* ================================================================= */}
            {/* ================= CARD DE SUGESTÃO DA IA ======================== */}
            {viewingReport?.ai_suggestion && (
              <div className="p-6 border rounded-xl bg-slate-100 border-slate-200">
                <h3 className="flex items-center border-b border-slate-200 pb-4 mb-4 text-lg font-semibold text-slate-900">
                  <span className="mr-2 text-xl">💡</span> Sugestões da IA para Fórmulas Manipuladas
                </h3>

                {/* A MÁGICA ACONTECE AQUI */}
                <div className="mt-4 prose prose-slate max-w-none prose-sm">
                  <ReactMarkdown>
                    {viewingReport.ai_suggestion}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            {/* ================================================================= */}
            {/* ================================================================= */}
          </div>


          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-800">Histórico</h2>
            <div className="p-6 space-y-3 bg-white border rounded-xl border-slate-200">
              {reports.map(report => (
                <div 
                  key={report.id}
                  onClick={() => setViewingReport(report)}
                  className={`block p-3 transition-all duration-150 border rounded-lg cursor-pointer ${viewingReport?.id === report.id ? 'bg-blue-100 border-blue-500' : 'border-slate-200 hover:bg-slate-50 hover:border-blue-400'}`}
                >
                  <p className="font-semibold text-slate-700">Relatório</p>
                  <p className="text-sm text-slate-500">{new Date(report.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>
                </div>

              ))}
              
            </div>
          </div>
        </div>
        
        
        <div className="mt-12 text-center">
          <Link href="/dashboard" className="px-8 py-3 text-sm font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700">
              BUSCAR OUTRO PACIENTE
          </Link>
        </div>
      </div>
    </div>
  )
}