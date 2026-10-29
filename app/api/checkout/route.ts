import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { supabaseServico } from '@/lib/supabase/service';
import { criarPreferencia, dataMP, obterConfigMP } from '@/lib/mercadopago';

const erro = (msg: string, status: number) => NextResponse.json({ erro: msg }, { status });
const arredondar = (n: number) => Math.round(n * 100) / 100;

export async function POST(req: Request) {
  const corpo = await req.json().catch(() => null);
  const slug = String(corpo?.slug ?? '');
  const nome = String(corpo?.nome ?? '').trim();
  const email = String(corpo?.email ?? '').trim();
  const mensagem = String(corpo?.mensagem ?? '').trim().slice(0, 500) || null;
  const itens: { presente_id: string; valor: number }[] = Array.isArray(corpo?.itens) ? corpo.itens : [];

  if (!/^[a-z0-9-]+$/.test(slug)) return erro('Lista inválida.', 400);
  if (nome.length < 2 || nome.length > 120) return erro('Informe seu nome.', 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return erro('Informe um e-mail válido.', 400);
  if (itens.length < 1 || itens.length > 20) return erro('Seu carrinho está vazio.', 400);

  const ids = itens.map((i) => String(i.presente_id));
  if (new Set(ids).size !== ids.length) return erro('Presente repetido no carrinho.', 400);

  const cfg = await obterConfigMP();
  if (!cfg) return erro('Os pagamentos online estão indisponíveis no momento.', 503);

  const svc = supabaseServico();

  const { data: lista } = await svc.from('listas_presentes').select('id').eq('slug', slug).eq('ativa', true).maybeSingle();
  if (!lista) return erro('Lista não encontrada.', 404);

  const { data: presentes } = await svc
    .from('presentes')
    .select('id, nome, tipo, valor_meta')
    .eq('lista_id', lista.id)
    .eq('ativo', true)
    .in('id', ids);
  if (!presentes || presentes.length !== ids.length) return erro('Algum presente não está mais disponível.', 409);

  // O servidor decide o valor: unitário = preço cadastrado; coletivo = valor informado (validado pelo banco)
  const checkoutId = randomUUID();
  const agora = new Date();
  const expira = new Date(agora.getTime() + 30 * 60_000);

  const linhas = [];
  for (const it of itens) {
    const p = presentes.find((x) => x.id === it.presente_id)!;
    const valor = p.tipo === 'unitario' ? Number(p.valor_meta) : arredondar(Number(it.valor));
    if (!Number.isFinite(valor) || valor <= 0) return erro('Valor inválido.', 400);
    linhas.push({
      checkout_id: checkoutId,
      presente_id: p.id,
      nome_convidado: nome,
      email,
      mensagem,
      valor,
      status: 'pendente',
      expira_em: expira.toISOString(),
    });
  }

  // As regras (já escolhido, mínimo, restante da meta) são validadas pela trigger do banco
  const { error: eInsert } = await svc.from('transacoes_presentes').insert(linhas);
  if (eInsert) {
    if (eInsert.code === 'P0001') return erro(eInsert.message, 409);
    console.error('[checkout] insert', eInsert);
    return erro('Não foi possível registrar seu pedido. Tente novamente.', 500);
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin).replace(/\/$/, '');
  const publico = base.startsWith('https://'); // o Mercado Pago só chama URLs públicas
  const voltar = `${base}/presentes/${slug}/obrigado`;

  try {
    const pref = await criarPreferencia(cfg, {
      items: linhas.map((l) => {
        const p = presentes.find((x) => x.id === l.presente_id)!;
        return {
          id: p.id,
          title: p.tipo === 'coletivo' ? `Contribuição: ${p.nome}` : p.nome,
          quantity: 1,
          unit_price: l.valor,
          currency_id: 'BRL',
        };
      }),
      payer: { name: nome, email },
      external_reference: checkoutId,
      back_urls: { success: voltar, pending: voltar, failure: voltar },
      ...(publico ? { auto_return: 'approved', notification_url: `${base}/api/webhooks/mercadopago` } : {}),
      expires: true,
      expiration_date_from: dataMP(agora),
      expiration_date_to: dataMP(expira),
    });

    await svc.from('transacoes_presentes').update({ mp_preference_id: pref.id }).eq('checkout_id', checkoutId);
    return NextResponse.json({ url: pref.url });
  } catch (e) {
    console.error('[checkout] preferência', e);
    // libera a reserva
    await svc.from('transacoes_presentes').update({ status: 'cancelado' }).eq('checkout_id', checkoutId);
    return erro('Não foi possível iniciar o pagamento. Tente novamente em instantes.', 502);
  }
}