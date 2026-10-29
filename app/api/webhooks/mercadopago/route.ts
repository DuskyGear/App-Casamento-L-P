import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { assinaturaValida, obterConfigMP, sincronizarPagamento } from '@/lib/mercadopago';

const ok = () => NextResponse.json({ ok: true });

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const corpo = await req.json().catch(() => null);

    const tipo = url.searchParams.get('type') ?? url.searchParams.get('topic') ?? corpo?.type ?? corpo?.topic;
    const idQuery = url.searchParams.get('data.id');
    const dataId = idQuery ?? url.searchParams.get('id') ?? corpo?.data?.id;
    if (tipo !== 'payment' || !dataId) return ok(); // outros tipos de evento: ignorar

    const cfg = await obterConfigMP();
    if (!cfg) return ok();

    // Se você cadastrou a assinatura secreta, só aceitamos notificações assinadas pelo Mercado Pago
    if (cfg.webhookSecret) {
      const valido = assinaturaValida({
        secret: cfg.webhookSecret,
        xSignature: req.headers.get('x-signature'),
        xRequestId: req.headers.get('x-request-id'),
        dataId: String(idQuery ?? dataId),
      });
      if (!valido) return NextResponse.json({ erro: 'assinatura inválida' }, { status: 401 });
    }

    // Mesmo assim, nunca confiamos no corpo: o pagamento é consultado direto na API do Mercado Pago
    const r = await sincronizarPagamento(String(dataId));

    if (r.ok && r.alteradas > 0) {
      revalidatePath('/presentes/[slug]', 'page'); // vitrine atualiza na hora
      revalidatePath('/admin', 'layout');
    }
    return ok();
  } catch (e) {
    console.error('[webhook mercadopago]', e);
    return NextResponse.json({ erro: 'falha ao processar' }, { status: 500 }); // o Mercado Pago tenta de novo
  }
}