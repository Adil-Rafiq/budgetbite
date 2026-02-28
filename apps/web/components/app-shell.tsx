"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { AppHeader } from "@/components/app-header"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
