import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { where } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ChevronDown, ChevronUp, Copy, Check,
  ArrowLeft, FileText, User, Calendar, MessageSquare, Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection'
import { askAboutDocument } from '../../services/gemini'
import { GlassCard } from '../../components/ui/GlassCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { fadeRise, stagger } from '../../lib/motion'
import type { PatientDocument, DocumentFinding, FindingStatus } from '../../types'

const STATUS_CONFIG: Record<FindingStatus, { label: string; color: string; bg: string }> = {
  normal: { label: 'Normal', color: '#22c55e', bg: 'hsla(142,71%,45%,0.1)' },
  low: { label: 'Low', color: 'var(--accent-amber)', bg: 'hsla(38,95%,60%,0.1)' },
  high: { label: 'High', color: 'var(--accent-coral)', bg: 'hsla(8,90%,65%,0.1)' },
  abnormal: { label: 'Abnormal', color: 'var(--accent-coral)', bg: 'hsla(8,90%,65%,0.1)' },
  info: { label: 'Info', color: 'var(--accent-violet)', bg: 'hsla(265,70%,65%,0.1)' },
}

function FindingRow({ finding }: { finding: DocumentFinding }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[finding.status]

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--border-subtle)' }}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--surface-tint)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
        <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{finding.label}</span>
        <span className="font-mono text-base font-bold shrink-0" style={{ color: cfg.color }}>{finding.value}</span>
        {finding.reference_range && (
          <span className="text-xs hidden sm:block shrink-0" style={{ color: 'var(--text-muted)' }}>
            ref: {finding.reference_range}
          </span>
        )}
        <Badge
          variant={finding.status === 'normal' ? 'success' : finding.status === 'info' ? 'violet' : 'danger'}
          className="shrink-0"
        >
          {cfg.label}
        </Badge>
        {expanded ? <ChevronUp size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {finding.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DocumentQA({ analysis }: { analysis: NonNullable<PatientDocument['analysis']> }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const response = await askAboutDocument(userMsg, analysis, messages)
      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I could not answer that right now.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
          <MessageSquare size={16} strokeWidth={1.75} />
        </div>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Ask about this document</h3>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {['What does my hemoglobin level mean?', 'Are any values concerning?', 'What should I tell my doctor?'].map((q) => (
            <button key={q} onClick={() => setInput(q)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--surface-tint)' }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                style={{
                  background: m.role === 'user' ? 'var(--accent-teal)' : 'var(--surface-tint)',
                  color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl text-sm" style={{ background: 'var(--surface-tint)', color: 'var(--text-muted)' }}>
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          placeholder="Ask a question about this document..."
          className="flex-1 h-10 px-4 rounded-xl text-sm outline-none border transition-all"
          style={{
            background: 'var(--bg-glass)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
          }}
        />
        <Button size="sm" onClick={handleSend} disabled={!input.trim() || loading}>
          <Send size={14} strokeWidth={1.75} />
        </Button>
      </div>
    </GlassCard>
  )
}

export default function DocumentDetail() {
  const { docId } = useParams<{ docId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [findingFilter, setFindingFilter] = useState<'all' | 'attention' | 'normal'>('all')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const { data: documents, loading } = useFirestoreCollection<PatientDocument>(
    'patient_documents',
    user ? [where('patientId', '==', user.uid), where('docId', '==', docId ?? '')] : []
  )

  const document = documents[0]
  const analysis = document?.analysis

  function copyQuestion(text: string, idx: number) {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
    toast.success('Copied to clipboard')
  }

  function copyAllQuestions() {
    if (!analysis?.questions_to_ask_doctor) return
    const text = analysis.questions_to_ask_doctor.map((q, i) => `${i + 1}. ${q}`).join('\n')
    navigator.clipboard.writeText(text)
    toast.success('All questions copied')
  }

  if (loading) return <div className="max-w-3xl mx-auto"><SkeletonCard lines={5} /></div>
  if (!document) return (
    <div className="max-w-3xl mx-auto text-center py-20">
      <p style={{ color: 'var(--text-muted)' }}>Document not found.</p>
      <Button variant="secondary" className="mt-4" onClick={() => navigate('/patient/documents')}>Back</Button>
    </div>
  )

  const filteredFindings = analysis?.key_findings?.filter((f) => {
    if (findingFilter === 'attention') return f.status !== 'normal' && f.status !== 'info'
    if (findingFilter === 'normal') return f.status === 'normal'
    return true
  }) ?? []

  const attentionCount = analysis?.key_findings?.filter((f) => f.status !== 'normal' && f.status !== 'info').length ?? 0

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <motion.div variants={fadeRise}>
        <button onClick={() => navigate('/patient/documents')}
          className="inline-flex items-center gap-1.5 text-sm hover:underline mb-2"
          style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} strokeWidth={1.75} />
          Back to documents
        </button>
      </motion.div>

      {/* Red flags banner */}
      {analysis?.red_flags && analysis.red_flags.length > 0 && (
        <motion.div variants={fadeRise}>
          <div className="rounded-2xl p-4 border"
            style={{ background: 'hsla(8,90%,65%,0.08)', borderColor: 'hsla(8,90%,65%,0.25)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} strokeWidth={1.75} style={{ color: 'var(--accent-coral)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--accent-coral)' }}>
                {analysis.red_flags.length} item{analysis.red_flags.length > 1 ? 's' : ''} need{analysis.red_flags.length === 1 ? 's' : ''} attention
              </span>
            </div>
            <ul className="space-y-1">
              {analysis.red_flags.map((flag, i) => (
                <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent-coral)' }} />
                  {flag}
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-3" onClick={() => navigate('/patient/assess', { state: { prefill: analysis.red_flags.join('. ') } })}>
              Run new assessment
            </Button>
          </div>
        </motion.div>
      )}

      {/* Header card */}
      <motion.div variants={fadeRise}>
        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'hsla(265,70%,65%,0.1)', color: 'var(--accent-violet)' }}>
              <FileText size={24} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {analysis?.document_type ?? document.filename}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {analysis?.date_of_document && (
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Calendar size={12} strokeWidth={1.75} />
                    {analysis.date_of_document}
                  </div>
                )}
                {analysis?.provider_name && (
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <User size={12} strokeWidth={1.75} />
                    {analysis.provider_name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total findings', value: analysis?.key_findings?.length ?? 0, color: 'var(--text-primary)' },
              { label: 'Need attention', value: attentionCount, color: attentionCount > 0 ? 'var(--accent-coral)' : 'var(--accent-green)' },
              { label: 'Medications', value: analysis?.medications?.length ?? 0, color: 'var(--accent-violet)' },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: 'var(--surface-tint)' }}>
                <p className="text-2xl font-mono font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Analysis not available */}
      {document.analysisStatus === 'pending' && (
        <motion.div variants={fadeRise}>
          <GlassCard className="p-6 text-center">
            <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <FileText size={18} strokeWidth={1.75} />
              </motion.div>
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Analyzing your document...</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>This usually takes 10-15 seconds.</p>
          </GlassCard>
        </motion.div>
      )}

      {document.analysisStatus === 'failed' && (
        <GlassCard className="p-6 text-center">
          <p className="font-semibold" style={{ color: 'var(--accent-coral)' }}>Analysis failed</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Could not analyze this file. The document may be in an unsupported format.</p>
        </GlassCard>
      )}

      {analysis && (
        <>
          {/* Summary */}
          <motion.div variants={fadeRise}>
            <GlassCard className="p-5">
              <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Summary</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{analysis.summary}</p>
            </GlassCard>
          </motion.div>

          {/* Key findings */}
          {analysis.key_findings && analysis.key_findings.length > 0 && (
            <motion.div variants={fadeRise}>
              <GlassCard className="overflow-hidden">
                <div className="flex items-center justify-between p-5 pb-3">
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Key Findings</h2>
                  <div className="flex gap-1">
                    {(['all', 'attention', 'normal'] as const).map((f) => (
                      <button key={f} onClick={() => setFindingFilter(f)}
                        className="text-xs px-2.5 py-1 rounded-lg capitalize transition-all"
                        style={{
                          background: findingFilter === f ? 'var(--accent-teal)' : 'var(--surface-tint)',
                          color: findingFilter === f ? 'white' : 'var(--text-secondary)',
                        }}>
                        {f === 'attention' ? 'Needs attention' : f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  {filteredFindings.map((finding, i) => (
                    <FindingRow key={i} finding={finding} />
                  ))}
                  {filteredFindings.length === 0 && (
                    <p className="p-5 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No findings in this category.</p>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Medications */}
          {analysis.medications && analysis.medications.length > 0 && (
            <motion.div variants={fadeRise}>
              <GlassCard className="p-5">
                <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Medications</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {analysis.medications.map((med, i) => (
                    <div key={i} className="p-3 rounded-xl border"
                      style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-tint)' }}>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{med.name}</p>
                      {(med.dose || med.frequency) && (
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--accent-teal)' }}>
                          {[med.dose, med.frequency].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{med.purpose}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Questions to ask doctor */}
          {analysis.questions_to_ask_doctor && analysis.questions_to_ask_doctor.length > 0 && (
            <motion.div variants={fadeRise}>
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Questions to ask your doctor</h2>
                  <button onClick={copyAllQuestions}
                    className="text-xs font-semibold flex items-center gap-1 hover:underline"
                    style={{ color: 'var(--accent-teal)' }}>
                    <Copy size={12} strokeWidth={1.75} />
                    Copy all
                  </button>
                </div>
                <ol className="space-y-2">
                  {analysis.questions_to_ask_doctor.map((q, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-xs font-mono font-bold shrink-0 mt-0.5" style={{ color: 'var(--accent-teal)' }}>{i + 1}.</span>
                      <p className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>{q}</p>
                      <button onClick={() => copyQuestion(q, i)}
                        className="p-1.5 rounded-lg shrink-0 transition-colors hover:bg-[var(--surface-tint)]"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label="Copy question">
                        {copiedIdx === i ? <Check size={12} strokeWidth={2} style={{ color: 'var(--accent-teal)' }} /> : <Copy size={12} strokeWidth={1.75} />}
                      </button>
                    </li>
                  ))}
                </ol>
              </GlassCard>
            </motion.div>
          )}

          {/* Document Q&A */}
          <motion.div variants={fadeRise}>
            <DocumentQA analysis={analysis} />
          </motion.div>

          {/* Disclaimer */}
          <motion.div variants={fadeRise}>
            <p className="text-xs text-center pb-4" style={{ color: 'var(--text-muted)' }}>
              {analysis.disclaimer}
            </p>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
