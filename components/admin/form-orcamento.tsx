'use client';

import { useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { formatarCnpj } from '@/lib/cnpj';
import { CATEGORIAS, STATUS_ORCAMENTO } from '@/lib/orcamentos';
import { buscarCnpj } from '@/app/(admin)/admin/orcamentos/actions';

type Estado = { erro?: string } | null;

export type OrcamentoForm = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  municipio: string;
  uf: string;
  titulo: string;
  categoria: string;
  valor: number;
  data_orcamento: string;
  validade: string;
  status: string;
  observacoes: string;
};

const vazio: OrcamentoForm = {
  cnpj: '', razao_social: '', nome_fantasia: '', email: '', telefone: '', municipio: '', uf: '',
  titulo: '', categoria: 'outros', valor: 0, data_orcamento: '', validade: '', status: 'em_analise', observacoes: '',
};

export default function FormOrcamento({
  action,
  inicial,
}: {
  action: (prev: Estado, fd: FormData) => Promise<Estado>;
  inicial?: OrcamentoForm;
}) {
  const editando = !!inicial;
  const [estado, formAction, salvando] = useActionState(action, null);
  const [buscando, iniciarBusca] = useTransition();
  const [aviso, setAviso] = useState<{ ok: boolean; msg: string } | null>(null);
  const [f, setF] = useState(() => {
    const b = inicial ?? vazio;
    return { ...b, cnpj: formatarCnpj(b.cnpj) };
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  function buscar() {
    setAviso(null);
    iniciarBusca(async () => {
      const r = await buscarCnpj(f.cnpj);
      if ('erro' in r) return setAviso({ ok: false, msg: r.erro });
      setF((s) => ({ ...s, ...r.dados, cnpj: formatarCnpj(r.dados.cnpj) }));
      setAviso({ ok: !r.aviso || r.aviso.startsWith('Fornecedor'), msg: r.aviso ?? 'Dados preenchidos. Confira antes de salvar.' });
    });
  }

  const campo =
    'w-full rounded-xl border border-ouro/40 bg-white/70 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-terracota read-only:bg-areia/60';
  const rotulo = 'mb-1 block text-sm font-medium';
  const secao = 'font-display text-xl';

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {/* ---------- Fornecedor ---------- */}
      <h2 className={secao}>Fornecedor</h2>

      <div>
        <label htmlFor="cnpj" className={rotulo}>CNPJ</label>
        <div className="flex gap-2">
          <input
            id="cnpj" name="cnpj" required inputMode="text" autoComplete="off" placeholder="00.000.000/0000-00"
            value={f.cnpj} readOnly={editando}
            onChange={(e) => setF((s) => ({ ...s, cnpj: formatarCnpj(e.target.value) }))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (!editando) buscar(); } }}
            className={campo}
          />
          {!editando && (
            <button type="button" onClick={buscar} disabled={buscando || f.cnpj.length < 18}
              className="shrink-0 rounded-xl border border-terracota px-5 font-medium text-terracota focus-visible:ring-2 focus-visible:ring-terracota disabled:opacity-40">
              {buscando ? 'Buscando…' : 'Buscar'}
            </button>
          )}
        </div>
        <p aria-live="polite" className={`mt-1 text-sm ${aviso ? (aviso.ok ? 'text-cacau/70' : 'text-terracota') : 'text-cacau/60'}`}>
          {aviso?.msg ?? 'Digite o CNPJ e clique em Buscar para preencher os dados automaticamente.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="razao_social" className={rotulo}>Razão social</label>
          <input id="razao_social" name="razao_social" required value={f.razao_social} onChange={set('razao_social')} className={campo} />
        </div>
        <div>
          <label htmlFor="nome_fantasia" className={rotulo}>Nome fantasia</label>
          <input id="nome_fantasia" name="nome_fantasia" value={f.nome_fantasia} onChange={set('nome_fantasia')} className={campo} />
        </div>
        <div>
          <label htmlFor="telefone" className={rotulo}>Telefone</label>
          <input id="telefone" name="telefone" type="tel" value={f.telefone} onChange={set('telefone')} className={campo} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="email" className={rotulo}>E-mail</label>
          <input id="email" name="email" type="email" value={f.email} onChange={set('email')} className={campo} />
        </div>
        <div>
          <label htmlFor="municipio" className={rotulo}>Cidade</label>
          <input id="municipio" name="municipio" value={f.municipio} onChange={set('municipio')} className={campo} />
        </div>
        <div>
          <label htmlFor="uf" className={rotulo}>UF</label>
          <input id="uf" name="uf" maxLength={2} value={f.uf} onChange={set('uf')} className={`${campo} uppercase`} />
        </div>
      </div>

      {/* ---------- Orçamento ---------- */}
      <h2 className={`${secao} pt-2`}>Orçamento</h2>

      <div>
        <label htmlFor="titulo" className={rotulo}>O que foi orçado</label>
        <input id="titulo" name="titulo" required defaultValue={inicial?.titulo} placeholder="Ex.: Buffet completo para 120 convidados" className={campo} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="categoria" className={rotulo}>Categoria</label>
          <select id="categoria" name="categoria" defaultValue={inicial?.categoria ?? 'outros'} className={campo}>
            {Object.entries(CATEGORIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="valor" className={rotulo}>Valor (R$)</label>
          <input id="valor" name="valor" required inputMode="decimal" placeholder="Ex.: 18.500,00"
            defaultValue={inicial ? inicial.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''} className={campo} />
        </div>
        <div>
          <label htmlFor="data_orcamento" className={rotulo}>Data do orçamento</label>
          <input id="data_orcamento" name="data_orcamento" type="date" defaultValue={inicial?.data_orcamento} className={campo} />
        </div>
        <div>
          <label htmlFor="validade" className={rotulo}>Válido até (opcional)</label>
          <input id="validade" name="validade" type="date" defaultValue={inicial?.validade} className={campo} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="status" className={rotulo}>Situação</label>
          <select id="status" name="status" defaultValue={inicial?.status ?? 'em_analise'} className={campo}>
            {Object.entries(STATUS_ORCAMENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="observacoes" className={rotulo}>Observações</label>
        <textarea id="observacoes" name="observacoes" rows={4} defaultValue={inicial?.observacoes}
          placeholder="Condições de pagamento, o que está incluso, contato, pontos de atenção…" className={campo} />
      </div>

      {estado?.erro && (
        <p role="alert" className="rounded-xl bg-petala/60 px-4 py-3 text-sm text-terracota">{estado.erro}</p>
      )}

      <div className="flex gap-3">
        <Link href="/admin/orcamentos" className="rounded-full border border-ouro/40 px-6 py-3 focus-visible:ring-2 focus-visible:ring-terracota">Cancelar</Link>
        <button disabled={salvando}
          className="rounded-full bg-terracota px-6 py-3 font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2 disabled:opacity-50">
          {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar orçamento'}
        </button>
      </div>
    </form>
  );
}