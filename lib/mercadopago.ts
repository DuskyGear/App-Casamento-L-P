import crypto from 'node:crypto';
import { supabaseServico } from '@/lib/supabase/service';

const API = 'https://api.mercadopago.com';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ConfigMP = { token: string; webhookSecret: string | null; ambiente: 'teste' | 'producao' };

/** Lê a integração ativa (com segredos). Só roda no servidor. */
export async function obterConfigMP(): Promise<ConfigMP | null> {
  const svc = supabaseServico();
  const [{ data: i }, { data: s }] = await Promise.all([
    svc.from('integracoes').select('ativo, ambiente').eq('provedor', 'mercadopago').maybeSingle(),
    svc.from('integracoes_segredos').select('access_token, webhook_secret').eq('provedor', 'mercadopago').maybeSingle(),
  ]);
  if (!i?.ativo || !s?.access_token) return null;
  return { token: s.access_token, webhookSecret: s.webhook_secret ?? null, ambiente: i.ambiente };
}

/** Data no formato que o Mercado Pago espera (fuso de Brasília). */
export const dataMP = (d: Date) => new Date(d.getTime() - 3 * 3600_000).toISOString().replace('Z', '-03:00');

export async function criarPreferencia(cfg: ConfigMP, corpo: unknown): Promise<{ id: string; url: string }> {
  const r = await fetch(`${API}/checkout/preferences`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.init_point) throw new Error(`Mercado Pago ${r.status}: ${j?.message ?? 'falha ao criar preferência'}`);
  return { id: String(j.id), url: String(j.init_point) };
}

/** null = pagamento inexistente (404). Outros erros lançam exceção (o webhook responde 500 e o MP tenta de novo). */
async function buscarPagamento(cfg: ConfigMP, id: string) {
  const r = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Mercado Pago respondeu ${r.status} ao consultar o pagamento`);
  return r.json();
}

/** Valida o cabeçalho x-signature das notificações (HMAC-SHA256). */
export function assinaturaValida(o: { secret: string; xSignature: string | null; xRequestId: string | null; dataId: string }) {
  if (!o.xSignature) return false;
  let ts = '';
  let v1 = '';
  for (const parte of o.xSignature.split(',')) {
    const [k, v] = parte.split('=').map((s) => s.trim());
    if (k === 'ts') ts = v;
    if (k === 'v1') v1 = v;
  }
  if (!ts || !v1) return false;
  const manifesto = `id:${o.dataId.toLowerCase()};request-id:${o.xRequestId ?? ''};ts:${ts};`;
  const esperado = crypto.createHmac('sha256', o.secret).update(manifesto).digest('hex');
  const a = Buffer.from(esperado);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const traduzirStatus = (s: string) =>
  s === 'approved' ? 'pago'
  : s === 'refunded' || s === 'charged_back' ? 'estornado'
  : s === 'rejected' || s === 'cancelled' ? 'cancelado'
  : null; // pending, in_process, etc.

const traduzirMetodo = (t: string) =>
  t === 'bank_transfer' ? 'pix' : t === 'credit_card' || t === 'debit_card' ? 'cartao' : null;

/**
 * Consulta o pagamento DIRETO no Mercado Pago (fonte da verdade) e atualiza as transações do carrinho.
 * É idempotente: pode ser chamada várias vezes (webhook + página de obrigado).
 * A trigger do banco soma o valor em presentes.valor_arrecadado e marca o presente como quitado.
 */
export async function sincronizarPagamento(paymentId: string) {
  const cfg = await obterConfigMP();
  if (!cfg) return { ok: false as const, motivo: 'integração inativa' };

  const p = await buscarPagamento(cfg, paymentId);
  if (!p) return { ok: false as const, motivo: 'pagamento não encontrado' };

  const checkoutId = String(p.external_reference ?? '');
  if (!UUID.test(checkoutId)) return { ok: false as const, motivo: 'pagamento de outra origem' };

  const svc = supabaseServico();
  const { data: linhas, error } = await svc.from('transacoes_presentes').select('valor').eq('checkout_id', checkoutId);
  if (error) throw error;
  if (!linhas?.length) return { ok: false as const, motivo: 'carrinho desconhecido' };

  const novo = traduzirStatus(String(p.status));
  const metodo = traduzirMetodo(String(p.payment_type_id));
  const comuns = { mp_payment_id: String(p.id), ...(metodo ? { metodo } : {}) };
  const tabela = () => svc.from('transacoes_presentes');
  let alteradas = 0;

  if (novo === 'pago') {
    // trava de segurança: o valor pago precisa bater com o carrinho
    const total = linhas.reduce((s, l) => s + Number(l.valor), 0);
    if (Math.abs(Number(p.transaction_amount) - total) > 0.01) {
      console.error('[mercadopago] valor divergente', { paymentId, pago: p.transaction_amount, esperado: total });
      return { ok: false as const, motivo: 'valor divergente' };
    }
    const { data, error: e } = await tabela()
      .update({ ...comuns, status: 'pago', pago_em: p.date_approved ?? new Date().toISOString() })
      .eq('checkout_id', checkoutId)
      .in('status', ['pendente', 'expirado', 'cancelado'])
      .select('id');
    if (e) throw e;
    alteradas = data?.length ?? 0;
  } else if (novo === 'estornado') {
    const { data, error: e } = await tabela().update({ ...comuns, status: 'estornado' }).eq('checkout_id', checkoutId).eq('status', 'pago').select('id');
    if (e) throw e;
    alteradas = data?.length ?? 0;
  } else if (novo === 'cancelado') {
    const { data, error: e } = await tabela().update({ ...comuns, status: 'cancelado' }).eq('checkout_id', checkoutId).eq('status', 'pendente').select('id');
    if (e) throw e;
    alteradas = data?.length ?? 0;
  } else {
    const { error: e } = await tabela().update(comuns).eq('checkout_id', checkoutId).eq('status', 'pendente');
    if (e) throw e;
  }

  return { ok: true as const, status: novo ?? 'pendente', alteradas };
}