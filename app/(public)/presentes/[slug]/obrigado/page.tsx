import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabasePublico } from '@/lib/supabase/publico';
import { supabaseServico } from '@/lib/supabase/service';
import { sincronizarPagamento } from '@/lib/mercadopago';
import { brl } from '@/lib/formato';
import BlocoAgradecimento from '@/components/presentes/bloco-agradecimento';

export const metadata: Metadata = { title: 'Obrigado!', robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Busca = Record<string, string | string[] | undefined>;
const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Busca>;
};

// Next 16 (Cache Components): a casca da página é gerada na hora e o conteúdo que depende
// da URL e do banco (params, searchParams, consultas) é enviado dentro do <Suspense>.
export default function Obrigado(props: Props) {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-marfim px-6 text-center text-cacau">
          <p className="font-display text-2xl italic">Confirmando o seu pagamento…</p>
        </main>
      }
    >
      <Conteudo {...props} />
    </Suspense>
  );
}

async function Conteudo({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const paymentId = um(sp.payment_id) ?? um(sp.collection_id);
  const checkout = um(sp.external_reference);
  const retorno = um(sp.status) ?? um(sp.collection_status);

  // Confirma o pagamento direto no Mercado Pago (não confiamos no que veio na URL)
  if (paymentId && /^\d+$/.test(paymentId)) {
    try {
      await sincronizarPagamento(paymentId);
    } catch (e) {
      console.error('[obrigado] sincronizar', e);
    }
  }

  const { data: lista } = await supabasePublico()
    .from('listas_presentes')
    .select('titulo, agradecimento_titulo, agradecimento_mensagem, agradecimento_video_url')
    .eq('slug', slug)
    .maybeSingle();
  if (!lista) notFound();

  let linhas: { nome_convidado: string; valor: number; status: string; presentes: { nome: string } | null }[] = [];
  if (checkout && UUID.test(checkout)) {
    const { data } = await supabaseServico()
      .from('transacoes_presentes')
      .select('nome_convidado, valor, status, presentes(nome)')
      .eq('checkout_id', checkout);
    linhas = (data ?? []) as any;
  }

  const pago = linhas.some((l) => l.status === 'pago');
  const processando =
    !pago && linhas.some((l) => l.status === 'pendente') && !['failure', 'rejected'].includes(retorno ?? '');
  const situacao = pago ? 'pago' : processando ? 'processando' : linhas.length ? 'falhou' : 'desconhecido';

  const primeiroNome = (linhas[0]?.nome_convidado ?? '').split(' ')[0];
  const pagos = linhas.filter((l) => l.status === 'pago');
  const total = pagos.reduce((s, l) => s + Number(l.valor), 0);

  const voltar = `/presentes/${slug}`;
  const botao = 'inline-block rounded-full bg-terracota px-7 py-3 font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2';

  return (
    <main className="min-h-dvh bg-marfim px-6 py-16 text-center text-cacau">
      <div className="mx-auto max-w-2xl space-y-8">
        {situacao === 'pago' && (
          <>
            <h1 className="font-display text-5xl italic leading-tight sm:text-6xl">
              {(lista.agradecimento_titulo ?? 'Obrigado, {nome}!').replace('{nome}', primeiroNome)}
            </h1>
            <div className="mx-auto h-px w-24 bg-ouro" aria-hidden />

            <BlocoAgradecimento
              mensagem={lista.agradecimento_mensagem ?? 'Recebemos o seu carinho e ele significa muito para nós. Foi uma alegria ter você nesse momento.'}
              videoUrl={lista.agradecimento_video_url}
            />

            <section aria-label="Resumo do seu presente" className="mx-auto max-w-md rounded-2xl border border-ouro/30 bg-white/70 p-5 text-left text-sm">
              <ul className="divide-y divide-areia">
                {pagos.map((l, i) => (
                  <li key={i} className="flex justify-between gap-4 py-2">
                    <span>{l.presentes?.nome}</span>
                    <span className="tabular-nums">{brl(Number(l.valor))}</span>
                  </li>
                ))}
                <li className="flex justify-between py-2 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{brl(total)}</span>
                </li>
              </ul>
            </section>

            <Link href={voltar} className={botao}>Voltar para a lista de presentes</Link>
          </>
        )}

        {situacao === 'processando' && (
          <>
            <h1 className="font-display text-4xl italic">Quase lá…</h1>
            <p className="leading-relaxed text-cacau/80">
              Estamos aguardando a confirmação do pagamento. Se você pagou com Pix, isso costuma levar poucos instantes.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={`/presentes/${slug}/obrigado?external_reference=${checkout}${paymentId ? `&payment_id=${paymentId}` : ''}`}
                className={botao}
              >
                Atualizar
              </Link>
              <Link href={voltar} className="rounded-full border border-ouro/40 px-7 py-3">Voltar à lista</Link>
            </div>
          </>
        )}

        {(situacao === 'falhou' || situacao === 'desconhecido') && (
          <>
            <h1 className="font-display text-4xl italic">
              {situacao === 'falhou' ? 'O pagamento não foi concluído' : 'Não encontramos este pagamento'}
            </h1>
            <p className="leading-relaxed text-cacau/80">
              {situacao === 'falhou'
                ? 'Você pode tentar novamente pela lista de presentes quando quiser.'
                : 'Confira o link ou volte à lista de presentes.'}
            </p>
            <Link href={voltar} className={botao}>Voltar para a lista de presentes</Link>
          </>
        )}
      </div>
    </main>
  );
}