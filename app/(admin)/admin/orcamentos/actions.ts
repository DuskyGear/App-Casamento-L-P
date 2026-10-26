'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { exigirAdmin } from '@/lib/supabase/exigir-admin';
import { limparCnpj, validarCnpj } from '@/lib/cnpj';
import { hojeISO, numeroBR } from '@/lib/formato';
import { CATEGORIAS, STATUS_ORCAMENTO } from '@/lib/orcamentos';

type Estado = { erro?: string } | null;

export type DadosFornecedor = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  municipio: string;
  uf: string;
};

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim() || null;
const dataOuNull = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? '');
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

function telefoneBR(t: string) {
  const d = t.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t;
}

/** Busca os dados do CNPJ: primeiro nos fornecedores já cadastrados, depois na Receita (via BrasilAPI). */
export async function buscarCnpj(
  cnpjBruto: string,
): Promise<{ erro: string } | { dados: DadosFornecedor; aviso?: string }> {
  const supabase = await exigirAdmin();
  const cnpj = limparCnpj(cnpjBruto);
  if (!validarCnpj(cnpj)) return { erro: 'CNPJ inválido. Confira os números.' };

  const { data: ja } = await supabase
    .from('fornecedores')
    .select('razao_social, nome_fantasia, email, telefone, municipio, uf')
    .eq('cnpj', cnpj)
    .maybeSingle();
  if (ja) {
    return {
      dados: {
        cnpj,
        razao_social: ja.razao_social,
        nome_fantasia: ja.nome_fantasia ?? '',
        email: ja.email ?? '',
        telefone: ja.telefone ?? '',
        municipio: ja.municipio ?? '',
        uf: ja.uf ?? '',
      },
      aviso: 'Fornecedor já cadastrado: dados carregados do seu cadastro.',
    };
  }

  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 404) return { erro: 'CNPJ não encontrado na Receita. Preencha os dados manualmente.' };
    if (!r.ok) return { erro: 'A consulta está indisponível agora. Preencha manualmente ou tente de novo.' };

    const d = await r.json();
    const situacao = String(d.descricao_situacao_cadastral ?? '').toUpperCase();
    return {
      dados: {
        cnpj,
        razao_social: d.razao_social ?? '',
        nome_fantasia: d.nome_fantasia ?? '',
        email: String(d.email ?? '').toLowerCase(),
        telefone: d.ddd_telefone_1 ? telefoneBR(String(d.ddd_telefone_1)) : '',
        municipio: d.municipio ?? '',
        uf: d.uf ?? '',
      },
      aviso: situacao && situacao !== 'ATIVA' ? `Atenção: situação cadastral ${situacao}.` : undefined,
    };
  } catch {
    return { erro: 'Não foi possível consultar agora. Preencha manualmente ou tente de novo.' };
  }
}

function ler(fd: FormData) {
  const cnpj = limparCnpj(String(fd.get('cnpj') ?? ''));
  if (!validarCnpj(cnpj)) return { erro: 'CNPJ inválido.' };

  const razao = String(fd.get('razao_social') ?? '').trim();
  if (razao.length < 2) return { erro: 'Informe a razão social (use o botão Buscar ou preencha).' };

  const email = (txt(fd, 'email') ?? '').toLowerCase() || null;
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { erro: 'E-mail do fornecedor inválido.' };

  const titulo = String(fd.get('titulo') ?? '').trim();
  if (titulo.length < 2) return { erro: 'Descreva o serviço orçado.' };

  const valor = numeroBR(fd.get('valor'));
  if (!(valor >= 0)) return { erro: 'Informe o valor do orçamento.' };

  const categoria = String(fd.get('categoria'));
  const status = String(fd.get('status'));
  const uf = (txt(fd, 'uf') ?? '').toUpperCase();

  return {
    fornecedor: {
      cnpj,
      razao_social: razao,
      nome_fantasia: txt(fd, 'nome_fantasia'),
      email,
      telefone: txt(fd, 'telefone'),
      municipio: txt(fd, 'municipio'),
      uf: uf.length === 2 ? uf : null,
    },
    orcamento: {
      titulo,
      categoria: categoria in CATEGORIAS ? categoria : 'outros',
      valor,
      data_orcamento: dataOuNull(fd, 'data_orcamento') ?? hojeISO(),
      validade: dataOuNull(fd, 'validade'),
      status: status in STATUS_ORCAMENTO ? status : 'em_analise',
      observacoes: txt(fd, 'observacoes'),
    },
  };
}

const atualizarTelas = () => revalidatePath('/admin', 'layout');

export async function criarOrcamento(_prev: Estado, fd: FormData): Promise<Estado> {
  const supabase = await exigirAdmin();
  const lido = ler(fd);
  if ('erro' in lido) return { erro: lido.erro };

  const { data: f, error: e1 } = await supabase
    .from('fornecedores')
    .upsert(lido.fornecedor, { onConflict: 'cnpj' })
    .select('id')
    .single();
  if (e1) return { erro: e1.message };

  const { error: e2 } = await supabase.from('orcamentos').insert({ fornecedor_id: f.id, ...lido.orcamento });
  if (e2) return { erro: e2.message };

  atualizarTelas();
  redirect('/admin/orcamentos');
}

export async function atualizarOrcamento(id: string, _prev: Estado, fd: FormData): Promise<Estado> {
  const supabase = await exigirAdmin();
  const lido = ler(fd);
  if ('erro' in lido) return { erro: lido.erro };

  const { data: f, error: e1 } = await supabase
    .from('fornecedores')
    .upsert(lido.fornecedor, { onConflict: 'cnpj' })
    .select('id')
    .single();
  if (e1) return { erro: e1.message };

  const { error: e2 } = await supabase
    .from('orcamentos')
    .update({ fornecedor_id: f.id, ...lido.orcamento })
    .eq('id', id);
  if (e2) return { erro: e2.message };

  atualizarTelas();
  redirect('/admin/orcamentos');
}

export async function excluirOrcamento(id: string): Promise<void> {
  const supabase = await exigirAdmin();
  await supabase.from('orcamentos').delete().eq('id', id);
  atualizarTelas();
}