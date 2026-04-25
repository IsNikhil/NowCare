import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HelpCircle, X, Send, Loader2, MessageSquare } from 'lucide-react'
import { helpBotChat } from '../../services/gemini'
import { scaleIn } from '../../lib/motion'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTED_PROMPTS = [
  'How does symptom assessment work?',
  'How do I upload a lab result?',
  'What roles are available in NowCare?',
  'How do I book an appointment?',
  'Is my data safe?',
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-bl-sm w-fit"
      style={{ background: 'var(--bg-elevated)' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: 'var(--text-muted)',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default function HelpBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for dispatch event from PatientHome "Help & FAQ" tile
  useEffect(() => {
    function handleOpen() { setOpen(true) }
    document.addEventListener('open-helpbot', handleOpen)
    return () => document.removeEventListener('open-helpbot', handleOpen)
  }, [])

  useEffect(() => {
    if (open) {
      setHasNew(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.slice(-8)
      const reply = await helpBotChat(trimmed, history)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      if (!open) setHasNew(true)
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }, [messages, loading, open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <>
      {/* Floating bubble */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              key="chat-window"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-[340px] sm:w-[380px] rounded-3xl overflow-hidden flex flex-col"
              style={{
                maxHeight: '520px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Header */}
              <div
                className="px-4 py-3 flex items-center justify-between shrink-0"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}
                  >
                    <HelpCircle size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>NowCare Helper</p>
                    <p className="text-xs" style={{ color: 'var(--accent-teal)' }}>Product help desk</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-tint)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={15} strokeWidth={1.75} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" style={{ minHeight: 0 }}>
                {isEmpty && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div
                      className="px-3 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
                      style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)', maxWidth: '88%' }}
                    >
                      Hi! I can help you use NowCare — finding doctors, uploading documents, understanding assessments, and more. What do you need?
                    </div>

                    <p className="text-xs font-semibold px-1" style={{ color: 'var(--text-muted)' }}>Quick questions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_PROMPTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => sendMessage(p)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            background: 'var(--surface-tint)',
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                      style={{
                        maxWidth: '88%',
                        background: msg.role === 'user' ? 'var(--accent-teal)' : 'var(--bg-glass)',
                        color: msg.role === 'user' ? '#fff' : 'var(--text-secondary)',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      }}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <TypingIndicator />
                  </motion.div>
                )}

                <div ref={endRef} />
              </div>

              {/* Input */}
              <div
                className="px-3 py-3 shrink-0"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about NowCare..."
                    className="flex-1 text-sm bg-transparent outline-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0"
                    style={{
                      background: input.trim() && !loading ? 'var(--accent-teal)' : 'var(--surface-tint)',
                      color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {loading ? (
                      <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                    ) : (
                      <Send size={13} strokeWidth={2} />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-center mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Product help only · Not a medical assistant
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger button */}
        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center relative shadow-lg"
          style={{
            background: open ? 'var(--bg-elevated)' : 'var(--accent-teal)',
            color: open ? 'var(--text-primary)' : '#fff',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X size={20} strokeWidth={1.75} />
              </motion.div>
            ) : (
              <motion.div key="help" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageSquare size={20} strokeWidth={1.75} />
              </motion.div>
            )}
          </AnimatePresence>

          {hasNew && (
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
              style={{ background: 'var(--accent-coral)', border: '2px solid var(--bg-base)' }}
            />
          )}
        </motion.button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  )
}
