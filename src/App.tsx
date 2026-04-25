import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Toaster } from 'sonner'
import BackgroundAura from './components/layout/BackgroundAura'
import { router } from './router'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BackgroundAura />
        <RouterProvider router={router} />
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
    </ThemeProvider>
  )
}
