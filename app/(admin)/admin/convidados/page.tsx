import Link from 'next/link';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import BotaoExcluir from '@/components/admin/botao-excluir';
import { excluirConvidado } from './actions';

const rotuloStatus: Record<string, string> = { pendente: 'Pendente', confirmado: 'Confirmado', recusado: 'Não vai' };
const seloStatus: Record<string, string> = { pendente: 'bg-petala', confirmado: 'bg-ouro/20', recusado: 'bg-areia text-cacau/60' };
const rotuloLado: Record<string, string> = { noiva: 'Noiva', noivo: 'Noivo', ambos: 'Ambos' };

export default async function Convidados({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await connection();

  const { status, q } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from('convidados').select('*').order('nome');
  const todos = data ?? [];

  const pessoas = (c: { acompanhantes: number }) => 1 + c.acompanhantes;
  const confirmados = todos.filter((c) => c.status_rsvp === 'confirmado');
  const stats = [
    ['Convites (famílias/pessoas)', String(todos.length)],
    ['Pessoas confirmadas', String(confirmados.reduce((s, c) => s + pessoas(c), 0))],
    ['Aguardando resposta', String(todos.filter((c) => c.status_rsvp === 'pendente').length)],
    ['Não vão', String(todos.filter((c) => c.status_rsvp === 'recusado').length)],
  ];

  const termo = (q ?? '').trim().toLowerCase();
  const itens = todos.filter(
    (c) =>
      (!status || c.status_rsvp === status) &&
      (!termo || `${c.nome} ${c.grupo ?? ''}`.toLowerCase().includes(termo)),
  );

  const aba = (valor: string | undefined, texto: string) => (
    <Link
      key={texto}
      href={valor ? `/admin/convidados?status=${valor}` : '/admin/convidados'}
      aria-current={status === valor || (!status && !valor) ? 'page' : undefined}
      className={`rounded-full border px-4 py-1.5 text-sm ${
        status === valor || (!status && !valor) ? 'border-cacau bg-cacau text-marfim' : 'border-ouro/40'
      }`}
    >
      {texto}
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Convidados</h1>
        <Link href="/admin/convidados/novo" className="rounded-full bg-terracota px-5 py-2.5 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2">
          Novo convidado
        </Link>
      </div>

      <section aria-label="Resumo" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([t, v]) => (
          <div key={t} className="rounded-2xl border border-ouro/30 bg-white/70 p-5">
            <p className="text-sm text-cacau/70">{t}</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{v}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {aba(undefined, 'Todos')}
          {aba('pendente', 'Pendentes')}
          {aba('confirmado', 'Confirmados')}
          {aba('recusado', 'Não vão')}
        </div>
        <form className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Buscar por nome ou grupo" aria-label="Buscar convidado"
            className="rounded-full border border-ouro/40 bg-white/70 px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-terracota" />
          <button className="rounded-full border border-ouro/40 px-4 py-2 text-sm">Buscar</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ouro/30 bg-white/70">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-areia">
            <tr>{['Nome', 'Lado', 'Grupo', 'Acomp.', 'Presença', ''].map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {itens.map((c) => (
              <tr key={c.id} className="border-b border-areia align-top last:border-0">
                <td className="px-4 py-3">
                  {c.nome}
                  <span className="block text-xs text-cacau/60">{[c.telefone, c.email].filter(Boolean).join(' · ')}</span>
                  {c.restricao_alimentar && <span className="block text-xs text-cacau/60">Restrição: {c.restricao_alimentar}</span>}
                </td>
                <td className="px-4 py-3">{rotuloLado[c.lado]}</td>
                <td className="px-4 py-3">{c.grupo ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums">{c.acompanhantes}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${seloStatus[c.status_rsvp]}`}>{rotuloStatus[c.status_rsvp]}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link href={`/admin/convidados/${c.id}`} className="underline underline-offset-4">Editar</Link>
                    <BotaoExcluir acao={excluirConvidado.bind(null, c.id)} nome={c.nome} />
                  </div>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-cacau/60">
                {todos.length === 0 ? 'Nenhum convidado ainda. Clique em “Novo convidado”.' : 'Nenhum convidado encontrado com esse filtro.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}