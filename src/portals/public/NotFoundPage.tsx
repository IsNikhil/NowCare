import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <SearchX size={64} strokeWidth={1.75} className="text-slate-200 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-ink-800 tracking-tight mb-2">Page not found</h1>
        <p className="text-slate-500 mb-8">The page you are looking for does not exist.</p>
        <Link to="/">
          <Button variant="primary">Go to home</Button>
        </Link>
      </div>
    </div>
  )
}
