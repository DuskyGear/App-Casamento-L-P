import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ListaPresentes, { type Presente } from '@/components/presentes/lista-presentes';

// Cliente Supabase público sem leitura de cookies (100% compatível com "use cache")
const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function PaginaPresentes({ params }: { params: Promise<{ slug: string }> }) {
  "use cache";

  const { slug } = await params;

  const { data: lista } = await supabasePublic
    .from('listas_presentes')
    .select('id, titulo, mensagem')
    .eq('slug', slug)
    .maybeSingle();

  if (!lista) notFound();

  const { data: presentes } = await supabasePublic
    .from('presentes')
    .select(
      'id, nome, descricao, imagem_url, tipo, valor_meta, valor_arrecadado, valor_minimo_contribuicao, status',
    )
    .eq('lista_id', lista.id)
    .order('ordem');

  return <ListaPresentes lista={lista} presentes={(presentes ?? []) as Presente[]} />;
}