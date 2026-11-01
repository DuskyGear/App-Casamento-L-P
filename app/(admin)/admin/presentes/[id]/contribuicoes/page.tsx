import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { brl } from '@/lib/formato';
import { marcarPago, cancelarTransacao } from '../../../actions';

const quando = (s: string) =>
  new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

const selo: Record<string, string> = {
  pago: 'bg-ouro/30',
  pendente: 'bg-petala',
  cancelado: 'bg-areia text-cacau/60',
  expirado: 'bg-areia text-cacau/60',
  estornado: 'bg-areia text-cacau/60',
};

export default async function Contribuicoes({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: p }, { data: txs }] = await Promise.all([
    supabase.from('presentes').select('nome, tipo, valor_meta, valor_arrecadado').eq('id', id).maybeSingle(),
    supabase
      .from('transacoes_presentes')
      .select('id, nome_convidado, mensagem, valor, metodo, status, criado_em')
      .eq('presente_id', id)
      .order('criado_em', { ascending: false }),
  ]);
  if (!p) notFound();

  const lista = txs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/presentes" className="text-sm underline underline-offset-4">← Presentes</Link>
        <h1 className="mt-2 font-display text-3xl">{p.nome}</h1>
        <p className="mt-1 text-sm text-cacau/70">
          Arrecadado: <strong className="tabular-nums">{brl(Number(p.valor_arrecadado))}</strong> de{' '}
          <span className="tabular-nums">{brl(Number(p.valor_meta))}</span>
        </p>
      </div>

      <h2 className="font-display text-2xl">Contribuições</h2>

      <ul className="space-y-3">
        {lista.map((t) => (
          <li key={t.id} className="rounded-2xl border border-ouro/30 bg-white/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-medium">{t.nome_convidado}</p>
                <p className="text-xs text-cacau/60">
                  {quando(t.criado_em)} · {t.metodo === 'pix' ? 'Pix' : t.metodo === 'cartao' ? 'Cartão' : '—'}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-xl tabular-nums">{brl(Number(t.valor))}</p>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${selo[t.status]}`}>{t.status}</span>
              </div>
            </div>

            {t.mensagem && <p className="mt-3 text-sm text-cacau/80">“{t.mensagem}”</p>}

            {t.status === 'pendente' && (
              <div className="mt-3 flex gap-2 border-t border-areia pt-3">
                <form action={marcarPago.bind(null, t.id)}>
                  <button className="rounded-full bg-terracota px-4 py-2 text-xs font-medium text-white">Marcar como pago</button>
                </form>
                <form action={cancelarTransacao.bind(null, t.id)}>
                  <button className="rounded-full border border-ouro/40 px-4 py-2 text-xs">Cancelar</button>
                </form>
              </div>
            )}
          </li>
        ))}
        {lista.length === 0 && (
          <li className="rounded-2xl border border-ouro/30 bg-white/70 px-4 py-8 text-center text-cacau/60">
            Ainda não há contribuições para este presente.
          </li>
        )}
      </ul>
    </div>
  );
}