import React from "react"
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/toaster'
import { Wallet } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold">FinanzApp</span>
        </div>
      </header>
      
      <AppSidebar />
      <main className="md:pl-64">
        <div className="min-h-screen pt-14 md:pt-0">{children}</div>
      </main>
      <Toaster />
    </div>
  )
}
