import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Painel Médico',
  description: 'Painel de visualização de relatórios de pacientes.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-50`}>{children}</body>
    </html>
  )
}