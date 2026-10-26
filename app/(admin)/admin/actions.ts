'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { exigirAdmin } from '@/lib/supabase/exigir-admin';

function atualizarTelas() {
  revalidatePath('/admin', 'layout');
  revalidatePath('/presentes/[slug]', 'page');
}

export async function sair(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/** Confirma um pagamento manualmente (ex.: Pix recebido direto na conta). A trigger do banco atualiza o valor arrecadado. */
export async function marcarPago(id: string): Promise<void> {
  const supabase = await exigirAdmin();
  await supabase
    .from('transacoes_presentes')
    .update({ status: 'pago', pago_em: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pendente');
  atualizarTelas();
}

export async function cancelarTransacao(id: string): Promise<void> {
  const supabase = await exigirAdmin();
  await supabase.from('transacoes_presentes').update({ status: 'cancelado' }).eq('id', id).eq('status', 'pendente');
  atualizarTelas();
}

export async function alternarAtivo(id: string, ativo: boolean): Promise<void> {
  const supabase = await exigirAdmin();
  await supabase.from('presentes').update({ ativo }).eq('id', id);
  atualizarTelas();
}