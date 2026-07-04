import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 15000);

    // onAuthStateChange is the single source of truth for session state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        clearTimeout(timeout);
        setLoading(false);
      }
    });

    // Manually handle OAuth callback — detectSessionInUrl is false so we do this ourselves
    async function handleOAuthCallback() {
      // Check for OAuth error first
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('error');
      const oauthErrorDesc = params.get('error_description');

      if (oauthError) {
        if (!cancelled) setAuthError(oauthErrorDesc || oauthError);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // PKCE flow: code in query string
      const code = params.get('code');
      if (code) {
        window.history.replaceState({}, document.title, window.location.pathname);
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled && error) {
          setAuthError(`Sign-in failed: ${error.message}`);
        }
        return;
      }

      // Implicit flow fallback: tokens in URL hash
      const hash = new URLSearchParams(window.location.hash.replace('#', ''));
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');
      if (accessToken && refreshToken) {
        window.history.replaceState({}, document.title, window.location.pathname);
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!cancelled && error) {
          setAuthError(`Sign-in failed: ${error.message}`);
        }
      }
    }

    handleOAuthCallback();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    setAuthError(null);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, loading, authError, signInWithGoogle, signOut };
}
