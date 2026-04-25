import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
          <SearchX size={40} strokeWidth={1.25} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Page not found</h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>The page you are looking for does not exist.</p>
        <Link to="/"><Button>Go to home</Button></Link>
      </div>
    </div>
  )
}
