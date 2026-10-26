import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BotaoExcluir from '@/components/admin/botao-excluir';
import { excluirPadrinho } from './actions';

const rotuloStatus: Record<string, string> = { pendente: 'Sem resposta', aceito: 'Aceitou', recusado: 'Recusou' };
const seloStatus: Record<string, string> = { pendente: 'bg-petala', aceito: 'bg-ouro/20', recusado: 'bg-areia text-cacau/60' };

export default async function Padrinhos() {
  const supabase = await createClient();
  const { data } = await supabase.from('padrinhos').select('*').order('lado', { ascending: false }).order('nome');
  const itens = data ?? [];

  const stats = [
    ['Total de padrinhos', String(itens.length)],
    ['Do lado do noivo', String(itens.filter((p) => p.lado === 'noivo').length)],
    ['Do lado da noiva', String(itens.filter((p) => p.lado === 'noiva').length)],
    ['Aceitaram', `${itens.filter((p) => p.status_convite === 'aceito').length}/${itens.length}`],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Padrinhos e madrinhas</h1>
        <Link href="/admin/padrinhos/novo" className="rounded-full bg-terracota px-5 py-2.5 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2">
          Novo padrinho
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

      <div className="overflow-x-auto rounded-2xl border border-ouro/30 bg-white/70">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-areia">
            <tr>{['Nome', 'Papel', 'Lado', 'Função', 'Convite', ''].map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {itens.map((p) => (
              <tr key={p.id} className="border-b border-areia align-top last:border-0">
                <td className="px-4 py-3">
                  {p.nome}
                  <span className="block text-xs text-cacau/60">{[p.telefone, p.email].filter(Boolean).join(' · ')}</span>
                </td>
                <td className="px-4 py-3">{p.papel === 'madrinha' ? 'Madrinha' : 'Padrinho'}</td>
                <td className="px-4 py-3">{p.lado === 'noiva' ? 'Noiva' : 'Noivo'}</td>
                <td className="px-4 py-3">{p.funcao ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${seloStatus[p.status_convite]}`}>{rotuloStatus[p.status_convite]}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link href={`/admin/padrinhos/${p.id}`} className="underline underline-offset-4">Editar</Link>
                    <BotaoExcluir acao={excluirPadrinho.bind(null, p.id)} nome={p.nome} />
                  </div>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-cacau/60">Nenhum padrinho ainda. Clique em “Novo padrinho”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}