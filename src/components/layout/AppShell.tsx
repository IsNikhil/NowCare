import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileNav from './MobileNav'

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden md:flex w-60 shrink-0 flex-col h-full glass-3 fixed left-0 top-0 bottom-0 z-30">
          <Sidebar />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
            <aside className="relative w-64 h-full glass-3">
              <Sidebar onNavClick={() => setSidebarOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex-1 md:ml-60 flex flex-col h-screen overflow-hidden">
          <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 animate-fade-up">
            <Outlet />
          </main>
        </div>

        <MobileNav />
      </div>
    </div>
  )
}
