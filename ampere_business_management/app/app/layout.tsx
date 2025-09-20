import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Ampere Engineering - Business Management System",
  description: "Professional business management solution for engineering projects",
  keywords: ["business management", "project management", "engineering", "invoicing"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            duration={4000}
          />
        </Providers>
      </body>
    </html>
  )
}