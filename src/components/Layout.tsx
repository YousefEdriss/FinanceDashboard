import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, TrendingUp } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#000' }}>

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Orb 1 — top left */}
        <div className="animate-orb-float absolute rounded-full"
          style={{
            width: 600, height: 600,
            top: '-15%', left: '-10%',
            background: 'radial-gradient(circle, rgba(109,40,217,0.28) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }} />
        {/* Orb 2 — bottom right */}
        <div className="animate-orb-float-slow absolute rounded-full"
          style={{
            width: 500, height: 500,
            bottom: '-10%', right: '-8%',
            animationDelay: '-6s',
            background: 'radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }} />
        {/* Orb 3 — center */}
        <div className="absolute rounded-full"
          style={{
            width: 350, height: 350,
            top: '35%', left: '45%',
            animationDelay: '-12s',
            background: 'radial-gradient(circle, rgba(76,29,149,0.1) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'orb-float 22s ease-in-out infinite',
          }} />
        {/* Grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.055) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }} />
      </div>

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex relative z-10 w-60 flex-shrink-0 flex-col"
        style={{
          background: 'rgba(2,2,2,0.92)',
          borderRight: '1px solid rgba(168,85,247,0.18)',
          backdropFilter: 'blur(24px)',
        }}>

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3"
          style={{ borderBottom: '1px solid rgba(168,85,247,0.07)' }}>
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(168,85,247,0.6)',
              boxShadow: '0 0 16px rgba(168,85,247,0.3), inset 0 0 12px rgba(168,85,247,0.18)',
            }}>
            <TrendingUp size={15} style={{ color: '#a855f7' }} />
          </div>
          <div className="leading-none">
            <div className="font-mono text-sm font-bold tracking-widest">
              <span className="text-white">MY</span>
              <span style={{ color: '#a855f7', textShadow: '0 0 10px rgba(168,85,247,0.7)' }}>DASH</span>
            </div>
            <div className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(168,85,247,0.6)', letterSpacing: '0.1em' }}>v1.0</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          <p className="text-xs px-3 mb-4 font-mono font-medium"
            style={{ color: 'rgba(168,85,247,0.6)', letterSpacing: '0.18em' }}>NAVIGATION</p>

          <NavLink to="/" end>
            {({ isActive }) => (
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300"
                style={isActive ? {
                  background: 'rgba(168,85,247,0.09)',
                  borderLeft: '2px solid #a855f7',
                  boxShadow: '0 0 20px rgba(168,85,247,0.06), inset 0 0 20px rgba(168,85,247,0.04)',
                  marginLeft: 0,
                } : {
                  borderLeft: '2px solid transparent',
                  marginLeft: 0,
                }}>
                <LayoutDashboard size={17} style={{ color: isActive ? '#a855f7' : '#6b7280', transition: 'color 0.3s' }} />
                <span className="text-sm font-medium flex-1" style={{ color: isActive ? '#c084fc' : '#9ca3af', transition: 'color 0.3s' }}>
                  Finance
                </span>
                {isActive && <div className="live-dot" />}
              </div>
            )}
          </NavLink>

          <NavLink to="/daily">
            {({ isActive }) => (
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300"
                style={isActive ? {
                  background: 'rgba(168,85,247,0.09)',
                  borderLeft: '2px solid #a855f7',
                  boxShadow: '0 0 20px rgba(168,85,247,0.06), inset 0 0 20px rgba(168,85,247,0.04)',
                } : {
                  borderLeft: '2px solid transparent',
                }}>
                <CalendarCheck size={17} style={{ color: isActive ? '#a855f7' : '#6b7280', transition: 'color 0.3s' }} />
                <span className="text-sm font-medium flex-1" style={{ color: isActive ? '#c084fc' : '#9ca3af', transition: 'color 0.3s' }}>
                  Daily
                </span>
                {isActive && <div className="live-dot" />}
              </div>
            )}
          </NavLink>
        </nav>

        {/* Footer badge */}
        <div className="px-4 pb-5">
          <div className="rounded-xl p-4 text-center"
            style={{
              background: 'rgba(168,85,247,0.04)',
              border: '1px solid rgba(168,85,247,0.18)',
            }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="live-dot" />
              <p className="text-xs font-mono font-semibold" style={{ color: 'rgba(168,85,247,0.6)', letterSpacing: '0.12em' }}>
                SYSTEM ONLINE
              </p>
            </div>
            <p className="text-xs font-mono" style={{ color: '#1f2937' }}>Personal Dashboard</p>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex"
        style={{
          background: 'rgba(0,0,0,0.96)',
          borderTop: '1px solid rgba(168,85,247,0.12)',
          backdropFilter: 'blur(24px)',
        }}>
        <NavLink to="/" end className="flex-1">
          {({ isActive }) => (
            <div className="relative flex flex-col items-center justify-center py-3 gap-1 transition-all duration-300"
              style={{ color: isActive ? '#a855f7' : '#6b7280' }}>
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '20%', right: '20%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.9), transparent)',
                  boxShadow: '0 0 8px rgba(168,85,247,0.8)',
                }} />
              )}
              <LayoutDashboard size={22} style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' } : {}} />
              <span className="text-xs font-medium">Finance</span>
            </div>
          )}
        </NavLink>
        <NavLink to="/daily" className="flex-1">
          {({ isActive }) => (
            <div className="relative flex flex-col items-center justify-center py-3 gap-1 transition-all duration-300"
              style={{ color: isActive ? '#a855f7' : '#6b7280' }}>
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '20%', right: '20%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.9), transparent)',
                  boxShadow: '0 0 8px rgba(168,85,247,0.8)',
                }} />
              )}
              <CalendarCheck size={22} style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' } : {}} />
              <span className="text-xs font-medium">Daily</span>
            </div>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
