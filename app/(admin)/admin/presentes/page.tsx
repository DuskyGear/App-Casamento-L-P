import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AcoesPresente from '@/components/admin/acoes-presente';
import { brl } from '@/lib/formato';

type Presente = {
  id: string;
  nome: string;
  tipo: 'unitario' | 'coletivo';
  valor_meta: number;
  valor_arrecadado: number;
  status: 'disponivel' | 'quitado';
  ativo: boolean;
  imagem_url: string | null;
};

/** Selo único por presente: Concluído > Oculto > Cota > Ativo */
function selo(p: Presente) {
  if (p.status === 'quitado') return { texto: 'Concluído', cor: 'bg-ouro/30' };
  if (!p.ativo) return { texto: 'Oculto', cor: 'bg-areia text-cacau/60' };
  if (p.tipo === 'coletivo') return { texto: 'Cota', cor: 'bg-petala' };
  return { texto: 'Ativo', cor: 'bg-areia' };
}

const percentual = (p: Presente) =>
  Math.min(100, Math.round((Number(p.valor_arrecadado) / Number(p.valor_meta)) * 100));

function Miniatura({ p }: { p: Presente }) {
  return p.imagem_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.imagem_url} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
  ) : (
    <div aria-hidden className="grid size-16 shrink-0 place-items-center rounded-xl bg-petala font-display text-2xl text-ouro">
      {p.nome.charAt(0)}
    </div>
  );
}

function Progresso({ p, fino = true }: { p: Presente; fino?: boolean }) {
  const pct = percentual(p);
  return (
    <div>
      <div
        role="progressbar"
        aria-label={`Arrecadado de ${p.nome}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className={`w-full overflow-hidden rounded-full bg-areia ${fino ? 'h-1.5' : 'h-2'}`}
      >
        <div className="h-full rounded-full bg-ouro" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 flex items-baseline justify-between text-xs text-cacau/80">
        <span className="tabular-nums">
          {brl(Number(p.valor_arrecadado))} / {brl(Number(p.valor_meta))}
        </span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </p>
    </div>
  );
}

export default async function Presentes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('presentes')
    .select('id, nome, tipo, valor_meta, valor_arrecadado, status, ativo, imagem_url')
    .order('ordem')
    .order('criado_em');
  const itens = (data ?? []) as Presente[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Presentes</h1>
        <Link href="/admin/presentes/novo"
          className="rounded-full bg-terracota px-5 py-2.5 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2">
          Novo presente
        </Link>
      </div>

      {itens.length === 0 && (
        <p className="rounded-2xl border border-ouro/30 bg-white/70 px-4 py-8 text-center text-cacau/60">
          Nenhum presente ainda. Clique em “Novo presente”.
        </p>
      )}

      {/* ---------- Celular: cards compactos ---------- */}
      <ul className="space-y-3 md:hidden">
        {itens.map((p) => {
          const s = selo(p);
          return (
            <li key={p.id} className="rounded-2xl border border-ouro/30 bg-white/70 p-4">
              <div className="flex gap-3">
                <Miniatura p={p} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="break-words font-display text-lg leading-snug">{p.nome}</h2>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${s.cor}`}>{s.texto}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-cacau/60">
                    {p.tipo === 'coletivo' ? 'Financiamento coletivo' : 'Presente único'}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Progresso p={p} />
              </div>

              <div className="mt-3 border-t border-areia pt-3">
                <AcoesPresente id={p.id} nome={p.nome} ativo={p.ativo} />
              </div>
            </li>
          );
        })}
      </ul>

      {/* ---------- Computador: tabela ---------- */}
      {itens.length > 0 && (
        <div className="hidden overflow-x-auto rounded-2xl border border-ouro/30 bg-white/70 md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-areia">
              <tr>{['Presente', 'Tipo', 'Arrecadado', 'Situação', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {itens.map((p) => {
                const s = selo(p);
                return (
                  <tr key={p.id} className="border-b border-areia last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Miniatura p={p} />
                        <span>{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.tipo === 'coletivo' ? 'Coletivo' : 'Unitário'}</td>
                    <td className="w-64 px-4 py-3"><Progresso p={p} /></td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${s.cor}`}>{s.texto}</span>
                    </td>
                    <td className="px-4 py-3">
                      <AcoesPresente id={p.id} nome={p.nome} ativo={p.ativo} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}