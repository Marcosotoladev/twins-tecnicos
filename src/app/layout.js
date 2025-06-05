// src/app/layout.js

import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Twins Técnicos',
  description: 'Sistema de gestión de mantenimiento contra incendios',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
