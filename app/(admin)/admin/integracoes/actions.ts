'use server';

import { revalidatePath } from 'next/cache';
import { exigirAdmin } from '@/lib/supabase/exigir-admin';
import { supabaseServico } from '@/lib/supabase/service';

type Estado = { erro?: string; ok?: string } | null;

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

export async function salvarMercadoPago(_prev: Estado, fd: FormData): Promise<Estado> {
  const supabase = await exigirAdmin();
  const ativo = fd.get('ativo') === 'on';
  const ambiente = txt(fd, 'ambiente') === 'producao' ? 'producao' : 'teste';
  const token = txt(fd, 'access_token');
  const segredo = txt(fd, 'webhook_secret');

  if (token && !/^[A-Za-z0-9_-]{20,}$/.test(token)) return { erro: 'O Access Token parece inválido. Copie-o novamente do painel do Mercado Pago.' };

  let svc;
  try {
    svc = supabaseServico();
  } catch {
    return { erro: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente do projeto.' };
  }

  const { data: atual } = await svc.from('integracoes_segredos').select('access_token').eq('provedor', 'mercadopago').maybeSingle();
  if (ativo && !token && !atual?.access_token) return { erro: 'Informe o Access Token para ativar a integração.' };

  // dados não sensíveis (passam pelo RLS do admin)
  const { error: e1 } = await supabase.from('integracoes').upsert({
    provedor: 'mercadopago',
    ativo,
    ambiente,
    ...(token ? { token_final: token.slice(-4) } : {}),
    ...(segredo ? { webhook_configurado: true } : {}),
  });
  if (e1) return { erro: e1.message };

  // segredos (somente servidor). Campos em branco mantêm o valor atual.
  if (token || segredo) {
    const { error: e2 } = await svc.from('integracoes_segredos').upsert({
      provedor: 'mercadopago',
      ...(token ? { access_token: token } : {}),
      ...(segredo ? { webhook_secret: segredo } : {}),
    });
    if (e2) return { erro: e2.message };
  }

  revalidatePath('/admin/integracoes', 'layout');
  return { ok: 'Configurações salvas.' };
}

/** Confere se o Access Token salvo é aceito pelo Mercado Pago. */
export async function testarMercadoPago(): Promise<{ ok: boolean; msg: string }> {
  await exigirAdmin();
  try {
    const { data } = await supabaseServico().from('integracoes_segredos').select('access_token').eq('provedor', 'mercadopago').maybeSingle();
    if (!data?.access_token) return { ok: false, msg: 'Salve o Access Token primeiro.' };

    const r = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 401 || r.status === 403) return { ok: false, msg: 'O Mercado Pago recusou o Access Token. Confira se copiou o token correto.' };
    if (!r.ok) return { ok: false, msg: `O Mercado Pago respondeu com erro ${r.status}. Tente de novo.` };

    const u = await r.json();
    return { ok: true, msg: `Conexão ok. Conta: ${u.nickname ?? u.email ?? 'sem apelido'} (ID ${u.id}).` };
  } catch {
    return { ok: false, msg: 'Não foi possível testar agora. Verifique a variável SUPABASE_SERVICE_ROLE_KEY e tente de novo.' };
  }
}