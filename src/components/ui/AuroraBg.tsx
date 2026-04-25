import { useTheme } from '../../context/ThemeContext'

export default function AuroraBg() {
  const { theme } = useTheme()

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden
    >
      {theme === 'light' ? (
        <>
          <div
            className="aurora-1 absolute top-[-20%] left-[-10%] w-[60vw] h-[60vh] rounded-full opacity-40"
            style={{ background: 'radial-gradient(ellipse at center, hsla(168,76%,75%,0.5) 0%, transparent 70%)' }}
          />
          <div
            className="aurora-2 absolute top-[30%] right-[-15%] w-[50vw] h-[50vh] rounded-full opacity-30"
            style={{ background: 'radial-gradient(ellipse at center, hsla(265,70%,80%,0.4) 0%, transparent 70%)' }}
          />
          <div
            className="aurora-3 absolute bottom-[-10%] left-[50%] w-[70vw] h-[40vh] rounded-full opacity-25"
            style={{ background: 'radial-gradient(ellipse at center, hsla(168,76%,70%,0.35) 0%, transparent 70%)' }}
          />
        </>
      ) : (
        <>
          <div
            className="aurora-1 absolute top-[-20%] left-[-10%] w-[60vw] h-[60vh] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse at center, hsla(168,76%,42%,0.6) 0%, transparent 70%)' }}
          />
          <div
            className="aurora-2 absolute top-[30%] right-[-15%] w-[50vw] h-[50vh] rounded-full opacity-15"
            style={{ background: 'radial-gradient(ellipse at center, hsla(265,70%,65%,0.5) 0%, transparent 70%)' }}
          />
          <div
            className="aurora-3 absolute bottom-[-10%] left-[50%] w-[70vw] h-[40vh] rounded-full opacity-10"
            style={{ background: 'radial-gradient(ellipse at center, hsla(168,76%,42%,0.4) 0%, transparent 70%)' }}
          />
        </>
      )}
    </div>
  )
}
