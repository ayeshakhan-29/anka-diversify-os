"use client"

import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumb?: string[]
}

export function MainLayout({ children, title, breadcrumb }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header title={title} breadcrumb={breadcrumb} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
