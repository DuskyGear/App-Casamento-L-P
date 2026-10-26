'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function entrar(
  _prev: { erro?: string } | null,
  formData: FormData,
): Promise<{ erro?: string } | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('senha') ?? ''),
  });
  if (error) return { erro: 'E-mail ou senha incorretos.' };
  redirect('/admin');
}