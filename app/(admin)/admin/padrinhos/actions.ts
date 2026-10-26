'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { exigirAdmin } from '@/lib/supabase/exigir-admin';

type Estado = { erro?: string } | null;

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim() || null;

function ler(fd: FormData) {
  const nome = String(fd.get('nome') ?? '').trim();
  const email = txt(fd, 'email');

  if (nome.length < 2) return { erro: 'Informe o nome.' };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { erro: 'E-mail inválido.' };

  const um = (k: string, validos: string[], padrao: string) =>
    validos.includes(String(fd.get(k))) ? String(fd.get(k)) : padrao;

  return {
    campos: {
      nome,
      papel: um('papel', ['padrinho', 'madrinha'], 'padrinho'),
      lado: um('lado', ['noivo', 'noiva'], 'noivo'),
      funcao: txt(fd, 'funcao'),
      email,
      telefone: txt(fd, 'telefone'),
      status_convite: um('status_convite', ['pendente', 'aceito', 'recusado'], 'pendente'),
      observacoes: txt(fd, 'observacoes'),
    },
  };
}

const atualizarTelas = () => revalidatePath('/admin', 'layout');

export async function criarPadrinho(_prev: Estado, fd: FormData): Promise<Estado> {
  const supabase = await exigirAdmin();
  const lido = ler(fd);
  if ('erro' in lido) return { erro: lido.erro };

  const { error } = await supabase.from('padrinhos').insert(lido.campos);
  if (error) return { erro: error.message };

  atualizarTelas();
  redirect('/admin/padrinhos');
}

export async function atualizarPadrinho(id: string, _prev: Estado, fd: FormData): Promise<Estado> {
  const supabase = await exigirAdmin();
  const lido = ler(fd);
  if ('erro' in lido) return { erro: lido.erro };

  const { error } = await supabase.from('padrinhos').update(lido.campos).eq('id', id);
  if (error) return { erro: error.message };

  atualizarTelas();
  redirect('/admin/padrinhos');
}

export async function excluirPadrinho(id: string): Promise<void> {
  const supabase = await exigirAdmin();
  await supabase.from('padrinhos').delete().eq('id', id);
  atualizarTelas();
}