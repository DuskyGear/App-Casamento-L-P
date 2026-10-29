import Link from 'next/link';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import FormMercadoPago from '@/components/admin/form-mercadopago';

export default async function PaginaMercadoPago() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('integracoes')
    .select('ativo, ambiente, token_final, webhook_configurado')
    .eq('provedor', 'mercadopago')
    .maybeSingle();

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`).replace(/\/$/, '');
  const webhookUrl = `${base}/api/webhooks/mercadopago`;
  const semChaveServico = !process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/integracoes" className="text-sm underline underline-offset-4">← Integrações</Link>
        <h1 className="mt-2 font-display text-3xl">Mercado Pago</h1>
      </div>

      {semChaveServico && (
        <p role="alert" className="max-w-2xl rounded-xl bg-petala/60 px-4 py-3 text-sm text-terracota">
          A variável <strong>SUPABASE_SERVICE_ROLE_KEY</strong> não está configurada neste ambiente. Sem ela não é possível salvar
          credenciais nem processar pagamentos.
        </p>
      )}

      <FormMercadoPago
        inicial={{
          ativo: data?.ativo ?? false,
          ambiente: (data?.ambiente as 'teste' | 'producao') ?? 'teste',
          tokenFinal: data?.token_final ?? null,
          temSegredo: data?.webhook_configurado ?? false,
        }}
      />

      <section className="max-w-2xl space-y-3 rounded-2xl border border-ouro/30 bg-white/70 p-6 text-sm leading-relaxed">
        <h2 className="font-display text-xl">Como configurar</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Em <strong>mercadopago.com.br/developers</strong>, abra <em>Suas integrações</em> e crie uma aplicação
            (produto: <em>Checkout Pro</em>).
          </li>
          <li>Em <em>Credenciais</em>, copie o <strong>Access Token</strong> (de teste, para começar) e cole acima.</li>
          <li>
            Em <em>Webhooks</em>, informe esta URL e marque o evento <strong>Pagamentos</strong>:
            <code className="mt-1 block break-all rounded-lg bg-areia px-3 py-2 text-xs">{webhookUrl}</code>
          </li>
          <li>Ainda em Webhooks, revele a <strong>assinatura secreta</strong>, copie e cole acima.</li>
          <li>Marque <em>Integração ativa</em>, salve e clique em <em>Testar conexão</em>.</li>
        </ol>
        <p className="text-cacau/70">
          Para pagar em modo teste, use <em>usuários e cartões de teste</em> do Mercado Pago. Quando for ao ar, troque pelo Access Token de
          produção e o ambiente para Produção.
        </p>
      </section>
    </div>
  );
}