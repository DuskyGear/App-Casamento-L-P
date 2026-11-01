'use server';

import { revalidatePath } from 'next/cache';
import { exigirAdmin } from '@/lib/supabase/exigir-admin';

type Estado = { erro?: string; ok?: string } | null;

export async function salvarConfiguracoes(_prev: Estado, fd: FormData): Promise<Estado> {
  const supabase = await exigirAdmin();
  const remover = fd.get('acao') === 'remover';

  let valor: string | null = null;
  if (!remover) {
    const data = String(fd.get('data') ?? '');
    const hora = String(fd.get('hora') || '16:00');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) {
      return { erro: 'Informe a data e o horário do casamento.' };
    }
    // horário de Brasília (o Brasil não usa mais horário de verão)
    const d = new Date(`${data}T${hora}:00-03:00`);
    if (Number.isNaN(d.getTime())) return { erro: 'Data inválida.' };
    valor = d.toISOString();
  }

  const { data: lista } = await supabase.from('listas_presentes').select('id').order('criado_em').limit(1).maybeSingle();
  if (!lista) return { erro: 'Nenhuma lista encontrada. Rode o SQL que cria a lista "nosso-casamento".' };

  const { error } = await supabase.from('listas_presentes').update({ data_casamento: valor }).eq('id', lista.id);
  if (error) return { erro: error.message };

  revalidatePath('/admin', 'layout');
  revalidatePath('/presentes/[slug]', 'page');
  return { ok: remover ? 'Data removida.' : 'Data salva. A contagem já aparece no painel e na lista de presentes.' };
}