import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Usado dentro das server actions: só segue se o usuário logado estiver na tabela `admins`. */
export async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ehAdmin } = await supabase.rpc('is_admin');
  if (!ehAdmin) redirect('/login');

  return supabase;
}