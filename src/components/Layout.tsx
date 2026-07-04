import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, TrendingUp, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import AIChatbot from './AIChatbot';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onSignOut: () => void;
}

export default function Layout({ children, user, onSignOut }: LayoutProps) {
  const displayName = user.user_metadata?.full_name ?? user.email ?? 'User';
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#000' }}>

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="animate-orb-float absolute rounded-full"
          style={{ width: 600, height: 600, top: '-15%', left: '-10%',
            background: 'radial-gradient(circle, rgba(109,40,217,0.28) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="animate-orb-float-slow absolute rounded-full"
          style={{ width: 500, height: 500, bottom: '-10%', right: '-8%', animationDelay: '-6s',
            background: 'radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div className="absolute rounded-full"
          style={{ width: 350, height: 350, top: '35%', left: '45%',
            background: 'radial-gradient(circle, rgba(76,29,149,0.1) 0%, transparent 70%)', filter: 'blur(80px)',
            animation: 'orb-float 22s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.055) 1px, transparent 1px)',
          backgroundSize: '64px 64px' }} />
        <div style={{ position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
      </div>

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex relative z-10 w-60 flex-shrink-0 flex-col"
        style={{ background: 'rgba(2,2,2,0.92)', borderRight: '1px solid rgba(168,85,247,0.18)', backdropFilter: 'blur(24px)' }}>

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3"
          style={{ borderBottom: '1px solid rgba(168,85,247,0.07)' }}>
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.6)',
              boxShadow: '0 0 16px rgba(168,85,247,0.3), inset 0 0 12px rgba(168,85,247,0.18)' }}>
            <TrendingUp size={15} style={{ color: '#a855f7' }} />
          </div>
          <div className="leading-none">
            <div className="font-mono text-sm font-bold tracking-widest">
              <span className="text-white">MY</span>
              <span style={{ color: '#a855f7', textShadow: '0 0 10px rgba(168,85,247,0.7)' }}>FINANCE</span>
            </div>
            <div className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(168,85,247,0.6)', letterSpacing: '0.1em' }}>v2.0</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          <p className="text-xs px-3 mb-4 font-mono font-medium"
            style={{ color: 'rgba(168,85,247,0.6)', letterSpacing: '0.18em' }}>NAVIGATION</p>

          <NavLink to="/" end>
            {({ isActive }) => (
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300"
                style={isActive ? { background: 'rgba(168,85,247,0.09)', borderLeft: '2px solid #a855f7',
                  boxShadow: '0 0 20px rgba(168,85,247,0.06), inset 0 0 20px rgba(168,85,247,0.04)' }
                  : { borderLeft: '2px solid transparent' }}>
                <LayoutDashboard size={17} style={{ color: isActive ? '#a855f7' : '#6b7280', transition: 'color 0.3s' }} />
                <span className="text-sm font-medium flex-1" style={{ color: isActive ? '#c084fc' : '#9ca3af', transition: 'color 0.3s' }}>Finance</span>
                {isActive && <div className="live-dot" />}
              </div>
            )}
          </NavLink>

          <NavLink to="/daily">
            {({ isActive }) => (
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300"
                style={isActive ? { background: 'rgba(168,85,247,0.09)', borderLeft: '2px solid #a855f7',
                  boxShadow: '0 0 20px rgba(168,85,247,0.06), inset 0 0 20px rgba(168,85,247,0.04)' }
                  : { borderLeft: '2px solid transparent' }}>
                <CalendarCheck size={17} style={{ color: isActive ? '#a855f7' : '#6b7280', transition: 'color 0.3s' }} />
                <span className="text-sm font-medium flex-1" style={{ color: isActive ? '#c084fc' : '#9ca3af', transition: 'color 0.3s' }}>Daily</span>
                {isActive && <div className="live-dot" />}
              </div>
            )}
          </NavLink>
        </nav>

        {/* User info + Sign out */}
        <div className="px-4 pb-5 space-y-3">
          <div className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.14)' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc' }}>
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{displayName.split(' ')[0]}</p>
              <p className="text-xs font-mono truncate" style={{ color: '#4b5563' }}>{user.email}</p>
            </div>
          </div>
          <button onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono transition-all duration-300"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.14)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile top header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2.5"
        style={{ background: 'rgba(0,0,0,0.96)', borderBottom: '1px solid rgba(168,85,247,0.12)', backdropFilter: 'blur(24px)' }}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.5)' }}>
            <TrendingUp size={13} style={{ color: '#a855f7' }} />
          </div>
          <span className="font-mono text-sm font-bold tracking-widest">
            <span className="text-white">MY</span>
            <span style={{ color: '#a855f7' }}>FINANCE</span>
          </span>
        </div>

        {/* Avatar button */}
        <button onClick={() => setShowMobileMenu(o => !o)} className="flex items-center gap-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover"
              style={{ border: '1px solid rgba(168,85,247,0.5)' }} />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: '#c084fc' }}>
              {initials}
            </div>
          )}
        </button>
      </div>

      {/* Mobile profile dropdown */}
      {showMobileMenu && (
        <div className="md:hidden fixed top-14 right-3 z-50 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(14,14,14,0.99)', border: '1px solid rgba(168,85,247,0.25)', boxShadow: '0 8px 40px rgba(168,85,247,0.2)', minWidth: 200 }}>
          {/* User info */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(168,85,247,0.1)' }}>
            <p className="text-sm font-medium text-white truncate">{displayName.split(' ')[0]}</p>
            <p className="text-xs font-mono truncate mt-0.5" style={{ color: '#6b7280' }}>{user.email}</p>
          </div>
          {/* Sign out */}
          <button
            onClick={() => { setShowMobileMenu(false); onSignOut(); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-all duration-200"
            style={{ color: '#f87171' }}
            onTouchStart={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
            onTouchEnd={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      )}

      {/* Tap outside to close mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
      )}

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 overflow-y-auto pb-20 md:pb-0 pt-14 md:pt-0">
        {children}
      </main>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex"
        style={{ background: 'rgba(0,0,0,0.96)', borderTop: '1px solid rgba(168,85,247,0.12)', backdropFilter: 'blur(24px)' }}>
        <NavLink to="/" end className="flex-1">
          {({ isActive }) => (
            <div className="relative flex flex-col items-center justify-center py-3 gap-1 transition-all duration-300"
              style={{ color: isActive ? '#a855f7' : '#6b7280' }}>
              {isActive && (
                <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.9), transparent)',
                  boxShadow: '0 0 8px rgba(168,85,247,0.8)' }} />
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
                <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.9), transparent)',
                  boxShadow: '0 0 8px rgba(168,85,247,0.8)' }} />
              )}
              <CalendarCheck size={22} style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' } : {}} />
              <span className="text-xs font-medium">Daily</span>
            </div>
          )}
        </NavLink>
      </nav>

      {/* ── AI Chatbot (floating) ── */}
      <AIChatbot />
    </div>
  );
}
