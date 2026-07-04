import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    auth: {
      // We handle the OAuth code exchange manually so we can catch and show errors
      detectSessionInUrl: false,
      persistSession: true,
    },
  },
);
