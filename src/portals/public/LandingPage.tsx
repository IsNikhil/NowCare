import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Leaf,
  MapPin,
  Scan,
  Shield,
  Sparkles,
  Stethoscope,
  User,
  Video,
  Siren,
  Loader2,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'

const careCategories = [
  {
    id: 'ER_NOW',
    headline: 'Go to the ER now',
    sub: 'Immediate attention needed. Call 911 or get to the nearest emergency department.',
    icon: Siren,
    color: 'var(--accent-coral)',
    urgency: 'Immediate',
  },
  {
    id: 'URGENT_TODAY',
    headline: 'See a doctor today',
    sub: 'Same-day availability with a doctor or your nearest urgent care center.',
    icon: Clock,
    color: 'var(--accent-amber)',
    urgency: 'Today',
  },
  {
    id: 'SCAN_NEEDED',
    headline: 'Get a scan',
    sub: "A scan helps your provider see what's going on. We'll find the nearest open slot.",
    icon: Scan,
    color: 'var(--accent-violet)',
    urgency: 'Soon',
  },
  {
    id: 'TELEHEALTH',
    headline: 'Try telehealth',
    sub: 'A video or phone consultation may be enough. Faster than a clinic visit.',
    icon: Video,
    color: 'var(--accent-teal)',
    urgency: 'Remote',
  },
  {
    id: 'SCHEDULE_DOCTOR',
    headline: 'Schedule with a doctor',
    sub: 'Not urgent, but worth seeing a verified provider in the next few days.',
    icon: CalendarDays,
    color: 'hsl(168, 76%, 60%)',
    urgency: 'Routine',
  },
  {
    id: 'SELF_CARE',
    headline: 'Take care at home',
    sub: 'This can likely be managed at home. Here is what to watch for.',
    icon: Leaf,
    color: 'var(--accent-green)',
    urgency: 'At home',
  },
]

const demoQueries = [
  {
    q: 'Stuffy nose and mild headache for 2 days',
    cat: 'TELEHEALTH',
    reason: 'Routine symptoms. A video visit can confirm next steps and help you decide whether in-person care is needed.',
  },
  {
    q: 'Sharp pain lower right side for 6 hours, slight fever',
    cat: 'URGENT_TODAY',
    reason: 'Combined pain and fever warrant same-day evaluation. Four urgent care options are within five miles.',
  },
  {
    q: 'Persistent shortness of breath at rest, chest tightness',
    cat: 'ER_NOW',
    reason: 'These symptoms can signal a serious event. Call 911 or go to the ER now.',
  },
  {
    q: 'Knee pain after a fall last week, hard to bear weight',
    cat: 'SCAN_NEEDED',
    reason: 'An imaging scan can help a provider rule out an injury. Three hospitals have scan slots open today.',
  },
]

function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center font-black tracking-tight"
        style={{
          width: size,
          height: size,
          borderRadius: Math.max(8, size * 0.31),
          background: 'linear-gradient(135deg, var(--accent-teal), hsl(168,76%,62%))',
          color: '#031617',
          fontSize: size * 0.5,
          boxShadow: '0 6px 20px -4px var(--accent-teal-glow), inset 0 1px 0 rgba(255,255,255,.25)',
        }}
      >
        N
      </div>
      <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">NowCare</span>
    </div>
  )
}

function Aurora() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="aurora-1 absolute -top-[20%] -left-[10%] h-[70vh] w-[70vw] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, var(--accent-teal-glow), transparent 70%)', opacity: 0.55 }}
      />
      <div
        className="aurora-2 absolute top-[30%] -right-[15%] h-[60vh] w-[60vw] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, hsla(265,70%,65%,0.22), transparent 70%)' }}
      />
      <div
        className="aurora-3 absolute -bottom-[25%] left-1/4 h-[50vh] w-[80vw] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, var(--accent-teal-glow), transparent 70%)', opacity: 0.28 }}
      />
    </div>
  )
}

