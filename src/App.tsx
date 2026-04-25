import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { Toaster } from 'sonner'
import BackgroundAura from './components/layout/BackgroundAura'
import { ToastContainer } from './components/ui/Toast'
import { router } from './router'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BackgroundAura />
          <RouterProvider router={router} />
          <ToastContainer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                backdropFilter: 'blur(20px)',
              },
            }}
          />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
