import { createClient } from '@supabase/supabase-js';

/**
 * Cliente SEM cookies, para a página pública. Como não depende do usuário,
 * o Next pode guardar a página em cache (ISR) e servi-la direto do CDN.
 */
export const supabasePublico = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });