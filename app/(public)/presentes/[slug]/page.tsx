import { notFound } from 'next/navigation';
import { unstable_cacheLife as cacheLife } from 'next/cache';
import { supabasePublico } from '@/lib/supabase/publico';
import ListaPresentes, { type Presente } from '@/components/presentes/lista-presentes';

export default async function PaginaPresentes({ params }: { params: Promise<{ slug: string }> }) {
  'use cache';
  cacheLife('minutes'); // Faz o cache por alguns minutos

  const { slug } = await params;

  // Uma única consulta traz a lista e seus presentes
  const { data: lista } = await supabasePublico()
    .from('listas_presentes')
    .select(
      `titulo, mensagem,
       presentes (id, nome, descricao, imagem_url, tipo, valor_meta, valor_arrecadado, valor_minimo_contribuicao, status)`,
    )
    .eq('slug', slug)
    .order('ordem', { referencedTable: 'presentes' })
    .maybeSingle();

  if (!lista) notFound();

  return (
    <ListaPresentes
      lista={{ titulo: lista.titulo, mensagem: lista.mensagem }}
      presentes={(lista.presentes ?? []) as Presente[]}
      slug={slug}
    />
  );
}