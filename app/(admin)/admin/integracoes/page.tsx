import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { INTEGRACOES } from '@/lib/integracoes';

export default async function Integracoes() {
  const supabase = await createClient();
  const { data } = await supabase.from('integracoes').select('provedor, ativo, ambiente, token_final');
  const porId = Object.fromEntries((data ?? []).map((i) => [i.provedor, i]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Integrações</h1>
        <p className="mt-1 text-sm text-cacau/70">Conecte os meios de pagamento da lista de presentes.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRACOES.map((i) => {
          const cfg = porId[i.id];
          const situacao = !i.disponivel ? 'Em breve' : cfg?.ativo ? 'Ativa' : cfg?.token_final ? 'Desativada' : 'Não configurada';
          return (
            <article key={i.id} className={`flex flex-col gap-3 rounded-2xl border border-ouro/30 bg-white/70 p-5 ${i.disponivel ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-xl">{i.nome}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${cfg?.ativo ? 'bg-ouro/30' : 'bg-areia'}`}>{situacao}</span>
              </div>
              <p className="text-sm text-cacau/75">{i.descricao}</p>
              {cfg?.ativo && <p className="text-xs text-cacau/60">Ambiente: {cfg.ambiente === 'producao' ? 'produção' : 'teste'}</p>}
              {i.disponivel && (
                <Link href={`/admin/integracoes/${i.id}`} className="mt-auto self-start rounded-full border border-terracota px-5 py-2 text-sm font-medium text-terracota focus-visible:ring-2 focus-visible:ring-terracota">
                  Configurar
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}