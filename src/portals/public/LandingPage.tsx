import { Link } from 'react-router-dom'
import { Stethoscope, Activity, ClipboardList, User, Building2, ChevronRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { stockUrl } from '../../lib/stockPhotos'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <section
        className="relative min-h-screen flex items-center justify-center px-4 py-16"
        style={{
          backgroundImage: `url(${stockUrl('heroConsult', 1600)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/60 via-ink-900/40 to-ink-900/70" />

        <div className="relative z-10 w-full max-w-xl mx-auto text-center">
          <div className="glass-2 rounded-3xl p-8 md:p-12">
            <div className="mb-3">
              <span className="text-xs font-semibold text-teal-500 tracking-widest uppercase">NowCare</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-ink-900 tracking-tighter leading-tight mb-4">
              Not sure where to go when you're not feeling well?
            </h1>
            <p className="text-slate-600 text-base md:text-lg mb-8 leading-relaxed">
              Describe your symptoms. We'll tell you what medical care you should seek and show you where to get it near you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button size="lg" fullWidth>
                  Get started <ChevronRight size={18} strokeWidth={1.75} />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg" fullWidth>
                  I have an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-ink-800 tracking-tight mb-10">
          How NowCare helps
        </h2>
        <div className="flex flex-col gap-8">
          {[
            {
              number: '1',
              icon: <Stethoscope size={24} strokeWidth={1.75} className="text-teal-500" />,
              title: 'AI symptom assessment',
              body: 'Describe how you feel. NowCare recommends the right level of care in plain language — no medical jargon.',
            },
            {
              number: '2',
              icon: <Activity size={24} strokeWidth={1.75} className="text-amber-500" />,
              title: 'Live provider availability',
              body: 'See real ER wait status and imaging slots posted directly by hospitals. No guessing, no calling ahead.',
            },
            {
              number: '3',
              icon: <ClipboardList size={24} strokeWidth={1.75} className="text-blue-500" />,
              title: 'Your visit, guided',
              body: 'Get a symptom summary to bring to your provider. Every step of your care journey is logged for your records.',
            },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-6">
              <div className="shrink-0 w-12 h-12 rounded-2xl glass-1 flex items-center justify-center">
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-ink-800 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-ink-800 tracking-tight mb-8">
          Who are you?
        </h2>
        <div className="flex flex-col gap-3">
          {[
            {
              icon: <User size={28} strokeWidth={1.75} className="text-teal-500" />,
              label: 'I am a patient',
              description: 'Find care based on your symptoms right now.',
              to: '/signup/patient',
            },
            {
              icon: <Stethoscope size={28} strokeWidth={1.75} className="text-blue-500" />,
              label: 'I am a doctor',
              description: 'Verify your credentials and manage your availability.',
              to: '/signup/doctor',
            },
            {
              icon: <Building2 size={28} strokeWidth={1.75} className="text-amber-500" />,
              label: 'I am a hospital',
              description: 'Post live ER status and imaging availability.',
              to: '/signup/hospital',
            },
          ].map((r) => (
            <Link key={r.to} to={r.to} className="block group">
              <Card
                level={1}
                padding="md"
                className="flex items-center gap-4 hover:glass-2 transition-all duration-200 cursor-pointer"
              >
                <div className="shrink-0">{r.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-ink-800">{r.label}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{r.description}</p>
                </div>
                <ChevronRight size={18} strokeWidth={1.75} className="text-slate-300 group-hover:text-teal-500 transition-colors shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/30 py-8 px-4 text-center">
        <p className="text-xs text-slate-300 mt-1">
          Built for LionHacks 2026 - GDG on Campus SELU, Healthcare Track
        </p>
      </footer>
    </div>
  )
}
