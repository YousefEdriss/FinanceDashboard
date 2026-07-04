import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Safety net: if Supabase never fires INITIAL_SESSION (e.g. totally unreachable),
    // unblock the UI after 15 seconds.
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 15000);

    // onAuthStateChange is the single source of truth.
    // INITIAL_SESSION fires once after client init (including any PKCE code exchange),
    // so it correctly handles the post-OAuth redirect case.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        clearTimeout(timeout);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, loading, signInWithGoogle, signOut };
}
