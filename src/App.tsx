import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/ui/Toast'
import BackgroundAura from './components/layout/BackgroundAura'
import { router } from './router'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BackgroundAura />
        <RouterProvider router={router} />
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  )
}
