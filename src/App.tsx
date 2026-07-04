import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import Layout from './components/Layout';
import FinanceDashboard from './pages/FinanceDashboard';
import DailyDashboard from './pages/DailyDashboard';
import { useAuth } from './hooks/useAuth';
import type { User } from '@supabase/supabase-js';

/* ── Sign-in screen ── */
function AuthGate({ onSignIn, error }: { onSignIn: () => void; error: string | null }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#000' }}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full"
          style={{ width: 500, height: 500, top: '-10%', left: '-10%',
            background: 'radial-gradient(circle, rgba(109,40,217,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute rounded-full"
          style={{ width: 400, height: 400, bottom: '-10%', right: '-5%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px' }} />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-xs mx-4 p-8 rounded-2xl text-center"
        style={{ background: 'rgba(14,14,14,0.98)', border: '1px solid rgba(168,85,247,0.28)',
          boxShadow: '0 0 60px rgba(168,85,247,0.12)', animation: 'fade-in-up 0.5s ease forwards' }}>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.5)',
              boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
            <TrendingUp size={18} style={{ color: '#a855f7' }} />
          </div>
          <div className="leading-none text-left">
            <div className="font-mono text-sm font-bold tracking-widest">
              <span className="text-white">MY</span>
              <span style={{ color: '#a855f7', textShadow: '0 0 10px rgba(168,85,247,0.7)' }}>FINANCE</span>
            </div>
            <div className="text-xs font-mono mt-0.5" style={{ color: 'rgba(168,85,247,0.5)', letterSpacing: '0.1em' }}>PERSONAL DASHBOARD</div>
          </div>
        </div>

        <p className="text-xs font-mono mb-4 mt-4" style={{ color: 'rgba(168,85,247,0.5)' }}>
          Sign in to access your dashboard
        </p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg text-xs font-mono text-left"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Google sign-in button */}
        <button onClick={onSignIn}
          className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-3 transition-all duration-300"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.2 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l6.2 5.2C37 38.2 44 33 44 24c0-1.3-.1-2.6-.4-3.9z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-xs font-mono mt-5" style={{ color: '#374151' }}>
          Your data stays private & secure
        </p>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Loading screen ── */
function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4" style={{ background: '#000' }}>
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(168,85,247,0.4)', borderTopColor: '#a855f7' }} />
      <p className="text-xs font-mono tracking-widest" style={{ color: 'rgba(168,85,247,0.6)' }}>LOADING...</p>
    </div>
  );
}

export default function App() {
  const { user, loading, authError, signInWithGoogle, signOut } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) return <AuthGate onSignIn={signInWithGoogle} error={authError} />;

  return (
    <BrowserRouter>
      <Layout user={user as User} onSignOut={signOut}>
        <Routes>
          <Route path="/" element={<FinanceDashboard />} />
          <Route path="/daily" element={<DailyDashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
