'use client';

import { useEffect, useMemo, useState } from 'react';
import ContadorCasamento from '@/components/contador-casamento';

/* ------------------------------------------------------------------ */
/* Tipos e utilitários                                                 */
/* ------------------------------------------------------------------ */

export type Presente = {
  id: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  tipo: 'unitario' | 'coletivo';
  valor_meta: number;
  valor_arrecadado: number;
  valor_minimo_contribuicao: number;
  status: 'disponivel' | 'quitado';
};

type Lista = { titulo: string; mensagem: string | null };

/** Carrinho: id do presente → valor em centavos */
type Carrinho = Record<string, number>;

const brl = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const brlCents = (cents: number) => brl(cents / 100);

const toCents = (reais: number) => Math.round(reais * 100);

const restanteCents = (p: Presente) => Math.max(0, toCents(p.valor_meta - p.valor_arrecadado));

const SUGESTOES = [5000, 10000, 20000]; // R$ 50, 100, 200

/* ------------------------------------------------------------------ */
/* Barra de progresso (anima uma vez, ao entrar na tela)               */
/* ------------------------------------------------------------------ */

function BarraProgresso({ arrecadado, meta }: { arrecadado: number; meta: number }) {
  const pct = Math.min(100, Math.round((arrecadado / meta) * 100));
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setLargura(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div>
      <div
        role="progressbar"
        aria-label="Quanto já foi arrecadado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2.5 w-full overflow-hidden rounded-full bg-areia"
      >
        <div
          className="h-full rounded-full bg-ouro transition-[width] duration-[1400ms] ease-out motion-reduce:transition-none"
          style={{ width: `${largura}%` }}
        />
      </div>
      <p className="mt-2 flex items-baseline justify-between text-sm text-cacau/80">
        <span>
          {brl(arrecadado)} de {brl(meta)}
        </span>
        <span className="font-semibold text-cacau">{pct}%</span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cartão de presente (renderização condicional por tipo)              */
/* ------------------------------------------------------------------ */

function CartaoPresente({
  presente: p,
  valorNoCarrinho,
  onAdicionar,
  onRemover,
}: {
  presente: Presente;
  valorNoCarrinho?: number;
  onAdicionar: (id: string, cents: number) => void;
  onRemover: (id: string) => void;
}) {
  const quitado = p.status === 'quitado';
  const coletivo = p.tipo === 'coletivo';
  const noCarrinho = valorNoCarrinho !== undefined;

  // input de valor (guarda só dígitos = centavos)
  const [digitos, setDigitos] = useState('');
  const cents = digitos ? parseInt(digitos, 10) : 0;
  const rest = restanteCents(p);
  const minimo = Math.min(toCents(p.valor_minimo_contribuicao), rest);
  const invalido = coletivo && (cents < minimo || cents > rest);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border border-ouro/30 bg-white/70 ${
        quitado ? 'opacity-60' : ''
      }`}
    >
      {p.imagem_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imagem_url} alt={p.nome} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center bg-petala font-display text-5xl text-ouro">
          {p.nome.charAt(0)}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-5">
        <header>
          <h3 className="font-display text-xl leading-snug">{p.nome}</h3>
          {p.descricao && <p className="mt-1 text-sm leading-relaxed text-cacau/75">{p.descricao}</p>}
        </header>

        {/* ---------- UNITÁRIO: preço fixo ---------- */}
        {!coletivo && (
          <p className="font-display text-2xl">{brl(p.valor_meta)}</p>
        )}

        {/* ---------- COLETIVO: barra de progresso ---------- */}
        {coletivo && <BarraProgresso arrecadado={p.valor_arrecadado} meta={p.valor_meta} />}

        <div className="mt-auto space-y-3">
          {quitado ? (
            <p className="rounded-full bg-areia px-4 py-2 text-center text-sm font-medium">
              {coletivo ? 'Meta alcançada, obrigado!' : 'Já foi presenteado'}
            </p>
          ) : coletivo ? (
            /* ---------- COLETIVO: valor livre ---------- */
            <>
              <label className="block text-sm font-medium" htmlFor={`valor-${p.id}`}>
                Quanto você quer contribuir?
              </label>
              <input
                id={`valor-${p.id}`}
                inputMode="numeric"
                autoComplete="off"
                placeholder="R$ 0,00"
                value={cents ? brlCents(cents) : ''}
                onChange={(e) => setDigitos(e.target.value.replace(/\D/g, '').slice(0, 9).replace(/^0+/, ''))}
                aria-invalid={cents > 0 && invalido}
                aria-describedby={`ajuda-${p.id}`}
                className="w-full rounded-xl border border-ouro/40 bg-marfim px-4 py-3 text-lg tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-terracota"
              />
              <div className="flex flex-wrap gap-2">
                {SUGESTOES.filter((s) => s <= rest).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDigitos(String(s))}
                    className="rounded-full border border-ouro/40 px-3 py-1.5 text-sm hover:bg-areia focus-visible:ring-2 focus-visible:ring-terracota"
                  >
                    {brlCents(s)}
                  </button>
                ))}
              </div>
              <p
                id={`ajuda-${p.id}`}
                className={`text-xs ${cents > 0 && invalido ? 'text-terracota' : 'text-cacau/60'}`}
              >
                {cents > 0 && invalido
                  ? `Informe um valor entre ${brlCents(minimo)} e ${brlCents(rest)}.`
                  : `Mínimo de ${brlCents(minimo)}.`}
              </p>
              <button
                type="button"
                disabled={invalido}
                onClick={() => onAdicionar(p.id, cents)}
                className="w-full rounded-full bg-terracota px-5 py-3 font-medium text-white transition-colors hover:bg-terracota/90 focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {noCarrinho ? 'Atualizar contribuição' : 'Adicionar contribuição'}
              </button>
            </>
          ) : (
            /* ---------- UNITÁRIO: um clique ---------- */
            <button
              type="button"
              onClick={() => (noCarrinho ? onRemover(p.id) : onAdicionar(p.id, toCents(p.valor_meta)))}
              className={`w-full rounded-full px-5 py-3 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2 ${
                noCarrinho
                  ? 'border border-terracota text-terracota hover:bg-petala/50'
                  : 'bg-terracota text-white hover:bg-terracota/90'
              }`}
            >
              {noCarrinho ? 'Remover da lista' : 'Presentear'}
            </button>
          )}

          {noCarrinho && coletivo && !quitado && (
            <p className="flex items-center justify-between text-sm">
              <span>Na sua lista: {brlCents(valorNoCarrinho!)}</span>
              <button type="button" onClick={() => onRemover(p.id)} className="underline underline-offset-2">
                Remover
              </button>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Checkout: cria o pedido no servidor e leva para o Mercado Pago      */
/* ------------------------------------------------------------------ */

function Checkout({
  slug,
  itens,
  totalCents,
  onFechar,
}: {
  slug: string;
  itens: { presente: Presente; cents: number }[];
  totalCents: number;
  onFechar: () => void;
}) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !enviando && onFechar();
    // ao voltar do Mercado Pago pelo botão "voltar" do navegador, libera o botão
    const onShow = () => setEnviando(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pageshow', onShow);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pageshow', onShow);
    };
  }, [enviando, onFechar]);

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          nome: nome.trim(),
          email: email.trim(),
          mensagem: mensagem.trim() || null,
          itens: itens.map(({ presente, cents }) => ({ presente_id: presente.id, valor: cents / 100 })),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) {
        setErro(j.erro ?? 'Não foi possível iniciar o pagamento. Tente novamente.');
        setEnviando(false);
        return;
      }
      window.location.href = j.url; // Checkout Pro do Mercado Pago
    } catch {
      setErro('Falha de conexão. Verifique sua internet e tente novamente.');
      setEnviando(false);
    }
  }

  const campo =
    'w-full rounded-xl border border-ouro/40 bg-marfim px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-terracota';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-cacau/50 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-checkout"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-marfim p-6 sm:rounded-3xl"
      >
        <form onSubmit={pagar} className="space-y-5">
          <h2 id="titulo-checkout" className="font-display text-2xl">
            Finalizar presente
          </h2>

          <ul className="divide-y divide-areia rounded-2xl border border-ouro/30 bg-white/70 text-sm">
            {itens.map(({ presente, cents }) => (
              <li key={presente.id} className="flex justify-between gap-4 px-4 py-3">
                <span>{presente.nome}</span>
                <span className="tabular-nums">{brlCents(cents)}</span>
              </li>
            ))}
            <li className="flex justify-between px-4 py-3 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{brlCents(totalCents)}</span>
            </li>
          </ul>

          <div className="space-y-3">
            <input required autoFocus minLength={2} placeholder="Seu nome" value={nome}
              onChange={(e) => setNome(e.target.value)} className={campo} aria-label="Seu nome" />
            <input required type="email" placeholder="Seu e-mail" value={email}
              onChange={(e) => setEmail(e.target.value)} className={campo} aria-label="Seu e-mail" />
            <textarea rows={3} maxLength={500} placeholder="Deixe uma mensagem para os noivos (opcional)"
              value={mensagem} onChange={(e) => setMensagem(e.target.value)} className={campo}
              aria-label="Mensagem para os noivos" />
          </div>

          <p className="text-sm text-cacau/70">
            Você será levado ao ambiente seguro do Mercado Pago para escolher Pix, cartão ou outra forma de pagamento.
          </p>

          {erro && <p role="alert" className="rounded-xl bg-petala/60 px-4 py-3 text-sm text-terracota">{erro}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onFechar} disabled={enviando}
              className="rounded-full border border-ouro/40 px-5 py-3 focus-visible:ring-2 focus-visible:ring-terracota disabled:opacity-50">
              Voltar
            </button>
            <button type="submit" disabled={enviando}
              className="flex-1 rounded-full bg-terracota px-5 py-3 font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2 disabled:opacity-50">
              {enviando ? 'Abrindo o pagamento…' : `Ir para o pagamento · ${brlCents(totalCents)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Componente principal                                                */
/* ------------------------------------------------------------------ */

export default function ListaPresentes({
  lista,
  presentes,
  slug,
  dataCasamento,
}: {
  lista: Lista;
  presentes: Presente[];
  slug: string;
  dataCasamento?: string | null;
}) {
  const [carrinho, setCarrinho] = useState<Carrinho>({});
  const [checkoutAberto, setCheckoutAberto] = useState(false);

  const itens = useMemo(
    () =>
      presentes
        .filter((p) => carrinho[p.id] !== undefined)
        .map((p) => ({ presente: p, cents: carrinho[p.id] })),
    [presentes, carrinho],
  );
  const totalCents = itens.reduce((soma, i) => soma + i.cents, 0);

  const adicionar = (id: string, cents: number) => setCarrinho((c) => ({ ...c, [id]: cents }));
  const remover = (id: string) =>
    setCarrinho((c) => {
      const { [id]: _removido, ...resto } = c;
      return resto;
    });

  return (
    <main className="min-h-dvh bg-marfim pb-32 text-cacau">
      <header className="mx-auto max-w-2xl px-6 pb-10 pt-16 text-center sm:pt-24">
        <h1 className="font-display text-5xl italic leading-tight sm:text-6xl">{lista.titulo}</h1>
        <div className="mx-auto my-6 h-px w-24 bg-ouro" aria-hidden />
        {lista.mensagem && <p className="font-display text-lg leading-relaxed text-cacau/80">{lista.mensagem}</p>}
      </header>

      {dataCasamento && (
        <ContadorCasamento
          data={dataCasamento}
          className={`mx-auto mb-10 w-fit md:fixed md:right-6 md:z-30 md:m-0 ${
            itens.length > 0 ? 'md:bottom-24' : 'md:bottom-6'
          }`}
        />
      )}

      <section aria-label="Presentes" className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
        {presentes.map((p) => (
          <CartaoPresente
            key={p.id}
            presente={p}
            valorNoCarrinho={carrinho[p.id]}
            onAdicionar={adicionar}
            onRemover={remover}
          />
        ))}
      </section>

      {itens.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ouro/40 bg-marfim/95 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <p className="text-sm">
              {itens.length} {itens.length === 1 ? 'presente' : 'presentes'}
              <span className="block font-display text-xl tabular-nums">{brlCents(totalCents)}</span>
            </p>
            <button
              type="button"
              onClick={() => setCheckoutAberto(true)}
              className="rounded-full bg-terracota px-6 py-3 font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2"
            >
              Finalizar presente
            </button>
          </div>
        </div>
      )}

      {checkoutAberto && (
        <Checkout
          slug={slug}
          itens={itens}
          totalCents={totalCents}
          onFechar={() => setCheckoutAberto(false)}
        />
      )}
    </main>
  );
}