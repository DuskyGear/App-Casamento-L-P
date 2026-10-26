import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FormPresente from '@/components/admin/form-presente';
import { atualizarPresente } from '../actions';

export default async function EditarPresente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from('presentes').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Editar presente</h1>
      <FormPresente
        action={atualizarPresente.bind(null, id)}
        inicial={{
          nome: p.nome,
          descricao: p.descricao,
          imagem_url: p.imagem_url,
          tipo: p.tipo,
          valor_meta: Number(p.valor_meta),
          valor_minimo_contribuicao: Number(p.valor_minimo_contribuicao),
          ordem: p.ordem,
          ativo: p.ativo,
        }}
      />
    </div>
  );
}