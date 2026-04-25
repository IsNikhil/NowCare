export default function BackgroundAura() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="aurora-1 absolute -top-[20%] -left-[10%] w-[60vw] h-[60vh] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse at center, var(--accent-teal-glow), transparent 70%)', opacity: 0.5 }}
      />
      <div
        className="aurora-2 absolute top-[30%] -right-[15%] w-[50vw] h-[50vh] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse at center, hsla(265,70%,65%,0.2), transparent 70%)' }}
      />
      <div
        className="aurora-3 absolute -bottom-[10%] left-[50%] w-[70vw] h-[40vh] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse at center, var(--accent-teal-glow), transparent 70%)', opacity: 0.3 }}
      />
    </div>
  )
}
