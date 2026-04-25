import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './Topbar'
import BottomNav from './MobileNav'
import HelpBot from '../helpbot/HelpBot'
import { pageTransition } from '../../lib/motion'

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--bg-base)',
        backgroundImage:
          'radial-gradient(60vw 60vh at 0% 0%, hsla(168,76%,48%,0.08), transparent 60%), radial-gradient(50vw 50vh at 100% 100%, hsla(265,70%,65%,0.06), transparent 60%)',
      }}
    >
      <div className="flex h-dvh overflow-hidden">
        {/* Desktop persistent sidebar */}
        <aside
          className="hidden lg:flex w-64 shrink-0 flex-col h-full fixed left-0 top-0 bottom-0 z-30"
          style={{
            borderRight: '1px solid var(--border-subtle)',
            background: 'var(--bg-sidebar)',
            backdropFilter: 'blur(18px) saturate(150%)',
            WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          }}
        >
          <Sidebar />
        </aside>

        {/* Tablet icon rail */}
        <aside
          className="hidden md:flex lg:hidden w-[72px] shrink-0 flex-col h-full fixed left-0 top-0 bottom-0 z-30"
          style={{
            borderRight: '1px solid var(--border-subtle)',
            background: 'var(--bg-sidebar)',
            backdropFilter: 'blur(18px) saturate(150%)',
            WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          }}
        >
          <Sidebar iconOnly />
        </aside>

        {/* Mobile slide-in drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 md:hidden bg-black/40 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
                aria-hidden
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="fixed left-0 top-0 bottom-0 z-50 w-64 md:hidden flex flex-col"
                style={{ background: 'var(--bg-elevated)', borderRight: '1px solid var(--border-subtle)' }}
              >
                <Sidebar onNavClick={() => setSidebarOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <div className="flex-1 md:ml-[72px] lg:ml-64 flex flex-col h-dvh overflow-hidden">
          <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto pb-28 md:pb-8">
            <motion.div
              key={location.pathname}
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-full p-3 sm:p-4 md:p-6 lg:p-8"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />

        {/* Help Bot */}
        <HelpBot />
      </div>
    </div>
  )
}
