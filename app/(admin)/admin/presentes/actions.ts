'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { exigirAdmin } from '@/lib/supabase/exigir-admin';

type Estado = { erro?: string } | null;

/** Aceita "389,90", "50.000,00" ou "389.90". */
function numero(v: FormDataEntryValue | null): number {
  let s = String(v ?? '').replace(/[R$\s]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return s === '' ? NaN : Number(s);
}

function lerCampos(fd: FormData, tipo: 'unitario' | 'coletivo') {
  const nome = String(fd.get('nome') ?? '').trim();
  const meta = numero(fd.get('valor_meta'));
  const minimo = tipo === 'coletivo' ? numero(fd.get('valor_minimo_contribuicao')) : meta;

  if (nome.length < 2) return { erro: 'Informe o nome do presente.' };
  if (!(meta > 0)) return { erro: 'Informe um valor maior que zero.' };
  if (tipo === 'coletivo' && (!(minimo > 0) || minimo > meta))
    return { erro: 'A contribuição mínima deve ser maior que zero e não pode passar da meta.' };

  return {
    campos: {
      nome,
      descricao: String(fd.get('descricao') ?? '').trim() || null,
      imagem_url: String(fd.get('imagem_url') ?? '').trim() || null,
      valor_meta: meta,
      valor_minimo_contribuicao: minimo,
      ordem: parseInt(String(fd.get('ordem') ?? '0'), 10) || 0,
      ativo: fd.get('ativo') === 'on',
    },
  };
}

function atualizarTelas() {
  revalidatePath('/admin', 'layout');
  revalidatePath('/presentes/[slug]', 'page');
}

export async function criarPresente(_prev: Estado, fd: FormData): Promise<Estado> {
  const supabase = await exigirAdmin();
  const tipo = fd.get('tipo') === 'coletivo' ? 'coletivo' : 'unitario';

  const lido = lerCampos(fd, tipo);
  if ('erro' in lido) return { erro: lido.erro };

  const { data: lista } = await supabase
    .from('listas_presentes')
    .select('id')
    .order('criado_em')
    .limit(1)
    .maybeSingle();
  if (!lista) return { erro: 'Nenhuma lista encontrada. Rode o SQL que cria a lista "nosso-casamento".' };

  const { error } = await supabase.from('presentes').insert({ lista_id: lista.id, tipo, ...lido.campos });
  if (error) return { erro: error.message };

  atualizarTelas();
  redirect('/admin/presentes');
}

export async function atualizarPresente(id: string, _prev: Estado, fd: FormData): Promise<Estado> {
  const supabase = await exigirAdmin();

  const { data: atual } = await supabase
    .from('presentes')
    .select('tipo, valor_arrecadado')
    .eq('id', id)
    .maybeSingle();
  if (!atual) return { erro: 'Presente não encontrado.' };

  // o tipo não muda depois de criado
  const lido = lerCampos(fd, atual.tipo);
  if ('erro' in lido) return { erro: lido.erro };

  const status = atual.valor_arrecadado >= lido.campos.valor_meta ? 'quitado' : 'disponivel';
  const { error } = await supabase.from('presentes').update({ ...lido.campos, status }).eq('id', id);
  if (error) return { erro: error.message };

  atualizarTelas();
  redirect('/admin/presentes');
}