'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { exigirAdmin } from '@/lib/supabase/exigir-admin';

type Estado = { erro?: string } | null;

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim() || null;

function ler(fd: FormData) {
  const nome = String(fd.get('nome') ?? '').trim();
  const email = txt(fd, 'email');
  const acompanhantes = parseInt(String(fd.get('acompanhantes') ?? '0'), 10);

  if (nome.length < 2) return { erro: 'Informe o nome do convidado.' };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { erro: 'E-mail inválido.' };
  if (!(acompanhantes >= 0 && acompanhantes <= 20)) return { erro: 'Acompanhantes: informe um número de 0 a 20.' };

  const lado = ['noiva', 'noivo', 'ambos'].includes(String(fd.get('lado'))) ? String(fd.get('lado')) : 'ambos';
  const status = ['pendente', 'confirmado', 'recusado'].includes(String(fd.get('status_rsvp')))
    ? String(fd.get('status_rsvp'))
    : 'pendente';

  return {
    campos: {
      nome,
      email,
      telefone: txt(fd, 'telefone'),
      lado,
      grupo: txt(fd, 'grupo'),
      acompanhantes,
      status_rsvp: status,
      restricao_alimentar: txt(fd, 'restricao_alimentar'),
      observacoes: txt(fd, 'observacoes'),
    },
  };
}

const atualizarTelas = () => revalidatePath('/admin', 'layout');

export async function criarConvidado(_prev: Estado, fd: FormData): Promise<Estado> {
  const supabase = await exigirAdmin();
  const lido = ler(fd);
  if ('erro' in lido) return { erro: lido.erro };

  const { error } = await supabase.from('convidados').insert(lido.campos);
  if (error) return { erro: error.message };

  atualizarTelas();
  redirect('/admin/convidados');
}

export async function atualizarConvidado(id: string, _prev: Estado, fd: FormData): Promise<Estado> {
  const supabase = await exigirAdmin();
  const lido = ler(fd);
  if ('erro' in lido) return { erro: lido.erro };

  const { error } = await supabase.from('convidados').update(lido.campos).eq('id', id);
  if (error) return { erro: error.message };

  atualizarTelas();
  redirect('/admin/convidados');
}

export async function excluirConvidado(id: string): Promise<void> {
  const supabase = await exigirAdmin();
  await supabase.from('convidados').delete().eq('id', id);
  atualizarTelas();
}