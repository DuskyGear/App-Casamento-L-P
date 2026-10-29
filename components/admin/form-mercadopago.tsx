'use client';

import { useActionState, useState, useTransition } from 'react';
import { salvarMercadoPago, testarMercadoPago } from '@/app/(admin)/admin/integracoes/actions';

type Estado = { erro?: string; ok?: string } | null;

export default function FormMercadoPago({
  inicial,
}: {
  inicial: { ativo: boolean; ambiente: 'teste' | 'producao'; tokenFinal: string | null; temSegredo: boolean };
}) {
  const [estado, action, salvando] = useActionState<Estado, FormData>(salvarMercadoPago, null);
  const [testando, iniciarTeste] = useTransition();
  const [teste, setTeste] = useState<{ ok: boolean; msg: string } | null>(null);

  const campo =
    'w-full rounded-xl border border-ouro/40 bg-white/70 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-terracota';
  const rotulo = 'mb-1 block text-sm font-medium';

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <label className="flex items-center gap-3">
        <input type="checkbox" name="ativo" defaultChecked={inicial.ativo} className="size-5 accent-terracota" />
        <span>
          <span className="font-medium">Integração ativa</span>
          <span className="block text-sm text-cacau/70">Quando desligada, a lista pública não consegue iniciar pagamentos.</span>
        </span>
      </label>

      <div>
        <label htmlFor="ambiente" className={rotulo}>Ambiente</label>
        <select id="ambiente" name="ambiente" defaultValue={inicial.ambiente} className={campo}>
          <option value="teste">Teste (credenciais de teste)</option>
          <option value="producao">Produção (pagamentos reais)</option>
        </select>
        <p className="mt-1 text-sm text-cacau/60">É só uma etiqueta para você: quem define se o pagamento é real é o Access Token usado.</p>
      </div>

      <div>
        <label htmlFor="access_token" className={rotulo}>Access Token</label>
        <input id="access_token" name="access_token" type="password" autoComplete="off" spellCheck={false}
          placeholder={inicial.tokenFinal ? `Configurado (termina em ${inicial.tokenFinal}). Deixe em branco para manter.` : 'Cole o Access Token do Mercado Pago'}
          className={campo} />
      </div>

      <div>
        <label htmlFor="webhook_secret" className={rotulo}>Assinatura secreta do webhook (recomendado)</label>
        <input id="webhook_secret" name="webhook_secret" type="password" autoComplete="off" spellCheck={false}
          placeholder={inicial.temSegredo ? 'Configurada. Deixe em branco para manter.' : 'Cole a assinatura secreta gerada no painel do Mercado Pago'}
          className={campo} />
      </div>

      {estado?.erro && <p role="alert" className="rounded-xl bg-petala/60 px-4 py-3 text-sm text-terracota">{estado.erro}</p>}
      {estado?.ok && <p role="status" className="rounded-xl bg-ouro/15 px-4 py-3 text-sm">{estado.ok}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={salvando}
          className="rounded-full bg-terracota px-6 py-3 font-medium text-white focus-visible:ring-2 focus-visible:ring-terracota focus-visible:ring-offset-2 disabled:opacity-50">
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" disabled={testando || !inicial.tokenFinal}
          onClick={() => { setTeste(null); iniciarTeste(async () => setTeste(await testarMercadoPago())); }}
          className="rounded-full border border-terracota px-6 py-3 font-medium text-terracota focus-visible:ring-2 focus-visible:ring-terracota disabled:opacity-40">
          {testando ? 'Testando…' : 'Testar conexão'}
        </button>
      </div>

      {teste && (
        <p role="status" className={`rounded-xl px-4 py-3 text-sm ${teste.ok ? 'bg-ouro/15' : 'bg-petala/60 text-terracota'}`}>{teste.msg}</p>
      )}
    </form>
  );
}