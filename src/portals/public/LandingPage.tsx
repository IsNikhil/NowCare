import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Stethoscope,
  Activity,
  ClipboardList,
  User,
  Building2,
  ChevronRight,
  Scan,
  Brain,
  HeartPulse,
  FileText,
  MapPin,
  Shield,
  ArrowRight,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { fadeRise, stagger } from '../../lib/motion'
import { images } from '../../lib/imageAssets'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Aurora background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="aurora-1 absolute -top-[20%] -left-[10%] w-[70vw] h-[70vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, var(--accent-teal-glow), transparent 70%)', opacity: 0.6 }}
        />
        <div
          className="aurora-2 absolute top-[40%] -right-[15%] w-[60vw] h-[60vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, hsla(265,70%,65%,0.2), transparent 70%)' }}
        />
        <div
          className="aurora-3 absolute -bottom-[20%] left-[30%] w-[80vw] h-[50vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, var(--accent-teal-glow), transparent 70%)', opacity: 0.3 }}
        />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-6 md:px-12"
        style={{
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, var(--accent-teal), hsl(168,76%,55%))' }}
          >
            N
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>NowCare</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="secondary" size="sm">Sign in</Button>
          </Link>
          <Link to="/signup" className="hidden sm:block">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-4 py-32 pt-28">
        <div className="max-w-5xl mx-auto w-full">
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16"
          >
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div variants={fadeRise} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
                style={{ background: 'var(--surface-tint)', color: 'var(--accent-teal)', border: '1px solid var(--border-subtle)' }}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--accent-teal)] animate-pulse" />
                Built for LionHacks 2026
              </motion.div>

              <motion.h1
                variants={fadeRise}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
                style={{ color: 'var(--text-primary)' }}
              >
                Healthcare
                <br />
                <span className="gradient-text">navigation,</span>
                <br />
                reimagined.
              </motion.h1>

              <motion.p
                variants={fadeRise}
                className="text-lg md:text-xl leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0"
                style={{ color: 'var(--text-secondary)' }}
              >
                Describe your symptoms. Get an AI-powered recommendation for the exact right level of care. Find verified providers near you, right now.
              </motion.p>

              <motion.div variants={fadeRise} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/signup/patient">
                  <Button size="lg">
                    Start for free
                    <ArrowRight size={18} strokeWidth={1.75} />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">Sign in</Button>
                </Link>
              </motion.div>

              <motion.div variants={fadeRise} className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
                {[
                  { icon: <Shield size={16} strokeWidth={1.75} />, text: 'NPPES verified doctors' },
                  { icon: <MapPin size={16} strokeWidth={1.75} />, text: 'Providers near you' },
                  { icon: <Activity size={16} strokeWidth={1.75} />, text: 'Live ER status' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--accent-teal)' }}>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right - feature preview card */}
            <motion.div variants={fadeRise} className="flex-1 w-full max-w-sm lg:max-w-none">
              <GlassCard variant="elevated" className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--accent-teal-glow)' }}
                  >
                    <Stethoscope size={16} strokeWidth={1.75} style={{ color: 'var(--accent-teal)' }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Symptom Assessment</span>
                </div>

                <div
                  className="rounded-xl p-4 mb-4 text-sm"
                  style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}
                >
                  "Sharp pain lower right side for 6 hours, slight fever..."
                </div>

                <div
                  className="rounded-xl p-4 mb-4 border"
                  style={{ background: 'hsla(38,95%,60%,0.08)', borderColor: 'hsla(38,95%,60%,0.2)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} strokeWidth={1.75} style={{ color: 'var(--accent-amber)' }} />
                    <span className="text-sm font-bold" style={{ color: 'var(--accent-amber)' }}>See a doctor today</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Your symptoms suggest you need same-day evaluation. Three providers are available within 8 miles.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: <HeartPulse size={14} strokeWidth={1.75} />, label: 'Cardiology' },
                    { icon: <Brain size={14} strokeWidth={1.75} />, label: 'Neurology' },
                    { icon: <Scan size={14} strokeWidth={1.75} />, label: 'Radiology' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-lg p-2 text-center text-xs font-medium flex flex-col items-center gap-1"
                      style={{ background: 'var(--surface-tint)', color: 'var(--text-secondary)' }}
                    >
                      <span style={{ color: 'var(--accent-teal)' }}>{s.icon}</span>
                      {s.label}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Hospital hero image strip */}
      <section className="relative h-64 md:h-80 overflow-hidden mx-4 md:mx-12 rounded-3xl mb-24">
        <img
          src={images.hospitalHero}
          alt="North Oaks Medical Center"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(to right, var(--bg-base) 0%, transparent 40%, transparent 60%, var(--bg-base) 100%)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-teal)' }}>Real hospitals. Real data.</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              North Oaks Health System
            </h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-base">Hammond, Louisiana</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-8 mb-24">
        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
        >
          <motion.h2 variants={fadeRise} className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-center" style={{ color: 'var(--text-primary)' }}>
            How NowCare works
          </motion.h2>
          <motion.p variants={fadeRise} className="text-center mb-12 text-base" style={{ color: 'var(--text-secondary)' }}>
            From symptoms to the right care in under 60 seconds.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: <Stethoscope size={28} strokeWidth={1.75} style={{ color: 'var(--accent-teal)' }} />,
                title: 'AI symptom assessment',
                body: 'Describe how you feel. NowCare recommends the right level of care in plain language using 6 fixed care categories.',
              },
              {
                step: '02',
                icon: <Activity size={28} strokeWidth={1.75} style={{ color: 'var(--accent-amber)' }} />,
                title: 'Live provider availability',
                body: 'See real ER wait status and imaging slots posted directly by hospitals. No guessing, no calling ahead.',
              },
              {
                step: '03',
                icon: <ClipboardList size={28} strokeWidth={1.75} style={{ color: 'var(--accent-violet)' }} />,
                title: 'Your visit, guided',
                body: 'Get a pre-visit summary to bring to your provider. Upload past reports for instant plain-language analysis.',
              },
            ].map((f, i) => (
              <motion.div key={f.title} variants={fadeRise} style={{ transitionDelay: `${i * 100}ms` }}>
                <GlassCard variant="interactive" className="p-6 h-full">
                  <div className="text-3xl font-mono font-bold mb-4" style={{ color: 'var(--border-subtle)' }}>{f.step}</div>
                  <div className="mb-4">{f.icon}</div>
                  <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.body}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features strip */}
      <section className="max-w-4xl mx-auto px-4 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Brain size={24} strokeWidth={1.75} style={{ color: 'var(--accent-teal)' }} />, label: 'Gemini AI triage' },
            { icon: <FileText size={24} strokeWidth={1.75} style={{ color: 'var(--accent-violet)' }} />, label: 'Document analysis' },
            { icon: <MapPin size={24} strokeWidth={1.75} style={{ color: 'var(--accent-amber)' }} />, label: 'Real-time ER status' },
            { icon: <Shield size={24} strokeWidth={1.75} style={{ color: 'var(--accent-green)' }} />, label: 'NPPES verified docs' },
          ].map((f) => (
            <GlassCard key={f.label} className="p-4 flex flex-col items-center gap-2 text-center">
              {f.icon}
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{f.label}</span>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Who are you */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h2 variants={fadeRise} className="text-3xl font-extrabold tracking-tight mb-8" style={{ color: 'var(--text-primary)' }}>
            Who are you?
          </motion.h2>
          <div className="flex flex-col gap-3">
            {[
              {
                icon: <User size={28} strokeWidth={1.75} style={{ color: 'var(--accent-teal)' }} />,
                label: 'I am a patient',
                description: 'Find the right care based on your symptoms right now.',
                to: '/signup/patient',
              },
              {
                icon: <Stethoscope size={28} strokeWidth={1.75} style={{ color: 'var(--accent-violet)' }} />,
                label: 'I am a doctor',
                description: 'Verify your credentials, manage availability, and connect with patients.',
                to: '/signup/doctor',
              },
              {
                icon: <Building2 size={28} strokeWidth={1.75} style={{ color: 'var(--accent-amber)' }} />,
                label: 'I am a hospital',
                description: 'Post live ER status, imaging availability, and be found by patients.',
                to: '/signup/hospital',
              },
            ].map((r) => (
              <motion.div key={r.to} variants={fadeRise}>
                <Link to={r.to} className="block group">
                  <GlassCard variant="interactive" className="flex items-center gap-4 p-5">
                    <div
                      className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: 'var(--surface-tint)' }}
                    >
                      {r.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{r.label}</p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{r.description}</p>
                    </div>
                    <ChevronRight size={20} strokeWidth={1.75} className="shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-4 text-center border-t"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, var(--accent-teal), hsl(168,76%,55%))' }}
          >
            N
          </div>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>NowCare</span>
        </div>
        <p className="text-xs">Built for LionHacks 2026 - GDG on Campus SELU, Healthcare Track</p>
        <p className="text-xs mt-1">
          NowCare is a navigation tool, not a substitute for professional medical advice.
          In an emergency, call 911.
        </p>
      </footer>
    </div>
  )
}
