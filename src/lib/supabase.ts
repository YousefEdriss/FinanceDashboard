import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    auth: {
      detectSessionInUrl: false,
      // Use sessionStorage so the session ends when the browser tab is closed.
      // Anyone without the Google account password cannot access the dashboard.
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    },
  },
);