function LiveDemo() {
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState<'typing' | 'thinking' | 'result'>('typing')
  const timerRef = useRef<number | null>(null)

  const demo = demoQueries[idx]
  const category = careCategories.find((c) => c.id === demo.cat) ?? careCategories[3]
  const Icon = category.icon

  useEffect(() => {
    let i = 0
    setTyped('')
    setPhase('typing')

    const type = () => {
      if (i <= demo.q.length) {
        setTyped(demo.q.slice(0, i))
        i += 1
        timerRef.current = window.setTimeout(type, 36)
        return
      }

      setPhase('thinking')
      timerRef.current = window.setTimeout(() => {
        setPhase('result')
        timerRef.current = window.setTimeout(() => setIdx((x) => (x + 1) % demoQueries.length), 4500)
      }, 1100)
    }

    timerRef.current = window.setTimeout(type, 500)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [demo.q])

  return (
    <div className="glass-card-elevated relative overflow-hidden p-6">
      <div
        aria-hidden
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-2xl transition-colors"
        style={{ background: `color-mix(in oklch, ${category.color} 24%, transparent)` }}
      />

      <div className="relative mb-5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-teal-glow)]">
          <Stethoscope size={16} strokeWidth={1.75} className="text-[var(--accent-teal)]" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-[var(--text-primary)]">AI Symptom Assessment</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-green)] pulse-glow" />
            Powered by Gemini · Live
          </div>
        </div>
        <div className="ml-auto font-mono text-[11px] tracking-wider text-[var(--text-muted)]">v2.0</div>
      </div>

      <div className="relative mb-3 min-h-12 rounded-[14px_14px_4px_14px] border border-[var(--border-subtle)] bg-[var(--surface-tint)] px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)]">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Patient describes</div>
        {typed || <span className="text-[var(--text-muted)]">Describe your symptoms...</span>}
        {phase === 'typing' && <span className="ml-1 inline-block h-[1.05em] w-0.5 animate-pulse rounded bg-[var(--accent-teal)] align-middle" />}
      </div>

      <div className={`${phase === 'thinking' ? 'mb-3 max-h-16 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-300`}>
        <div className="flex items-center gap-2.5 rounded-[4px_14px_14px_14px] border border-[var(--border-subtle)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-sm text-[var(--text-secondary)]">
          <Loader2 size={14} strokeWidth={1.75} className="animate-spin text-[var(--accent-teal)]" />
          Assessing symptoms...
        </div>
      </div>

      <div className={`${phase === 'result' ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'} relative mb-4 transition-all duration-500`}>
        <div
          className="rounded-[4px_14px_14px_14px] border p-4"
          style={{
            background: `linear-gradient(135deg, color-mix(in oklch, ${category.color} 14%, transparent), color-mix(in oklch, ${category.color} 6%, transparent))`,
            borderColor: `color-mix(in oklch, ${category.color} 32%, transparent)`,
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <Icon size={16} strokeWidth={2} style={{ color: category.color }} />
            <span className="text-sm font-bold tracking-tight" style={{ color: category.color }}>{category.headline}</span>
            <span
              className="ml-auto rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `color-mix(in oklch, ${category.color} 16%, transparent)`, color: category.color }}
            >
              {category.urgency}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{demo.reason}</p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed pt-2.5" style={{ borderColor: `color-mix(in oklch, ${category.color} 32%, transparent)` }}>
            <span className="text-[11px] italic text-[var(--text-muted)]">Recommendation only, not a diagnosis.</span>
            <span className="flex items-center gap-1 text-xs font-bold" style={{ color: category.color }}>
              See providers <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex flex-wrap gap-1.5">
        {[
          { icon: Shield, label: 'NPPES verified' },
          { icon: Building2, label: 'CMS hospital data' },
          { icon: Activity, label: 'Live ER status' },
          { icon: MapPin, label: 'Near you' },
        ].map((chip) => (
          <div key={chip.label} className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-tint)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
            <chip.icon size={11} strokeWidth={1.75} className="text-[var(--accent-teal)]" />
            {chip.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <nav
        className="fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300"
        style={{
          background: scrolled ? 'hsla(195,25%,8%,0.78)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(160%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(160%)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        }}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center gap-6 px-5 md:px-8">
          <Logo />
          <div className="ml-4 hidden flex-1 gap-7 md:flex">
            {[
              ['Features', '#features'],
              ['Care categories', '#care-categories'],
              ['For providers', '#for-providers'],
            ].map(([label, href]) => (
              <a key={label} href={href} className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
                {label}
              </a>
            ))}
          </div>
          <Link to="/login" className="hidden text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] sm:block">
            Sign in
          </Link>
          <Link to="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      <section className="relative flex min-h-screen items-center px-5 py-28 md:px-8">
        <Aurora />
        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-glass)] py-1.5 pl-2 pr-4 backdrop-blur-md">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-teal-glow)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-teal)]">
                <Sparkles size={11} strokeWidth={1.75} /> AI
              </span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">AI-powered healthcare navigation</span>
            </div>

            <h1 className="mb-6 max-w-3xl text-[clamp(44px,6vw,84px)] font-black leading-none tracking-[-0.035em] text-[var(--text-primary)]">
              Healthcare navigation,
              <br />
              <span className="gradient-text">reimagined.</span>
            </h1>

            <p className="mb-9 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
              Describe what you're feeling. Get a clear next step in seconds: see a doctor today, get a scan, try telehealth, or take care at home. Backed by verified providers and live availability.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/signup/patient">
                <Button size="lg">
                  Start for free <ArrowRight size={16} strokeWidth={1.75} />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">Sign in</Button>
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-6">
              {[
                { icon: Shield, label: 'NPPES verified providers' },
                { icon: Activity, label: 'Live ER status' },
                { icon: Scan, label: 'Real-time scan slots' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)]">
                  <item.icon size={14} strokeWidth={1.75} className="text-[var(--accent-teal)]" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <LiveDemo />
        </div>
      </section>

      <section id="features" className="px-5 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-teal)]">How NowCare works</p>
            <h2 className="text-4xl font-black leading-tight tracking-[-0.025em] md:text-5xl">
              From symptoms to the right care
              <br className="hidden sm:block" /> in under 60 seconds.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { n: '01', icon: Stethoscope, color: 'var(--accent-teal)', title: 'AI symptom assessment', body: 'Describe how you feel in plain language. NowCare returns a safe care recommendation across six fixed levels, never a diagnosis.' },
              { n: '02', icon: Activity, color: 'var(--accent-amber)', title: 'Live provider availability', body: 'See real-time ER status, scan slots, and same-day openings posted by hospitals and verified clinicians.' },
              { n: '03', icon: FileText, color: 'var(--accent-violet)', title: 'Your visit, guided', body: 'Get a pre-visit summary to bring to your provider. Upload past reports for plain-language analysis.' },
            ].map((step) => (
              <div key={step.n} className="glass-card-elevated p-7 transition-transform hover:-translate-y-1">
                <div className="mb-6 font-mono text-sm font-semibold tracking-wider text-[var(--text-muted)]">{step.n} / 03</div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ background: `color-mix(in oklch, ${step.color} 14%, transparent)`, borderColor: `color-mix(in oklch, ${step.color} 32%, transparent)` }}>
                  <step.icon size={22} strokeWidth={1.75} style={{ color: step.color }} />
                </div>
                <h3 className="mb-2.5 text-xl font-bold tracking-tight">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="care-categories" className="px-5 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 grid gap-8 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-teal)]">Six care categories</p>
              <h2 className="text-4xl font-black leading-tight tracking-[-0.025em] md:text-5xl">
                Every result maps to one
                <br className="hidden sm:block" /> safe, actionable next step.
              </h2>
            </div>
            <p className="text-base leading-relaxed text-[var(--text-secondary)]">
              NowCare always returns one of six fixed care levels, never a diagnosis. Each routes you to the right verified provider, hospital, scan slot, or telehealth option.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {careCategories.map((cat) => (
              <div key={cat.id} className="glass-card relative overflow-hidden p-5 transition-transform hover:-translate-y-1">
                <div aria-hidden className="absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl" style={{ background: `color-mix(in oklch, ${cat.color} 12%, transparent)` }} />
                <div className="relative mb-5 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border" style={{ background: `color-mix(in oklch, ${cat.color} 16%, transparent)`, borderColor: `color-mix(in oklch, ${cat.color} 32%, transparent)` }}>
                    <cat.icon size={20} strokeWidth={2} style={{ color: cat.color }} />
                  </div>
                  <span className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: `color-mix(in oklch, ${cat.color} 14%, transparent)`, color: cat.color }}>
                    {cat.urgency}
                  </span>
                </div>
                <div className="relative mb-1.5 font-mono text-[10px] font-semibold tracking-wider text-[var(--text-muted)]">{cat.id}</div>
                <h3 className="relative mb-2 text-lg font-bold tracking-tight">{cat.headline}</h3>
                <p className="relative text-sm leading-relaxed text-[var(--text-secondary)]">{cat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-10 md:px-8">
        <div className="glass-card-elevated relative mx-auto max-w-6xl overflow-hidden p-8 md:p-10">
          <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: 'linear-gradient(135deg, var(--accent-teal-glow), transparent 30%, hsla(265,70%,65%,0.08))' }} />
          <div className="relative grid gap-6 md:grid-cols-4">
            {[
              { icon: Shield, label: 'NPPES verified', val: '2.4M+', body: 'Every doctor cross-checked against the public NPI Registry.' },
              { icon: Building2, label: 'CMS hospital data', val: '6,090', body: "Hospital General Information from Medicare's public dataset." },
              { icon: Activity, label: 'Live ER status', val: 'Real-time', body: 'Wait status posted directly by hospital staff.' },
              { icon: Scan, label: 'Open scan slots', val: '<2 min', body: 'MRI, CT, X-ray, and ultrasound slots shown in real time.' },
            ].map((item) => (
              <div key={item.label} className="border-[var(--border-subtle)] md:border-r md:pr-6 last:border-0">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <item.icon size={16} strokeWidth={1.75} className="text-[var(--accent-teal)]" />
                  {item.label}
                </div>
                <div className="mb-2 text-4xl font-black leading-none tracking-tight">{item.val}</div>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="for-providers" className="px-5 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-teal)]">Built for everyone</p>
            <h2 className="text-4xl font-black tracking-[-0.025em] md:text-5xl">One platform, three portals.</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { icon: User, color: 'var(--accent-teal)', to: '/signup/patient', label: "I'm a patient", desc: 'Describe symptoms and find verified providers, scan slots, or telehealth in seconds.', bullets: ['AI assessment', 'Provider results', 'Pre-visit summary', 'Document analysis'] },
              { icon: Stethoscope, color: 'var(--accent-violet)', to: '/signup/doctor', label: "I'm a doctor", desc: 'Get NPPES-verified, set availability, and connect with patients searching by specialty.', bullets: ['NPI verification', 'Availability manager', 'Telehealth toggle', 'Practice insights'] },
              { icon: Building2, color: 'var(--accent-amber)', to: '/signup/hospital', label: "I'm a hospital", desc: 'Post live ER status and scan availability. Be discovered nationwide via CMS data.', bullets: ['ER status controls', 'MRI/scan slots', 'CMS-linked profile', 'Admin approval flow'] },
            ].map((role) => (
              <Link key={role.to} to={role.to} className="glass-card-elevated relative flex flex-col overflow-hidden p-7 no-underline transition-transform hover:-translate-y-1">
                <div aria-hidden className="absolute -right-14 -top-14 h-44 w-44 rounded-full blur-3xl" style={{ background: `color-mix(in oklch, ${role.color} 16%, transparent)` }} />
                <div className="relative mb-6 flex h-13 w-13 items-center justify-center rounded-2xl border" style={{ width: 52, height: 52, background: `color-mix(in oklch, ${role.color} 14%, transparent)`, borderColor: `color-mix(in oklch, ${role.color} 32%, transparent)` }}>
                  <role.icon size={24} strokeWidth={1.8} style={{ color: role.color }} />
                </div>
                <h3 className="relative mb-2.5 text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">{role.label}</h3>
                <p className="relative mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">{role.desc}</p>
                <div className="relative mb-6 flex-1 space-y-2">
                  {role.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Check size={12} strokeWidth={2.5} style={{ color: role.color }} />
                      {bullet}
                    </div>
                  ))}
                </div>
                <div className="relative flex items-center gap-1.5 text-sm font-bold" style={{ color: role.color }}>
                  Get started <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 md:px-8">
        <div className="glass-card-elevated relative mx-auto max-w-5xl overflow-hidden border-[var(--border-strong)] px-6 py-16 text-center md:px-12">
          <div aria-hidden className="absolute left-1/2 top-[-50%] h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, var(--accent-teal-glow), transparent 60%)', opacity: 0.6 }} />
          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-tint)] px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-green)] pulse-glow" />
              <span className="text-xs font-medium text-[var(--text-secondary)]">Free care navigation · Verified providers</span>
            </div>
            <h2 className="mb-5 text-[clamp(40px,5vw,72px)] font-black leading-none tracking-[-0.035em]">
              Navigate to the <span className="gradient-text">right care</span>,
              <br />
              faster.
            </h2>
            <p className="mx-auto mb-9 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
              Start a free assessment. Find verified providers, live ER status, and open scan slots, all in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/signup/patient">
                <Button size="lg">Start for free <ArrowRight size={16} strokeWidth={1.75} /></Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">Sign in</Button>
              </Link>
            </div>
            <p className="mt-6 text-xs italic text-[var(--text-muted)]">
              NowCare provides care navigation only. We do not diagnose, prescribe, or replace professional medical advice.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border-subtle)] bg-[hsla(195,30%,5%,0.5)] px-5 py-12 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid gap-8 md:grid-cols-[1.6fr_1fr_1.1fr_1.2fr_1fr]">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
                AI-powered healthcare navigation. Verified providers, live availability, safer next steps.
              </p>
            </div>
            {[
              ['Product', 'Features', 'Care categories', 'Live demo'],
              ['Patients', 'Start assessment', 'Provider results', 'Pre-visit summary'],
              ['Providers', 'For doctors', 'NPI verification', 'MRI / scan slots'],
              ['Company', 'About', 'Privacy', 'Terms'],
            ].map(([heading, ...links]) => (
              <div key={heading}>
                <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{heading}</div>
                {links.map((link) => (
                  <a key={link} href="#" className="mb-2 block text-sm text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--text-primary)]">
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-5 border-t border-[var(--border-subtle)] pt-6">
            <span className="text-xs text-[var(--text-muted)]">© 2026 NowCare. All rights reserved.</span>
            <span className="max-w-xl text-left text-xs italic text-[var(--text-muted)] md:text-right">
              NowCare provides care navigation support only and does not diagnose, prescribe, or replace professional medical advice. In an emergency, call 911.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
