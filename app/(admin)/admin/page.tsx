import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { marcarPago, cancelarTransacao } from './actions';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const quando = (s: string) =>
  new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

const selo: Record<string, string> = {
  pago: 'bg-ouro/20',
  pendente: 'bg-petala',
  cancelado: 'bg-areia text-cacau/60',
  expirado: 'bg-areia text-cacau/60',
  estornado: 'bg-areia text-cacau/60',
};

export default async function Painel() {
  const supabase = await createClient();

  const [{ data: resumo }, { data: pendentes }, { data: txs }, { data: lista }] = await Promise.all([
    supabase.from('vw_resumo_presentes').select('*').order('nome'),
    supabase.from('transacoes_presentes').select('valor').eq('status', 'pendente'),
    supabase
      .from('transacoes_presentes')
      .select('id, nome_convidado, mensagem, valor, metodo, status, criado_em, presentes(nome)')
      .order('criado_em', { ascending: false })
      .limit(20),
    supabase.from('listas_presentes').select('slug').order('criado_em').limit(1).maybeSingle(),
  ]);

  const itens = resumo ?? [];
  const arrecadado = itens.reduce((s, p) => s + Number(p.valor_arrecadado), 0);
  const meta = itens.reduce((s, p) => s + Number(p.valor_meta), 0);
  const aguardando = (pendentes ?? []).reduce((s, t) => s + Number(t.valor), 0);
  const concluidos = itens.filter((p) => Number(p.percentual) >= 100).length;

  const cartoes = [
    ['Arrecadado', brl(arrecadado), meta ? `${Math.round((arrecadado / meta) * 100)}% da meta total` : ''],
    ['Aguardando pagamento', brl(aguardando), `${pendentes?.length ?? 0} contribuições`],
    ['Meta total da lista', brl(meta), `${itens.length} presentes`],
    ['Presentes concluídos', `${concluidos}/${itens.length}`, ''],
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl">Painel</h1>
        {lista && (
          <Link href={`/presentes/${lista.slug}`} target="_blank" className="text-sm underline underline-offset-4">
            Ver lista pública
          </Link>
        )}
      </div>

      <section aria-label="Resumo" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartoes.map(([titulo, valor, nota]) => (
          <div key={titulo} className="rounded-2xl border border-ouro/30 bg-white/70 p-5">
            <p className="text-sm text-cacau/70">{titulo}</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{valor}</p>
            {nota && <p className="mt-1 text-xs text-cacau/60">{nota}</p>}
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl">Presentes</h2>
        <div className="overflow-x-auto rounded-2xl border border-ouro/30 bg-white/70">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-areia">
              <tr>{['Presente', 'Tipo', 'Meta', 'Arrecadado', 'Progresso', 'Pagamentos'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {itens.map((p) => (
                <tr key={p.id} className="border-b border-areia last:border-0">
                  <td className="px-4 py-3">{p.nome}</td>
                  <td className="px-4 py-3">{p.tipo === 'coletivo' ? 'Coletivo' : 'Unitário'}</td>
                  <td className="px-4 py-3 tabular-nums">{brl(Number(p.valor_meta))}</td>
                  <td className="px-4 py-3 tabular-nums">{brl(Number(p.valor_arrecadado))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-areia">
                        <div className="h-full bg-ouro" style={{ width: `${Number(p.percentual)}%` }} />
                      </div>
                      <span className="tabular-nums">{Number(p.percentual)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.qtd_pagamentos}</td>
                </tr>
              ))}
              {itens.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-cacau/60">Nenhum presente cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl">Últimas contribuições</h2>
        <div className="overflow-x-auto rounded-2xl border border-ouro/30 bg-white/70">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-areia">
              <tr>{['Quando', 'Convidado', 'Presente', 'Valor', 'Forma', 'Status', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(txs ?? []).map((t: any) => (
                <tr key={t.id} className="border-b border-areia last:border-0 align-top">
                  <td className="px-4 py-3 whitespace-nowrap">{quando(t.criado_em)}</td>
                  <td className="px-4 py-3">
                    {t.nome_convidado}
                    {t.mensagem && <span className="block max-w-xs text-xs text-cacau/60">“{t.mensagem}”</span>}
                  </td>
                  <td className="px-4 py-3">{t.presentes?.nome}</td>
                  <td className="px-4 py-3 tabular-nums">{brl(Number(t.valor))}</td>
                  <td className="px-4 py-3">{t.metodo === 'pix' ? 'Pix' : t.metodo === 'cartao' ? 'Cartão' : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${selo[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {t.status === 'pendente' && (
                      <div className="flex gap-2">
                        <form action={marcarPago.bind(null, t.id)}>
                          <button className="rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">Marcar como pago</button>
                        </form>
                        <form action={cancelarTransacao.bind(null, t.id)}>
                          <button className="rounded-full border border-ouro/40 px-3 py-1 text-xs">Cancelar</button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {(txs ?? []).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-cacau/60">Ainda não há contribuições.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}