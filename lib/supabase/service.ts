import { createClient } from '@supabase/supabase-js';

/**
 * Cliente com a chave de serviço (service_role / secret key): IGNORA o RLS.
 * Use SOMENTE em código de servidor (route handlers, server actions, server components).
 * Nunca importe em arquivos com 'use client'.
 */
export function supabaseServico() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error('Variável SUPABASE_SERVICE_ROLE_KEY não configurada.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}