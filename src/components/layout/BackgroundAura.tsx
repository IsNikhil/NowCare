export default function BackgroundAura() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-400/20 blur-3xl animate-aura-1" />
      <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full bg-amber-300/15 blur-3xl animate-aura-2" />
      <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] rounded-full bg-rose-300/10 blur-3xl animate-aura-3" />
    </div>
  )
}
